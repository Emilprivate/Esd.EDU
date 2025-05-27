import olympe
import sys
import os

# Fix the imports with more specific references
from olympe.messages.ardrone3.Piloting import TakeOff, Landing, moveBy
from olympe.messages.ardrone3.PilotingState import FlyingStateChanged

# Add the parent directory to path for absolute imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config import DRONE_IP

class BaseDroneController:
    def __init__(self, drone_ip=DRONE_IP):
        self.drone_ip = drone_ip
        self.drone = olympe.Drone(self.drone_ip)
        
    def connect(self):
        return self.drone.connect()
        
    def disconnect(self):
        return self.drone.disconnect()
        
    def takeoff(self):
        self.connect()
        takeoff_result = self.drone(TakeOff()).wait().success()
        return takeoff_result
        
    def land(self):
        landing_result = self.drone(Landing()).wait().success()
        self.disconnect()
        return landing_result
        
    def move_by(self, x, y, z, angle):
        return self.drone(moveBy(x, y, z, angle)).wait().success()
