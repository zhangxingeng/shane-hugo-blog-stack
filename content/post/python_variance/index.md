---
title: "Why Python Stopped Me from Pouring Sprite into a Coke Can"
description: "Understanding Python generics and variance through a relatable soda can analogy, and how the type checker protects your code."
slug: python-generics-sprite-in-coke-can
date: 2025-06-07
image: cover.webp
categories:
- Technology
- Python Programming
tags:
- python
- typing
- generics
- covariance
- contravariance
- static-typing
- mypy
- programming-concepts
- type-safety
- runtime-errors
- type-system
- python-typing
- debugging
- software-development
- programming-tips
- code-quality
---

You know that frustrating moment when your code seems perfect, but Python's type checker (mypy) stubbornly insists there's a problem? My first instinct is always, "This has got to be a mistake!"

Recently, I hit this exact scenario while building a beverage-management app. Mypy threw this baffling error:

```console
error: Argument 1 to "party_drinks" has incompatible type "TinCan[Coke]"; expected "TinCan[Soda]"
```

Initially, I thought, "But Coke *is* a Soda! Why can't I use a Coke can wherever a Soda can is expected?"

Turns out, mypy was protecting me from a runtime disaster I couldn't see coming.

## The "Sprite in a Coke Can" Disaster

To understand what mypy was preventing, imagine this real-world scenario:

You have a can specifically labeled "Coke." You hand it to someone at a party, and they innocently fill it with Sprite (after all, Sprite is also a soda, right?). Later, you confidently take a sip expecting that familiar cola taste, and suddenly—*surprise!*—you're tasting lemon-lime. Your expectations are completely violated!

This is exactly the disaster Python's type system prevents in your code.

Here's how this scenario translates to Python:

```python
from typing import TypeVar, Generic

class Soda: 
    """Base class for all sodas"""
    pass

class Coke(Soda): 
    """Coca-Cola: expects caramel color and cola taste"""
    pass

class Sprite(Soda): 
    """Sprite: clear, lemon-lime flavored"""
    pass

T = TypeVar("T")

class TinCan(Generic[T]):
    """A can that can be filled with and dispense a specific type of soda"""
    def __init__(self, contents: T):
        self.contents = contents

    def drink(self) -> T:
        """Get the soda from the can"""
        return self.contents

    def fill(self, new_soda: T) -> None:
        """Replace the contents with new soda"""
        self.contents = new_soda

def party_drinks(can: TinCan[Soda]):
    """A function that accepts any soda can and might refill it"""
    print(f"Drinking {type(can.drink()).__name__}")
    can.fill(Sprite())  # Filling with Sprite seems reasonable for a Soda can!

# Here's where the problem occurs:
coke_can = TinCan[Coke](Coke())  # This is specifically a Coke can
party_drinks(coke_can)  # 🚨 mypy prevents this!

# If this were allowed, the next line would fail at runtime:
# coke: Coke = coke_can.drink()  # Expected Coke, but got Sprite!
```

Mypy blocks this because if it allowed the substitution, your specialized Coke can would get contaminated with Sprite, violating the type contract.

## Why Can't We Treat `TinCan[Coke]` as `TinCan[Soda]`?

You might think: "Since every Coke is a Soda, shouldn't every `TinCan[Coke]` be a `TinCan[Soda]`?"

The answer is **no**, and here's why:

1. `TinCan[Soda]` promises to accept *any* soda via its `fill` method
2. `TinCan[Coke]` promises to accept *only* Coke
3. If we treat `TinCan[Coke]` as `TinCan[Soda]`, we'd violate promise #2

This relationship between generic types is called **variance**, and understanding it is crucial for type safety.

## The Secret Life of Containers: Variance Explained

The key insight is that container substitutability depends on whether the container allows **reading**, **writing**, or **both**. Python categorizes these patterns:

### 🥤 Covariant Containers: Read-Only (Safe to Go Specific → General)

Imagine a sealed can—you can drink from it but never refill it:

```python
from typing import TypeVar, Generic

T_co = TypeVar("T_co", covariant=True)

class SealedCan(Generic[T_co]):
    """A read-only can that can't be refilled"""
    def __init__(self, contents: T_co):
        self._contents = contents

    def drink(self) -> T_co:
        return self._contents
    
    # Note: No fill() method!

def serve_any_soda(can: SealedCan[Soda]):
    """This function accepts any sealed soda can"""
    print(f"Serving {type(can.drink()).__name__}")

# This is safe!
sealed_coke = SealedCan[Coke](Coke())
serve_any_soda(sealed_coke)  # ✅ Works perfectly
# Why? Because we can only read, and Coke is always a valid Soda
```

**Real-world examples:**

- `Sequence[T]`, `Iterable[T]`, `Iterator[T]` are all covariant
- Function return types are covariant

### 🪣 Contravariant Containers: Write-Only (Safe to Go General → Specific)

Now imagine a disposal can—you can only put things in, never take them out:

```python
T_contra = TypeVar("T_contra", contravariant=True)

class DisposalCan(Generic[T_contra]):
    """A write-only can for disposal"""
    def dispose(self, item: T_contra) -> None:
        print(f"Disposing {type(item).__name__}")
    
    # Note: No way to retrieve items!

def dispose_coke(can: DisposalCan[Coke]):
    """This function needs to dispose of Coke"""
    can.dispose(Coke())

# This is safe!
general_disposal = DisposalCan[Soda]()
dispose_coke(general_disposal)  # ✅ Works perfectly
# Why? A disposal that accepts any Soda can certainly handle Coke
```

**Real-world examples:**

