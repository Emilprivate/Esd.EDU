from flask import Flask
from flask_socketio import SocketIO
from grid_calculator import calculate_grid_plan
from flight_executor import execute_flight_plan
from olympe import Anafi
from olympe.messages.ardrone3.GPSSettingsState import GPSFixStateChanged
from olympe.messages.ardrone3.PilotingState import PositionChanged
from config import DRONE_IP, DEFAULT_PORT, DEFAULT_HOST
import logging
import os
import threading
import time

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
logging.basicConfig(level=logging.INFO)

# Global state
drone_connected = False
drone = None
gps_thread = None
stop_gps_thread = False
gps_data = {
    "latitude": 0,
    "longitude": 0,
    "altitude": 0
}

def update_gps_data():
    """Thread function to continuously update GPS data from the drone"""
    global drone, gps_data, stop_gps_thread, drone_connected
    
    logging.info("Starting GPS tracking thread")
    
    while not stop_gps_thread:
        if drone and drone_connected:
            try:
                position_state = drone.get_state(PositionChanged)
                if position_state:
                    gps_data["latitude"] = position_state["latitude"]
                    gps_data["longitude"] = position_state["longitude"]
                    gps_data["altitude"] = position_state["altitude"]
                    
                    # Emit the GPS data via SocketIO
                    socketio.emit('gps_update', gps_data)
                    logging.debug(f"Position updated: lat={gps_data['latitude']}, lon={gps_data['longitude']}, alt={gps_data['altitude']}")
            except Exception as e:
                logging.error(f"Error updating GPS data: {str(e)}")
                
        # Wait before next update
        time.sleep(1)
    
    logging.info("GPS tracking thread stopped")

@socketio.on('connect')
def handle_connect():
    logging.info('Client connected')
    socketio.emit('connection_status', {'connected': True})
    # Send initial GPS data to the client
    socketio.emit('gps_update', gps_data)

@socketio.on('disconnect')
def handle_disconnect():
    global drone_connected
    logging.info('Client disconnected')
    drone_connected = False

@socketio.on('connect_drone')
def handle_connect_drone():
    global drone_connected, drone, gps_thread, stop_gps_thread
    try:
        if drone is None:
            drone = drone(DRONE_IP)
        
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
        
        # Start GPS tracking thread if not already running
        if gps_thread is None or not gps_thread.is_alive():
            stop_gps_thread = False
            gps_thread = threading.Thread(target=update_gps_data)
            gps_thread.daemon = True
            gps_thread.start()
            logging.info("Started GPS tracking thread")
            
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
    global drone_connected, drone, stop_gps_thread
    try:
        # Stop GPS tracking thread
        stop_gps_thread = True
        
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
