from olympe import SkyController3
import olympe.messages.ardrone3.Piloting as piloting
import olympe.messages.skyctrl.CoPiloting as copiloting
import time

CONTROLLER_IP = "192.168.53.1"  # Default SkyController IP

def connect_controller(ip=CONTROLLER_IP):
    controller = SkyController3(ip)
    print("Connecting to SkyController...")
    controller.connect()
    controller.start_piloting()
    
    # Ensure controller has ownership
    # This step is not necessary when using SkyController3 directly
    # controller(copiloting.setPilotingSource(source="Controller"))
    print("Connection established")
    return controller

def parse_command(controller, cmd):
    try:
        if cmd == "takeoff":
            assert controller(piloting.TakeOff()).wait().success()
            return
        elif cmd == "land":
            assert controller(piloting.Landing()).wait().success()
            return
            
        command, value = cmd.split()
        distance = float(value)
        
        if command == "d":  # descend
            assert controller(piloting.moveBy(0, 0, distance, 0)).wait().success()
        elif command == "a":  # ascend
            assert controller(piloting.moveBy(0, 0, -distance, 0)).wait().success()
        elif command == "f":  # forward
            assert controller(piloting.moveBy(distance, 0, 0, 0)).wait().success()
        elif command == "b":  # backward
            assert controller(piloting.moveBy(-distance, 0, 0, 0)).wait().success()
        elif command == "r":  # right
            assert controller(piloting.moveBy(0, -distance, 0, 0)).wait().success()
        elif command == "l":  # left
            assert controller(piloting.moveBy(0, distance, 0, 0)).wait().success()
        elif command == "tr":  # turn right
            assert controller(piloting.moveBy(0, 0, 0, distance)).wait().success()
        elif command == "tl":  # turn left
            assert controller(piloting.moveBy(0, 0, 0, -distance)).wait().success()
        else:
            print("Unknown command")
            return
            
        time.sleep(1)  # Wait for movement to complete
        
    except ValueError:
        print("Invalid command format. Use: command distance")
        print("Example: f 1.5")
        print("Or use: takeoff, land")

def main():
    controller = connect_controller()
    
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
            parse_command(controller, cmd)
            
    except KeyboardInterrupt:
        print("\nExiting...")
    finally:
        controller.stop_piloting()
        controller.disconnect()

if __name__ == "__main__":
    main()