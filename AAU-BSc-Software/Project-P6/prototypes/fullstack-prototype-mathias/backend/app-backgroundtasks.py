#!/usr/bin/env python3

# Remove Flask import (not needed)
# from flask import Flask, request
# Replace Flask-SocketIO with the standard python-socketio server
import socketio
import olympe
import time
import math
import numpy as np
from olympe.messages.ardrone3.PilotingState import PositionChanged, FlyingStateChanged, moveToChanged, MotionState
from olympe.messages.ardrone3.Piloting import TakeOff, Landing, moveTo, moveBy
from olympe.messages.ardrone3.GPSSettingsState import GPSFixStateChanged
from olympe.enums.ardrone3.Piloting import MoveTo_Orientation_mode
from olympe.enums.ardrone3.PilotingState import MoveToChanged_Status
from shapely.geometry import Polygon
import datetime
import logging
import os
import sys
import threading
import eventlet
import eventlet.green.threading as green_threading
from olympe.messages.common.CommonState import BatteryStateChanged

# Configure logging
logging.basicConfig(level=logging.INFO)

# Constants
DRONE_IP = "192.168.53.1"  # Default Anafi IP
DEFAULT_PORT = 5000
DEFAULT_HOST = "0.0.0.0"

# Remove Flask app and Flask-SocketIO setup
# app = Flask(__name__)
# app.config['SECRET_KEY'] = 'drone-control-backend-v3'
# socketio = SocketIO(app, cors_allowed_origins="*")

# Use python-socketio's standard server
sio = socketio.Server(cors_allowed_origins="*")

# Remove werkzeug and simple_app, use only socketio.WSGIApp
application = socketio.WSGIApp(sio)

# Global state
drone = None
drone_connected = False
gps_fix_established = False
DRONE_READY = False  # New variable to indicate if drone is ready
gps_data = {
    "latitude": 0,
    "longitude": 0,
    "altitude": 0
}
drone_motion_state = "unknown"  # Can be "moving", "steady", or "unknown"

background_thread = None  # Will hold the background task thread

#############################
# Geo Utils Functions
#############################

def create_local_projection(center_lat, center_lon):
    """Create a local projection for converting between geographic and local coordinates"""
    # Conversion factors
    earth_radius = 6371000  # in meters
    lat_to_m = 111320  # approximate meters per degree of latitude
    
    # Calculate longitude conversion factor at given latitude
    lon_to_m = 111320 * math.cos(math.radians(center_lat))
    
    # Convert to local coordinates (meters)
    def to_local(lon, lat):
        x = (lon - center_lon) * lon_to_m
        y = (lat - center_lat) * lat_to_m
        return (x, y)
    
    # Convert back to geographic coordinates
    def to_wgs84(x, y):
        lon = center_lon + (x / lon_to_m)
        lat = center_lat + (y / lat_to_m)
        return (lon, lat)
    
    return to_local, to_wgs84

def calculate_grid_size(altitude):
    """Calculate the grid size based on the altitude and camera parameters"""
    # Camera parameters for Anafi drone (adjust based on your specific drone)
    horizontal_fov = math.radians(69)  # horizontal field of view in radians
    vertical_fov = math.radians(49)    # vertical field of view in radians
    
    # Calculate ground footprint
    width = 2 * altitude * math.tan(horizontal_fov / 2)
    height = 2 * altitude * math.tan(vertical_fov / 2)
    
    return width, height

#############################
# Grid Calculator Functions
#############################

