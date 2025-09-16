---

title: "Runtime Types in Python: A Hands-On Guide (with Pydantic v2 & Generics)"
description: "A practical, story-driven walkthrough of how to recover types at runtime—plain Python, typing.get\_args/get\_origin, Pydantic v2 generics, forward refs, and a simple pattern that sidesteps rebuild hell."
slug: runtime-types-python-pydantic-generics
date: 2025-09-15
image: cover.webp
categories:
    - Technology
    - Python
tags: [python, typing, pydantic, pydantic-v2, generics, runtime-introspection, get_args, get_origin, forward-ref, computed_field, datamodels, blog-learning-journey]

---

I used to think Python’s typing was either “on” or “off.” If my IDE and `mypy` were happy, surely runtime would be happy too… right? Then I tried to *teach* my app what type it was holding **at runtime**—especially inside **Pydantic v2** generic models—and fell straight into the rabbit hole: `get_args` working here, returning nothing there, forward refs exploding unless I rebuilt models in just the right order.

This post is the notebook of that journey—what actually works, what *doesn’t*, and the mental model that finally made everything click.

---

## TL;DR (read this first)

* **For plain typing constructs** like `list[int]`, `dict[str, float]`, `Optional[T]`:

  * Use `typing.get_origin(tp)` and `typing.get_args(tp)`.

* **Inside Pydantic v2 generic models** like `class Message(Generic[T])`:

  * `typing.get_args(self.__class__)` is often **empty** (because `Message[int]` is a real subclass, not a typing alias).
  * Prefer:

    1. `self.__class__.__pydantic_generic_metadata__["args"]` (if present), or
    2. `self.__class__.model_fields["field_name"].annotation` (already substituted).

* **When the model isn’t parameterized** (`Message(content=...)`), fall back to `type(self.content)`.

* **Forward refs & circular types**: the pain comes from **lost local namespaces** at runtime. Capturing the defining scope and passing it to `get_type_hints(..., localns=...)` (or using a framework that does) avoids rebuild roulette.

If you only needed the recipe—there it is. If you want to understand *why*, keep going.

---

## Why runtime types feel slippery

Static analysis (your IDE, `mypy`) reads source code before it runs. Runtime introspection (your app actually running) sees only what exists **now**. Locals from a factory function? Gone. Circular refs to names defined *later*? Not there *yet*.

So the game is: **what object are you inspecting, and in what scope?**

* **Typing objects** (e.g., `list[int]`, `dict[str, int]`, `Union[int, str]`):
  `get_origin` / `get_args` are perfect.
* **Concrete classes** (including Pydantic’s specialized generics):
  they’re **classes**, not typing aliases. `get_args(cls)` often returns `()`.

---

## Step 1 — The reliable base: `get_origin` / `get_args`

```python
from typing import get_origin, get_args, Optional

tp = list[int]
print(get_origin(tp))      # <class 'list'>
print(get_args(tp))        # (int,)

tp = dict[str, float]
print(get_origin(tp))      # <class 'dict'>
print(get_args(tp))        # (str, float)

tp = Optional[int]         # Union[int, NoneType]
print(get_origin(tp))      # types.UnionType or typing.Union
print(get_args(tp))        # (int, NoneType)
```

**Rule:** use these for **type expressions**. If you’re holding a **class**, this won’t necessarily help.

---

## Step 2 — Pydantic v2 generics: why `get_args(self.__class__)` is empty

In Pydantic v2, specializing `Message[int]` actually creates a **real subclass** of `Message`, not a mere typing alias. That’s why:

```python
args = get_args(self.__class__)  # often ()
```

The type parameter isn’t stored in a “typing” way—it’s attached as **Pydantic metadata** and reflected in **field annotations**.

### The pattern that works (drop-in)

```python
from typing import Generic, TypeVar, get_args, get_origin
from pydantic import BaseModel, computed_field

T = TypeVar("T")

def _pretty(tp) -> str:
    # Builtins / normal classes
    if hasattr(tp, "__name__"):
        return tp.__name__
    # typing constructs (list[int], dict[str, int], etc.)
    origin = get_origin(tp)
    if origin is None:
        return str(tp)
    inner = ", ".join(_pretty(a) for a in get_args(tp))
    base = getattr(origin, "__name__", str(origin))
    return f"{base}[{inner}]"

class Message(BaseModel, Generic[T]):
    content: T

    @computed_field
    @property
    def content_class_name(self) -> str:
        # 1) Pydantic’s generic metadata (most direct)
        meta = getattr(self.__class__, "__pydantic_generic_metadata__", None)
        if meta and meta.get("args"):
            return _pretty(meta["args"][0])

        # 2) The field’s substituted annotation after specialization
        ann = self.__class__.model_fields["content"].annotation
        if ann is not None:
            return _pretty(ann)

        # 3) Fallback: infer from actual value at runtime
        return _pretty(type(self.content))
```

**Demos:**

```python
print(Message[int](content=1).content_class_name)                 # "int"
print(Message[list[int]](content=[1, 2]).content_class_name)      # "list[int]"
print(Message(content="hi").content_class_name)                   # "str" (fallback)

class User(BaseModel): id: int
print(Message[User](content=User(id=1)).content_class_name)       # "User"
print(Message[dict[str, int]](content={"a": 1}).content_class_name) # "dict[str, int]"
```

**Takeaway:** This method is **agnostic** to what `T` is—primitive, container, union, or model.

