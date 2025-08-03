---
title: "Python Asyncio：协程详解"
description: "对 Python 协程的清晰解释——asyncio 编程的基础构件"
slug: python-asyncio-coroutines-explained
date: 2025-03-09
image: cover.webp
categories:
    - Python
    - 并发
tags:
    - asyncio
    - 协程
    - async-await
---

## 协程：Asyncio 的基石

协程是 asyncio 编程的基础。你可以把它们想象成拥有“超能力”的函数——它们可以暂停执行，将控制权交还给所谓的“事件循环”，然后又能从刚才暂停的地方继续运行。

### 协程的特别之处是什么？

协程类似于普通函数，但有一个重要区别：它可以在执行过程中暂停，而不会丢失当前的状态。这对于那些可能需要等待一段时间的操作非常适合，比如从网络获取数据或读取大型文件。

```python
# 一个基本的协程
import asyncio

async def my_coroutine():
    print("开始工作……")
    await asyncio.sleep(1)  # 这里我们暂停
    print("1 秒后完成！")
    return "任务完成"

# 如何运行一个协程
result = asyncio.run(my_coroutine())
print(f"获得结果: {result}")
```

### `async` 和 `await` 关键字

这两个关键字配合使用，实现了协程的“魔法”：

- `async`：标记一个函数为协程。这意味着该函数在执行过程中可能会暂停。
- `await`：表示暂停点，协程会在这里将控制权交还给事件循环，直到某个操作完成。

你可以把 `await` 理解为：“我需要等待这个操作完成，但在等待期间，其他代码也可以运行。”

### 需要记住的关键概念

- 所有 `async` 函数都会返回一个“协程对象”（类似于 JavaScript 的 promise）。
- 除非你对协程使用 `await`，否则它实际上并不会运行——它只是一个执行蓝图。
- 没有被 await 的协程就像一封从未寄出的信——什么都不会发生！
- 要真正执行协程，需要使用如 `asyncio.run()` 或 `asyncio.gather()` 这样的函数。

### 协程与普通函数：交通类比

可以把普通函数想象成单车道公路，车辆（执行）必须从头到尾依次通过。

而协程就像多车道高速公路，并设有特殊的出口。当一辆车（任务）需要加油（等待 I/O）时，它可以驶出高速公路（让出控制权），让其他车辆继续高速前进。加油完成后，这辆车再重新并入高速，继续前行。

### 常见错误及避免方法

使用协程时最常见的错误就是忘记 await：

```python
# 这样并不会真正运行协程！
my_coroutine()  # 返回一个协程对象，但不会执行

# 这样才会运行协程
await my_coroutine()  # 在另一个 async 函数内部
# 或者
asyncio.run(my_coroutine())  # 在顶层调用
```

有了协程作为你的构建基石，你就可以创建高并发的应用程序，高效地同时处理大量操作，而无需传统多线程的复杂性。