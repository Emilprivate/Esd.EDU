#!/usr/bin/env python3

# Remove Flask import (not needed)
# from flask import Flask, request
# Replace Flask-SocketIO with the standard python-socketio server
import socketio
import olympe
import time
import math
import numpy as np
import queue  # Add this import to fix the NameError
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
from olympe.messages.gimbal import set_target
from olympe.messages.camera import photo_progress
from olympe.media import download_media

from olympe.messages.camera import set_camera_mode, set_photo_mode, take_photo
from olympe.enums.camera import camera_mode, photo_mode, photo_format, photo_file_format

logging.basicConfig(level=logging.INFO)

# Constants
DRONE_IP = "10.202.0.1"
DEFAULT_PORT = 5000
DEFAULT_HOST = "0.0.0.0"
sio = socketio.Server(cors_allowed_origins="*")

application = socketio.WSGIApp(sio)

# Global state
drone = None
drone_connected = False
gps_fix_established = False
DRONE_READY = False
drone_testing = False  # Set to True by default to enable GPS simulation for indoor testing
gps_data = {
    "latitude": 0,
    "longitude": 0,
    "altitude": 0
}
drone_motion_state = "unknown"
battery_percent = 0

# Add variables to track changes
gps_data_changed = False
motion_state_changed = False
battery_percent_changed = False

background_thread = None 

#############################
# Drone Event Listener Class
#############################

class DroneEventListener(olympe.EventListener):
    """
    Event listener class for drone events.
    Uses olympe.EventListener to properly subscribe to drone events.
    """

    # def __init__(self, drone):
    #     super().__init__(drone)
    #     self._drone = drone
    
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
        
        except Exception as e:
            logging.error(f"Error in battery state handler: {str(e)}")

    @olympe.listen_event(FlyingStateChanged(_policy='wait'))
    def on_flying_state_changed(self, event, scheduler):
        """Handle flying state changed events"""
        global drone_motion_state, motion_state_changed
        try:
            raw_state = str(event.args["state"])
            new_state = raw_state.split('.')[-1].lower()
            if drone_motion_state != new_state:
                drone_motion_state = new_state
                motion_state_changed = True
                logging.debug(f"Flying state changed to: {drone_motion_state}")
        except Exception as e:
            logging.error(f"Error in flying state handler: {str(e)}")

    @olympe.listen_event(photo_progress(_policy='wait'))
    def on_photo_progress(self, event, scheduler):
        print(f"Photo event received: {event.args}")
        result = event.args.get('result')
        if hasattr(result, "name") and result.name == 'photo_saved':
            media_id = event.args['media_id']
            # drone = self._drone if hasattr(self, "_drone") else getattr(self, "drone", None)
            if drone is not None:
                os.makedirs("photos", exist_ok=True)
                # print local path
                print(f"Local path: {os.path.abspath('photos')}")
                drone.media.download_dir = "photos"
                print(f"Downloading photo with media_id: {media_id}")
                drone(download_media(media_id)).wait()
            else:
                print(f"Drone is none, cannot download photo with media_id: {media_id}")

# Global variable to hold the event listener
drone_event_listener = None

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

def get_olympe_thread_loop(drone):
    """
    Get the Olympe thread loop more robustly.
    This is a critical function to ensure flight commands run on the correct thread.
    """
    # For older versions of Olympe
    if hasattr(drone, "thread_loop"):
        return drone.thread_loop
    # For newer versions of Olympe
    elif hasattr(drone, "_thread_loop"):
        return drone._thread_loop
    # Check for scheduler-based thread loop
    elif hasattr(drone, "scheduler") and hasattr(drone.scheduler, "expectation_loop"):
        return drone.scheduler.expectation_loop
    # Get backend loop
    elif hasattr(drone, "backend") and hasattr(drone.backend, "_loop"):
        return drone.backend._loop
    # Last resort: try to find thread properties directly from the backend
    elif hasattr(drone, "backend") and hasattr(drone.backend, "_thread"):
        return drone.backend._thread
    # If all else fails, try to get the running loop from olympe
    else:
        try:
            # Import from Olympe directly to get the running loop
            from olympe.concurrent import get_running_loop
            return get_running_loop()
        except (ImportError, RuntimeError):
            pass
        
        raise RuntimeError("Cannot find Olympe thread loop on drone object")

