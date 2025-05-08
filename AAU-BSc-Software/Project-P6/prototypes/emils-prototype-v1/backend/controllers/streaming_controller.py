import olympe
import os
import sys
import time
import queue
import traceback
from threading import Thread, Lock
import cv2
import numpy as np

from olympe.video.pdraw import Pdraw, PdrawState
# Fix the import path for onboard_tracker
from olympe.messages import onboard_tracker

# Add the parent directory to path for absolute imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config import DRONE_IP, DRONE_RTSP_PORT

class StreamingController:
    def __init__(self, drone_ip=DRONE_IP, drone_rtsp_port=DRONE_RTSP_PORT):
        self.drone_ip = drone_ip
        self.drone_rtsp_port = drone_rtsp_port
        self.drone = None
        self.pdraw = None
        self.renderer = None
        self.running = False
        self.frame_available = False
        
    def start_stream(self):
        """Start the video stream from the drone"""
        if self.running:
            print("Stream is already running")
            return True
            
        try:
            print(f"Connecting to drone at {self.drone_ip}...")
            # Connect to the drone
            self.drone = olympe.Drone(self.drone_ip)
            self.drone.connect()
            
            # Fix the start_tracking_engine call
            print("Starting tracking engine...")
            self.drone(onboard_tracker.start_tracking_engine(box_proposals=True)).wait().success()
            
            # Initialize Pdraw for video streaming - exactly as in the working example
            print("Initializing Pdraw...")
            self.pdraw = Pdraw()
            url = f"rtsp://{self.drone_ip}:{self.drone_rtsp_port}/live"
            print(f"Playing stream from URL: {url}")
            self.pdraw.play(url=url, media_name="DefaultVideo")
            
            # Wait for the stream to start playing with longer timeout
            print("Waiting for PdrawState.Playing...")
            if not self.pdraw.wait(PdrawState.Playing, timeout=20):
                print("Timeout waiting for stream to start playing")
                raise RuntimeError("Timeout waiting for stream to start playing")
            print("Stream is now playing")
            
            # Initialize renderer with the exact same implementation as the working example
            print("Initializing StreamingRenderer...")
            self.renderer = StreamingRenderer(self.pdraw)
            self.running = True
            
            # Wait a bit longer for initial frames
            print("Waiting for initial frames...")
            start_wait = time.time()
            while time.time() - start_wait < 5:  # Wait up to 5 seconds for frames
                if self.renderer and self.renderer.has_frame():
                    self.frame_available = True
                    print("Got initial frame!")
                    break
                time.sleep(0.1)
                
            if not self.frame_available:
                print("Warning: No frames received after 5 seconds, but continuing...")
                
            return True
        
        except Exception as e:
            print(f"Error starting stream: {e}")
            traceback.print_exc()
            self.stop_stream()
            return False
    
    def stop_stream(self):
        """Stop the video stream and clean up resources"""
        print("Stopping stream...")
        self.running = False
        self.frame_available = False
        
        if self.renderer:
            try:
                self.renderer.stop()
                print("Renderer stopped")
            except:
                print("Error stopping renderer")
            self.renderer = None
            
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
            
        print("Stream stopped successfully")
        return True
        
    def get_frame(self):
        """Generator function that yields frames for streaming"""
        last_time = time.time()
        no_frame_count = 0
        frames_sent = 0
        
        print("Starting frame generator")
        while self.running:
            try:
                if self.renderer:
                    frame = self.renderer.get_frame()
                    if frame is not None:
                        # We got a frame!
                        self.frame_available = True
                        no_frame_count = 0
                        frames_sent += 1
                        
                        # Debugging - show frame size
                        if frames_sent == 1 or frames_sent % 30 == 0:
                            print(f"Got frame {frames_sent}: {frame.shape}")
                            
                        # Encode frame with quality setting (0-100)
                        # Higher quality for better visibility
                        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 90]
                        ret, jpeg = cv2.imencode('.jpg', frame, encode_param)
                        
                        if ret:
                            yield (b'--frame\r\n'
                                  b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n\r\n')
                        else:
                            print("Failed to encode frame")
                    else:
                        # Only print "No frame available" message occasionally
                        no_frame_count += 1
                        if no_frame_count % 30 == 0:
                            print(f"No frame available ({no_frame_count} times)")
                else:
                    print("No renderer available")
                    time.sleep(0.5)
                    continue
                    
                # Sleep briefly to control frame rate (not too fast, not too slow)
                time.sleep(0.033)  # ~30 FPS
                
                # Print status every 5 seconds
                if time.time() - last_time > 5:
                    if frames_sent > 0:
                        print(f"Stream active: {frames_sent} frames sent in the last 5 seconds")
                    else:
                        print("Stream active but no frames sent in 5 seconds")
                    last_time = time.time()
                    frames_sent = 0
                    
            except Exception as e:
                print(f"Error in get_frame: {e}")
                traceback.print_exc()
                time.sleep(0.5)
                
        print("Stream generator stopped")

    def get_status(self):
        return {
            "running": self.running,
            "frame_available": self.frame_available,
            "has_renderer": self.renderer is not None
        }


class StreamingRenderer:
    def __init__(self, pdraw):
        self.pdraw = pdraw
        self.frame = None
        self.frame_count = 0
        self.running = True
        self.mutex = Lock()
        
        # Register the callback for frame reception
        # This is critical - ensure it matches exactly how the working example does it
        try:
            print("Registering raw frame callback...")
            self.pdraw.set_callbacks(raw_cb=self._frame_callback)
            print("Raw frame callback registered")
        except Exception as e:
            print(f"Error setting callbacks: {e}")
            traceback.print_exc()
        
    def _frame_callback(self, yuv_frame):
        """Called when a new frame is available"""
        if yuv_frame is None or not self.running:
            return
            
        try:
            # Get the YUV video frame data
            yuv_array = yuv_frame.as_ndarray()
            if yuv_array is not None:
                # Copy the frame data to avoid issues with reference counting
                yuv_copy = yuv_array.copy()
                
                # Convert YUV to BGR (color format used by OpenCV)
                bgr_frame = cv2.cvtColor(yuv_copy, cv2.COLOR_YUV2BGR_I420)
                
                # Store the frame with mutex protection
                with self.mutex:
                    self.frame = bgr_frame
                    self.frame_count += 1
                    
                    # Print status every 30 frames
                    if self.frame_count % 30 == 0:
                        print(f"Processed {self.frame_count} frames")
                        
        except Exception as e:
            print(f"Error processing frame: {e}")
            traceback.print_exc()
            
        finally:
            # Important: unref the frame to avoid memory leaks
            yuv_frame.unref()

    def get_frame(self):
        """Get the latest frame if available"""
        with self.mutex:
            if self.frame is not None:
                return self.frame.copy()
            return None
            
    def has_frame(self):
        """Check if we have received any frames"""
        with self.mutex:
            return self.frame is not None

    def stop(self):
        """Stop the renderer and clean up"""
        self.running = False
        try:
            if self.pdraw:
                # Clear callbacks to prevent processing after stop
                self.pdraw.set_callbacks(raw_cb=None)
        except Exception as e:
            print(f"Error clearing callbacks: {e}")
        print(f"Renderer stopped after processing {self.frame_count} frames")
