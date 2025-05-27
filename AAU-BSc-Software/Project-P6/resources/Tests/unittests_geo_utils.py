import unittest
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from geo_utils import create_local_projection, calculate_grid_size

class TestGeoUtils(unittest.TestCase):
    def test_create_local_projection_identity(self):
        center_lat, center_lon = 56.0, 10.0
        to_local, to_wgs84 = create_local_projection(center_lat, center_lon)
        lon, lat = 10.001, 56.001
        x, y = to_local(lon, lat)
        lon2, lat2 = to_wgs84(x, y)
        self.assertAlmostEqual(lon, lon2, places=6)
        self.assertAlmostEqual(lat, lat2, places=6)

    def test_create_local_projection_zero(self):
        center_lat, center_lon = 56.0, 10.0
        to_local, _ = create_local_projection(center_lat, center_lon)
        x, y = to_local(center_lon, center_lat)
        self.assertAlmostEqual(x, 0.0, places=6)
        self.assertAlmostEqual(y, 0.0, places=6)

    def test_calculate_grid_size_zero_altitude(self):
        width, height = calculate_grid_size(0)
        self.assertEqual(width, 0)
        self.assertEqual(height, 0)

    def test_calculate_grid_size_negative_altitude(self):
        width, height = calculate_grid_size(-10)
        self.assertLess(width, 0)
        self.assertLess(height, 0)

if __name__ == "__main__":
    unittest.main()
    