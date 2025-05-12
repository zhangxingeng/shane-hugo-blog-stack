---
title: "使用 as_completed 实时处理结果"
description: "学习如何使用 asyncio.as_completed 在任务结果就绪时立即处理它们"
slug: python-asyncio-as-completed-explained
date: 2025-03-09 00:00:00+0000
image: cover.webp
categories:
    - Python
    - 并发
tags:
    - asyncio
    - as_completed
    - 并发
---

## as_completed：无需等待所有任务完成

当你使用 `gather()` 时，必须等所有任务都完成后才能获取任何结果；而 `as_completed()` 则会在每个任务完成时立即返回结果。这非常适合你希望第一时间处理结果的场景。

### as_completed 的工作原理

`as_completed()` 函数接收一个协程或任务的可迭代对象，并返回一个迭代器，该迭代器会在每个任务完成时依次产出 future。

```python
import asyncio
import time
import random

async def fetch_data(name, delay):
    print(f"开始获取 {name} ...")
    await asyncio.sleep(delay)  # 模拟不同的响应时间
    print(f"{name} 获取完成")
    return f"{name} 的结果"

async def main():
    # 创建一组具有随机完成时间的任务
    tasks = [
        fetch_data("API 1", random.uniform(1, 5)),
        fetch_data("API 2", random.uniform(1, 5)),
        fetch_data("API 3", random.uniform(1, 5)),
        fetch_data("API 4", random.uniform(1, 5)),
        fetch_data("API 5", random.uniform(1, 5))
    ]
    
    print("结果一到就开始处理：")
    
    for future in asyncio.as_completed(tasks):
        result = await future
        # 每有结果就立即处理
        print(f"刚收到：{result}")
        print(f"立即处理 {result}！")

asyncio.run(main())
```

运行这段代码，你会发现结果的处理顺序是按照任务完成的先后，而不是任务创建的顺序。

### 餐厅类比

可以把 `as_completed()` 想象成餐厅厨房处理订单的方式：

- 多个餐桌（任务）在不同时间下单
- 厨师同时准备所有订单
- 每道菜完成后，服务员立即将其送到对应餐桌
- 点了简单菜品的餐桌会更早吃到饭，无论他们什么时候下单

你不会等所有餐桌的菜都做好了才一起上菜——每道菜一做好就立即上桌。

### 与 gather() 的区别

1. **顺序**：`gather()` 返回的结果顺序与输入顺序一致；`as_completed()` 按完成顺序返回
2. **处理方式**：`gather()` 等所有结果都准备好；`as_completed()` 结果一到就可以处理
3. **结果格式**：`gather()` 返回一个列表；`as_completed()` 逐个产出结果

### 实用场景

`as_completed()` 特别适合以下情况：

- 你希望结果一出来就展示给用户
- 某些任务可能比其他任务耗时多得多
- 你需要独立处理每个结果
- 你在抓取大量数据时，希望尽早处理最先返回的部分

```python
async def main():
    # 假设要抓取 100 个响应时间不同的资源
    urls = [f"https://api.example.com/item/{i}" for i in range(100)]
    tasks = [fetch_url(url) for url in urls]
    
    # 结果一到就处理
    completed = 0
    for future in asyncio.as_completed(tasks):
        result = await future
        process_result(result)  # 立即处理这个结果！
        
        completed += 1
        print(f"进度：{completed}%")
```

通过实时处理结果，你的应用可以变得更加响应迅速和高效，尤其是在处理完成时间差异很大的操作时。