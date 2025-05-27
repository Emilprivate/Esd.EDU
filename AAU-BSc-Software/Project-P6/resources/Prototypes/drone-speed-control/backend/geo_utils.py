import pyproj
from functools import partial
import math

WIDE_HFOV_DEGREES = 84
WIDE_ASPECT_RATIO = 4/3
RECTILINEAR_HFOV_DEGREES = 75.5

def create_local_projection(center_lat, center_lon):
    """Create a local projection centered at a specific latitude/longitude"""
    proj_str = f"+proj=tmerc +lat_0={center_lat} +lon_0={center_lon} +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs"
    local_proj = pyproj.Proj(proj_str)
    wgs84 = pyproj.Proj(init='epsg:4326')
    
    to_local = partial(pyproj.transform, wgs84, local_proj)
    to_wgs84 = partial(pyproj.transform, local_proj, wgs84)
    
    return to_local, to_wgs84

def calculate_grid_size(altitude, hfov_degrees=WIDE_HFOV_DEGREES, aspect_ratio=WIDE_ASPECT_RATIO):
    """Calculate the ground footprint dimensions based on altitude and camera specs"""
    if altitude <= 0 or altitude > 40:
        raise ValueError("Altitude must be between 0 and 40 meters")
    
    hfov_radians = math.radians(hfov_degrees)
    width = 2 * altitude * math.tan(hfov_radians / 2)
    height = width / aspect_ratio
    
    return width, height
