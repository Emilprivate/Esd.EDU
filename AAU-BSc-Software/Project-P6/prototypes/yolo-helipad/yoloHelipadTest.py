import os
import cv2
import time
import olympe
from ultralytics import YOLO
import threading
from queue import Queue
import math
from olympe.messages.ardrone3.Piloting import TakeOff, Landing, moveTo, moveBy
from olympe.messages.ardrone3.PilotingState import AltitudeChanged, GpsLocationChanged
from olympe.messages.gimbal import set_target
from olympe.messages.ardrone3.PilotingState import FlyingStateChanged, moveToChanged
from olympe.messages.ardrone3.Piloting import PCMD
from olympe.messages.ardrone3.Piloting import TakeOff, Landing
frame_queue = Queue(maxsize=1)
frame_queue2 = Queue(maxsize=1)
result_queue = Queue(maxsize=1)
error_result_queue = Queue(maxsize=1)

Kp_x, Ki_x, Kd_x = 0.1, 0.01, 0.05
Kp_y, Ki_y, Kd_y = 0.1, 0.01, 0.05

# Set up video capture
CONTROLLER_IP = os.environ.get("CONTROLLER_IP", "10.202.0.1")
RTSP_URL = f"rtsp://{CONTROLLER_IP}/live"

controller = olympe.Anafi(CONTROLLER_IP)
controller.connect()
cap = cv2.VideoCapture(RTSP_URL)
# cap = cv2.VideoCaptures(0)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
cap.set(cv2.CAP_PROP_FPS, 30)
cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'H264'))

error_x = 0
error_y = 0

yolo = YOLO("best.pt")
controller(set_target(
        gimbal_id=0,
        control_mode="position",
        yaw_frame_of_reference="absolute",
        yaw=0.0,
        pitch_frame_of_reference="absolute",
        pitch=-90.0,  # -90 degrees = pointing straight down
        roll_frame_of_reference="absolute",
        roll=0.0,
    )).wait()

def capture_thread():
    while True:
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.1)
            continue
        
        if not frame_queue.full():
            frame_queue.put(frame)
        else:
            try:
                frame_queue.get_nowait()
            except:
                pass
            frame_queue.put(frame)

