import unittest
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
import json
from algorithm import (
    grid_based_algorithm,
)

test_data_path = os.path.join(os.path.dirname(__file__), 'test_data')

class TestAlgorithmIntegration(unittest.TestCase):
    def setUp(self):
        self.coords = [
            [56.99190968922509, 10.011007189750673],
            [56.991833709173406, 10.010964274406435],
            [56.991784029825, 10.011232495307922],
            [56.99185708766739, 10.011248588562013]
        ]
        self.altitude = 20
        self.overlap = 20
        self.coverage = 0.2
        self.drone_start_point = [56.991855333333326, 10.010852833333333]

    def test_grid_based_algorithm_output_structure(self):
        result = grid_based_algorithm(
            self.coords, self.altitude, self.overlap, self.coverage, drone_start_point=self.drone_start_point
        )
        self.assertIn("grid_count", result)
        self.assertIn("grids", result)
        self.assertIn("path", result)
        self.assertIn("path_metrics", result)
        self.assertIn("metadata", result)
        self.assertIsInstance(result["grids"], list)
        self.assertGreater(result["grid_count"], 0)

    def test_grid_based_algorithm_invalid_polygon(self):
        bad_coords = [[0,0], [0,1], [0,2], [0,3]]
        with self.assertRaises(Exception):
            grid_based_algorithm(bad_coords, self.altitude, self.overlap, self.coverage)

    def test_calculate_grid_plan_valid_input(self):
        result = grid_based_algorithm(self.coords, self.altitude, self.overlap, self.coverage, drone_start_point=self.drone_start_point)
        result["metadata"]["created_at"] = "2025-05-05T20:55:16.899678"

        valid_output_file_path = os.path.join(os.path.dirname(__file__), 'test_data', 'valid_grid_plan.json')
        with open(valid_output_file_path, 'r') as f:
            expected_result = json.load(f)
        self.assertEqual(result, expected_result)

    def test_grid_based_algorithm_with_different_start_point(self):
        new_start_point = [56.991800, 10.011000]
        result = grid_based_algorithm(
            self.coords, self.altitude, self.overlap, self.coverage, drone_start_point=new_start_point
        )
        self.assertIn("path", result)
        self.assertNotEqual(result["path"][0], self.drone_start_point)
    
if __name__ == "__main__":
    unittest.main()