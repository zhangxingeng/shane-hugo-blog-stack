---
title: Svelte how does it work
date: 2025-03-20
draft: true
---

## File Structure

```bash
.svelte-kit/ # generated content no edit
src/ # all source code here
    app.* # entry files include `app.css`, `app.html`, `app.d.ts` etc
    routes/ # file based routing
        +page.svelte # contains page content (mix of html and js)
        +layout.svelte # not sure what this is for yet
        +page.server.js # pure server side code
        +page.js # client side code (ran on server once for initial html render, then client side for interactivity)
    lib/ # reusable code (components, utils, etc) represented by `$lib` when imported
... # all other config files
```

The center of attention is the files start with a `+` sign.

## To Make a Page Alive

- Firstly is the user enters the page for the first time
- Upon entering the page, the `+page.svelte` along with `+page.js/ts` file is rendered **Once** on the server to send to user for the first time (static html)
- After the client side got the html, another js file would be sent to client side also to make the page interactive (hydrate)
- the `+page.server.js/ts` file is only executed on the server side when called for
- There are lifecycle hooks you can define

## How to make a page alive

- Firstly is the user enters the page for the first time
- Upon entering the page, the `+page.svelte` file is rendered on the server to send to user for the first time
- Then the client side code `+page.js` is executed to make the page interactive

## Lifecycle Hooks (for client side rendering to reduce server load)

Svelte lifecycle hooks (`onMount`, `beforeUpdate`, `afterUpdate`, `onDestroy`) can **only** be used in:

- `.svelte` files (like `+page.svelte` or any Svelte component)
- Client-side code in `.js`/`.ts` files (but not server-side portions)

They **cannot** be used in:

- `+page.server.js` (these run exclusively on the server)
- Server-side code in any file

This is because lifecycle hooks are tied to the component lifecycle in the browser DOM, which doesn't exist on the server.

