from ultralytics import YOLO
import cv2
import json

# Load the custom model
model = YOLO('best.pt')

# Path to input and output images
input_path = 'test.jpg'
output_path = 'output.jpg'

# Set confidence threshold
confidence = 0.25

# Run prediction with confidence threshold
results = model(input_path, conf=confidence)

# Plot results on the image
result_img = results[0].plot()

# Save the result image
cv2.imwrite(output_path, result_img)

# Extract bounding box data
boxes = results[0].boxes
bbox_data = []
for box in boxes:
    # box.xyxy[0] is a tensor [x1, y1, x2, y2]
    coords = box.xyxy[0].tolist()
    bbox_data.append({
        "bbox": coords,
        "confidence": float(box.conf[0]),
        "class": int(box.cls[0])
    })

# Save bounding box data to JSON
json_path = 'output.json'
with open(json_path, 'w') as f:
    json.dump(bbox_data, f, indent=2)

print(f"Detection complete. Output saved to {output_path}")
print(f"Bounding box data saved to {json_path}")
