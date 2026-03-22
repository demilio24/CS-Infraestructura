# Claude Code — Project Instructions

## Preferences

### GitHub Pages Links
Whenever the user asks for a public link or GitHub Pages link, always return it wrapped in the GHL iframe embed code — never a bare URL. This is so it can be pasted directly into GoHighLevel custom code elements.

Use this format:

```html
<style>
/* Override ALL GHL containers */
body,
.hl_page-preview--content,
.hl_page-preview--content > div,
.custom-code-element,
section,
.section,
.row,
.inner-row,
.col,
.inner-col,
.container,
[class*="container"],
[class*="wrapper"] {
    max-width: 100% !important;
    width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
}

/* Full-width iframe - break out of container */
iframe {
    width: 100vw !important;
    min-height: 100vh !important;
    border: none !important;
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
    position: relative !important;
    left: 50% !important;
    right: 50% !important;
    margin-left: -50vw !important;
    margin-right: -50vw !important;
}
</style>
<iframe
    src="https://demilio24.github.io/Websites/PATH/TO/FILE.html"
    frameborder="0"
></iframe>
```

---

## Custom Skills

Slash commands live in `.claude/commands/`. Each `.md` file is a `/command-name` skill.

| Command | Description |
|---|---|
| `/ghl-embed` | Wraps a GitHub Pages URL in the full GHL iframe embed code |
| `/research-client` | Scrapes a client's website — returns structured context report for richer copy |
| `/write-copy` | Writes copy in the exact voice + structure of our best funnels (Charles, Wendy, Becca, Ignacio, Kimberely) |
| `/new-funnel` | Builds the full HTML funnel from copy + reference designs in `references/` |
| `/svg-design` | Generates custom inline SVGs — icons, wave dividers, decorative elements, illustrations |
| `/animate` | Adds the full animation layer — scroll triggers, counters, FAQ toggles, hover effects, form pulse |
| `/generate-bg` | Generates premium section backgrounds — CSS mesh gradients or Google Imagen images |
| `/generate-image` | Generates images with Google Imagen (nano banana) and optionally uploads to GHL |
| `/design-review` | Art director pass — audits every image, replaces bad ones, loops until premium |
| `/upload-to-ghl` | Uploads images from `uploads/` to GHL media library, returns CDN URLs |
| `/seo-optimize` | Meta tags, heading hierarchy, alt text, structured data, page speed signals |
| `/qa-master` | **Final check** — runs ALL 8 audit categories (copy, structure, visual, SVG, animations, SEO, code, mobile). Fixes everything. Returns "READY FOR CLIENT" report. |

## Recommended Funnel Workflow

| Step | Skill | What it does |
|---|---|---|
| 1 | `/research-client` | Scrape client's site for context |
| 2 | `/write-copy` | Write copy: voice + structure of our best funnels |
| 3 | `/new-funnel` | Build HTML from copy + reference screenshots |
| 4 | `/svg-design` | Add custom icons, wave dividers, decorative SVGs |
| 5 | `/animate` | Add full animation layer |
| 6 | `/generate-bg` | Generate backgrounds for each section |
| 7 | `/design-review` | Art director image pass |
| 8 | `/qa-master` | Full audit — copy, layout, SVG, animations, SEO, mobile. Fix everything. |
| 9 | `/live-test` | Simulates a real user on desktop + mobile — clicks nav, scrolls, opens FAQ, triggers animations, screenshots every state |
| 10 | `/ghl-embed` | Get the paste-ready embed code |

---

## Folder Conventions

| Folder | Purpose |
|---|---|
| `references/` | Drop premium funnel screenshots here for `/new-funnel` to use as reference |
| `uploads/` | Drop images here before running `/upload-to-ghl` |
| `.env` | API credentials — gitignored, never committed |
| `.env.example` | Template showing which keys are needed |
