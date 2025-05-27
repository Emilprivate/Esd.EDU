import json
import os
from pathlib import Path
import shutil

def convert_coco_to_yolo(coco_annotation_file, image_dir, output_label_dir, class_id=0):
    """
    Convert COCO format annotations to YOLO format
    """
    # Create output directory if it doesn't exist
    os.makedirs(output_label_dir, exist_ok=True)
    
    # Load the COCO annotations
    with open(coco_annotation_file, 'r') as f:
        coco_data = json.load(f)
    
    # Create a mapping from image id to filename
    image_id_to_name = {}
    for image in coco_data['images']:
        image_id_to_name[image['id']] = image['file_name']
        
    # Extract image dimensions
    image_dimensions = {}
    for image in coco_data['images']:
        image_dimensions[image['id']] = (image['width'], image['height'])
    
    # Process each annotation
    for annotation in coco_data['annotations']:
        image_id = annotation['image_id']
        image_name = image_id_to_name[image_id]
        
        # Get image width and height
        img_width, img_height = image_dimensions[image_id]
        
        # Get the bounding box coordinates (COCO format: [x, y, width, height])
        bbox = annotation['bbox']
        x, y, width, height = bbox
        
        # Convert to YOLO format (center_x, center_y, width, height) normalized
        center_x = (x + width / 2) / img_width
        center_y = (y + height / 2) / img_height
        norm_width = width / img_width
        norm_height = height / img_height
        
        # Create a YOLO format label file (same name as image but with .txt extension)
        label_filename = os.path.splitext(image_name)[0] + '.txt'
        label_path = os.path.join(output_label_dir, label_filename)
        
        # Write the label information
        with open(label_path, 'a') as label_file:
            # Format: class_id center_x center_y width height
            label_file.write(f"{class_id} {center_x} {center_y} {norm_width} {norm_height}\n")
    
    print(f"Converted annotations saved to {output_label_dir}")

# Convert training set
DATASET_PATH = os.path.dirname(os.path.abspath(__file__))
TRAIN_IMAGES = os.path.join(DATASET_PATH, 'images/train')
VAL_IMAGES = os.path.join(DATASET_PATH, 'images/val')
TRAIN_ANNOTATIONS = os.path.join(DATASET_PATH, 'annotations/instances_train.json')
VAL_ANNOTATIONS = os.path.join(DATASET_PATH, 'annotations/instances_val.json')

# Create labels directories
os.makedirs(os.path.join(DATASET_PATH, 'labels/train'), exist_ok=True)
os.makedirs(os.path.join(DATASET_PATH, 'labels/val'), exist_ok=True)

# Convert annotations
convert_coco_to_yolo(
    TRAIN_ANNOTATIONS, 
    TRAIN_IMAGES, 
    os.path.join(DATASET_PATH, 'labels/train')
)
convert_coco_to_yolo(
    VAL_ANNOTATIONS, 
    VAL_IMAGES, 
    os.path.join(DATASET_PATH, 'labels/val')
)

print("Conversion complete!")