#!/usr/bin/env python3
"""
Quick MP4 transcription script using OpenAI Whisper API
Usage: python transcribe_mp4.py <path_to_mp4_file>
"""

import os
import sys
from openai import OpenAI
from pathlib import Path

def transcribe_mp4(file_path):
    """Transcribe an MP4 file using OpenAI Whisper API"""
    
    # Initialize OpenAI client
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    # Check if file exists
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' not found.")
        return None
    
    # Check file size (OpenAI has a 25MB limit)
    file_size = os.path.getsize(file_path) / (1024 * 1024)  # Size in MB
    if file_size > 25:
        print(f"Error: File size ({file_size:.1f}MB) exceeds OpenAI's 25MB limit.")
        print("Consider splitting the file or using a smaller file.")
        return None
    
    print(f"Transcribing: {file_path}")
    print(f"File size: {file_size:.1f}MB")
    print("Processing... (this may take a moment)")
    
    try:
        # Open and transcribe the audio file
        with open(file_path, 'rb') as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
        
        return transcript
    
    except Exception as e:
        print(f"Error during transcription: {str(e)}")
        return None

def main():
    # Check if file path is provided
    if len(sys.argv) != 2:
        print("Usage: python transcribe_mp4.py <path_to_mp4_file>")
        print("Example: python transcribe_mp4.py ./my_video.mp4")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    # Check if OpenAI API key is set
    if not os.getenv('OPENAI_API_KEY'):
        print("Error: OPENAI_API_KEY environment variable is not set.")
        print("Make sure your .env file is loaded or export the key manually.")
        sys.exit(1)
    
    # Transcribe the file
    transcript = transcribe_mp4(file_path)
    
    if transcript:
        print("\n" + "="*50)
        print("TRANSCRIPTION:")
        print("="*50)
        print(transcript)
        print("="*50)
        
        # Save to file
        output_file = Path(file_path).stem + "_transcript.txt"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(transcript)
        print(f"\nTranscription saved to: {output_file}")
    else:
        print("Transcription failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