def calculate_grid_plan(coordinates, altitude, overlap, coverage, start_point=None):
    """Main function to calculate grid and flight path"""
    # Convert coverage to internal format
    coverage = (1 - coverage) / 100
    
    # Validate inputs
    if not coordinates or len(coordinates) < 3:
        raise ValueError("At least 3 coordinates are required")
    if altitude <= 0 or altitude > 40:
        raise ValueError("Altitude must be between 0 and 40 meters")
    if not (0 <= overlap <= 100):
        raise ValueError("Overlap percentage must be between 0 and 100")

    # Calculate grid placement
    grid_data = calculate_grid_placement(coordinates, altitude, overlap, coverage)
    
    # Optimize path
    optimized_grid_data, waypoints, path_metrics = optimize_tsp_path(grid_data, start_point)

    
    return {
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
        }
    }

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
            center_y = miny + i * step_y + grid_height / 2
            
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
    
    # Convert selected grids to geographic coordinates
    grid_data = []
    for grid in candidate_grids:
        center_x, center_y = grid["center_local"]
        geo_center = to_wgs84(center_x, center_y)
        geo_corners = [to_wgs84(x, y) for x, y in grid["corners_local"]]
        
        grid_data.append({
            "center": (geo_center[1], geo_center[0]),
            "corners": [(corner[1], corner[0]) for corner in geo_corners],
            "coverage": grid["coverage"]
        })
    
    return grid_data

#############################
# Path Optimizer Functions
#############################

def optimize_tsp_path(grid_data, start_point=None):
    """Enhanced TSP solver using nearest neighbor + Lin-Kernighan improvement"""
    if len(grid_data) <= 1:
        return grid_data, [], {}

    centers = [grid["center"] for grid in grid_data]
    n = len(centers)

    # Create distance matrix
    distances = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                lat1, lon1 = centers[i]
                lat2, lon2 = centers[j]
                lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
                dlon = lon2 - lon1
                dlat = lat2 - lat1
                a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
                c = 2 * math.asin(math.sqrt(a))
                distances[i][j] = 6371000 * c

    # Find start index
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

    # Generate initial solution
    current = start_idx
    unvisited = set(range(n))
    unvisited.remove(current)
    tour = [current]
    
    while unvisited:
        next_idx = min(unvisited, key=lambda x: distances[current][x])
        tour.append(next_idx)
        unvisited.remove(next_idx)
        current = next_idx

    # Improve solution
    improved_tour = improve_solution_with_lk(centers, tour, distances)

    # Create output
    optimized_grid_data = [grid_data[i] for i in improved_tour]
    waypoints = []
    
    if start_point:
        waypoints.append({
            "lat": start_point[0],
            "lon": start_point[1],
            "type": "start_end",
            "order": 0
        })

    for i, idx in enumerate(improved_tour):
        grid = grid_data[idx]
        waypoints.append({
            "lat": grid["center"][0],
            "lon": grid["center"][1],
            "type": "grid_center",
            "grid_id": idx,
            "order": i + (1 if start_point else 0)
        })

    if start_point:
        waypoints.append({
            "lat": start_point[0],
            "lon": start_point[1],
            "type": "start_end",
            "order": len(waypoints)
        })

    # Calculate metrics
    total_distance = calculate_tour_distance(improved_tour, distances)
    path_metrics = {
        "total_distance": total_distance,
        "grid_count": len(optimized_grid_data),
        "estimated_flight_time": total_distance / 5.0
    }

    return optimized_grid_data, waypoints, path_metrics

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
                new_tour = best_tour[:i+1] + list(reversed(best_tour[i+1:j+1])) + best_tour[j+1:]
                new_distance = calculate_tour_distance(new_tour, distances)
                
                if new_distance < best_distance:
                    best_tour = new_tour
                    best_distance = new_distance
                    improved = True
                    break
            if improved:
                break
    
    return best_tour

def calculate_tour_distance(tour, distances):
    """Calculate total tour distance"""
    total = 0
    for i in range(len(tour) - 1):
        total += distances[tour[i]][tour[i+1]]
    total += distances[tour[-1]][tour[0]]
    return total

#############################
# Flight Executor Functions
#############################

def execute_flight_plan(waypoints, altitude, flight_mode="stable"):
    """
    Execute flight plan with the drone
    
    Args:
        waypoints: List of waypoints to visit
        altitude: Flight altitude in meters
        flight_mode: "stable" (stops at each waypoint) or "rapid" (continuous flight)
    """
    if flight_mode == "rapid":
        return execute_rapid_flight_plan(waypoints, altitude)
    else:
        return execute_stable_flight_plan(waypoints, altitude)

