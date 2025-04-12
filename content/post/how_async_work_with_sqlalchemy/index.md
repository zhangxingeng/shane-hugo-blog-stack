---
title: "Async SQLAlchemy Journey: From Confusion to Clarity"
description: "Exploring the pitfalls and revelations of migrating from synchronous to async SQLAlchemy with FastAPI"
slug: async-sqlalchemy-journey
date: 2025-04-12 00:00:00+0000
image: cover.webp
categories:
    - Python
    - FastAPI
    - SQLAlchemy
tags:
    - async
    - python
    - sqlalchemy
    - fastapi
    - database
---

When I first heard about using async SQLAlchemy with FastAPI, my initial thought was something along the lines of, "Great—another trendy buzzword. How complicated could this be?" Turns out, it's slightly more involved than adding `async` and calling it a day. Here's the story of my bumpy journey through confusion, wrong assumptions, and eventual enlightenment.

## First Impressions: Async, Await, and SQLAlchemy

Coming from a background of synchronous code, async always felt like magic sprinkled on code to make it "better." And since I'd worked extensively with TypeScript async patterns, I thought Python's async should be pretty similar. Easy, right?

Wrong.

My initial belief: You just throw `async def` on your FastAPI routes, await some SQLAlchemy queries, and voilà—lightning-fast APIs.

**Spoiler alert:** Nope, that's not how it works at all.

## The Mental Model Problem

I initially thought of async as a simple performance booster - like adding nitrous to a car engine. But that's a flawed mental model. Async in Python is more like switching from a single-lane road to a multi-lane highway system with sophisticated traffic management.

In TypeScript/JavaScript, the event loop is built into the language from the ground up. In Python, it's more of an architectural choice you make, with different patterns for different scenarios.

## Diving into Async SQLAlchemy: The First Confusion

Initially, my typical sync SQLAlchemy queries looked like this:

```python
def get_user(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()
```

Pretty straightforward. But when I tried adding `async def` and sprinkling some `await` keywords around this:

```python
async def get_user(db: Session, email: str):
    return await db.query(User).filter(User.email == email).first()  # THIS IS WRONG!
```

I quickly realized something wasn't right. Python immediately threw a tantrum:

```console
AttributeError: 'Query' object has no attribute '__await__'
```

Ah, classic. Turns out, I made my first crucial mistake:

> **Wrong assumption:** SQLAlchemy's classic `session.query()` pattern magically supports async.

Nope, it doesn't. It's like trying to plug a standard electrical appliance into a USB port – they're just not compatible systems!

## The "Blocking" Realization

This led me to a deeper understanding of what "blocking" really means. Imagine a restaurant with one waiter (the event loop). When the waiter goes to the kitchen (database) to get your order, everyone else has to wait.

In a sync system, the waiter is stuck in the kitchen until your order is ready. In an async system, the waiter can take more orders while the kitchen prepares your food.

The problem? My SQLAlchemy session was that waiter who refused to multitask:

```python
@app.get("/users/{user_id}")
async def read_user(user_id: int, db: Session = Depends(get_db)):
    # Even inside an async def function, this is a BLOCKING call!
    user = db.query(User).filter(User.id == user_id).first()
    return user
```

This code is the worst of both worlds - it uses async syntax but still blocks on database calls!

## Enter the Mysterious `.execute()` and `select()`

After frantically scrolling Stack Overflow (as we all inevitably do), I discovered that async SQLAlchemy uses a completely different syntax:

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

async def get_user(db: AsyncSession, email: str):
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()
```

"Wait, hold up," I thought, staring blankly at the `.scalars().first()` part. "Why does fetching a single record suddenly involve two seemingly cryptic steps?"

This felt unnecessarily complex. I mean, what's wrong with good old `.query().first()`?

## Database Dependencies: The Forgotten Piece

I then realized that my FastAPI dependencies also needed to change. The synchronous session provider:

```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

Had to become:

```python
async def get_async_db():
    async with async_session() as session:
        yield session
```

This is not just syntax - it's a fundamentally different approach to session management!

## Unpacking My Misunderstandings: What's `.scalars()` Anyway?

Initially, I thought `.scalars()` might be some fancy async collector that waits for the stream to finish and then magically spits out objects. But after digging deeper, it turns out that `.execute()` returns something called a `Result` object, basically a table-like structure, even if your query returns just one column.

Let me break it down with an analogy that finally made it click for me:

Imagine a SQLAlchemy query as ordering food:

**Sync SQLAlchemy (the old way):**

```python
pizza = restaurant.order(Pizza).with_topping('pepperoni').make()
```

Simple! You get a pizza directly.

**Async SQLAlchemy (the new way):**

```python
order_slip = await restaurant.execute(order(Pizza).with_topping('pepperoni'))
pizza = order_slip.items().first()
```

Why the extra steps? Imagine the waiter brings you a tray (`Result`) with multiple containers (`Row`), each containing an item you ordered (like `User` objects). Even if you ordered just one pizza, it comes on a tray, in a container:

