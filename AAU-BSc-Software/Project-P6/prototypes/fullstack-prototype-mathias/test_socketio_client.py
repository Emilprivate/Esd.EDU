import socketio

sio = socketio.Client()

@sio.event
def connect():
    print("Connected to server")

@sio.event
def disconnect():
    print("Disconnected from server")

@sio.on('drone_state')
def on_drone_state(data):
    print("drone_state event:", data)

@sio.on('flight_log')
def on_flight_log(data):
    print("flight_log event:", data)

sio.connect('http://localhost:5000')
sio.wait()
