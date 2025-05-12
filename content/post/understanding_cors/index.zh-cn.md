---
title: "理解 CORS：开发者从困惑到清晰的旅程"
description: "通过一位真实开发者的视角，揭秘跨域资源共享（CORS）——它实际保护了什么，以及为什么重要"
slug: understanding-cors-developers-journey
date: 2025-04-11 00:00:00+0000
image: cover.webp
categories:
    - Web开发
    - 安全
    - 前端
tags:
    - CORS
    - JavaScript
    - SvelteKit
    - FastAPI
    - Web安全
---

## CORS 的困惑

和许多开发者一样，我在浏览器控制台里看到令人头疼的 CORS 错误的次数，已经多得让我不好意思承认了：

```console
Access to fetch at 'http://localhost:8000/api/data' from origin 'http://localhost:3000' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header...
```

同样地，我也做过“只要能跑就行”的操作：添加通配符来源、安装 CORS 中间件，或者随意设置头部，而并没有真正理解为什么要这么做。最近，在用 SvelteKit 做前端、FastAPI 做后端搭建全栈应用时，我决定真正弄明白 CORS 到底是什么，为什么要有它。

接下来，我经历了一段从完全误解到豁然开朗的过程，现在想和你分享我的收获。

## 我最初（完全错误的）理解

我第一次遇到 CORS 时，对它的理解完全错了。我以为它是服务器之间的一种认证机制。我脑补的工作方式大概是这样的：

> “假设你是服务器，我是客户端。当我从你那里获取数据时，你会给我一个签名。当我收到数据时，我就知道这些数据是来自经过验证的来源。然后当我把数据发回去时，也只会发给那个来源而不是其他人。这样就不会有恶意的数据劫持了。”

**❌ 错误理解：** 我把 CORS 想象成了一种数据签名系统，用来让服务器之间相互验证身份。

这个思路看起来似乎有点道理——我以为 CORS 是用来保护服务器不被恶意客户端攻击的。

但其实完全不是这么回事。

## “啊哈！”时刻

当我开始深入研究时，我第一个意识到的是：CORS 完全是由浏览器强制执行的。它和服务器之间的通信根本没关系。

**❌ 错误理解：** 我最初以为 CORS 是某种服务器之间的安全协议。

其实它更像是一种“预检”或握手。在我的 SvelteKit 前端想要和 FastAPI 后端通信之前，浏览器会先问后端：“这个 SvelteKit 应用可以和你通信吗？”如果后端说不行，浏览器就会在请求发出前直接拦截。

但这又引出了另一个问题：如果它只是浏览器强制的，那别人改一下浏览器不就能绕过了吗？（剧透：确实可以——这也揭示了 CORS 实际保护的对象。）

## CORS 到底在保护谁？

这才是我最大的误区。

**❌ 错误理解：** 我以为 CORS 是在保护我的服务器不被恶意客户端攻击。

实际上？CORS 真正在保护的是用户，防止他们被恶意网站攻击。这完全颠覆了我对它用途的理解。

举个具体例子：

假设你登录了你的 Chase 银行账户。现在你和 chase.com 有一个已认证的会话。之后你访问了 malicious-site.com，这个网站可能包含如下代码：

```javascript
fetch('https://api.chase.com/account/transfer', {
  method: 'POST',
  credentials: 'include', // 携带你的 Chase Cookie
  body: JSON.stringify({
    amount: 10000,
    toAccount: 'hacker-account-number'
  })
})
```

如果没有 CORS，这段代码就能利用你的认证会话转账！但由于有 CORS，浏览器会先问 chase.com：“malicious-site.com 有权限向你发请求吗？”chase.com 会说“绝对不行”，浏览器就会拦截这个请求。

这就是所谓的跨站请求伪造（CSRF）攻击，而 CORS 有助于防止它发生。

## 架构上的困惑

在我的全栈应用架构中，我还有另一个困惑：

**❌ 错误理解：** “SvelteKit 也有后端，如果 CORS 是给浏览器用的，那我是不是应该在 SvelteKit 的后端配置 CORS？我以为浏览器会请求 SvelteKit 的后端，然后 SvelteKit 再去请求 FastAPI。”

关键在于理解实际的请求流程：

1. 用户访问我的 SvelteKit 应用
2. SvelteKit 服务器渲染初始的 HTML/JS/CSS
3. 浏览器运行我的前端 JavaScript
4. 这些 JavaScript 直接向 FastAPI 后端发起 API 请求
5. FastAPI 后端处理并响应这些请求

浏览器并不是先请求 SvelteKit，然后 SvelteKit 再转发给 FastAPI。而是 SvelteKit 应用加载到浏览器后，浏览器直接请求 FastAPI。这就是为什么我需要在 FastAPI 上配置 CORS——告诉浏览器允许我的 SvelteKit 前端与它通信。

## 什么时候需要配置 CORS？

根据我的经验，以下情况需要配置 CORS：

1. **在你的 API 服务器上（比如我的 FastAPI）**：允许来自你的前端域名的请求
2. **在服务端渲染的前端框架（如 SvelteKit）上，如果它也作为 API 使用**：如果其他站点需要请求你的 SvelteKit 服务器端点

在本地开发环境下，我这样在 FastAPI 上配置 CORS：

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 我的 SvelteKit 开发服务器
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

生产环境下：

```python
origins = [
    "https://my-production-site.com",
    "https://www.my-production-site.com",
]
```

## 常见的 CORS 误区

在我的学习过程中，我发现了几个常见误区，希望能帮你少走弯路：

**❌ 我曾经的错误理解：**

1. **CORS 是某种签名或认证系统** —— 不是。它只是浏览器的安全策略。
2. **CORS 保护服务器免受攻击** —— 错。它保护的是用户，防止恶意网站攻击。
3. **CORS 适用于服务器之间的通信** —— 不对。它只在浏览器中生效。
4. **我需要为数据库连接配置 CORS** —— 完全错误。CORS 和后端到数据库的通信毫无关系。

**✅ 正确理解：**

1. **CORS 不是认证或授权机制** —— 它不会验证你是谁，也不会决定你能做什么
2. **CORS 不能保护你的服务器免受直接攻击** —— 它只是阻止浏览器发起某些请求
3. **CORS 不适用于服务器之间的通信** —— 你的后端可以直接请求其他 API，不会有 CORS 问题
4. **CORS 与数据库连接无关** —— 你的 FastAPI 后端连接 PostgreSQL 跟 CORS 没有任何关系

## 最后的思考

理解了 CORS，不仅帮我解决了眼前的问题，还让我对 Web 安全有了更深刻的认识。Web 平台已经发展出了许多我们习以为常的安全措施——有时我们会觉得它们很烦，但其实它们在默默保护着我们。

如果你也在为 CORS 苦恼，请记住：它的存在是为了保护用户不被恶意网站冒充。它并不是故意让你的开发变得困难（虽然有时候确实让人抓狂）。

你是否也曾经对 Web 概念有过类似的误解？欢迎在评论区分享你的“啊哈！”时刻。