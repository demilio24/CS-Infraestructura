# Claude Code — Project Instructions

## Preferences

### GitHub Pages Links
Whenever the user asks for a public link or GitHub Pages link, always return it wrapped in the GHL iframe embed code — never a bare URL. This is so it can be pasted directly into GoHighLevel custom code elements.

Use this format (with email passthrough so GHL contact data flows through):

```html
<style>
html, body {
    overflow: hidden !important;
}
body,
.hl_page-preview--content,
.hl_page-preview--content > div,
.custom-code-element,
section, .section,
.row, .inner-row,
.col, .inner-col,
.container,
[class*="container"],
[class*="wrapper"] {
    max-width: 100% !important;
    width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
}
iframe {
    width: 100vw !important;
    height: 100vh !important;
    border: none !important;
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
}
</style>

<iframe id="uniqueFrameId" src="about:blank" frameborder="0"></iframe>

<script>
  var base  = 'https://demilio24.github.io/Websites/PATH/TO/FILE.html';
  var email = new URLSearchParams(window.location.search).get('email');
  document.getElementById('uniqueFrameId').src = email
    ? base + '?email=' + encodeURIComponent(email)
    : base;
</script>
```

---

## Custom Skills

Slash commands live in `.claude/commands/`. Each `.md` file is a `/command-name` skill.

| Command | Description |
|---|---|
| `/build-funnel` | **Full pipeline** — project manager coordinates the entire team end-to-end automatically |
| `/ghl-embed` | Wraps a GitHub Pages URL in the full GHL iframe embed code |
| `/research-client` | Scrapes a client's website — returns structured context report for richer copy |
| `/write-copy` | Writes copy in the exact voice + structure of our best funnels (Charles, Wendy, Becca, Ignacio, Kimberely, Nils) |
| `/new-funnel` | Builds the full HTML funnel from copy + reference designs in `references/` |
| `/svg-design` | Generates custom inline SVGs — icons, wave dividers, decorative elements, illustrations |
| `/animate` | Adds the full animation layer — scroll triggers, counters, FAQ toggles, hover effects, form pulse |
| `/generate-bg` | Generates premium section backgrounds — CSS mesh gradients or Google Imagen images |
| `/generate-image` | Generates images with Google Imagen (nano banana) and optionally uploads to GHL |
| `/design-review` | Art director pass — audits every image, replaces bad ones, loops until premium |
| `/upload-to-ghl` | Uploads images from `uploads/` to GHL media library, returns CDN URLs |
| `/seo-optimize` | Meta tags, heading hierarchy, alt text, structured data, page speed signals |
| `/qa-check` | Visual QA loop — screenshots the page, identifies issues, fixes them, loops until clean |
| `/qa-master` | **Final check** — runs ALL 8 audit categories (copy, structure, visual, SVG, animations, SEO, code, mobile). Fixes everything. Returns "READY FOR CLIENT" report. |
| `/live-test` | Simulates a real user on desktop + mobile — clicks, scrolls, screenshots every key state |
| `/critique` | CRO + UX + copy review — scores the page, identifies missed opportunities, fixes priority issues |
| `/audit` | **Functional bug hunt** — iframes, modals, iOS quirks, scroll overflow, checkout flows, tap targets. Catches bugs that visual QA misses. |
| `/scrape-images` | Scrapes all image + video URLs from a website (sitemap → crawl → extract), deduplicates by size, lists in chat |
| `/scrape-and-catalog` | **Full media pipeline** — scrapes images + videos, uploads to GHL (binary with retry), AI-analyzes each one visually, returns catalog with CDN URLs + descriptions + placement suggestions. Auto-reads API key from `.env`. |

## Page Types We Build

Beyond VSL/sales funnels, we also build these standalone pages that match the client's funnel design system:

| Page Type | Description | Reference |
|---|---|---|
| **Product sales page** | Long-form page selling a product/service (hero, problem, steps, proof, pricing, FAQ, CTA) | `Nils/funnel/review.html` |
| **Onboarding / calendar page** | Post-purchase page with progress steps, strategy call framing, embedded GHL booking calendar (~70% width on desktop, full on mobile) | `Nils/funnel/review-onboarding-calendar.html` |
| **VSL funnel** | Video-first sales page with custom HVP player, comparison table, credential pills, case studies | `Nils/funnel/vsl.html` |

### Design patterns for new page types:
- Match the client's existing token system (colors, fonts, gold/blue, border-radius, shadows)
- Premium backgrounds: gold grid lines, dot overlays, radial glows, seamless section transitions
- Progress steps pattern: done (green check) / active (gold, highlighted) / upcoming (muted)
- Calendar embeds: 70% width card on desktop, full-width on mobile, gold top bar
- Always mobile-responsive from the start
- Scroll animations (`.anim` + IntersectionObserver)

## Recommended Funnel Workflow

### Option A: Full automated pipeline (recommended)
Run `/build-funnel` — the project manager coordinates the entire team automatically.

### Option B: Run specialists individually
| Step | Skill | What it does |
|---|---|---|
| 1 | `/research-client` | Scrape client's site for context |
| 2 | `/write-copy` | Write copy: voice + structure of our best funnels |
| 3 | `/new-funnel` | Build HTML from copy + reference screenshots |
| 4a | `/svg-design` | Add custom icons, wave dividers, decorative SVGs |
| 4b | `/animate` | Add full animation layer |
| 4c | `/generate-bg` | Generate backgrounds for each section |
| 4d | `/design-review` | Art director image pass |
| 5 | `/qa-master` | Full audit — copy, layout, SVG, animations, SEO, mobile. Fix everything. |
| 6 | `/live-test` | Simulates a real user on desktop + mobile |
| 7 | `/critique` | CRO + UX + copy review — scores the page, fixes priority issues |
| 8 | `/ghl-embed` | Get the paste-ready embed code |

---

## Folder Conventions

| Folder | Purpose |
|---|---|
| `references/` | Drop premium funnel screenshots here for `/new-funnel` to use as reference |
| `uploads/` | Drop images here before running `/upload-to-ghl` |
| `.env` | API credentials — gitignored, never committed |
| `.env.example` | Template showing which keys are needed |
| `.claude/screenshots/` | All Puppeteer/QA screenshots go here — never in the project root |
| `.claude/node_modules/` | Puppeteer and other dev dependencies — run `npm install` inside `.claude/` |
| `.claude/package.json` | Node dependencies for tooling (Puppeteer, http-server) |

> **Rule:** Any file Claude generates as a side-effect of testing (screenshots, audit outputs, temp scripts) goes inside `.claude/`. Never write these to the project root or client folders.
