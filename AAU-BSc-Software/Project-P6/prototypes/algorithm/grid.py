import numpy as np
import math
from shapely.geometry import Polygon
from flask import Flask, request, jsonify
import logging
import pyproj
from functools import partial
from shapely.ops import transform
from flask_cors import CORS
import datetime
import json
import os
import olympe
from olympe import Anafi
from olympe.messages.ardrone3.Piloting import TakeOff, Landing, moveTo, moveBy
from olympe.messages.ardrone3.PilotingState import FlyingStateChanged, moveToChanged
from olympe.messages.ardrone3.GPSSettingsState import GPSFixStateChanged
from olympe.messages.ardrone3.PilotingState import GpsLocationChanged
from olympe.enums.ardrone3.Piloting import MoveTo_Orientation_mode as orientation_mode
from olympe.enums.ardrone3.PilotingState import MoveToChanged_Status as status
import time
import threading
from flask_socketio import SocketIO, emit
import sys

# Constants
DRONE_IP = "192.168.53.1"

# Set up Flask application with SocketIO
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# Configure logging to minimize Olympe messages
logging.basicConfig(level=logging.INFO)
# Filter out verbose loggers
for logger_name in ['olympe', 'ulog', 'aenum', 'parrot']:
    logging.getLogger(logger_name).setLevel(logging.ERROR)

# Global drone instance
global_drone = None
drone_lock = threading.Lock()
position_monitor_active = False
drone_connection_thread = None

# Shared state for the drone's position and status
drone_state = {
    "connected": False,
    "position": None,  # Will be [lat, lon, altitude]
    "current_waypoint": None,
    "status": "idle",
    "battery": None,
    "has_gps_fix": False
}

# Function to connect to drone and start monitoring
def connect_and_monitor_drone():
    global global_drone, position_monitor_active
    
    with drone_lock:
        try:
            if global_drone is not None:
                try:
                    if global_drone.connection_state():
                        logging.info("Drone already connected")
                        return True
                except Exception:
                    # Connection state check failed, reset the drone object
                    global_drone = None
            
            logging.info("Connecting to drone...")
            global_drone = Anafi(DRONE_IP)
            
            # Connect to the drone with a timeout
            connection_success = False
            try:
                # Increased timeout for better connection reliability
                connection_success = global_drone.connect(timeout=15)
                if not connection_success:
                    logging.error("Failed to connect to drone (timeout)")
                    global_drone = None
                    socketio.emit('drone_status', {
                        'connected': False,
                        'status': "connection_failed",
                        'message': "Failed to connect to drone (timeout)",
                        'timestamp': datetime.datetime.now().isoformat()
                    })
                    return False
            except Exception as e:
                logging.error(f"Error connecting to drone: {str(e)}")
                global_drone = None
                socketio.emit('drone_status', {
                    'connected': False,
                    'status': "error",
                    'message': f"Error connecting to drone: {str(e)}",
                    'timestamp': datetime.datetime.now().isoformat()
                })
                return False
            
            # Add slight delay to ensure connection is stable
            time.sleep(1)
            
            # Update drone state
            drone_state["connected"] = True
            drone_state["status"] = "connected"
            
            # Set up position tracking with proper subscription
            try:
                # Define callback functions correctly
                def on_position_update(event, scheduler):
                    try:
                        if event and hasattr(event, 'args'):
                            # Log raw GPS data for debugging
                            logging.info(f"Raw GPS data: {event.args}")
                            
                            lat = event.args.get("latitude", 0)
                            lon = event.args.get("longitude", 0)
                            alt = event.args.get("altitude", 0)
                            
                            # Only process valid coordinates (ignore 0,0 coordinates)
                            if abs(lat) > 0.001 and abs(lon) > 0.001:
                                position = [lat, lon, alt]
                                
                                drone_state["position"] = position
                                socketio.emit('drone_position', {
                                    'lat': position[0],
                                    'lon': position[1],
                                    'altitude': position[2],
                                    'timestamp': datetime.datetime.now().isoformat()
                                })
                                
                                # Log position update
                                logging.info(f"Position updated: {position}")
                    except Exception as e:
                        logging.error(f"Error in position callback: {str(e)}")

                def on_gps_fix_changed(event, scheduler):
                    try:
                        if event and hasattr(event, 'args'):
                            # Log raw GPS fix state for debugging
                            logging.info(f"Raw GPS fix state: {event.args}")
                            
                            has_fix = bool(event.args.get('fixed', 0))
                            old_fix = drone_state["has_gps_fix"]
                            
                            if has_fix != old_fix:
                                drone_state["has_gps_fix"] = has_fix
                                socketio.emit('drone_gps_status', {
                                    'has_gps_fix': has_fix,
                                    'position': drone_state["position"],
                                    'timestamp': datetime.datetime.now().isoformat()
                                })
                                
                                # Log GPS fix state change
                                logging.info(f"GPS fix state changed to: {has_fix}")
                    except Exception as e:
                        logging.error(f"Error in GPS fix callback: {str(e)}")

                # IMPORTANT: Fixed subscription syntax for Olympe
                global_drone.subscribe(GpsLocationChanged, on_position_update)
                global_drone.subscribe(GPSFixStateChanged, on_gps_fix_changed)

                # Force immediate GPS status check
                try:
                    state_dict = global_drone.get_state(GPSFixStateChanged)
                    if state_dict and "fixed" in state_dict:
                        drone_state["has_gps_fix"] = (state_dict["fixed"] == 1)
                        logging.info(f"Initial GPS fix state: {drone_state['has_gps_fix']}")
                    
                    gps_state = global_drone.get_state(GpsLocationChanged)
                    if gps_state and "latitude" in gps_state and "longitude" in gps_state:
                        lat = gps_state.get("latitude", 0)
                        lon = gps_state.get("longitude", 0)
                        alt = gps_state.get("altitude", 0)
                        
                        if abs(lat) > 0.001 and abs(lon) > 0.001:
                            drone_state["position"] = [lat, lon, alt]
                            logging.info(f"Initial position: {drone_state['position']}")
                except Exception as init_err:
                    logging.warning(f"Could not get initial GPS state: {str(init_err)}")

                logging.info("Successfully subscribed to drone updates")
                
            except Exception as e:
                logging.error(f"Error setting up event tracking: {str(e)}")
                # Continue even if event tracking setup fails
            
            # Notify clients
            socketio.emit('drone_status', {
                'connected': True,
                'status': "connected",
                'message': "Connected to drone",
                'timestamp': datetime.datetime.now().isoformat()
            })
            
            # Start position monitoring thread if not already active
            if not position_monitor_active:
                position_monitor_active = True
                position_thread = threading.Thread(target=monitor_drone_position)
                position_thread.daemon = True
                position_thread.start()
                
            logging.info("Successfully connected to drone")
            return True
                
        except Exception as e:
            logging.error(f"Error connecting to drone: {str(e)}")
            socketio.emit('drone_status', {
                'connected': False,
                'status': "error",
                'message': f"Error connecting to drone: {str(e)}",
                'timestamp': datetime.datetime.now().isoformat()
            })
            return False

