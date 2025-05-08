from flask import Flask, request, render_template, send_file, url_for
from ultralytics import YOLO
import os
import cv2
import numpy as np
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads/'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('templates', exist_ok=True)

# Try loading both models
try:
    # Try loading your trained model (adjust path if needed)
    custom_model = YOLO('best.pt')
    print("Custom model loaded successfully!")
except Exception as e:
    print(f"Error loading custom model: {e}")
    custom_model = None

# Always load a pretrained model as fallback
pretrained_model = YOLO('yolov8n.pt')
print("Pretrained model loaded successfully!")

# Create a basic template file if it doesn't exist
if not os.path.exists('templates/index.html'):
    with open('templates/index.html', 'w') as f:
        f.write('''<!DOCTYPE html>
<html>
<head>
    <title>YOLO Detection</title>
    <style>
        body { font-family: Arial; margin: 20px; }
        .container { display: flex; flex-wrap: wrap; }
        .image-box { margin: 10px; max-width: 45%; }
        img { max-width: 100%; border: 1px solid #ddd; }
        .controls { margin: 20px 0; padding: 10px; background: #f5f5f5; }
    </style>
</head>
<body>
    <h1>YOLO Object Detection</h1>
    
    {% if message %}
    <p style="color: red;">{{ message }}</p>
    {% endif %}
    
    <div class="controls">
        <form method="post" enctype="multipart/form-data">
            <div>
                <label for="file">Select image:</label>
                <input type="file" name="file" id="file">
            </div>
            <div style="margin-top: 10px;">
                <label for="model">Model:</label>
                <select name="model" id="model">
                    <option value="custom">Custom trained model</option>
                    <option value="pretrained">Pretrained YOLO model</option>
                </select>
            </div>
            <div style="margin-top: 10px;">
                <label for="conf">Confidence threshold:</label>
                <input type="range" name="conf" id="conf" min="0.1" max="0.9" step="0.1" value="0.25">
                <span id="conf_value">0.25</span>
            </div>
            <div style="margin-top: 10px;">
                <button type="submit">Detect</button>
            </div>
        </form>
    </div>
    
    {% if original_image and result_image %}
    <div class="container">
        <div class="image-box">
            <h3>Original Image</h3>
            <img src="/uploads/{{ original_image }}" alt="Original Image">
        </div>
        <div class="image-box">
            <h3>Detection Result</h3>
            <img src="/uploads/{{ result_image }}" alt="Detection Result">
        </div>
    </div>
    {% endif %}
    
    <script>
        // Update the confidence threshold display
        document.getElementById('conf').oninput = function() {
            document.getElementById('conf_value').textContent = this.value;
        };
    </script>
</body>
</html>''')
        print("Created index.html template")

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        if 'file' not in request.files:
            return render_template('index.html', message='No file part')
        
        file = request.files['file']
        if file.filename == '':
            return render_template('index.html', message='No selected file')
        
        # Get model selection and confidence threshold
        model_choice = request.form.get('model', 'custom')
        conf_threshold = float(request.form.get('conf', 0.25))
        
        # Select model based on user choice
        if model_choice == 'custom' and custom_model is not None:
            active_model = custom_model
            model_name = "custom"
        else:
            active_model = pretrained_model
            model_name = "pretrained"
            
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Run prediction with specified confidence threshold
            results = active_model(filepath, conf=conf_threshold)
            result_img = results[0].plot()
            
            # Get number of detections
            num_detections = len(results[0].boxes)
            
            # Save result with a simple name to avoid URL issues
            result_filename = f"result_{filename}"
            result_path = os.path.join(app.config['UPLOAD_FOLDER'], result_filename)
            cv2.imwrite(result_path, result_img)
            
            # Debug information
            print(f"Original image saved to: {filepath}")
            print(f"Result image saved to: {result_path}")
            
            message = f"Model: {model_name}, Confidence: {conf_threshold}, Detections: {num_detections}"
            
            return render_template('index.html', 
                                message=message,
                                original_image=filename,
                                result_image=result_filename)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return render_template('index.html', message=f'Error during prediction: {str(e)}')
    
    return render_template('index.html')

# Make sure this route is properly configured to serve files
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_file(os.path.join(app.config['UPLOAD_FOLDER'], filename))

if __name__ == '__main__':
    # Use host 0.0.0.0 to make accessible from other devices on your network
    app.run(debug=True, host='0.0.0.0', port=5000)