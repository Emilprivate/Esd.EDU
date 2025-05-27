from flask import Flask, request
from flask_socketio import SocketIO, emit
from datetime import datetime
import threading
import time
import math
import random

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

socketio_lock = threading.Lock()
active_client_sid = None
is_drone_connected = False
connection_error = None

# Test data
test_cases = [
    {
        "id": "test_1",
        "name": "Basic Flight Test",
        "description": "Tests takeoff, hover and landing operations",
        "status": "idle"
    },
    {
        "id": "test_2",
        "name": "GPS Navigation Test",
        "description": "Tests waypoint navigation capabilities",
        "status": "idle"
    },
    {
        "id": "test_3",
        "name": "Camera Operation Test",
        "description": "Tests camera functionality and image capture",
        "status": "idle"
    }
]

# Simulated drone state
drone_state = {
    "latitude": 55.6761,
    "longitude": 12.5683,
    "altitude": 0.0,
    "battery_level": 85,
    "event": "LANDED_STATE",
    "state": "LANDED",
    "roll": 0.0,
    "pitch": 0.0,
    "yaw": 0.0,
    "speedX": 0.0,
    "speedY": 0.0,
    "speedZ": 0.0,
    "gps_fixed": True,
    "is_flying": False
}

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
# Drone Simulation Functions
# -----------------------------------------------------------------------------
def update_sim_position():
    """Update the drone's simulated position"""
    global drone_state
    
    if drone_state["is_flying"]:
        # Add some random drift
        drone_state["latitude"] += random.uniform(-0.00001, 0.00001)
        drone_state["longitude"] += random.uniform(-0.00001, 0.00001)
        
        # Simulate altitude changes based on state
        if drone_state["state"] == "TAKING_OFF":
            drone_state["altitude"] = min(drone_state["altitude"] + 0.1, 2.0)
            if drone_state["altitude"] >= 2.0:
                drone_state["state"] = "HOVERING"
                drone_state["event"] = "FLYING_STATE"
                with socketio_lock:
                    socketio.emit('state_update', {
                        "event": drone_state["event"],
                        "state": drone_state["state"]
                    })
        elif drone_state["state"] == "LANDING":
            drone_state["altitude"] = max(drone_state["altitude"] - 0.1, 0.0)
            if drone_state["altitude"] <= 0.0:
                drone_state["is_flying"] = False
                drone_state["state"] = "LANDED"
                drone_state["event"] = "LANDED_STATE"
                with socketio_lock:
                    socketio.emit('state_update', {
                        "event": drone_state["event"],
                        "state": drone_state["state"]
                    })
        
        # Simulate attitude changes
        drone_state["roll"] = math.sin(time.time() * 0.5) * 2.0
        drone_state["pitch"] = math.cos(time.time() * 0.3) * 3.0
        drone_state["yaw"] = (drone_state["yaw"] + 0.2) % 360
        
        # Simulate speed changes
        drone_state["speedX"] = math.sin(time.time() * 0.2) * 0.5
        drone_state["speedY"] = math.cos(time.time() * 0.2) * 0.5
        drone_state["speedZ"] = math.sin(time.time() * 0.1) * 0.2
        
        # Simulate battery drain
        if time.time() % 30 == 0 and drone_state["battery_level"] > 0:
            drone_state["battery_level"] -= 1

