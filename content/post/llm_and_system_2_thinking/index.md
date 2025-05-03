---
title: "Why JEPA Might Just Be the Missing 'System 2' in AI"
description: "A casual yet insightful exploration into JEPA, system 1 vs. system 2 thinking, and how AI might finally learn to stop hallucinating."
slug: why-jepa-might-just-be-the-missing-system-2-in-ai
date: 2025-05-03 00:00:00+0000
image: cover.webp
categories:
    - Artificial Intelligence
    - Psychology
    - Technology
tags:
    - JEPA
    - System 1 vs System 2
    - AI Models
    - Yann LeCun
    - LLM
---

You ever notice how your brain sometimes takes shortcuts? For example, if I asked you how long it takes for Earth to orbit the Sun, you might reflexively say, "One day!"—and then immediately realize, "Wait, that's wrong. One year, obviously!" You're not alone; even smart people do this.

That's because our brain is split into two types of thinking: **System 1 and System 2**. System 1 is fast, automatic, and intuitive. It's great for quick answers but terrible for careful reasoning. System 2, on the other hand, is slower, more deliberate, and logical. It's the voice in your head that catches System 1’s silly mistakes.

This little psychological insight isn't just interesting trivia. It's surprisingly similar to a big problem in AI right now—specifically Large Language Models (LLMs) like GPT-4. Let's dig into this analogy a bit, and I promise, no fancy jargon, just plain English and maybe a few laughs along the way.

### First, What’s the Problem with LLMs?

LLMs are great at quickly producing fluent, human-like text. They're your go-to buddy for brainstorming, casual chats, or writing silly poems. But they have a glaring weakness: they're really confident even when they're wrong. That's the AI equivalent of confidently saying "one day" instead of "one year."

Think of LLMs as System 1 thinking on steroids: fast, associative, and often jumping to conclusions without checking the facts. They hallucinate because they’re just pattern-matchers, not careful reasoners.

### Enter Yann LeCun and JEPA

Recently, while exploring a fascinating paper called V-JEPA from Meta AI and Yann LeCun, I stumbled onto something big. JEPA (Joint Embedding Predictive Architecture) is trying to build AI systems that don't just react instinctively—they actually reason about the world abstractly, much like System 2 thinking in humans.

So, here's how I came to understand it:

Imagine you're in a crowded room. System 1 (or current LLMs) might memorize every face and pixel, which is pretty useless. After all, you don't usually remember exact faces in a random crowd. You remember that the room was full of people—maybe lively, maybe dull—but certainly not pixel-perfect images of each individual.

JEPA models don't reconstruct exact details; instead, they learn abstract features. In human terms, JEPA is trying to remember the "gist" or the "idea" of the scene, not the irrelevant specifics. It's building what we'd call wisdom—an abstract, general knowledge about how the world typically works, not just rote memorization of past scenes.

### But Wait, How Does JEPA Do This Magic?

Good question! When I first read this, my own System 2 kicked in: "Wait, how exactly does this 'wisdom' thing happen? Is there some black magic?" Actually, it’s more like clever engineering than magic.

Here's the trick in simple terms:

* **Context Encoder**: This sees part of the video (or scene), but some parts are deliberately hidden (masked).
* **Predictor**: Based on the partial view, it tries to guess (predict) what’s hidden—not in pixel detail, but in a summarized, conceptual form.
* **Target Encoder**: This is where it gets interesting. This encoder sees the whole picture but doesn't update as quickly—it’s a slow, steady, and stable memory of past knowledge, like the wise old mentor in a movie who doesn't get rattled by every little detail.

During training, the Predictor tries to match the stable wisdom from the Target Encoder. Over time, this encourages JEPA to internalize general patterns, creating something very much like System 2 thinking.

### The Eureka Moment

This connection hit me pretty hard. Most AI systems today—like those memory-augmented chatbots or tool-using LLMs—are really just patching up System 1’s flaws. They're like sticking band-aids on a leaky pipe. Handy, sure, but the leaks still happen.

JEPA feels fundamentally different. It's genuinely trying to simulate that deeper, abstract reasoning—creating something we could rightly call AI wisdom.

### Why JEPA Matters

Here's why that's a big deal: if an AI truly has a stable internal understanding of the world, it won't confidently hallucinate wrong answers. Instead, it might pause, think (simulate internally), and say: "Wait, that doesn't make sense based on what I’ve learned."

We humans do that all the time—well, at least when our System 2 bothers to kick in (coffee helps). AI systems need this too if we want them to move beyond clever parrots to genuinely thoughtful partners.

### So What's Next?

We're at the beginning of this exciting shift. JEPA and its approach of abstract, latent modeling could become the foundation for a new generation of AI—one that thinks slower but smarter, offering us insights, not just fluent text.

Maybe the future is not just bigger and flashier language models but wiser, slower-thinking ones.

And hey, next time someone asks you how long Earth takes to orbit the Sun, take a deep breath, channel your inner JEPA, and confidently say: "A year—obviously!"

Happy thinking!

### Sources

* The earth and sun analogy is from Veritasium's video [Veritasium: What Everyone Gets Wrong About AI and Learning](https://www.youtube.com/watch?v=0xS68sl2D70)
* The JEPA paper is [Revisiting Feature Prediction for Learning Visual Representations from Video](https://arxiv.org/abs/2404.08471)
