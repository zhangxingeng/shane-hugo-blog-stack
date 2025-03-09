---
title: "Running Parallel Operations with Asyncio Gather"
description: "Master asyncio.gather() to run multiple coroutines simultaneously and combine their results"
slug: python-asyncio-gather-explained
date: 2025-03-09 00:00:00+0000
image: cover.webp
categories:
    - Python
    - Concurrency
tags:
    - asyncio
    - gather
    - concurrency
---

## Gather: Running Multiple Coroutines in Parallel

When working with asyncio, you'll often want to start several operations at once and wait for all of them to complete. This is exactly what `asyncio.gather()` is designed for.

### How Gather Works

The `gather()` function takes multiple coroutines, turns them into tasks, runs them concurrently, and collects all their results in a single list.

```python
import asyncio
import time

async def fetch_data(source, delay):
    print(f"Fetching data from {source}...")
    await asyncio.sleep(delay)  # Simulating network request
    print(f"Done fetching from {source}")
    return f"Data from {source}"

async def main():
    start = time.time()
    
    # Run these three coroutines concurrently
    results = await asyncio.gather(
        fetch_data("API 1", 3),
        fetch_data("API 2", 1),
        fetch_data("API 3", 2)
    )
    
    end = time.time()
    
    print(f"All requests completed in {end - start:.2f} seconds")
    print(f"Results: {results}")

asyncio.run(main())
```

This example fetches data from three different sources at the same time. Even though the total time of all requests is 6 seconds (3+1+2), the entire operation takes only about 3 seconds - the time of the longest request.

### The Shopping Analogy

Think of `gather()` like sending multiple family members to shop for different items:

- Mom goes to the bakery (3 minutes)
- Dad goes to the butcher (1 minute)
- Child goes to the produce section (2 minutes)

Instead of taking 6 minutes sequentially, the shopping only takes 3 minutes total (the time of the longest errand) because everyone shops simultaneously.

### Key Features of Gather

1. **Ordered results**: Results are returned in the same order as the input coroutines
2. **Error handling**: By default, an error in any coroutine raises an exception
3. **Cancellation**: Cancelling the gather will cancel all unfinished coroutines

### Error Handling with Gather

When using `gather()`, you can choose how to handle errors:

```python
# By default, any exception stops everything
try:
    results = await asyncio.gather(
        coroutine1(),
        coroutine2(),
        coroutine3()
    )
except Exception as e:
    print(f"Something failed: {e}")

# With return_exceptions=True, exceptions become part of the results
results = await asyncio.gather(
    coroutine1(),
    coroutine2(),
    coroutine3(),
    return_exceptions=True
)

for i, result in enumerate(results):
    if isinstance(result, Exception):
        print(f"Task {i} failed with: {result}")
    else:
        print(f"Task {i} succeeded with: {result}")
```

### Practical Use Cases

`gather()` shines when performing multiple independent operations that all need to complete:

- Loading multiple API resources for a dashboard
- Downloading several files simultaneously
- Running database queries in parallel
- Processing multiple items in a batch

By using `gather()` effectively, you can dramatically speed up operations that would otherwise run sequentially, making your applications much more efficient.
