---
title: "Asyncio 任务：管理并发操作"
description: "学习如何使用 asyncio 任务在 Python 中无需线程地并发运行多个操作"
slug: python-asyncio-tasks-explained
date: 2025-03-09
image: cover.webp
categories:
    - Python
    - 并发
tags:
    - asyncio
    - 任务
    - create_task
---

## 任务：Asyncio 的主力军

任务（Task）是我们在 Python 的 asyncio 中同时运行多个协程的方式。可以把任务看作是协程的一个包装器，它会在后台调度并跟踪协程的执行。

### 创建和管理任务

下面是如何创建和使用任务的方法：

```python
import asyncio
import time

async def process_item(item_id, delay):
    print(f"开始处理项目 {item_id}")
    await asyncio.sleep(delay)  # 模拟一些工作
    print(f"项目 {item_id} 处理完毕，用时 {delay} 秒")
    return f"项目 {item_id} 的结果"

async def main():
    # 创建两个将并发运行的任务
    task1 = asyncio.create_task(process_item(1, 3))
    task2 = asyncio.create_task(process_item(2, 1))
    
    print("任务现在在后台运行！")
    
    # 等待两个任务完成并获取它们的结果
    result1 = await task1
    result2 = await task2
    
    print(f"全部完成！结果：{result1}, {result2}")

start = time.time()
asyncio.run(main())
print(f"总耗时：{time.time() - start:.2f} 秒")
```

运行这段代码，你会看到：
1. 两个任务几乎同时开始
2. 任务2在1秒后完成
3. 任务1在3秒后完成
4. 总执行时间只有大约3秒，而不是4秒！

这展示了并发的威力——我们可以在不使用线程的情况下同时做多件事。

### 任务的魔力：准备晚餐的类比

可以把任务想象成准备一顿多道菜的晚餐：

- 没有并发（顺序执行）：你先完全准备好沙拉，然后是主菜，最后是甜点（总时间=所有准备时间之和）
- 有任务（并发执行）：你先把烤肉放进烤箱（任务1），然后在烤肉的同时准备沙拉（任务2）。你在多项工作上同时取得进展，总耗时只等于最长的那项任务。

### 任务的主要优势

1. **自动调度**：事件循环负责安排任务何时运行
2. **状态跟踪**：任务会跟踪自己是运行中、已完成还是已取消
3. **结果存储**：任务在完成后会保存自己的结果
4. **异常处理**：任务中的异常可以被正确捕获和处理

### 常见的任务操作

```python
# 创建一个任务
task = asyncio.create_task(some_coroutine())

# 检查任务是否完成
if task.done():
    print("任务已完成")

# 取消任务
task.cancel()

# 获取结果（如果未完成会等待）
result = await task

# 设置超时
try:
    result = await asyncio.wait_for(task, timeout=5.0)
except asyncio.TimeoutError:
    print("任务耗时过长！")
```

通过有效地使用任务，你可以构建高并发的应用程序，高效利用系统资源，而无需面对线程同步的复杂性。