def sim_loop():
    """Main simulation loop"""
    while True:
        if is_drone_connected:
            update_sim_position()
            
            # Send updates to the client
            with socketio_lock:
                socketio.emit('telemetry', {
                    "latitude": drone_state["latitude"],
                    "longitude": drone_state["longitude"],
                    "altitude": drone_state["altitude"]
                })
                
                socketio.emit('attitude_update', {
                    "roll": drone_state["roll"],
                    "pitch": drone_state["pitch"],
                    "yaw": drone_state["yaw"]
                })
                
                socketio.emit('speed_update', {
                    "speedX": drone_state["speedX"],
                    "speedY": drone_state["speedY"],
                    "speedZ": drone_state["speedZ"]
                })
                
                socketio.emit('battery_update', {
                    "level": drone_state["battery_level"]
                })
                
                socketio.emit('gps_fix_state', {
                    "fixed": drone_state["gps_fixed"]
                })
        
        time.sleep(0.2)  # 5 Hz update rate

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
    
    # Send current test cases
    socketio.emit('available_tests', test_cases)
    
    # Send drone connection status
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
    
    logger.log("INFO", "SERVER", "Connecting to simulated drone...")
    
    # Simulate connection delay
    socketio.emit('drone_connection_status', {
        'connected': False,
        'connecting': True,
        'message': 'Connecting to drone...'
    })
    
    # Simulate connection process
    socketio.sleep(2)
    
    is_drone_connected = True
    drone_state["battery_level"] = 85
    
    logger.log("INFO", "SERVER", "Drone connected successfully")
    
    socketio.emit('drone_connection_status', {
        'connected': True
    })
    
    # Send initial state
    socketio.emit('state_update', {
        "event": drone_state["event"],
        "state": drone_state["state"]
    })
    
    socketio.emit('battery_update', {
        "level": drone_state["battery_level"]
    })
    
    socketio.emit('gps_fix_state', {
        "fixed": drone_state["gps_fixed"]
    })

@socketio.on('disconnect_drone')
def handle_disconnect_drone():
    """Handle request to disconnect from drone"""
    global is_drone_connected
    
    if not is_drone_connected:
        logger.log("INFO", "SERVER", "No active drone connection to disconnect")
        return
    
    logger.log("INFO", "SERVER", "Disconnecting from drone...")
    
    # Reset drone state
    drone_state["is_flying"] = False
    drone_state["state"] = "LANDED"
    drone_state["event"] = "LANDED_STATE"
    drone_state["altitude"] = 0.0
    
    is_drone_connected = False
    
    socketio.emit('drone_connection_status', {
        'connected': False
    })
    
    logger.log("INFO", "SERVER", "Drone disconnected")

# -----------------------------------------------------------------------------
# Drone Control Commands
# -----------------------------------------------------------------------------
@socketio.on('takeoff')
def handle_takeoff():
    """Handle takeoff command"""
    if not is_drone_connected:
        logger.log("ERROR", "COMMAND", "Cannot takeoff: Drone not connected")
        socketio.emit('command_result', {
            'command': 'takeoff',
            'success': False,
            'error': 'Drone not connected'
        })
        return
    
    logger.log("INFO", "COMMAND", "Takeoff command received")
    
    # Update drone state
    drone_state["is_flying"] = True
    drone_state["state"] = "TAKING_OFF"
    drone_state["event"] = "FLYING_STATE"
    
    # Send state update
    socketio.emit('state_update', {
        "event": drone_state["event"],
        "state": drone_state["state"]
    })
    
    # Simulate command delay
    socketio.sleep(0.5)
    
    logger.log("INFO", "COMMAND", "Takeoff command executed")
    socketio.emit('command_result', {
        'command': 'takeoff',
        'success': True
    })

@socketio.on('land')
def handle_land():
    """Handle landing command"""
    if not is_drone_connected:
        logger.log("ERROR", "COMMAND", "Cannot land: Drone not connected")
        socketio.emit('command_result', {
            'command': 'land',
            'success': False,
            'error': 'Drone not connected'
        })
        return
    
    if not drone_state["is_flying"]:
        logger.log("ERROR", "COMMAND", "Cannot land: Drone is not flying")
        socketio.emit('command_result', {
            'command': 'land',
            'success': False,
            'error': 'Drone is not flying'
        })
        return
    
    logger.log("INFO", "COMMAND", "Land command received")
    
    # Update drone state
    drone_state["state"] = "LANDING"
    drone_state["event"] = "LANDING_STATE"
    
    # Send state update
    socketio.emit('state_update', {
        "event": drone_state["event"],
        "state": drone_state["state"]
    })
    
    # Simulate command delay
    socketio.sleep(0.5)
    
    logger.log("INFO", "COMMAND", "Land command executed")
    socketio.emit('command_result', {
        'command': 'land',
        'success': True
    })

