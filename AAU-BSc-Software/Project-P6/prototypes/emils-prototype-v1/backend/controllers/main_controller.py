import sys
import os
from .base_controller import BaseDroneController
from .sequence_controller import SequenceDroneController

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config import DRONE_IP

class DroneController:
    """
    Main facade controller that provides a single unified interface for drone operations.
    
    This controller delegates tasks to specialized controllers:
    - BaseDroneController: Handles basic individual commands
    - SequenceDroneController: Handles complex sequences of commands
    
    This design allows endpoints to use a single controller without
    needing to know which specialized controller handles which command.
    """
    
    def __init__(self, drone_ip=DRONE_IP):
        self.base = BaseDroneController(drone_ip)
        self.sequence = SequenceDroneController(drone_ip)
    
    # -------- Basic operations delegated to base controller --------
    
    def connect(self):
        """Connect to the drone"""
        return self.base.connect()
        
    def disconnect(self):
        """Disconnect from the drone"""
        return self.base.disconnect()
        
    def takeoff(self):
        """Send takeoff command to the drone"""
        return self.base.takeoff()
        
    def land(self):
        """Send landing command to the drone"""
        return self.base.land()
        
    def move_by(self, x, y, z, angle):
        """Move the drone by the specified amounts"""
        return self.base.move_by(x, y, z, angle)
    
    # -------- Sequence operations delegated to sequence controller --------
    
    def takeoff_and_land(self):
        """Execute a takeoff followed by landing after a delay"""
        return self.sequence.takeoff_and_land()
        
    def square_flight(self, side_length=1.0):
        """Execute a square flight pattern with the given side length"""
        return self.sequence.square_flight(side_length)
