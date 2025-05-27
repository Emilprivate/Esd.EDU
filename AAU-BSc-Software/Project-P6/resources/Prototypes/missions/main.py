from olympe import Anafi
from olympe.messages.ardrone3.Piloting import TakeOff, Landing, moveTo, moveBy
from olympe.messages.ardrone3.PilotingState import FlyingStateChanged, moveToChanged
from olympe.messages.ardrone3.GPSSettingsState import GPSFixStateChanged
from olympe.enums.ardrone3.Piloting import MoveTo_Orientation_mode as orientation_mode
from olympe.enums.ardrone3.PilotingState import MoveToChanged_Status as status
import time

DRONE_IP = "192.168.53.1"  # Replace with your drone's IP address

def main():
    drone = Anafi(DRONE_IP)
    
    print("Connecting to drone...")
    drone.connect()
    
    try:
        # Wait for GPS fix
        print("Waiting for GPS fix...")
        drone(GPSFixStateChanged(fixed=1, _timeout=30)).wait().success()

        # Take off
        print("Taking off...")
        drone(
            TakeOff()
            >> FlyingStateChanged(state="hovering", _timeout=5)
        ).wait().success()

        drone(
            moveBy(0,0,-10,0)
        ).wait().success()

        print("Moving to target location...")
        drone(
            moveTo(57.0138946, 9.9919226, 10.0, orientation_mode.TO_TARGET, 0.0)
            >> moveToChanged(status=status.DONE, _timeout=10)
        ).wait().success()

        # Move to a specific location
        print("Moving to target location...")
        drone(
            moveTo(57.012915, 9.991932, 10.0, orientation_mode.TO_TARGET, 0.0)
            >> moveToChanged(status=status.DONE, _timeout=10)
        ).wait().success()

        # Land
        print("Landing...")
        drone(
            Landing()
            >> FlyingStateChanged(state="landed", _timeout=5)
        ).wait().success()

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        # Always disconnect the drone
        print("Disconnecting...")
        drone.disconnect()

if __name__ == "__main__":
    main()