---

## Step 3 — Common failure modes (and how to recognize them)

### 1) “It works on one machine but not another”

* You’re mixing old and new typing behaviors (e.g., `from __future__ import annotations`, Python 3.10 vs 3.12).
* **Fix:** Test with a tiny repro and print `get_origin/args` for the exact `tp` you’re inspecting. Log `type(tp)` too.

### 2) “`get_args(self.__class__)` sometimes returns a type”

* You might be calling it on a **typing alias** elsewhere (e.g., `Alias = Message[int]` used as a **type**, not a class).
* **Fix:** `print(self.__class__, type(self.__class__))`. If it’s a **class**, prefer Pydantic metadata/annotation.

### 3) “Forward refs blow up unless I call `.model_rebuild()` everywhere”

* You’re defining classes in **local scopes** or with circular refs that outlive their namespace.
* **Fix:** Either define them at module scope **or** capture the namespace (next section).

---

## Step 4 — Forward refs & circular types without rebuild hell

The mysterious part: why do string annotations like `'Post'` sometimes resolve and sometimes don’t?

* `get_type_hints()` can resolve **module-level** names (globals).
* Locals inside a factory function are **gone** by the time you introspect.
* Circular refs need all names present **at resolution time**, not just at parse time.

### A tiny helper that changes the game

Capture the creator’s **local namespace** and use it for later resolution:

```python
import inspect
from typing import get_type_hints

def capture_localns():
    # Call where you create your graph / registry
    frame = inspect.currentframe()
    assert frame and frame.f_back
    return frame.f_back.f_locals.copy()

# Example usage
def make_models():
    class A(BaseModel): b: 'B'
    class B(BaseModel): a: A
    localns = capture_localns()
    # Later…
    hints = get_type_hints(A, localns=localns)  # resolves 'B'
    return A, B
```

Frameworks can do this for you automatically (capture once, resolve later), which is how I stopped sprinkling `.model_rebuild()` like confetti.

**Mental model:** runtime success is less about “are types defined?” and more about “did I **preserve the context** where those names make sense?”

---

## Step 5 — A practical checklist

* **Am I dealing with a typing expression or a class?**

  * Typing → `get_origin`/`get_args`.
  * Class → framework-specific metadata or field annotations.

* **Is my Pydantic generic specialized?**

  * Prefer `__pydantic_generic_metadata__['args']`.
  * Or read `model_fields[name].annotation`.

* **Is this model unparameterized?**

  * Fall back to `type(value)`.

* **Am I in forward-ref land?**

  * Keep types at module scope **or** capture `localns` and pass it to `get_type_hints`.

* **Do I need a readable name?**

  * Use a `_pretty()` like above to handle `list[int]`, unions, `Annotated`, etc.

---

## Frequently asked “gotchas”

**Q: Do I need different logic when `T` is `list[...]` vs a Pydantic model?**
**A:** No. The **source** of truth differs (metadata vs annotation vs value), but the `_pretty()` printer treats them uniformly.

**Q: Why does `model_fields["content"].annotation` already look substituted?**
**A:** Pydantic v2 specializes the field annotation on the parameterized subclass (e.g., `Message[int]`), so the field’s annotation is often already the concrete `int`, `list[int]`, etc.

**Q: Is reading `__pydantic_generic_metadata__` “private”?**
**A:** It’s semi-internal. It’s also the **most accurate** reflection of the specialization. Keep it behind a small helper so you can swap strategies later if Pydantic changes.

---

## A compact utility you can paste into your codebase

```python
# runtime_types.py
from typing import Any, get_args, get_origin

def pretty_type_name(tp: Any) -> str:
    if hasattr(tp, "__name__"):
        return tp.__name__
    origin = get_origin(tp)
    if origin is None:
        return str(tp)
    inner = ", ".join(pretty_type_name(a) for a in get_args(tp))
    base = getattr(origin, "__name__", str(origin))
    return f"{base}[{inner}]"

def pydantic_T(cls: type, field: str):
    """Return (tp, source) for a Pydantic generic field if available."""
    meta = getattr(cls, "__pydantic_generic_metadata__", None)
    if meta and meta.get("args"):
        return meta["args"][0], "pydantic_meta"
    ann = getattr(cls, "model_fields", {}).get(field, None)
    if ann and getattr(ann, "annotation", None) is not None:
        return ann.annotation, "field_annotation"
    return None, "unknown"
```

Use it like:

```python
tp, src = pydantic_T(self.__class__, "content")
name = pretty_type_name(tp) if tp else pretty_type_name(type(self.content))
```

---

## The mindset shift that unlocked everything

I stopped asking “Why won’t Python give me the type?” and started asking:

> **“What *object* am I inspecting, and what *context* am I resolving in?”**

* Typing expressions encode their structure → `get_origin/get_args`.
* Specialized classes encode their specialization via library metadata/annotations.
* Forward refs work when the **right namespace** is provided at resolution time.

Once you see those three lanes, the road becomes smooth.

---

## Epilogue: mistakes I still make (so you don’t have to)

* Calling `get_args()` on classes and being surprised by `()`.
* Assuming `mypy` success implies runtime success. (Different worlds!)
* Forgetting that function-scoped names vanish before introspection.
* Reaching for `.model_rebuild()` instead of just preserving the namespace.

If this saved you an evening of head-scratching, it was worth writing.

---

(Written by Human, improved using AI where applicable.)
