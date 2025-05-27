from flask import Flask, request
from flask_socketio import SocketIO, emit
import olympe
from olympe.messages.ardrone3.Piloting import TakeOff, Landing, moveBy
from olympe.messages.ardrone3.PilotingState import (
    FlyingStateChanged,
    AlertStateChanged,
    NavigateHomeStateChanged,
    PositionChanged,
)

from olympe.messages.common.CommonState import BatteryStateChanged
from olympe.messages.ardrone3.PilotingState import AttitudeChanged, SpeedChanged
from olympe.messages.ardrone3.GPSSettingsState import GPSFixStateChanged
import json
import threading
import time
import os
from datetime import datetime

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

DRONE_IP = "192.168.42.1"

drone = None
socketio_lock = threading.Lock()
active_client_sid = None
is_drone_connected = False
connection_error = None

# -----------------------------------------------------------------------------
# Logging
# -----------------------------------------------------------------------------
class Logger:
    """Custom logger that outputs to frontend"""
    def log(self, level, component, message):
        """Log a message and emit to frontend"""
        timestamp = datetime.now().strftime('%H:%M:%S')
        
        log_data = {
            'timestamp': timestamp,
            'level': level,
            'component': component,
            'message': message
        }
        with socketio_lock:
            socketio.emit('backend_log', log_data)
        
        print(f"[{timestamp}][{level}][{component}] {message}")

logger = Logger()

# -----------------------------------------------------------------------------
# Event Listeners
# -----------------------------------------------------------------------------
class FlightListener(olympe.EventListener):
    """Event listener for drone state changes"""

    @olympe.listen_event(FlyingStateChanged() | AlertStateChanged() | NavigateHomeStateChanged())
    def on_state_changed(self, event, scheduler):
        """Listen for drone state changes"""
        data = {
            "event": event.message.name,
            "state": event.args["state"]
        }
        logger.log("INFO", "STATE", f"{data['event']}: {data['state']}")
        with socketio_lock:
            socketio.emit('state_update', data)

    @olympe.listen_event(PositionChanged(_policy='wait'))
    def on_position_changed(self, event, scheduler):
        """Listen for position changes"""
        position_data = {
            "latitude": event.args["latitude"],
            "longitude": event.args["longitude"],
            "altitude": event.args["altitude"]
        }
        logger.log("INFO", "POSITION", f"Location: lat={position_data['latitude']}, lon={position_data['longitude']}, alt={position_data['altitude']}")
        with socketio_lock:
            socketio.emit('telemetry', position_data)

    @olympe.listen_event(BatteryStateChanged())
    def on_battery_changed(self, event, scheduler):
        """Listen for battery level changes"""
        battery_level = event.args["percent"]
        logger.log("INFO", "BATTERY", f"Level: {battery_level}%")
        with socketio_lock:
            socketio.emit('battery_update', {"level": battery_level})

    @olympe.listen_event(AttitudeChanged())
    def on_attitude_changed(self, event, scheduler):
        """Listen for drone attitude changes (roll, pitch, yaw)"""
        attitude_data = {
            "roll": event.args["roll"],
            "pitch": event.args["pitch"],
            "yaw": event.args["yaw"]
        }

        if int(time.time()) % 5 == 0:
            logger.log("INFO", "ATTITUDE", f"Roll: {attitude_data['roll']:.2f}°, Pitch: {attitude_data['pitch']:.2f}°, Yaw: {attitude_data['yaw']:.2f}°")
        with socketio_lock:
            socketio.emit('attitude_update', attitude_data)

    @olympe.listen_event(SpeedChanged())
    def on_speed_changed(self, event, scheduler):
        """Listen for drone speed changes"""
        speed_data = {
            "speedX": event.args["speedX"],
            "speedY": event.args["speedY"],
            "speedZ": event.args["speedZ"]
        }

        if int(time.time()) % 5 == 0:
            logger.log("INFO", "SPEED", f"X: {speed_data['speedX']:.2f} m/s, Y: {speed_data['speedY']:.2f} m/s, Z: {speed_data['speedZ']:.2f} m/s")
        with socketio_lock:
            socketio.emit('speed_update', speed_data)

    @olympe.listen_event(GPSFixStateChanged())
    def on_gps_fix_changed(self, event, scheduler):
        """Report when GPS fix state changes"""
        fix_state = event.args["fixed"]
        status = 'Fixed' if fix_state == 1 else 'Not fixed'
        logger.log("INFO", "GPS", f"Fix status: {status}")
        with socketio_lock:
            socketio.emit('gps_fix_state', {'fixed': fix_state == 1})

    @olympe.listen_event(FlyingStateChanged() | AlertStateChanged())
    def poll_battery_state(self, event, scheduler):
        """Poll for battery state regularly"""
        try:
            if drone and is_drone_connected:
                battery_state = drone.get_state(BatteryStateChanged)
                if battery_state:
                    battery_level = battery_state.get("percent", 0)
                    logger.log("INFO", "BATTERY", f"Level: {battery_level}%")
                    with socketio_lock:
                        socketio.emit('battery_update', {"level": battery_level})
        except Exception as e:
            logger.log("ERROR", "BATTERY", f"Failed to get battery state: {str(e)}")
    
    @olympe.listen_event(PositionChanged())
    def poll_drone_attitude(self, event, scheduler):
        """Poll for attitude data when position changes"""
        try:
            if drone and is_drone_connected:
                attitude_data = {
                    "roll": 0.0,
                    "pitch": 0.0,
                    "yaw": 0.0
                }
                with socketio_lock:
                    socketio.emit('attitude_update', attitude_data)
        except Exception as e:
            pass

    @olympe.listen_event(PositionChanged())
    def poll_drone_speed(self, event, scheduler):
        """Poll for speed data when position changes"""
        try:
            if drone and is_drone_connected:
                speed_data = {
                    "speedX": 0.0,
                    "speedY": 0.0,
                    "speedZ": 0.0
                }
                with socketio_lock:
                    socketio.emit('speed_update', speed_data)
        except Exception as e:
            pass

