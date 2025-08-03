---
title: "使用 OpenAI Whisper 轻松实现视频转录"
description: "学习如何使用 OpenAI 的 Whisper 和 Python 自动从任意视频源生成高质量转录文本"
slug: auto-video-transcription-with-whisper
date: 2025-03-07
image: cover.webp
categories:
    - AI 工具
    - Python
    - 自动化
tags:
    - whisper
    - 转录
    - youtube
    - openai
    - python
    - 音频处理
---

你是否曾经需要从视频中获取转录文本，却觉得手动转录既繁琐又耗时？在这篇文章中，我将向你展示如何利用 OpenAI 的 Whisper AI 自动化从任意视频源转录音频。

我们将编写一个 Python 脚本，实现以下功能：

1. 从视频源（本例以 YouTube 为例）下载音频
2. 使用 Whisper 高精度转录音频
3. 将转录文本保存为文本文件

这种方法适用于 yt-dlp 支持的任何视频平台，不仅限于 YouTube！

## 前置条件

在开始之前，请确保你已经安装了以下环境：

- Python 3.7 及以上版本
- FFmpeg（用于音频处理）

## 环境搭建

首先，安装所需的 Python 包：

```python
pip install yt-dlp openai-whisper torch
```

## 完整解决方案

以下是下载并转录视频的完整代码：

```python
import asyncio
import os
import yt_dlp
import whisper
import torch

async def download_audio(video_url):
    """从视频 URL 下载音频并返回文件路径。"""
    print("正在下载音频...")
    
    # 先提取视频信息以获取标题
    ydl_info_opts = {
        'quiet': True,
        'no_warnings': True,
    }
    
    loop = asyncio.get_event_loop()
    video_info = await loop.run_in_executor(
        None, 
        lambda: yt_dlp.YoutubeDL(ydl_info_opts).extract_info(video_url, download=False)
    )
    
    # 根据标题创建安全的文件名
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
        'progress_hooks': [lambda d: print(f"下载进度: {d.get('_percent_str', '正在下载...')}")],
        'overwrites': True,
    }
    
    # 下载视频并提取音频
    await loop.run_in_executor(
        None, 
        lambda: yt_dlp.YoutubeDL(ydl_opts).download([video_url])
    )
    
    return filename

async def transcribe_video(video_url, language="en", output_file=None):
    """下载视频并使用 Whisper 进行转录。"""
    try:
        # 下载音频文件
        audio_file = await download_audio(video_url)
        
        # 如果有 GPU 则加载 Whisper 模型到 GPU
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"使用设备: {device}")
        print("正在加载 Whisper 模型...")
        
        # 使用 turbo 模型以获得更快的转录速度
        model = whisper.load_model("turbo", device=device)
        
        # 开始转录
        print("正在转录...")
        result = model.transcribe(
            audio_file, 
            language=language, 
            without_timestamps=True, 
            fp16=(device == "cuda")
        )
        
        transcript = result["text"]
        
        # 如果指定了输出文件，则写入文件
        if output_file:
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(transcript)
            print(f"转录文本已保存到 {output_file}")
        
        return transcript
        
    except Exception as e:
        print(f"转录过程中出错: {e}")
        raise
    finally:
        # 如有需要可清理下载的文件
        # 如果想在转录后删除音频文件，请取消注释下面的代码
        # if 'audio_file' in locals() and os.path.exists(audio_file):
        #     os.remove(audio_file)
        #     print(f"已删除临时文件: {audio_file}")
        pass

async def main():
    url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # 替换为你的视频链接
    language = "en"  # 可更改为所需语言代码（如中文为 "zh"）
    output_file = "transcript.txt"
    
    transcript = await transcribe_video(url, language, output_file)
    
    print("\n转录结果：")
    print(transcript)

if __name__ == "__main__":
    asyncio.run(main())
```

## 工作原理

你可以把这个脚本想象成一个录音助手，帮你自动完成繁琐的转录工作。其流程如下：

### 1. 音频提取

`download_audio` 函数就像一个智能录音机，它可以：

- 接受任意视频链接（不仅仅是 YouTube）
- 仅提取音频轨道（节省带宽）
- 转换为 MP3 格式
- 返回音频文件路径

该过程是异步执行的，不会让程序在下载时卡住。

### 2. 使用 Whisper 进行转录

接下来，`transcribe_video` 函数会：

- 将音频输入 OpenAI 的 Whisper 模型
- 自动检测语言（或使用你指定的语言）
- 高精度地将语音转换为文本
- 返回转录文本，并可选择保存为文件

Whisper 就像一个超级高效的专业转录员，能够很好地处理口音、背景噪音和专业术语。

### 3. 硬件加速

脚本会自动检测并优先使用你的 GPU，大幅提升转录速度。对于较长的视频，等待时间可从数小时缩短到几分钟。

## 个性化选项

### 语言支持

Whisper 支持多种语言。要转录特定语言，只需更改 language 参数：

```python
# 转录中文
transcript = await transcribe_video(url, language="zh", output_file="chinese_transcript.txt")

# 转录西班牙语
transcript = await transcribe_video(url, language="es", output_file="spanish_transcript.txt")
```

### 模型大小

你可以根据需求选择不同的 Whisper 模型：

- "tiny" - 速度最快但准确率较低
- "base" - 适合短片段，速度与准确率平衡
- "small" - 大多数场景下准确率更高
- "medium" - 高准确率
- "large" - 最高准确率但速度较慢
- "turbo" - 针对速度优化

更换模型方法：

```python
model = whisper.load_model("medium", device=device)
```

### 处理本地文件

如果你已经有本地视频或音频文件，可以跳过下载步骤：

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

# 用法示例
transcript = transcribe_local_file("my_video.mp4", "en", "transcript.txt")
```

## 实用场景

这个转录工具可以用于：

- 为自己制作的视频生成字幕
- 研究讲座或演讲内容
- 将访谈内容转为文本便于分析
- 提升视频内容的可访问性
- 创建可检索的语音内容档案

## 总结

只需几行 Python 代码，你就能利用 OpenAI 的 Whisper 从几乎任何视频源高效生成准确的转录文本。这种方式不仅节省了大量手动转录的时间，还能获得高质量的结果。

试试用你自己的视频或任何需要转录的在线内容吧。快速将语音转为文本，将为内容分析、无障碍访问和工作效率带来全新可能。

祝你转录愉快！