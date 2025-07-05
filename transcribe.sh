#!/bin/bash

# Quick transcription script that loads .env and runs the Python script
# Usage: ./transcribe.sh <path_to_mp4_file>

# Check if argument is provided
if [ $# -eq 0 ]; then
    echo "Usage: ./transcribe.sh <path_to_mp4_file>"
    echo "Example: ./transcribe.sh ./my_video.mp4"
    exit 1
fi

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "Loaded environment variables from .env"
else
    echo "Warning: .env file not found in current directory"
fi

# Run the Python transcription script
python3 transcribe_mp4.py "$1"