# -----------------------------------------------------------------------------
# Drone Connection Management
# -----------------------------------------------------------------------------
def poll_drone_metrics():
    """Poll all drone metrics at regular intervals"""
    global drone, is_drone_connected
    
    try:
        if drone and is_drone_connected:
            try:
                battery_state = drone.get_state(BatteryStateChanged)
                if battery_state:
                    battery_level = battery_state["percent"]
                    logger.log("INFO", "BATTERY", f"Polled battery: {battery_level}%")
                    with socketio_lock:
                        socketio.emit('battery_update', {"level": battery_level})
            except Exception as e:
                logger.log("ERROR", "BATTERY", f"Failed to poll battery: {str(e)}")
            
            try:
                attitude_data = {
                    "roll": 0.0,
                    "pitch": 0.0,
                    "yaw": 0.0
                }
                with socketio_lock:
                    socketio.emit('attitude_update', attitude_data)
            except Exception as e:
                logger.log("ERROR", "ATTITUDE", f"Failed to send attitude: {str(e)}")
            
            try:
                speed_data = {
                    "speedX": 0.0,
                    "speedY": 0.0,
                    "speedZ": 0.0
                }
                with socketio_lock:
                    socketio.emit('speed_update', speed_data)
            except Exception as e:
                logger.log("ERROR", "SPEED", f"Failed to send speed: {str(e)}")
    except Exception as e:
        logger.log("ERROR", "METRICS", f"Error in metrics polling: {str(e)}")

def drone_connection_thread():
    """Thread that manages the drone connection"""
    global drone, is_drone_connected, connection_error
    
    try:
        drone = olympe.Drone(DRONE_IP)
        logger.log("INFO", "DRONE", f"Connecting to drone at {DRONE_IP}...")
        
        if drone.connect():
            logger.log("INFO", "DRONE", "Connection established")
            
            with FlightListener(drone):
                logger.log("INFO", "DRONE", "Starting piloting...")
                drone.start_piloting()
                
                try:
                    battery_state = drone.get_state(BatteryStateChanged)
                    if battery_state:
                        battery_level = battery_state.get("percent", 0)
                        socketio.emit('battery_update', {"level": battery_level})
                        logger.log("INFO", "BATTERY", f"Initial battery level: {battery_level}%")
                except Exception as e:
                    logger.log("WARN", "BATTERY", f"Failed to get initial battery state: {str(e)}")
                
                logger.log("INFO", "DRONE", "Piloting started")
                
                with socketio_lock:
                    socketio.emit('drone_connection_status', {'connected': True})
                    is_drone_connected = True
                    connection_error = None
                
                polling_active = True
                
                def metrics_polling_loop():
                    """Regular polling of metrics"""
                    nonlocal polling_active
                    while polling_active and is_drone_connected:
                        poll_drone_metrics()
                        socketio.sleep(2) 
                
                metrics_thread = socketio.start_background_task(metrics_polling_loop)
                
                try:
                    while is_drone_connected:
                        socketio.sleep(1)
                except Exception as e:
                    logger.log("ERROR", "DRONE", f"Connection loop error: {str(e)}")
                    connection_error = str(e)
                finally:
                    polling_active = False
                    
                    if drone:
                        try:
                            logger.log("INFO", "DRONE", "Stopping piloting...")
                            drone.stop_piloting()
                            logger.log("INFO", "DRONE", "Disconnecting...")
                            drone.disconnect()
                        except Exception as e:
                            logger.log("ERROR", "DRONE", f"Error during disconnect: {str(e)}")
                    logger.log("INFO", "DRONE", "Disconnected")
        else:
            logger.log("ERROR", "DRONE", "Failed to connect to drone")
            connection_error = "Failed to connect to drone"
    
    except Exception as e:
        logger.log("ERROR", "DRONE", f"Drone connection thread error: {str(e)}")
        connection_error = str(e)
    
    finally:
        with socketio_lock:
            socketio.emit('drone_connection_status', {
                'connected': False,
                'error': connection_error
            })
            is_drone_connected = False
            drone = None

