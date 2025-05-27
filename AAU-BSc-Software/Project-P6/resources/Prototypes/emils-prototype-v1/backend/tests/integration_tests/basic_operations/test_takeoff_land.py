"""
Integration tests for basic takeoff and landing operations.
These tests use the API to command the physical drone.
"""
import unittest
import requests
import time
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))
from config import API_BASE_URL

class TakeoffLandIntegrationTest(unittest.TestCase):
    
    API_URL = f"{API_BASE_URL}/api/drone/basic"
    
    def test_takeoff_land_cycle(self):
        """Test the basic takeoff and landing cycle on the physical drone"""
        print("\nTesting basic takeoff and landing cycle on physical drone...")
        
        # 1) Test takeoff
        response = requests.post(f"{self.API_URL}/takeoff")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        print("Takeoff successful, waiting 5 seconds in the air...")
        
        time.sleep(5)
        
        # 2) Test landing
        response = requests.post(f"{self.API_URL}/land")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        print("Landing successful")

if __name__ == "__main__":
    unittest.main()