def process_thread():
    while True:
        try:
            frame = frame_queue.get(timeout=1.0)
            
            processed_frame = frame.copy()
            results = yolo.track(processed_frame, stream=True)
            
            for result in results:
                classes_names = result.names
                for box in result.boxes:
                    if box.conf[0] > 0.4:
                        [x1, y1, x2, y2] = box.xyxy[0]
                        x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                        cls = int(box.cls[0])
                        class_name = classes_names[cls]
                        colour = (255, 0, 0)
                        cv2.rectangle(processed_frame, (x1, y1), (x2, y2), colour, 2)
                        cv2.putText(processed_frame, f'{class_name} {box.conf[0]:.2f}', 
                                   (x1, y1), cv2.FONT_HERSHEY_SIMPLEX, 1, colour, 2)
                # Wphys​=2⋅Z⋅tan(FOVx​​/2)
                # Hphys​=2⋅Z⋅tan(2FOVy​​/2)
                # ΔX=errorx​×Wphys​​,ΔY=errory​×Hphys​​ø
                try:
                    altitude = controller.get_state(AltitudeChanged)["altitude"]
                    # altitude = 0.8
                    
                    FOVx = 69 * (math.pi / 180)  # horizontal FOV in radians
                    FOVy = 43 * (math.pi / 180)  # vertical FOV in radians
                    
                    Wphys = 2 * altitude * math.tan(FOVx/2)
                    Hphys = 2 * altitude * math.tan(FOVy/2)
                    
                    cv2.putText(processed_frame, f'Alt: {altitude:.1f}m', 
                                (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                    
                    for box in result.boxes:
                        if box.conf[0] > 0.4:
                            [x1, y1, x2, y2] = box.xyxy[0]
                            center_x = (x1 + x2) / 2
                            center_y = (y1 + y2) / 2
                            
                            frame_center_x = processed_frame.shape[1] / 2
                            frame_center_y = processed_frame.shape[0] / 2
                            
                            error_x = (center_x - frame_center_x) / frame_center_x
                            error_y = (center_y - frame_center_y) / frame_center_y
                            
                            delta_X = error_x * (Wphys / 2)
                            delta_Y = error_y * (Hphys / 2)

                            if not error_result_queue.full():
                                error_result_queue.put((delta_X, delta_Y))
                            
                            cv2.putText(processed_frame, f'dX: {delta_X:.1f}m dY: {delta_Y:.1f}m', 
                                      (int(x1), int(y1) - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
                except Exception as e:
                    print(f"Error getting altitude/calculating dimensions: {e}")

            if not result_queue.full():
                result_queue.put(processed_frame)
            else:
                try:
                    result_queue.get_nowait()
                except:
                    pass
                result_queue.put(processed_frame)
                
        except Exception as e:
            print(f"Processing error: {e}")
            time.sleep(0.1)

def pid_controller(error, last_error, integral, dt, Kp, Ki, Kd):
    integral += error * dt
    derivative = (error - last_error) / dt if dt > 0 else 0.0
    output = Kp * error + Ki * integral + Kd * derivative
    return output, integral

def send_velocity_command(vx, vy, vz=0):
    roll_value = int(-100 * vy)
    pitch_value = int(-100 * vx)
    gaz_value = int(100 * vz)
    timestamp_ms = int(time.time() * 1000) & 0xFFFFFF
    seq_num = 0
    timestamp_and_seq = timestamp_ms | (seq_num << 24)

    controller(PCMD(
        1,
        roll_value,
        pitch_value,
        0,
        gaz_value,
        timestamp_and_seq
    ))

def flying_thread():
    controller.start_piloting()
    start_altitude = controller.get_state(AltitudeChanged)["altitude"]
    controller(TakeOff()).wait().success()
    controller(
            moveBy(0, 0, -5, 0)
            >> FlyingStateChanged(state="hovering", _timeout=10)
        ).wait().success()

    time.sleep(3)  # Shorter pause before starting control
    
    # Initialize PID variables
    error_x, error_y = 0, 0
    last_error_x, last_error_y = 0, 0
    integral_x, integral_y = 0, 0
    last_time = time.time()
    
    # Increase PID gains for more responsive movement
    Kp_x, Ki_x, Kd_x = 0.3, 0.01, 0.1  # Stronger proportional and derivative
    Kp_y, Ki_y, Kd_y = 0.3, 0.01, 0.1
    
    # Main control loop
    while True:
        current_time = time.time()
        dt = current_time - last_time
        last_time = current_time

        if not error_result_queue.empty():
            (error_x, error_y) = error_result_queue.get()
            print(f"Current errors - X: {error_x:.2f}m, Y: {error_y:.2f}m")

        # Calculate PID outputs
        output_x, integral_x = pid_controller(error_x, last_error_x, integral_x, dt, Kp_x, Ki_x, Kd_x)
        output_y, integral_y = pid_controller(error_y, last_error_y, integral_y, dt, Kp_y, Ki_y, Kd_y)

        # Update last errors
        last_error_x, last_error_y = error_x, error_y

        # Apply command with clearer velocity mapping
        vx = -max(min(output_x, 1.0), -1.0)  # Invert X to match drone orientation
        vy = -max(min(output_y, 1.0), -1.0)  # Invert Y to match drone orientation
        
        # Send velocity commands
        print(f"Sending velocities - X: {vx:.2f}, Y: {vy:.2f}")
        send_velocity_command(vx, vy)
        
        # Send commands more frequently (20-30Hz is ideal)
        time.sleep(0.05)

threading.Thread(target=capture_thread, daemon=True).start()
threading.Thread(target=process_thread, daemon=True).start()
threading.Thread(target=flying_thread, daemon=True).start()


while True:
    try:
        displayed_frame = result_queue.get(timeout=0.1)
        cv2.imshow('frame', displayed_frame)
    except:
        pass
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()

controller.stop_piloting()
controller.disconnect()