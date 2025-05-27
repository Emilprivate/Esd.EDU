import unittest
from main import DroneCamera, generate_flight_path, plan_flight

class TestFlightPlanner(unittest.TestCase):
    
    def test_drone_camera_specs(self):
        camera = DroneCamera()
        self.assertEqual(camera.resolution_width, 4608)
        self.assertEqual(camera.resolution_height, 3456)
        self.assertEqual(camera.hfov, 75.5)
        
    def test_camera_ground_coverage(self):
        camera = DroneCamera()
        width, height = camera.get_ground_coverage(50)  # 50m altitude
        # Assert that the width is greater than the height (4:3 aspect ratio)
        self.assertGreater(width, height)
        # Check if the coverage is reasonable for the given altitude
        self.assertGreater(width, 50)  # At 50m with 75.5° HFOV, width should be greater than 50m
        
    def test_flight_path_generation(self):
        test_coordinates = [
            (55.4050, 10.3960),
            (55.4055, 10.3970),
            (55.4060, 10.3965),
            (55.4055, 10.3955)
        ]
        altitude = 50
        
        flight_path = plan_flight(test_coordinates, altitude)
        
        # Check that we have waypoints
        self.assertTrue(len(flight_path) > 0)
        
        # Check waypoint structure
        waypoint = flight_path[0]
        self.assertIn("lat", waypoint)
        self.assertIn("lon", waypoint)
        self.assertIn("alt", waypoint)
        self.assertIn("action", waypoint)
        self.assertEqual(waypoint["alt"], altitude)
        self.assertEqual(waypoint["action"], "take_photo")

if __name__ == '__main__':
    unittest.main()
