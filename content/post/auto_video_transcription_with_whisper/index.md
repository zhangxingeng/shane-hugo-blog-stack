---
title: "Effortless Video Transcription with OpenAI Whisper"
description: "Learn how to automatically generate high-quality transcripts from any video source using OpenAI's Whisper and Python"
slug: auto-video-transcription-with-whisper
date: 2025-03-07 00:00:00+0000
image: cover.webp
categories:
    - AI Tools
    - Python
    - Automation
tags:
    - whisper
    - transcription
    - youtube
    - openai
    - python
    - audio processing
---

Have you ever needed a transcript from a video but found manual transcription tedious and time-consuming? In this post, I'll show you how to automate transcription from any video source using OpenAI's Whisper AI.

We'll build a Python script that:

1. Downloads audio from a video source (YouTube in our example)
2. Transcribes it accurately with Whisper
3. Saves the transcript as a text file

This approach works with any video platform that yt-dlp supports, not just YouTube!

## Prerequisites

Before we start, make sure you have the following installed:

- Python 3.7+
- FFmpeg (required for audio processing)

## Setting Up Your Environment

First, install the required Python packages:

```python
pip install yt-dlp openai-whisper torch
```

## The Complete Solution

Here's the full code to download and transcribe videos:

```python
import asyncio
import os
import yt_dlp
import whisper
import torch

async def download_audio(video_url):
    """Download audio from a video URL and return the file path."""
    print("Downloading audio...")
    
    # Extract video info first to get the title
    ydl_info_opts = {
        'quiet': True,
        'no_warnings': True,
    }
    
    loop = asyncio.get_event_loop()
    video_info = await loop.run_in_executor(
        None, 
        lambda: yt_dlp.YoutubeDL(ydl_info_opts).extract_info(video_url, download=False)
    )
    
    # Create a safe filename from the title
    safe_title = "".join([c if c.isalnum() or c in " -_" else "_" for c in video_info.get('title', 'video')])
    filename = f"{safe_title}.mp3"
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'outtmpl': f'{safe_title}.%(ext)s',
        'progress_hooks': [lambda d: print(f"Download progress: {d.get('_percent_str', 'downloading...')}")],
        'overwrites': True,
    }
    
    # Download the video and extract audio
    await loop.run_in_executor(
        None, 
        lambda: yt_dlp.YoutubeDL(ydl_opts).download([video_url])
    )
    
    return filename

async def transcribe_video(video_url, language="en", output_file=None):
    """Download a video and transcribe it using Whisper."""
    try:
        # Download the audio file
        audio_file = await download_audio(video_url)
        
        # Load Whisper model with GPU if available
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Using device: {device}")
        print("Loading Whisper model...")
        
        # Use the turbo model for faster transcription
        model = whisper.load_model("turbo", device=device)
        
        # Transcribe the audio
        print("Transcribing...")
        result = model.transcribe(
            audio_file, 
            language=language, 
            without_timestamps=True, 
            fp16=(device == "cuda")
        )
        
        transcript = result["text"]
        
        # Write transcript to file if specified
        if output_file:
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(transcript)
            print(f"Transcript saved to {output_file}")
        
        return transcript
        
    except Exception as e:
        print(f"Error during transcription: {e}")
        raise
    finally:
        # Clean up downloaded files if needed
        # Uncomment if you want to remove the audio file after transcription
        # if 'audio_file' in locals() and os.path.exists(audio_file):
        #     os.remove(audio_file)
        #     print(f"Removed temporary file: {audio_file}")
        pass

async def main():
    url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Replace with your video URL
    language = "en"  # Change to desired language code (e.g., "zh" for Chinese)
    output_file = "transcript.txt"
    
    transcript = await transcribe_video(url, language, output_file)
    
    print("\nTranscript:")
    print(transcript)

if __name__ == "__main__":
    asyncio.run(main())
```

## How It Works

Think of this script as a recording assistant that handles the tedious parts of transcription for you. Here's how the process works:

### 1. Audio Extraction

The `download_audio` function is like a smart audio recorder. It:

- Takes any video URL (not just YouTube)
- Extracts just the audio track (saving bandwidth)
- Converts it to MP3 format
- Returns the path to the audio file

This is handled asynchronously so your program doesn't freeze during downloads.

### 2. Transcription with Whisper

Next, our `transcribe_video` function:

- Feeds the audio to OpenAI's Whisper model
- Automatically detects the language (or uses your specified language)
- Converts speech to text with high accuracy
- Returns the transcript and optionally saves it to a file

Whisper is like having a professional transcriber working at superhuman speed. It handles accents, background noise, and technical terminology surprisingly well.

### 3. Hardware Acceleration

The script automatically uses your GPU if available, making transcription much faster. If you're transcribing long videos, this can reduce waiting time from hours to minutes.

## Customization Options

### Language Support

Whisper supports multiple languages. To transcribe in a specific language, change the language parameter:

```python
# For Chinese transcription
transcript = await transcribe_video(url, language="zh", output_file="chinese_transcript.txt")

# For Spanish transcription
transcript = await transcribe_video(url, language="es", output_file="spanish_transcript.txt")
```

### Model Size

You can choose different Whisper models based on your needs:

- "tiny" - Fastest but less accurate
- "base" - Good balance for short clips
- "small" - Better accuracy for most uses
- "medium" - High accuracy
- "large" - Highest accuracy but slower
- "turbo" - Optimized for speed

To change the model:

```python
model = whisper.load_model("medium", device=device)
```

### Working with Local Files

If you already have a video or audio file locally, you can skip the download step:

```python
import whisper

def transcribe_local_file(file_path, language="en", output_file=None):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = whisper.load_model("turbo", device=device)
    
    result = model.transcribe(file_path, language=language)
    transcript = result["text"]
    
    if output_file:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(transcript)
    
    return transcript

# Usage
transcript = transcribe_local_file("my_video.mp4", "en", "transcript.txt")
```

## Practical Applications

This transcription tool can be useful for:

- Creating subtitles for your own videos
- Researching content from lectures or talks
- Converting interviews to text for analysis
- Making video content more accessible
- Creating searchable archives of speech content

## Conclusion

With just a few lines of Python code, you can harness the power of OpenAI's Whisper to generate accurate transcripts from virtually any video source. This approach saves hours of manual transcription work while providing high-quality results.

Give it a try with your own videos or any online content you need to transcribe. The ability to quickly convert speech to text opens up new possibilities for content analysis, accessibility, and productivity.

Happy transcribing!