def execute_flight_plan(waypoints, altitude, flight_mode="stable", start_point=None):
    """
    Execute a simplified flight plan for indoor testing in a background thread.
    """
    global drone
    execution_log = []
    success = False

    local_drone = drone

    if not local_drone or not drone_connected:
        logging.error("Drone is not connected - cannot execute flight plan")
        return {
            "success": False,
            "execution_log": [{"action": "error", "error": "Drone is not connected", "timestamp": datetime.datetime.now().isoformat()}],
            "flight_mode": "indoor_test"
        }

    # Use a threading.Event to signal completion
    result_container = {}
    done_event = threading.Event()

    def flight_worker():
        nonlocal success
        try:
            logging.info("Starting indoor test flight with simple commands...")
            execution_log.append({"action": "start_indoor_test", "timestamp": datetime.datetime.now().isoformat()})

            logging.info("Sending TakeOff command...")
            execution_log.append({"action": "takeoff", "timestamp": datetime.datetime.now().isoformat()})
            takeoff_future = local_drone(TakeOff())
            takeoff_result = takeoff_future.wait()

            if takeoff_result.success():
                logging.info("TakeOff command completed successfully")
            else:
                logging.warning(f"TakeOff command completed with status: {takeoff_result}")

            logging.info("Waiting briefly...")
            # Use eventlet.sleep if eventlet is used, else threading sleep
            try:
                import eventlet
                eventlet.sleep(3)
            except ImportError:
                time.sleep(3)

            if not drone_connected or local_drone is not drone:
                raise RuntimeError("Drone disconnected during flight")

            try:
                state = str(local_drone.get_state(FlyingStateChanged))
                logging.info(f"Current flight state: {state}")
                execution_log.append({"action": "state_check", "state": state, "timestamp": datetime.datetime.now().isoformat()})
            except Exception as e:
                logging.warning(f"Could not get flight state: {e}")

            logging.info("Sending Landing command...")
            execution_log.append({"action": "landing", "timestamp": datetime.datetime.now().isoformat()})

            if not drone_connected or local_drone is not drone:
                raise RuntimeError("Drone disconnected during flight")

            landing_future = local_drone(Landing())
            landing_result = landing_future.wait()

            if landing_result.success():
                logging.info("Landing command completed successfully")
            else:
                logging.warning(f"Landing command completed with status: {landing_result}")

            success = True
            logging.info("Indoor test flight completed successfully")
            execution_log.append({"action": "complete", "success": True, "timestamp": datetime.datetime.now().isoformat()})

            result_container.update({
                "success": success,
                "execution_log": execution_log,
                "flight_mode": "indoor_test"
            })
        except Exception as e:
            logging.error(f"Error during flight execution: {str(e)}")
            execution_log.append({"action": "error", "error": str(e), "timestamp": datetime.datetime.now().isoformat()})
            try:
                if drone_connected and drone is local_drone and local_drone is not None:
                    logging.info("Attempting emergency landing")
                    local_drone(Landing()).wait()
                else:
                    logging.warning("Cannot perform emergency landing: Drone is disconnected")
            except Exception as landing_err:
                logging.error(f"Emergency landing failed: {landing_err}")
            result_container.update({
                "success": False,
                "execution_log": execution_log,
                "error": str(e),
                "flight_mode": "indoor_test"
            })
        finally:
            done_event.set()

    # Start the flight worker in a background thread
    thread = threading.Thread(target=flight_worker, daemon=True)
    thread.start()
    # Wait for completion (non-blocking for main event loop)
    done_event.wait()
    return result_container