# Function to continuously monitor drone position and status
def monitor_drone_position():
    global global_drone, position_monitor_active
    
    logging.info("Starting drone position monitor")
    reconnect_attempts = 0
    max_reconnect_attempts = 3
    last_reconnect_time = 0
    
    try:
        while position_monitor_active:
            try:
                with drone_lock:
                    if global_drone is None:
                        drone_state["connected"] = False
                        socketio.emit('drone_status', {
                            'connected': False,
                            'status': "disconnected",
                            'message': "Drone disconnected",
                            'timestamp': datetime.datetime.now().isoformat()
                        })
                        
                        # Attempt to reconnect with backoff strategy
                        current_time = time.time()
                        if reconnect_attempts < max_reconnect_attempts and current_time - last_reconnect_time > 5:
                            logging.info(f"Attempting to reconnect (attempt {reconnect_attempts + 1}/{max_reconnect_attempts})")
                            last_reconnect_time = current_time
                            reconnect_attempts += 1
                            
                            # Release the lock temporarily during connection
                            drone_lock.release()
                            try:
                                connect_and_monitor_drone()
                            finally:
                                drone_lock.acquire()
                        
                        time.sleep(2)  # Avoid rapid reconnection attempts
                        continue
                        
                    # Check connection state with safer handling
                    try:
                        # Verify the connection is still active
                        if not global_drone.connection_state():
                            logging.warning("Drone connection lost")
                            drone_state["connected"] = False
                            socketio.emit('drone_status', {
                                'connected': False,
                                'status': "disconnected",
                                'message': "Drone disconnected",
                                'timestamp': datetime.datetime.now().isoformat()
                            })
                            
                            # Attempt to reconnect immediately on first lost connection
                            current_time = time.time()
                            if reconnect_attempts < max_reconnect_attempts and current_time - last_reconnect_time > 5:
                                logging.info(f"Attempting to reconnect (attempt {reconnect_attempts + 1}/{max_reconnect_attempts})")
                                last_reconnect_time = current_time
                                reconnect_attempts += 1
                                
                                # Release the lock temporarily during connection
                                drone_lock.release()
                                try:
                                    if connect_and_monitor_drone():
                                        reconnect_attempts = 0  # Reset counter on successful reconnection
                                except Exception as reconnect_err:
                                    logging.error(f"Error during reconnection: {str(reconnect_err)}")
                                finally:
                                    drone_lock.acquire()
                            
                            time.sleep(2)  # Avoid rapid reconnection attempts
                            continue
                        else:
                            # Connection is good, reset reconnect counter
                            reconnect_attempts = 0
                        
                    except Exception as conn_err:
                        logging.warning(f"Error checking connection state: {str(conn_err)}")
                        drone_state["connected"] = False
                        socketio.emit('drone_status', {
                            'connected': False,
                            'status': "error",
                            'message': "Error checking drone connection",
                            'timestamp': datetime.datetime.now().isoformat()
                        })
                        time.sleep(2)
                        continue
                        
                    # Check GPS fix status with better exception handling
                    try:
                        # Safely get GPS state - avoid use of uninitialized states
                        old_fix = drone_state["has_gps_fix"]
                        
                        # Be more defensive when checking state
                        state_dict = None
                        try:
                            state_dict = global_drone.get_state(GPSFixStateChanged)
                            
                            # Debug logging for GPS fix state
                            logging.info(f"GPS Fix State: {state_dict}")
                        except Exception as gps_err:
                            logging.warning(f"Error getting GPS state: {str(gps_err)}")
                            # State might be uninitialized, which is normal
                            pass
                            
                        if state_dict and "fixed" in state_dict:
                            drone_state["has_gps_fix"] = (state_dict["fixed"] == 1)
                            
                            # Only emit if GPS fix status changed or we have position
                            if old_fix != drone_state["has_gps_fix"] or drone_state["position"] is not None:
                                socketio.emit('drone_gps_status', {
                                    'has_gps_fix': drone_state["has_gps_fix"],
                                    'position': drone_state["position"],
                                    'timestamp': datetime.datetime.now().isoformat()
                                })
                                
                                # Log GPS fix status change
                                if old_fix != drone_state["has_gps_fix"]:
                                    logging.info(f"GPS fix status changed: {drone_state['has_gps_fix']}")
                        
                        # Also check the GPS position directly - sometimes this updates separately
                        try:
                            gps_state = global_drone.get_state(GpsLocationChanged)
                            if gps_state and "latitude" in gps_state and "longitude" in gps_state:
                                # Check if values are non-zero and valid
                                lat = gps_state.get("latitude", 0)
                                lon = gps_state.get("longitude", 0)
                                alt = gps_state.get("altitude", 0)
                                
                                # Log position data for debugging
                                logging.info(f"GPS Position: lat={lat}, lon={lon}, alt={alt}")
                                
                                if abs(lat) > 0.001 and abs(lon) > 0.001:  # Filter out 0,0 positions
                                    position = [lat, lon, alt]
                                    old_position = drone_state["position"]
                                    
                                    # Only update and emit if position has changed significantly
                                    if old_position is None or (
                                        abs(position[0] - old_position[0]) > 0.0000001 or
                                        abs(position[1] - old_position[1]) > 0.0000001
                                    ):
                                        drone_state["position"] = position
                                        
                                        # Emit position to websocket clients
                                        socketio.emit('drone_position', {
                                            'lat': position[0],
                                            'lon': position[1],
                                            'altitude': position[2],
                                            'timestamp': datetime.datetime.now().isoformat()
                                        })
                                        
                                        # If we have a position, it's likely we have GPS
                                        if not drone_state["has_gps_fix"] and abs(lat) > 0.001:
                                            drone_state["has_gps_fix"] = True
                                            socketio.emit('drone_gps_status', {
                                                'has_gps_fix': True,
                                                'position': position,
                                                'timestamp': datetime.datetime.now().isoformat()
                                            })
                                            logging.info("GPS fix inferred from valid position data")
                        except Exception as pos_err:
                            # This is expected sometimes if no position is available yet
                            pass
                        
                    except Exception as e:
                        logging.warning(f"Error checking GPS status: {str(e)}")
                        
                    # Send periodic heartbeat to confirm drone connection status
                    # Include all drone state info in the heartbeat for better frontend sync
                    socketio.emit('drone_status', {
                        'connected': drone_state["connected"],
                        'status': drone_state["status"],
                        'has_gps_fix': drone_state["has_gps_fix"],
                        'position': drone_state["position"],
                        'timestamp': datetime.datetime.now().isoformat()
                    })
                    
            except Exception as outer_e:
                logging.error(f"Error in position monitor thread main loop: {str(outer_e)}")
                    
            # Use a shorter polling interval for better responsiveness
            time.sleep(0.5)
    
    except Exception as e:
        logging.error(f"Error in position monitor thread: {str(e)}")
    finally:
        position_monitor_active = False
        logging.info("Drone position monitor stopped")

