import pytest
from unittest.mock import MagicMock
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

from backend.eventlistener.flyingEvent import handle_flying_state_changed

def test_flying_state_changed():
    # Arrange
    event = MagicMock()
    event.args = {"state": "ardrone3.FlyingStateChanged.State.hovering"}
    scheduler = MagicMock()
    initial_motion_state = "unknown"
    initial_motion_state_changed = False
    initial_emergency = False
    
    # Act
    new_motion_state, new_motion_state_changed, new_emergency = handle_flying_state_changed(
        event, scheduler, initial_motion_state, initial_motion_state_changed, initial_emergency
    )
    
    # Assert
    assert new_motion_state == "hovering"
    assert new_motion_state_changed == True
    assert new_emergency == False

def test_emergency_state_detected():
    # Arrange
    event = MagicMock()
    event.args = {"state": "ardrone3.FlyingStateChanged.State.emergency"}
    scheduler = MagicMock()
    initial_motion_state = "hovering"
    initial_motion_state_changed = False
    initial_emergency = False
    
    # Act
    new_motion_state, new_motion_state_changed, new_emergency = handle_flying_state_changed(
        event, scheduler, initial_motion_state, initial_motion_state_changed, initial_emergency
    )
    
    # Assert
    assert new_motion_state == "emergency"
    assert new_motion_state_changed == True
    assert new_emergency == True

def test_flying_state_handles_exception():
    # Arrange
    event = MagicMock()

    event.args = {}
    scheduler = MagicMock()
    initial_motion_state = "hovering"
    initial_motion_state_changed = False
    initial_emergency = False
    
    # Act
    new_motion_state, new_motion_state_changed, new_emergency = handle_flying_state_changed(
        event, scheduler, initial_motion_state, initial_motion_state_changed, initial_emergency
    )
    
    # Assert
    assert new_motion_state == "hovering"
    assert new_motion_state_changed == False
    assert new_emergency == False