def execute_stable_flight_plan(waypoints, altitude, start_point=None):
    """
    Execute a stable flight plan with waypoint navigation and state expectations.
    Runs in a background thread and returns the result dict.
    """
    global drone, drone_connected
    execution_log = []
    success = False

    local_drone = drone
    result_container = {}
    done_event = threading.Event()

    def _do_flight():
        nonlocal execution_log, success
        try:
            if not local_drone or not drone_connected:
                raise ValueError("Drone is not connected")

            logging.info("Starting stable flight plan execution...")
            execution_log.append({"action": "start_mission", "timestamp": datetime.datetime.now().isoformat()})

            # Take off and wait for hovering
            logging.info("Taking off...")
            execution_log.append({"action": "takeoff", "timestamp": datetime.datetime.now().isoformat()})
            local_drone(
                TakeOff()
                >> FlyingStateChanged(state="hovering", _timeout=10)
            ).wait().success()

            # Ascend to mission altitude (relative move)
            logging.info(f"Ascending to mission altitude: {altitude}m...")
            execution_log.append({"action": "ascend", "altitude": altitude, "timestamp": datetime.datetime.now().isoformat()})
            local_drone(
                moveBy(0, 0, -altitude, 0)
                >> FlyingStateChanged(state="hovering", _timeout=10)
            ).wait().success()

            # Move to start point if provided (no photo)
            if start_point and isinstance(start_point, dict):
                lat = start_point.get("lat")
                lon = start_point.get("lon")
                if lat is not None and lon is not None:
                    logging.info(f"Moving to start point: ({lat}, {lon})")
                    execution_log.append({
                        "action": "move_to_start_point",
                        "lat": lat,
                        "lon": lon,
                        "timestamp": datetime.datetime.now().isoformat()
                    })
                    local_drone(
                        moveTo(lat, lon, altitude, MoveTo_Orientation_mode.TO_TARGET, 0.0)
                        >> moveToChanged(status=MoveToChanged_Status.DONE, _timeout=30)
                    ).wait().success()

            # Waypoint navigation (take photos at grid_center only)
            for i, waypoint in enumerate(waypoints):
                lat = waypoint["lat"]
                lon = waypoint["lon"]
                wp_type = waypoint.get("type", "unknown")

                logging.info(f"Moving to waypoint {i+1}/{len(waypoints)}: ({lat}, {lon})")
                execution_log.append({
                    "action": "move_to_waypoint",
                    "waypoint_num": i+1,
                    "lat": lat,
                    "lon": lon,
                    "type": wp_type,
                    "timestamp": datetime.datetime.now().isoformat()
                })

                local_drone(
                    moveTo(lat, lon, altitude, MoveTo_Orientation_mode.TO_TARGET, 0.0)
                    >> moveToChanged(status=MoveToChanged_Status.DONE, _timeout=30)
                ).wait().success()

                # Yaw correction (face north)
                local_drone(
                    moveBy(0, 0, 0, 0.0)  # 0.0 radians = 0 degrees, no movement, just yaw correction
                ).wait().success()

                logging.info(f"Taking photo at waypoint {i+1}")
                execution_log.append({
                    "action": "take_photo",
                    "waypoint_num": i+1,
                    "timestamp": datetime.datetime.now().isoformat()
                })
                drone(take_photo(cam_id=0)).wait()
                time.sleep(1)

            # Move back to start point if provided (no photo)
            if start_point and isinstance(start_point, dict):
                lat = start_point.get("lat")
                lon = start_point.get("lon")
                if lat is not None and lon is not None:
                    logging.info(f"Returning to start point: ({lat}, {lon})")
                    execution_log.append({
                        "action": "return_to_start_point",
                        "lat": lat,
                        "lon": lon,
                        "timestamp": datetime.datetime.now().isoformat()
                    })
                    local_drone(
                        moveTo(lat, lon, altitude, MoveTo_Orientation_mode.TO_TARGET, 0.0)
                        >> moveToChanged(status=MoveToChanged_Status.DONE, _timeout=30)
                    ).wait().success()

            logging.info("Landing...")
            execution_log.append({"action": "land", "timestamp": datetime.datetime.now().isoformat()})
            local_drone(
                Landing()
                >> FlyingStateChanged(state="landed", _timeout=20)
            ).wait().success()

            gimbal_up = drone(set_target(
                gimbal_id=0,
                control_mode="position",
                yaw_frame_of_reference="none",
                yaw=0.0,
                pitch_frame_of_reference="absolute",
                pitch=0.0,
                roll_frame_of_reference="none",
                roll=0.0,
                _timeout=5
            )).wait()
            if gimbal_up.success():
                print("Gimbal reset to 0° (forward) successfully.")
            elif gimbal_up.timedout():
                print("Gimbal reset to 0° timed out.")
            else:
                print("Gimbal reset to 0° failed.")

            success = True
            logging.info("Flight plan executed successfully")
            execution_log.append({"action": "complete", "success": True, "timestamp": datetime.datetime.now().isoformat()})

            result_container.update({
                "success": success,
                "execution_log": execution_log,
                "flight_mode": "stable"
            })
        except Exception as e:
            logging.error(f"Flight execution error: {str(e)}")
            execution_log.append({
                "action": "error",
                "error": str(e),
                "timestamp": datetime.datetime.now().isoformat()
            })
            result_container.update({
                "success": False,
                "execution_log": execution_log,
                "error": str(e),
                "flight_mode": "stable"
            })
        finally:
            done_event.set()

    thread = threading.Thread(target=_do_flight, daemon=True)
    thread.start()
    done_event.wait()
    return result_container