# Helper functions from existing code
def create_local_projection(center_lat, center_lon):
    """Create a local projection centered at a specific latitude/longitude"""
    # Create a projection string for a Transverse Mercator projection centered at the given coordinates
    proj_str = f"+proj=tmerc +lat_0={center_lat} +lon_0={center_lon} +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs"
    local_proj = pyproj.Proj(proj_str)
    wgs84 = pyproj.Proj(init='epsg:4326')  # WGS84 coordinate system (lat/lon)
    
    # Create coordinate transformer functions
    to_local = partial(pyproj.transform, wgs84, local_proj)
    to_wgs84 = partial(pyproj.transform, local_proj, wgs84)
    
    return to_local, to_wgs84

def calculate_grid_size(altitude, hfov_degrees=84, aspect_ratio=4/3):
    """Calculate the ground footprint dimensions based on altitude and camera specs"""
    if altitude <= 0 or altitude > 40:
        raise ValueError("Altitude must be between 0 and 40 meters")
    
    # Convert FOV from degrees to radians
    hfov_radians = math.radians(hfov_degrees)
    
    # Calculate width of the footprint
    width = 2 * altitude * math.tan(hfov_radians / 2)
    
    # Calculate height based on aspect ratio
    height = width / aspect_ratio
    
    return width, height

def calculate_grid_placement(coordinates, altitude, overlap_percent, coverage):
    """Calculate optimal grid placement with improved efficiency"""
    if len(coordinates) < 3:
        raise ValueError("At least 3 coordinates are required")
    
    if not (0 <= overlap_percent <= 100):
        raise ValueError("Overlap percentage must be between 0 and 100")
    
    # Calculate center of the area to create local projection
    lats = [coord[0] for coord in coordinates]
    lons = [coord[1] for coord in coordinates]
    center_lat = sum(lats) / len(lats)
    center_lon = sum(lons) / len(lons)
    
    # Create local projection
    to_local, to_wgs84 = create_local_projection(center_lat, center_lon)
    
    # Transform geographic coordinates to local projection
    local_coords = [to_local(lon, lat) for lat, lon in coordinates]
    
    # Create polygon from local coordinates
    polygon = Polygon(local_coords)
    
    # Get bounding box
    minx, miny, maxx, maxy = polygon.bounds
    
    # Calculate grid size based on altitude
    grid_width, grid_height = calculate_grid_size(altitude)
    
    # Calculate step size with overlap
    step_x = grid_width * (1 - overlap_percent / 100)
    step_y = grid_height * (1 - overlap_percent / 100)
    
    # Calculate grid numbers
    num_x = math.ceil((maxx - minx) / step_x)
    num_y = math.ceil((maxy - miny) / step_y)
    
    # Generate candidate grids
    candidate_grids = []
    min_coverage_threshold = coverage
    
    for i in range(num_y):
        for j in range(num_x):
            center_x = minx + j * step_x + grid_width / 2
            center_y = miny + i * step_y + grid_width / 2
            
            local_corners = [
                (center_x - grid_width / 2, center_y - grid_height / 2),
                (center_x + grid_width / 2, center_y - grid_height / 2),
                (center_x + grid_width / 2, center_y + grid_height / 2),
                (center_x - grid_width / 2, center_y + grid_height / 2)
            ]
            
            grid_polygon = Polygon(local_corners)
            
            # Calculate intersection and coverage
            if polygon.intersects(grid_polygon):
                intersection = polygon.intersection(grid_polygon)
                intersection_area = intersection.area
                grid_area = grid_polygon.area
                coverage = intersection_area / grid_area
                
                # Only include grids with significant coverage
                if coverage >= min_coverage_threshold:
                    candidate_grids.append({
                        "center_local": (center_x, center_y),
                        "corners_local": local_corners,
                        "grid_polygon": grid_polygon,
                        "intersection_area": intersection_area,
                        "coverage": coverage
                    })
    
    # Sort candidates by coverage
    candidate_grids.sort(key=lambda x: x["coverage"], reverse=True)
    
    # Greedy algorithm to select grids that maximize coverage
    selected_grids = []
    covered_area = Polygon()  # Start with empty coverage
    
    # First pass: Add grids with high coverage
    for grid in candidate_grids:
        if grid["coverage"] > 0.6:  # Automatically include grids with >60% coverage
            selected_grids.append(grid)
            covered_area = covered_area.union(grid["grid_polygon"].intersection(polygon))
    
    # Second pass: Add grids that cover significant uncovered area
    for grid in candidate_grids:
        if grid not in selected_grids:
            # Calculate how much new area this grid would cover
            intersection = grid["grid_polygon"].intersection(polygon)
            new_area = intersection.difference(covered_area)
            
            if new_area.area > coverage * grid_width * grid_height:
                selected_grids.append(grid)
                covered_area = covered_area.union(intersection)
    
    # Convert selected grids to geographic coordinates
    grid_data = []
    for grid in selected_grids:
        center_x, center_y = grid["center_local"]
        geo_center = to_wgs84(center_x, center_y)
        geo_corners = [to_wgs84(x, y) for x, y in grid["corners_local"]]
        
        grid_data.append({
            "center": (geo_center[1], geo_center[0]),
            "corners": [(corner[1], corner[0]) for corner in geo_corners],
            "coverage": grid["coverage"]
        })
    
    return grid_data

