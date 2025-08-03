---
title: "使用 Asyncio Gather 实现并行操作"
description: "掌握 asyncio.gather()，同时运行多个协程并合并它们的结果"
slug: python-asyncio-gather-explained
date: 2025-03-09
image: cover.webp
categories:
    - Python
    - 并发
tags:
    - asyncio
    - gather
    - 并发
---

## Gather：并行运行多个协程

在使用 asyncio 时，你经常会希望同时启动多个操作，并等待它们全部完成。这正是 `asyncio.gather()` 的用途。

### Gather 的工作原理

`gather()` 函数接收多个协程，将它们转换为任务，并发运行，并将所有结果收集到一个列表中。

```python
import asyncio
import time

async def fetch_data(source, delay):
    print(f"正在从 {source} 获取数据...")
    await asyncio.sleep(delay)  # 模拟网络请求
    print(f"完成从 {source} 获取数据")
    return f"来自 {source} 的数据"

async def main():
    start = time.time()
    
    # 并发运行这三个协程
    results = await asyncio.gather(
        fetch_data("API 1", 3),
        fetch_data("API 2", 1),
        fetch_data("API 3", 2)
    )
    
    end = time.time()
    
    print(f"所有请求在 {end - start:.2f} 秒内完成")
    print(f"结果: {results}")

asyncio.run(main())
```

这个例子同时从三个不同的数据源获取数据。尽管所有请求的总时间为 6 秒（3+1+2），但整个操作只用了大约 3 秒——也就是最长请求的时间。

### 购物类比

可以把 `gather()` 想象成让家里的几个人分别去买不同的东西：

- 妈妈去面包店（3分钟）
- 爸爸去肉店（1分钟）
- 孩子去蔬菜区（2分钟）

如果顺序进行需要 6 分钟，但因为大家同时去购物，实际总共只需要 3 分钟（最长的那项任务所需时间）。

### Gather 的关键特性

1. **有序结果**：返回的结果顺序与输入协程的顺序一致
2. **错误处理**：默认情况下，任何一个协程出错都会抛出异常
3. **取消操作**：取消 gather 会取消所有未完成的协程

### Gather 的错误处理

使用 `gather()` 时，你可以选择如何处理错误：

```python
# 默认情况下，任何异常都会终止所有任务
try:
    results = await asyncio.gather(
        coroutine1(),
        coroutine2(),
        coroutine3()
    )
except Exception as e:
    print(f"某个任务失败了: {e}")

# 设置 return_exceptions=True，异常会作为结果的一部分返回
results = await asyncio.gather(
    coroutine1(),
    coroutine2(),
    coroutine3(),
    return_exceptions=True
)

for i, result in enumerate(results):
    if isinstance(result, Exception):
        print(f"任务 {i} 失败，原因: {result}")
    else:
        print(f"任务 {i} 成功，结果: {result}")
```

### 实用场景

当你需要执行多个相互独立、都必须完成的操作时，`gather()` 非常有用：

- 为仪表盘加载多个 API 资源
- 同时下载多个文件
- 并行执行数据库查询
- 批量处理多个项目

通过高效使用 `gather()`，你可以极大地加快原本需要顺序执行的操作，让你的应用程序更加高效。