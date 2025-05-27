import unittest
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
import json
from unittest.mock import patch, MagicMock
from shapely.geometry import Polygon
from algorithm import (
    calculate_grid_placement,
    optimize_tsp_path,
)

test_data_path = os.path.join(os.path.dirname(__file__), 'test_data')

class TestAlgorithmUnit(unittest.TestCase):
    def setUp(self):
        self.square_coords = [
            [0.0, 0.0],
            [0.0, 0.001],
            [0.001, 0.001],
            [0.001, 0.0]
        ]
        self.altitude = 10
        self.overlap = 20
        self.coverage = 0.2

    def test_calculate_grid_placement_basic(self):
        grid_data, polygon_area, not_searched_area, extra_area = calculate_grid_placement(
            self.square_coords, self.altitude, self.overlap, self.coverage
        )
        self.assertTrue(len(grid_data) > 0)
        self.assertTrue(polygon_area > 0)
        self.assertTrue(all("center" in grid for grid in grid_data))

    def test_calculate_grid_placement_no_coverage(self):
        with self.assertRaises(ValueError):
            calculate_grid_placement(self.square_coords, self.altitude, self.overlap, 1.1)

    def test_optimize_tsp_path_single_grid(self):
        grid_data = [{"center": (0.0, 0.0), "corners": [(0,0),(0,1),(1,1),(1,0)]}]
        optimized, waypoints, metrics = optimize_tsp_path(grid_data, start_point=(0.0, 0.0))
        self.assertEqual(len(optimized), 1)
        self.assertEqual(metrics["grid_count"], 1)

    def test_optimize_tsp_path_empty(self):
        optimized, waypoints, metrics = optimize_tsp_path([], start_point=(0.0, 0.0))
        self.assertEqual(optimized, [])
        self.assertEqual(waypoints, [])
        self.assertEqual(metrics, {})
        
    def test_optimize_tsp_path_positive(self):
        # Arrange
        grid_data = [
            {"center": (56.99190968922509, 10.011007189750673)},
            {"center": (56.991833709173406, 10.010964274406435)},
            {"center": (56.991784029825, 10.011232495307922)},
            {"center": (56.99185708766739, 10.011248588562013)}
        ]
        start_point = (56.991855333333326, 10.010852833333333)

        # Act
        optimized_grid_data, waypoints, path_metrics = optimize_tsp_path(grid_data, start_point)

        with open(os.path.join(test_data_path, 'valid_optimized_tsp_path_output.json'), 'r') as f:
            expected_result = json.load(f)

        # Assert
        for idx, optimized_grid_entry in enumerate(optimized_grid_data):
            self.assertEqual(optimized_grid_entry['center'][0], expected_result[0][idx]['center'][0])
            self.assertEqual(optimized_grid_entry['center'][1], expected_result[0][idx]['center'][1])
        self.assertEqual(waypoints, expected_result[1])
        self.assertEqual(path_metrics, expected_result[2])

if __name__ == "__main__":
    unittest.main()