def calculate_turn_cost(prev_direction, new_direction):
    """Calculate the cost of making a turn based on the angle"""
    if not prev_direction or not new_direction:
        return 0
        
    # Calculate the angle between two directions in degrees
    angle = math.degrees(math.acos(
        min(1.0, max(-1.0, 
            (prev_direction[0] * new_direction[0] + prev_direction[1] * new_direction[1]) / 
            (math.sqrt(prev_direction[0]**2 + prev_direction[1]**2) * 
             math.sqrt(new_direction[0]**2 + new_direction[1]**2))
        ))
    ))
    
    # Penalize turns proportionally to their angle
    return angle / 180.0

def improve_solution_with_lk(points, initial_tour, distances):
    """Improve tour using Lin-Kernighan heuristic"""
    n = len(points)
    best_tour = initial_tour.copy()
    best_distance = calculate_tour_distance(best_tour, distances)
    improved = True
    
    while improved:
        improved = False
        for i in range(n-2):
            for j in range(i+2, n):
                # Try 2-opt move
                new_tour = best_tour[:i+1] + list(reversed(best_tour[i+1:j+1])) + best_tour[j+1:]
                new_distance = calculate_tour_distance(new_tour, distances)
                
                if new_distance < best_distance:
                    best_tour = new_tour
                    best_distance = new_distance
                    improved = True
                    break
            if improved:
                break
            
            # Try 3-opt move if 2-opt didn't improve
            if not improved and j < n-1:
                for k in range(j+2, n):
                    # Try all possible 3-opt combinations
                    segments = [best_tour[:i+1], best_tour[i+1:j+1], best_tour[j+1:k+1], best_tour[k+1:]]
                    for seg1 in [segments[1], list(reversed(segments[1]))]:
                        for seg2 in [segments[2], list(reversed(segments[2]))]:
                            new_tour = segments[0] + seg1 + seg2 + segments[3]
                            new_distance = calculate_tour_distance(new_tour, distances)
                            
                            if new_distance < best_distance:
                                best_tour = new_tour
                                best_distance = new_distance
                                improved = True
                                break
                        if improved:
                            break
                    if improved:
                        break
            if improved:
                break
    
    return best_tour

def calculate_tour_distance(tour, distances):
    """Calculate total tour distance"""
    total = 0
    for i in range(len(tour) - 1):
        total += distances[tour[i]][tour[i+1]]
    total += distances[tour[-1]][tour[0]]  # Return to start
    return total

def optimize_tsp_path(grid_data, start_point=None):
    """Enhanced TSP solver using nearest neighbor + Lin-Kernighan improvement"""
    if len(grid_data) <= 1:
        return grid_data, [], {}

    # Extract centers
    centers = [grid["center"] for grid in grid_data]
    n = len(centers)

    # Create distance matrix
    distances = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                lat1, lon1 = centers[i]
                lat2, lon2 = centers[j]
                
                # Convert to radians
                lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
                
                # Haversine formula
                dlon = lon2 - lon1
                dlat = lat2 - lat1
                a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
                c = 2 * math.asin(math.sqrt(a))
                distances[i][j] = 6371000 * c  # in meters

    # Find start index if start point provided
    start_idx = 0
    if start_point:
        min_dist = float('inf')
        for i, center in enumerate(centers):
            lat1, lon1 = start_point
            lat2, lon2 = center
            lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
            dlon = lon2 - lon1
            dlat = lat2 - lat1
            a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
            c = 2 * math.asin(math.sqrt(a))
            distance = 6371000 * c
            if distance < min_dist:
                min_dist = distance
                start_idx = i

    # Generate initial solution using nearest neighbor
    current = start_idx
    unvisited = set(range(n))
    unvisited.remove(current)
    tour = [current]
    
    while unvisited:
        next_idx = min(unvisited, key=lambda x: distances[current][x])
        tour.append(next_idx)
        unvisited.remove(next_idx)
        current = next_idx

    # Improve solution using Lin-Kernighan heuristic
    improved_tour = improve_solution_with_lk(centers, tour, distances)

    # Create output
    waypoints = []
    optimized_grid_data = []

    # Add start point if provided
    if start_point:
        waypoints.append({
            "lat": start_point[0],
            "lon": start_point[1],
            "type": "start_end",
            "order": 0
        })

    # Add path waypoints
    for i, idx in enumerate(improved_tour):
        grid = grid_data[idx]
        waypoints.append({
            "lat": grid["center"][0],
            "lon": grid["center"][1],
            "type": "grid_center",
            "grid_id": idx,
            "order": i + (1 if start_point else 0)
        })
        optimized_grid_data.append(grid)

    # Add end point (return to start)
    if start_point:
        waypoints.append({
            "lat": start_point[0],
            "lon": start_point[1],
            "type": "start_end",
            "order": len(waypoints)
        })
    else:
        # Return to first grid if no start point
        first_grid = grid_data[improved_tour[0]]
        waypoints.append({
            "lat": first_grid["center"][0],
            "lon": first_grid["center"][1],
            "type": "grid_center",
            "grid_id": improved_tour[0],
            "order": len(waypoints)
        })

    # Calculate path metrics
    total_distance = 0
    for i in range(len(waypoints) - 1):
        lat1, lon1 = waypoints[i]["lat"], waypoints[i]["lon"]
        lat2, lon2 = waypoints[i + 1]["lat"], waypoints[i + 1]["lon"]
        
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        segment_distance = 6371000 * c
        total_distance += segment_distance

    path_metrics = {
        "total_distance": total_distance,
        "grid_count": len(optimized_grid_data),
        "estimated_flight_time": total_distance / 5.0  # assuming 5 m/s speed
    }

    return optimized_grid_data, waypoints, path_metrics