def execute_stable_flight_plan(waypoints, altitude):
    """Execute flight plan with the drone in stable mode (stops at each waypoint)"""
    global drone
    execution_log = []
    success = False
    
    try:
        if not drone or not drone_connected:
            raise ValueError("Drone is not connected")

        logging.info("Starting stable flight plan execution...")
        execution_log.append({"action": "start_mission", "timestamp": datetime.datetime.now().isoformat()})
        
        # Take off
        logging.info("Taking off...")
        execution_log.append({"action": "takeoff", "timestamp": datetime.datetime.now().isoformat()})
        drone(
            TakeOff()
            >> FlyingStateChanged(state="hovering", _timeout=5)
        ).wait().success()

        # Move to target altitude
        logging.info(f"Ascending to mission altitude: {altitude}m...")
        execution_log.append({"action": "ascend", "altitude": altitude, "timestamp": datetime.datetime.now().isoformat()})
        drone(
            moveBy(0, 0, -altitude, 0)  # Negative z is upward
            >> FlyingStateChanged(state="hovering", _timeout=10)
        ).wait().success()
        
        # Execute waypoint navigation
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
            
            # Move to the waypoint
            drone(
                moveTo(lat, lon, altitude, MoveTo_Orientation_mode.TO_TARGET, 0.0)
                >> moveToChanged(status=MoveToChanged_Status.DONE, _timeout=30)
            ).wait().success()
            
            # If this is a grid center point, take a photo
            if wp_type == "grid_center":
                logging.info(f"Taking photo at waypoint {i+1}")
                execution_log.append({
                    "action": "take_photo", 
                    "waypoint_num": i+1,
                    "timestamp": datetime.datetime.now().isoformat()
                })
                time.sleep(1)
        
        # Return to home and land
        logging.info("Returning to starting point...")
        execution_log.append({"action": "return_home", "timestamp": datetime.datetime.now().isoformat()})
        
        logging.info("Landing...")
        execution_log.append({"action": "land", "timestamp": datetime.datetime.now().isoformat()})
        drone(
            Landing()
            >> FlyingStateChanged(state="landed", _timeout=10)
        ).wait().success()
        
        success = True
        logging.info("Flight plan executed successfully")
        execution_log.append({"action": "complete", "success": True, "timestamp": datetime.datetime.now().isoformat()})
        
    except Exception as e:
        logging.error(f"Flight execution error: {str(e)}")
        execution_log.append({
            "action": "error",
            "error": str(e),
            "timestamp": datetime.datetime.now().isoformat()
        })
    
    return {
        "success": success,
        "execution_log": execution_log,
        "flight_mode": "stable"
    }

