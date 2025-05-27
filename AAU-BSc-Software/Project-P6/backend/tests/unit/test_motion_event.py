import pytest
from unittest.mock import MagicMock
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

from backend.eventlistener.motionEvent import handle_motion_state_changed

def test_motion_state_changed():
    # Arrange
    event = MagicMock()
    event.args = {"state": "ardrone3.PilotingState.MotionState.hovering"}
    scheduler = MagicMock()
    initial_motion_state = "unknown"
    initial_motion_state_changed = False
    
    # Act
    new_motion_state, new_motion_state_changed = handle_motion_state_changed(
        event, scheduler, initial_motion_state, initial_motion_state_changed
    )
    
    # Assert
    assert new_motion_state == "hovering"
    assert new_motion_state_changed == True

def test_motion_state_unchanged():
    # Arrange
    event = MagicMock()
    event.args = {"state": "ardrone3.PilotingState.MotionState.hovering"}
    scheduler = MagicMock()
    initial_motion_state = "hovering"
    initial_motion_state_changed = False
    
    # Act
    new_motion_state, new_motion_state_changed = handle_motion_state_changed(
        event, scheduler, initial_motion_state, initial_motion_state_changed
    )
    
    # Assert
    assert new_motion_state == "hovering"
    assert new_motion_state_changed == False

def test_motion_state_handles_exception():
    # Arrange
    event = MagicMock()
    # Cause an exception by not providing required args
    event.args = {}
    scheduler = MagicMock()
    initial_motion_state = "hovering"
    initial_motion_state_changed = False
    
    # Act
    new_motion_state, new_motion_state_changed = handle_motion_state_changed(
        event, scheduler, initial_motion_state, initial_motion_state_changed
    )
    
    # Assert
    assert new_motion_state == "hovering"
    assert new_motion_state_changed == False