#############################
# Drone Connection Functions
#############################

def connect_to_drone():
    """Connect to the drone without waiting for GPS fix"""
    global drone, drone_connected, drone_event_listener
    global battery_percent, battery_percent_changed, drone_motion_state, motion_state_changed
    global DRONE_READY, drone_testing
    
    try:
        logging.info("Connecting to drone...")
        if drone is None:
            drone = olympe.Drone(DRONE_IP)
        
        # Log drone instance ID for debugging
        drone_id = id(drone)
        logging.info(f"Using drone instance ID: {drone_id}")
        
        # Connect to the drone
        drone.connect()
        logging.info(f"Connected to drone with ID {drone_id}")

        # Set gimbal to -90 before event listener
        gimbal_down = drone(set_target(
            gimbal_id=0,
            control_mode="position",
            yaw_frame_of_reference="none",
            yaw=0.0,
            pitch_frame_of_reference="absolute",
            pitch=-90.0,
            roll_frame_of_reference="none",
            roll=0.0,
            _timeout=5
        )).wait()
        if gimbal_down.success():
            logging.info("Gimbal set to -90° (downward) successfully.")
        elif gimbal_down.timedout():
            logging.warning("Gimbal set to -90° timed out.")
        else:
            logging.warning("Gimbal set to -90° failed.")

        time.sleep(1)

        drone(set_camera_mode(cam_id=0, value=camera_mode.photo)).wait()

        drone(set_photo_mode(
            cam_id=0,
            mode=photo_mode.single,
            format=photo_format.rectilinear,
            file_format=photo_file_format.jpeg,
            burst=0,
            bracketing=0,
            capture_interval=0.0
        )).wait()

        # Initialize the event listener
        drone_event_listener = DroneEventListener(drone)
        drone_event_listener.__enter__()
        
        # Poll the battery state immediately to avoid showing "Unknown"
        try:
            battery_state = drone.get_state(BatteryStateChanged)
            if battery_state and "percent" in battery_state:
                battery_percent = battery_state["percent"]
                battery_percent_changed = True
                logging.info(f"Initial battery level: {battery_percent}%")
        except Exception as be:
            logging.warning(f"Could not get initial battery state: {be}")
            
        # Poll the motion state immediately to avoid showing "Unknown"
        try:
            motion_state = drone.get_state(MotionState)
            if motion_state and "state" in motion_state:
                raw_state = str(motion_state["state"])
                new_state = raw_state.split('.')[-1].lower()
                drone_motion_state = new_state
                motion_state_changed = True
                logging.info(f"Initial motion state: {drone_motion_state}")
        except Exception as me:
            logging.warning(f"Could not get initial motion state: {me}")
        
        drone_connected = True
        logging.info(f"Successfully connected to drone instance {drone_id}")
        
        # Force enable testing mode for indoor use
        drone_testing = False
        logging.info("Indoor testing mode enabled - GPS simulation active")
        
        # Set DRONE_READY to true for indoor testing
        DRONE_READY = True
        
        # Initialize GPS data immediately for indoor testing
        # update_gps_data_testing()
        
        return {"success": True, "message": f"Connected to drone (indoor testing mode) - ID: {drone_id}"}
    except Exception as e:
        if drone:
            try:
                drone.disconnect()
            except:
                pass
        drone = None
        drone_connected = False
        drone_event_listener = None
        logging.error(f"Failed to connect to drone: {str(e)}")
        return {"success": False, "error": str(e)}

