import pytest
import math
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

from backend.geo_utils import create_local_projection, calculate_grid_size

def test_create_local_projection():
    center_lat = 57.0128
    center_lon = 9.9905
    
    to_local, to_wgs84 = create_local_projection(center_lat, center_lon)
    
    lon, lat = 9.9915, 57.0138
    x, y = to_local(lon, lat)
    back_lon, back_lat = to_wgs84(x, y)
    
    assert x > 0
    assert y > 0
    assert abs(x) < 1000
    assert abs(y) < 1000
    
    assert abs(lon - back_lon) < 0.0001
    assert abs(lat - back_lat) < 0.0001

def test_calculate_grid_size():
    altitudes = [10, 20, 30, 50, 100]
    
    for altitude in altitudes:
        width, height = calculate_grid_size(altitude)
        
        assert width > height
        
        if altitude > 10:
            prev_width, prev_height = calculate_grid_size(altitude / 2)
            assert abs(width / prev_width - 2) < 0.1
            assert abs(height / prev_height - 2) < 0.1
        
        assert width > altitude * 0.5
        assert height > altitude * 0.3
        
        assert 1.2 < (width / height) < 1.5