# -----------------------------------------------------------------------------
# Socket.IO Event Handlers
# -----------------------------------------------------------------------------
@socketio.on('connect')
def handle_client_connect():
    """Handle client connection to backend"""
    global active_client_sid
    
    client_sid = request.sid
    
    if active_client_sid is not None and active_client_sid != client_sid:
        logger.log("WARN", "SERVER", f"Rejected connection from {client_sid}: Another client already connected")
        return False
    
    active_client_sid = client_sid
    logger.log("INFO", "SERVER", f"Client {client_sid} connected to backend")
    
    socketio.emit('drone_connection_status', {
        'connected': is_drone_connected,
        'error': connection_error
    })
    return True


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    global active_client_sid
    
    if active_client_sid == request.sid:
        logger.log("INFO", "SERVER", f"Active client {active_client_sid} disconnected from backend")
        active_client_sid = None
    else:
        logger.log("INFO", "SERVER", f"Non-active client {request.sid} disconnected")


@socketio.on('connect_drone')
def handle_connect_drone():
    """Handle request to connect to drone"""
    global is_drone_connected
    
    if is_drone_connected:
        logger.log("INFO", "SERVER", "Drone already connected")
        return
    
    logger.log("INFO", "SERVER", "Starting drone connection thread...")
    socketio.start_background_task(drone_connection_thread)
    
    socketio.emit('drone_connection_status', {
        'connected': False,
        'connecting': True,
        'message': 'Connecting to drone...'
    })


@socketio.on('disconnect_drone')
def handle_disconnect_drone():
    """Handle request to disconnect from drone"""
    global is_drone_connected
    
    if not is_drone_connected:
        logger.log("INFO", "SERVER", "No active drone connection to disconnect")
        return
    
    logger.log("INFO", "SERVER", "Disconnecting from drone...")
    is_drone_connected = False

# -----------------------------------------------------------------------------
# Drone Control Commands
# -----------------------------------------------------------------------------
@socketio.on('takeoff')
def handle_takeoff():
    """Handle takeoff command"""
    if not is_drone_connected or drone is None:
        logger.log("ERROR", "COMMAND", "Cannot takeoff: Drone not connected")
        socketio.emit('command_result', {
            'command': 'takeoff',
            'success': False,
            'error': 'Drone not connected'
        })
        return
    
    logger.log("INFO", "COMMAND", "Takeoff command received")
    try:
        result = drone(TakeOff()).wait()
        success = result.success()
        logger.log("INFO", "COMMAND", f"Takeoff result: {'Success' if success else 'Failed'}")
        socketio.emit('command_result', {
            'command': 'takeoff',
            'success': success
        })
    except Exception as e:
        logger.log("ERROR", "COMMAND", f"Takeoff failed: {str(e)}")
        socketio.emit('command_result', {
            'command': 'takeoff',
            'success': False,
            'error': str(e)
        })


@socketio.on('land')
def handle_land():
    """Handle landing command"""
    if not is_drone_connected or drone is None:
        logger.log("ERROR", "COMMAND", "Cannot land: Drone not connected")
        socketio.emit('command_result', {
            'command': 'land',
            'success': False,
            'error': 'Drone not connected'
        })
        return
    
    logger.log("INFO", "COMMAND", "Land command received")
    try:
        result = drone(Landing()).wait()
        success = result.success()
        logger.log("INFO", "COMMAND", f"Landing result: {'Success' if success else 'Failed'}")
        socketio.emit('command_result', {
            'command': 'land',
            'success': success
        })
    except Exception as e:
        logger.log("ERROR", "COMMAND", f"Landing failed: {str(e)}")
        socketio.emit('command_result', {
            'command': 'land',
            'success': False,
            'error': str(e)
        })


@socketio.on('move')
def handle_move(data):
    """Handle movement commands"""
    if not is_drone_connected or drone is None:
        logger.log("ERROR", "COMMAND", "Cannot move: Drone not connected")
        socketio.emit('command_result', {
            'command': 'move',
            'success': False,
            'error': 'Drone not connected'
        })
        return
    
    logger.log("INFO", "COMMAND", f"Move command received: {data}")
    try:
        result = drone(moveBy(data["dx"], data["dy"], data["dz"], data["dpsi"])).wait()
        success = result.success()
        logger.log("INFO", "COMMAND", f"Move result: {'Success' if success else 'Failed'}")
        socketio.emit('command_result', {
            'command': 'move',
            'success': success
        })
    except Exception as e:
        logger.log("ERROR", "COMMAND", f"Move failed: {str(e)}")
        socketio.emit('command_result', {
            'command': 'move',
            'success': False,
            'error': str(e)
        })

# -----------------------------------------------------------------------------
# Main Application Entry
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    logger.log("INFO", "SERVER", "Starting server at http://0.0.0.0:5000")
    logger.log("INFO", "SERVER", "Server configured to allow only one client connection at a time")
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)
