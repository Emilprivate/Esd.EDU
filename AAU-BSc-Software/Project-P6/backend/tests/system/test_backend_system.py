import pytest
import sys
import os
import json
import socketio
import threading
import time
from unittest.mock import patch, MagicMock

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

# Import backend modules to mock
import backend.backend as backend
from backend.config import SIMULATION_MODE

# Skip tests if not in simulation mode
pytestmark = pytest.mark.skipif(not SIMULATION_MODE, reason="System tests only run in simulation mode")

class MockDrone:
    """Mock Drone class for testing"""
    def __init__(self, ip):
        self.ip = ip
        self.connection_state = lambda: True
        self.is_connected = lambda: True
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
        mm.timedout = MagicMock(return_value=False)
        return mm

class MockEventListener:
    """Mock EventListener for testing"""
    def __enter__(self):
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

@pytest.fixture
def mock_olympe():
    """Mock olympe for testing"""
    with patch.dict('sys.modules', {
        'olympe': MagicMock(),
        'olympe.Drone': MockDrone,
        'olympe.EventListener': MockEventListener,
        'olympe.messages': MagicMock(),
        'olympe.messages.ardrone3': MagicMock(),
        'olympe.messages.ardrone3.PilotingState': MagicMock(),
        'olympe.messages.common': MagicMock(),
        'olympe.messages.common.CommonState': MagicMock(),
        'olympe.enums': MagicMock(),
    }):
        yield

@pytest.fixture
def mock_backend(mock_olympe):
    """Setup and teardown the backend with mocked dependencies"""
    # Save original imports
    original_drone = backend.drone
    original_drone_connected = backend.drone_connected
    original_drone_event_listener = backend.drone_event_listener
    
    # Set initial state
    backend.drone = None
    backend.drone_connected = False
    backend.drone_event_listener = None
    
    # Start server in a separate thread
    server_thread = threading.Thread(target=lambda: None)  # Don't actually start server
    
    yield backend
    
    # Restore original state
    backend.drone = original_drone
    backend.drone_connected = original_drone_connected
    backend.drone_event_listener = original_drone_event_listener

@pytest.fixture
def sio_client():
    """Create a Socket.IO client for testing"""
    client = socketio.Client()
    yield client
    if client.connected:
        client.disconnect()

def test_connect_drone(mock_backend):
    """Test connecting to the drone"""
    result = mock_backend.connect_to_drone()
    assert result["success"] == True
    assert mock_backend.drone_connected == True
    assert mock_backend.drone is not None

def test_disconnect_drone(mock_backend):
    """Test disconnecting from the drone"""
    # First connect
    mock_backend.connect_to_drone()
    assert mock_backend.drone_connected == True
    
    # Then disconnect
    result = mock_backend.disconnect_from_drone()
    assert result["success"] == True
    assert mock_backend.drone_connected == False
    assert mock_backend.drone is None

def test_calculate_grid(mock_backend):
    """Test grid calculation"""
    # Set drone ready
    mock_backend.DRONE_READY = True
    
    # Sample coordinates for a small area
    coordinates = [
        [57.0128, 9.9905],
        [57.0128, 9.9925],
        [57.0148, 9.9925],
        [57.0148, 9.9905]
    ]
    
    data = {
        'coordinates': coordinates,
        'altitude': 20.0,
        'overlap': 30.0,
        'coverage': 80.0
    }
    
    # Call handle_calculate_grid directly
    result = mock_backend.handle_calculate_grid(None, data)
    
    # Check that we got a valid response
    assert 'error' not in result
    assert 'waypoints' in result
    assert len(result['waypoints']) > 0
    assert 'start_point' in result
