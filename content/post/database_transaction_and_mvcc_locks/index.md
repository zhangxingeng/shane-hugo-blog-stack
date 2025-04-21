---
title: "Wait, Even SELECT Starts a Transaction?—A Curious Tour of DB Locks, MVCC, and SQLAlchemy's 'Magic' Sessions"
description: "A step‑by‑step journey from 'I have no idea what a transaction really does' to 'I can reason about row‑level locks and auto‑begin like a pro,' using simple code, real‑life analogies, and plenty of aha‑moments."
slug: wait-even-select-starts-a-transaction
date: 2025-04-21 00:00:00+0000
image: cover.webp
categories:
    - Databases
    - Python
    - FastAPI
tags:
    - SQLAlchemy
    - Transactions
    - MVCC
    - Concurrency
    - Postgres
---

## "Wait, even reading starts a transaction?"

I thought transactions were only for writing data. Then I wrote this one-liner:

```python
await db.execute(text("SELECT 1"))  # innocent read
print(db.in_transaction())          # True? Wait, what?
```

Turns out SQLAlchemy's `autocommit=False` (the default) starts a transaction for ANY database operation. Even looking at your database opens the transaction gate.

Why? Because databases like PostgreSQL want you to see a consistent "snapshot" of the world—like taking a photo that doesn't change while you're looking at it.

## The Library Analogy: MVCC Explained

Imagine a magical library where:

- Everyone gets their own photocopier
- Writers physically change the books
- Readers always get fresh photocopies

When you READ (SELECT), you get a photocopy—never blocking others.
When you WRITE (UPDATE/INSERT/DELETE), you must grab the actual book, make changes, then put it back. Others writing to the same book must wait in line.

That's MVCC (Multi-Version Concurrency Control). PostgreSQL keeps multiple versions of data so readers never wait for writers.

## "So when do locks actually happen?"

Here's the timeline that finally clicked for me:

```python
user = await db.get(User, 1)      # 👀 Read: No lock
user.name = "Neo"                 # 📝 ORM marks this change: Still no lock!
await db.commit()                 # 🔒 NOW we lock → write → unlock
```

The lock only appears when your UPDATE hits the database. If you sleep between changing data and committing:

```python
user.points += 10
await asyncio.sleep(10)  # Row locked for 10 seconds! 😱
await db.commit()
```

Anyone else trying to update that user waits the full 10 seconds. Ouch.

## "Will my transaction block 5 million users?"

Only if they're all trying to edit the SAME data. Think of it like office cubicles:

- Five million people editing their own profiles? No queue. Everyone's in different cubicles.
- Five million updating a single counter? Now we have a line around the block.

Row-level locks only affect people touching the same rows. Not the whole database.

## The Transaction Gotcha: Read-Only Code

Here's a subtle trap that bit me:

```python
@router.get("/users")
async def get_users(db: SessionDep):
    users = await db.scalars(select(User))  # Transaction starts!
    await asyncio.sleep(5)  # Transaction still open...
    return users.all()
```

Even though we're just reading, the transaction stays open for 5 seconds. Not a huge deal for small apps, but at scale this can:

- Delay database cleanup (vacuum)
- Hold resources unnecessarily

Solution? Keep sessions short or explicitly rollback after reads.

## When to use `begin()` vs just `commit()`

I kept getting this error:

```console
InvalidRequestError: A transaction is already begun on this Session
```

Turns out `async with db.begin():` tries to start a NEW transaction. If one's already running (from autobegin), boom.

Just use `await db.commit()` unless you're 100% sure no transaction exists yet.

## The Ultimate Transaction Cheat Sheet

| When | What happens | Locks? |
|------|-------------|--------|
| `SessionLocal()` | Creates session | None |
| First DB query | Transaction starts | None for reads |
| `UPDATE/DELETE` | Row-level lock | Until commit |
| `await db.commit()` | Writes to disk, ends transaction | All released |
| Session closes | Auto-rollback if uncommitted | All released |

## Live Demo: See Locks in Action

Try this on your own database:

```python
async def lock_demo():
    # Create test table
    await db.execute(text("CREATE TABLE counter(id int, n int)"))
    await db.execute(text("INSERT INTO counter VALUES (1, 0)"))
    await db.commit()
    
    # Lock a row
    await db.execute(text("UPDATE counter SET n = n + 1 WHERE id = 1"))
    print("Row locked! Open another terminal and try to update this row...")
    await asyncio.sleep(10)
    await db.commit()
    print("Lock released!")
```

While this runs, open `psql` and try: `UPDATE counter SET n = n + 1 WHERE id = 1;`
Watch it wait exactly 10 seconds. That's a lock in action.

## The Mindset Shift

Before: "Transactions are mysterious database magic."
After: "Transactions are just temporal boundaries for consistent changes, with locks protecting shared resources."

Key takeaways:

1. Reading starts transactions (with autocommit=False)
2. Writing acquires locks on specific rows
3. Locks last until commit/rollback
4. Keep transactions short for happy databases

Now when I see a hanging query, I don't panic—I check who's holding the lock. And that feels pretty good.
