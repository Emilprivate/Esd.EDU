import pytest
import sys
import os
from unittest.mock import patch

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

from backend.algorithm import grid_based_algorithm
from backend.geo_utils import create_local_projection, calculate_grid_size

def test_algorithm_with_geo_utils_simple_square():
    """Test the algorithm with a simple square area."""
    
    # Arrange - simple square in Aalborg
    coordinates = [
        (57.0128, 9.9905),  # Southwest corner
        (57.0128, 9.9925),  # Southeast corner
        (57.0148, 9.9925),  # Northeast corner
        (57.0148, 9.9905)   # Northwest corner
    ]
    altitude = 20.0
    overlap = 30.0
    coverage = 80.0
    
    # Act
    result = grid_based_algorithm(
        coordinates=coordinates, 
        altitude=altitude, 
        overlap=overlap, 
        coverage=coverage/100
    )
    
    # Assert
    assert "grid_count" in result
    assert result["grid_count"] > 0
    assert "grids" in result
    assert "path" in result
    assert "path_metrics" in result
    
    # Verify some basic properties of the grid
    for grid in result["grids"]:
        assert "center" in grid
        assert "lat" in grid["center"]
        assert "lon" in grid["center"]
        assert "corners" in grid
        assert len(grid["corners"]) == 4
    
    # Verify some basic properties of the path
    for waypoint in result["path"]:
        assert "lat" in waypoint
        assert "lon" in waypoint
        assert "type" in waypoint
    
    # Verify path metrics
    assert "total_distance" in result["path_metrics"]
    assert "grid_count" in result["path_metrics"]
    assert "estimated_flight_time" in result["path_metrics"]
    assert result["path_metrics"]["grid_count"] == result["grid_count"]

def test_algorithm_with_geo_utils_triangle():
    """Test the algorithm with a triangular area."""
    
    # Arrange - simple triangle in Aalborg
    coordinates = [
        (57.0128, 9.9905),  # South point
        (57.0148, 9.9925),  # Northeast point
        (57.0148, 9.9905)   # Northwest point
    ]
    altitude = 20.0
    overlap = 30.0
    coverage = 80.0
    
    # Act
    result = grid_based_algorithm(
        coordinates=coordinates, 
        altitude=altitude, 
        overlap=overlap, 
        coverage=coverage/100
    )
    
    # Assert
    assert "grid_count" in result
    assert result["grid_count"] > 0
    
    # Verify path continuity - each waypoint should be close to the next
    for i in range(len(result["path"]) - 1):
        wp1 = result["path"][i]
        wp2 = result["path"][i+1]
        
        if wp1["type"] == "grid_center" and wp2["type"] == "grid_center":
            # Calculate approximate distance in degrees (very rough approximation)
            dist = ((wp1["lat"] - wp2["lat"])**2 + (wp1["lon"] - wp2["lon"])**2)**0.5
            # Should not be too far apart (reasonable for a grid pattern)
            assert dist < 0.01
