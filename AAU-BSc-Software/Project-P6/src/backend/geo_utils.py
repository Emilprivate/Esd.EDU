import math

def create_local_projection(center_lat, center_lon):
    """Create a local projection for converting between geographic and local coordinates"""
    # Conversion factors
    earth_radius = 6371000  # in meters
    lat_to_m = 111320  # approximate meters per degree of latitude

    # Calculate longitude conversion factor at given latitude
    lon_to_m = 111320 * math.cos(math.radians(center_lat))

    # Convert to local coordinates (meters)
    def to_local(lon, lat):
        x = (lon - center_lon) * lon_to_m
        y = (lat - center_lat) * lat_to_m
        return (x, y)

    # Convert back to geographic coordinates
    def to_wgs84(x, y):
        lon = center_lon + (x / lon_to_m)
        lat = center_lat + (y / lat_to_m)
        return (lon, lat)

    return to_local, to_wgs84

def calculate_grid_size(altitude):
    """Calculate the grid size based on the altitude and rectilinear camera parameters"""
    # Rectilinear camera parameters for Anafi
    horizontal_fov_deg = 75.5  # degrees
    vertical_fov_deg = horizontal_fov_deg * (3 / 4)  # 4:3 aspect ratio

    horizontal_fov = math.radians(horizontal_fov_deg)
    vertical_fov = math.radians(vertical_fov_deg)

    # Calculate ground footprint
    width = 2 * altitude * math.tan(horizontal_fov / 2)
    height = 2 * altitude * math.tan(vertical_fov / 2)

    return width, height