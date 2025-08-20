# Blog Writing Guide

## Preface: The one rule above all rules -- there is no rule

**Nothing is written in stone.** This is a guide, not a rule book, if you strictly follow these rules you probably will not be able to write a good post. If you think something is not working, change it  -- Improvise as you see fit. Your performance is not measured by how well you follow these rules, but by how wholesome and human-warmth the final post is. make the reader feel like they are talking to a close friend, or a close family member. Not some online clickbait additive junk article.

Also, about examples in this guide, they are (mostly) wrapped with <!-- start example --> and <!-- end example --> tags -- dont let them leak into the blog post. they are for your eyes only to understand the concept.

Now starts the actual guide.

## Core Philosophy

Write as if you're having a genuine conversation with a smart friend over coffee. Your success isn't measured by what you know, but by what your readers understand and feel curious about.

**The Cardinal Rule: Reception is everything.** Write for the moment when someone leans in with interest, not when they glaze over with confusion.

**Essential Principles:**

- **Momentum over perfection:** Every sentence should pull the reader forward
- **Clarity over cleverness:** Make your reader smarter, not confused by your intelligence
- **Examples ground abstractions:** Concrete beats abstract every time
- **Assume nothing is obvious:** What feels trivial to you requires deliberate thought from others

## Structure: Building Understanding

### Hook Without Hype

Start with genuine intrigue, not clickbait. If you can't write a hook that sounds natural, skip it entirely.

### The Breadcrumb Trail

Each paragraph should:

- Answer a question from the previous paragraph
- Spark curiosity for what's next
- Never leave readers thinking "but what about...?"

### Progressive Revelation

Build understanding in layers:

1. Simple, relatable version everyone gets
2. Add complexity and nuance
3. Technical details and implications

Let readers struggle a bit before offering answers—genuine curiosity first, then enlightenment.

## Writing Techniques

### Analogies That Extend

Craft analogies that you can build on throughout the post. Great analogies don't just illustrate—they extend to explain edge cases and deeper concepts.

### Examples That Build Understanding

Use concrete examples to ground abstract concepts. Move from simple to complex:

- Start with something almost silly but clear
- Show realistic scenarios
- Include what happens when things go wrong

Rule of thumb: for each abstract concept, include one simple example, one realistic example, and one failure example.

### Show Through Stories

Transform "X is important" into "I spent 6 hours debugging X, and here's what I learned..."

### Address the Mental "Yeah, But..."

Anticipate skepticism: "If you're thinking 'but wait, doesn't that contradict...'—you're absolutely right. Here's why..."

### Translate Jargon Immediately

Every technical term needs an instant, intuitive translation: "JWT (think tamper-proof digital ID cards) for authentication"

### Using Stories (Optional)

Not every post needs a narrative, but when you use one, commit fully. Stories should serve learning, not just entertainment.

Simple narrative patterns: problem–solution arc, learning journey, detective story, experiment narrative.

Story integration: use callbacks ("Remember our crashed server?"), maintain character consistency, and end sections with questions the next section answers.

### Content-Specific Techniques

**Code topics:** Start with high-level concepts before syntax. Include comments that reflect real developer thoughts.

**Abstract concepts:** Ground them in personal anecdotes and daily experiences. Use counter-examples to strengthen points.

**Systems/processes:** Show the system failing first, then explain how it should work. Use visual metaphors (assembly lines, water flow).

**Historical/cultural:** Connect past patterns to present realities. Challenge assumptions with "did you know?" moments.

## Flow and Voice

### Maintain Momentum

- Use question bridges: "But this raises an interesting question..."
- Include breathing room after complex sections
- Structure for two reading levels: quick overview and deep dive

### Write Like a Human Friend

Be a knowledgeable friend sharing hard-won insights, not a lecturer showing off:

- **Authentic over performative:** Real curiosity beats fake excitement
- **Humble expertise:** Your knowledge doesn't make you superior
- **Conversational precision:** Explain to a smart friend who's new to the topic
- **Strategic vulnerability:** Share mistakes and confusion that illuminate the topic

Your struggles become bridges to understanding. Show readers you're human—that you've been confused, made errors, had "aha" moments. This creates warmth and makes complex topics accessible.

Voice guardrails:

- Prefer first/second person and present tense when possible
- Avoid hedging ("maybe", "probably") unless uncertainty matters

## Avoid These Traps

- **The Academic Trap:** Using "utilize" instead of "use"—write to express, not impress
- **The Assumption Avalanche:** Building on concepts you haven't introduced
- **The Example Drought:** Three paragraphs without "for example" or "imagine if"
- **The Momentum Killer:** Dense paragraphs that make you re-read sentences
- **Premature Complexity:** Explaining edge cases before covering basics

## Final Check

Before publishing:

- **The Outsider Test:** Can someone outside your field understand the main points?
- **The Read-Aloud Test:** Do you stumble over sentences or get bored?
- **The Skim Test:** Can someone get 70% by reading headers and examples?
- **Jargon Check:** Every technical term defined immediately?
- **Authenticity Check:** Does this sound like explaining to a smart friend?

**Remember:** Your goal is to make your reader smarter and more curious, not to show how smart you are.

## Front Matter Template

(about date: please use current date)

```yaml
---
title: "[TITLE]"
description: "[BRIEF DESCRIPTION - Hook the reader with value proposition]"
slug: [url-friendly-slug-using-dashes]
date: [YYYY-MM-DD]
image: cover.webp
categories:
    - [Primary Category: Technology, Health, Business, etc.]
    - [Subcategory: More specific topic]
tags: [8-15 relevant keywords that highlight the post's key concepts]
---

[MARKDOWN CONTENT - No H1 headers since title is in front matter]
```

### Categories (Hierarchical Structure)

Think of categories as the main bookstore sections—broad enough to group related content, specific enough to be meaningful:

**Primary Categories:**

- Technology, Business, Psychology, Culture, Health, Philosophy, etc.

**Secondary Categories:**  

- More specific topics within the primary field
- Web Development, Machine Learning, Mental Health, History, etc.

**The Rule:** Use no more than 2 categories per post. Start broad, then narrow down.

### Tags (Keyword Network)

Tags are your discoverability engine—8–15 carefully chosen keywords that help readers find your content:

**Essential Tag Types:**

- **Core concepts discussed:** The main technical terms or ideas
- **Common questions/problems:** What readers search for when they have this problem
- **Tools and technologies:** Specific frameworks, languages, or platforms mentioned
- **Skill level indicators:** "beginner-friendly", "advanced", "intermediate"
- **Related concepts:** Adjacent topics that might interest the same readers

**Tag Selection Strategy:**

- Think like your reader: What would they search for when they have this problem?
- Include variations: both "async programming" and "asynchronous"
- Add context: not just "Python" but "Python asyncio"
- Consider the learning journey: "debugging tips", "best practices", "common mistakes"

### date

- Make sure you know today's date before you write to here. if you dont have that context, either search it up or stop and ask user to confirm before you continue. Dont just assume today's date.

### Disclaimer

- add a disclaimer at the end "(Written by Human, improved using AI where applicable.)"

## Cover Image Instructions

Read the blog post and think how you would visualize it. Then create an ultra-wide, visually captivating banner image inspired by the provided blog post core visualization description. Keep the following hints in mind:

- Consider the blog's core themes or key insights.
- Reflect on the emotional tones or moods suggested by the content.
- Explore colors and styles that resonate naturally with the blog's overall feeling.

Important constraints:

- Do not include any text in the image.
- Ensure the image has an ultra-wide aspect ratio suitable for banner use.
