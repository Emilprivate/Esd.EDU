from ultralytics.data.converter import convert_coco

# Convert train annotations
convert_coco(
    labels_dir='annotations',  # Directory containing your COCO JSON files
    save_dir='coco_converted', # Directory to save the converted annotations
    use_segments=False         # Include segmentation data
)
