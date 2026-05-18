# Swim Instructor Retreat 2026 — Per-attendee landing pages + post-event feedback hub

## What this is
A small site for the 2026 Swim Instructor Retreat. Two pieces:
1. A directory (`linktree.html`) plus one personalized linktree-style landing page per attendee — each page shows the attendee's name, business, photo, and their personal links (Instagram, website, email).
2. A post-event feedback flow: a form page (`post.html`), a JSON store of responses (`answers.json`), and a viewer that renders the responses (`answers.html`).

All pages share an underwater theme: animated bubbles, ripple effects, faint caustics overlay, "DM Sans" type, blue/yellow palette.

## Architecture
Plain HTML + embedded CSS/JS per page. No build, no framework. JSON file is read by the feedback viewer on the client side.

Key files:
- `linktree.html` — index/directory page listing all retreat instructors.
- `abigail.html`, `angela.html`, `becca.html`, `chelsea.html`, `danielle.html`, `david.html`, `guillermo.html`, `jacob.html`, `josie_howdyshell.html`, `josie_seppala.html`, `kaz.html`, `larry.html`, `megan.html`, `natalie.html`, `nicole.html`, `reed.html`, `sarah.html`, `sean.html`, `shalene.html`, `sofiia.html` — one personalized linktree-style landing page per attendee. Each is a near-clone of the same template with name, business name, "Mentor · Retreat 2026" tag, avatar from `photos/<name>.png|jpg`, and 1-3 link buttons (Instagram / website / email).
- `post.html` — post-retreat feedback survey form.
- `answers.json` — array of submitted responses (collected via a separate backend/n8n hook; field set covers heard_via, promotion, value, most_valuable, ticket_value, transportation, food, valuable_session, future_topics, connected, schedule, recommend, interests, anything_else, etc.).
- `answers.html` — client-side viewer that reads `answers.json` and renders submissions.
- `photos/` — avatar images for each attendee, named after their HTML page (`abigail.png`, etc.), plus some original-named files (`Becca .png`, `Josie Seppela.png`, `Larry Jack of Sports - Larry Tobin.jpg`, etc.).

## Conventions
- Design tokens: `--blue: #2b3a8e`, `--blue-light: #4158D0`, `--blue-sky: #5ba3d9`, `--blue-pool: #7ec8e3`, `--yellow: #FFD700`, `--dark: #1a2a5e`. Personalized pages add `--accent: #4158D0`, `--accent2: #C850C0` for the avatar gradient ring.
- Type: DM Sans (primary), Nunito (linktree only).
- Shared visual layer per page: `#water-canvas`, `.caustics`, `.bubbles-container` with `.bubble` rise animation, `.ripple` on tap.
- Mobile-first narrow column (`max-width: 460px` on personal pages, 720px on viewer).
- All link cards use glassmorphism (`backdrop-filter: blur(12px)`).

## Open threads
(none clear — retreat already ran; feedback page accepting responses)

## Changelog
## 2026-05-17 — PROJECT.md seeded
Initial seed from existing folder state.
