# ashmi.design

Personal portfolio site, built as static HTML/CSS/JS. No build step, no framework, just open a file and edit it, then push.

## File structure

```
.
├── index.html              # Homepage (hero, work grid, leadership, personal, about, contact)
├── AshmiR_Resume.pdf        # Linked from the contact card
├── assets/
│   ├── styles.css          # Shared design system: colors, fonts, layout, every component style
│   ├── script.js            # Shared behavior: theme toggle, sound engine, nav, animations
│   ├── img/                 # All images and video poster frames
│   └── video/                # All video files
└── projects/
    ├── nhance.html          # Case study: NHanCE Autonomous Vehicle Research
    └── agentic-ai.html       # Case study: Agentic Maintenance Platform
```

## Adding a new project case study page

1. Copy `projects/nhance.html` to `projects/your-project-name.html`.
2. Update the `<title>`, the hero tag/title/subtitle, and the `cs-meta` row (Role, Timeline, Tools, Team).
3. Replace the Overview, Process, and Outcome section content with your project's real content.
4. Swap the two theme-persistence + sound-popup blocks at the top, those are already correct if copied from `nhance.html`, no changes needed there.
5. On `index.html`, find that project's card in the work grid and update its `<a class="case-study-link" href="projects/your-project-name.html">` to point to the new file.

## Design system reference (in `assets/styles.css`)

- **Fonts**: Fraunces (headlines), Manrope (body/UI), IBM Plex Mono (tags/labels/eyebrows)
- **Colors**: `--accent` (pink) is the primary brand color; `--c1` through `--c4` are the four project-identity colors (indigo, rose, amber, teal); all defined in `:root` and overridden in `[data-theme="dark"]`
- **Dark mode**: persists across pages via `localStorage`, see the inline script at the top of `<body>` in every HTML file
- **Sound**: fully synthesized with Web Audio (no sound files), lives in `script.js`; muted by default, the person has to opt in via the sound toggle

## Photo/video placeholders

Any section still showing a dashed box with an icon and label is a placeholder. Replace the `<div class="photo-placeholder">...</div>` with a real `<img>` or `<video>` tag pointing to a file in `assets/img/` or `assets/video/`, matching the pattern already used elsewhere on the same page.

## Local preview

No server required, just open `index.html` directly in a browser. All paths are relative, so the folder structure has to stay intact (don't move files out of `assets/` or `projects/`).
