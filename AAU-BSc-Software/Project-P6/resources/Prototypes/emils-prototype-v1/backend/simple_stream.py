# This is a simplified version that closely mirrors the working streaming.py example
import olympe
import os
import time
import traceback
from threading import Lock
import cv2
import numpy as np

from olympe.video.pdraw import Pdraw, PdrawState
# Fix the import path for onboard_tracker
from olympe.messages import onboard_tracker

DRONE_IP = os.environ.get("DRONE_IP", "192.168.42.1")
DRONE_RTSP_PORT = os.environ.get("DRONE_RTSP_PORT", "554")

class SimpleStreamingRenderer:
    def __init__(self, pdraw):
        self.pdraw = pdraw
        self.frame = None
        self.running = True
        self.mutex = Lock()
        # Register the raw callback
        self.pdraw.set_callbacks(raw_cb=self._frame_callback)
        print("SimpleStreamingRenderer initialized")
        
    def _frame_callback(self, yuv_frame):
        """Called when a new frame is available"""
        if yuv_frame is None or not self.running:
            return
            
        try:
            yuv_array = yuv_frame.as_ndarray()
            if yuv_array is not None:
                # Copy the frame data to avoid issues
                yuv_copy = yuv_array.copy()
                
                # Convert YUV to BGR
                bgr_frame = cv2.cvtColor(yuv_copy, cv2.COLOR_YUV2BGR_I420)
                
                # Store the frame
                with self.mutex:
                    self.frame = bgr_frame
                    if hasattr(self, 'frame_count'):
                        self.frame_count += 1
                    else:
                        self.frame_count = 1
                    
                    if self.frame_count % 30 == 0:
                        print(f"SimpleStream: Processed {self.frame_count} frames")
        except Exception as e:
            print(f"SimpleStream frame callback error: {e}")
        finally:
            yuv_frame.unref()

    def get_frame(self):
        with self.mutex:
            if self.frame is not None:
                return self.frame.copy()
            return None

    def stop(self):
        self.running = False
        if self.pdraw:
            self.pdraw.set_callbacks(raw_cb=None)
        print("SimpleStreamingRenderer stopped")

class SimpleStreamController:
    def __init__(self):
        self.drone = None
        self.pdraw = None
        self.renderer = None
        self.running = False
        
    def start_stream(self):
        """Start the streaming process"""
        if self.running:
            print("SimpleStream: Stream already running")
            return True
            
        try:
            print("SimpleStream: Attempting to connect to drone...")
            # Connect to drone
            self.drone = olympe.Drone(DRONE_IP)
            
            connection_success = self.drone.connect()
            if not connection_success:
                print("SimpleStream: Failed to connect to drone")
                return False
            print("SimpleStream: Connected to drone")
            
            # Enable video - more robust error handling
            try:
                print("SimpleStream: Starting tracking engine...")
                self.drone(onboard_tracker.start_tracking_engine()).wait(10).success()
                print("SimpleStream: Tracking engine started")
            except Exception as e:
                print(f"SimpleStream: Warning - tracking engine start issue: {e}")
                # Continue anyway - this might work on some drones without this
                
            # Setup streaming - with proper error handling
            print("SimpleStream: Initializing Pdraw...")
            self.pdraw = Pdraw()
            rtsp_url = f"rtsp://{DRONE_IP}:{DRONE_RTSP_PORT}/live"
            print(f"SimpleStream: Playing stream from {rtsp_url}")
            self.pdraw.play(url=rtsp_url, media_name="DefaultVideo")
            
            # Wait for stream to start with proper timeout handling
            print("SimpleStream: Waiting for PdrawState.Playing...")
            if not self.pdraw.wait(PdrawState.Playing, timeout=15):
                print("SimpleStream: Timeout waiting for stream to start playing")
                self.stop_stream()
                return False
                
            print("SimpleStream: Stream is now playing")
            
            # Initialize renderer 
            print("SimpleStream: Initializing renderer...")
            self.renderer = SimpleStreamingRenderer(self.pdraw)
            self.running = True
            
            # Wait for initial frames
            print("SimpleStream: Waiting for initial frames...")
            start_wait = time.time()
            frame_received = False
            
            # Try for up to 3 seconds to get a frame
            while time.time() - start_wait < 3:
                if self.renderer and self.renderer.get_frame() is not None:
                    frame_received = True
                    print("SimpleStream: Initial frame received!")
                    break
                time.sleep(0.1)
            
            # Even if no frame yet, we'll return success as long as the connection worked
            print(f"SimpleStream: Startup complete (frames received: {frame_received})")
            return True
            
        except Exception as e:
            print(f"SimpleStream start error: {e}")
            traceback.print_exc()
            self.stop_stream()  # Clean up on failure
            return False
    
    def stop_stream(self):
        self.running = False
        
        if self.renderer:
            self.renderer.stop()
            self.renderer = None
            
        if self.pdraw:
            self.pdraw.close()
            self.pdraw = None
            
        if self.drone:
            self.drone.disconnect()
            self.drone = None
            
        return True
        
    def get_frame(self):
        """Generator function that yields frames"""
        frames_sent = 0
        last_time = time.time()
        
        print("SimpleStream: Starting frame generator")
        while self.running:
            try:
                if self.renderer:
                    frame = self.renderer.get_frame()
                    if frame is not None:
                        frames_sent += 1
                        if frames_sent % 30 == 0:
                            print(f"SimpleStream: Sent {frames_sent} frames")
                            
                        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 85]
                        ret, jpeg = cv2.imencode('.jpg', frame, encode_param)
                        
                        if ret:
                            yield (b'--frame\r\n'
                                  b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n\r\n')
                time.sleep(0.03)  # ~30 FPS
                
                if time.time() - last_time > 5:
                    fps = frames_sent / 5
                    print(f"SimpleStream: Running at {fps:.1f} FPS")
                    frames_sent = 0
                    last_time = time.time()
            except Exception as e:
                print(f"SimpleStream frame generator error: {e}")
                traceback.print_exc()
                time.sleep(0.1)

    def has_frames(self):
        """Check if frames are being received"""
        return self.renderer is not None and hasattr(self.renderer, 'frame_count') and self.renderer.frame_count > 0

    def get_status(self):
        """Get current streaming status"""
        return {
            "running": self.running,
            "has_frames": self.has_frames(),
            "frame_count": self.renderer.frame_count if self.renderer and hasattr(self.renderer, 'frame_count') else 0
        }

# Add a method to handle manual image frames for debugging
def get_static_frame():
    """Get a single frame, not a generator - useful for debugging"""
    if simple_stream.renderer:
        return simple_stream.renderer.get_frame()
    return None

# Add a method to get camera test image if the drone stream isn't working
def get_test_frame():
    """Create a test image to check if image processing is working"""
    # Create a black image
    height, width = 480, 640
    img = np.zeros((height, width, 3), np.uint8)
    
    # Add text and timestamp to show it's working
    timestamp = time.strftime("%H:%M:%S")
    cv2.putText(img, f"Test Pattern - {timestamp}", (50, height//2), 
                cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    
    # Add some visual elements
    cv2.rectangle(img, (50, 50), (width-50, height-50), (0, 255, 0), 2)
    cv2.circle(img, (width//2, height//2), 50, (0, 0, 255), 2)
    
    return img

# Create a singleton instance
simple_stream = SimpleStreamController()
