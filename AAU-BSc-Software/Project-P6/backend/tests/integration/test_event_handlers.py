import pytest
from unittest.mock import MagicMock, patch
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

from backend.eventlistener.batteryEvent import handle_battery_state_changed
from backend.eventlistener.positionEvent import handle_position_changed
from backend.eventlistener.motionEvent import handle_motion_state_changed
from backend.eventlistener.flyingEvent import handle_flying_state_changed

def test_event_handlers_integration():
    """Test how different event handlers interact with the shared drone state"""
    
    gps_data = {"latitude": 0, "longitude": 0, "altitude": 0}
    drone_ready = False
    gps_data_changed = False
    drone_motion_state = "unknown"
    motion_state_changed = False
    battery_percent = 0
    battery_percent_changed = False
    emergency = False
    
    # Mock scheduler
    scheduler = MagicMock()
    
    # 1. First handle a position event
    position_event = MagicMock()
    position_event.args = {"latitude": 57.0, "longitude": 10.0, "altitude": 100.0}
    
    gps_data, drone_ready, gps_data_changed = handle_position_changed(
        position_event, scheduler, gps_data, drone_ready, gps_data_changed
    )
    
    assert gps_data["latitude"] == 57.0
    assert drone_ready == True
    assert gps_data_changed == True
    
    # 2. Handle a motion state event
    motion_event = MagicMock()
    motion_event.args = {"state": "ardrone3.PilotingState.MotionState.hovering"}
    
    drone_motion_state, motion_state_changed = handle_motion_state_changed(
        motion_event, scheduler, drone_motion_state, motion_state_changed
    )
    
    assert drone_motion_state == "hovering"
    assert motion_state_changed == True
    
    # 3. Handle a battery event
    battery_event = MagicMock()
    battery_event.args = {"percent": 75}
    
    battery_percent, battery_percent_changed = handle_battery_state_changed(
        battery_event, scheduler, battery_percent, battery_percent_changed
    )
    
    assert battery_percent == 75
    assert battery_percent_changed == True
    
    # 4. Handle a flying state event
    flying_event = MagicMock()
    flying_event.args = {"state": "ardrone3.FlyingStateChanged.State.landing"}
    
    drone_motion_state, motion_state_changed, emergency = handle_flying_state_changed(
        flying_event, scheduler, drone_motion_state, motion_state_changed, emergency
    )
    
    assert drone_motion_state == "landing"
    assert motion_state_changed == True
    assert emergency == False
    
    # 5. Test emergency handling
    emergency_event = MagicMock()
    emergency_event.args = {"state": "ardrone3.FlyingStateChanged.State.emergency"}
    
    drone_motion_state, motion_state_changed, emergency = handle_flying_state_changed(
        emergency_event, scheduler, drone_motion_state, motion_state_changed, emergency
    )
    
    assert drone_motion_state == "emergency"
    assert emergency == True
