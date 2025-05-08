#!/usr/bin/env python3

# Standard library imports
import datetime
import logging
import math
import os
import queue
import threading
import time
import base64
from io import BytesIO
import json

# Third-party imports
import cv2
import eventlet
import socketio
from shapely.geometry import Polygon
from ultralytics import YOLO

# Olympe imports
import olympe
from olympe.messages.ardrone3.PilotingState import PositionChanged, FlyingStateChanged, moveToChanged, MotionState
from olympe.messages.ardrone3.Piloting import TakeOff, Landing, moveTo, moveBy
from olympe.messages.ardrone3.GPSSettingsState import GPSFixStateChanged
from olympe.enums.ardrone3.Piloting import MoveTo_Orientation_mode
from olympe.enums.ardrone3.PilotingState import MoveToChanged_Status
from olympe.messages.common.CommonState import BatteryStateChanged
from olympe.messages.gimbal import set_target
from olympe.messages.camera import photo_progress
from olympe.media import download_media
from olympe.messages.camera import set_camera_mode, set_photo_mode, take_photo
from olympe.enums.camera import camera_mode, photo_mode, photo_format, photo_file_format

# Own module imports
from algorithm import grid_based_algorithm

# Configuration imports
from config import SIMULATION_MODE, MODEL_NAME, DRONE_IP, SIMULATION_IP, DEFAULT_HOST, DEFAULT_PORT, OUTPUT_LOG

#############################
# Constants and Global Variables
#############################

# Socket.IO server and WSGI app
sio = socketio.Server(cors_allowed_origins="*")
application = socketio.WSGIApp(sio)

# Global state
drone = None
drone_connected = False
gps_fix_established = False
DRONE_READY = False
Emergency = False

# Drone telemetry
gps_data = {
    "latitude": 0,
    "longitude": 0,
    "altitude": 0
}
drone_motion_state = "unknown"
battery_percent = 0

# Change tracking flags
gps_data_changed = False
motion_state_changed = False
battery_percent_changed = False

# Background threads
background_thread = None

# Mission/photo state
photo_queue = queue.Queue()
photo_waypoints = []  # Will be filled with waypoints for the current mission
photo_index = 0       # Index of the next waypoint to match

# Queues for background emission
photo_emit_queue = queue.Queue()
flight_log_queue = queue.Queue()

# Flight log
current_flight_log = []

# Mission data
mission_data = None

# Load YOLOv8 model once (assumes best.pt is next to this file)
model = YOLO(os.path.join(os.path.dirname(__file__), "models/", MODEL_NAME))

# Add a custom filter class to filter out noisy olympe logs
class OlympeLogFilter(logging.Filter):
    """
    Filter to remove noisy log messages from olympe loggers.
    """
    def __init__(self):
        super().__init__()
        # List of patterns to ignore in log messages
        self.unwanted_patterns = [
            'ardrone3.GPSSettingsState.GeofenceCenterChanged',
            'ardrone3.GPSState.NumberOfSatelliteChanged',
            'common.CommonState.LinkSignalQuality',
            'wifi.rssi_changed',
            'ardrone3.PilotingState.HeadingLockedStateChanged',
            'common.MavlinkState.MavlinkFilePlayingStateChanged',
            'common.FlightPlanState.ComponentStateListChanged',
            'common.FlightPlanState.AvailabilityStateChanged',
            'follow_me.mode_info',
            '_send_command_impl',
            '_recv_cmd_cb',
            'camera.camera_capabilities',
            'camera.recording_capabilities',
            'camera.photo_capabilities',
            'Link quality:',
            'has been sent to the device',
            'wifi.rssi_changed',
            'gimbal.relative_attitude_bounds',
            'gimbal.absolute_attitude_bounds',
            'camera.exposure_settings',
            'battery.alert',
            'ardrone3.GPSSettingsState',
            'ardrone3.SettingsState',
            'skyctrl.SettingsState',
            'Connected to device',
            'Connection in progress',
            'Creating pomp loop',
        ]

    def filter(self, record):
        """
        Return False if the record contains any unwanted pattern,
        otherwise return True to allow the message.
        """
        message = record.getMessage()
        for pattern in self.unwanted_patterns:
            if pattern in message:
                return False
        return True