def save_to_gpx(waypoints, altitude, filename=None):
    """
    Save waypoints to a GPX file format
    
    Args:
        waypoints: List of waypoint dictionaries
        altitude: Flight altitude in meters
        filename: Optional custom filename
    """
    if filename is None:
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"mission_{timestamp}.gpx"
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    filepath = os.path.join(current_dir, filename)
    
    # Create GPX format
    gpx_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Flight Planner" xmlns="http://www.topografix.com/GPX/1/1">
    <metadata>
        <name>Drone Flight Path</name>
        <time>{datetime.datetime.now().isoformat()}</time>
    </metadata>
    <rte>
        <name>Flight Path</name>
"""
    
    # Add waypoints
    for wp in waypoints:
        action = "photo" if wp["type"] == "grid_center" else "move"
        gpx_content += f"""        <rtept lat="{wp['lat']}" lon="{wp['lon']}">
            <ele>{altitude}</ele>
            <name>WP-{wp.get('order', 0)}</name>
            <desc>{action}</desc>
        </rtept>\n"""
    
    # Close GPX file
    gpx_content += """    </rte>
</gpx>"""
    
    # Save to file
    with open(filepath, 'w') as f:
        f.write(gpx_content)
    
    logging.info(f"Saved GPX file to: {filepath}")
    return filepath

def execute_flight_plan(waypoints, altitude):
    """Execute flight plan using the Anafi drone commands - Fixed implementation"""
    global global_drone
    
    with drone_lock:
        if global_drone is None:
            return {"success": False, "error": "Drone not connected"}
    
    execution_log = []
    success = False
    
    try:
        logging.info("Starting flight execution...")
        
        # Report flight start - Use flight_status event name to match frontend expectations
        socketio.emit('flight_status', {
            'status': 'starting',
            'message': 'Flight execution starting',
            'timestamp': datetime.datetime.now().isoformat()
        })
        
        execution_log.append({
            "action": "connect", 
            "timestamp": datetime.datetime.now().isoformat()
        })
        
        # Verify GPS fix is available
        if not drone_state["has_gps_fix"]:
            logging.info("Waiting for GPS fix...")
            execution_log.append({
                "action": "gps_fix_wait", 
                "timestamp": datetime.datetime.now().isoformat()
            })
            
            socketio.emit('flight_status', {
                'status': 'gps_fix_wait',
                'message': 'Waiting for GPS fix',
                'timestamp': datetime.datetime.now().isoformat()
            })
            
            # Try to wait for GPS fix with timeout
            gps_wait_start = time.time()
            gps_wait_timeout = 30  # seconds
            gps_fix_obtained = False
            
            # Wait for GPS fix to be available
            while time.time() - gps_wait_start < gps_wait_timeout:
                try:
                    # Check if we have GPS fix now
                    fix_state = global_drone.get_state(GPSFixStateChanged)
                    if fix_state and fix_state.get("fixed", 0) == 1:
                        drone_state["has_gps_fix"] = True
                        gps_fix_obtained = True
                        logging.info("GPS fix obtained")
                        break
                except Exception as e:
                    logging.warning(f"Error checking GPS fix: {str(e)}")
                    
                # Sleep briefly and check again    
                time.sleep(1)
                
            if not gps_fix_obtained:
                error_msg = "Failed to get GPS fix within timeout"
                logging.error(error_msg)
                socketio.emit('flight_status', {
                    'status': 'error',
                    'message': error_msg,
                    'timestamp': datetime.datetime.now().isoformat()
                })
                return {"success": False, "error": error_msg, "execution_log": execution_log}
        
        # Take off using the proper command sequence
        logging.info("Taking off...")
        execution_log.append({
            "action": "takeoff", 
            "timestamp": datetime.datetime.now().isoformat()
        })
        
        socketio.emit('flight_status', {
            'status': 'takeoff',
            'message': 'Taking off',
            'timestamp': datetime.datetime.now().isoformat()
        })
        
        # Update drone state
        drone_state["status"] = "taking_off"
        
        try:
            # FIXED: Use proper olympe command sequence for takeoff
            takeoff_cmd = TakeOff()
            expected_state = FlyingStateChanged(state="hovering", _timeout=5)
            
            # Execute takeoff and wait for hovering state
            takeoff_result = global_drone(takeoff_cmd >> expected_state).wait()
            if not takeoff_result.success():
                raise Exception("Takeoff command failed")
            
            # Brief pause to stabilize
            time.sleep(3)
            
        except Exception as e:
            error_msg = f"Takeoff failed: {str(e)}"
            logging.error(error_msg)
            socketio.emit('flight_status', {
                'status': 'error',
                'message': error_msg,
                'timestamp': datetime.datetime.now().isoformat()
            })
            return {"success": False, "error": error_msg, "execution_log": execution_log}
        
        # Ascend to target altitude
        logging.info(f"Ascending to mission altitude: {altitude}m...")
        execution_log.append({
            "action": "ascend", 
            "altitude": altitude, 
            "timestamp": datetime.datetime.now().isoformat()
        })
        
        socketio.emit('flight_status', {
            'status': 'ascend',
            'message': f'Ascending to {altitude}m',
            'timestamp': datetime.datetime.now().isoformat()
        })
        
        try:
            # FIXED: Proper altitude adjustment using moveBy
            # Calculate altitude adjustment
            current_alt = 0
            if drone_state["position"] and len(drone_state["position"]) > 2:
                current_alt = drone_state["position"][2]
                
            altitude_adjustment = altitude - current_alt
            
            # Only adjust if needed
            if abs(altitude_adjustment) > 0.5:  # More than 0.5m difference
                ascend_cmd = moveBy(0, 0, -altitude_adjustment, 0)  # Negative z is up
                ascend_state = FlyingStateChanged(state="hovering", _timeout=10)
                ascend_result = global_drone(ascend_cmd >> ascend_state).wait()
                
                if not ascend_result.success():
                    logging.warning("Altitude adjustment command didn't complete as expected")
                
                # Brief pause to stabilize
                time.sleep(2)
            
        except Exception as e:
            # Just log a warning but continue the mission
            logging.warning(f"Altitude adjustment warning (continuing anyway): {str(e)}")
        
        # Execute waypoints
        for i, waypoint in enumerate(waypoints):
            lat = waypoint["lat"]
            lon = waypoint["lon"]
            wp_type = waypoint["type"]
            
            logging.info(f"Moving to waypoint {i+1}/{len(waypoints)}: ({lat}, {lon})")
            execution_log.append({
                "action": "move_to_waypoint",
                "waypoint_num": i+1,
                "lat": lat,
                "lon": lon,
                "type": wp_type,
                "timestamp": datetime.datetime.now().isoformat()
            })
            
            # Update drone state
            drone_state["current_waypoint"] = i + 1
            drone_state["status"] = "flying_to_waypoint"
            
            # Emit status update - Format to match frontend expectations
            socketio.emit('flight_status', {
                'status': 'move_to_waypoint',
                'message': f'Moving to waypoint {i+1}/{len(waypoints)}',
                'waypoint': {
                    'number': i+1,
                    'total': len(waypoints),
                    'lat': lat,
                    'lon': lon,
                    'type': wp_type
                },
                'timestamp': datetime.datetime.now().isoformat()
            })
            
            try:
                # FIXED: Proper command sequence for moving to waypoint
                move_cmd = moveTo(
                    latitude=lat,
                    longitude=lon,
                    altitude=altitude,
                    orientation_mode=orientation_mode.TO_TARGET,
                    heading=0.0
                )
                move_done = moveToChanged(status=status.DONE, _timeout=30)
                
                # Execute move command with proper command sequence
                move_result = global_drone(move_cmd >> move_done).wait()
                
                if not move_result.success():
                    # Just log warning but continue to next waypoint
                    logging.warning(f"Move to waypoint {i+1} did not complete successfully, continuing mission")
                    execution_log.append({
                        "action": "waypoint_warning",
                        "waypoint_num": i+1,
                        "message": "Movement did not complete successfully",
                        "timestamp": datetime.datetime.now().isoformat()
                    })
                else:
                    logging.info(f"Successfully reached waypoint {i+1}")
                
                # If this is a grid center point, take a photo or perform other actions
                if wp_type == "grid_center":
                    logging.info(f"At grid center waypoint {i+1}")
                    execution_log.append({
                        "action": "take_photo", 
                        "waypoint_num": i+1,
                        "timestamp": datetime.datetime.now().isoformat()
                    })
                    
                    # Emit take_photo event for frontend
                    socketio.emit('flight_status', {
                        'status': 'take_photo',
                        'message': f'Taking photo at waypoint {i+1}',
                        'waypoint': {'number': i+1},
                        'timestamp': datetime.datetime.now().isoformat()
                    })
                    
                    # Here you would trigger the drone's camera or other actions
                    # For now, just pause briefly
                    time.sleep(1)
                
                # Brief pause between waypoints
                time.sleep(1)
                
            except Exception as waypoint_err:
                # Log the error but continue to next waypoint
                logging.error(f"Error at waypoint {i+1}: {str(waypoint_err)}")
                execution_log.append({
                    "action": "waypoint_error",
                    "waypoint_num": i+1,
                    "error": str(waypoint_err),
                    "timestamp": datetime.datetime.now().isoformat()
                })
                
                # Notify clients
                socketio.emit('flight_status', {
                    'status': 'waypoint_error',
                    'message': f"Error at waypoint {i+1}: {str(waypoint_err)}",
                    'waypoint': {'number': i+1},
                    'timestamp': datetime.datetime.now().isoformat()
                })
                
                # Continue to next waypoint instead of aborting
        
        # Return home and land
        logging.info("Completing mission and landing")
        drone_state["status"] = "returning_home"
        drone_state["current_waypoint"] = None
        
        # Emit status update
        socketio.emit('flight_status', {
            'status': 'return_home',
            'message': 'Returning to home position',
            'timestamp': datetime.datetime.now().isoformat()
        })
        
        execution_log.append({
            "action": "return_home",
            "timestamp": datetime.datetime.now().isoformat()
        })
        
        # Emit landing status
        socketio.emit('flight_status', {
            'status': 'land',
            'message': 'Landing drone',
            'timestamp': datetime.datetime.now().isoformat()
        })
        
        execution_log.append({
            "action": "land",
            "timestamp": datetime.datetime.now().isoformat()
        })
        
        try:
            # FIXED: Proper landing command sequence
            land_cmd = Landing()
            land_state = FlyingStateChanged(state="landed", _timeout=10)
            land_result = global_drone(land_cmd >> land_state).wait()
            
            if not land_result.success():
                logging.warning("Landing command did not complete successfully")
            else:
                logging.info("Landing completed successfully")
                
        except Exception as land_err:
            logging.error(f"Landing error: {str(land_err)}")
            execution_log.append({
                "action": "landing_error",
                "error": str(land_err),
                "timestamp": datetime.datetime.now().isoformat()
            })
            
            # Even if landing fails, we consider the mission itself completed
        
        # Update final state
        drone_state["status"] = "idle"
        success = True
        
        # Final status update - using 'mission_completed' status for frontend
        socketio.emit('flight_status', {
            'status': 'mission_completed',
            'message': 'Mission completed successfully',
            'timestamp': datetime.datetime.now().isoformat()
        })
        
        execution_log.append({
            "action": "complete",
            "success": True,
            "timestamp": datetime.datetime.now().isoformat()
        })
        
        # Emit disconnect event to match expected flow
        socketio.emit('flight_status', {
            'status': 'disconnect',
            'message': 'Flight complete, disconnecting from drone',
            'timestamp': datetime.datetime.now().isoformat()
        })
        
        execution_log.append({
            "action": "disconnect",
            "timestamp": datetime.datetime.now().isoformat()
        })
        
        return {"success": True, "execution_log": execution_log}
        
    except Exception as e:
        error_msg = f"Flight execution error: {str(e)}"
        logging.error(error_msg)
        
        # Try emergency landing
        try:
            drone_state["status"] = "emergency_landing"
            socketio.emit('flight_status', {
                'status': 'error',
                'message': f"Error during flight, emergency landing: {str(e)}",
                'timestamp': datetime.datetime.now().isoformat()
            })
            
            execution_log.append({
                "action": "error",
                "error": str(e),
                "timestamp": datetime.datetime.now().isoformat()
            })
            
            # FIXED: Proper emergency landing
            land_cmd = Landing()
            global_drone(land_cmd).wait()
            
        except Exception as land_err:
            logging.error(f"Emergency landing also failed: {str(land_err)}")
            execution_log.append({
                "action": "emergency_landing_failed",
                "error": str(land_err),
                "timestamp": datetime.datetime.now().isoformat()
            })
        
        # Update state after landing attempt
        drone_state["status"] = "idle"
        socketio.emit('flight_status', {
            'status': 'error',
            'message': error_msg,
            'timestamp': datetime.datetime.now().isoformat()
        })
        
        return {"success": False, "error": error_msg, "execution_log": execution_log}

def execute_flight_and_notify(waypoints, altitude):
    """Execute flight and notify clients of results"""
    try:
        result = execute_flight_plan(waypoints, altitude)
        
        # Format execution log for frontend compatibility
        formatted_logs = []
        for log in result.get("execution_log", []):
            formatted_log = {
                "action": log.get("action", "unknown"),
                "timestamp": log.get("timestamp")
            }
            
            # Add additional fields when present
            if "waypoint_num" in log:
                formatted_log["waypoint_num"] = log["waypoint_num"]
            if "altitude" in log:
                formatted_log["altitude"] = log["altitude"]
            if "error" in log:
                formatted_log["error"] = log["error"]
            if "grid_id" in log:
                formatted_log["grid_id"] = log["grid_id"]
                
            formatted_logs.append(formatted_log)
        
        # This event provides the full execution summary
        socketio.emit('execution_result', {
            'success': result["success"],
            'execution_log': formatted_logs,
            'metadata': {
                'waypoint_count': len(waypoints),
                'altitude': altitude,
                'execution_time': datetime.datetime.now().isoformat()
            }
        })
    except Exception as e:
        logging.error(f"Error in flight execution thread: {str(e)}")
        socketio.emit('execution_error', {
            'error': str(e),
            'timestamp': datetime.datetime.now().isoformat()
        })

# WebSocket endpoints
@socketio.on('connect')
def handle_connect():
    """Handle client connection to the websocket"""
    logging.info('Client connected to websocket')
    
    # Start the drone connection in a separate thread to avoid blocking
    global drone_connection_thread
    if drone_connection_thread is None or not drone_connection_thread.is_alive():
        drone_connection_thread = threading.Thread(target=connect_and_monitor_drone)
        drone_connection_thread.daemon = True
        drone_connection_thread.start()
    
    # Send current drone state to the newly connected client
    emit('drone_status', {
        'connected': drone_state["connected"],
        'position': drone_state["position"],
        'status': drone_state["status"],
        'has_gps_fix': drone_state["has_gps_fix"],
        'timestamp': datetime.datetime.now().isoformat()
    })
    
    # If we have position data, send it separately
    if drone_state["position"]:
        emit('drone_position', {
            'lat': drone_state["position"][0],
            'lon': drone_state["position"][1],
            'altitude': drone_state["position"][2],
            'has_gps_fix': drone_state["has_gps_fix"],
            'timestamp': datetime.datetime.now().isoformat()
        })

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection from the websocket"""
    logging.info('Client disconnected from websocket')

