# Nils Digital Organic Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 5-page static website (`Nils/website/`) that serves as the SEO front door + warm-up + routing layer for Nils Digital's two existing VSL funnels (Marketing + Automation), with a Pagefind-powered blog feed.

**Architecture:** Static HTML/CSS/JS, no build step. Shared CSS files linked from each page. Pagefind generates a static search index. BabyLoveGrowth publishes blog posts into `/blog/posts/` and a thin post-process script injects per-post inline CTAs based on each post's primary tag. Hosted on GitHub Pages alongside the rest of `Websites/`.

**Tech Stack:** HTML5, CSS3 (custom properties for tokens, no preprocessor), vanilla JS (IntersectionObserver for scroll animations, Pagefind embed for search), Google Fonts (Google Sans, DM Sans, Instrument Sans, Instrument Serif), Pagefind 1.x CLI (one-shot index build), Node.js (only for the BabyLoveGrowth post-process script).

**Spec:** `Nils/docs/superpowers/specs/2026-05-24-organic-website-design.md`

**Critical build rule:** Every section on every page must be produced as **2-4 visual or copy variations** for Emilio to pick from. Variations are stacked in a single preview file under `Nils/website/_drafts/<page>-<section>.html`. After the user picks, the chosen variation is consolidated into the production page file and the draft can be archived. This rule is non-negotiable. See `feedback_section_variations.md` memory.

---

## Resolved decisions (Task 0 — confirmed 2026-05-24)

1. **Custom domain: `nilsdigital.com` is already pointed at GitHub Pages.** Use `https://nilsdigital.com/Nils/website/` as the canonical base URL for all `<link rel="canonical">`, OpenGraph URLs, and `sitemap.xml` entries. (Note: confirm whether the site is served at `/Nils/website/` or at the root `/` of `nilsdigital.com` before Task 28 — if the domain points only at the Nils subfolder it may serve at root, in which case paths in the sitemap and `head-meta.html` `<link>` URLs simplify to `/`. Verify with one curl during launch.)

2. **Existing top-level pages (`Nils/team.html`, `Nils/nils-proof.html`, `Nils/urgency.html`, `Nils/presentation.html`, `Nils/nextchapter.html`): migrate content, leave originals alone.** Use their content as source material for the new About + Proof pages. Do NOT delete or modify the originals — they may be linked from GHL or external surfaces. If a copy block from any of them is migrated verbatim, note it inline in the new page with an HTML comment for future reference.

3. **No contact form, no calendar embed on the website.** Calendar bookings happen inside the VSL funnels (each funnel ends with its own calendar booking step). The Contact page becomes a minimal routing page only: a hero (eyebrow / H1 / H2) + the dual route halves component pointing back to the two VSLs, with a small `mailto:emilio@nilsdigital.com` footer for "other questions." No form to maintain, no separate calendar widget. **Task 27 is simplified accordingly** — see Task 27 below for the revised variation set.

4. **Microsoft Clarity: skip at launch.** Do not register a Clarity project or add the tracking snippet on initial launch. The stub in `assets/partials/head-meta.html` stays commented out. **Task 29 is deferred** — moved to "Post-launch (out of scope)" at the bottom of this plan. Revisit when Emilio has a Clarity ID to wire in.

---

## File Structure

```
Nils/website/
├── index.html                       # Home
├── about.html                       # About
├── proof.html                       # Proof / case studies
├── contact.html                     # Contact
├── blog/
│   ├── index.html                   # Blog feed (search + tag filters)
│   ├── _template.html               # Post template (used by post-process script)
│   └── posts/                       # BabyLoveGrowth publishes individual posts here
├── assets/
│   ├── css/
│   │   ├── tokens.css               # Color, type, spacing custom properties
│   │   ├── globals.css              # Reset, body, html, container, typography
│   │   ├── nav.css                  # Top nav + mobile menu
│   │   ├── footer.css               # Site footer
│   │   ├── components.css           # Buttons, cards, eyebrows, route halves, hero patterns
│   │   ├── home.css                 # Home-specific
│   │   ├── about.css                # About-specific
│   │   ├── proof.css                # Proof-specific
│   │   ├── blog.css                 # Blog index + post template
│   │   └── contact.css              # Contact-specific
│   ├── js/
│   │   ├── nav.js                   # Mobile nav toggle
│   │   ├── search.js                # Pagefind UI init (blog index only)
│   │   └── animations.js            # IntersectionObserver scroll reveal
│   ├── img/                         # Logos, photos, OG images, decorative SVGs
│   └── partials/
│       ├── nav.html                 # Reusable nav markup (copied into each page)
│       ├── footer.html              # Reusable footer markup (copied into each page)
│       └── head-meta.html           # Reusable <head> meta + font links
├── _drafts/                         # Variation preview files (gitignored after launch)
├── pagefind/                        # Generated by `npx pagefind` (gitignored)
├── scripts/
│   ├── build-search.sh              # Runs Pagefind to regenerate search index
│   └── inject-post-cta.mjs          # BabyLoveGrowth post-process: wraps post + injects CTA by tag
├── robots.txt
├── sitemap.xml
└── README.md                        # Local dev + publish instructions
```

