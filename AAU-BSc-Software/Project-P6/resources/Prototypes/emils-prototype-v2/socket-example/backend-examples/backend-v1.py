from flask import Flask
from flask_socketio import SocketIO, emit
import olympe
from olympe.messages.ardrone3.Piloting import TakeOff, Landing, moveBy
from olympe.messages.ardrone3.PilotingState import (
    PositionChanged,
    FlyingStateChanged,
    AlertStateChanged,
    NavigateHomeStateChanged,
)
import json
import threading

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

DRONE_IP = "192.168.42.1"
drone = olympe.Drone(DRONE_IP)


socketio_lock = threading.Lock()


class FlightListener(olympe.EventListener):

    @olympe.listen_event(FlyingStateChanged() | AlertStateChanged() | NavigateHomeStateChanged())
    def on_state_changed(self, event, scheduler):
        data = {
            "event": event.message.name,
            "state": event.args["state"]
        }
        print(f"[STATE] {data}")
        with socketio_lock:
            socketio.emit('state_update', data)

    @olympe.listen_event(PositionChanged(_policy='wait'))
    def on_position_changed(self, event, scheduler):
        position_data = {
            "latitude": event.args["latitude"],
            "longitude": event.args["longitude"],
            "altitude": event.args["altitude"]
        }
        print(f"[POSITION] {json.dumps(position_data, indent=2)}")
        with socketio_lock:
            socketio.emit('telemetry', position_data)


def drone_connection():
    """Maintains drone connection and runs within a context manager."""
    with FlightListener(drone):
        drone.connect()
        drone.start_piloting()
        print("[DRONE] Drone connected and piloting started.")

        try:
            while True:
                socketio.sleep(1)
        except Exception as e:
            print(f"[ERROR] Drone loop exception: {e}")
        finally:
            drone.stop_piloting()
            drone.disconnect()
            print("[DRONE] Drone disconnected cleanly.")


@socketio.on('connect')
def handle_client_connect():
    global drone_thread
    if 'drone_thread' not in globals():
        print("[SERVER] First client connected, starting drone thread.")
        drone_thread = socketio.start_background_task(drone_connection)
    else:
        print("[SERVER] Another client connected; drone thread already running.")


@socketio.on('takeoff')
def handle_takeoff():
    print("[COMMAND] Takeoff command received.")
    drone(TakeOff()).wait()


@socketio.on('land')
def handle_land():
    print("[COMMAND] Land command received.")
    drone(Landing()).wait()


@socketio.on('move')
def handle_move(data):
    """
    Expects data format: {"dx": float, "dy": float, "dz": float, "dpsi": float}
    """
    print(f"[COMMAND] Move command received: {data}")
    drone(moveBy(data["dx"], data["dy"], data["dz"], data["dpsi"])).wait()


if __name__ == "__main__":
    socketio.run(app, host='0.0.0.0', port=5000)
