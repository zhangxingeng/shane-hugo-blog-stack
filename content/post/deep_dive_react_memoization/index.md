---
title: "React Isn’t a 60Hz Game Loop: Memoization, Rerenders, and How React Actually Works"
description: "A deep, practical dive into React's rendering behavior, memoization, and event-driven design — what really happens under the hood and how to think like React."
slug: react-rendering-memoization-event-loop
date: 2025-03-27
image: cover.webp
categories:
    - React
    - JavaScript
    - Frontend Engineering
    - Performance
    - Web Development
    - Blog
    
tags:
    - react
    - performance
    - optimization
    - memoization
    - frontend
    - event loop
    - useMemo
---

Let’s get something out of the way: **React is not a game engine.** It doesn’t wake up every 16 milliseconds like some caffeinated squirrel checking if it needs to redraw the UI. That’d be absurdly wasteful — and React is anything but that.

But here’s the thing: it *feels* like that sometimes. You make a tiny change, and suddenly it seems like your component is rendering again. And again. And again. So how does React really work under the hood? And when should you reach for tools like `useMemo`, `useCallback`, or `React.memo`?

This post is a full walkthrough of what React is *actually* doing, how memoization works, and why shallow comparisons still cost something — even if it’s cheap.

---

## React is Event-Driven — Not Frame-Driven

When people hear "reactive UI," they often imagine some kind of loop, like this:

```js
setInterval(() => {
  renderEverything(); // imaginary React
}, 16); // ~60 FPS
```

This is how a game loop works — and it would be **horrible** for a modern web UI. React doesn’t do this.

Instead, React waits. It’s event-driven:

```js
onClick(() => setState(...));
// THEN React says, "Oh! Time to render."
```

Under the hood, it uses the **JavaScript event loop** — the same loop that runs timers, AJAX callbacks, and all your browser events. It only rerenders when something changes:

- State updates (`useState`, `useReducer`)
- Props passed from a parent that changed
- Context value updates
- You explicitly forced it (`forceUpdate`, etc.)

So if no one clicks, types, resizes, or fires a timer — React stays completely idle.

---

## Yes, Memoization Is Still Work

A common assumption is: *"I'll just wrap everything in `useMemo()` and React will chill out."*

Almost! But memoization isn’t magic.

```ts
const memoizedValue = useMemo(() => expensiveComputation(a, b), [a, b]);
```

Yes, this avoids recomputing the function *if* the dependencies haven’t changed. But React still needs to check:

- Has `a` changed?
- Has `b` changed?

That’s done via **shallow equality** (aka `===`). It's cheap — but not zero-cost. And if you memoize everything unnecessarily, you’re paying that cost for no gain.

Let’s play it out:

### Scenario A: Memo Helps

```js
const sortedList = useMemo(() => list.sort(), [list]);
```

If `list` is long and rarely changes? ✅ Worth it.

### Scenario B: Memo Overkill

```js
const result = useMemo(() => 2 + 2, []);
```

Or worse:

```js
const styles = useMemo(() => ({ color: 'red' }), []);
```

Unnecessary. Fast enough without memo. You've just used CPU cycles to... check nothing changed.

### So When Should You Memo?

- When the **computation is expensive**
- When the value is **passed as a prop** to a `React.memo()` child
- When the **dependencies change infrequently**

Otherwise, don’t sweat it.

---

## Let’s Talk About React’s Idle Behavior

Here’s the beautiful thing: **React doesn’t render just because time passed**.

React is designed to **sleep** until something meaningful happens. You can think of it like this:

```ts
while (true) {
  if (somethingChanged) {
    reactRender();
  }
  // otherwise, do nothing
}
```

That “something” could be user input, a timer callback, a network response, etc. But it’s **always externally triggered.**

So if your app is sitting idle and no state or props are changing — *React does absolutely nothing*. It’s efficient by design.

---

## Inline Styles vs. `useMemo` Styles

### Inline styles (every render)

```tsx
<button style={{ color: 'red', backgroundColor: theme.bg }}>Click</button>
```

This works, but React will see a **new object every render**. If this button is inside a `React.memo()` wrapper, it’ll break memoization.

### Function returning style (still re-created each render)

```ts
const style = () => ({ color: 'red' });
```

Same problem — `style()` returns a new object every time.

### ✅ Best: `useMemo` style

```ts
const style = useMemo(() => ({ color: 'red' }), []);
```

This only recomputes if dependencies change — great for consistent object identity.

> But again: only do this if you’re passing styles to child components or rendering a large list. For one-off buttons? Not worth the memo.

---

## Shallow Equality: Light, But Not Free

Every time `useMemo` or `React.memo` runs, React compares values in your dependency array or props.

```ts
const areSame = prev.a === next.a; // shallow comparison
```

This is fast for primitives (`number`, `string`, etc.). But for arrays or objects, if the reference changes, it’s treated as different — even if contents are the same.

### Example

```ts
const list1 = [1, 2, 3];
const list2 = [1, 2, 3];
list1 === list2; // false
```

So memoizing with arrays or objects requires *careful reference management*.

---

## Final Thoughts: React’s Mental Model

To truly master React, think like React:

- **Event-driven**, not frame-driven
- **Update only when state/props/context change**
- **Shallow equality** is cheap, but not free
- **Memoization is a tool, not a crutch**
- Don’t optimize too early — measure before you memo

Your component doesn’t need to be “smart.” Just make it predictable.

React will take care of the rest.
