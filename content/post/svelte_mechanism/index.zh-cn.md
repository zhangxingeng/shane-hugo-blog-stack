---
title: Svelte 是如何工作的
date: 2025-03-20
draft: true
---

## 文件结构

```bash
.svelte-kit/ # 生成的内容，无需编辑
src/ # 所有源代码都在这里
    app.* # 入口文件，包括 `app.css`、`app.html`、`app.d.ts` 等
    routes/ # 基于文件的路由
        +page.svelte # 包含页面内容（HTML 和 JS 混合）
        +layout.svelte # 目前还不确定用途
        +page.server.js # 纯服务端代码
        +page.js # 客户端代码（首次 HTML 渲染时在服务端运行一次，之后在客户端运行以实现交互）
    lib/ # 可复用代码（组件、工具函数等），引入时用 `$lib` 表示
... # 其他所有配置文件
```

重点关注以 `+` 开头的文件。

## 让页面“活”起来

- 首先，用户首次进入页面
- 进入页面时，`+page.svelte` 以及 `+page.js/ts` 文件会在服务器端渲染**一次**，生成静态 HTML 并发送给用户
- 客户端收到 HTML 后，还会接收另一份 JS 文件，用于让页面变得可交互（hydrate）
- `+page.server.js/ts` 文件只会在服务端被调用和执行
- 你可以定义生命周期钩子

## 如何让页面“活”起来

- 首先，用户首次进入页面
- 进入页面时，`+page.svelte` 文件会在服务器端渲染，首次发送给用户
- 然后客户端代码 `+page.js` 会被执行，让页面变得可交互

## 生命周期钩子（用于客户端渲染，减少服务器负载）

Svelte 的生命周期钩子（`onMount`、`beforeUpdate`、`afterUpdate`、`onDestroy`）**只能**用于：

- `.svelte` 文件（如 `+page.svelte` 或任何 Svelte 组件）
- `.js`/`.ts` 文件中的客户端代码（但不能用于服务端部分）

**不能**用于：

- `+page.server.js`（这些文件只在服务器端运行）
- 任何文件中的服务端代码

这是因为生命周期钩子与浏览器 DOM 中的组件生命周期相关联，而服务端并不存在 DOM。