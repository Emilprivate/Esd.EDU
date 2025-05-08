from flask import Flask
from flask_socketio import SocketIO
from grid_calculator import calculate_grid_plan
from flight_executor import execute_flight_plan
from olympe import Anafi
from olympe.messages.ardrone3.GPSSettingsState import GPSFixStateChanged
from config import DRONE_IP, DEFAULT_PORT, DEFAULT_HOST
import logging
import os

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
logging.basicConfig(level=logging.INFO)

# Global state
drone_connected = False
drone = None

@socketio.on('connect')
def handle_connect():
    logging.info('Client connected')
    socketio.emit('connection_status', {'connected': True})

@socketio.on('disconnect')
def handle_disconnect():
    global drone_connected
    logging.info('Client disconnected')
    drone_connected = False

@socketio.on('connect_drone')
def handle_connect_drone():
    global drone_connected, drone
    try:
        if drone is None:
            drone = Anafi(DRONE_IP)
        
        logging.info("Connecting to drone...")
        drone.connect()
        
        logging.info("Waiting for GPS fix...")
        drone(GPSFixStateChanged(fixed=1, _timeout=30)).wait().success()
        
        drone_connected = True
        socketio.emit('drone_status', {
            'connected': True,
            'message': 'Successfully connected to drone'
        })
        logging.info("Drone connected successfully")
        return {'success': True}
        
    except Exception as e:
        logging.error(f"Drone connection error: {str(e)}")
        if drone:
            drone.disconnect()
        drone = None
        drone_connected = False
        socketio.emit('drone_status', {
            'connected': False,
            'error': str(e)
        })
        return {'success': False, 'error': str(e)}

@socketio.on('disconnect_drone')
def handle_disconnect_drone():
    global drone_connected, drone
    try:
        if drone:
            drone.disconnect()
            drone = None
        drone_connected = False
        socketio.emit('drone_status', {'connected': False})
        return {'success': True}
    except Exception as e:
        logging.error(f"Error disconnecting drone: {str(e)}")
        return {'success': False, 'error': str(e)}

@socketio.on('calculate_grid')
def handle_grid_calculation(data):
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
        result = execute_flight_plan(
            waypoints=data['waypoints'],
            altitude=float(data['altitude'])
        )
        return result
    except Exception as e:
        logging.error(f"Flight execution error: {str(e)}")
        return {"error": str(e)}

if __name__ == '__main__':
    port = int(os.environ.get('PORT', DEFAULT_PORT))
    host = os.environ.get('HOST', DEFAULT_HOST)
    logging.info(f"Starting server on {host}:{port}")
    socketio.run(app, host=host, port=port, debug=True)