@socketio.on('move')
def handle_move(data):
    """Handle movement command"""
    if not is_drone_connected:
        logger.log("ERROR", "COMMAND", "Cannot move: Drone not connected")
        socketio.emit('command_result', {
            'command': 'move',
            'success': False,
            'error': 'Drone not connected'
        })
        return
    
    if not drone_state["is_flying"] or drone_state["state"] not in ["HOVERING", "FLYING"]:
        logger.log("ERROR", "COMMAND", "Cannot move: Drone is not in flight")
        socketio.emit('command_result', {
            'command': 'move',
            'success': False,
            'error': 'Drone is not in flight'
        })
        return
    
    dx = data.get('dx', 0)
    dy = data.get('dy', 0)
    dz = data.get('dz', 0)
    dpsi = data.get('dpsi', 0)
    
    logger.log("INFO", "COMMAND", f"Move command received: dx={dx}, dy={dy}, dz={dz}, dpsi={dpsi}")
    
    # Simulate movement by updating position
    drone_state["latitude"] += dx * 0.00001
    drone_state["longitude"] += dy * 0.00001
    drone_state["altitude"] += dz
    drone_state["yaw"] = (drone_state["yaw"] + dpsi) % 360
    
    # Simulate command delay
    socketio.sleep(0.3)
    
    logger.log("INFO", "COMMAND", "Move command executed")
    socketio.emit('command_result', {
        'command': 'move',
        'success': True
    })

@socketio.on('run_test')
def handle_run_test(data):
    """Handle test execution command"""
    if not is_drone_connected:
        logger.log("ERROR", "TEST", "Cannot run test: Drone not connected")
        return
    
    test_id = data.get('testId')
    test_info = None
    
    for test in test_cases:
        if test['id'] == test_id:
            test_info = test
            break
    
    if not test_info:
        logger.log("ERROR", "TEST", f"Test with id {test_id} not found")
        return
    
    logger.log("INFO", "TEST", f"Running test: {test_info['name']}")
    
    # Update test status
    for i, test in enumerate(test_cases):
        if test['id'] == test_id:
            test_cases[i]['status'] = 'running'
            break
    
    # Send updated test list
    socketio.emit('available_tests', test_cases)
    
    # Simulate test execution
    def test_execution():
        logger.log("INFO", "TEST", f"Test {test_info['name']} started")
        
        # Simulate steps based on test type
        if test_id == "test_1":  # Basic flight test
            logger.log("INFO", "TEST", "Running basic flight test step 1: Takeoff")
            socketio.sleep(2)
            logger.log("INFO", "TEST", "Running basic flight test step 2: Hover")
            socketio.sleep(2)
            logger.log("INFO", "TEST", "Running basic flight test step 3: Land")
            socketio.sleep(1)
            success = True
        elif test_id == "test_2":  # GPS test
            logger.log("INFO", "TEST", "Running GPS test step 1: Checking GPS signal")
            socketio.sleep(1)
            logger.log("INFO", "TEST", "Running GPS test step 2: Verifying position accuracy")
            socketio.sleep(2)
            logger.log("INFO", "TEST", "Running GPS test step 3: Testing navigation")
            socketio.sleep(2)
            success = True
        elif test_id == "test_3":  # Camera test
            logger.log("INFO", "TEST", "Running camera test step 1: Initializing camera")
            socketio.sleep(1)
            logger.log("INFO", "TEST", "Running camera test step 2: Taking test image")
            socketio.sleep(2)
            logger.log("INFO", "TEST", "Running camera test step 3: Analyzing image quality")
            socketio.sleep(1)
            success = drone_state["battery_level"] > 30  # Random condition for demo
        else:
            success = False
        
        # Update test status based on result
        for i, test in enumerate(test_cases):
            if test['id'] == test_id:
                test_cases[i]['status'] = 'success' if success else 'failed'
                break
        
        # Send updated test list
        socketio.emit('available_tests', test_cases)
        
        if success:
            logger.log("INFO", "TEST", f"Test {test_info['name']} completed successfully")
        else:
            logger.log("ERROR", "TEST", f"Test {test_info['name']} failed")
    
    # Start test execution in background
    socketio.start_background_task(test_execution)

# -----------------------------------------------------------------------------
# Main Application Entry
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    logger.log("INFO", "SERVER", "Starting simulated drone backend at http://0.0.0.0:5000")
    
    # Start the simulation loop in a separate thread
    sim_thread = threading.Thread(target=sim_loop, daemon=True)
    sim_thread.start()
    
    # Start the socketio server with allow_unsafe_werkzeug=True
    socketio.run(app, host='0.0.0.0', port=5000, debug=False, allow_unsafe_werkzeug=True)
