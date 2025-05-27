#!/usr/bin/env python3

from flask import Flask, render_template_string
from flask_socketio import SocketIO
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

# Configure logging
logging.basicConfig(level=logging.INFO)

# Constants
DRONE_IP = "192.168.53.1"  # Default Anafi IP
DEFAULT_PORT = 5000
DEFAULT_HOST = "0.0.0.0"

# Flask and SocketIO setup
app = Flask(__name__)
app.config['SECRET_KEY'] = 'drone-control-backend-v3'
socketio = SocketIO(app, cors_allowed_origins="*")

# Global state
drone = None
drone_connected = False
gps_data = {
    "latitude": 0,
    "longitude": 0,
    "altitude": 0
}
drone_motion_state = "unknown"  # Can be "moving", "steady", or "unknown"

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
    """Connect to the drone and initialize connection"""
    global drone, drone_connected, gps_data
    
    try:
        logging.info("Connecting to drone...")
        if drone is None:
            drone = olympe.Drone(DRONE_IP)
        
        drone.connect()
        logging.info("Waiting for GPS fix...")
        drone(GPSFixStateChanged(fixed=1, _timeout=30)).wait().success()
        
        drone_connected = True
        logging.info("Connected to drone successfully!")
        
        # Get initial GPS position
        update_gps_data()
        
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
    global drone, drone_connected
    
    try:
        if drone:
            logging.info("Disconnecting from drone...")
            drone.disconnect()
            drone = None
        
        drone_connected = False
        logging.info("Disconnected from drone")
        return {"success": True, "message": "Disconnected from drone"}
    except Exception as e:
        logging.error(f"Error disconnecting from drone: {str(e)}")
        return {"success": False, "error": str(e)}

def update_gps_data():
    """Update GPS data from the drone"""
    global drone, gps_data, drone_motion_state
    
    if drone and drone_connected:
        try:
            position_state = drone.get_state(PositionChanged)
            motion_state = drone.get_state(MotionState)
            
            if position_state:
                gps_data["latitude"] = position_state["latitude"]
                gps_data["longitude"] = position_state["longitude"]
                gps_data["altitude"] = position_state["altitude"]
                
                # Log coordinates in terminal
                logging.info(f"GPS Position: lat={gps_data['latitude']:.6f}, lon={gps_data['longitude']:.6f}, alt={gps_data['altitude']:.2f}m")
                
                # Add to flight log
                socketio.emit('flight_log', {
                    'action': 'GPS Update', 
                    'message': f"lat={gps_data['latitude']:.6f}, lon={gps_data['longitude']:.6f}, alt={gps_data['altitude']:.2f}m"
                })
            
            if motion_state:
                old_state = drone_motion_state
                drone_motion_state = motion_state["state"]
                
                # Log motion state change in terminal
                if old_state != drone_motion_state:
                    logging.info(f"Motion State changed: {old_state} -> {drone_motion_state}")
                    
                    # Add to flight log if state changed
                    socketio.emit('flight_log', {
                        'action': 'Motion State', 
                        'message': f"Drone is now {drone_motion_state}"
                    })
                
            # Emit the GPS data and motion state via WebSocket
            socketio.emit('gps_update', {
                **gps_data,
                "motion_state": drone_motion_state
            })
            
        except Exception as e:
            logging.error(f"Error updating drone data: {str(e)}")
    
    return gps_data

#############################
# Frontend HTML Template
#############################