def execute_rapid_flight_plan(waypoints, altitude):
    """Execute flight plan with the drone in rapid mode (continuous flight without stops)"""
    global drone
    execution_log = []
    success = False
    
    try:
        if not drone or not drone_connected:
            raise ValueError("Drone is not connected")
            
        logging.info("Starting rapid flight plan execution...")
        execution_log.append({"action": "start_mission", "mode": "rapid", "timestamp": datetime.datetime.now().isoformat()})
        
        # Take off
        logging.info("Taking off...")
        execution_log.append({"action": "takeoff", "timestamp": datetime.datetime.now().isoformat()})
        drone(
            TakeOff()
            >> FlyingStateChanged(state="hovering", _timeout=5)
        ).wait().success()

        # Move to target altitude
        logging.info(f"Ascending to mission altitude: {altitude}m...")
        execution_log.append({"action": "ascend", "altitude": altitude, "timestamp": datetime.datetime.now().isoformat()})
        drone(
            moveBy(0, 0, -altitude, 0)  # Negative z is upward
            >> FlyingStateChanged(state="hovering", _timeout=10)
        ).wait().success()
        
        # Execute rapid waypoint navigation - never stop between waypoints
        execution_log.append({
            "action": "start_rapid_mode",
            "timestamp": datetime.datetime.now().isoformat()
        })
        
        for i, waypoint in enumerate(waypoints):
            lat = waypoint["lat"]
            lon = waypoint["lon"]
            wp_type = waypoint["type"]
            
            logging.info(f"Moving to waypoint {i+1}/{len(waypoints)}: ({lat}, {lon}) - RAPID MODE")
            execution_log.append({
                "action": "move_to_waypoint_rapid",
                "waypoint_num": i+1,
                "lat": lat,
                "lon": lon,
                "type": wp_type,
                "timestamp": datetime.datetime.now().isoformat()
            })
            
            # In rapid mode, we send the command but don't wait for it to complete
            drone(
                moveTo(lat, lon, altitude, MoveTo_Orientation_mode.TO_TARGET, 0.0)
            )
            
            # If this is a grid center point, take a photo without stopping
            if wp_type == "grid_center":
                logging.info(f"Taking photo at waypoint {i+1} (on the move)")
                execution_log.append({
                    "action": "take_photo_rapid", 
                    "waypoint_num": i+1,
                    "timestamp": datetime.datetime.now().isoformat()
                })

            # Add a very small delay to allow the drone to process the next command
            time.sleep(0.1)
        
        # Return to home and land
        logging.info("Returning to starting point...")
        execution_log.append({"action": "return_home", "timestamp": datetime.datetime.now().isoformat()})
        
        # For landing, we should wait for the drone to be near the landing point
        if waypoints and len(waypoints) > 0:
            start_point = waypoints[0]
            drone(
                moveTo(start_point["lat"], start_point["lon"], altitude, MoveTo_Orientation_mode.TO_TARGET, 0.0)
                >> moveToChanged(status=MoveToChanged_Status.DONE, _timeout=30)
            ).wait().success()
        
        logging.info("Landing...")
        execution_log.append({"action": "land", "timestamp": datetime.datetime.now().isoformat()})
        drone(
            Landing()
            >> FlyingStateChanged(state="landed", _timeout=10)
        ).wait().success()
        
        success = True
        logging.info("Flight plan executed successfully (RAPID MODE)")
        execution_log.append({"action": "complete", "success": True, "mode": "rapid", "timestamp": datetime.datetime.now().isoformat()})
        
    except Exception as e:
        logging.error(f"Rapid flight execution error: {str(e)}")
        execution_log.append({
            "action": "error",
            "error": str(e),
            "timestamp": datetime.datetime.now().isoformat()
        })
    
    return {
        "success": success,
        "execution_log": execution_log,
        "flight_mode": "rapid"
    }

#############################
# Drone Connection Functions
#############################

def connect_to_drone():
    """Connect to the drone without waiting for GPS fix"""
    global drone, drone_connected
    
    try:
        logging.info("Connecting to drone...")
        if drone is None:
            drone = olympe.Drone(DRONE_IP)
        
        drone.connect()
        
        drone_connected = True
        logging.info("Connected to drone successfully!")
        
        return {"success": True, "message": "Connected to drone"}
    except Exception as e:
        if drone:
            try:
                drone.disconnect()
            except:
                pass
        drone = None
        drone_connected = False
        logging.error(f"Failed to connect to drone: {str(e)}")
        return {"success": False, "error": str(e)}

def disconnect_from_drone():
    """Disconnect from the drone"""
    global drone, drone_connected, gps_fix_established
    
    try:
        if drone:
            logging.info("Disconnecting from drone...")
            drone.disconnect()
            drone = None
        
        drone_connected = False
        gps_fix_established = False
        logging.info("Disconnected from drone")
        return {"success": True, "message": "Disconnected from drone"}
    except Exception as e:
        logging.error(f"Error disconnecting from drone: {str(e)}")
        return {"success": False, "error": str(e)}