def disconnect_from_drone():
    """Disconnect from the drone"""
    global drone, drone_connected, gps_fix_established, drone_event_listener
    
    # Log the drone instance before disconnecting
    if drone:
        drone_id = id(drone)
        logging.info(f"Disconnecting from drone instance {drone_id}...")
    
    try:
        if drone_event_listener:
            try:
                # Clean up the event listener
                drone_event_listener.__exit__(None, None, None)
            except:
                pass
            drone_event_listener = None
            
        if drone:
            drone.disconnect()
            logging.info("Drone disconnected successfully")
        
        drone_connected = False
        gps_fix_established = False
        # Set drone to None AFTER updating connection status
        drone = None
        logging.info("Disconnected from drone")
        return {"success": True, "message": "Disconnected from drone"}
    except Exception as e:
        logging.error(f"Error disconnecting from drone: {str(e)}")
        return {"success": False, "error": str(e)}

# Remove the old polling methods:
# - update_gps_data()
# - update_motion_state()
# - update_battery_state()

# Keep update_gps_data_testing() for testing purposes
def update_gps_data_testing():
    """Emit fixed test GPS coordinates for indoor testing."""
    global gps_data, sio, gps_data_changed
    global DRONE_READY

    DRONE_READY = True  # Set ready for testing

    # Add a small random variation to make it look like the drone is moving a bit
    lat_variation = (random.random() - 0.5) * 0.00002  # Small random latitude variation
    lon_variation = (random.random() - 0.5) * 0.00002  # Small random longitude variation
    
    gps_data["latitude"] = 57.012895 + lat_variation
    gps_data["longitude"] = 9.992844 + lon_variation
    gps_data["altitude"] = 20.0

    # Mark as changed so it gets emitted
    gps_data_changed = True
    
    logging.debug(f"Updated simulated GPS data: lat={gps_data['latitude']:.6f}, lon={gps_data['longitude']:.6f}")
    
    return gps_data

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
        # Updated to use global state instead of calling update_gps_data()
        position = {
            "latitude": gps_data["latitude"],
            "longitude": gps_data["longitude"],
            "altitude": gps_data["altitude"]
        }
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
        # Remove start/end points from path and return separately
        path = result["path"]
        start_point = None
        if path and len(path) >= 2 and path[0].get("type") == "start_end" and path[-1].get("type") == "start_end":
            start_point = path[0]
            # Remove first and last (start/end) from path
            path = path[1:-1]
        result["waypoints"] = path
        result["start_point"] = start_point
        # Remove the old "path" key to avoid confusion
        result.pop("path", None)
        return result
    except Exception as e:
        logging.error(f"Grid calculation error: {str(e)}")
        return {"error": str(e)}