FRONTEND_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Drone Control Dashboard</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.0.1/socket.io.js"></script>
    <style>
        body, html {
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
        }
        .container {
            display: flex;
            height: 100vh;
            flex-direction: column;
        }
        header {
            background-color: #333;
            color: white;
            padding: 10px;
            text-align: center;
        }
        .content {
            display: flex;
            flex: 1;
            overflow: hidden;
        }
        .map-container {
            flex: 2;
            position: relative;
        }
        #map {
            height: 100%;
            width: 100%;
        }
        .sidebar {
            flex: 1;
            background-color: #f8f8f8;
            padding: 15px;
            overflow-y: auto;
            max-width: 400px;
            border-left: 1px solid #ddd;
        }
        .status-bar {
            background-color: #f44336;
            color: white;
            padding: 10px;
            text-align: center;
            transition: background-color 0.3s;
        }
        .status-bar.connected {
            background-color: #4CAF50;
        }
        .controls {
            margin-bottom: 15px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 15px;
        }
        .section {
            margin-bottom: 20px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
        }
        h2, h3 {
            margin-top: 0;
        }
        button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 8px 15px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 14px;
            margin: 4px 2px;
            cursor: pointer;
            border-radius: 4px;
        }
        button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
        }
        button.danger {
            background-color: #f44336;
        }
        input, select {
            padding: 6px;
            margin: 5px 0;
            width: 100%;
            box-sizing: border-box;
        }
        .flight-log {
            max-height: 200px;
            overflow-y: auto;
            background-color: #f1f1f1;
            padding: 8px;
            border-radius: 4px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        table, th, td {
            border: 1px solid #ddd;
        }
        th, td {
            padding: 8px;
            text-align: left;
        }
        tr:nth-child(even) {
            background-color: #f2f2f2;
        }
        .overlay-info {
            position: absolute;
            top: 10px;
            right: 10px;
            background-color: rgba(255, 255, 255, 0.8);
            padding: 10px;
            border-radius: 4px;
            z-index: 1000;
            max-width: 200px;
        }
        .grid-info {
            background-color: #e7f3fe;
            border-left: 6px solid #2196F3;
            padding: 10px;
            margin: 10px 0;
        }
        #polygon-coords {
            width: 100%;
            height: 80px;
        }
        .motion-state-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 20px;
            font-weight: bold;
            margin-left: 10px;
        }
        .motion-state-steady {
            background-color: #4CAF50;
            color: white;
        }
        .motion-state-moving {
            background-color: #FF9800;
            color: white;
        }
        .motion-state-unknown {
            background-color: #9E9E9E;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Drone Control Dashboard</h1>
        </header>
        <div class="status-bar" id="connection-status">Disconnected</div>
        <div class="content">
            <div class="map-container">
                <div id="map"></div>
                <div class="overlay-info">
                    <div><strong>Latitude:</strong> <span id="lat">0</span></div>
                    <div><strong>Longitude:</strong> <span id="lng">0</span></div>
                    <div><strong>Altitude:</strong> <span id="alt">0</span> m</div>
                    <div><strong>State:</strong> <span id="motion-state" class="motion-state-badge motion-state-unknown">Unknown</span></div>
                </div>
            </div>
            <div class="sidebar">
                <div class="controls">
                    <h2>Drone Controls</h2>
                    <button id="connect-btn">Connect Drone</button>
                    <button id="disconnect-btn" class="danger" disabled>Disconnect</button>
                </div>
                
                <div class="section">
                    <h2>Grid Planning</h2>
                    <div>
                        <label for="polygon-coords">Area Coordinates (JSON):</label>
                        <textarea id="polygon-coords" placeholder='[[lat1, lon1], [lat2, lon2], ...]'></textarea>
                    </div>
                    <div>
                        <label for="altitude">Altitude (m):</label>
                        <input type="number" id="altitude" value="10" min="1" max="40">
                    </div>
                    <div>
                        <label for="overlap">Overlap (%):</label>
                        <input type="number" id="overlap" value="70" min="0" max="90">
                    </div>
                    <div>
                        <label for="coverage">Coverage (%):</label>
                        <input type="number" id="coverage" value="70" min="0" max="100">
                    </div>
                    <div>
                        <label for="flight-mode">Flight Mode:</label>
                        <select id="flight-mode">
                            <option value="stable">Stable (Stop at each point)</option>
                            <option value="rapid">Rapid (Continuous flight)</option>
                        </select>
                    </div>
                    <button id="calculate-grid-btn">Calculate Grid</button>
                    <button id="execute-flight-btn" disabled>Execute Flight</button>
                </div>
                
                <div class="section" id="grid-info-section" style="display: none;">
                    <h2>Grid Information</h2>
                    <div class="grid-info">
                        <div><strong>Grid Count:</strong> <span id="grid-count">0</span></div>
                        <div><strong>Total Distance:</strong> <span id="total-distance">0</span> m</div>
                        <div><strong>Est. Flight Time:</strong> <span id="est-flight-time">0</span> sec</div>
                    </div>
                </div>
                
                <div class="section">
                    <h2>Flight Log</h2>
                    <div class="flight-log" id="flight-log">
                        <p>No flight logs yet</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Global variables
        let socket;
        let map;
        let droneMarker;
        let dronePath;
        let areaPolygon;
        let gridPolygons = [];
        let pathLine;
        let gridData = null;
        let positionHistory = [];
        let connected = false;
        
        // Initialize map
        function initMap() {
            map = L.map('map').setView([0, 0], 15);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            
            droneMarker = L.marker([0, 0], {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).addTo(map);
            
            dronePath = L.polyline([], {color: 'blue', weight: 3}).addTo(map);
            
            // Click on map to add polygon point
            map.on('click', function(e) {
                addPolygonPoint(e.latlng.lat, e.latlng.lng);
            });
        }
        
        function addPolygonPoint(lat, lng) {
            let coords = document.getElementById('polygon-coords').value;
            try {
                coords = coords ? JSON.parse(coords) : [];
            } catch(e) {
                coords = [];
            }
            
            coords.push([lat, lng]);
            document.getElementById('polygon-coords').value = JSON.stringify(coords);
            updateAreaPolygon();
        }
        
        function updateAreaPolygon() {
            try {
                // Clear existing polygon
                if (areaPolygon) {
                    map.removeLayer(areaPolygon);
                }
                
                // Get coords from textarea
                let coords = JSON.parse(document.getElementById('polygon-coords').value);
                if (coords && coords.length >= 3) {
                    areaPolygon = L.polygon(coords, {color: 'green'}).addTo(map);
                    map.fitBounds(areaPolygon.getBounds());
                }
            } catch(e) {
                console.error("Error updating polygon:", e);
            }
        }
        
        function clearGridAndPath() {
            // Clear previous grid visualization
            gridPolygons.forEach(poly => map.removeLayer(poly));
            gridPolygons = [];
            
            // Clear path line
            if (pathLine) {
                map.removeLayer(pathLine);
                pathLine = null;
            }
        }
        
        function visualizeGrid(data) {
            clearGridAndPath();
            gridData = data;
            
            // Show grid info section
            document.getElementById('grid-info-section').style.display = 'block';
            document.getElementById('grid-count').textContent = data.grid_count;
            document.getElementById('total-distance').textContent = data.path_metrics.total_distance.toFixed(2);
            document.getElementById('est-flight-time').textContent = data.path_metrics.estimated_flight_time.toFixed(2);
            
            // Add each grid as a polygon
            data.grids.forEach(grid => {
                const corners = grid.corners.map(corner => [corner.lat, corner.lon]);
                const poly = L.polygon(corners, {color: 'rgba(33, 150, 243, 0.5)', weight: 1}).addTo(map);
                gridPolygons.push(poly);
            });
            
            // Create path line
            if (data.path && data.path.length > 0) {
                const pathCoords = data.path.map(point => [point.lat, point.lon]);
                pathLine = L.polyline(pathCoords, {color: 'red', weight: 2, dashArray: '5, 5'}).addTo(map);
                
                // Enable execute flight button
                document.getElementById('execute-flight-btn').disabled = !connected;
            }
        }
        
        function connectSocket() {
            socket = io();
            
            socket.on('connect', function() {
                console.log("Connected to server");
                
                // Set up event listeners
                socket.on('gps_update', function(data) {
                    updateGpsData(data);
                });
                
                socket.on('drone_status', function(data) {
                    updateDroneStatus(data);
                });
                
                socket.on('flight_log', function(data) {
                    addFlightLog(data);
                });
                
                // Get initial drone status
                socket.emit('get_drone_status', {}, function(response) {
                    updateDroneStatus(response);
                });
            });
            
            socket.on('disconnect', function() {
                console.log("Disconnected from server");
                updateConnectionStatus(false);
            });
        }
        
        function updateGpsData(data) {
            document.getElementById('lat').textContent = data.latitude.toFixed(6);
            document.getElementById('lng').textContent = data.longitude.toFixed(6);
            document.getElementById('alt').textContent = data.altitude.toFixed(2);
            
            // Update motion state
            const motionStateElement = document.getElementById('motion-state');
            motionStateElement.textContent = data.motion_state ? data.motion_state.charAt(0).toUpperCase() + data.motion_state.slice(1) : 'Unknown';
            
            // Update motion state badge class
            motionStateElement.className = 'motion-state-badge motion-state-' + (data.motion_state || 'unknown');
            
            if (data.latitude !== 0 && data.longitude !== 0) {
                const position = [data.latitude, data.longitude];
                droneMarker.setLatLng(position);
                
                // Add to position history and update path
                positionHistory.push(position);
                if (positionHistory.length > 100) {
                    positionHistory.shift(); // Keep history size reasonable
                }
                dronePath.setLatLngs(positionHistory);
                
                // Center map on drone
                if (connected) {
                    map.setView(position);
                }
            }
        }
        
        function updateDroneStatus(data) {
            connected = data.connected;
            updateConnectionStatus(connected);
        }
        
        function updateConnectionStatus(isConnected) {
            const statusBar = document.getElementById('connection-status');
            statusBar.textContent = isConnected ? "Connected to Drone" : "Disconnected";
            statusBar.className = isConnected ? "status-bar connected" : "status-bar";
            
            document.getElementById('connect-btn').disabled = isConnected;
            document.getElementById('disconnect-btn').disabled = !isConnected;
            
            if (gridData && isConnected) {
                document.getElementById('execute-flight-btn').disabled = false;
            } else {
                document.getElementById('execute-flight-btn').disabled = true;
            }
        }
        
        function addFlightLog(log) {
            const logDiv = document.getElementById('flight-log');
            const logEntry = document.createElement('p');
            
            // Add timestamp to the log
            const timestamp = new Date().toLocaleTimeString();
            logEntry.textContent = `${timestamp} - ${log.action}: ${log.message || ''}`;
            
            // Style based on action type
            if (log.action === 'Motion State') {
                if (log.message.includes('steady')) {
                    logEntry.style.color = '#4CAF50';
                } else if (log.message.includes('moving')) {
                    logEntry.style.color = '#FF9800';
                }
            } else if (log.action === 'GPS Update') {
                logEntry.style.color = '#2196F3';
                logEntry.style.fontSize = '0.9em';
            }
            
            logDiv.appendChild(logEntry);
            logDiv.scrollTop = logDiv.scrollHeight;
        }
        
        // Button event handlers
        function setupEventListeners() {
            document.getElementById('connect-btn').addEventListener('click', function() {
                socket.emit('connect_drone', {}, function(response) {
                    if (response.success) {
                        addFlightLog({action: 'Connection', message: 'Connected to drone'});
                    } else {
                        addFlightLog({action: 'Error', message: response.error || 'Failed to connect'});
                    }
                });
            });
            
            document.getElementById('disconnect-btn').addEventListener('click', function() {
                socket.emit('disconnect_drone', {}, function(response) {
                    if (response.success) {
                        addFlightLog({action: 'Connection', message: 'Disconnected from drone'});
                    } else {
                        addFlightLog({action: 'Error', message: response.error || 'Failed to disconnect'});
                    }
                });
            });
            
            document.getElementById('calculate-grid-btn').addEventListener('click', function() {
                try {
                    const coordinates = JSON.parse(document.getElementById('polygon-coords').value);
                    const altitude = parseFloat(document.getElementById('altitude').value);
                    const overlap = parseFloat(document.getElementById('overlap').value);
                    const coverage = parseFloat(document.getElementById('coverage').value);
                    
                    // Validate inputs
                    if (!coordinates || coordinates.length < 3) {
                        addFlightLog({action: 'Error', message: 'At least 3 coordinates are required'});
                        return;
                    }
                    
                    const data = {
                        coordinates: coordinates,
                        altitude: altitude,
                        overlap: overlap,
                        coverage: coverage,
                        start_point: connected ? [droneMarker.getLatLng().lat, droneMarker.getLatLng().lng] : null
                    };
                    
                    addFlightLog({action: 'Grid', message: 'Calculating grid plan...'});
                    socket.emit('calculate_grid', data, function(response) {
                        if (response.error) {
                            addFlightLog({action: 'Error', message: response.error || 'Failed to calculate grid'});
                        } else {
                            addFlightLog({action: 'Grid', message: `Grid plan calculated: ${response.grid_count} grid points`});
                            visualizeGrid(response);
                        }
                    });
                } catch(e) {
                    addFlightLog({action: 'Error', message: 'Invalid input: ' + e.message});
                }
            });
            
            document.getElementById('execute-flight-btn').addEventListener('click', function() {
                if (!gridData || !gridData.path) {
                    addFlightLog({action: 'Error', message: 'No flight path available'});
                    return;
                }
                
                const altitude = parseFloat(document.getElementById('altitude').value);
                const flightMode = document.getElementById('flight-mode').value;
                
                const data = {
                    waypoints: gridData.path,
                    altitude: altitude,
                    flight_mode: flightMode
                };
                
                addFlightLog({action: 'Flight', message: `Starting ${flightMode} flight execution...`});
                socket.emit('execute_flight', data, function(response) {
                    if (response.error) {
                        addFlightLog({action: 'Error', message: response.error || 'Flight execution failed'});
                    } else {
                        addFlightLog({action: 'Flight', message: `Flight ${response.success ? 'completed successfully' : 'failed'}`});
                    }
                });
            });
            
            // Update area polygon when textarea changes
            document.getElementById('polygon-coords').addEventListener('change', updateAreaPolygon);
        }
        
        // Initialize when the page loads
        document.addEventListener('DOMContentLoaded', function() {
            initMap();
            connectSocket();
            setupEventListeners();
        });
    </script>
</body>
</html>
"""

#############################
# Flask Routes
#############################

@app.route('/')
def index():
    return render_template_string(FRONTEND_HTML)

@socketio.on('connect')
def handle_connect():
    logging.info('Client connected')
    socketio.emit('gps_update', gps_data)
    socketio.emit('drone_status', {'connected': drone_connected})

@socketio.on('get_drone_status')
def handle_get_drone_status(data):
    return {'connected': drone_connected}

@socketio.on('connect_drone')
def handle_connect_drone(data):
    result = connect_to_drone()
    socketio.emit('drone_status', {'connected': drone_connected})
    return result

@socketio.on('disconnect_drone')
def handle_disconnect_drone(data):
    result = disconnect_from_drone()
    socketio.emit('drone_status', {'connected': drone_connected})
    return result

@socketio.on('get_position')
def handle_get_position(data):
    try:
        position = update_gps_data()
        socketio.emit('gps_update', {**position, "motion_state": drone_motion_state})
        return {'success': True, 'position': position, "motion_state": drone_motion_state}
    except Exception as e:
        logging.error(f"Error getting position: {str(e)}")
        return {'success': False, 'error': str(e)}

@socketio.on('calculate_grid')
def handle_calculate_grid(data):
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

@socketio.on('execute_flight')
def handle_flight_execution(data):
    try:
        socketio.emit('flight_log', {'action': 'Started', 'message': f"Flight execution started in {data.get('flight_mode', 'stable')} mode"})
        result = execute_flight_plan(
            waypoints=data['waypoints'],
            altitude=float(data['altitude']),
            flight_mode=data.get('flight_mode', 'stable')
        )
        
        # Send execution logs through socket.io
        for log in result['execution_log']:
            socketio.emit('flight_log', {'action': log['action'], 'message': str(log)})
            
        return result
    except Exception as e:
        logging.error(f"Flight execution error: {str(e)}")
        socketio.emit('flight_log', {'action': 'Error', 'message': str(e)})
        return {"error": str(e)}

# Background task to update GPS data
def gps_update_task():
    while True:
        if drone_connected:
            update_gps_data()
        time.sleep(1)

#############################
# Main Execution
#############################

if __name__ == "__main__":
    port = int(os.environ.get('PORT', DEFAULT_PORT))
    host = os.environ.get('HOST', DEFAULT_HOST)
    
    logging.info(f"Starting server on {host}:{port}")
    logging.info("Access the drone control dashboard at http://localhost:5000")
    
    # Start the GPS update task after a delay
    socketio.start_background_task(gps_update_task)
    
    # Run the Flask app with SocketIO
    socketio.run(app, host=host, port=port, debug=True)