# Configure logging
logging.basicConfig(level=logging.INFO)

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
            if new_state == "emergency":
                global Emergency
                Emergency = True
                logging.error("Emergency state detected, aborting flight")
        except Exception as e:
            logging.error(f"Error in flying state handler: {str(e)}")

    @olympe.listen_event(photo_progress(_policy='wait'))
    def on_photo_progress(self, event, scheduler):
        print(f"Photo event received: {event.args}")
        result = event.args.get('result')
        if hasattr(result, "name") and result.name == 'photo_saved':
            media_id = event.args['media_id']
            if drone is not None:
                os.makedirs("photos", exist_ok=True)
                print(f"Local path: {os.path.abspath('photos')}")
                drone.media.download_dir = "photos"
                print(f"Downloading photo with media_id: {media_id}")
                # Download the media and get the MediaInfo object
                media_download = drone(download_media(media_id)).wait()
                # Log filenames of all resources in this media
                try:
                    media_info = drone.media.media_info(media_id)
                    if media_info and hasattr(media_info, "resources"):
                        for resource in media_info.resources.values():
                            # Prefer resource.path, fallback to url
                            filename = os.path.basename(resource.path) if resource.path else os.path.basename(resource.url)
                            print(f"Downloaded photo filename: {filename}")
                            # Add filename to the photo queue for background processing
                            photo_queue.put(filename)
                except Exception as e:
                    print(f"Could not log photo filenames: {e}")
            else:
                print(f"Drone is none, cannot download photo with media_id: {media_id}")

# Global variable to hold the event listener
drone_event_listener = None

#############################
# Algorithm functionality
#############################

def run_path_algorithm(coordinates, altitude, overlap, coverage, start_point=None, drone_start_point=None):
    """Run the path algorithm"""
    # Convert coverage to internal format
    coverage = coverage / 100

    # Validate inputs
    if not coordinates or len(coordinates) < 3:
        raise ValueError("At least 3 coordinates are required")
    if altitude <= 0 or altitude > 40:
        raise ValueError("Altitude must be between 0 and 40 meters")
    if not (0 <= overlap <= 100):
        raise ValueError("Overlap percentage must be between 0 and 100")
    
    # Calculate grid and flight path
    result = grid_based_algorithm(coordinates, altitude, overlap, coverage, start_point, drone_start_point)

    # Return the result
    return result

#############################
# Flight Executor Functions
#############################