- `execute()` = waiter brings the tray with containers
- `.scalars()` = opens all containers and puts the food items directly on the tray
- `.first()` = takes the first food item from the tray

This is what's happening when you do:

```python
# The execute() gives you: [Row(User(id=1),), Row(User(id=2),)]
result = await db.execute(select(User).where(...))

# The scalars() gives you: [User(id=1), User(id=2)]
users = result.scalars()

# The first() gives you: User(id=1)
first_user = users.first()
```

## The CRUD Translation Table

Once I understood this pattern, I needed to translate my common CRUD operations:

| Old Sync Syntax | New Async Syntax |
|-----------------|------------------|
| `db.query(User).first()` | `(await db.execute(select(User))).scalars().first()` |
| `db.query(User).all()` | `(await db.execute(select(User))).scalars().all()` |
| `db.query(User).filter(User.name == name).one()` | `(await db.execute(select(User).where(User.name == name))).scalars().one()` |
| `db.add(user); db.commit()` | `db.add(user); await db.commit()` |
| `db.query(User).filter(User.id == id).update({User.name: new_name})` | `await db.execute(update(User).where(User.id == id).values(name=new_name))` |

This table became my rosetta stone for translating my entire codebase.

## Performance Anxiety: Do I Really Need Async?

The next obvious question: does all this complexity pay off?

I decided to run a simple benchmark with a typical API endpoint that makes a DB call. Here's what I found with 1000 concurrent requests:

- **Sync FastAPI + Sync SQLAlchemy**: ~600 requests/second
- **Async FastAPI + Sync SQLAlchemy**: ~550 requests/second (actually worse!)
- **Async FastAPI + Async SQLAlchemy**: ~1400 requests/second

The middle option is worse because it has the overhead of async without the benefits! It's like hiring a multitasking waiter but then telling them they can only serve one table at a time.

Async is fantastic if you're building highly concurrent APIs (think thousands of requests per second). While your synchronous DB call is blocking your entire API from handling other requests, async allows Python to juggle multiple incoming requests while waiting on the database.

## The Python 3.13 Plot Twist

But then I heard whispers about Python 3.13 and its unlocked GIL (Global Interpreter Lock), promising real multi-threading. Could threading replace async? Initially, my naive thought was yes—but again, wrong assumption.

I imagined Python 3.13's GIL improvements would make threading a universal solution, but I was mixing up two different problems:

- **CPU-bound tasks**: Benefit from multi-threading with an unlocked GIL
- **I/O-bound tasks** (like DB queries): Benefit from async regardless of GIL

The unlocked GIL certainly helps with CPU-bound tasks, but async is still superior for network-bound workloads—exactly what most APIs deal with. Thus, async remains highly relevant, even in a world with improved threading.

## The Hybrid Approach: A Pragmatic Solution

For my existing project with hundreds of routes, a complete rewrite wasn't feasible. I discovered a pragmatic transitional approach:

```python
from fastapi.concurrency import run_in_threadpool

@app.get("/legacy-but-important")
async def read_complex_report(db: Session = Depends(get_db)):
    # Run blocking code in a thread pool without blocking the event loop
    result = await run_in_threadpool(
        lambda: db.query(ComplexReport).all()
    )
    return result
```

This pattern let me gradually migrate my codebase, starting with the most heavily-used endpoints.

## What About Special DB Extensions, Like pgvector?

My last hesitation: specialized extensions like `pgvector`. Do they even work async? After some quick research, it turns out async and `pgvector` are great friends. Using `asyncpg` as the PostgreSQL driver makes integrating async with specialized extensions seamless.

Here's a quick example of async querying with `pgvector`:

```python
stmt = select(Document).order_by(
    l2_distance(Document.embedding, query_vector)
).limit(5)

result = await db.execute(stmt)
docs = result.scalars().all()
```

I was relieved to find that my future plans to add vector search wouldn't be hindered by my migration to async.

## Helper Functions: Simplifying Life

After migrating a few routes, I quickly realized the verbosity was getting tedious. So I created helper functions:

```python
async def db_get(db: AsyncSession, model, **kwargs):
    stmt = select(model).filter_by(**kwargs)
    result = await db.execute(stmt)
    return result.scalars().first()

# Usage
user = await db_get(db, User, email="user@example.com")
```

These helpers restored some of the simplicity of the old sync syntax while maintaining the async benefits.

## Wrapping Up My Async Journey

From dismissing async as a trendy gimmick, struggling with syntax, misunderstanding `.scalars()`, and finally embracing its strengths—my journey was both frustrating and enlightening. Async SQLAlchemy is not as scary as it seems, but it certainly requires a mindset shift and a willingness to embrace new patterns.

If you take away three lessons from my journey:

1. **Mental model matters**: Async is about concurrency, not parallelism
2. **It's all or nothing**: Mixing async routes with sync DB calls gives you the worst of both worlds
3. **Abstraction helps**: Create helper functions to simplify the verbose syntax

So, if you're currently staring at your `db.query()` code and wondering whether async SQLAlchemy is worth the switch—take heart! It's a bit confusing at first, but clarity (and better performance) awaits.
