#!/usr/bin/env python3

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
from olympe.messages.common.CommonState import BatteryStateChanged

# Configure logging
logging.basicConfig(level=logging.INFO)

# Constants
DRONE_IP = "192.168.53.1"  # Default Anafi IP
DEFAULT_PORT = 5000
DEFAULT_HOST = "0.0.0.0"

# Use python-socketio's standard server
sio = socketio.Server(cors_allowed_origins="*")
application = socketio.WSGIApp(sio)

# Global state
drone = None
drone_listener = None
drone_connected = False
gps_fix_established = False
DRONE_READY = False  # New variable to indicate if drone is ready
gps_data = {
    "latitude": 0,
    "longitude": 0,
    "altitude": 0
}
drone_motion_state = "unknown"  # Can be "moving", "steady", or "unknown"
battery_percent = 0

# Track changes for efficient updates
gps_data_changed = False
motion_state_changed = False
battery_percent_changed = False

# Main event listener class
class DroneEventListener(olympe.EventListener):
    """
    Event listener class for drone events.
    Uses olympe.EventListener to properly subscribe to drone events.
    """
    
    @olympe.listen_event(PositionChanged(_policy='wait'))
    def on_position_changed(self, event, scheduler):
        """Handle position changed events"""
        global gps_data, DRONE_READY, gps_data_changed
        
        try:
            lat = event.args["latitude"]
            lon = event.args["longitude"]
            alt = event.args["altitude"]
            
            # Check if data is valid
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
                DRONE_READY = False
                logging.debug("Invalid GPS coordinates received")
                return
                
            # Update global state only if values have changed
            if (gps_data["latitude"] != lat or 
                gps_data["longitude"] != lon or 
                gps_data["altitude"] != alt):
                
                gps_data["latitude"] = lat
                gps_data["longitude"] = lon
                gps_data["altitude"] = alt
                DRONE_READY = True
                gps_data_changed = True
                logging.debug(f"Updated GPS data: lat={lat:.6f}, lon={lon:.6f}, alt={alt:.2f}")
                
                # Emit the update directly
                emit_data = {
                    "latitude": float(lat),
                    "longitude": float(lon), 
                    "altitude": float(alt)
                }
                sio.emit('gps_update', emit_data, skip_sid=None)
        
        except Exception as e:
            logging.error(f"Error in position changed handler: {str(e)}")

    @olympe.listen_event(MotionState(_policy='wait'))
    def on_motion_state_changed(self, event, scheduler):
        """Handle motion state changed events"""
        global drone_motion_state, motion_state_changed
        
        try:
            raw_state = str(event.args["state"])
            new_state = raw_state.split('.')[-1].lower()
            
            if drone_motion_state != new_state:
                drone_motion_state = new_state
                motion_state_changed = True
                logging.debug(f"Motion state changed to: {drone_motion_state}")
                
                # Emit the update directly
                sio.emit('drone_state', {"motion_state": drone_motion_state}, skip_sid=None)
                sio.emit('motion_update', {'motion_state': drone_motion_state}, skip_sid=None)
        
        except Exception as e:
            logging.error(f"Error in motion state handler: {str(e)}")

    @olympe.listen_event(BatteryStateChanged(_policy='wait'))
    def on_battery_state_changed(self, event, scheduler):
        """Handle battery state changed events"""
        global battery_percent, battery_percent_changed
        
        try:
            new_percent = event.args["percent"]
            
            if battery_percent != new_percent:
                battery_percent = new_percent
                battery_percent_changed = True
                logging.debug(f"Battery percent changed to: {battery_percent}%")
                
                # Emit the update directly
                sio.emit('battery_update', {"battery_percent": battery_percent}, skip_sid=None)
        
        except Exception as e:
            logging.error(f"Error in battery state handler: {str(e)}")
            
    # You can add more event handlers here as needed
    @olympe.listen_event(FlyingStateChanged(_policy='wait'))
    def on_flying_state_changed(self, event, scheduler):
        """Handle flying state changed events"""
        try:
            state = event.args["state"]
            logging.info(f"Flying state changed to: {state}")
            sio.emit('flight_log', {'action': 'Flight State', 'message': f"Drone state: {state}"}, skip_sid=None)
        except Exception as e:
            logging.error(f"Error in flying state handler: {str(e)}")