def update_gps_data():
    """Update GPS data from the drone (only GPS, no motion state)"""
    global drone, gps_data, DRONE_READY

    if drone and drone_connected:
        try:
            position_state = drone.get_state(PositionChanged)
            if position_state:
                gps_data["latitude"] = position_state["latitude"]
                gps_data["longitude"] = position_state["longitude"]
                gps_data["altitude"] = position_state["altitude"]

                lat = gps_data["latitude"]
                lon = gps_data["longitude"]
                alt = gps_data["altitude"]
                valid = (
                    isinstance(lat, (int, float)) and
                    isinstance(lon, (int, float)) and
                    isinstance(alt, (int, float)) and
                    math.isfinite(lat) and
                    math.isfinite(lon) and
                    math.isfinite(alt) and
                    -90 <= lat <= 90 and
                    -180 <= lon <= 180 and
                    -100 <= alt <= 10000
                )
                if not valid or (lat == 500 and lon == 500 and alt == 500):
                    DRONE_READY = False  # Not ready if coordinates are not valid
                    logging.info("Emitting flight_log: Drone has no GPS signal")
                    sio.emit('flight_log', {
                        'action': 'GPS Signal',
                        'message': 'Drone has no GPS signal'
                    }, skip_sid=None)
                else:
                    DRONE_READY = True  # Set ready when real coordinates are received
                    logging.info(f"Emitting gps_update: lat={lat:.6f}, lon={lon:.6f}, alt={alt:.2f}")
                    sio.emit('flight_log', {
                        'action': 'GPS Update',
                        'message': f"lat={lat:.6f}, lon={lon:.6f}, alt={alt:.2f}m"
                    }, skip_sid=None)
                    emit_data = {
                        "latitude": float(lat),
                        "longitude": float(lon),
                        "altitude": float(alt)
                    }
                    sio.emit('gps_update', emit_data, skip_sid=None)
        except Exception as e:
            print(f"\033[91mError updating GPS data: {str(e)}\033[0m")
    return gps_data

def update_gps_data_testing():
    """Emit fixed test GPS coordinates for indoor testing."""
    global gps_data, sio
    global DRONE_READY  # <-- Add this line

    DRONE_READY = True  # Set ready for testing

    gps_data["latitude"] = 57.012895
    gps_data["longitude"] = 9.992844
    gps_data["altitude"] = 20.0

    emit_data = {
        "latitude": gps_data["latitude"],
        "longitude": gps_data["longitude"],
        "altitude": gps_data["altitude"]
    }
    sio.emit('gps_update', emit_data, skip_sid=None)
    return gps_data

def update_motion_state():
    """Update and emit drone motion state only"""
    global drone, drone_motion_state

    if drone and drone_connected:
        try:
            motion_state = drone.get_state(MotionState)
            if motion_state:
                raw_state = str(motion_state["state"])
                drone_motion_state = raw_state.split('.')[-1].lower()
                logging.info(f"Emitting drone_state: {{'motion_state': '{drone_motion_state}'}}")
                # Emit to all clients by default (no broadcast, no room, no namespace)
                # Add skip_sid=None to force broadcast to all clients (python-socketio quirk)
                sio.emit('drone_state', {"motion_state": drone_motion_state}, skip_sid=None)
                sio.emit('motion_update', {
                    'motion_state': drone_motion_state
                }, skip_sid=None)
                # Do NOT emit to flight_log here anymore
        except Exception as e:
            print(f"\033[91mError updating motion state: {str(e)}\033[0m")

def update_battery_state():
    """Fetch and emit the drone's battery percentage."""
    global drone, drone_connected, sio
    if drone and drone_connected:
        try:
            battery_state = drone.get_state(BatteryStateChanged)
            if battery_state and "percent" in battery_state:
                percent = battery_state["percent"]
                sio.emit('battery_update', {"battery_percent": percent}, skip_sid=None)
        except Exception as e:
            logging.error(f"Error updating battery state: {str(e)}")

#############################
# Flask Routes
#############################

@sio.event
def connect(sid, environ):
    logging.info(f'Client connected: {sid}')
    sio.emit('drone_status', {'connected': drone_connected, 'gps_fix': gps_fix_established})

@sio.event
def disconnect(sid):
    logging.info(f'Client disconnected: {sid}')

