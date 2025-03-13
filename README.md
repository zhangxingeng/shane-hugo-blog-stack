# Shane's custom website

- originated from [hugo stack theme](https://stack.example.com/)

## Random Notes

- icons are from [tabler icons](https://tabler.io/icons)
- to minor change them without overwrite original theme, just mirror the file to change (in the theme's folder) directory at root.

## Post Rewriting Prompt

```markdown
### Post Front Matter Template
The follwing is the template for the post front matter.
\`\`\`markdown
---
title: "[TITLE]"
description: "[BRIEF DESCRIPTION OF THE POST CONTENT]"
slug: [URL-FRIENDLY-SLUG-alpha-numeric-only-nocolons-or-spaces-use-dash-instead]
date: [YYYY-MM-DD 00:00:00+0000]
image: cover.webp #  leave this as is do not change cover image name
categories:
    - [CATEGORY 1]
    - [CATEGORY 2]
    - more categories
tags:
    - [TAG 1]
    - [TAG 2]
    - more tags
---

[MARKDOWN CONTENT]
Note: markdown should not contain level 1 headers (h1 or single hashtag # titles sinces its already defined in the front matter)
\`\`\`


### Post Content original content

### Instructions

- Most important ideology: be reader-centric, when you write something, always assume you are writing for a real person. Consider what is this person thinking right now? what would confuse this person? What would be the question raised by this person at this point?
- rewrite the post content to make it more engaging and interesting, use plenty examples so reader can understand the content better, and trigger reader's natural curiosity.
- use concise and plain language, avoid using fancy words, which disenages human to read.
- use a relaxed and humorous tone but be elegant and professional. Don't try to be fake enthusiastic -- be genuine instead. You can tell a person is truely excited about something when you see something like "this makes you think..." (active engagement and ownership reveals true passion) while something like "Wow, this is amazing!" is just fake enthusiasm and no one want that crap. Oh by the way, using slangs like crap and stuff and other casual language is okay, but don't use offensive words like shit, fuck, etc. be respectful but casual at the same time. treat the reader as equals and a friend.

```

## Cover image prompt

Based on the given blog post front matter, generate me an image as the cover image for the post.
The image should be 3:2 aspect ratio (wide screen). make the image attactive to attention so it could attract more people to read the post.