# For indoor testing without real GPS data
def update_gps_data_testing():
    """Emit fixed test GPS coordinates for indoor testing."""
    global gps_data, DRONE_READY
    
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
    Execute a simple test flight plan directly
    
    Args:
        waypoints: List of waypoints to visit (not used in test flight)
        altitude: Flight altitude in meters (not used in test flight)
        flight_mode: "stable" (stops at each waypoint) or "rapid" (continuous flight)
    """
    if not drone or not drone_connected:
        sio.emit('flight_log', {'action': 'Error', 'message': "Drone is not connected"}, skip_sid=None)
        return {"success": False, "message": "Drone is not connected"}

    # Execute directly
    logging.info("Starting simple test flight...")
    sio.emit('flight_log', {'action': 'Starting', 'message': "Beginning test flight"}, skip_sid=None)
    
    try:
        # Take off
        logging.info("Taking off...")
        sio.emit('flight_log', {'action': 'Takeoff', 'message': "Drone is taking off"}, skip_sid=None)
        
        # Execute the takeoff command directly
        takeoff_cmd = drone(
            TakeOff()
            >> FlyingStateChanged(state="hovering", _timeout=5)
        )
        
        # We don't need to use wait() but can use get_success() instead to avoid threading issues
        if not takeoff_cmd.wait().success():
            sio.emit('flight_log', {'action': 'Error', 'message': "Takeoff failed"}, skip_sid=None)
            return {"success": False, "message": "Takeoff failed"}
            
        # Wait for 5 seconds
        logging.info("Hovering for 5 seconds...")
        sio.emit('flight_log', {'action': 'Hovering', 'message': "Drone is hovering for 5 seconds"}, skip_sid=None)
        time.sleep(5)
        
        # Land
        logging.info("Landing...")
        sio.emit('flight_log', {'action': 'Landing', 'message': "Drone is landing"}, skip_sid=None)
        
        # Execute landing command directly
        landing_cmd = drone(
            Landing()
            >> FlyingStateChanged(state="landed", _timeout=10)
        )
        
        # Similar approach for landing
        if not landing_cmd.wait().success():
            sio.emit('flight_log', {'action': 'Error', 'message': "Landing failed"}, skip_sid=None)
            return {"success": False, "message": "Landing failed"}
            
        logging.info("Test flight completed successfully")
        sio.emit('flight_log', {'action': 'Completed', 'message': "Test flight completed successfully"}, skip_sid=None)
        return {"success": True, "message": "Test flight completed successfully"}
        
    except Exception as e:
        error_msg = f"Test flight error: {str(e)}"
        logging.error(error_msg)
        sio.emit('flight_log', {'action': 'Error', 'message': error_msg}, skip_sid=None)
        return {"success": False, "error": str(e)}

#############################
# Drone Connection Functions
#############################

def connect_to_drone():
    """Connect to the drone and set up the event listener"""
    global drone, drone_connected, drone_listener
    
    try:
        logging.info("Connecting to drone...")
        if drone is None:
            drone = olympe.Drone(DRONE_IP)
            
        # Connect to the drone
        drone.connect()
        
        # Create the event listener - olympe.EventListener doesn't have start() method
        # It's automatically started when it's created
        if drone_listener is None:
            drone_listener = DroneEventListener(drone)
            
        drone_connected = True
        logging.info("Connected to drone and event listener created successfully!")
        
        # For indoor testing:
        update_gps_data_testing()
        
        return {"success": True, "message": "Connected to drone"}
    except Exception as e:
        # Clean up if there's an error
        drone_listener = None
            
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
    """Disconnect from the drone and clean up the event listener"""
    global drone, drone_connected, gps_fix_established, drone_listener
    
    try:
        # EventListener doesn't have an explicit stop method - it's automatically
        # stopped when the drone disconnects or when there are no more references to it
        drone_listener = None
            
        # Then disconnect the drone
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

#############################
# Socket.IO Routes
#############################

@sio.event
def connect(sid, environ):
    logging.info(f'Client connected: {sid}')
    sio.emit('drone_status', {'connected': drone_connected, 'gps_fix': DRONE_READY})

@sio.event
def disconnect(sid):
    logging.info(f'Client disconnected: {sid}')

@sio.on('get_drone_status')
def handle_get_drone_status(sid, data):
    return {'connected': drone_connected, 'gps_fix': DRONE_READY}

@sio.on('connect_drone')
def handle_connect_drone(sid, data):
    result = connect_to_drone()
    sio.emit('drone_status', {'connected': drone_connected, 'gps_fix': DRONE_READY})
    return result

@sio.on('disconnect_drone')
def handle_disconnect_drone(sid, data):
    result = disconnect_from_drone()
    sio.emit('drone_status', {'connected': drone_connected, 'gps_fix': DRONE_READY})
    return result

@sio.on('get_position')
def handle_get_position(sid, data):
    try:
        return {
            'success': True, 
            'position': gps_data, 
            "motion_state": drone_motion_state
        }
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
    
    # Execute flight directly
    return execute_flight_plan(
        waypoints=data.get('waypoints', []),
        altitude=float(data.get('altitude', 1.0)),
        flight_mode=data.get('flight_mode', 'stable')
    )

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