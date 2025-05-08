#!/bin/bash

# Start sphinx in the background
sphinx "/opt/parrot-sphinx/usr/share/sphinx/drones/anafi.drone"::firmware="https://firmware.parrot.com/Versions/anafi/pc/%23latest/images/anafi-pc.ext2.zip" &

# Save the PID of sphinx
SPHINX_PID=$!

# Create config file for custom FBX mesh
CONFIG_FILE="/home/emilog/Desktop/custom_mesh.yaml"
cat <<EOL > $CONFIG_FILE
Meshes:
  - Name: 'TestHuman'
    FbxPath: "/home/emilog/Desktop/test-human.fbx"
    Location: "200 0 80"
    Rotation: "-90 0 0"
    Scale: "1 1 1"
    SnapToGround: false
EOL

# Start UE4 ecosystem with custom config
# parrot-ue4-landscape-ecosystem
parrot-ue4-empty -gps-json='{"lat_deg":57.01287530300077, "lng_deg":9.990680827049472, "elevation":0}' -config-file=$CONFIG_FILE &

# Save the PID of UE4 ecosystem
FOREST_PID=$!

# Wait for processes
wait $SPHINX_PID
wait $FOREST_PID

