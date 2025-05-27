import time
from .base_controller import BaseDroneController

# Import the necessary classes from olympe
from olympe.messages.ardrone3.Piloting import TakeOff, Landing

class SequenceDroneController(BaseDroneController):
    def __init__(self, drone_ip=None):
        super().__init__(drone_ip)
    
    def takeoff_and_land(self):
        """Execute a simple takeoff, hover, and land sequence"""
        self.connect()
        takeoff_result = self.drone(TakeOff()).wait().success()
        time.sleep(5)
        landing_result = self.drone(Landing()).wait().success()
        self.disconnect()
        return takeoff_result and landing_result
    
    def square_flight(self, side_length=1.0):
        """Fly in a square pattern"""
        self.connect()
        
        # Take off
        takeoff_success = self.drone(TakeOff()).wait().success()
        if not takeoff_success:
            self.disconnect()
            return False
        
        time.sleep(3)  # Wait for stable hover
        
        # Fly in a square pattern
        moves = [
            (side_length, 0, 0, 0),   # Forward
            (0, side_length, 0, 0),   # Right
            (-side_length, 0, 0, 0),  # Backward
            (0, -side_length, 0, 0),  # Left
        ]
        
        success = True
        for move in moves:
            success = success and self.move_by(*move)
            time.sleep(2)  # Wait between movements
            
        # Land
        landing_success = self.drone(Landing()).wait().success()
        self.disconnect()
        
        return success and landing_success