def execute_stable_flight_plan(waypoints, altitude, start_point=None, drone_start_point=None):
    """
    Execute a stable flight plan with waypoint navigation and state expectations.
    Runs in a background thread and returns the result dict.
    """
    global drone, drone_connected
    global photo_waypoints, photo_index
    execution_log = []
    success = False

    # Set up the waypoints for photo/filename matching
    photo_waypoints = waypoints.copy() if waypoints else []
    photo_index = 0

    local_drone = drone
    result_container = {}
    done_event = threading.Event()

    def log_flight(action, **kwargs):
        log_entry = {"action": action, "timestamp": datetime.datetime.now().isoformat(), **kwargs}
        execution_log.append(log_entry)
        # Put log into the flight_log_queue for background emission
        flight_log_queue.put(log_entry)

    def calculate_heading(lat1, lon1, lat2, lon2):
        """Calculate heading from (lat1, lon1) to (lat2, lon2) in degrees."""
        dLon = math.radians(lon2 - lon1)
        y = math.sin(dLon) * math.cos(math.radians(lat2))
        x = math.cos(math.radians(lat1)) * math.sin(math.radians(lat2)) - \
            math.sin(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.cos(dLon)
        brng = math.atan2(y, x)
        brng = math.degrees(brng)
        return (brng + 360) % 360    

    def _do_flight():
        nonlocal execution_log, success

        # Function to handle emergency state
        def emergency_func():
            print("Emergency state detected, aborting flight")
            log_flight("emergency_abort", error="Emergency state detected, aborting flight")
            result_container.update({
                "success": False,
                "execution_log": execution_log,
                "error": "Emergency state detected, flight aborted",
                "flight_mode": "stable"
            })
            done_event.set()
            return
        
        # Begin flight
        try:
            if Emergency:
                return emergency_func()
            
            if not local_drone or not drone_connected:
                log_flight("error", error="Drone is not connected")
                result_container.update({
                    "success": False,
                    "execution_log": execution_log,
                    "error": "Drone is not connected",
                    "flight_mode": "stable"
                })
                done_event.set()
                return

            log_flight("start_mission")
            # Take off and wait for hovering
            log_flight("takeoff")
            local_drone(
                TakeOff()
                >> FlyingStateChanged(state="hovering", _timeout=10)
            ).wait().success()
            if Emergency:
                return emergency_func()

            # Ascend to mission altitude (relative move)
            log_flight("ascend", altitude=altitude)
            local_drone(
                moveBy(0, 0, -altitude, 0)
                >> FlyingStateChanged(state="hovering", _timeout=10)
            ).wait().success()
            if Emergency:
                return emergency_func()

            # Move to start_point if provided and different from drone_start_point (no photo)
            if start_point and isinstance(start_point, dict):
                start_lat = start_point.get("lat")
                start_lon = start_point.get("lon")
                drone_lat = drone_start_point.get("lat") if drone_start_point else None
                drone_lon = drone_start_point.get("lon") if drone_start_point else None
                # Only move if start_point is different from drone_start_point
                if (start_lat is not None and start_lon is not None and
                    (drone_lat is None or drone_lon is None or start_lat != drone_lat or start_lon != drone_lon)):
                    log_flight("move_to_start_point", lat=start_lat, lon=start_lon)
                    local_drone(
                        moveTo(start_lat, start_lon, altitude, MoveTo_Orientation_mode.TO_TARGET, 0.0)
                        >> moveToChanged(status=MoveToChanged_Status.DONE, _timeout=30)
                    ).wait().success()
                else:
                    print("Start point is the same as drone start point, skipping initial move.")
            else:
                print("No start point provided, skipping initial move.")
            if Emergency:
                return emergency_func()

            # Waypoint navigation (take photos at grid_center only)
            for i, waypoint in enumerate(waypoints):
                if Emergency:
                    return emergency_func()
                lat = waypoint["lat"]
                lon = waypoint["lon"]
                rotation = waypoint.get("rotation", 0.0)
                wp_type = waypoint.get("type", "unknown")

                log_flight("move_to_waypoint", waypoint_num=i+1, lat=lat, lon=lon, type=wp_type)
                # Move to waypoint using TO_TARGET (drone faces direction of travel)
                local_drone(
                    moveTo(lat, lon, altitude, MoveTo_Orientation_mode.TO_TARGET, 0.0)
                    >> moveToChanged(status=MoveToChanged_Status.DONE, _timeout=30)
                ).wait().success()

                # Rotate drone to face the specified rotation
                log_flight("rotate_drone", waypoint_num=i+1)
                local_drone(
                    moveTo(lat, lon, altitude, MoveTo_Orientation_mode.HEADING_START, rotation)
                    >> moveToChanged(status=MoveToChanged_Status.DONE, _timeout=10)
                ).wait().success()

                log_flight("take_photo", waypoint_num=i+1)
                drone(take_photo(cam_id=0)).wait()
                time.sleep(2)  # Wait for photo to be taken

                # Rotate to face the next waypoint (except for the last)
                if i < len(waypoints) - 1:
                    next_lat = waypoints[i+1]["lat"]
                    next_lon = waypoints[i+1]["lon"]
                    heading = calculate_heading(lat, lon, next_lat, next_lon)
                    log_flight("rotate_to_next", waypoint_num=i+1, heading=heading)
                    local_drone(
                        moveTo(lat, lon, altitude, MoveTo_Orientation_mode.HEADING_START, heading)
                        >> moveToChanged(status=MoveToChanged_Status.DONE, _timeout=10)
                    ).wait().success()


            # Move back to drone_start_point if provided (no photo)
            if drone_start_point and isinstance(drone_start_point, dict):
                lat = drone_start_point.get("lat")
                lon = drone_start_point.get("lon")
                if lat is not None and lon is not None:
                    log_flight("return_to_drone_start_point", lat=lat, lon=lon)
                    local_drone(
                        moveTo(lat, lon, altitude, MoveTo_Orientation_mode.TO_TARGET, 0.0)
                        >> moveToChanged(status=MoveToChanged_Status.DONE, _timeout=30)
                    ).wait().success()
            if Emergency:
                return emergency_func()

            log_flight("land")
            local_drone(
                Landing()
                >> FlyingStateChanged(state="landed", _timeout=20)
            ).wait().success()
            if Emergency:
                return emergency_func()

            success = True
            log_flight("complete", success=True)

            result_container.update({
                "success": success,
                "execution_log": execution_log,
                "flight_mode": "stable"
            })
        except Exception as e:
            log_flight("error", error=str(e))
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

def photo_background_worker():
    """
    Background worker that matches photo filenames to waypoints,
    runs each through YOLOv8, emits annotated or raw photo plus `detected`.
    """
    global photo_index, photo_waypoints

    try:
        from PIL import Image
    except ImportError:
        Image = None

    while True:
        try:
            filename = photo_queue.get(timeout=1)
            if photo_index < len(photo_waypoints):
                wp = photo_waypoints[photo_index]
                lat, lon = wp.get("lat"), wp.get("lon")
                # Filenames
                base_filename = f"{photo_index + 1}.jpg"
                detected_filename = f"{photo_index + 1}_detected.jpg"
                photo_path = os.path.join("photos", filename)
                base_photo_path = os.path.join("photos", base_filename)
                detected_photo_path = os.path.join("photos", detected_filename)
                detected = False
                photo_data = None
                try:
                    # Always save the original as {waypoint_index}.jpg
                    img_cv = cv2.imread(photo_path)
                    if Image is not None:
                        with Image.open(photo_path) as img:
                            img.convert("RGB").save(base_photo_path, format="JPEG", quality=90, optimize=True)
                    else:
                        cv2.imwrite(base_photo_path, img_cv)

                    results = model(img_cv)
                    boxes = getattr(results[0], "boxes", None)
                    if boxes and len(boxes) > 0:
                        detected = True
                        # Annotate and save as {waypoint_index}_detected.jpg
                        annotated = results[0].plot()
                        annotated_rgb = cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB)
                        if Image is not None:
                            pil_img = Image.fromarray(annotated_rgb)
                            buf = BytesIO()
                            pil_img.save(buf, format="JPEG", quality=30, optimize=True)
                            photo_bytes = buf.getvalue()
                            pil_img.save(detected_photo_path, format="JPEG", quality=90, optimize=True)
                        else:
                            _, photo_bytes = cv2.imencode('.jpg', annotated, [int(cv2.IMWRITE_JPEG_QUALITY),30])
                            photo_bytes = photo_bytes.tobytes()
                            cv2.imwrite(detected_photo_path, annotated)
                        photo_data = base64.b64encode(photo_bytes).decode("utf-8")
                        emit_filename = detected_filename
                    else:
                        # No detection, emit the original
                        with open(base_photo_path, "rb") as f:
                            photo_bytes = f.read()
                        photo_data = base64.b64encode(photo_bytes).decode("utf-8")
                        emit_filename = base_filename

                    # Remove the original downloaded file if different
                    if filename != base_filename and os.path.exists(photo_path):
                        os.remove(photo_path)
                except Exception as e:
                    print(f"Could not process photo file {photo_path}: {e}")
                    # Fallback to raw file
                    with open(photo_path, "rb") as f:
                        raw = f.read()
                    photo_data = base64.b64encode(raw).decode("utf-8")
                    emit_filename = filename

                # Emit with detection flag and correct filename
                photo_emit_queue.put({
                    "filename": emit_filename,
                    "lat": lat,
                    "lon": lon,
                    "photo_base64": photo_data,
                    "index": photo_index,
                    "detected": detected
                })
                print(f"photo: {emit_filename} at {lat},{lon} detected={detected}")
                photo_index += 1
            else:
                print(f"photo: {filename} taken at (unknown waypoint)")
        except queue.Empty:
            time.sleep(0.1)
            continue

