---
title: "Asyncio最佳实践与常见陷阱"
description: "学习在使用Python的asyncio库时的关键最佳实践，并避免常见错误"
slug: python-asyncio-best-practices-pitfalls
date: 2025-03-09
image: cover.webp
categories:
    - Python
    - 并发
tags:
    - asyncio
    - 最佳实践
    - 调试
---

## 编写更优雅的Asyncio代码：建议与禁忌

Python的asyncio库功能强大，但也有其独特的规范和潜在陷阱。让我们一起了解应遵循的最佳实践以及需要避免的常见错误。

### 最佳实践

#### 1. 使用 `asyncio.run()` 作为主入口

始终使用 `asyncio.run()` 启动你的asyncio程序：

```python
# 推荐做法
async def main():
    # 你的异步代码
    pass

if __name__ == "__main__":
    asyncio.run(main())
```

这个函数会正确地设置和销毁事件循环，并在发生异常时进行清理。

#### 2. 优先使用异步上下文管理器

在可用时，使用异步上下文管理器（`async with`）来正确管理资源：

```python
# 推荐做法
async with aiohttp.ClientSession() as session:
    async with session.get(url) as response:
        data = await response.text()
```

#### 3. 始终等待协程

最常见的错误之一就是忘记等待协程。一定要对协程进行await：

```python
# 错误 - 协程被创建但未执行
fetch_data(url)

# 正确 - 协程被await并执行
await fetch_data(url)

# 也正确 - 协程通过asyncio.run()执行
asyncio.run(fetch_data(url))
```

#### 4. 优雅地处理取消

在可能被取消的任务中，始终捕获`CancelledError`并清理资源：

```python
async def cancellable_task():
    try:
        # 你的任务代码
        while True:
            await asyncio.sleep(1)
            # 执行工作...
    except asyncio.CancelledError:
        # 在这里清理资源
        print("任务被取消，正在清理...")
        raise  # 重新抛出，让调用者知道任务已被取消
```