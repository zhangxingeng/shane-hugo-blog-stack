---
title: "AI Assisted Coding With Better Experience and Quality -- A Two-Level System"
description: "A practical two-level approach to working with AI coding assistants on complex codebases, while maintaining code quality and managing context windows effectively"
slug: ai-assistant-chat-management-system
date: 2025-08-03
image: cover.webp
categories:
    - Technology
    - Software Development
tags:
    - AI assistant
    - Cursor
    - coding workflow
    - context management
    - developer productivity
    - AI pair programming
    - code quality
    - chat history
    - technical workflow
    - programming methodology
    - AI tools
    - software engineering
    - development process
    - coding best practices
    - AI coding
---

## A Quick Disclaimer

This post was written by a human, then minor tweaked by AI to ensure you can understand my messy writing. 🤷

**Notice:** This approach is **specifically** for AI-**assisted** coding — where you maintain control over the code and AI accelerates your work. This isn't about "vibe coding" where you describe what you want and let AI handle everything. Everything here is tailored for maintaining control over complex codebases, including code style and architecture decisions, not for rapid prototyping.

If you can't fully understand the code your AI assistant generates, this system probably won't help you much.

## Let's Go

Let me share how I've evolved my approach to working with AI coding assistants like Cursor. This isn't some universal truth, but rather a system I've developed through months of trial and error to get consistently better results.

## The Problem I Used to Have

I started out doing what most people probably do—describe my problem, hit enter, and expect the AI to magically figure everything out. This approach feels natural, but I discovered it's actually working against how these tools are designed.

Here's what I learned: companies like Cursor need to manage compute costs (which is actually good for users too), so they implement search and grep functions that only grab partial snippets of your code files. The AI might see a few relevant lines, but it completely misses the bigger picture of your coding patterns and style.

This creates a frustrating quality decay—the assistant makes decisions based on incomplete information, like trying to understand a novel by reading random paragraphs. You might catch the general plot, but you'll miss the narrative flow and character development that makes everything coherent.

The result? The AI generates code that might work, but doesn't fit your codebase's patterns or style.

## My First Breakthrough: Force Reading Whole Files

My solution was to create custom MCPs (Model Context Protocols) that read entire files instead of just code snippets. Through prompt engineering, I force the assistant to use my tools rather than Cursor's built-in search functions.

But here's the crucial trade-off: **reading whole files devours your context window**.

Think of it like the difference between having a quick phone call versus having someone's entire diary available. The diary gives you infinitely better context, but you can only fit so much in your working memory before your brain starts to fog.

I learned to be ruthlessly strategic here. I only provide truly essential files for full reading, while letting the assistant use search functions on less critical code. This balance gives you the code quality of full context without completely burning through your available tokens.

## The Chat Length Paradox

The second major issue: conversation length destroys performance. I used to chat back and forth until Cursor would essentially say "hey, maybe start fresh for better results."

When I naively started new chats, I'd get crisp, immediate responses (shorter context helps), but I'd lose all the valuable project context I'd painstakingly built up over hours of conversation.

This created a sad paradox: language models get confused by long conversations, but they also need that conversation history to understand what you're actually trying to accomplish. It's like talking to someone who either:

- Remembers everything but gets overwhelmed by information overload, or
- Has a crystal-clear head but zero memory of what you discussed five minutes ago

My first simple fix was keeping my personal coding preferences in a sticky note app (not actual paper!) and pasting them when needed. But the real breakthrough came with what I call my "Two-Level System."

## My Two-Level System (Because It Has Two Levels)

The setup is simple: you have a codebase and a clear task in mind—whether it's a new feature, bug fix, or refactor.

### Level 1: The Planning Phase (Your Foundation Conversation)

This is where you build your "golden" conversation that becomes your source of truth.

**Step 1: Set the Foundation**  
I start by telling the assistant the task, then provide essential files with brief descriptions of how they fit the bigger picture. Take your time here—the quality of this file selection directly determines the quality of everything that follows. This prompt gets reused repeatedly, so it's worth the investment.

Force the agent to read these files completely. Then ask it to discover relevant code files (not everything it can find) and help create a detailed plan. Crucially: this isn't about implementation—it's about understanding scope and approach. I explicitly tell the agent: "Don't edit anything, just read and understand."