#############################
# Drone Connection Functions
#############################

def connect_to_drone():
    """Connect to the drone without waiting for GPS fix"""
    global drone, drone_connected, drone_event_listener
    global battery_percent, battery_percent_changed, drone_motion_state, motion_state_changed
    global DRONE_READY
    
    try:
        logging.info("Connecting to drone...")
        # Select IP based on simulation mode
        drone_ip = SIMULATION_IP if SIMULATION_MODE else DRONE_IP
        if drone is None:
            drone = olympe.Drone(drone_ip)
            
        # Log drone instance ID for debugging
        drone_id = id(drone)
        logging.info(f"Using drone instance ID: {drone_id}")
        
        # Connect to the drone
        drone.connect()

        time.sleep(2)

        if SIMULATION_MODE:
            # In simulation, check direct connection state
            connected = drone.connection_state() or getattr(drone, "is_connected", lambda: False)()
        else:
            # Real drone: check via drone_manager
            state = drone.get_state(olympe.messages.drone_manager.connection_state)
            conn_state = state.get("state") if state else None
            if conn_state and (str(conn_state).endswith("connected") or getattr(conn_state, "name", "") == "connected"):
                connected = True

        if not connected:
            logging.error("Drone manager did not report connected within timeout")
            drone.disconnect()
            drone = None
            drone_connected = False
            return {"success": False, "error": "Drone manager did not report connected within timeout"}

        logging.info(f"Connected to drone with ID {drone_id}")

        if OUTPUT_LOG:
            # Apply log filter to olympe loggers to reduce noise
            olympe_loggers = [logging.getLogger(f"olympe.{name}") for name in 
                                ["backend", "drone", "scheduler", "media", "pdraw"]]
            olympe_filter = OlympeLogFilter()
            for logger in olympe_loggers:
                logger.addFilter(olympe_filter)
                
            # You can also set specific olympe loggers to a higher level to suppress more messages
            logging.getLogger("olympe").setLevel(logging.WARNING)

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
        
        # Set DRONE_READY to true
        DRONE_READY = True

        # Start the photo background worker if not already running
        global photo_worker_thread
        if 'photo_worker_thread' not in globals() or not photo_worker_thread.is_alive():
            import threading
            photo_worker_thread = threading.Thread(target=photo_background_worker, daemon=True)
            photo_worker_thread.start()
        
        return {"success": True, "message": f"Connected to drone - ID: {drone_id}"}
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