@socketio.on('connect_drone')
def handle_connect_drone():
    """Handle request to connect to drone"""
    success = connect_and_monitor_drone()
    emit('drone_connection_result', {
        'success': success,
        'timestamp': datetime.datetime.now().isoformat()
    })

@socketio.on('calculate_grid')
def handle_calculate_grid(data):
    """Handle WebSocket request to calculate grid placement"""
    try:
        coordinates = data.get('coordinates')
        altitude = float(data.get('altitude'))
        overlap = float(data.get('overlap'))
        coverage = (1 - float(data.get('coverage'))) / 100
        
        # Use current drone position as start point if available
        start_point = None
        if drone_state["position"]:
            start_point = [drone_state["position"][0], drone_state["position"][1]]
        
        # Validate inputs
        if not coordinates or len(coordinates) < 3:
            emit('calculation_error', {
                'error': "At least 3 coordinates are required",
                'timestamp': datetime.datetime.now().isoformat()
            })
            return
        
        if altitude <= 0 or altitude > 40:
            emit('calculation_error', {
                'error': "Altitude must be between 0 and 40 meters",
                'timestamp': datetime.datetime.now().isoformat()
            })
            return
        
        if not (0 <= overlap <= 100):
            emit('calculation_error', {
                'error': "Overlap percentage must be between 0 and 100",
                'timestamp': datetime.datetime.now().isoformat()
            })
            return
        
        # Calculate grid placement
        emit('calculation_status', {
            'status': 'calculating',
            'message': 'Calculating grid layout...',
            'timestamp': datetime.datetime.now().isoformat()
        })
        
        grid_data = calculate_grid_placement(coordinates, altitude, overlap, coverage)
        
        # Use true TSP optimization
        optimized_grid_data, waypoints, path_metrics = optimize_tsp_path(grid_data, start_point)

        # Save to GPX file
        gpx_filepath = save_to_gpx(waypoints, altitude)
        
        # Prepare response data
        response = {
            "grid_count": len(optimized_grid_data),
            "grids": [{
                "center": {"lat": grid["center"][0], "lon": grid["center"][1]},
                "corners": [{"lat": corner[0], "lon": corner[1]} for corner in grid["corners"]]
            } for grid in optimized_grid_data],
            "path": waypoints,
            "path_metrics": path_metrics,
            "metadata": {
                "altitude": altitude,
                "overlap_percent": overlap,
                "start_point": start_point,
                "created_at": datetime.datetime.now().isoformat(),
                "gpx_file": os.path.basename(gpx_filepath)
            }
        }
        
        logging.info(f"Generated grid calculation with {len(optimized_grid_data)} grids")
        
        # Send result to client
        emit('calculation_result', response)
        
    except Exception as e:
        logging.error(f"Error calculating grid: {str(e)}")
        emit('calculation_error', {
            'error': str(e),
            'timestamp': datetime.datetime.now().isoformat()
        })

