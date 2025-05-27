#!/usr/bin/env python3

import olympe
import time
import json
import threading
import os
from olympe.messages.ardrone3.PilotingState import PositionChanged
from flask import Flask, render_template
from flask_socketio import SocketIO

# This is the IP address of the drone (default Anafi IP)
DRONE_IP = "192.168.53.1"

# Global variable to store GPS data
gps_data = {
    "latitude": 0,
    "longitude": 0,
    "altitude": 0
}

# Create Flask app and SocketIO instance
app = Flask(__name__, static_folder="frontend")
app.config['SECRET_KEY'] = 'drone-gps-tracking'
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/')
def index():
    return app.send_static_file('index.html')

def setup_frontend():
    # Create frontend directory if it doesn't exist
    frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")
    os.makedirs(frontend_dir, exist_ok=True)
    
    # Create HTML file with Socket.IO client
    with open(os.path.join(frontend_dir, "index.html"), "w") as f:
        f.write("""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Drone GPS Tracker</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
    <style>
        body, html {
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
        }
        .container {
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        h1 {
            text-align: center;
            margin: 10px 0;
        }
        #map {
            flex: 1;
            min-height: 500px;
        }
        .info {
            padding: 10px;
            background-color: #f8f8f8;
            border-top: 1px solid #ddd;
        }
        #connection-status {
            text-align: center;
            padding: 5px;
            color: white;
            background-color: #f44336;
        }
        #connection-status.connected {
            background-color: #4CAF50;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Drone GPS Tracker</h1>
        <div id="connection-status">Connecting to server...</div>
        <div id="map"></div>
        <div class="info">
            <p>Latitude: <span id="lat">0</span> | Longitude: <span id="lng">0</span> | Altitude: <span id="alt">0</span> m</p>
        </div>
    </div>
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.0.1/socket.io.js"></script>
    <script>
        let map;
        let marker;
        let path;
        const positions = [];
        let socket;

        // Initialize WebSocket connection
        function connectSocket() {
            socket = io();
            
            // Socket connection events
            socket.on('connect', function() {
                document.getElementById('connection-status').textContent = 'Connected to server';
                document.getElementById('connection-status').classList.add('connected');
            });
            
            socket.on('disconnect', function() {
                document.getElementById('connection-status').textContent = 'Disconnected from server';
                document.getElementById('connection-status').classList.remove('connected');
            });
            
            // Receive GPS data updates
            socket.on('gps_update', function(data) {
                updateGpsDisplay(data);
            });
        }

        // Update the GPS display with received data
        function updateGpsDisplay(data) {
            document.getElementById('lat').textContent = data.latitude.toFixed(6);
            document.getElementById('lng').textContent = data.longitude.toFixed(6);
            document.getElementById('alt').textContent = data.altitude.toFixed(2);
            
            if (data.latitude !== 0 && data.longitude !== 0) {
                const position = [data.latitude, data.longitude];
                marker.setLatLng(position);
                
                // Only add position to path if it's different from the last one
                if (positions.length === 0 || 
                    position[0] !== positions[positions.length-1][0] || 
                    position[1] !== positions[positions.length-1][1]) {
                    positions.push(position);
                    path.setLatLngs(positions);
                }
                
                map.setView(position);
            }
        }

        // Initialize map
        function initMap() {
            map = L.map('map').setView([0, 0], 15);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            
            marker = L.marker([0, 0]).addTo(map);
            path = L.polyline(positions, {color: 'blue'}).addTo(map);
        }

        // Initialize when the page loads
        document.addEventListener('DOMContentLoaded', () => {
            initMap();
            connectSocket();
        });
    </script>
</body>
</html>
        """)

def update_gps_data(drone):
    """Update the global GPS data by directly querying the drone state"""
    global gps_data
    try:
        position_state = drone.get_state(PositionChanged)
        gps_data["latitude"] = position_state["latitude"]
        gps_data["longitude"] = position_state["longitude"]
        gps_data["altitude"] = position_state["altitude"]
        print(f"Position updated: lat={gps_data['latitude']}, lon={gps_data['longitude']}, alt={gps_data['altitude']}")
        
        # Emit the GPS data via WebSocket
        socketio.emit('gps_update', gps_data)
    except Exception as e:
        print(f"Error updating GPS data: {e}")

def drone_controller():
    """Thread function to handle drone connection and GPS updates"""
    try:
        # Connect to the drone
        drone = olympe.Drone(DRONE_IP)
        print("Connecting to the drone...")
        drone.connect()
        print("Connected!")
        
        # Use polling approach for GPS updates
        while True:
            # Get GPS data directly from drone state
            update_gps_data(drone)
            # Wait before next update
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\nExiting...")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Disconnect from the drone if it was connected
        try:
            if 'drone' in locals() and drone.connection_state():
                print("Disconnecting from the drone...")
                drone.disconnect()
                print("Disconnected!")
        except Exception as e:
            print(f"Error during disconnect: {e}")

def main():
    # Setup frontend files
    setup_frontend()
    
    # Start the drone controller in a separate thread
    drone_thread = threading.Thread(target=drone_controller)
    drone_thread.daemon = True
    drone_thread.start()
    
    # Run the Flask app with SocketIO
    print("Starting Flask-SocketIO server at http://localhost:5000")
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)

if __name__ == "__main__":
    main()