**Step 2: Iterative Refinement**  
In separate temporary chats, I work with the assistant to refine this plan. I'll say something like: "Let's refine this plan together—give me your proposal, I'll tell you what's wrong, and ask me clarifying questions."

We iterate until the assistant stops asking meaningful questions. When the questions become trivial, that's my signal to stop.

**Step 3: Create Your Master Plan**  
Once the agent is aligned with my intentions, I ask it to generate a detailed markdown file. My success criteria: "Imagine a new engineer takes this document and nothing else. If they can quickly pick up the task, understand the codebase, and start working exactly as intended, then this is a good plan."

**Step 4: Return to Base**  
Now I go back to my original conversation (the one I spent time on) and give it this refined plan. I ask the agent to explore the codebase based on this plan's relevance.

Congratulations! You now have Level 1 ready. As we say in China: "万事具备，只欠东风" (Everything is ready except the east wind—feel free to ask ChatGPT about this story, it explains it better than I could).

### Level 2: The Implementation Phase

Now comes the actual coding. With your solid Level 1 foundation, the agent understands your project deeply. You can either tell it exactly what to do next, or ask it to generate the next task plan (yes, I'm stingy with tokens—every one counts!), copy that plan, and paste it into a new implementation chat.

**Key Principles for Level 2:**

**Work Iteratively and Set Boundaries**  
Always mention that you want to work iteratively and specify how much the agent should do before stopping. I typically request that it edit one file at a time and ask for confirmation before proceeding. This helps me catch misalignments quickly before they cascade into garbage code.

**Use Clear Pronouns**  
Always use "the user" to refer to yourself instead of "I"—it prevents confusion about whether "I" refers to you or the agent.

**Strategic Code Cleanup (Advanced)**  
When I know my codebase well, I ask the assistant to delete old code while implementing new features, even if it temporarily breaks other parts. This prevents code residue from accumulating. If you prefer maintaining backward compatibility, that works too—just make sure to properly mark deprecated functions in docstrings, otherwise the agent won't know to avoid using them.

## The Magic of Context Recycling

Here's where my system becomes really powerful: instead of letting chat history grow infinitely, I cycle back to that golden Level 1 conversation for each new implementation step.

Here's exactly how it works:

When I finish one implementation step (tasks naturally split into multiple steps—one file per step works well if you have a well-structured codebase), I don't continue in that same chat. Instead, **I return to the golden Level 1 conversation and say: "I've completed step one, here are the updated files. Now help me with step two."**

Think of it like having a master conversation that maintains all your project context, with focused work sessions branching off from it. Each work session stays short and sharp, but they all share the same rich foundational understanding.

This is why I call it a "Two-Level System". Level 1 provides the long-term project memory, while Level 2 handles short-term implementation focus.

## When to Update Your Master Plan

There comes a point (typically after 2-3 implementation steps) where your changes become so significant that the original plan needs updating. When this happens, I ask the assistant to revise the markdown file based on recent code changes, removing completed tasks completely ("with no residue left" for example — it helps keeping the plan from getting confusing).

Once the plan is revised, you can return to that Level 1 conversation and re-send the same message. Since files are referenced (not hard-embedded), your chat will automatically work with your updated codebase and plan. The beauty is that Level 1 doesn't even know the previous steps existed—it's working with fresh context.

## The Complete Workflow

The cycle is beautifully simple:

1. **Build a plan** → Use that plan to build your Level 1 chat
2. **Implement in Level 2** → Work on focused implementation steps  
3. **Return to Level 1** → Update with completed work and get next steps
4. **Repeat** → Until your feature/fix/refactor is complete

## Why This System Actually Works

This approach maintains exactly two levels of conversational depth: overall project understanding (Level 1) and specific implementation focus (Level 2).

I never let individual implementation chats grow too long, and I never lose the big picture context. It's like having a conversation with someone who has both perfect project memory and the ability to focus intensely on immediate tasks—without the cognitive overload that usually comes with trying to do both simultaneously.

The result? Consistently higher code quality, fewer misalignments, and way less frustration with AI coding assistants.
