"""
Integration tests for basic drone movement operations.
These tests use the API to command the physical drone.
"""
import unittest
import requests
import time
import json
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))
from config import API_BASE_URL

class MovementIntegrationTest(unittest.TestCase):
    API_URL = f"{API_BASE_URL}/api/drone/basic"

    def test_move_forward(self):
        """Test moving the drone forward by 1 meter"""
        print("\nTesting drone movement: forward 1 meter...")

        # 1) First takeoff
        response = requests.post(f"{self.API_URL}/takeoff")
        self.assertEqual(response.status_code, 200)
        print("Drone took off successfully, waiting for stabilization...")
        time.sleep(3)

        # 2) Move forward 1 meter
        payload = {
            "x": 1.0,
            "y": 0.0,
            "z": 0.0,
            "angle": 0.0
        }
        
        response = requests.post(
            f"{self.API_URL}/move", 
            data=json.dumps(payload),
            headers={"Content-Type": "application/json"}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        print("Moved forward 1 meter successfully, waiting 3 seconds...")
        time.sleep(3)
        
        # 3) Land the drone
        response = requests.post(f"{self.API_URL}/land")
        self.assertEqual(response.status_code, 200)
        print("Drone landed successfully")
    
    def test_manual_square_pattern(self):
        """Test flying the drone in a square pattern using individual move commands"""
        print("\nTesting drone movement: manual square pattern (1m sides)...")
        
        # 1) First takeoff
        response = requests.post(f"{self.API_URL}/takeoff")
        self.assertEqual(response.status_code, 200)
        print("Drone took off successfully, waiting for stabilization...")
        time.sleep(3)
        
        # 2) Execute a square pattern
        moves = [
            {"x": 1.0, "y": 0.0, "z": 0.0, "angle": 0.0},  # Forward
            {"x": 0.0, "y": 1.0, "z": 0.0, "angle": 0.0},  # Right
            {"x": -1.0, "y": 0.0, "z": 0.0, "angle": 0.0}, # Backward
            {"x": 0.0, "y": -1.0, "z": 0.0, "angle": 0.0}, # Left
        ]
        
        for i, move in enumerate(moves):
            print(f"Executing move {i+1} of square pattern...")
            
            response = requests.post(
                f"{self.API_URL}/move", 
                data=json.dumps(move),
                headers={"Content-Type": "application/json"}
            )
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])
            time.sleep(3)
        
        # 3) Land the drone
        response = requests.post(f"{self.API_URL}/land")
        self.assertEqual(response.status_code, 200)
        print("Drone landed successfully after completing square pattern")

if __name__ == "__main__":
    unittest.main()
