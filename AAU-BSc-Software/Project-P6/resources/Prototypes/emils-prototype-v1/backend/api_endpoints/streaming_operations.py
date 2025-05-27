from flask import Blueprint, Response, render_template, jsonify
from controllers.streaming_controller import StreamingController
from direct_stream import direct_stream
from simple_stream import simple_stream
import traceback
import time

streaming_ops_bp = Blueprint('streaming_operations', __name__)
streaming_controller = StreamingController()

@streaming_ops_bp.route('/start-stream', methods=['POST'])
def start_stream():
    try:
        result = streaming_controller.start_stream()
        return jsonify({"success": result, "message": "Stream started successfully"})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500

@streaming_ops_bp.route('/stop-stream', methods=['POST'])
def stop_stream():
    try:
        result = streaming_controller.stop_stream()
        return jsonify({"success": result, "message": "Stream stopped successfully"})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500

@streaming_ops_bp.route('/video-feed')
def video_feed():
    try:
        # Check if stream is running, if not start it
        if not streaming_controller.running:
            print("Starting stream for video-feed request")
            streaming_controller.start_stream()
            # Give it a moment to initialize
            time.sleep(1)
            
        # Create the streaming response with all necessary headers
        response = Response(
            streaming_controller.get_frame(),
            mimetype='multipart/x-mixed-replace; boundary=frame'
        )
        
        # Add explicit headers for CORS and caching control
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
    
    except Exception as e:
        print(f"Error in video_feed route: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500

@streaming_ops_bp.route('/stream')
def stream_page():
    """This endpoint returns the HTML page that includes the video stream"""
    return render_template('stream.html')

@streaming_ops_bp.route('/status')
def stream_status():
    """Return the current status of the stream"""
    status = streaming_controller.get_status()
    return jsonify({
        "success": True,
        "running": status["running"],
        "frame_available": status["frame_available"],
        "has_renderer": status["has_renderer"]
    })

# Direct streaming endpoints
@streaming_ops_bp.route('/direct-start', methods=['POST'])
def direct_start():
    """Start the direct streaming controller for testing"""
    try:
        result = direct_stream.start()
        return jsonify({"success": result, "message": "Direct stream started"})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500

@streaming_ops_bp.route('/direct-stop', methods=['POST'])
def direct_stop():
    """Stop the direct streaming controller"""
    try:
        result = direct_stream.stop()
        return jsonify({"success": result, "message": "Direct stream stopped"})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500

@streaming_ops_bp.route('/direct-feed')
def direct_feed():
    """Get video feed directly using the simplified controller"""
    try:
        # Start if not already running
        if not direct_stream.running:
            print("Starting direct stream for feed request")
            direct_stream.start()
        
        # Return the streaming response with all necessary headers
        response = Response(
            direct_stream.get_frame(),
            mimetype='multipart/x-mixed-replace; boundary=frame'
        )
        
        # Add explicit headers for CORS and caching control
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        response.headers['Connection'] = 'close'  # Important for some browsers
        return response
    
    except Exception as e:
        print(f"Error in direct_feed route: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500

@streaming_ops_bp.route('/direct-test')
def direct_test():
    """Simple HTML page for testing direct streaming"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Direct Stream Test</title>
        <style>
            body { font-family: Arial; text-align: center; margin: 20px; }
            img { max-width: 800px; border: 1px solid #333; }
            button { padding: 10px; margin: 10px; }
        </style>
    </head>
    <body>
        <h1>Direct Streaming Test</h1>
        <div>
            <button id="start">Start Stream</button>
            <button id="stop">Stop Stream</button>
        </div>
        <div>
            <img id="stream" src="/api/streaming/direct-feed" alt="Drone Stream">
        </div>
        
        <script>
            document.getElementById('start').addEventListener('click', async () => {
                try {
                    const response = await fetch('/api/streaming/direct-start', {
                        method: 'POST'
                    });
                    const data = await response.json();
                    alert(data.message);
                    document.getElementById('stream').src = '/api/streaming/direct-feed?' + new Date().getTime();
                } catch (error) {
                    alert('Error: ' + error);
                }
            });
            
            document.getElementById('stop').addEventListener('click', async () => {
                try {
                    const response = await fetch('/api/streaming/direct-stop', {
                        method: 'POST'
                    });
                    const data = await response.json();
                    alert(data.message);
                    document.getElementById('stream').src = '';
                } catch (error) {
                    alert('Error: ' + error);
                }
            });
        </script>
    </body>
    </html>
    """

@streaming_ops_bp.route('/direct-viewer')
def direct_viewer():
    """Return a simple HTML page that directly displays the stream"""
    return render_template('direct_stream.html')

# Simple streaming endpoints
@streaming_ops_bp.route('/simple-start', methods=['POST'])
def simple_start():
    """Start the simple streaming controller"""
    try:
        result = simple_stream.start_stream()
        return jsonify({"success": result, "message": "Simple stream started"})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500

@streaming_ops_bp.route('/simple-stop', methods=['POST'])
def simple_stop():
    """Stop the simple streaming controller"""
    try:
        result = simple_stream.stop_stream()
        return jsonify({"success": result, "message": "Simple stream stopped"})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500

@streaming_ops_bp.route('/simple-feed')
def simple_feed():
    """Get video feed using the simplified controller"""
    try:
        # Start if not already running
        if not simple_stream.running:
            print("Starting simple stream for feed request")
            simple_stream.start_stream()
            # Give it a moment to initialize
            time.sleep(1)
        
        # Create and return the streaming response
        response = Response(
            simple_stream.get_frame(),
            mimetype='multipart/x-mixed-replace; boundary=frame'
        )
        
        # Add explicit headers
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        response.headers['Connection'] = 'close'  # Important for some browsers
        return response
    
    except Exception as e:
        print(f"Error in simple_feed route: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500

@streaming_ops_bp.route('/simple-test')
def simple_test():
    """Simple HTML page for testing the simple streaming"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Simple Stream Test</title>
        <style>
            body { 
                font-family: Arial; 
                text-align: center; 
                margin: 20px; 
                background-color: #222; 
                color: white;
            }
            img { 
                max-width: 800px; 
                border: 1px solid #555; 
            }
            button { 
                padding: 10px; 
                margin: 10px; 
                background-color: #4CAF50;
                color: white;
                border: none;
                cursor: pointer;
            }
            button:hover {
                background-color: #45a049;
            }
        </style>
    </head>
    <body>
        <h1>Simple Direct Streaming Test</h1>
        <div>
            <button id="start">Start Stream</button>
            <button id="stop">Stop Stream</button>
        </div>
        <div id="stream-container">
            <img id="stream" src="" alt="No Stream">
        </div>
        
        <script>
            const startBtn = document.getElementById('start');
            const stopBtn = document.getElementById('stop');
            const streamImg = document.getElementById('stream');
            
            startBtn.addEventListener('click', async () => {
                try {
                    // Start the stream
                    const response = await fetch('/api/streaming/simple-start', {
                        method: 'POST'
                    });
                    const data = await response.json();
                    
                    if (data.success) {
                        // Set the image source with a timestamp to prevent caching
                        streamImg.src = '/api/streaming/simple-feed?' + new Date().getTime();
                        console.log('Stream started');
                    } else {
                        console.error('Failed to start stream:', data.message);
                        alert('Failed to start stream: ' + data.message);
                    }
                } catch (error) {
                    console.error('Error starting stream:', error);
                    alert('Error starting stream');
                }
            });
            
            stopBtn.addEventListener('click', async () => {
                try {
                    // Stop the stream
                    const response = await fetch('/api/streaming/simple-stop', {
                        method: 'POST'
                    });
                    const data = await response.json();
                    
                    // Clear the image source
                    streamImg.src = '';
                    console.log('Stream stopped');
                } catch (error) {
                    console.error('Error stopping stream:', error);
                }
            });
        </script>
    </body>
    </html>
    """

@streaming_ops_bp.route('/simple-status')
def simple_stream_status():
    """Return the current status of the simple stream"""
    status = {
        "running": simple_stream.running,
        "has_frames": simple_stream.has_frames() if hasattr(simple_stream, 'has_frames') else False
    }
    return jsonify({"success": True, "status": status})

@streaming_ops_bp.route('/embedded-stream')
def embedded_stream():
    """Return a simple HTML page optimized for iframe embedding"""
    return render_template('embedded_stream.html')

# Add this new route for debugging
@streaming_ops_bp.route('/simple-debug', methods=['GET'])
def simple_debug():
    """Return detailed debug information about the simple stream controller"""
    try:
        # Get drone connection status
        drone_connected = simple_stream.drone is not None
        pdraw_status = "Not initialized"
        if simple_stream.pdraw:
            try:
                pdraw_status = str(simple_stream.pdraw.get_state())
            except:
                pdraw_status = "Error getting state"
                
        renderer_status = "Not initialized"
        if simple_stream.renderer:
            try:
                frame_count = getattr(simple_stream.renderer, 'frame_count', 0)
                has_frame = simple_stream.renderer.get_frame() is not None
                renderer_status = f"Initialized, frames: {frame_count}, has current frame: {has_frame}"
            except:
                renderer_status = "Error getting renderer status"
                
        debug_info = {
            "running": simple_stream.running,
            "drone_connected": drone_connected,
            "pdraw_status": pdraw_status,
            "renderer_status": renderer_status,
        }
        
        return jsonify({
            "success": True,
            "debug_info": debug_info,
            "timestamp": time.time()
        })
    except Exception as e:
        print(f"Error in debug endpoint: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": str(e),
            "timestamp": time.time()
        }), 500

# Add this special test route to help diagnose issues
@streaming_ops_bp.route('/test-stream')
def test_stream():
    """A very simple standalone test page for the stream"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Stream Test</title>
        <style>
            body { font-family: Arial; text-align: center; background: #111; color: white; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .stream { width: 100%; border: 2px solid #333; margin: 20px 0; }
            .controls { margin: 20px 0; }
            button { background: #4CAF50; border: none; color: white; padding: 10px 20px; cursor: pointer; margin: 0 5px; }
            button:hover { background: #45a049; }
            button.stop { background: #f44336; }
            button.stop:hover { background: #d32f2f; }
            .status { padding: 10px; border: 1px solid #333; margin: 20px 0; text-align: left; }
            pre { background: #222; padding: 10px; overflow-x: auto; }
            h4 { margin: 10px 0 5px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Stream Testing Page</h1>
            
            <div class="controls">
                <button id="start">Start Stream</button>
                <button id="stop" class="stop">Stop Stream</button>
                <button id="debug">Get Debug Info</button>
            </div>
            
            <div class="stream">
                <img id="stream-img" src="" alt="Stream not started" style="width: 100%;">
            </div>
            
            <div class="status">
                <h4>Status:</h4>
                <pre id="status-output">No information available yet.</pre>
            </div>
        </div>
        
        <script>
            const streamImg = document.getElementById('stream-img');
            const statusOutput = document.getElementById('status-output');
            const startBtn = document.getElementById('start');
            const stopBtn = document.getElementById('stop');
            const debugBtn = document.getElementById('debug');
            
            function updateStatus(text) {
                const now = new Date().toLocaleTimeString();
                statusOutput.textContent += `\\n[${now}] ${text}`;
                statusOutput.scrollTop = statusOutput.scrollHeight;
            }
            
            startBtn.addEventListener('click', async () => {
                updateStatus('Starting stream...');
                
                try {
                    const response = await fetch('/api/streaming/simple-start', {
                        method: 'POST'
                    });
                    
                    const data = await response.json();
                    updateStatus(`Response: ${JSON.stringify(data)}`);
                    
                    if (data.success || (data.message && data.message.includes('started'))) {
                        updateStatus('Loading stream image...');
                        streamImg.src = '/api/streaming/simple-feed?' + Date.now();
                    } else {
                        updateStatus(`ERROR: ${data.message}`);
                    }
                } catch (error) {
                    updateStatus(`ERROR: ${error.message}`);
                }
            });
            
            stopBtn.addEventListener('click', async () => {
                updateStatus('Stopping stream...');
                streamImg.src = '';
                
                try {
                    const response = await fetch('/api/streaming/simple-stop', {
                        method: 'POST'
                    });
                    
                    const data = await response.json();
                    updateStatus(`Response: ${JSON.stringify(data)}`);
                } catch (error) {
                    updateStatus(`ERROR: ${error.message}`);
                }
            });
            
            debugBtn.addEventListener('click', async () => {
                updateStatus('Getting debug info...');
                
                try {
                    const response = await fetch('/api/streaming/simple-debug');
                    const data = await response.json();
                    updateStatus(`Debug info: ${JSON.stringify(data, null, 2)}`);
                } catch (error) {
                    updateStatus(`ERROR: ${error.message}`);
                }
            });
            
            // Set up stream image event handlers
            streamImg.onload = function() {
                updateStatus('Stream image loaded successfully!');
            };
            
            streamImg.onerror = function() {
                updateStatus('ERROR: Failed to load stream image');
            };
            
            // Initial status message
            updateStatus('Page loaded. Click "Start Stream" to begin.');
        </script>
    </body>
    </html>
    """

@streaming_ops_bp.route('/direct-feed-test')
def direct_feed_test():
    """Return a direct stream image for testing - no generator, just a single image"""
    try:
        # Start if not already running
        if not simple_stream.running:
            print("Starting simple stream for direct feed test")
            simple_stream.start_stream()
            time.sleep(1)  # Wait for initialization
        
        # Get a single frame
        if simple_stream.renderer:
            frame = simple_stream.renderer.get_frame()
            if frame is not None:
                print("Got frame for direct test")
                # Encode frame as JPEG
                encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 90]
                ret, jpeg = cv2.imencode('.jpg', frame, encode_param)
                
                if ret:
                    # Return a single JPEG image
                    response = Response(jpeg.tobytes(), mimetype='image/jpeg')
                    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
                    return response
                    
        # No frame available
        return jsonify({"success": False, "message": "No frame available"}), 404
    
    except Exception as e:
        print(f"Error in direct feed test: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500