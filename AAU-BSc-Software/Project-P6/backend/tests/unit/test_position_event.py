import pytest
from unittest.mock import MagicMock
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

from backend.eventlistener.positionEvent import handle_position_changed

def test_position_changed_valid_coordinates():
    # Arrange
    event = MagicMock()
    event.args = {"latitude": 57.0, "longitude": 10.0, "altitude": 100.0}
    scheduler = MagicMock()
    initial_gps_data = {"latitude": 0, "longitude": 0, "altitude": 0}
    initial_drone_ready = False
    initial_gps_data_changed = False
    
    # Act
    new_gps_data, new_drone_ready, new_gps_data_changed = handle_position_changed(
        event, scheduler, initial_gps_data, initial_drone_ready, initial_gps_data_changed
    )
    
    # Assert
    assert new_gps_data["latitude"] == 57.0
    assert new_gps_data["longitude"] == 10.0
    assert new_gps_data["altitude"] == 100.0
    assert new_drone_ready == True
    assert new_gps_data_changed == True

def test_position_unchanged_same_coordinates():
    # Arrange
    event = MagicMock()
    event.args = {"latitude": 57.0, "longitude": 10.0, "altitude": 100.0}
    scheduler = MagicMock()
    initial_gps_data = {"latitude": 57.0, "longitude": 10.0, "altitude": 100.0}
    initial_drone_ready = True
    initial_gps_data_changed = False
    
    # Act
    new_gps_data, new_drone_ready, new_gps_data_changed = handle_position_changed(
        event, scheduler, initial_gps_data, initial_drone_ready, initial_gps_data_changed
    )
    
    # Assert
    assert new_gps_data == initial_gps_data
    assert new_drone_ready == True
    assert new_gps_data_changed == False

def test_position_invalid_coordinates():
    # Arrange
    event = MagicMock()
    event.args = {"latitude": 500, "longitude": 500, "altitude": 500}
    scheduler = MagicMock()
    initial_gps_data = {"latitude": 0, "longitude": 0, "altitude": 0}
    initial_drone_ready = False
    initial_gps_data_changed = False
    
    # Act
    new_gps_data, new_drone_ready, new_gps_data_changed = handle_position_changed(
        event, scheduler, initial_gps_data, initial_drone_ready, initial_gps_data_changed
    )
    
    # Assert
    assert new_gps_data == initial_gps_data
    assert new_drone_ready == False
    assert new_gps_data_changed == False
