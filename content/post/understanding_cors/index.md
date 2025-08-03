---
title: "Understanding CORS: A Developer's Journey from Confusion to Clarity"
description: "Demystifying Cross-Origin Resource Sharing (CORS) through a real developer's perspective - what it actually protects and why it matters"
slug: understanding-cors-developers-journey
date: 2025-04-11
image: cover.webp
categories:
    - Web Development
    - Security
    - Frontend
tags:
    - CORS
    - JavaScript
    - SvelteKit
    - FastAPI
    - Web Security
---

## The CORS Confusion

Like many developers, I've found myself staring at the dreaded CORS error in my browser console more times than I'd like to admit:

```console
Access to fetch at 'http://localhost:8000/api/data' from origin 'http://localhost:3000' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header...
```

And like many developers, I've done the "just make it work" dance: adding wildcard origins, installing CORS middleware, or setting headers without fully understanding why. Recently, while building a full-stack application with SvelteKit on the frontend and FastAPI on the backend, I decided it was time to actually understand what CORS is and why it exists.

What followed was a journey from complete misunderstanding to clarity that I'd like to share with you.

## My Initial (Completely Wrong) Understanding

When I first encountered CORS, I had a completely incorrect understanding of what it was. I thought of it as some kind of authentication mechanism between servers. I imagined it working something like this:

> "So let's say you're the server, and I'm the client. When I get data from you, it will also send me a signature. And when I receive the data, I see this data is from this verified source. So when I send data back, I should send it back to that source and nobody else. This way, there's no malicious data hijacking."

**❌ WRONG IDEA:** I was thinking of CORS as a data signature system that somehow verified the authenticity of servers to each other.

This mental model made a certain kind of sense to me - I was thinking of CORS as a way to protect the server from malicious clients.

But I was completely off track.

## The "Aha!" Moment

As I started digging deeper, I had my first realization: CORS is entirely browser-enforced. It's not about server-to-server communication at all.

**❌ WRONG IDEA:** I initially thought CORS was some kind of server-to-server security protocol.

It's more like a pre-flight check or handshake. Before my SvelteKit frontend can talk to my FastAPI backend, the browser first asks the backend, "Is this SvelteKit application allowed to communicate with you?" If the backend says no, the browser blocks the request before it even happens.

But this led to another question: if it's purely browser-enforced, couldn't someone just modify their browser to bypass it? (Spoiler: yes, they could - which reveals an important insight about what CORS is actually protecting.)

## Who Is CORS Actually Protecting?

This is where I had my biggest misconception.

**❌ WRONG IDEA:** I thought CORS was protecting my server from malicious clients.

The reality? CORS is actually protecting users from malicious websites. This completely flipped my understanding of its purpose.

Let's use a concrete example:

Imagine you log into your Chase Bank account. Now you have an authenticated session with chase.com. Later, you visit malicious-site.com, which might contain code like:

```javascript
fetch('https://api.chase.com/account/transfer', {
  method: 'POST',
  credentials: 'include', // Include your Chase cookies
  body: JSON.stringify({
    amount: 10000,
    toAccount: 'hacker-account-number'
  })
})
```

Without CORS, this code could transfer money using your authenticated session! But because of CORS, the browser checks with chase.com first: "Hey, does malicious-site.com have permission to make requests to you?" Chase.com says "Absolutely not," and the browser blocks the request.

This is called a cross-site request forgery (CSRF) attack, and CORS helps prevent it.

## The Architecture Confusion

In my full-stack application setup, I had another source of confusion:

**❌ WRONG IDEA:** "SvelteKit already has a backend, so if CORS is for the browser, shouldn't I configure CORS on SvelkeKit's backend instead of FastAPI? I thought the browser would request to the backend of SvelteKit, and then SvelteKit would request to the FastAPI."

The key insight was understanding the actual request flow:

1. User visits my SvelteKit app
2. SvelteKit server renders the initial HTML/JS/CSS
3. The browser runs my frontend JavaScript
4. That JavaScript makes direct API calls to my FastAPI backend
5. The FastAPI backend processes and responds to those requests

The browser doesn't request from SvelteKit, which then relays to FastAPI. Instead, once the SvelteKit app is loaded in the browser, the browser makes direct requests to FastAPI. That's why I needed to configure CORS on FastAPI - to tell browsers it's OK for my SvelteKit frontend to talk to it.

## When Do You Need to Configure CORS?

Based on my experience, here's when you need to configure CORS:

1. **On your API server (FastAPI in my case)**: Allow requests from your frontend domains
2. **On server-rendered frontend frameworks (like SvelteKit) IF they also serve as APIs**: If other sites need to make requests to your SvelteKit server endpoints

For my local development setup, I configured CORS on FastAPI like this:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # My SvelteKit dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

And for production:

```python
origins = [
    "https://my-production-site.com",
    "https://www.my-production-site.com",
]
```

## Common CORS Misconceptions

Through my journey, I've identified several misconceptions that might help others avoid the confusion I experienced:

**❌ WRONG IDEAS I HAD:**

1. **CORS is some kind of signature or authentication system** - It's not. It's a browser security policy.
2. **CORS protects servers from attacks** - Nope. It protects users from malicious sites.
3. **CORS applies to server-to-server communication** - Wrong. It's purely browser-enforced.
4. **I need to configure CORS for my database connections** - Completely incorrect. CORS has nothing to do with backend-to-database communication.

**✅ CORRECT UNDERSTANDING:**

1. **CORS is not authentication or authorization** - It doesn't verify who you are or what you can do
2. **CORS doesn't protect your server from direct attacks** - It only stops browsers from making certain requests
3. **CORS doesn't apply to server-to-server communication** - Your backend can still make requests to another API without CORS issues
4. **CORS doesn't apply to your database connections** - Your FastAPI backend connecting to PostgreSQL has nothing to do with CORS

## Final Thoughts

Understanding CORS has not only fixed my immediate issues but has given me a much deeper appreciation for web security. The web platform has evolved with numerous safeguards that we often take for granted - or curse when they get in our way.

If you're struggling with CORS, remember that it's there to protect users from malicious websites trying to act on their behalf. It's not trying to make your life difficult (even though it sometimes feels that way).

Have you had similar misunderstandings about web concepts? I'd love to hear about your "aha!" moments in the comments below.
