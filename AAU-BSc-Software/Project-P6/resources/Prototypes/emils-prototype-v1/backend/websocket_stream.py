import olympe
import os
import time
import base64
import cv2
import numpy as np
from threading import Thread, Lock
from olympe.video.pdraw import Pdraw, PdrawState
from olympe.messages import onboard_tracker

DRONE_IP = os.environ.get("DRONE_IP", "192.168.42.1")

class WebSocketVideoStream:
    def __init__(self, socketio):
        self.socketio = socketio
        self.drone = None
        self.pdraw = None
        self.running = False
        self.frame_lock = Lock()
        self.last_frame = None
        self.stream_thread = None
        
    def start(self):
        """Start the video streaming process"""
        if self.running:
            return True
            
        try:
            # Connect to drone
            self.drone = olympe.Drone(DRONE_IP)
            self.drone.connect()
            
            # Initialize video pipeline
            self.pdraw = Pdraw()
            self.pdraw.play(url=f"rtsp://{DRONE_IP}:554/live")
            
            # Wait for stream to initialize
            if not self.pdraw.wait(PdrawState.Playing, timeout=5):
                raise RuntimeError("Timeout waiting for streaming to start")
                
            # Start frame processing thread
            self.running = True
            self.stream_thread = Thread(target=self._process_frames)
            self.stream_thread.daemon = True
            self.stream_thread.start()
            
            print("WebSocket video stream started")
            return True
            
        except Exception as e:
            print(f"Error starting WebSocket stream: {e}")
            self.stop()
            return False
            
    def stop(self):
        """Stop the video streaming process"""
        self.running = False
        if self.stream_thread:
            self.stream_thread.join(timeout=2)
            
        if self.pdraw:
            self.pdraw.close()
            self.pdraw = None
            
        if self.drone:
            self.drone.disconnect()
            self.drone = None
            
        print("WebSocket video stream stopped")
        
    def _process_frames(self):
        """Process and emit video frames via WebSocket"""
        frame_count = 0
        last_emit = time.time()
        
        def frame_callback(yuv_frame):
            nonlocal frame_count, last_emit
            
            if yuv_frame and self.running:
                try:
                    # Convert YUV frame to BGR
                    array = yuv_frame.as_ndarray()
                    if array is not None:
                        bgr = cv2.cvtColor(array, cv2.COLOR_YUV2BGR_I420)
                        
                        # Only process every 2nd frame (30fps → 15fps) to reduce load
                        frame_count += 1
                        if frame_count % 2 == 0:
                            current_time = time.time()
                            
                            # Encode frame as JPEG
                            ret, buffer = cv2.imencode('.jpg', bgr, 
                                [cv2.IMWRITE_JPEG_QUALITY, 60])  # Lower quality for better performance
                                
                            if ret:
                                # Convert to base64 for WebSocket transmission
                                b64_frame = base64.b64encode(buffer).decode('utf-8')
                                
                                # Emit frame via WebSocket
                                self.socketio.emit('video_frame', {
                                    'frame': b64_frame,
                                    'timestamp': current_time
                                })
                                
                                fps = 1.0 / (current_time - last_emit)
                                if frame_count % 30 == 0:
                                    print(f"Streaming at {fps:.1f} FPS")
                                    
                                last_emit = current_time
                finally:
                    yuv_frame.unref()
        
        # Register frame callback
        self.pdraw.set_callbacks(raw_cb=frame_callback)
        
        # Keep thread running
        while self.running:
            time.sleep(0.1)  # Prevent busy-waiting
            
        # Cleanup
        self.pdraw.set_callbacks(raw_cb=None)

# Don't create singleton here - it will be created in app.py
