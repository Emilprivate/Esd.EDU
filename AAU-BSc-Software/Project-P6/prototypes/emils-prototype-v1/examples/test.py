import olympe
import os
import time
from olympe.messages.ardrone3.Piloting import TakeOff, Landing

DRONE_IP = os.environ.get("192.168.42.1", "192.168.42.1")


def test_takeoff():
    drone = olympe.Drone(DRONE_IP)
    drone.connect()
    assert drone(TakeOff()).wait().success()
    time.sleep(2)
    drone(moveBy(1, 0, 0, 0)).wait().success()
    time.sleep(5)
    assert drone(Landing()).wait().success()
    drone.disconnect()


if __name__ == "__main__":
    test_takeoff()
