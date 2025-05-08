from flask import Flask, request, Response, jsonify
from flask_cors import CORS
import threading
import queue
import time
import math
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
CORS(app)

DRONE_IP = "192.168.53.1"

# Global state
drone_thread = None
drone_cmd_queue = queue.Queue()
drone_status = {
    "connected": False,
    "ready": False,
    "gps_data": {"latitude": 0, "longitude": 0, "altitude": 0},
    "motion_state": "unknown",
    "battery_percent": 0,
}
SSE_QUEUE_MAXSIZE = 1000
sse_queue = queue.Queue(maxsize=SSE_QUEUE_MAXSIZE)  # Use bounded queue for robustness

def send_sse_message(message_type, data):
    if isinstance(data, dict):
        data_str = json.dumps(data)
    else:
        data_str = data
    msg = f"event: {message_type}\ndata: {data_str}\n\n"
    try:
        sse_queue.put_nowait(msg)
        logging.info(f"[SSE] Sent event '{message_type}': {data_str}")
    except queue.Full:
        logging.warning("[SSE] SSE queue full, dropping message!")
    except Exception as e:
        logging.warning(f"[SSE] Queue error: {e}")

def drone_worker():
    import olympe
    from olympe.messages.ardrone3.PilotingState import PositionChanged, FlyingStateChanged, MotionState
    from olympe.messages.ardrone3.Piloting import TakeOff, Landing
    from olympe.messages.common.CommonState import BatteryStateChanged

    drone = None
    listener = None

    class DroneEventListener(olympe.EventListener):
        def __init__(self, drone):
            super().__init__(drone)

        @olympe.listen_event(PositionChanged(_policy='wait'))
        def on_position_changed(self, event, scheduler):
            lat = event.args["latitude"]
            lon = event.args["longitude"]
            alt = event.args["altitude"]
            logging.info(f"[EventListener] PositionChanged: lat={lat}, lon={lon}, alt={alt}")
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
                logging.info("[EventListener] PositionChanged: Invalid GPS, not sending SSE")
                drone_status["ready"] = False
                return
            drone_status["gps_data"] = {"latitude": lat, "longitude": lon, "altitude": alt}
            drone_status["ready"] = True
            logging.info(f"[EventListener] PositionChanged: Sending gps_update SSE")
            send_sse_message("gps_update", drone_status["gps_data"])

        @olympe.listen_event(MotionState(_policy='wait'))
        def on_motion_state_changed(self, event, scheduler):
            raw_state = str(event.args["state"])
            new_state = raw_state.split('.')[-1].lower()
            logging.info(f"[EventListener] MotionState: {new_state}")
            drone_status["motion_state"] = new_state
            logging.info(f"[EventListener] MotionState: Sending motion_update SSE")
            send_sse_message("motion_update", {"motion_state": new_state})

        @olympe.listen_event(BatteryStateChanged(_policy='wait'))
        def on_battery_state_changed(self, event, scheduler):
            percent = event.args["percent"]
            logging.info(f"[EventListener] BatteryStateChanged: {percent}%")
            drone_status["battery_percent"] = percent
            logging.info(f"[EventListener] BatteryStateChanged: Sending battery_update SSE")
            send_sse_message("battery_update", {"battery_percent": percent})

        @olympe.listen_event(FlyingStateChanged(_policy='wait'))
        def on_flying_state_changed(self, event, scheduler):
            state = event.args["state"]
            logging.info(f"[EventListener] FlyingStateChanged: {state}")
            logging.info(f"[EventListener] FlyingStateChanged: Sending flight_log SSE")
            send_sse_message("flight_log", {"action": "Flight State", "message": f"Drone state: {state}"})

    # Keep a reference to the listener to avoid garbage collection
    listener_ref = [None]

    while True:
        cmd, args, result_queue = drone_cmd_queue.get()
        try:
            if cmd == "connect":
                if drone is not None:
                    result_queue.put({"success": True, "message": "Already connected"})
                    continue
                drone = olympe.Drone(DRONE_IP)
                drone.connect()
                listener = DroneEventListener(drone)
                listener_ref[0] = listener  # Prevent GC
                drone_status["connected"] = True
                send_sse_message("drone_status", {"connected": True, "ready": drone_status["ready"]})
                send_sse_message("flight_log", {"action": "Connection", "message": "Connected to drone successfully"})
                result_queue.put({"success": True, "message": "Connected to drone"})
            elif cmd == "disconnect":
                listener_ref[0] = None
                if drone:
                    drone.disconnect()
                    drone = None
                drone_status["connected"] = False
                drone_status["ready"] = False
                send_sse_message("drone_status", {"connected": False, "ready": False})
                send_sse_message("flight_log", {"action": "Disconnection", "message": "Disconnected from drone"})
                result_queue.put({"success": True, "message": "Disconnected from drone"})
            elif cmd == "execute_flight":
                if not drone or not drone_status["connected"]:
                    msg = "Drone is not connected"
                    send_sse_message("flight_log", {"action": "Error", "message": msg})
                    result_queue.put({"success": False, "error": msg})
                    continue
                send_sse_message("flight_log", {"action": "Takeoff", "message": "Taking off"})
                takeoff_result = drone(TakeOff()).wait()
                if not takeoff_result:
                    msg = "Takeoff command failed"
                    send_sse_message("flight_log", {"action": "Error", "message": msg})
                    result_queue.put({"success": False, "error": msg})
                    continue
                time.sleep(5)
                send_sse_message("flight_log", {"action": "Landing", "message": "Landing"})
                landing_result = drone(Landing()).wait()
                if not landing_result:
                    msg = "Landing command failed"
                    send_sse_message("flight_log", {"action": "Error", "message": msg})
                    result_queue.put({"success": False, "error": msg})
                    continue
                send_sse_message("flight_log", {"action": "Completed", "message": "Flight completed successfully"})
                result_queue.put({"success": True, "message": "Flight completed successfully"})
            elif cmd == "get_status":
                result_queue.put({
                    "connected": drone_status["connected"],
                    "ready": drone_status["ready"],
                    "gps_data": drone_status["gps_data"],
                    "motion_state": drone_status["motion_state"],
                    "battery_percent": drone_status["battery_percent"],
                })
            else:
                result_queue.put({"success": False, "error": "Unknown command"})
        except Exception as e:
            result_queue.put({"success": False, "error": str(e)})