@sio.on('get_drone_status')
def handle_get_drone_status(sid, data):
    return {'connected': drone_connected, 'gps_fix': gps_fix_established}

@sio.on('connect_drone')
def handle_connect_drone(sid, data):
    global background_thread
    result = connect_to_drone()
    sio.emit('drone_status', {'connected': drone_connected, 'gps_fix': gps_fix_established})
    # Use eventlet-based background task
    start_background_tasks()
    return result

@sio.on('disconnect_drone')
def handle_disconnect_drone(sid, data):
    result = disconnect_from_drone()
    sio.emit('drone_status', {'connected': drone_connected, 'gps_fix': gps_fix_established})
    return result

@sio.on('get_position')
def handle_get_position(sid, data):
    try:
        position = update_gps_data()
        sio.emit('gps_update', {**position, "motion_state": drone_motion_state})
        return {'success': True, 'position': position, "motion_state": drone_motion_state}
    except Exception as e:
        logging.error(f"Error getting position: {str(e)}")
        return {'success': False, 'error': str(e)}

@sio.on('calculate_grid')
def handle_calculate_grid(sid, data):
    if not DRONE_READY:
        return {"error": "Drone is not ready. Wait for valid GPS coordinates before calculating grid."}
    try:
        result = calculate_grid_plan(
            coordinates=data['coordinates'],
            altitude=float(data['altitude']),
            overlap=float(data['overlap']),
            coverage=float(data['coverage']),
            start_point=data.get('start_point')
        )
        return result
    except Exception as e:
        logging.error(f"Grid calculation error: {str(e)}")
        return {"error": str(e)}

@sio.on('execute_flight')
def handle_flight_execution(sid, data):
    if not DRONE_READY:
        sio.emit('flight_log', {'action': 'Error', 'message': "Drone is not ready. Wait for valid GPS coordinates before executing flight."})
        return {"error": "Drone is not ready. Wait for valid GPS coordinates before executing flight."}
    try:
        sio.emit('flight_log', {'action': 'Started', 'message': f"Flight execution started in {data.get('flight_mode', 'stable')} mode"})
        result = execute_flight_plan(
            waypoints=data['waypoints'],
            altitude=float(data['altitude']),
            flight_mode=data.get('flight_mode', 'stable')
        )
        for log in result['execution_log']:
            sio.emit('flight_log', {'action': log['action'], 'message': str(log)})
        return result
    except Exception as e:
        logging.error(f"Flight execution error: {str(e)}")
        sio.emit('flight_log', {'action': 'Error', 'message': str(e)})
        return {"error": str(e)}

import random

