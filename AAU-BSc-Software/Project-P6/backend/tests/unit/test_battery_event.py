import pytest
from unittest.mock import MagicMock
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

from backend.eventlistener.batteryEvent import handle_battery_state_changed

def test_battery_state_changed_updates_battery_percent():
    # Arrange
    event = MagicMock()
    event.args = {"percent": 75}
    scheduler = MagicMock()
    initial_battery_percent = 50
    initial_battery_percent_changed = False
    
    # Act
    new_battery_percent, new_battery_percent_changed = handle_battery_state_changed(
        event, scheduler, initial_battery_percent, initial_battery_percent_changed
    )
    
    # Assert
    assert new_battery_percent == 75
    assert new_battery_percent_changed == True

def test_battery_state_unchanged_when_same_percent():
    # Arrange
    event = MagicMock()
    event.args = {"percent": 50}
    scheduler = MagicMock()
    initial_battery_percent = 50
    initial_battery_percent_changed = False
    
    # Act
    new_battery_percent, new_battery_percent_changed = handle_battery_state_changed(
        event, scheduler, initial_battery_percent, initial_battery_percent_changed
    )
    
    # Assert
    assert new_battery_percent == 50
    assert new_battery_percent_changed == False

def test_battery_state_handles_exception():
    # Arrange
    event = MagicMock()

    event.args = {}
    scheduler = MagicMock()
    initial_battery_percent = 50
    initial_battery_percent_changed = False
    
    # Act
    new_battery_percent, new_battery_percent_changed = handle_battery_state_changed(
        event, scheduler, initial_battery_percent, initial_battery_percent_changed
    )
    
    # Assert
    assert new_battery_percent == 50
    assert new_battery_percent_changed == False