def ensure_drone_thread():
    global drone_thread
    if drone_thread is None:
        drone_thread = threading.Thread(target=drone_worker, daemon=True)
        drone_thread.start()

def manage_request(cmd, *args):
    ensure_drone_thread()
    result_queue = queue.Queue()
    drone_cmd_queue.put((cmd, args, result_queue))
    return result_queue.get()

@app.route('/connect', methods=['GET'])
def sse_connect():
    def event_stream():
        send_sse_message("drone_status", {"connected": drone_status["connected"], "ready": drone_status["ready"]})
        send_sse_message("flight_log", {"action": "Connection", "message": "SSE connection established"})
        while True:
            msg = sse_queue.get()
            yield msg
    return Response(event_stream(), mimetype="text/event-stream")

@app.route('/connect_drone', methods=['POST'])
def api_connect_drone():
    result = manage_request("connect")
    return jsonify(result)

@app.route('/disconnect_drone', methods=['POST'])
def api_disconnect_drone():
    result = manage_request("disconnect")
    return jsonify(result)

@app.route('/execute_flight', methods=['POST'])
def api_execute_flight():
    result = manage_request("execute_flight")
    return jsonify(result)

@app.route('/get_status', methods=['GET'])
def api_get_status():
    result = manage_request("get_status")
    return jsonify(result)

@app.route('/')
def index():
    try:
        with open('index.html', 'r') as f:
            return f.read()
    except FileNotFoundError:
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Drone Control</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; }
                button { padding: 10px; margin: 5px; cursor: pointer; }
                #log { height: 300px; overflow-y: scroll; border: 1px solid #ccc; padding: 10px; background-color: #f9f9f9; }
                .error { color: red; }
                .success { color: green; }
                .info { color: blue; }
            </style>
        </head>
        <body>
            <h1>Drone Control Interface</h1>
            <div>
                <button id="connectBtn">Connect to Drone</button>
                <button id="disconnectBtn">Disconnect Drone</button>
                <button id="executeBtn">Execute Test Flight</button>
            </div>
            <h2>Event Log</h2>
            <div id="log"></div>
            
            <script>
                let eventSource = null;
                
                // Connect to SSE
                function connectSSE() {
                    eventSource = new EventSource('/connect');
                    
                    eventSource.addEventListener('flight_log', function(event) {
                        const data = JSON.parse(event.data);
                        logMessage(`${data.action}: ${data.message}`, 'info');
                    });
                    
                    eventSource.addEventListener('drone_status', function(event) {
                        const data = JSON.parse(event.data);
                        logMessage(`Drone status: connected=${data.connected}, ready=${data.ready}`, 'info');
                    });
                    
                    eventSource.addEventListener('gps_update', function(event) {
                        const data = JSON.parse(event.data);
                        logMessage(`GPS: lat=${data.latitude}, lon=${data.longitude}, alt=${data.altitude}`, 'info');
                    });
                    
                    eventSource.addEventListener('battery_update', function(event) {
                        const data = JSON.parse(event.data);
                        logMessage(`Battery: ${data.battery_percent}%`, 'info');
                    });
                    
                    eventSource.onerror = function() {
                        logMessage('SSE connection error. Reconnecting...', 'error');
                        eventSource.close();
                        setTimeout(connectSSE, 3000);
                    };
                }
                
                // Log a message to the console
                function logMessage(message, type = 'info') {
                    const log = document.getElementById('log');
                    const entry = document.createElement('div');
                    entry.className = type;
                    entry.textContent = message;
                    log.appendChild(entry);
                    log.scrollTop = log.scrollHeight;
                }
                
                // API call helper
                async function callApi(endpoint) {
                    try {
                        const response = await fetch(endpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            logMessage(`API: ${data.message}`, 'success');
                        } else {
                            logMessage(`API Error: ${data.error}`, 'error');
                        }
                        
                        return data;
                    } catch (error) {
                        logMessage(`API Request Failed: ${error.message}`, 'error');
                        return { success: false, error: error.message };
                    }
                }
                
                // Setup event listeners
                document.getElementById('connectBtn').addEventListener('click', () => callApi('/connect_drone'));
                document.getElementById('disconnectBtn').addEventListener('click', () => callApi('/disconnect_drone'));
                document.getElementById('executeBtn').addEventListener('click', () => callApi('/execute_flight'));
                
                // Initialize
                connectSSE();
                logMessage('Page loaded', 'info');
            </script>
        </body>
        </html>
        """

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