@sio.on('execute_flight')
def handle_flight_execution(sid, data):
    # For indoor testing, always consider the drone ready
    global DRONE_READY, drone_testing, drone
    
    if drone_testing:
        DRONE_READY = True
    
    if not DRONE_READY:
        sio.emit('flight_log', {'action': 'Error', 'message': "Drone is not ready. Wait for valid GPS coordinates before executing flight."})
        return {"error": "Drone is not ready. Wait for valid GPS coordinates before executing flight."}

    # Verify drone instance
    if not drone:
        sio.emit('flight_log', {'action': 'Error', 'message': "No drone instance available"})
        return {"error": "No drone instance available"}
    
    drone_id = id(drone)
    logging.info(f"Executing flight with drone instance {drone_id}")

    # Accept start_point from data
    start_point = data.get('start_point')

    def flight_thread():
        try:
            # Re-verify drone instance in thread
            if drone is None:
                raise ValueError("Drone instance is None in flight thread")
            
            thread_drone_id = id(drone)
            logging.info(f"Flight thread using drone instance {thread_drone_id}")
            
            # Verify connection
            if not drone_connected:
                raise ValueError("Drone is not connected")
            
            # Emit start log
            sio.start_background_task(sio.emit, 'flight_log', {'action': 'Started', 'message': f"Indoor test flight started with drone {thread_drone_id}"})
            
            flight_mode = data.get('flight_mode', 'stable')
            waypoints = data['waypoints']
            altitude = float(data['altitude'])
            if flight_mode == "stable":
                result = execute_stable_flight_plan(
                    waypoints=waypoints,
                    altitude=altitude,
                    start_point=start_point
                )
            else:
                result = execute_flight_plan(
                    waypoints=waypoints,
                    altitude=altitude,
                    flight_mode=flight_mode,
                    start_point=start_point
                )
            
            # Emit each log entry
            for log in result['execution_log']:
                sio.start_background_task(sio.emit, 'flight_log', {'action': log['action'], 'message': str(log)})
            
            # Emit completion
            sio.start_background_task(sio.emit, 'flight_result', result)
            
        except Exception as e:
            logging.error(f"Flight execution error: {str(e)}")
            sio.start_background_task(sio.emit, 'flight_log', {'action': 'Error', 'message': str(e)})
            sio.start_background_task(sio.emit, 'flight_result', {"error": str(e)})

    # Start the flight execution in a real thread 
    thread = threading.Thread(target=flight_thread, daemon=True)
    thread.start()

    # Return immediately so the eventlet worker is not blocked
    return {"status": f"{flight_mode} flight started with drone {drone_id}"}

import random

def start_background_tasks():
    """Start background tasks using eventlet's spawn_n for true async compatibility, with different intervals."""
    def background_loop():
        global gps_data_changed, motion_state_changed, battery_percent_changed
        global drone_testing
        
        logging.info("Background task started (eventlet)")

        # Counter for GPS updates (to avoid flooding logs)
        gps_update_counter = 0

        while True:
            try:
                if drone_connected:
                    # Only use simulated GPS data if in testing mode
                    if drone_testing:
                        gps_update_counter += 1
                        if gps_update_counter % 10 == 0:
                            logging.info("Updating simulated GPS coordinates for indoor testing")
                        update_gps_data_testing()
                    # If not in testing mode, rely on GPS data from the event listener (do not call update_gps_data_testing)
                    
                    # Check for GPS data changes and emit if changed
                    if gps_data_changed:
                        emit_data = {
                            "latitude": float(gps_data["latitude"]),
                            "longitude": float(gps_data["longitude"]),
                            "altitude": float(gps_data["altitude"])
                        }
                        sio.emit('gps_update', emit_data, skip_sid=None)
                        gps_data_changed = False  # Reset the flag
                    
                    # Check for motion state changes and emit if changed
                    if motion_state_changed:
                        logging.info(f"Background: emitting motion state update: {drone_motion_state}")
                        sio.emit('drone_state', {"motion_state": drone_motion_state}, skip_sid=None)
                        sio.emit('motion_update', {
                            'motion_state': drone_motion_state
                        }, skip_sid=None)
                        motion_state_changed = False  # Reset the flag
                    
                    # Check for battery updates and emit if changed
                    if battery_percent_changed:
                        logging.info(f"Background: emitting battery update: {battery_percent}%")
                        sio.emit('battery_update', {"battery_percent": battery_percent}, skip_sid=None)
                        battery_percent_changed = False  # Reset the flag
                else:
                    logging.debug("Background: drone not connected, skipping update")
                
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