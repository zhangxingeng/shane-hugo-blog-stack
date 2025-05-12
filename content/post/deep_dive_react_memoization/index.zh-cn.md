---
title: "React 不是 60Hz 游戏循环：记忆化、重新渲染，以及 React 的真实工作原理"
description: "深入且实用地剖析 React 的渲染行为、记忆化和事件驱动设计——React 底层到底发生了什么，以及如何像 React 那样思考。"
slug: react-rendering-memoization-event-loop
date: 2025-03-27 00:00:00+0000
image: cover.webp
categories:
    - React
    - JavaScript
    - 前端工程
    - 性能
    - Web开发
    - 博客
    
tags:
    - react
    - 性能
    - 优化
    - 记忆化
    - 前端
    - 事件循环
    - useMemo
---

让我们先把一件事说清楚：**React 不是游戏引擎。** 它不会像一只喝了咖啡的松鼠一样，每 16 毫秒就醒来检查是否需要重绘 UI。那样做会极其浪费资源——而 React 恰恰不是这样设计的。

但问题是：有时候你*感觉*它就是这样。你做了一个小改动，突然发现你的组件又渲染了。又一次。再一次。那么 React 底层到底是怎么工作的？你又该在什么时候使用 `useMemo`、`useCallback` 或 `React.memo` 这样的工具呢？

这篇文章将完整讲解 React *实际*在做什么，记忆化的原理，以及为什么浅比较依然有成本——即使它很低。

---

## React 是事件驱动的——不是帧驱动的

当人们听到“响应式 UI”时，常常会想象成某种循环，比如这样：

```js
setInterval(() => {
  renderEverything(); // 假想的 React
}, 16); // ~60 FPS
```

这就是游戏循环的工作方式——但对于现代 Web UI 来说，这样做会**非常糟糕**。React 并不是这样运作的。

相反，React 会等待。它是事件驱动的：

```js
onClick(() => setState(...));
// 然后 React 才说：“哦！该渲染了。”
```

在底层，它利用了**JavaScript 事件循环**——也就是运行定时器、AJAX 回调和所有浏览器事件的那个循环。只有当发生了变化时，它才会重新渲染：

- 状态更新（`useState`、`useReducer`）
- 父组件传递的 props 发生变化
- Context 值发生变化
- 你主动强制更新（如 `forceUpdate` 等）

所以，如果没有人点击、输入、调整大小或触发定时器——React 会完全保持空闲。

---

## 是的，记忆化依然是有开销的

有一种常见的想法是：“我把所有东西都用 `useMemo()` 包起来，React 就不会乱动了。”

差不多！但记忆化不是魔法。

```ts
const memoizedValue = useMemo(() => expensiveComputation(a, b), [a, b]);
```

确实，如果依赖项没有变化，这样可以避免重复计算函数。但 React 仍然需要检查：

- `a` 变了吗？
- `b` 变了吗？

这是通过**浅相等**（即 `===`）来判断的。它很快——但不是零成本。如果你不必要地对所有东西都做记忆化，你其实是在为无收益的地方付出代价。

让我们来看看：

### 场景A：记忆化有用

```js
const sortedList = useMemo(() => list.sort(), [list]);
```

如果 `list` 很长且很少变化？✅ 值得记忆化。

### 场景B：记忆化过度

```js
const result = useMemo(() => 2 + 2, []);
```

更糟的是：

```js
const styles = useMemo(() => ({ color: 'red' }), []);
```

没必要。即使不记忆化也足够快。你只是用 CPU 检查了一下“什么都没变”。

### 那么什么时候应该用记忆化？

- 当**计算非常耗时**时
- 当该值会**作为 prop 传递给 `React.memo()` 的子组件**时
- 当**依赖项很少变化**时

除此之外，不用太担心。

---

## 说说 React 的空闲行为

有个很棒的事实：**React 不会因为时间流逝就渲染。**

React 的设计就是**休眠**，直到有意义的事情发生。你可以这样理解：

```ts
while (true) {
  if (somethingChanged) {
    reactRender();
  }
  // 否则，什么都不做
}
```

这里的“something”可以是用户输入、定时器回调、网络响应等。但它**总是被外部事件触发**。

所以，如果你的应用处于空闲状态，没有 state 或 props 变化——*React 完全不会做任何事*。这就是高效的设计。

---

## 内联样式 vs. `useMemo` 样式

### 内联样式（每次渲染都会新建对象）

```tsx
<button style={{ color: 'red', backgroundColor: theme.bg }}>Click</button>
```

这样写没问题，但每次渲染 React 都会看到一个**新的对象**。如果这个按钮包在 `React.memo()` 里，会导致记忆化失效。

### 函数返回样式（每次渲染依然新建对象）

```ts
const style = () => ({ color: 'red' });
```

同样的问题——`style()` 每次都返回新对象。

### ✅ 最佳实践：`useMemo` 样式

```ts
const style = useMemo(() => ({ color: 'red' }), []);
```

只有依赖项变化时才会重新计算——这样对象引用始终一致。

> 但再次强调：只有在你把样式传递给子组件或渲染大量列表时才这样做。对于单个按钮？没必要记忆化。

---

## 浅比较：轻量，但不是免费的

每次 `useMemo` 或 `React.memo` 执行时，React 都会比较依赖数组或 props 的值。

```ts
const areSame = prev.a === next.a; // 浅比较
```

对于原始类型（`number`、`string` 等）来说，这很快。但对于数组或对象，只要引用变了，就会被视为不同——即使内容相同。

### 示例

```ts
const list1 = [1, 2, 3];
const list2 = [1, 2, 3];
list1 === list2; // false
```

所以用数组或对象做记忆化时，*需要小心管理引用*。

---

## 总结：React 的思维模型

想要真正掌握 React，就要像 React 那样思考：

- **事件驱动**，而不是帧驱动
- **只有 state/props/context 变化时才更新**
- **浅比较**很快，但不是零成本
- **记忆化是工具，不是万能药**
- 不要过早优化——在记忆化前先做性能测量

你的组件不需要“聪明”，只要它是可预测的。

剩下的，交给 React 就好。