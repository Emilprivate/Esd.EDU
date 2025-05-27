from olympe import Drone
import olympe.messages.ardrone3.Piloting as piloting
import olympe.messages.skyctrl.CoPiloting as copiloting
import time

def connect_drone(ip="192.168.53.1"):  # Default SkyController IP
    drone = Drone(ip)
    print("Connecting to SkyController...")
    drone.connect()
    
    # Ensure controller has ownership
    drone(copiloting.setPilotingSource(source="Controller"))
    print("Connection established")
    return drone

def parse_command(drone, cmd):
    try:
        if cmd == "takeoff":
            drone(piloting.TakeOff())
            return
        elif cmd == "land":
            drone(piloting.Landing())
            return
            
        command, value = cmd.split()
        distance = float(value)
        
        if command == "d":  # descend
            drone(piloting.moveBy(0, 0, distance, 0))
        elif command == "a":  # ascend
            drone(piloting.moveBy(0, 0, -distance, 0))
        elif command == "f":  # forward
            drone(piloting.moveBy(distance, 0, 0, 0))
        elif command == "b":  # backward
            drone(piloting.moveBy(-distance, 0, 0, 0))
        elif command == "r":  # right
            drone(piloting.moveBy(0, -distance, 0, 0))
        elif command == "l":  # left
            drone(piloting.moveBy(0, distance, 0, 0))
        elif command == "tr":  # turn right
            drone(piloting.moveBy(0, 0, 0, distance))
        elif command == "tl":  # turn left
            drone(piloting.moveBy(0, 0, 0, -distance))
        else:
            print("Unknown command")
            return
            
        time.sleep(1)  # Wait for movement to complete
        
    except ValueError:
        print("Invalid command format. Use: command distance")
        print("Example: f 1.5")
        print("Or use: takeoff, land")

def main():
    drone = connect_drone()
    
    print("\nDrone Console Controller (SkyController Mode)")
    print("Commands:")
    print("takeoff - take off the drone")
    print("land - land the drone")
    print("d x - descend x meters")
    print("a x - ascend x meters")
    print("f x - forward x meters")
    print("b x - backward x meters")
    print("r x - right x meters")
    print("l x - left x meters")
    print("tr x - turn right x degrees")
    print("tl x - turn left x degrees")
    print("quit - exit program")
    
    try:
        while True:
            cmd = input("\nEnter command: ").lower().strip()
            if cmd == "quit":
                break
            parse_command(drone, cmd)
            
    except KeyboardInterrupt:
        print("\nExiting...")
    finally:
        drone.disconnect()

if __name__ == "__main__":
    main()
