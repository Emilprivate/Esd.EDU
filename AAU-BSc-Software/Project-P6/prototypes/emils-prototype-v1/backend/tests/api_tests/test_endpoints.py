"""
API tests for verifying endpoint functionality.
These tests mock the drone controller to avoid physical drone operations.
"""
import unittest
import sys
import os
import json
from unittest.mock import patch, MagicMock
from flask import Flask

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))
from backend.api_endpoints.basic_operations import basic_ops_bp
from backend.api_endpoints.sequence_operations import sequence_ops_bp

class EndpointTests(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.register_blueprint(basic_ops_bp, url_prefix='/api/drone/basic')
        self.app.register_blueprint(sequence_ops_bp, url_prefix='/api/drone/sequence')
        self.client = self.app.test_client()
    
    @patch('backend.api_endpoints.basic_operations.drone_controller')
    def test_takeoff_endpoint(self, mock_controller):
        """Test that the takeoff endpoint returns the expected response"""
        mock_controller.takeoff.return_value = True
        
        response = self.client.post('/api/drone/basic/takeoff')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data['success'])
        self.assertEqual(data['message'], 'Takeoff command executed')
        mock_controller.takeoff.assert_called_once()
    
    @patch('backend.api_endpoints.basic_operations.drone_controller')
    def test_land_endpoint(self, mock_controller):
        """Test that the land endpoint returns the expected response"""
        mock_controller.land.return_value = True
        
        response = self.client.post('/api/drone/basic/land')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data['success'])
        self.assertEqual(data['message'], 'Landing command executed')
        mock_controller.land.assert_called_once()
    
    @patch('backend.api_endpoints.basic_operations.drone_controller')
    def test_move_endpoint(self, mock_controller):
        """Test that the move endpoint returns the expected response"""
        mock_controller.move_by.return_value = True
        
        payload = {"x": 1.0, "y": 0.5, "z": 0.0, "angle": 90.0}
        response = self.client.post('/api/drone/basic/move', 
                                   json=payload,
                                   content_type='application/json')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data['success'])
        mock_controller.move_by.assert_called_once_with(1.0, 0.5, 0.0, 90.0)
    
    @patch('backend.api_endpoints.sequence_operations.drone_controller')
    def test_test_flight_endpoint(self, mock_controller):
        """Test that the test-flight endpoint returns the expected response"""
        mock_controller.takeoff_and_land.return_value = True
        
        response = self.client.post('/api/drone/sequence/test-flight')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data['success'])
        mock_controller.takeoff_and_land.assert_called_once()
    
    @patch('backend.api_endpoints.sequence_operations.drone_controller')
    def test_square_flight_endpoint(self, mock_controller):
        """Test that the square-flight endpoint returns the expected response"""
        mock_controller.square_flight.return_value = True
        
        payload = {"side_length": 2.0}
        response = self.client.post('/api/drone/sequence/square-flight',
                                   json=payload,
                                   content_type='application/json')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data['success'])
        mock_controller.square_flight.assert_called_once_with(2.0)

if __name__ == '__main__':
    unittest.main()