@socketio.on('execute_flight')
def handle_execute_flight(data):
    """Handle WebSocket request to execute flight"""
    try:
        # Get waypoints and altitude from request
        waypoints = data.get('waypoints')
        altitude = float(data.get('altitude'))
        
        # Validate inputs
        if not waypoints or len(waypoints) < 2:
            emit('execution_error', {
                'error': "At least 2 waypoints are required",
                'timestamp': datetime.datetime.now().isoformat()
            })
            return
        
        if altitude <= 0 or altitude > 40:
            emit('execution_error', {
                'error': "Altitude must be between 0 and 40 meters",
                'timestamp': datetime.datetime.now().isoformat()
            })
            return
        
        # Verify drone is connected
        if not drone_state["connected"]:
            emit('execution_error', {
                'error': "Drone is not connected",
                'timestamp': datetime.datetime.now().isoformat()
            })
            return
        
        # Verify drone has GPS fix - make this optional with a warning
        if not drone_state["has_gps_fix"]:
            emit('execution_warning', {
                'warning': "Drone does not have GPS fix yet - will wait for fix during execution",
                'timestamp': datetime.datetime.now().isoformat()
            })
        
        # Execute the flight plan in a separate thread
        flight_thread = threading.Thread(
            target=lambda: execute_flight_and_notify(waypoints, altitude)
        )
        flight_thread.daemon = True
        flight_thread.start()
        
        emit('execution_started', {
            'message': "Flight execution started",
            'timestamp': datetime.datetime.now().isoformat()
        })
        
    except Exception as e:
        logging.error(f"Error processing flight request: {str(e)}")
        emit('execution_error', {
            'error': str(e),
            'timestamp': datetime.datetime.now().isoformat()
        })

