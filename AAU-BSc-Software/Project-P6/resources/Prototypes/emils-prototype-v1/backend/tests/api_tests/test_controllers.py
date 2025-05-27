"""
Tests for the drone controllers without using physical drone.
These tests mock the olympe library to avoid physical drone operations.
"""
import unittest
import sys
import os
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))
from backend.drone.controller import DroneController

class ControllerTests(unittest.TestCase):
    
    @patch('backend.drone.base_controller.olympe.Drone')
    def test_takeoff(self, mock_drone_class):
        """Test the takeoff method calls the correct Olympe commands"""
        # Setup
        mock_drone = MagicMock()
        mock_drone_class.return_value = mock_drone
        mock_drone.return_value.wait.return_value.success.return_value = True
        
        controller = DroneController()
        
        # Execute
        result = controller.takeoff()
        
        # Assert
        self.assertTrue(result)
        mock_drone.connect.assert_called_once()
        mock_drone.assert_called_once()
    
    @patch('backend.drone.base_controller.olympe.Drone')
    def test_land(self, mock_drone_class):
        """Test the land method calls the correct Olympe commands"""
        # Setup
        mock_drone = MagicMock()
        mock_drone_class.return_value = mock_drone
        mock_drone.return_value.wait.return_value.success.return_value = True
        
        controller = DroneController()
        
        # Execute
        result = controller.land()
        
        # Assert
        self.assertTrue(result)
        mock_drone.assert_called_once()
        mock_drone.disconnect.assert_called_once()
    
    @patch('backend.drone.sequence_controller.BaseDroneController')
    def test_takeoff_and_land(self, mock_base_controller):
        """Test the takeoff_and_land sequence method"""
        # Setup
        controller = DroneController()
        controller.sequence.takeoff_and_land = MagicMock(return_value=True)
        
        # Execute
        result = controller.takeoff_and_land()
        
        # Assert
        self.assertTrue(result)
        controller.sequence.takeoff_and_land.assert_called_once()
    
    @patch('backend.drone.base_controller.olympe.Drone')
    def test_move_by(self, mock_drone_class):
        """Test the move_by method with specific parameters"""
        # Setup
        mock_drone = MagicMock()
        mock_drone_class.return_value = mock_drone
        mock_drone.return_value.wait.return_value.success.return_value = True
        
        controller = DroneController()
        
        # Execute
        result = controller.move_by(1.0, 2.0, 0.5, 90.0)
        
        # Assert
        self.assertTrue(result)
        mock_drone.assert_called_once()

if __name__ == '__main__':
    unittest.main()
