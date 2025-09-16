# Hugo Website Editing Prompt

## Goals and Principles

- **Maintainability**: Keep the code clear, DRY, and aligned with SOLID principles.
- **Styling approach**: Prefer Tailwind utility classes. Minimize custom CSS to reduce bloat and improve cross-device compatibility and dark mode support.
- **Internationalization**: Treat the site as multilingual (English and Mandarin Chinese). Avoid hardcoded strings that should be translatable.
- **Accessibility and SEO**: Use semantic HTML, proper landmarks, alt text, and sensible metadata.
- **Performance**: Favor lightweight components, optimized images, and minimal blocking resources.

## Repository Map (What lives where)

- **config/_default/**: Hugo configuration and site parameters.
  - `config.toml`: Core Hugo site settings.
  - `languages.toml`: Multilingual configuration.
  - `markup.toml`: Markdown/rendering settings.
  - `menu.toml`: Site menus.
  - `params.toml`: Custom `.Site.Params` used across templates; prefer reading from here instead of hardcoding constants.
  - `permalinks.toml`, `related.toml`: URL structures and related content settings.

- **assets/**: Source assets processed by Hugo Pipes and build tooling.
  - `css/`: Custom styles. Keep minimal; prefer Tailwind classes.
  - `ts/`: TypeScript or client-side scripts.
  - `img/`, `media/`, `icons/`: Images and media. Optimize sizes and use responsive practices.
  - `favicon.svg`, `jsconfig.json`: Supporting assets/config.
  - Related root configs: `tailwind.config.js`, `postcss.config.js`, and `hugo_stats.json` (used by Tailwind for class scanning/purging).

- **layouts/**: The heart of the theme and page structure.
  - `baseof.html`: Global base template.
  - `_default/`: Generic templates such as `list.html` and `single.html`.
  - `partials/`: Shared, reusable template fragments. Prefer partials to avoid duplication.
  - `shortcodes/`: Custom content shortcodes.
  - Top-level pages like `index.html`, `resume.html`, `404.html`, and RSS templates.

- **content/**: Markdown content with front matter.
  - Common sections: `categories/`, `page/`, `post/`, `series/`.
  - Keep front matter consistent with templates and `.Site.Params`.

- **data/**: Structured data for templates.
  - `external.yaml`: Manifest for external scripts or integrations.
  - `en/resume.json`, `zh-cn/resume.json`: Data for the resume page.

- **i18n/**: Translation files. Add keys here when introducing new user-facing strings.

- **static/**: Files served as-is at the site root.
  - Includes `static/prompts/` (this document) and other public assets.

- **scripts/**: Python utilities for content generation/translation. Not required for routine site edits.

- **Other notable files**:
  - `netlify.toml`: Deployment configuration (if applicable).
  - `package.json`, `pnpm-lock.yaml`: Frontend dependencies.
  - `resources/`, `public/`: Generated artifacts. Do not hand-edit.
  - `README.md`: Additional project notes.

## Conventions and Best Practices

- **Use Tailwind first**: Prefer utility classes over writing new CSS. When CSS is necessary, scope it and keep it small.
- **Template composition**: Decompose repeated markup into `layouts/partials/`. Leverage `block` and `define` within `baseof.html` for page sections.
- **Parameters over literals**: Read from `.Site.Params` (configured in `config/_default/params.toml`) or front matter instead of hardcoding values.
- **Internationalization**: Wrap user-facing strings in translation functions and add keys under `i18n/`.
- **Accessibility**: Ensure proper landmarks, labels, and color contrast. Support keyboard navigation.
- **Performance**: Lazy-load images where appropriate, keep DOM simple, and avoid excessive client-side JS.
- **Naming and structure**: Choose clear, descriptive names. Keep functions and partials focused and small.

## How to Approach a Change

1. **Understand the task**: Read [TASK_CONTEXT_PUT_HERE] and identify which page types (home, list, single, etc.) and partials are involved.
2. **Locate relevant files**: Start from `layouts/` (templates/partials/shortcodes) and `config/_default/params.toml`. Check `content/` front matter for data used by templates.
3. **Read before editing**: Open full files to see the surrounding structure. Avoid making isolated edits that fight existing conventions.
4. **Plan the minimal, coherent edit**: Prefer adding or adjusting partials and parameters to keep templates DRY.
5. **Styling**: Implement appearance changes with Tailwind utilities. Only add CSS in `assets/css/` when utilities are insufficient.
6. **i18n and params**: Add any new strings to `i18n/` and new knobs to `params.toml` rather than hardcoding.
7. **Validate incrementally**: Make small, reversible edits. The user runs the live Hugo server; do not run Hugo commands yourself.
8. **Debugging**: You may log to the browser console from scripts in `assets/ts/`. If needed, ask the user to paste console output back for debugging.

## Guardrails

- **Do not hand-edit generated directories**: `public/` and `resources/` are outputs.
- **Avoid broad refactors** unless necessary to meet the task; prefer incremental, well-contained changes.
- **Be cautious removing files** like `data/external.yaml` or custom CSS; confirm they are truly unused.
- **Keep this document generic**: Do not insert task-specific instructions here—only in [TASK_CONTEXT_PUT_HERE].

Use this as a quick-start map and a checklist for quality while making targeted, minimal edits aligned with the site’s structure and conventions.

## The Task

[TASK_CONTEXT_PUT_HERE]