@sio.on('get_completed_missions')
def handle_get_completed_missions(sid, data):
    """
    Returns a list of mission folder names (strings) inside the missions directory.
    """
    missions_dir = os.path.join(os.path.dirname(__file__), "missions")
    try:
        if not os.path.exists(missions_dir):
            return {"missions": []}
        # Only include directories
        missions = [
            name for name in os.listdir(missions_dir)
            if os.path.isdir(os.path.join(missions_dir, name))
        ]
        return {"missions": missions}
    except Exception as e:
        return {"error": str(e)}

@sio.on('get_completed_mission_data')
def handle_get_completed_mission_data(sid, data):
    """
    Returns all images (as base64) and the log.json data for a given mission.
    Expects data = {"mission": "<folder_name>"}
    """
    import base64

    mission_name = data.get("mission")
    if not mission_name:
        return {"error": "No mission specified."}

    missions_dir = os.path.join(os.path.dirname(__file__), "missions")
    mission_path = os.path.join(missions_dir, mission_name)
    if not os.path.isdir(mission_path):
        return {"error": "Mission folder does not exist."}

    # Gather images
    images = []
    for fname in os.listdir(mission_path):
        if fname.lower().endswith(".jpg"):
            img_path = os.path.join(mission_path, fname)
            try:
                with open(img_path, "rb") as f:
                    img_b64 = base64.b64encode(f.read()).decode("utf-8")
                images.append({
                    "filename": fname,
                    "base64": img_b64
                })
            except Exception as e:
                images.append({
                    "filename": fname,
                    "error": str(e)
                })

    # Load log.json
    log_path = os.path.join(mission_path, "log.json")
    log_data = None
    if os.path.isfile(log_path):
        try:
            with open(log_path, "r") as f:
                log_data = json.load(f)
        except Exception as e:
            log_data = {"error": str(e)}

    # Load mission.json
    mission_json_path = os.path.join(mission_path, "mission.json")
    mission_json_data = None
    if os.path.isfile(mission_json_path):
        try:
            with open(mission_json_path, "r") as f:
                mission_json_data = json.load(f)
        except Exception as e:
            mission_json_data = {"error": str(e)}

    return {
        "images": images,
        "log": log_data,
        "mission": mission_json_data
    }

