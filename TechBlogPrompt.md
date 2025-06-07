# Blog Post Rewriting Prompt

## Front Matter Template

```yaml
---
title: "[TITLE]"
description: "[BRIEF DESCRIPTION - Hook the reader with value proposition]"
slug: [url-friendly-slug-using-dashes]
date: [ISO 8601 format: YYYY-MM-DDTHH:MM:SS+00:00 or just YYYY-MM-DD]
image: cover.webp
categories:
    - [Primary Category: Technology, Health, Business, etc.]
    - [Subcategory: More specific topic]
tags: [5-20 relevant keywords that highlight the post's key concepts]
---

[MARKDOWN CONTENT - No H1 headers since title is in front matter]
```

## Rewriting Guidelines

### Core Philosophy

Write for a real person sitting across from you. What would confuse them? What questions would they ask? What would make them lean in with interest?

### Structure & Flow

1. **Hook with relatability** - Start with a moment readers recognize ("You know that feeling when...")
2. **Show the problem vividly** - Use specific examples, error messages, or scenarios
3. **Journey through discovery** - Take readers along your investigation, including wrong turns
4. **Build understanding progressively** - Introduce concepts as needed, not all at once
5. **Payoff with clarity** - The solution should feel earned and obvious in hindsight

### Writing Techniques

**Dont Start with Code**
If the concept is complex and requires code examples, make sure you start with a good analogy that explains the concept before you even consider writing code. No one likes to read code unless they have the context.

**Use analogies that stick:**

- Compare technical concepts to everyday experiences
- "Python reads your file like a book - top to bottom"
- "It's like trying to use a gift card for a store that hasn't opened yet"

**Make it personal without being self-indulgent:**

- Share genuine struggles and "aha" moments
- Include thoughts like "My first thought was..." or "After hours of debugging..."
- Show vulnerability - readers connect with human experience

**Anticipate reader reactions:**

- "But wait, you might be thinking..."
- "You might wonder why this matters..."
- Address the skeptical voice in their head

**Code examples that teach:**

- Start simple, build complexity
- Add comments that reflect actual developer thoughts
- Show both what doesn't work AND why

### Tone Guidelines

- **Genuine over enthusiastic** - "Here's where things get interesting" beats "This is AMAZING!"
- **Humble expertise** - You learned something hard; help others learn it easier
- **Conversational but clear** - Write like you're explaining to a smart friend
- **Humor that serves the content** - Jokes should reinforce understanding, not distract

### Technical Writing Tips

- **System 1 vs System 2**: You (expert) see it as easy because it's automatic. Readers need to think hard about each step. Bridge that gap.
- **Progressive disclosure**: Don't front-load all technical details. Introduce concepts right before they're needed.
- **The "why should I care?"**: Always connect technical details to real impact

### Engagement Patterns

- Use frameworks readers know (like "Five Stages of Debugging")
- Create memorable section headers that tell a story
- End with reflection + community engagement ("What's your experience with...?")
- Include a "one last thought" that reframes the entire topic

### Categories & Tags Strategy

**Categories (hierarchical):**

- Primary: Broad field (Technology, Business, Health, etc.)
- Secondary: Specific area (Web Development, Python, Testing, etc.)

**Tags (15-20 keywords):**

- Technical terms from the post
- Problem/solution indicators
- Tools and libraries mentioned
- Skill level indicators
- Related concepts readers might search

### Date Formatting

Use current date/time in any standard format:

- Full ISO: `2024-03-14T10:30:00+00:00`
- Simple: `2024-03-14`
- With timezone: `2024-03-14T10:30:00-05:00`

## Cover Image Prompt Template

"Create a wide banner image for a blog post about [TOPIC]. The image should:

- Visually represent [CORE CONCEPT] without using text
- Use [EMOTION/MOOD] color palette and style
- Be eye-catching enough to stop scrolling
- Work well as a social media preview"

## Quality Checklist

- [ ] Would a tired developer at 3 PM find this helpful and engaging?
- [ ] Does each section earn the reader's continued attention?
- [ ] Are complex concepts introduced with simple analogies first?
- [ ] Is the personality genuine rather than performative?
- [ ] Does the conclusion provide both closure and inspiration?