- Function parameter types are contravariant
- `Callable[[T], None]` is contravariant in `T`

### ⚖️ Invariant Containers: Read-and-Write (No Safe Substitutions)

When a container supports both reading and writing (like our original `TinCan`), it's **invariant**:

```python
# Neither of these substitutions is safe:
# ❌ TinCan[Coke] → TinCan[Soda] (would allow Sprite in a Coke can)
# ❌ TinCan[Soda] → TinCan[Coke] (would return non-Coke from a Coke can)
```

**Real-world examples:**

- `list[T]`, `dict[K, V]`, `set[T]` are all invariant
- Most mutable containers are invariant

## Quick Reference: When to Use Each Variance

| Variance | When to Use | Type Parameter | Example |
|----------|-------------|----------------|---------|
| **Covariant** | Read-only operations | `TypeVar("T", covariant=True)` | Producers, getters, iterators |
| **Contravariant** | Write-only operations | `TypeVar("T", contravariant=True)` | Consumers, setters, handlers |
| **Invariant** | Read-write operations | `TypeVar("T")` | Mutable containers |

## Fixing Our Original Problem

So how do we fix our party drinks scenario? Here are three approaches:

### Option 1: Use a Protocol for Read-Only Access

```python
from typing import Protocol, TypeVar

T_co = TypeVar("T_co", covariant=True)

class DrinkableContainer(Protocol[T_co]):
    """Protocol for containers you can only drink from"""
    def drink(self) -> T_co: ...

def party_drinks_readonly(can: DrinkableContainer[Soda]):
    print(f"Drinking {type(can.drink()).__name__}")
    # Can't fill it - the protocol doesn't have a fill method!

# Now this works!
coke_can = TinCan[Coke](Coke())
party_drinks_readonly(coke_can)  # ✅ Safe!
```

### Option 2: Be Explicit About Types

```python
def party_drinks_coke_only(can: TinCan[Coke]):
    """This function specifically handles Coke cans"""
    print(f"Drinking {type(can.drink()).__name__}")
    can.fill(Coke())  # Only filling with Coke!
```

### Option 3: Use Union Types for Flexibility

```python
from typing import Union

def party_drinks_mixed(can: Union[TinCan[Coke], TinCan[Sprite]]):
    """Handle specific soda types explicitly"""
    if isinstance(can.drink(), Coke):
        can.fill(Coke())
    else:
        can.fill(Sprite())
```

## Common Variance Pitfalls and How to Avoid Them

### Pitfall 1: Assuming List Substitutability

```python
def process_sodas(sodas: list[Soda]):
    sodas.append(Sprite())  # This is why lists are invariant!

cokes: list[Coke] = [Coke(), Coke()]
# process_sodas(cokes)  # ❌ mypy prevents this
```

**Fix:** Use `Sequence` for read-only access:

```python
from typing import Sequence

def process_sodas_readonly(sodas: Sequence[Soda]):
    for soda in sodas:
        print(type(soda).__name__)

cokes: list[Coke] = [Coke(), Coke()]
process_sodas_readonly(cokes)  # ✅ Works!
```

### Pitfall 2: Incorrect Variance Declarations

```python
# ❌ Wrong: Declaring covariant but having a setter
T_co = TypeVar("T_co", covariant=True)

class BrokenContainer(Generic[T_co]):
    def set_item(self, item: T_co) -> None:  # mypy error!
        pass
```

**Fix:** Match variance to actual usage patterns.

## My Aha Moment

My "Sprite in the Coke can" moment transformed how I think about type safety. Instead of fighting mypy's strictness, I now see it as a protective friend preventing subtle runtime disasters.

Now, whenever I see a variance error, I ask myself:

1. **What operations does this container support?**
   - Only reading → Make it covariant
   - Only writing → Make it contravariant
   - Both → Keep it invariant

2. **What substitutions am I trying to make?**
   - Specific → General? Need covariance
   - General → Specific? Need contravariance
   - Either direction? You're out of luck with invariant types

3. **Can I redesign to avoid the issue?**
   - Split read/write interfaces
   - Use protocols for flexibility
   - Be more specific about types

## Variance in Python's Standard Library

Understanding variance helps you use Python's built-in types correctly:

```python
from typing import Callable, Iterator, Mapping

# Covariant examples (can use specific where general is expected)
def process_iterator(it: Iterator[Soda]): ...
coke_iterator: Iterator[Coke] = iter([Coke()])
process_iterator(coke_iterator)  # ✅ Covariant

# Contravariant examples (can use general where specific is expected)
def use_handler(handler: Callable[[Coke], None]): ...
general_handler: Callable[[Soda], None] = lambda s: print(type(s))
use_handler(general_handler)  # ✅ Contravariant in parameter

# Invariant examples (exact match required)
def modify_list(items: list[Soda]): ...
coke_list: list[Coke] = [Coke()]
# modify_list(coke_list)  # ❌ Invariant
```

## Conclusion

Variance might seem like an obscure type theory concept, but it's actually about preventing real bugs. The "Sprite in a Coke can" problem isn't just theoretical—it represents actual runtime errors that variance rules prevent.

Next time mypy complains about variance:

- Don't fight it—understand what it's protecting you from
- Think about whether your container is read-only, write-only, or both
- Choose the appropriate variance or redesign your interface

Remember: Those type errors that seem annoying today are the runtime crashes you're avoiding tomorrow.

**Have you encountered variance-related issues in Python? How did you solve them? Share your stories in the comments!**

---

*Found this helpful? Consider sharing it with your team or bookmarking it for the next time mypy seems to be "wrong" about your perfectly reasonable code.*
