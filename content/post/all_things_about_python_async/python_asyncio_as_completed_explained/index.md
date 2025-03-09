---
title: "Processing Results as They Arrive with as_completed"
description: "Learn how to use asyncio.as_completed to handle task results immediately when they're ready"
slug: python-asyncio-as-completed-explained
date: 2025-03-09 00:00:00+0000
image: cover.webp
categories:
    - Python
    - Concurrency
tags:
    - asyncio
    - as_completed
    - concurrency
---

## as_completed: Don't Wait for Everyone to Finish

While `gather()` makes you wait for all tasks to finish before getting any results, `as_completed()` gives you results as soon as they're ready. This is perfect when you want to start processing results immediately.

### How as_completed Works

The `as_completed()` function takes an iterable of coroutines or tasks and returns an iterator that yields futures as they complete.

```python
import asyncio
import time
import random

async def fetch_data(name, delay):
    print(f"Starting to fetch {name}...")
    await asyncio.sleep(delay)  # Simulating varying response times
    print(f"Finished fetching {name}")
    return f"Result from {name}"

async def main():
    # Create a list of tasks with random completion times
    tasks = [
        fetch_data("API 1", random.uniform(1, 5)),
        fetch_data("API 2", random.uniform(1, 5)),
        fetch_data("API 3", random.uniform(1, 5)),
        fetch_data("API 4", random.uniform(1, 5)),
        fetch_data("API 5", random.uniform(1, 5))
    ]
    
    print("Processing results as they arrive:")
    
    for future in asyncio.as_completed(tasks):
        result = await future
        # Process each result as soon as it's available
        print(f"Just received: {result}")
        print(f"Processing {result} immediately!")

asyncio.run(main())
```

Running this code, you'll see that results are processed in the order they complete, not in the order the tasks were created.

### The Restaurant Analogy

Think of `as_completed()` like a restaurant kitchen filling orders:

- Several tables place orders (tasks) at different times
- The chef prepares all orders simultaneously
- As each dish is completed, the waiter immediately serves it to the appropriate table
- Tables that ordered simpler dishes get served first, regardless of when they ordered

You don't wait for all tables to be served before delivering any food - each is served as soon as it's ready.

### Differences From gather()

1. **Order**: `gather()` returns results in the input order; `as_completed()` returns in completion order
2. **Processing**: `gather()` waits for all results; `as_completed()` allows processing as they arrive
3. **Result format**: `gather()` returns a list; `as_completed()` yields individual results

### Practical Use Cases

`as_completed()` is ideal when:

- You want to display results to users as they become available
- Some tasks might take much longer than others
- You need to process each result independently
- You're fetching many items and want to start working with the first ones immediately

```python
async def main():
    # Imagine fetching 100 resources with varying response times
    urls = [f"https://api.example.com/item/{i}" for i in range(100)]
    tasks = [fetch_url(url) for url in urls]
    
    # Process each result as soon as it's ready
    completed = 0
    for future in asyncio.as_completed(tasks):
        result = await future
        process_result(result)  # Start working with this result now!
        
        completed += 1
        print(f"Progress: {completed}%")
```

By processing results as they arrive, your application can feel much more responsive and efficient, especially when dealing with operations that have widely varying completion times.
