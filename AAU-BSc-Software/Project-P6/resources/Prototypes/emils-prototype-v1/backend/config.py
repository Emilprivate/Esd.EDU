import os

# Drone configuration
DRONE_IP = os.environ.get("DRONE_IP", "192.168.42.1")
DRONE_RTSP_PORT = os.environ.get("DRONE_RTSP_PORT", "554")

# API configuration
API_HOST = os.environ.get("API_HOST", "0.0.0.0")
API_PORT = int(os.environ.get("API_PORT", "5000"))
API_BASE_URL = f"http://localhost:{API_PORT}"

# Path planning configuration
DEFAULT_ALTITUDE = 2.0  # meters
