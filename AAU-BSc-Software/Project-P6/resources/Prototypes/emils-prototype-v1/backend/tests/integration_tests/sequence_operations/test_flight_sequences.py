"""
Integration tests for drone flight sequence operations.
These tests use the API to command the physical drone to perform complex flight sequences.
"""
import unittest
import requests
import time
import json
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))
from config import API_BASE_URL

class FlightSequencesIntegrationTest(unittest.TestCase):
    API_URL = f"{API_BASE_URL}/api/drone/sequence"
    
    def test_takeoff_and_land_sequence(self):
        """Test the automated takeoff and land sequence"""
        print("\nTesting takeoff and land sequence operation...")
        
        response = requests.post(f"{self.API_URL}/test-flight")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        print("Takeoff and land sequence completed successfully")
    
    def test_square_flight_sequence(self):
        """Test the automated square flight pattern sequence"""
        print("\nTesting square flight sequence operation...")
        
        payload = {"side_length": 1.0}
        
        response = requests.post(
            f"{self.API_URL}/square-flight", 
            data=json.dumps(payload),
            headers={"Content-Type": "application/json"}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        print("Square flight sequence completed successfully")

if __name__ == "__main__":
    unittest.main()