@sio.on('debug_execute_flight')
def handle_debug_flight_execution(sid, data):
    """
    Simulate flight execution for frontend testing.
    Emits flight_log events as if a real flight is running.
    """
    # Use eventlet.sleep for cooperative yielding!
    waypoints = data.get('waypoints', [])
    altitude = data.get('altitude', 20)
    flight_mode = data.get('flight_mode', 'stable')
    execution_log = []
    sio.emit('flight_log', {'action': 'Started', 'message': f"DEBUG: Flight execution started in {flight_mode} mode", 'timestamp': datetime.datetime.now().isoformat()})
    execution_log.append({'action': 'Started', 'message': f"DEBUG: Flight execution started in {flight_mode} mode", 'timestamp': datetime.datetime.now().isoformat()})

    # Simulate takeoff
    eventlet.sleep(0.5)
    sio.emit('flight_log', {'action': 'takeoff', 'message': 'DEBUG: Taking off', 'timestamp': datetime.datetime.now().isoformat()})
    execution_log.append({'action': 'takeoff', 'message': 'DEBUG: Taking off', 'timestamp': datetime.datetime.now().isoformat()})

    # Simulate ascend
    eventlet.sleep(0.5)
    sio.emit('flight_log', {'action': 'ascend', 'message': f'DEBUG: Ascending to {altitude}m', 'timestamp': datetime.datetime.now().isoformat()})
    execution_log.append({'action': 'ascend', 'message': f'DEBUG: Ascending to {altitude}m', 'timestamp': datetime.datetime.now().isoformat()})

    # Simulate waypoints
    for i, waypoint in enumerate(waypoints):
        eventlet.sleep(0.3)
        lat = waypoint.get("lat")
        lon = waypoint.get("lon")
        wp_type = waypoint.get("type", "grid_center")
        msg = f"DEBUG: Moving to waypoint {i+1}/{len(waypoints)}: ({lat}, {lon})"
        sio.emit('flight_log', {'action': 'move_to_waypoint', 'message': msg, 'timestamp': datetime.datetime.now().isoformat()})
        execution_log.append({'action': 'move_to_waypoint', 'message': msg, 'timestamp': datetime.datetime.now().isoformat()})
        if wp_type == "grid_center":
            eventlet.sleep(0.2)
            sio.emit('flight_log', {'action': 'take_photo', 'message': f"DEBUG: Taking photo at waypoint {i+1}", 'timestamp': datetime.datetime.now().isoformat()})
            execution_log.append({'action': 'take_photo', 'message': f"DEBUG: Taking photo at waypoint {i+1}", 'timestamp': datetime.datetime.now().isoformat()})

    # Simulate return and land
    eventlet.sleep(0.5)
    sio.emit('flight_log', {'action': 'return_home', 'message': 'DEBUG: Returning to starting point', 'timestamp': datetime.datetime.now().isoformat()})
    execution_log.append({'action': 'return_home', 'message': 'DEBUG: Returning to starting point', 'timestamp': datetime.datetime.now().isoformat()})

    eventlet.sleep(0.5)
    sio.emit('flight_log', {'action': 'land', 'message': 'DEBUG: Landing', 'timestamp': datetime.datetime.now().isoformat()})
    execution_log.append({'action': 'land', 'message': 'DEBUG: Landing', 'timestamp': datetime.datetime.now().isoformat()})

    eventlet.sleep(0.3)
    sio.emit('flight_log', {'action': 'complete', 'message': 'DEBUG: Flight completed successfully', 'timestamp': datetime.datetime.now().isoformat()})
    execution_log.append({'action': 'complete', 'message': 'DEBUG: Flight completed successfully', 'timestamp': datetime.datetime.now().isoformat()})

    return {
        "success": True,
        "execution_log": execution_log,
        "flight_mode": flight_mode,
        "debug": True
    }

def start_background_tasks():
    """Start background tasks using eventlet's spawn_n for true async compatibility, with different intervals."""
    def background_loop():
        logging.info("Background task started (eventlet)")
        # Set intervals (in seconds) for each task
        motion_interval = 2
        gps_interval = 2
        battery_interval = 10

        last_motion = 0
        last_gps = 0
        last_battery = 0

        while True:
            now = time.time()
            try:
                if drone_connected:
                    if now - last_motion >= motion_interval:
                        logging.info("Background: updating motion state")
                        update_motion_state()
                        last_motion = now

                    if now - last_gps >= gps_interval:
                        logging.info("Background: updating GPS data")
                        update_gps_data_testing()
                        last_gps = now

                    if now - last_battery >= battery_interval:
                        logging.info("Background: updating battery state")
                        update_battery_state()
                        last_battery = now
                else:
                    logging.info("Background: drone not connected, skipping update")
                eventlet.sleep(0.2)  # Short sleep for responsiveness
            except Exception as e:
                logging.error(f"Error in background task: {str(e)}")
                eventlet.sleep(2)

    # Only start one background task
    global background_thread
    if background_thread is None:
        background_thread = eventlet.spawn(background_loop)
        logging.info("Eventlet background task spawned")

#############################
# Main Execution
#############################

if __name__ == "__main__":
    port = int(os.environ.get('PORT', DEFAULT_PORT))
    host = os.environ.get('HOST', DEFAULT_HOST)
    
    logging.info(f"Starting python-socketio server on {host}:{port}")
    import eventlet
    import eventlet.wsgi
    eventlet.wsgi.server(eventlet.listen((host, port)), application)