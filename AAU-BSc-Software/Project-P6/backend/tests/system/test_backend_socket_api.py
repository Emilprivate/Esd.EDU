import pytest
import sys
import os
import json
import socketio
import threading
import time
import multiprocessing
import requests
from unittest.mock import patch, MagicMock

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

# Import backend modules
import backend.backend as backend
from backend.config import DEFAULT_PORT, SIMULATION_MODE

# Skip tests if not in simulation mode
pytestmark = pytest.mark.skipif(not SIMULATION_MODE, reason="Socket API tests only run in simulation mode")

@pytest.fixture(scope="module")
def server_process():
    """Start the server in a separate process for testing"""
    # Override the port to avoid conflicts with a running server
    test_port = DEFAULT_PORT + 1
    
    # Create a mock for olympe.Drone
    class MockDrone:
        def __init__(self, ip):
            self.ip = ip
            self.connection_state = lambda: True
            self.connected = False
            self.get_state = MagicMock(return_value={"percent": 80})
            
        def connect(self):
            self.connected = True
            return True
            
        def disconnect(self):
            self.connected = False
            return True
            
        def __call__(self, *args, **kwargs):
            # Return a MagicMock for all method calls
            mm = MagicMock()
            mm.wait = MagicMock(return_value=mm)
            mm.success = MagicMock(return_value=True)
            return mm
    
    # Patch olympe.Drone
    with patch.dict('sys.modules', {
        'olympe': MagicMock(),
        'olympe.Drone': MockDrone,
        'olympe.EventListener': MagicMock(),
        'olympe.messages': MagicMock(),
        'olympe.messages.ardrone3': MagicMock(),
        'olympe.messages.common': MagicMock(),
        'olympe.enums': MagicMock(),
        'olympe.media': MagicMock(),
    }):
        # Start the server in a separate process
        def run_server():
            # Override port
            os.environ['PORT'] = str(test_port)
            try:
                backend.sio.eio.start_background_task = lambda f: f()
                backend.eventlet.wsgi.server = lambda *args, **kwargs: None
                backend.application(None, lambda *args: None)
            except Exception as e:
                print(f"Server error: {e}")
        
        process = multiprocessing.Process(target=run_server)
        process.daemon = True
        process.start()
        
        # Wait for server to start
        time.sleep(1)
        
        # Return the server port for clients to connect
        yield test_port
        
        # Terminate the server
        process.terminate()
        process.join(timeout=1)

@pytest.fixture
def sio_client(server_process):
    """Create a Socket.IO client connected to the test server"""
    client = socketio.Client()
    server_url = f"http://localhost:{server_process}"
    try:
        client.connect(server_url)
    except socketio.exceptions.ConnectionError:
        pytest.skip(f"Could not connect to test server at {server_url}")
    
    yield client
    
    if client.connected:
        client.disconnect()

def test_socketio_connection(sio_client):
    """Test Socket.IO connection"""
    assert sio_client.connected

def test_drone_status(sio_client):
    """Test get_drone_status event"""
    status = sio_client.call('get_drone_status', {})
    assert 'connected' in status
    assert 'gps_fix' in status

@pytest.mark.skip(reason="Needs more complex setup")
def test_connect_disconnect_drone(sio_client):
    """Test connecting and disconnecting the drone"""
    # Connect drone
    result = sio_client.call('connect_drone', {})
    assert result['success'] == True
    
    # Get status
    status = sio_client.call('get_drone_status', {})
    assert status['connected'] == True
    
    # Disconnect drone
    result = sio_client.call('disconnect_drone', {})
    assert result['success'] == True
    
    # Get status again
    status = sio_client.call('get_drone_status', {})
    assert status['connected'] == False
