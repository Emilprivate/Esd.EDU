import pytest
import sys
import os
from unittest.mock import patch, MagicMock

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

from backend.algorithm import optimize_tsp_path, calculate_tour_distance

def test_optimize_tsp_path_single_grid():
    # Arrange
    grid_data = [{"center": (57.0, 10.0), "corners": [], "coverage": 1.0}]
    
    # Act
    optimized_grid_data, waypoints, path_metrics = optimize_tsp_path(grid_data)
    
    # Assert
    assert len(optimized_grid_data) == 1
    assert len(waypoints) == 1
    assert waypoints[0]["lat"] == 57.0
    assert waypoints[0]["lon"] == 10.0
    assert waypoints[0]["type"] == "grid_center"
    assert path_metrics["total_distance"] == 0
    assert path_metrics["grid_count"] == 1

def test_optimize_tsp_path_multiple_grids():
    # Arrange
    grid_data = [
        {"center": (57.0, 10.0), "corners": [], "coverage": 1.0},
        {"center": (57.01, 10.01), "corners": [], "coverage": 1.0},
        {"center": (57.02, 10.02), "corners": [], "coverage": 1.0}
    ]
    
    # Act
    optimized_grid_data, waypoints, path_metrics = optimize_tsp_path(grid_data)
    
    # Assert
    assert len(optimized_grid_data) == 3
    assert len(waypoints) == 3
    assert path_metrics["grid_count"] == 3
    assert path_metrics["total_distance"] > 0

def test_calculate_tour_distance():
    # Arrange
    tour = [0, 1, 2]
    distances = [
        [0, 100, 200],
        [100, 0, 150],
        [200, 150, 0]
    ]
    
    # Act
    total_distance = calculate_tour_distance(tour, distances)
    
    # Assert
    # Should be: distance(0->1) + distance(1->2) + distance(2->0) = 100 + 150 + 200 = 450
    assert total_distance == 450
