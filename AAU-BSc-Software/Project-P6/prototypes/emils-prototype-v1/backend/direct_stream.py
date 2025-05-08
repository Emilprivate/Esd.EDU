import olympe
import os
import time
import traceback
from threading import Thread, Lock
import cv2

from olympe.video.pdraw import Pdraw, PdrawState
from olympe.messages import onboard_tracker

DRONE_IP = os.environ.get("DRONE_IP", "192.168.42.1")
DRONE_RTSP_PORT = os.environ.get("DRONE_RTSP_PORT", "554")

class DirectStreamController:
    def __init__(self):
        self.drone = None
        self.pdraw = None
        self.frame = None
        self.running = False
        self.frame_lock = Lock()
        self.processing_thread = None
        self.frame_count = 0
        
    def _frame_callback(self, yuv_frame):
        """Callback function for each frame from pdraw"""
        if yuv_frame is None or not self.running:
            return
            
        try:
            # Get YUV frame as numpy array
            yuv_array = yuv_frame.as_ndarray()
            if yuv_array is not None:
                # Convert YUV to BGR (color format OpenCV uses)
                yuv_copy = yuv_array.copy()  # Make a copy to avoid race conditions
                bgr_frame = cv2.cvtColor(yuv_copy, cv2.COLOR_YUV2BGR_I420)
                
                # Store frame safely
                with self.frame_lock:
                    self.frame = bgr_frame
                    self.frame_count += 1
        except Exception as e:
            print(f"Error in frame callback: {e}")
        finally:
            yuv_frame.unref()  # Important: unref the frame to avoid memory leaks

    def start(self):
        """Start the streaming process"""
        if self.running:
            print("Stream already running")
            return True
            
        try:
            # Step 1: Connect to drone
            print("Connecting to drone...")
            self.drone = olympe.Drone(DRONE_IP)
            self.drone.connect()
            
            # Step 2: Start tracking engine (required for video)
            print("Starting tracking engine...")
            self.drone(onboard_tracker.start_tracking_engine()).wait()
            
            # Step 3: Initialize Pdraw for video streaming
            print("Initializing Pdraw...")
            self.pdraw = Pdraw()
            rtsp_url = f"rtsp://{DRONE_IP}:{DRONE_RTSP_PORT}/live"
            print(f"Playing stream from {rtsp_url}")
            self.pdraw.play(url=rtsp_url, media_name="DefaultVideo")
            
            # Step 4: Wait for the stream to start playing
            print("Waiting for PdrawState.Playing...")
            if not self.pdraw.wait(PdrawState.Playing, timeout=10):
                print("Timeout waiting for stream to start playing")
                self.pdraw.close()
                self.drone.disconnect()
                return False
            
            # Step 5: Register frame callback
            print("Stream is now playing, registering callback...")
            self.pdraw.set_callbacks(raw_cb=self._frame_callback)
            
            # Step 6: Set running flag
            self.running = True
            
            # Wait for first frame to arrive
            timeout = time.time() + 3  # 3 seconds timeout
            while time.time() < timeout:
                if self.frame is not None:
                    print("First frame received!")
                    break
                time.sleep(0.1)
            
            return True
            
        except Exception as e:
            print(f"Error starting stream: {e}")
            traceback.print_exc()
            self.stop()
            return False
    
    def stop(self):
        """Stop the streaming process"""
        print("Stopping direct stream...")
        self.running = False
        
        if self.pdraw:
            try:
                self.pdraw.close()
                print("Pdraw closed")
            except:
                print("Error closing pdraw")
            self.pdraw = None
            
        if self.drone:
            try:
                self.drone.disconnect()
                print("Drone disconnected")
            except:
                print("Error disconnecting drone")
            self.drone = None
            
        return True
        
    def get_frame(self):
        """Generator function that yields frames for streaming"""
        frames_sent = 0
        last_time = time.time()
        
        print("Starting frame generator")
        while self.running:
            try:
                # Get the current frame if available
                with self.frame_lock:
                    if self.frame is not None:
                        current_frame = self.frame.copy()
                        frames_sent += 1
                    else:
                        current_frame = None
                
                if current_frame is not None:
                    # Encode frame as JPEG
                    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 90]
                    ret, jpeg = cv2.imencode('.jpg', current_frame, encode_param)
                    
                    if ret:
                        yield (b'--frame\r\n'
                              b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n\r\n')
                
                # Control frame rate
                time.sleep(0.033)  # ~30 FPS
                
                # Print status every 5 seconds
                if time.time() - last_time > 5:
                    fps = frames_sent / 5
                    print(f"Stream running at approximately {fps:.1f} FPS")
                    frames_sent = 0
                    last_time = time.time()
                    
            except Exception as e:
                print(f"Error in frame generator: {e}")
                traceback.print_exc()
                time.sleep(0.5)
                
        print("Frame generator stopped")

# Create a singleton instance
direct_stream = DirectStreamController()
