#!/bin/bash

# Define the project directory relative to the script location
PROJECT_DIR="P4.TinyCell"
CONFIG="Release"
OUTPUT_DIR="../publish"
RUNTIMES=("win-x64" "linux-x64" "osx-x64" "osx-arm64")

# Check if the project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo "Project directory $PROJECT_DIR does not exist."
    exit 1
fi

# Create the output directory if it does not exist
mkdir -p $OUTPUT_DIR

# Navigate to the project directory
cd $PROJECT_DIR

# Publish for each runtime
for RUNTIME in "${RUNTIMES[@]}"; do
    echo "Publishing for $RUNTIME..."
    dotnet publish -c $CONFIG -r $RUNTIME --self-contained false -o $OUTPUT_DIR/$RUNTIME
    if [ $? -eq 0 ]; then
        echo "Successfully published for $RUNTIME."
    else
        echo "Failed to publish for $RUNTIME."
        exit 1
    fi
done

echo "All publications completed."

