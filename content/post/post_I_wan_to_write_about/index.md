---
title: "Some blog Ideas I want to write about in the future"
date: 2024-01-01
draft: true
---

## 1. designing a scalable infrastructure for distributed deep learning on 50,000 GB200 GPUs across 6,000 server racks, you need to consider every layer of the stack—from hardware to networking to orchestration

## 2. Detailed info about how pytorch DDP and relevant distributed training tools works. For example

| **Parallelism**  | **Method** | **Usage** |
|------------------|-----------|-----------|
| **Data Parallelism** | PyTorch DDP + SHARP | Standard multi-GPU training |
| **ZeRO Offload (DeepSpeed)** | Offloads optimizer states | Reduces GPU memory usage |
| **Tensor Parallelism** | Megatron-LM | Splits tensors across GPUs |
| **Pipeline Parallelism** | GPipe | Splits model layers across GPUs |

## 3. 
