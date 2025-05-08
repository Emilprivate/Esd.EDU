import unittest
import sys
import os
from app_working_full import calculate_grid_plan, calculate_grid_placement, optimize_tsp_path, improve_solution_with_lk, calculate_tour_distance
import json

class TestAppWorkingFull(unittest.TestCase):
    def test_calculate_grid_plan_valid_input(self):
        # Arrange
        coordinates = [[56.99190968922509, 10.011007189750673], [56.991833709173406, 10.010964274406435], [56.991784029825, 10.011232495307922], [56.99185708766739, 10.011248588562013]]
        altitude = 20
        overlap = 20
        coverage = 0.8
        drone_start_point = [56.991855333333326, 10.010852833333333]

        # Act
        result = calculate_grid_plan(coordinates, altitude, overlap, coverage, drone_start_point=drone_start_point)
        result["metadata"]["created_at"] = "2025-05-05T20:55:16.899678"

        # Load expected result from file
        valid_output_file_path = os.path.join(os.path.dirname(__file__), 'test_data', 'valid_grid_plan.json')
        with open(valid_output_file_path, 'r') as f:
            expected_result = json.load(f)
        self.assertEqual(result, expected_result)

if __name__ == "__main__":
    unittest.main()