**File responsibility split:**
- Tokens isolated in one file (`tokens.css`) so brand updates are one-touch
- Per-page CSS files prevent the home page paying the weight of about/proof/blog styles
- Partials are HTML snippets copied into each page (not server-side includes, since there's no server). The README explains the copy-paste rule.
- Scripts are tiny + standalone (Bash for Pagefind, Node ESM for BabyLoveGrowth post-process)

---

## Phase 0: Resolve open questions

These four questions from the spec must be answered before some later tasks. Get answers from Emilio at the start.

### Task 0: Resolve spec open questions with Emilio

**Files:** None (conversation only)

- [ ] **Step 1:** Ask Emilio the four open questions from the spec:
  1. **Custom domain:** Is `nilsdigital.com` already pointed at GitHub Pages, or does the site launch under `demilio24.github.io/Websites/Nils/website/`? Affects sitemap URLs, OG image URLs, and canonical tags.
  2. **Existing pages:** Keep `Nils/team.html`, `Nils/nils-proof.html`, `Nils/urgency.html`, `Nils/presentation.html`, `Nils/nextchapter.html` as they are, or migrate the content into the new About/Proof and deprecate the originals? Recommendation: migrate content, leave originals alone (they may be linked from GHL).
  3. **Contact form backend:** If we add a contact form (separate from the calendar), where do submissions go? Email forward via Formspree? GHL contact upsert via webhook? Just a `mailto:`?
  4. **Microsoft Clarity ID:** Need a new Clarity project ID for this site. Register one at `clarity.microsoft.com` and add the ID to `~/.claude/projects/.../memory/reference_clarity_tracking_ids.md`.

- [ ] **Step 2:** Record the answers in this file as a new section "## Resolved decisions" at the very top of this plan, so all subsequent tasks reference these resolved values.

- [ ] **Step 3:** Commit the updated plan.

```bash
git add Nils/docs/superpowers/plans/2026-05-24-organic-website.md
git commit -m "Nils website plan: resolve domain/Clarity/contact/migration open questions"
```

---

## Phase 1: Foundation (scaffold + tokens + shared components)

### Task 1: Scaffold the `Nils/website/` folder structure

**Files:**
- Create: `Nils/website/` and all subdirectories above
- Create: `Nils/website/.gitignore` (ignores `pagefind/` and `_drafts/` once launched)
- Create: `Nils/website/README.md`

- [ ] **Step 1:** Create the folder tree exactly as shown in the File Structure section above. Use empty `.gitkeep` files in `_drafts/`, `pagefind/`, `assets/img/`, `blog/posts/` so the directories survive in git.

- [ ] **Step 2:** Create `Nils/website/.gitignore`:

```gitignore
# Pagefind generates its index here; rebuild locally with scripts/build-search.sh
pagefind/

# Variation drafts are kept for review during the build phase, then archived.
# After launch, uncomment to ignore them entirely:
# _drafts/
```

- [ ] **Step 3:** Create `Nils/website/README.md`:

````markdown
# Nils Digital — Organic Website

Static HTML site, no build step. Hosted on GitHub Pages.

## Local dev

Serve the folder with any static server:

```bash
cd Nils/website
python -m http.server 8000
# or
npx http-server -p 8000
```

Then open `http://localhost:8000/`.

## Updating the blog search index

After adding or updating blog posts:

```bash
cd Nils/website
./scripts/build-search.sh
```

This regenerates `pagefind/` from the static HTML. Commit the contents of `blog/posts/` and re-deploy; the user's browser fetches `pagefind/` at runtime.

## Section variations

During the build phase, every section of every page exists as 2-4 variations in `_drafts/<page>-<section>.html`. Emilio picks one, then the chosen variation is consolidated into the production page file. See `feedback_section_variations.md` in the agent memory for the rule.

## Publishing a blog post (BabyLoveGrowth flow)

BabyLoveGrowth writes a raw post HTML to `blog/posts/<slug>.html`. The post-process script wraps it with site chrome and injects the CTA based on the post's primary tag:

```bash
node scripts/inject-post-cta.mjs blog/posts/<slug>.html
```

Re-run `scripts/build-search.sh` to refresh the Pagefind index.
````

- [ ] **Step 4:** Commit.

```bash
git add Nils/website/
git commit -m "Nils website: scaffold folder structure, .gitignore, README"
```

---

### Task 2: Design tokens (`assets/css/tokens.css`)

**Files:**
- Create: `Nils/website/assets/css/tokens.css`

- [ ] **Step 1:** Create `Nils/website/assets/css/tokens.css` with the exact tokens from the spec:

```css
/* ─────────────────────────────────────────────────────────
   Nils Digital — Design Tokens
   Source of truth for color, typography, spacing, motion.
   Every CSS file consuming a value must reference a token,
   not a literal. No hardcoded px sizes or hex values in
   page CSS, ever.
   ───────────────────────────────────────────────────────── */

:root {
  /* COLOR — Foundational */
  --bg:               #ffffff;
  --ink:              #0a0a0a;
  --ink-soft:         rgba(0, 0, 0, 0.6);
  --ink-mute:         rgba(0, 0, 0, 0.4);
  --ink-line:         rgba(0, 0, 0, 0.1);
  --ink-line-soft:    rgba(0, 0, 0, 0.06);

  /* COLOR — Marketing (blue, from Marketing VSL) */
  --marketing:        #046bd2;
  --marketing-dark:   #0358b0;
  --marketing-rgb:    4, 107, 210;

  /* COLOR — Automation (green, from Automation VSL) */
  --automation:       #0fbf7a;
  --automation-dark:  #087a4d;
  --automation-rgb:   15, 191, 122;

  /* TYPOGRAPHY — Families */
  --font-serif:       'Instrument Serif', Georgia, serif;
  --font-display:     'Instrument Sans', system-ui, sans-serif;
  --font-body:        'Google Sans', 'DM Sans', system-ui, sans-serif;

  /* TYPOGRAPHY — Sizes (fluid clamp pattern) */
  --fs-h1:            clamp(32px, 5vw, 56px);
  --fs-h2:            clamp(24px, 3.5vw, 40px);
  --fs-h3:            clamp(20px, 2.5vw, 28px);
  --fs-body:          16px;
  --fs-body-lg:       18px;
  --fs-meta:          13px;
  --fs-eyebrow:       11px;

  /* TYPOGRAPHY — Weights */
  --fw-serif-regular: 400;
  --fw-display-medium: 500;
  --fw-display-bold: 600;
  --fw-body-regular: 400;
  --fw-body-medium: 500;
  --fw-body-bold: 700;

  /* TYPOGRAPHY — Line heights */
  --lh-tight:         1.05;
  --lh-snug:          1.25;
  --lh-normal:        1.5;
  --lh-relaxed:       1.65;

  /* SPACING — 8pt scale */
  --space-1:          4px;
  --space-2:          8px;
  --space-3:          12px;
  --space-4:          16px;
  --space-5:          24px;
  --space-6:          32px;
  --space-7:          48px;
  --space-8:          64px;
  --space-9:          96px;
  --space-10:         128px;

  /* LAYOUT */
  --container-max:    1200px;
  --container-narrow: 760px;
  --radius-sm:        4px;
  --radius-md:        8px;
  --radius-lg:        12px;
  --radius-pill:      100px;

  /* MOTION */
  --ease-out:         cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast:         150ms;
  --dur-base:         300ms;
  --dur-slow:         600ms;

  /* SHADOW */
  --shadow-card:      0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-card-hover: 0 8px 24px rgba(0, 0, 0, 0.07);
  --shadow-nav:       0 1px 0 var(--ink-line-soft);
}
```

- [ ] **Step 2:** Commit.

```bash
git add Nils/website/assets/css/tokens.css
git commit -m "Nils website: design tokens (color, type, spacing, motion)"
```

---

### Task 3: Globals + reset (`assets/css/globals.css`)

**Files:**
- Create: `Nils/website/assets/css/globals.css`

- [ ] **Step 1:** Create `Nils/website/assets/css/globals.css`:

```css
/* Modern minimal reset */
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: var(--fs-body);
  font-weight: var(--fw-body-regular);
  line-height: var(--lh-normal);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
img, svg, video { max-width: 100%; height: auto; display: block; }
a { color: inherit; text-decoration: none; }
button { font: inherit; cursor: pointer; }

/* Container */
.container {
  max-width: var(--container-max);
  margin: 0 auto;
  padding-left: var(--space-5);
  padding-right: var(--space-5);
}
.container-narrow {
  max-width: var(--container-narrow);
  margin: 0 auto;
  padding-left: var(--space-5);
  padding-right: var(--space-5);
}

/* Typography defaults */
h1, h2, h3, h4 { font-family: var(--font-serif); font-weight: var(--fw-serif-regular); line-height: var(--lh-tight); letter-spacing: -0.02em; margin: 0; color: var(--ink); }
h1 { font-size: var(--fs-h1); }
h2 { font-size: var(--fs-h2); }
h3 { font-size: var(--fs-h3); }

/* Editorial em accent (color-encoded per offer) */
h1 em, h2 em { font-style: italic; }
.accent-marketing  { color: var(--marketing); }
.accent-automation { color: var(--automation); }

p { margin: 0 0 var(--space-4); line-height: var(--lh-relaxed); }
p.lead { font-size: var(--fs-body-lg); color: var(--ink-soft); }

/* Eyebrow (avatar callout pill) */
.eyebrow {
  display: inline-block;
  font-family: var(--font-display);
  font-size: var(--fs-eyebrow);
  font-weight: var(--fw-display-bold);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 5px 14px;
  border-radius: var(--radius-pill);
  background: rgba(var(--marketing-rgb), 0.05);
  border: 1px solid rgba(var(--marketing-rgb), 0.3);
  color: var(--marketing);
  margin-bottom: var(--space-4);
}

/* Scroll-reveal hook (paired with animations.js) */
.anim { opacity: 0; transform: translateY(20px); transition: opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out); }
.anim.visible { opacity: 1; transform: translateY(0); }
.anim.d1 { transition-delay: 100ms; }
.anim.d2 { transition-delay: 200ms; }
.anim.d3 { transition-delay: 300ms; }
.anim.d4 { transition-delay: 400ms; }

/* Section spacing */
section { padding-top: var(--space-8); padding-bottom: var(--space-8); }
@media (max-width: 768px) {
  section { padding-top: var(--space-7); padding-bottom: var(--space-7); }
}
```

- [ ] **Step 2:** Commit.

```bash
git add Nils/website/assets/css/globals.css
git commit -m "Nils website: globals.css (reset, container, typography, eyebrow, anim)"
```

---

### Task 4: Shared nav partial + CSS (`assets/partials/nav.html`, `assets/css/nav.css`, `assets/js/nav.js`)

**Files:**
- Create: `Nils/website/assets/partials/nav.html`
- Create: `Nils/website/assets/css/nav.css`
- Create: `Nils/website/assets/js/nav.js`

- [ ] **Step 1:** Create `assets/partials/nav.html` (copy-paste into each page's body top):

```html
<header class="site-nav">
  <div class="container nav-inner">
    <a class="brand" href="/">Nils</a>
    <button class="nav-toggle" aria-label="Open menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    <nav class="nav-links">
      <a href="/about.html">About</a>
      <a href="/proof.html">Proof</a>
      <a href="/blog/">Blog</a>
      <a href="/contact.html">Contact</a>
    </nav>
  </div>
</header>
```

- [ ] **Step 2:** Create `assets/css/nav.css`:

```css
.site-nav { position: sticky; top: 0; z-index: 50; background: var(--bg); border-bottom: 1px solid var(--ink-line-soft); }
.nav-inner { display: flex; align-items: center; justify-content: space-between; padding-top: var(--space-3); padding-bottom: var(--space-3); }
.brand { font-family: var(--font-display); font-size: 20px; font-weight: var(--fw-display-bold); color: var(--ink); letter-spacing: -0.01em; }
.nav-links { display: flex; gap: var(--space-5); font-family: var(--font-body); font-size: var(--fs-meta); font-weight: var(--fw-body-medium); color: var(--ink-soft); }
.nav-links a { transition: color var(--dur-fast); }
.nav-links a:hover { color: var(--ink); }

.nav-toggle { display: none; background: none; border: 0; padding: 8px; gap: 4px; flex-direction: column; }
.nav-toggle span { display: block; width: 22px; height: 2px; background: var(--ink); border-radius: 1px; transition: transform var(--dur-fast); }

@media (max-width: 720px) {
  .nav-toggle { display: flex; }
  .nav-links { display: none; position: absolute; top: 100%; left: 0; right: 0; flex-direction: column; padding: var(--space-4) var(--space-5); background: var(--bg); border-bottom: 1px solid var(--ink-line); }
  .nav-links.open { display: flex; }
}
```

- [ ] **Step 3:** Create `assets/js/nav.js`:

```js
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
});
```

- [ ] **Step 4:** Commit.

```bash
git add Nils/website/assets/partials/nav.html Nils/website/assets/css/nav.css Nils/website/assets/js/nav.js
git commit -m "Nils website: site nav (sticky, mobile toggle, brand wordmark)"
```

---

### Task 5: Shared footer partial + CSS (`assets/partials/footer.html`, `assets/css/footer.css`)

**Files:**
- Create: `Nils/website/assets/partials/footer.html`
- Create: `Nils/website/assets/css/footer.css`

- [ ] **Step 1:** Create `assets/partials/footer.html`:

```html
<footer class="site-footer">
  <div class="container footer-inner">
    <div class="footer-brand">
      <a class="brand" href="/">Nils</a>
      <p class="footer-tagline">Growth + systems for $1M+ local service businesses.</p>
    </div>
    <nav class="footer-nav">
      <div class="footer-col">
        <h6>Explore</h6>
        <a href="/about.html">About</a>
        <a href="/proof.html">Proof</a>
        <a href="/blog/">Blog</a>
        <a href="/contact.html">Contact</a>
      </div>
      <div class="footer-col">
        <h6>Get started</h6>
        <a href="/Nils/funnel/vsl.html">Marketing system</a>
        <a href="/Nils/funnel/automation-vsl-funnel-direct.html">Automation audit</a>
      </div>
    </nav>
  </div>
  <div class="container footer-meta">
    <span>&copy; <span id="footer-year"></span> Nils Digital</span>
  </div>
  <script>document.getElementById('footer-year').textContent = new Date().getFullYear();</script>
</footer>
```

- [ ] **Step 2:** Create `assets/css/footer.css`:

```css
.site-footer { background: var(--bg); border-top: 1px solid var(--ink-line-soft); padding: var(--space-7) 0 var(--space-5); margin-top: var(--space-9); }
.footer-inner { display: grid; grid-template-columns: 1fr 2fr; gap: var(--space-6); }
.footer-brand .brand { font-family: var(--font-display); font-size: 20px; font-weight: var(--fw-display-bold); color: var(--ink); }
.footer-tagline { color: var(--ink-soft); font-size: var(--fs-meta); margin-top: var(--space-3); }
.footer-nav { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); }
.footer-col h6 { font-family: var(--font-display); font-size: var(--fs-eyebrow); font-weight: var(--fw-display-bold); letter-spacing: 0.15em; text-transform: uppercase; color: var(--ink-mute); margin: 0 0 var(--space-3); }
.footer-col a { display: block; color: var(--ink-soft); font-size: var(--fs-meta); padding: var(--space-2) 0; transition: color var(--dur-fast); }
.footer-col a:hover { color: var(--ink); }
.footer-meta { margin-top: var(--space-6); padding-top: var(--space-4); border-top: 1px solid var(--ink-line-soft); color: var(--ink-mute); font-size: var(--fs-eyebrow); font-family: var(--font-display); letter-spacing: 0.1em; text-transform: uppercase; }
@media (max-width: 720px) { .footer-inner { grid-template-columns: 1fr; } }
```

- [ ] **Step 3:** Commit.

```bash
git add Nils/website/assets/partials/footer.html Nils/website/assets/css/footer.css
git commit -m "Nils website: site footer (brand + nav columns + copyright)"
```

---

### Task 6: Reusable components CSS (`assets/css/components.css`)

**Files:**
- Create: `Nils/website/assets/css/components.css`

Covers: buttons, route halves (the Netflix-style dual cards), generic cards, kicker pills, hero hero-pattern background.

- [ ] **Step 1:** Create `assets/css/components.css`:

```css
/* ─── BUTTONS ─── */
.btn { display: inline-flex; align-items: center; gap: var(--space-2); font-family: var(--font-display); font-weight: var(--fw-display-bold); font-size: var(--fs-meta); padding: var(--space-3) var(--space-5); border-radius: var(--radius-pill); border: 1px solid transparent; transition: transform var(--dur-fast), box-shadow var(--dur-fast); cursor: pointer; }
.btn:hover { transform: translateY(-1px); }
.btn-marketing  { background: var(--marketing);  color: white; }
.btn-automation { background: var(--automation); color: white; }
.btn-ghost      { background: transparent; color: var(--ink); border-color: var(--ink-line); }
.btn-ghost:hover { background: var(--ink); color: white; }

/* ─── DOT-GRID BACKGROUND (Marketing VSL signature) ─── */
.bg-dotgrid { position: relative; overflow: hidden; }
.bg-dotgrid::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(var(--marketing-rgb), 0.1) 1px, transparent 1px);
  background-size: 18px 18px;
  opacity: 0.6;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 75%);
  pointer-events: none;
  z-index: 0;
}
.bg-dotgrid > * { position: relative; z-index: 1; }

/* ─── ROUTE HALVES (Netflix-style dual hero) ─── */
.route-halves { display: grid; grid-template-columns: 1fr 1fr; }
.route-half { padding: var(--space-7) var(--space-5); text-align: center; color: white; position: relative; overflow: hidden; min-height: 280px; display: flex; flex-direction: column; justify-content: center; transition: filter var(--dur-base); cursor: pointer; }
.route-half:hover { filter: brightness(1.05); }

.route-half.marketing { background: linear-gradient(135deg, var(--marketing) 0%, var(--marketing-dark) 100%); }
.route-half.marketing::before { content: ''; position: absolute; inset: 0; background-image: radial-gradient(rgba(255, 255, 255, 0.18) 1px, transparent 1px); background-size: 16px 16px; mask-image: linear-gradient(135deg, black 30%, transparent 80%); pointer-events: none; }

.route-half.automation { background: linear-gradient(135deg, var(--automation) 0%, var(--automation-dark) 100%); }
.route-half.automation::before { content: '01 10 11 01 10 00 11 01 10 11 00 01 10 11 01 00 11 10 01 11 00 10 11 01 10 11 01 10 00 11 10 01'; position: absolute; inset: 0; font-family: monospace; font-size: 11px; color: rgba(255, 255, 255, 0.22); letter-spacing: 3px; line-height: 1.5; padding: var(--space-3); word-break: break-all; mask-image: linear-gradient(135deg, transparent 20%, black); pointer-events: none; }

.route-half > * { position: relative; z-index: 1; }
.route-half .ico { font-size: 32px; margin-bottom: var(--space-3); }
.route-half h3 { font-family: var(--font-display); font-size: 22px; font-weight: var(--fw-display-bold); color: white; margin-bottom: var(--space-2); letter-spacing: -0.005em; }
.route-half p { color: rgba(255, 255, 255, 0.85); font-size: var(--fs-meta); margin-bottom: var(--space-4); max-width: 320px; margin-left: auto; margin-right: auto; }
.route-half .btn { background: rgba(255, 255, 255, 0.18); border: 1px solid rgba(255, 255, 255, 0.4); color: white; }
.route-half .btn:hover { background: rgba(255, 255, 255, 0.28); }

@media (max-width: 720px) {
  .route-halves { grid-template-columns: 1fr; }
  .route-half { min-height: 220px; padding: var(--space-6) var(--space-4); }
}

/* ─── GENERIC CARD ─── */
.card { background: var(--bg); border: 1px solid var(--ink-line); border-radius: var(--radius-lg); padding: var(--space-5); box-shadow: var(--shadow-card); transition: transform var(--dur-fast), box-shadow var(--dur-fast); }
.card:hover { transform: translateY(-3px); box-shadow: var(--shadow-card-hover); }
```

- [ ] **Step 2:** Commit.

```bash
git add Nils/website/assets/css/components.css
git commit -m "Nils website: components.css (buttons, dot-grid bg, route halves, card)"
```

---

### Task 7: Animations script (`assets/js/animations.js`)

**Files:**
- Create: `Nils/website/assets/js/animations.js`

- [ ] **Step 1:** Create `assets/js/animations.js`:

```js
// Reveals elements with .anim when they enter the viewport.
// Pair with the .anim / .anim.visible / .d1..d4 classes from globals.css.
(function () {
  if (typeof IntersectionObserver === 'undefined') {
    // Graceful fallback: show everything immediately on legacy browsers.
    document.querySelectorAll('.anim').forEach(el => el.classList.add('visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    }
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.anim').forEach(el => io.observe(el));
  });
})();
```

- [ ] **Step 2:** Commit.

```bash
git add Nils/website/assets/js/animations.js
git commit -m "Nils website: scroll-reveal animations (.anim + IntersectionObserver)"
```

---

### Task 8: Head meta partial (`assets/partials/head-meta.html`)

**Files:**
- Create: `Nils/website/assets/partials/head-meta.html`

- [ ] **Step 1:** Create `assets/partials/head-meta.html`. This is the standard `<head>` block that every page must include (copy-paste, no server-side includes):

```html
<!-- Required: per-page <title>, <meta name="description">, <link rel="canonical"> -->
<!-- These three are NOT included in this partial. Set them on each page. -->

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#ffffff">

<!-- Fonts: Google Sans, DM Sans, Instrument Sans, Instrument Serif -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">

<!-- Site CSS (every page) -->
<link rel="stylesheet" href="/Nils/website/assets/css/tokens.css">
<link rel="stylesheet" href="/Nils/website/assets/css/globals.css">
<link rel="stylesheet" href="/Nils/website/assets/css/nav.css">
<link rel="stylesheet" href="/Nils/website/assets/css/footer.css">
<link rel="stylesheet" href="/Nils/website/assets/css/components.css">

<!-- Page-specific CSS: include the right one per page -->
<!-- e.g. <link rel="stylesheet" href="/Nils/website/assets/css/home.css"> -->

<!-- Site JS (every page) -->
<script src="/Nils/website/assets/js/nav.js" defer></script>
<script src="/Nils/website/assets/js/animations.js" defer></script>

<!-- Microsoft Clarity tracking (replace CLARITY_ID with value from Task 0) -->
<!-- <script type="text/javascript">
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "CLARITY_ID");
</script> -->
```

- [ ] **Step 2:** Commit.

```bash
git add Nils/website/assets/partials/head-meta.html
git commit -m "Nils website: shared head-meta partial (fonts, base CSS, Clarity stub)"
```

---

## Phase 2: Home page (`index.html`)

The home page is built section by section. **Each section task produces 2-4 variations in `_drafts/`**, Emilio picks one, and only the chosen variation goes into the final `index.html`. The final consolidation happens in Task 14.

### Task 9: Home hero variations

**Files:**
- Create: `Nils/website/_drafts/home-hero.html`
- Create: `Nils/website/assets/css/home.css` (start with just hero styles)

**Locked copy (from V1 brainstorm pick):**
- Eyebrow: `For local service businesses`
- H1: `If you want to get more clients and automate your busywork, you're in the right place.`
- H2: `We run super profitable Google Ads and build custom automations that eliminate your manual work by up to 100%, so you can focus on growing the business, not just maintaining it.`

- [ ] **Step 1:** Create `_drafts/home-hero.html` with 3 layout variations. Each variation is a `<section>` block stacked one after another, separated by a labeled divider. The page should self-serve when opened in a browser. Apply `.bg-dotgrid` to each hero so the brand texture is consistent.

The three variations must differ meaningfully:
- **V1 — Centered editorial** (text centered, max-width 760px, no imagery, just the headline structure)
- **V2 — Asymmetric left-aligned with portrait** (text left, Emilio's portrait or a brand mark on the right)
- **V3 — Centered with logo-strip credibility row** (V1 + a row of 4 client logos / trust marks above the eyebrow)

For each variation, use the locked copy verbatim. Apply Instrument Serif to the H1 with the italic accent words "more clients" (blue, `.accent-marketing`) and "automate" (green, `.accent-automation`). Wrap H2 in `<p class="lead">`.

- [ ] **Step 2:** Add the hero CSS to `assets/css/home.css` (only the styles needed for all three variations — keep it shared):

```css
/* HERO — shared */
.home-hero { padding: var(--space-8) 0 var(--space-7); text-align: center; }
.home-hero .eyebrow { /* uses .eyebrow from globals */ }
.home-hero h1 { max-width: 880px; margin: 0 auto var(--space-4); }
.home-hero p.lead { max-width: 620px; margin: 0 auto; color: var(--ink-soft); }

/* HERO — V2 asymmetric variant */
.home-hero.v2 { text-align: left; }
.home-hero.v2 .inner { display: grid; grid-template-columns: 1.6fr 1fr; gap: var(--space-7); align-items: center; }
.home-hero.v2 h1 { margin-left: 0; }
.home-hero.v2 p.lead { margin-left: 0; }
.home-hero.v2 .portrait { aspect-ratio: 1; border-radius: var(--radius-lg); background: var(--ink-line-soft); }
@media (max-width: 720px) {
  .home-hero.v2 .inner { grid-template-columns: 1fr; }
}

/* HERO — V3 logo strip */
.home-hero .logo-strip { display: flex; justify-content: center; gap: var(--space-5); margin-bottom: var(--space-4); opacity: 0.55; flex-wrap: wrap; }
.home-hero .logo-strip span { font-family: var(--font-display); font-size: var(--fs-eyebrow); letter-spacing: 0.15em; text-transform: uppercase; color: var(--ink-mute); }
```

- [ ] **Step 3:** Open `_drafts/home-hero.html` in the browser, screenshot all three variations, present to Emilio (via visual companion if active, or just by sharing the file path). Get the pick.

- [ ] **Step 4:** Commit the draft + initial home.css. Do NOT consolidate into `index.html` yet — that happens in Task 14.

```bash
git add Nils/website/_drafts/home-hero.html Nils/website/assets/css/home.css
git commit -m "Nils website: home hero variations (3 layouts, locked copy V1)"
```

---

### Task 10: Home route halves variations

**Files:**
- Create: `Nils/website/_drafts/home-route-halves.html`
- Modify: `Nils/website/assets/css/home.css`

The route halves are the Netflix-style dual cards directly under the hero. The base layout is in `components.css` (`.route-halves`, `.route-half.marketing`, `.route-half.automation`). This task creates 3 copy/content variations.

- [ ] **Step 1:** Create `_drafts/home-route-halves.html` with 3 variations of the route halves block. All use the same base `.route-halves` markup; what differs is copy and inner micro-content:

- **V1 — Two-line outcome + CTA** (current spec: title + sub + button)
  - Marketing: "Get more clients" / "Website + Google Ads + reviews. Built and managed for you." / "See the marketing system →"
  - Automation: "Save time on ops" / "AI + automation audit. Department by department." / "See the audit →"

- **V2 — Pain question + outcome promise + CTA**
  - Marketing: "Need more clients?" / "We build sites that convert at 10-20%, plus the ads that fill them." / "See how →"
  - Automation: "Drowning in manual work?" / "Department-by-department blueprint of every job AI can do for you." / "See the audit →"

- **V3 — Stat-led + CTA**
  - Marketing: "2x more clients in 60 days, or you don't pay." / "Website + Google Ads + 5-star review automation." / "See the system →"
  - Automation: "Up to 40 hours/week back, every week." / "AI + automation audit, personally done by Emilio." / "See the audit →"

All three use the same blue/green gradient halves with the dot-grid + binary code-rain textures already baked into `.route-half.marketing` / `.route-half.automation`.

Each route card's anchor `href` is:
- Marketing → `/Nils/funnel/vsl.html`
- Automation → `/Nils/funnel/automation-vsl-funnel-direct.html`

- [ ] **Step 2:** No new CSS needed (base styles are in `components.css`). Add the icon glyphs as inline SVG or unicode (📈 / ⚙️) — Emilio can later swap to custom SVGs.

- [ ] **Step 3:** Open in browser, screenshot, present 3 variations, get pick.

- [ ] **Step 4:** Commit.

```bash
git add Nils/website/_drafts/home-route-halves.html
git commit -m "Nils website: home route halves variations (3 copy approaches)"
```

---

### Task 11: Home "proof teaser" variations

**Files:**
- Create: `Nils/website/_drafts/home-proof.html`
- Modify: `Nils/website/assets/css/home.css`

A short trust-builder section between the route halves and the about teaser. Surfaces a sample of proof, links to `/proof.html`.

- [ ] **Step 1:** Create `_drafts/home-proof.html` with 3 variations:

- **V1 — Logo wall** (single row of 4-6 client logos, grayscale, link to `/proof.html` below)
- **V2 — Stat row** (three big stats with short captions, e.g. "$2.4M ad spend managed", "127 systems shipped", "40hrs/wk reclaimed for Savvy Compliance")
- **V3 — Single hero testimonial** (one big quote with portrait + name + business, link to "more case studies")

- [ ] **Step 2:** Add CSS to `assets/css/home.css`:

```css
/* PROOF teaser */
.home-proof { text-align: center; }
.home-proof .label { font-family: var(--font-display); font-size: var(--fs-eyebrow); letter-spacing: 0.15em; text-transform: uppercase; color: var(--ink-mute); margin-bottom: var(--space-5); }

/* V1 logo wall */
.home-proof.v1 .logos { display: flex; justify-content: center; align-items: center; gap: var(--space-6); flex-wrap: wrap; opacity: 0.65; }
.home-proof.v1 .logos span { font-family: var(--font-display); font-size: 18px; font-weight: var(--fw-display-bold); color: var(--ink-mute); }

/* V2 stat row */
.home-proof.v2 .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-6); margin: var(--space-5) 0; }
.home-proof.v2 .stat .n { font-family: var(--font-serif); font-size: var(--fs-h1); color: var(--marketing); }
.home-proof.v2 .stat .c { font-size: var(--fs-meta); color: var(--ink-soft); margin-top: var(--space-2); }
@media (max-width: 720px) { .home-proof.v2 .stats { grid-template-columns: 1fr; } }

/* V3 testimonial */
.home-proof.v3 .quote { font-family: var(--font-serif); font-size: var(--fs-h3); line-height: var(--lh-snug); max-width: 720px; margin: 0 auto var(--space-4); color: var(--ink); }
.home-proof.v3 .author { font-family: var(--font-display); font-size: var(--fs-meta); color: var(--ink-soft); }
```

- [ ] **Step 3:** Open in browser, screenshot, present, get pick.

- [ ] **Step 4:** Commit.

```bash
git add Nils/website/_drafts/home-proof.html Nils/website/assets/css/home.css
git commit -m "Nils website: home proof teaser variations (logos / stats / testimonial)"
```

---

### Task 12: Home "about teaser" variations

**Files:**
- Create: `Nils/website/_drafts/home-about.html`
- Modify: `Nils/website/assets/css/home.css`

- [ ] **Step 1:** Create `_drafts/home-about.html` with 3 variations:

- **V1 — Portrait + paragraph** (Emilio's portrait left, 2-3 sentences right, "Read the full story →" link to `/about.html`)
- **V2 — Mission statement card** (centered, no portrait, big serif quote-style mission)
- **V3 — Differentiator pills** (3 small cards: "Not a faceless agency", "Not a one-man army", "A proven team in the sweet spot")

- [ ] **Step 2:** Add CSS for each variation to `home.css` (follow the same `.home-about.v1 / .v2 / .v3` pattern).

```css
.home-about { padding: var(--space-8) 0; }
.home-about.v1 .inner { display: grid; grid-template-columns: 1fr 2fr; gap: var(--space-7); align-items: center; }
.home-about.v1 .portrait { aspect-ratio: 1; border-radius: var(--radius-lg); background: var(--ink-line-soft); }
.home-about.v2 .mission { font-family: var(--font-serif); font-size: var(--fs-h2); max-width: 760px; margin: 0 auto; text-align: center; line-height: var(--lh-snug); }
.home-about.v3 .pills { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); max-width: 900px; margin: 0 auto; }
.home-about.v3 .pill-card { border: 1px solid var(--ink-line); border-radius: var(--radius-lg); padding: var(--space-5); text-align: center; }
@media (max-width: 720px) { .home-about.v1 .inner, .home-about.v3 .pills { grid-template-columns: 1fr; } }
```

- [ ] **Step 3:** Open, screenshot, present, pick.

- [ ] **Step 4:** Commit.

```bash
git add Nils/website/_drafts/home-about.html Nils/website/assets/css/home.css
git commit -m "Nils website: home about teaser variations (portrait / mission / pills)"
```

---

### Task 13: Home "latest from blog" teaser variations

**Files:**
- Create: `Nils/website/_drafts/home-blog.html`
- Modify: `Nils/website/assets/css/home.css`

Surfaces 3 most recent blog posts, links to `/blog/`.

- [ ] **Step 1:** Create `_drafts/home-blog.html` with 3 variations:

- **V1 — Three equal cards** (image + tag + title + read time, three across)
- **V2 — Featured + two stacked** (one large card left with image, two compact cards stacked right)
- **V3 — Minimal list** (no images, just title + tag pill + date, vertical list, very editorial)

Tag pills use color encoding: `--marketing` for Marketing posts, `--automation` for Automation posts.

- [ ] **Step 2:** Add CSS:

```css
.home-blog { padding: var(--space-8) 0; }
.home-blog .label { font-family: var(--font-display); font-size: var(--fs-eyebrow); letter-spacing: 0.15em; text-transform: uppercase; color: var(--ink-mute); margin-bottom: var(--space-5); text-align: center; }
.home-blog .all-posts { text-align: center; margin-top: var(--space-5); }

.home-blog.v1 .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-5); }
.home-blog.v2 .grid { display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-5); }
.home-blog.v2 .stacked { display: grid; grid-template-rows: 1fr 1fr; gap: var(--space-5); }
.home-blog.v3 .list { display: flex; flex-direction: column; gap: var(--space-4); max-width: 720px; margin: 0 auto; }

.post-card { border: 1px solid var(--ink-line); border-radius: var(--radius-lg); padding: var(--space-5); transition: transform var(--dur-fast), box-shadow var(--dur-fast); }
.post-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-card-hover); }
.post-card .tag { display: inline-block; font-family: var(--font-display); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; padding: 2px 8px; border-radius: var(--radius-pill); margin-bottom: var(--space-2); }
.post-card .tag.marketing { color: var(--marketing); background: rgba(var(--marketing-rgb), 0.1); }
.post-card .tag.automation { color: var(--automation-dark); background: rgba(var(--automation-rgb), 0.1); }
.post-card h4 { font-family: var(--font-serif); font-size: var(--fs-h3); margin: 0 0 var(--space-2); }
.post-card .meta { font-size: var(--fs-meta); color: var(--ink-mute); }
@media (max-width: 720px) {
  .home-blog.v1 .grid, .home-blog.v2 .grid { grid-template-columns: 1fr; }
  .home-blog.v2 .stacked { grid-template-rows: auto; }
}
```

- [ ] **Step 3:** Open, screenshot, present, pick.

- [ ] **Step 4:** Commit.

```bash
git add Nils/website/_drafts/home-blog.html Nils/website/assets/css/home.css
git commit -m "Nils website: home blog teaser variations (grid / featured+stacked / list)"
```

---

### Task 14: Consolidate home page into `index.html`

**Files:**
- Create: `Nils/website/index.html`

- [ ] **Step 1:** Create `Nils/website/index.html` using:
  - The standard `<head>` block from `assets/partials/head-meta.html`, with these page-specific additions:
    - `<title>Nils Digital — Growth + systems for $1M+ local service businesses</title>`
    - `<meta name="description" content="We run super profitable Google Ads and build custom automations that eliminate your manual work by up to 100%, so you can focus on growing the business, not just maintaining it.">`
    - `<link rel="canonical" href="...">` (use the resolved domain from Task 0)
    - OpenGraph + Twitter card tags (use the same description, an OG image at `assets/img/og-home.png`)
    - `<link rel="stylesheet" href="/Nils/website/assets/css/home.css">`
  - Body open with the nav partial from `assets/partials/nav.html`
  - Home page sections in this order, **using the variation Emilio picked in each of Tasks 9-13**:
    1. Hero (from Task 9)
    2. Route halves (from Task 10)
    3. Proof teaser (from Task 11)
    4. About teaser (from Task 12)
    5. Latest from blog (from Task 13)
  - Close with the footer partial from `assets/partials/footer.html`

- [ ] **Step 2:** Open `index.html` in the browser. Verify:
  - All sections render in order without layout breaks
  - Mobile responsive at 375px width
  - Route halves link to the correct VSL URLs
  - Animations fire on scroll (`.anim` classes work)
  - No console errors

- [ ] **Step 3:** Take a full-page screenshot, share with Emilio for final sign-off on the assembled home page.

- [ ] **Step 4:** Commit.

```bash
git add Nils/website/index.html
git commit -m "Nils website: assembled index.html (home, picked variations from drafts)"
```

---

## Phase 3: About page (`about.html`)

### Task 15: About hero variations

**Files:**
- Create: `Nils/website/_drafts/about-hero.html`
- Create: `Nils/website/assets/css/about.css`

- [ ] **Step 1:** Create `_drafts/about-hero.html` with 3 variations following the same eyebrow / H1 / H2 formula:

- **V1 — Editorial centered:** Eyebrow "Who runs this", H1 "We're the team you call when your business has stopped scaling itself.", H2 explaining the operator-led origin.
- **V2 — Portrait-led asymmetric:** Same eyebrow, H1 angled around Emilio's personal story ("Hi, I'm Emilio. I started Nils because…"), portrait right.
- **V3 — Mission first:** Eyebrow "Why we exist", H1 in serif italic ("Every $1M+ local service owner deserves to actually own their business."), H2 about the gap they're closing.

- [ ] **Step 2:** Add starter `about.css`:

```css
.about-hero { padding: var(--space-8) 0 var(--space-7); }
.about-hero.v1 { text-align: center; }
.about-hero.v1 h1 { max-width: 880px; margin: 0 auto var(--space-4); }
.about-hero.v1 p.lead { max-width: 620px; margin: 0 auto; color: var(--ink-soft); }
.about-hero.v2 .inner { display: grid; grid-template-columns: 1.6fr 1fr; gap: var(--space-7); align-items: center; }
.about-hero.v2 .portrait { aspect-ratio: 1; border-radius: var(--radius-lg); background: var(--ink-line-soft); }
@media (max-width: 720px) { .about-hero.v2 .inner { grid-template-columns: 1fr; } }
```

- [ ] **Step 3:** Open, present, pick.

- [ ] **Step 4:** Commit.

```bash
git add Nils/website/_drafts/about-hero.html Nils/website/assets/css/about.css
git commit -m "Nils website: about hero variations (3 approaches)"
```

---

### Task 16: About story + team section variations

**Files:**
- Create: `Nils/website/_drafts/about-story-team.html`
- Modify: `Nils/website/assets/css/about.css`

- [ ] **Step 1:** Create variations of the story + team section. Treat them as one combined section (story flows into team):

- **V1 — Story prose + team card grid:** 2-3 paragraphs of founder story, then a 3-column grid of team member cards (photo + name + role). Repurpose content from existing `Nils/team.html` if Task 0 said to migrate.
- **V2 — Timeline + portraits:** Story rendered as a vertical timeline (3-4 milestones), then team portraits at the bottom in a horizontal scroll.
- **V3 — Single founder card + team strip:** Big Emilio card (portrait + bio + 2-3 paragraphs), then a small horizontal strip of team thumbnails with names underneath.

- [ ] **Step 2:** Add CSS for each variation. Use these tokens consistently: `var(--radius-lg)` for cards, `var(--ink-line)` for borders, `var(--space-5)` for grid gaps.

- [ ] **Step 3:** Open, present, pick.

- [ ] **Step 4:** Commit.

```bash
git add Nils/website/_drafts/about-story-team.html Nils/website/assets/css/about.css
git commit -m "Nils website: about story + team variations"
```

---

### Task 17: About "how we work" + CTA variations

**Files:**
- Create: `Nils/website/_drafts/about-process-cta.html`
- Modify: `Nils/website/assets/css/about.css`

- [ ] **Step 1:** Create variations of the process + CTA closer:

- **V1 — Numbered steps + dual route CTA:** 4 numbered process steps (1. Scan your business, 2. Scope, 3. Build, 4. Support 24/7), followed by the route halves component from `components.css` (reuse, just place at bottom).
- **V2 — Process cards + single "talk to us" CTA:** 3 horizontal cards explaining process pillars, then a single contact CTA (links to `/contact.html`).
- **V3 — FAQ-style process + dual route CTA:** Process explained as 4 collapsible FAQ items, then the route halves.

- [ ] **Step 2:** For V1 and V3, reference the existing `.route-halves` markup — don't duplicate styles.

- [ ] **Step 3:** Open, present, pick.

- [ ] **Step 4:** Commit.

```bash
git add Nils/website/_drafts/about-process-cta.html Nils/website/assets/css/about.css
git commit -m "Nils website: about process + CTA variations"
```

---

### Task 18: Consolidate `about.html`

**Files:**
- Create: `Nils/website/about.html`

- [ ] **Step 1:** Create `about.html` using the same shape as `index.html` (head partial + nav + sections + footer), with:
  - Page-specific `<title>`: "About Nils Digital — Growth + systems for $1M+ local service businesses"
  - Page-specific meta description: short summary of who Nils is.
  - `<link rel="stylesheet" href="/Nils/website/assets/css/about.css">`
  - Body sections in order: about hero (Task 15 pick) → about story + team (Task 16 pick) → about process + CTA (Task 17 pick)

- [ ] **Step 2:** Open in browser, verify mobile, screenshot, sign-off.

- [ ] **Step 3:** Commit.

```bash
git add Nils/website/about.html
git commit -m "Nils website: assembled about.html"
```

---

## Phase 4: Proof page (`proof.html`)

### Task 19: Proof hero + intro variations

**Files:**
- Create: `Nils/website/_drafts/proof-hero.html`
- Create: `Nils/website/assets/css/proof.css`

- [ ] **Step 1:** Create 3 variations following the eyebrow / H1 / H2 formula. Suggested directions:
- **V1 — "Receipts" angle:** Eyebrow "Receipts", H1 "Real businesses. Real numbers. Real results.", H2 about the variety of business types covered.
- **V2 — "Numbers in" angle:** Eyebrow "Proof", H1 "[X] businesses. [Y] in revenue moved. Zero refunds." (Emilio supplies actual numbers), H2 explaining the guarantee.
- **V3 — "Pick your case" angle:** Eyebrow "Proof", H1 "Pick the result you want, see how we got it.", H2 inviting them to filter by Marketing/Automation below.

- [ ] **Step 2:** Add starter `proof.css` with the V3 filter pill bar (used by Task 20 too):

```css
.proof-hero { padding: var(--space-8) 0 var(--space-6); text-align: center; }
.proof-hero h1 { max-width: 880px; margin: 0 auto var(--space-4); }
.proof-hero p.lead { max-width: 620px; margin: 0 auto; color: var(--ink-soft); }

.proof-filter { display: flex; justify-content: center; gap: var(--space-2); margin: var(--space-5) 0; flex-wrap: wrap; }
.proof-filter .pill { padding: 6px 14px; border-radius: var(--radius-pill); border: 1px solid var(--ink-line); font-family: var(--font-display); font-size: var(--fs-meta); font-weight: var(--fw-display-bold); color: var(--ink-soft); cursor: pointer; }
.proof-filter .pill.active { background: var(--ink); color: white; border-color: var(--ink); }
.proof-filter .pill.marketing.active { background: var(--marketing); border-color: var(--marketing); }
.proof-filter .pill.automation.active { background: var(--automation); border-color: var(--automation); }
```

- [ ] **Step 3:** Open, present, pick.

- [ ] **Step 4:** Commit.

```bash
git add Nils/website/_drafts/proof-hero.html Nils/website/assets/css/proof.css
git commit -m "Nils website: proof hero variations"
```

---

### Task 20: Proof case-study block variations

**Files:**
- Create: `Nils/website/_drafts/proof-cases.html`
- Modify: `Nils/website/assets/css/proof.css`

- [ ] **Step 1:** Create 3 variations of the case-study block:

- **V1 — Two columns by topic:** Marketing wins left (blue header), Automation wins right (green header), 2-3 case cards per column.
- **V2 — Single vertical stream + tag filter:** All cases in a single vertical feed, each card stamped with its tag pill (blue Marketing, green Automation). Filter pills at top toggle visibility client-side via a small JS handler.
- **V3 — Hero case + grid:** One huge featured case study at the top (the Savvy Compliance "40 hours/week" story), then a 3-up grid of smaller cases below.

- [ ] **Step 2:** Add CSS for each variation. For V2, include the JS handler inline (small enough not to need its own file):

```css
.case-card { border: 1px solid var(--ink-line); border-radius: var(--radius-lg); padding: var(--space-5); display: grid; grid-template-columns: 1fr 2fr; gap: var(--space-5); margin-bottom: var(--space-4); }
.case-card .stat { font-family: var(--font-serif); font-size: var(--fs-h2); color: var(--marketing); }
.case-card.automation .stat { color: var(--automation-dark); }
.case-card h3 { font-family: var(--font-display); font-size: var(--fs-body-lg); font-weight: var(--fw-display-bold); margin-bottom: var(--space-2); }
.case-card .quote { font-style: italic; color: var(--ink-soft); font-size: var(--fs-meta); margin-top: var(--space-3); }
@media (max-width: 720px) { .case-card { grid-template-columns: 1fr; } }
```

JS handler for V2:

```html
<script>
document.querySelectorAll('.proof-filter .pill').forEach(p => {
  p.addEventListener('click', () => {
    document.querySelectorAll('.proof-filter .pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    const f = p.dataset.filter;
    document.querySelectorAll('.case-card').forEach(c => {
      c.style.display = (f === 'all' || c.classList.contains(f)) ? '' : 'none';
    });
  });
});
</script>
```

- [ ] **Step 3:** Open, present, pick.

- [ ] **Step 4:** Commit.

```bash
git add Nils/website/_drafts/proof-cases.html Nils/website/assets/css/proof.css
git commit -m "Nils website: proof case-study block variations"
```

---

### Task 21: Proof CTA + consolidation

**Files:**
- Create: `Nils/website/_drafts/proof-cta.html`
- Create: `Nils/website/proof.html`
- Modify: `Nils/website/assets/css/proof.css`

- [ ] **Step 1:** Create 2 CTA variations:
- **V1 — Dual route halves** (reuse `components.css` `.route-halves`, same as home)
- **V2 — Single "talk to us" panel** (one large bordered panel with a "Get on a call" CTA → `/contact.html`)

- [ ] **Step 2:** Open, present, pick.

- [ ] **Step 3:** Create `proof.html`:
  - Standard head partial + `<link rel="stylesheet" href="/Nils/website/assets/css/proof.css">`
  - Page-specific title + description
  - Body: nav → proof hero (Task 19 pick) → proof cases (Task 20 pick) → proof CTA (Task 21 pick) → footer

- [ ] **Step 4:** Open, verify, screenshot, sign-off.

- [ ] **Step 5:** Commit.

```bash
git add Nils/website/_drafts/proof-cta.html Nils/website/proof.html Nils/website/assets/css/proof.css
git commit -m "Nils website: proof CTA variations + assembled proof.html"
```

---

## Phase 5: Blog (index + post template + Pagefind)

### Task 22: Blog index variations

**Files:**
- Create: `Nils/website/_drafts/blog-index.html`
- Create: `Nils/website/assets/css/blog.css`

- [ ] **Step 1:** Create 3 layout variations for the blog feed (all use single-feed-with-tags structure from spec, with the **compact search inline in the tag toolbar**):

- **V1 — Card grid:** 3-column grid of post cards, each with image thumbnail + tag + title + read time. Search + tag toolbar above.
- **V2 — Editorial list:** Vertical single-column list with bigger titles, no thumbnails (or small thumb left), more whitespace. Magazine feel.
- **V3 — Featured + grid:** One big featured post at the top (image + title + excerpt), then 2-column grid below.

All three include:
- The toolbar with tag pills (All, Marketing, Automation, Local SEO, Google Ads, AI tools, Reviews) and a compact search input on the right (`Search ⌘K`)
- Pagefind UI mount point: `<div id="search-ui"></div>` (initialized by `search.js` in Task 24)

- [ ] **Step 2:** Add `blog.css` covering all three variations:

```css
.blog-header { padding: var(--space-8) 0 var(--space-4); text-align: center; }
.blog-header .crumb { font-family: var(--font-display); font-size: var(--fs-meta); color: var(--ink-mute); margin-bottom: var(--space-3); }
.blog-header h1 { max-width: 760px; margin: 0 auto; }

.blog-toolbar { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4) 0; border-bottom: 1px solid var(--ink-line); flex-wrap: wrap; }
.blog-tags { display: flex; gap: var(--space-2); flex-wrap: wrap; flex: 1; }
.blog-tag { font-family: var(--font-display); font-size: var(--fs-meta); font-weight: var(--fw-display-bold); padding: 5px 12px; border-radius: var(--radius-pill); border: 1px solid var(--ink-line); color: var(--ink-soft); cursor: pointer; }
.blog-tag.active { background: var(--marketing); color: white; border-color: var(--marketing); }
.blog-tag.marketing.active { background: var(--marketing); border-color: var(--marketing); }
.blog-tag.automation.active { background: var(--automation); border-color: var(--automation); }

.blog-search { display: inline-flex; align-items: center; background: var(--bg); border: 1px solid var(--ink-line); border-radius: var(--radius-md); padding: 6px 12px; gap: 8px; font-family: var(--font-body); font-size: var(--fs-meta); color: var(--ink-soft); min-width: 180px; cursor: pointer; }
.blog-search .icon { width: 12px; height: 12px; border: 1.5px solid var(--ink-mute); border-radius: 50%; position: relative; flex-shrink: 0; }
.blog-search .icon::after { content: ''; position: absolute; bottom: -4px; right: -2px; width: 5px; height: 1.5px; background: var(--ink-mute); transform: rotate(45deg); border-radius: 1px; }
.blog-search .kbd { margin-left: auto; font-family: monospace; font-size: 10px; opacity: 0.5; border: 1px solid var(--ink-line); border-radius: 3px; padding: 1px 5px; }

.blog-feed { padding: var(--space-6) 0; }
.blog-feed.v1 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-5); }
.blog-feed.v2 { display: flex; flex-direction: column; gap: var(--space-5); max-width: 760px; margin: 0 auto; }
.blog-feed.v3 .featured { margin-bottom: var(--space-6); }
.blog-feed.v3 .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-5); }

@media (max-width: 720px) {
  .blog-feed.v1, .blog-feed.v3 .grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 3:** Open, present, pick.

- [ ] **Step 4:** Commit.

```bash
git add Nils/website/_drafts/blog-index.html Nils/website/assets/css/blog.css
git commit -m "Nils website: blog index variations (3 feed layouts) + base CSS"
```

---

### Task 23: Blog post template (`blog/_template.html`)

**Files:**
- Create: `Nils/website/blog/_template.html`
- Modify: `Nils/website/assets/css/blog.css`

This is the template that wraps every individual blog post. The post-process script (Task 25) injects each new BabyLoveGrowth-generated post body into this template and replaces `{{CTA}}` with the matching inline CTA.

- [ ] **Step 1:** Create `Nils/website/blog/_template.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- INCLUDE assets/partials/head-meta.html contents -->
  <title>{{TITLE}} | Nils Digital</title>
  <meta name="description" content="{{DESCRIPTION}}">
  <link rel="canonical" href="{{CANONICAL_URL}}">
  <link rel="stylesheet" href="/Nils/website/assets/css/blog.css">
  <meta property="og:title" content="{{TITLE}}">
  <meta property="og:description" content="{{DESCRIPTION}}">
  <meta property="og:type" content="article">
  <meta property="article:tag" content="{{TAG}}">
</head>
<body>
  <!-- INCLUDE assets/partials/nav.html contents -->

  <article class="post container-narrow">
    <header class="post-header">
      <span class="post-tag tag-{{TAG_SLUG}}">{{TAG}}</span>
      <h1>{{TITLE}}</h1>
      <p class="lead">{{SUBTITLE}}</p>
      <div class="post-meta">
        <span>By {{AUTHOR}}</span>
        <span>·</span>
        <span>{{READ_TIME}} min read</span>
        <span>·</span>
        <time datetime="{{DATE_ISO}}">{{DATE_PRETTY}}</time>
      </div>
    </header>

    <div class="post-body">
      {{BODY}}
    </div>

    <!-- Inline CTA: injected per-post by scripts/inject-post-cta.mjs based on TAG_SLUG -->
    <!-- {{CTA}} -->

    <aside class="post-related">
      <h6>Related</h6>
      <div class="related-grid">
        <!-- Populated by the post-process script with 3 same-tag posts -->
      </div>
    </aside>
  </article>

  <!-- INCLUDE assets/partials/footer.html contents -->
</body>
</html>
```

- [ ] **Step 2:** Add post styles to `blog.css`:

```css
/* POST */
.post { padding: var(--space-8) 0; }
.post-header { text-align: center; margin-bottom: var(--space-7); }
.post-tag { display: inline-block; font-family: var(--font-display); font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; padding: 4px 10px; border-radius: var(--radius-pill); margin-bottom: var(--space-4); }
.post-tag.tag-marketing  { color: var(--marketing); background: rgba(var(--marketing-rgb), 0.1); }
.post-tag.tag-automation { color: var(--automation-dark); background: rgba(var(--automation-rgb), 0.1); }
.post-header h1 { margin-bottom: var(--space-3); }
.post-meta { font-family: var(--font-body); font-size: var(--fs-meta); color: var(--ink-mute); display: flex; justify-content: center; gap: var(--space-3); flex-wrap: wrap; }

.post-body { font-size: var(--fs-body-lg); line-height: var(--lh-relaxed); }
.post-body h2, .post-body h3 { margin-top: var(--space-7); margin-bottom: var(--space-3); }
.post-body p { margin-bottom: var(--space-4); }
.post-body img { border-radius: var(--radius-md); margin: var(--space-5) 0; }

/* INLINE CTA (injected per post) */
.post-cta { margin: var(--space-8) 0 var(--space-6); padding: var(--space-6); border-radius: var(--radius-lg); text-align: center; color: white; }
.post-cta.marketing  { background: linear-gradient(135deg, var(--marketing) 0%, var(--marketing-dark) 100%); }
.post-cta.automation { background: linear-gradient(135deg, var(--automation) 0%, var(--automation-dark) 100%); }
.post-cta h3 { color: white; font-family: var(--font-display); font-size: var(--fs-h3); margin-bottom: var(--space-3); }
.post-cta p { color: rgba(255, 255, 255, 0.85); margin-bottom: var(--space-4); }
.post-cta .btn { background: white; color: var(--ink); border: 0; }

/* RELATED */
.post-related { margin-top: var(--space-8); padding-top: var(--space-6); border-top: 1px solid var(--ink-line); }
.post-related h6 { font-family: var(--font-display); font-size: var(--fs-eyebrow); letter-spacing: 0.15em; text-transform: uppercase; color: var(--ink-mute); margin-bottom: var(--space-4); }
.related-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); }
@media (max-width: 720px) { .related-grid { grid-template-columns: 1fr; } }
```

- [ ] **Step 3:** Commit.

```bash
git add Nils/website/blog/_template.html Nils/website/assets/css/blog.css
git commit -m "Nils website: blog post template + post/CTA/related CSS"
```

---

### Task 24: Pagefind search setup (`scripts/build-search.sh` + `assets/js/search.js`)

**Files:**
- Create: `Nils/website/scripts/build-search.sh`
- Create: `Nils/website/assets/js/search.js`

- [ ] **Step 1:** Create `Nils/website/scripts/build-search.sh`:

```bash
#!/usr/bin/env bash
# Generate Pagefind search index from the static blog HTML.
# Run after adding or updating posts in blog/posts/.
set -euo pipefail

SITE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SITE_ROOT"

echo "→ Building Pagefind index over $SITE_ROOT/blog ..."
npx pagefind --site . --output-path "$SITE_ROOT/pagefind" --glob "blog/**/*.html"
echo "✓ Pagefind index built at $SITE_ROOT/pagefind/"
```

- [ ] **Step 2:** Make it executable: `chmod +x Nils/website/scripts/build-search.sh`

- [ ] **Step 3:** Create `Nils/website/assets/js/search.js`:

```js
// Initialize the Pagefind search UI when the page has a #search-ui mount point.
// The Pagefind UI script + bundle are fetched from /Nils/website/pagefind/.
document.addEventListener('DOMContentLoaded', async () => {
  const mount = document.getElementById('search-ui');
  if (!mount) return;

  // Lazy-load the Pagefind UI bundle.
  const script = document.createElement('script');
  script.src = '/Nils/website/pagefind/pagefind-ui.js';
  script.onload = () => {
    new window.PagefindUI({
      element: '#search-ui',
      bundlePath: '/Nils/website/pagefind/',
      showImages: false,
      showSubResults: true,
      resetStyles: false
    });
  };
  document.head.appendChild(script);
  const styles = document.createElement('link');
  styles.rel = 'stylesheet';
  styles.href = '/Nils/website/pagefind/pagefind-ui.css';
  document.head.appendChild(styles);

  // Open the search overlay on ⌘K / Ctrl+K.
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      const input = mount.querySelector('.pagefind-ui__search-input');
      if (input) input.focus();
    }
  });
});
```

- [ ] **Step 4:** Run the build script once to confirm it works (requires a couple of dummy post HTML files in `blog/posts/` for Pagefind to index). If no posts exist yet, create `blog/posts/hello.html` with placeholder content:

```bash
cd Nils/website
echo '<html><body><h1>Hello</h1><p>Placeholder post body.</p></body></html>' > blog/posts/hello.html
./scripts/build-search.sh
```

Expected: `pagefind/` directory created with `pagefind.js`, `pagefind-ui.js`, `pagefind-ui.css`, plus index chunks.

- [ ] **Step 5:** Delete the placeholder post: `rm blog/posts/hello.html`. Re-run the build script to verify it handles an empty post directory (should succeed with an empty index).

- [ ] **Step 6:** Commit.

```bash
git add Nils/website/scripts/build-search.sh Nils/website/assets/js/search.js
git commit -m "Nils website: Pagefind build script + search.js (lazy-loads UI, ⌘K)"
```

---

### Task 25: BabyLoveGrowth post-process script (`scripts/inject-post-cta.mjs`)

**Files:**
- Create: `Nils/website/scripts/inject-post-cta.mjs`

- [ ] **Step 1:** First, talk to Emilio to confirm BabyLoveGrowth's publishing output format. Document the answer in this file's prologue comment. Key questions:
  1. Does BabyLoveGrowth write to a directory (e.g. dumps `.html` files into `blog/posts/`) or does it call an API/webhook?
  2. Does each generated post include front-matter (tag, date, author, slug) somewhere recoverable (HTML comments, JSON sidecar, `<meta>` tags)?
  3. Is the generated HTML a full document, or just the `<body>` content?

The script below assumes BabyLoveGrowth writes a full HTML file per post into `blog/posts/<slug>.html` with `<meta>` tags carrying the tag and other metadata. If the real format differs, adapt the parsing step.

- [ ] **Step 2:** Create `Nils/website/scripts/inject-post-cta.mjs`:

```js
#!/usr/bin/env node
/**
 * BabyLoveGrowth post-process:
 *   1. Read a raw BabyLoveGrowth post HTML at the given path.
 *   2. Extract metadata (title, description, tag, author, date) from <meta> tags.
 *   3. Wrap the post body in blog/_template.html (replacing {{...}} placeholders).
 *   4. Inject the inline CTA based on the post's primary tag (Marketing / Automation).
 *   5. Write the final HTML back to blog/posts/<slug>.html.
 *
 * Usage:  node scripts/inject-post-cta.mjs blog/posts/<slug>.html
 *
 * NOTE: Update the parseMeta() function if BabyLoveGrowth's output format
 *       turns out to be different (e.g. front-matter JSON sidecar).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';

const [, , inputPath] = process.argv;
if (!inputPath) {
  console.error('Usage: node scripts/inject-post-cta.mjs blog/posts/<slug>.html');
  process.exit(1);
}

const SITE_ROOT = resolve(import.meta.dirname, '..');
const TEMPLATE_PATH = resolve(SITE_ROOT, 'blog/_template.html');
const POST_PATH = resolve(process.cwd(), inputPath);

const CTA_BY_TAG = {
  marketing: {
    headline: 'Want this kind of growth for your business?',
    body: 'We run super profitable Google Ads and build the website that converts them.',
    button: 'See the marketing system',
    href: '/Nils/funnel/vsl.html',
    cls: 'marketing'
  },
  automation: {
    headline: 'Want to reclaim hours every week?',
    body: 'Our audit shows you exactly where AI + automation save the most time in your business.',
    button: 'See the audit',
    href: '/Nils/funnel/automation-vsl-funnel-direct.html',
    cls: 'automation'
  }
};

function parseMeta(raw) {
  const get = (name) => {
    const re = new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']`, 'i');
    const m = raw.match(re);
    return m ? m[1] : '';
  };
  const getOg = (prop) => {
    const re = new RegExp(`<meta\\s+property=["']${prop}["']\\s+content=["']([^"']+)["']`, 'i');
    const m = raw.match(re);
    return m ? m[1] : '';
  };
  const titleMatch = raw.match(/<title>([^<]+)<\/title>/i);
  return {
    title:       (titleMatch ? titleMatch[1] : '').replace(/\s*\|\s*Nils Digital\s*$/, ''),
    description: get('description'),
    tag:         get('blg-tag') || getOg('article:tag') || 'marketing',
    author:      get('author') || 'Nils Digital',
    dateIso:     get('blg-date') || new Date().toISOString(),
    readTime:    get('blg-read-time') || '4',
    subtitle:    get('blg-subtitle') || ''
  };
}

function extractBody(raw) {
  const m = raw.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return m ? m[1].trim() : raw;
}

function renderCta(tag) {
  const c = CTA_BY_TAG[tag.toLowerCase()] || CTA_BY_TAG.marketing;
  return `
    <aside class="post-cta ${c.cls}">
      <h3>${c.headline}</h3>
      <p>${c.body}</p>
      <a class="btn" href="${c.href}">${c.button} →</a>
    </aside>
  `;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const raw = readFileSync(POST_PATH, 'utf8');
const meta = parseMeta(raw);
const body = extractBody(raw);
const slug = basename(POST_PATH, '.html');
const template = readFileSync(TEMPLATE_PATH, 'utf8');

const canonical = `https://nilsdigital.com/Nils/website/blog/posts/${slug}.html`;

const final = template
  .replace(/{{TITLE}}/g, meta.title)
  .replace(/{{DESCRIPTION}}/g, meta.description)
  .replace(/{{CANONICAL_URL}}/g, canonical)
  .replace(/{{TAG}}/g, meta.tag)
  .replace(/{{TAG_SLUG}}/g, meta.tag.toLowerCase())
  .replace(/{{AUTHOR}}/g, meta.author)
  .replace(/{{READ_TIME}}/g, meta.readTime)
  .replace(/{{SUBTITLE}}/g, meta.subtitle)
  .replace(/{{DATE_ISO}}/g, meta.dateIso)
  .replace(/{{DATE_PRETTY}}/g, formatDate(meta.dateIso))
  .replace(/{{BODY}}/g, body)
  .replace(/<!--\s*{{CTA}}\s*-->/, renderCta(meta.tag));

writeFileSync(POST_PATH, final, 'utf8');
console.log(`✓ Processed: ${POST_PATH}  (tag: ${meta.tag})`);
```

- [ ] **Step 3:** Test it with a fixture post. Create `blog/posts/_test-fixture.html`:

```html
<!DOCTYPE html><html><head>
<title>Test post about reviews</title>
<meta name="description" content="Test description">
<meta name="blg-tag" content="marketing">
<meta name="blg-subtitle" content="Test subtitle">
<meta name="blg-read-time" content="3">
</head><body>
<p>Test post body paragraph.</p>
</body></html>
```

Run: `cd Nils/website && node scripts/inject-post-cta.mjs blog/posts/_test-fixture.html`

Open `blog/posts/_test-fixture.html` in a browser. Verify:
- Title, subtitle, tag, read time render correctly in the header
- Body paragraph is preserved
- A blue Marketing CTA appears at the end with the correct headline + button text + href

Run again with a tag=automation variant to confirm the green CTA branch.

- [ ] **Step 4:** Delete the fixture: `rm Nils/website/blog/posts/_test-fixture.html`

- [ ] **Step 5:** Commit.

```bash
git add Nils/website/scripts/inject-post-cta.mjs
git commit -m "Nils website: BabyLoveGrowth post-process script (CTA injection by tag)"
```

---

### Task 26: Consolidate `blog/index.html`

**Files:**
- Create: `Nils/website/blog/index.html`

- [ ] **Step 1:** Create `blog/index.html` using:
  - Standard head partial + page-specific title + description
  - `<link rel="stylesheet" href="/Nils/website/assets/css/blog.css">`
  - Body: nav → blog-header (H1 from blog index pick in Task 22) → blog-toolbar (tag pills + compact search) → blog-feed (Task 22 chosen layout) → footer
  - The blog-feed should render server-side-static (hardcoded sample of recent posts), updated by hand or by a small post-build script later. For launch, write a few real post entries that link to actual posts in `/blog/posts/`.

- [ ] **Step 2:** Open in browser. Verify:
  - Search input opens Pagefind overlay when clicked (after running `build-search.sh` to generate the index)
  - ⌘K shortcut focuses the search
  - Tag pills are visually styled (active/inactive states)
  - Mobile responsive

- [ ] **Step 3:** Commit.

```bash
git add Nils/website/blog/index.html
git commit -m "Nils website: assembled blog/index.html (chosen variation from Task 22)"
```

---

## Phase 6: Contact page (`contact.html`) — simplified per Task 0

Per Task 0 decision #3: **no contact form, no calendar embed**. Bookings happen inside the VSL funnels. The Contact page exists only so the nav `Contact` link goes somewhere coherent. It's a minimal routing page: hero + dual route halves + `mailto:` footnote.

### Task 27: Contact page variations + consolidation

**Files:**
- Create: `Nils/website/_drafts/contact-page.html`
- Create: `Nils/website/contact.html`
- Create: `Nils/website/assets/css/contact.css`

- [ ] **Step 1:** Create 3 hero copy/layout variations for the contact page. All three use the **dual route halves component** below the hero (reuse `.route-halves` from `components.css`, no new CSS needed for the halves themselves). The hero is the only thing that varies.

- **V1 — "Pick a system" direct routing:** Eyebrow `Get started`, H1 "Ready when you are.", H2 "Both systems start with a call. Pick the one that fits, watch the breakdown, and book directly inside."
- **V2 — "Two doors, one outcome":** Eyebrow `Talk to us`, H1 "Two doors. Same result: a calmer, more profitable business.", H2 "Each system pitch ends with a calendar. Pick yours below and book the call inside."
- **V3 — "Plain-talk router":** Eyebrow `Book a call`, H1 "Bookings happen inside the system pages.", H2 "Click the one that's right for you and the calendar lives at the bottom of the page."

Each variation's body is the same: `<section>` with the dual route halves component (reuse the chosen variation from Task 10), then a small `<p>` at the very bottom: `Other questions? <a href="mailto:emilio@nilsdigital.com">emilio@nilsdigital.com</a>`.

- [ ] **Step 2:** Add minimal `contact.css`. No form styles, no calendar iframe styles needed.

```css
.contact-hero { padding: var(--space-8) 0 var(--space-6); text-align: center; }
.contact-hero h1 { max-width: 720px; margin: 0 auto var(--space-4); }
.contact-hero p.lead { max-width: 580px; margin: 0 auto; color: var(--ink-soft); }
.contact-mailto { text-align: center; padding: var(--space-6) 0 var(--space-8); color: var(--ink-mute); font-size: var(--fs-meta); }
.contact-mailto a { color: var(--marketing); border-bottom: 1px solid currentColor; }
```

- [ ] **Step 3:** Open all three hero variations in browser, screenshot, present, get pick.

- [ ] **Step 4:** Create `contact.html`:
  - Standard head + `<link rel="stylesheet" href="/Nils/website/assets/css/contact.css">`
  - Title: "Contact — Nils Digital"
  - Meta description: "Two systems. Same goal. Pick yours and book the call inside."
  - Body: nav → contact hero (chosen variation) → dual route halves section → `mailto:` footnote → footer

- [ ] **Step 5:** Verify all three route-half CTAs link to the correct VSL URLs (same as home page). Verify the `mailto:` opens the user's mail client.

- [ ] **Step 6:** Commit.

```bash
git add Nils/website/_drafts/contact-page.html Nils/website/contact.html Nils/website/assets/css/contact.css
git commit -m "Nils website: contact page (hero variations + routing back to VSLs, no form)"
```

---

## Phase 7: SEO, analytics, launch checklist

### Task 28: `robots.txt` + `sitemap.xml`

**Files:**
- Create: `Nils/website/robots.txt`
- Create: `Nils/website/sitemap.xml`

- [ ] **Step 1:** Create `Nils/website/robots.txt`:

```
User-agent: *
Allow: /

# Drafts and tooling — not for indexing.
Disallow: /Nils/website/_drafts/
Disallow: /Nils/website/scripts/

Sitemap: https://{DOMAIN_FROM_TASK_0}/Nils/website/sitemap.xml
```

Replace `{DOMAIN_FROM_TASK_0}` with the resolved value (e.g. `nilsdigital.com` or `demilio24.github.io/Websites`).

- [ ] **Step 2:** Create `Nils/website/sitemap.xml`. List the 5 main pages plus `/blog/`. (The blog post URLs are added via a small append script during BabyLoveGrowth post-process — out of scope for launch; can be added later.)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://{DOMAIN}/Nils/website/</loc><priority>1.0</priority></url>
  <url><loc>https://{DOMAIN}/Nils/website/about.html</loc><priority>0.8</priority></url>
  <url><loc>https://{DOMAIN}/Nils/website/proof.html</loc><priority>0.8</priority></url>
  <url><loc>https://{DOMAIN}/Nils/website/blog/</loc><priority>0.9</priority></url>
  <url><loc>https://{DOMAIN}/Nils/website/contact.html</loc><priority>0.7</priority></url>
</urlset>
```

- [ ] **Step 3:** Commit.

```bash
git add Nils/website/robots.txt Nils/website/sitemap.xml
git commit -m "Nils website: robots.txt + sitemap.xml (5 pages + blog index)"
```

---

### Task 29: ~~Wire up Clarity tracking~~ (DEFERRED — see Task 0 decision #4)

Skipped at launch per Emilio's Task 0 answer. The Clarity stub stays commented in `assets/partials/head-meta.html`. When Emilio has a Clarity ID later, uncomment the snippet, replace `CLARITY_ID`, re-paste the updated head into each page, and update `reference_clarity_tracking_ids.md` memory.

---

### Task 30: Schema markup + final SEO polish

**Files:**
- Modify: each page HTML

- [ ] **Step 1:** Add `Organization` JSON-LD to the home page:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Nils Digital",
  "url": "https://{DOMAIN}/Nils/website/",
  "logo": "https://{DOMAIN}/Nils/website/assets/img/logo.png",
  "founder": "Emilio",
  "description": "Growth + systems for $1M+ local service businesses.",
  "sameAs": []
}
</script>
```

- [ ] **Step 2:** Add `Article` JSON-LD to the blog post template (`blog/_template.html`) using placeholder fields filled in by `inject-post-cta.mjs`:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{{TITLE}}",
  "description": "{{DESCRIPTION}}",
  "datePublished": "{{DATE_ISO}}",
  "author": { "@type": "Person", "name": "{{AUTHOR}}" },
  "publisher": { "@type": "Organization", "name": "Nils Digital" }
}
</script>
```

- [ ] **Step 3:** Verify per-page meta description and canonical URL are unique and accurate on each page.

- [ ] **Step 4:** Commit.

```bash
git add Nils/website/
git commit -m "Nils website: schema.org JSON-LD (Organization + Article)"
```

---

### Task 31: Full QA pass with `/qa-master`

**Files:** none (audit only)

- [ ] **Step 1:** Run the existing `/qa-master` skill against each of the 5 pages plus a sample blog post:
  - `index.html`
  - `about.html`
  - `proof.html`
  - `blog/index.html`
  - `contact.html`
  - one processed blog post in `blog/posts/`

- [ ] **Step 2:** Fix every issue surfaced by the audit. Iterate until clean.

- [ ] **Step 3:** Run `/live-test` to simulate a real user on desktop + mobile across all pages.

- [ ] **Step 4:** Verify performance target from the spec: each page under 200KB (excluding fonts + post imagery). Use the browser's network tab.

- [ ] **Step 5:** Commit any fixes.

```bash
git add Nils/website/
git commit -m "Nils website: qa-master + live-test fixes"
```

---

### Task 32: Launch

**Files:** none (deployment + DNS)

- [ ] **Step 1:** If a custom domain is wired up (resolved in Task 0), confirm DNS points to GitHub Pages and the site renders at the production URL.

- [ ] **Step 2:** Push to `main`. GitHub Pages auto-deploys.

- [ ] **Step 3:** Smoke-test the production URL:
  - Home page route halves link to the correct VSL URLs
  - Blog search returns results
  - Contact form submits successfully (or calendar embed loads)
  - Sitemap is accessible at `/Nils/website/sitemap.xml`
  - Mobile renders without horizontal scroll

- [ ] **Step 4:** Submit the sitemap to Google Search Console.

- [ ] **Step 5:** Configure BabyLoveGrowth to publish posts into `Nils/website/blog/posts/` and run the `inject-post-cta.mjs` post-process hook (or manually via cron / GitHub Action — out of scope for this plan, follow-up if needed).

- [ ] **Step 6:** Update `Nils/PROJECT.md` changelog with the launch entry. Move the "New: `Nils/website/` implementation pending" open thread to a completed state.

---

## Post-launch (out of scope but documented for follow-up)

- Sitemap auto-update from blog posts (small Node script that runs on every `inject-post-cta` call and rewrites `sitemap.xml`)
- Email capture + nurture sequence (was explicitly out of scope at launch per spec)
- Additional pillar pages if specific topics start ranking (graduating from blog tag → dedicated `/resources/<topic>` page per the Option C blog architecture in the spec)
- Migrate content from old top-level pages (`Nils/team.html`, etc.) per Task 0 decision
- **Microsoft Clarity tracking (was Task 29):** when Emilio registers a Clarity project, uncomment the snippet in `assets/partials/head-meta.html`, replace `CLARITY_ID` with the real value, re-paste the head into all 5 pages, and record the ID in `reference_clarity_tracking_ids.md`.

---

## Self-review checklist (executed before plan handoff)

- **Spec coverage:** Every requirement in `2026-05-24-organic-website-design.md` traces to at least one task. The variations-per-section rule is encoded in every section task. The four open questions resolve in Task 0. The five pages each have their own consolidation task. Pagefind is set up in Task 24. BabyLoveGrowth integration is handled in Task 25. SEO + Clarity + launch covered in Tasks 28-32.
- **Placeholder scan:** No "TBD"/"TODO" left unanchored. The two intentional placeholders (`{DOMAIN}`, `{CLARITY_ID}`) are explicitly tied to Task 0's resolutions.
- **Type consistency:** Token names (`--marketing`, `--automation`, `--ink-line`, etc.) match across `tokens.css`, `globals.css`, `components.css`, and every page-specific CSS file. Component class names (`.route-half.marketing`, `.post-cta.automation`, `.blog-tag.marketing`) consistent across the plan.
- **No "similar to Task N":** Each variation task spells out its own variations.
