from olympe import Anafi
from olympe.messages.ardrone3.Piloting import TakeOff, Landing, moveTo, moveBy
from olympe.messages.ardrone3.PilotingState import FlyingStateChanged, moveToChanged
from olympe.messages.ardrone3.GPSSettingsState import GPSFixStateChanged
from olympe.enums.ardrone3.Piloting import MoveTo_Orientation_mode
from olympe.enums.ardrone3.PilotingState import MoveToChanged_Status
from config import DRONE_IP
import datetime
import logging
import time

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
    drone = Anafi(DRONE_IP)
    execution_log = []
    success = False
    
    try:
        logging.info("Connecting to drone...")
        execution_log.append({"action": "connect", "timestamp": datetime.datetime.now().isoformat()})
        drone.connect()
        
        # Wait for GPS fix
        logging.info("Waiting for GPS fix...")
        execution_log.append({"action": "gps_fix_wait", "timestamp": datetime.datetime.now().isoformat()})
        drone(GPSFixStateChanged(fixed=1, _timeout=30)).wait().success()

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
    
    finally:
        drone.disconnect()
    
    return {
        "success": success,
        "execution_log": execution_log,
        "flight_mode": "stable"
    }

def execute_rapid_flight_plan(waypoints, altitude):
    """Execute flight plan with the drone in rapid mode (continuous flight without stops)"""
    drone = Anafi(DRONE_IP)
    execution_log = []
    success = False
    
    try:
        logging.info("Connecting to drone in RAPID mode...")
        execution_log.append({"action": "connect", "mode": "rapid", "timestamp": datetime.datetime.now().isoformat()})
        drone.connect()
        
        # Wait for GPS fix
        logging.info("Waiting for GPS fix...")
        execution_log.append({"action": "gps_fix_wait", "timestamp": datetime.datetime.now().isoformat()})
        drone(GPSFixStateChanged(fixed=1, _timeout=30)).wait().success()

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
            # We use a non-blocking call
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
                # No delay, but we could add a short one if photos require a small pause
                # time.sleep(0.2)  # Much shorter pause if needed
            
            # Add a very small delay to allow the drone to process the next command
            # but not enough to significantly slow down the mission
            time.sleep(0.1)
        
        # Return to home and land
        logging.info("Returning to starting point...")
        execution_log.append({"action": "return_home", "timestamp": datetime.datetime.now().isoformat()})
        
        # For landing, we should wait for the drone to be near the landing point
        # Wait for the drone to reach close to the starting point
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
    
    finally:
        drone.disconnect()
    
    return {
        "success": success,
        "execution_log": execution_log,
        "flight_mode": "rapid"
    }