@sio.on('calculate_grid')
def handle_calculate_grid(sid, data):
    if not DRONE_READY:
        return {"error": "Drone is not ready. Wait for valid GPS coordinates before calculating grid."}
    try:
        result = run_path_algorithm(
            coordinates=data['coordinates'],
            altitude=float(data['altitude']),
            overlap=float(data['overlap']),
            coverage=float(data['coverage']),
            start_point=data.get('start_point'), # Optional start point
            drone_start_point=data.get('drone_start_point'),
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

        # --- Fix: Ensure drone_start_point is always an object with lat/lon keys ---
        drone_start_point = result.get("metadata", {}).get("drone_start_point")
        if isinstance(drone_start_point, (list, tuple)) and len(drone_start_point) == 2:
            result["drone_start_point"] = {
                "lat": drone_start_point[0],
                "lon": drone_start_point[1]
            }
        elif isinstance(drone_start_point, dict):
            result["drone_start_point"] = {
                "lat": drone_start_point.get("lat"),
                "lon": drone_start_point.get("lon")
            }
        else:
            result["drone_start_point"] = None
        # --------------------------------------------------------------------------

        # Remove the old "path" key to avoid confusion
        result.pop("path", None)
        return result
    except Exception as e:
        logging.error(f"Grid calculation error: {str(e)}")
        return {"error": str(e)}

@sio.on('execute_flight')
def handle_flight_execution(sid, data):
    # For indoor testing, always consider the drone ready
    global DRONE_READY, drone, mission_data
    
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
    drone_start_point = data.get('drone_start_point')
    waypoints = data['waypoints']
    altitude = float(data['altitude'])

    # Store mission data globally for later saving
    mission_data = data.copy()

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

            result = execute_stable_flight_plan(
                waypoints=waypoints,
                altitude=altitude,
                start_point=start_point,
                drone_start_point=drone_start_point
            )

            # Remove per-log emission here; logs are now emitted from background_loop
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
        
        logging.info("Background task started (eventlet)")

        while True:
            try:
                if drone_connected:                    
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

                    # Emit photo updates from photo_emit_queue
                    try:
                        while True:
                            photo_update = photo_emit_queue.get_nowait()
                            sio.emit("photo_update", photo_update, skip_sid=None)
                    except queue.Empty:
                        pass

                    # Emit flight logs from flight_log_queue
                    try:
                        while True:
                            flight_log = flight_log_queue.get_nowait()
                            sio.emit("flight_log", flight_log, skip_sid=None)
                            # --- Track the log in memory ---
                            current_flight_log.append(flight_log)
                            # --- If this is the "complete" log, save the log to missions/{timestamp}/log.json ---
                            if (
                                flight_log.get("action") == "complete"
                                and flight_log.get("success") is True
                            ):
                                import json, os, shutil
                                timestamp = flight_log.get("timestamp", "").replace(":", "-")
                                mission_dir = os.path.join("missions", timestamp)
                                os.makedirs(mission_dir, exist_ok=True)
                                log_path = os.path.join(mission_dir, "log.json")
                                with open(log_path, "w") as f:
                                    json.dump(current_flight_log, f, indent=2)
                                print(f"Flight log saved to {log_path}")
                                # Save mission_data as mission.json
                                global mission_data
                                if mission_data is not None:
                                    mission_json_path = os.path.join(mission_dir, "mission.json")
                                    with open(mission_json_path, "w") as f:
                                        json.dump(mission_data, f, indent=2)
                                    print(f"Mission data saved to {mission_json_path}")
                                # Move all photos to the mission folder
                                photos_dir = "photos"
                                for filename in os.listdir(photos_dir):
                                    src = os.path.join(photos_dir, filename)
                                    dst = os.path.join(mission_dir, filename)
                                    if os.path.isfile(src):
                                        shutil.move(src, dst)
                                print(f"Moved all photos to {mission_dir}")
                                # Optionally, clear the log for the next mission
                                current_flight_log.clear()
                                # Optionally, clear mission_data for the next mission
                                mission_data = None
                    except queue.Empty:
                        pass
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