@socketio.on('get_drone_position')
def handle_get_drone_position():
    """Handle request for current drone position"""
    emit('drone_position', {
        'lat': drone_state["position"][0] if drone_state["position"] else None,
        'lon': drone_state["position"][1] if drone_state["position"] else None,
        'altitude': drone_state["position"][2] if drone_state["position"] else None,
        'has_gps_fix': drone_state["has_gps_fix"],
        'timestamp': datetime.datetime.now().isoformat()
    })

@socketio.on('get_drone_status')
def handle_get_drone_status():
    """Handle request for current drone status"""
    emit('drone_status', {
        'connected': drone_state["connected"],
        'position': drone_state["position"],
        'current_waypoint': drone_state["current_waypoint"],
        'status': drone_state["status"],
        'has_gps_fix': drone_state["has_gps_fix"],
        'timestamp': datetime.datetime.now().isoformat()
    })

# Clean up resources on shutdown
def cleanup():
    global global_drone, position_monitor_active
    
    logging.info("Cleaning up resources...")
    
    # Stop position monitoring
    position_monitor_active = False
    
    # Sleep briefly to allow threads to notice the flag change
    time.sleep(0.5)
    
    # Safely disconnect from drone with timeout
    try:
        with drone_lock:
            if global_drone and global_drone.connection_state():
                try:
                    # Try to land if the drone is flying
                    current_state = global_drone.get_state(FlyingStateChanged)
                    if current_state and current_state.get("state") in ["takingoff", "hovering", "flying"]:
                        logging.info("Attempting emergency landing before disconnect")
                        landing_future = global_drone(Landing())
                        landing_future.result(timeout=5)  # Short timeout for emergency situations
                except Exception as e:
                    logging.error(f"Error during emergency landing: {str(e)}")
                
                try:
                    # Disconnect with timeout to avoid hanging
                    disconnect_timeout = threading.Timer(5.0, lambda: None)
                    disconnect_timeout.start()
                    global_drone.disconnect()
                    disconnect_timeout.cancel()
                    logging.info("Disconnected from drone")
                except Exception as e:
                    logging.error(f"Error disconnecting from drone: {str(e)}")
                
                # Force reset of drone object
                global_drone = None
    except Exception as e:
        logging.error(f"Error during cleanup: {str(e)}")
    
    logging.info("Cleanup complete")

# Register cleanup function to run at program exit with better signal handling
import atexit
import signal

def signal_handler(sig, frame):
    logging.info(f"Received signal {sig}, initiating shutdown...")
    cleanup()
    sys.exit(0)

# Register signal handlers for graceful shutdown
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# Also register normal atexit handler as backup
atexit.register(cleanup)

# Start the Flask server with improved shutdown handling
if __name__ == '__main__':
    try:
        socketio.run(app, host='0.0.0.0', port=5000, debug=False)
    except KeyboardInterrupt:
        logging.info("Server shutdown requested via KeyboardInterrupt")
        # Don't call cleanup here - it will be called by the signal handler
    except Exception as e:
        logging.error(f"Error in main thread: {str(e)}")
        cleanup()
