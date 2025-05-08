import os
import yaml
import torch
from ultralytics import YOLO

# Enable MPS (Metal Performance Shaders) for M2 acceleration
device = 'mps' if torch.backends.mps.is_available() else 'cpu'
print(f"Using device: {device}")

# Define paths
DATASET_PATH = os.path.dirname(os.path.abspath(__file__))

# Create dataset YAML file
dataset_config = {
    'path': DATASET_PATH,
    'train': 'images/train',
    'val': 'images/val',
    'test': 'images/test',
    'names': {
        0: 'person_in_water'  # Adjust class name and index as per your dataset
    }
}

# Save the YAML file
with open('dataset.yaml', 'w') as f:
    yaml.dump(dataset_config, f)

# Initialize YOLO model (smallest version)
model = YOLO('yolov8n.pt')

# Quick test training (15 minutes)
results = model.train(
    data='dataset.yaml',
    epochs=3,                # Very few epochs
    imgsz=160,               # Very small image size
    batch=16,                # Smaller batch size
    workers=4,               # Use multiple cores
    device=device,           # Use MPS acceleration
    patience=2,              # Early stopping
    freeze=15,               # Freeze first 15 layers (transfer learning)
    cache='ram',            # Cache images on disk (more reliable)
    amp=True,                # Mixed precision training
    name='quick_test_model'
)

# Quick validation
val_results = model.val()

# Run inference on a few test images (limit to 10 images for quick testing)
import glob
TEST_IMAGES = os.path.join(DATASET_PATH, 'images/test')
test_files = glob.glob(os.path.join(TEST_IMAGES, '*'))[:10]  # First 10 test images
if test_files:
    test_results = model.predict(test_files, save=True, conf=0.25)
else:
    print("No test images found")

print(f"Quick test completed. Results saved to {model.trainer.save_dir}")

# Optional: visualize a prediction
if test_files:
    try:
        import cv2
        from PIL import Image
        import matplotlib.pyplot as plt
        
        # Plot results
        results = model(test_files[0])
        result_image = results[0].plot()
        plt.figure(figsize=(10, 10))
        plt.imshow(result_image[..., ::-1])  # Convert BGR to RGB
        plt.axis('off')
        plt.savefig('sample_prediction.jpg')
        print("Sample prediction saved as 'sample_prediction.jpg'")
    except Exception as e:
        print(f"Couldn't visualize result: {e}")