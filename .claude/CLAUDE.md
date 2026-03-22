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
| `/new-funnel` | Builds a new HTML funnel using reference designs from `references/` |
| `/write-copy` | Writes funnel copy in the exact voice of our best funnels (Charles, Wendy, Becca, Ignacio) |
| `/research-client` | Scrapes a client's website and returns a structured context report for richer copy |
| `/upload-to-ghl` | Uploads images from `uploads/` to GHL media library, returns CDN URLs |
| `/generate-image` | Generates an image with Google Imagen (nano banana) and optionally uploads to GHL |
| `/generate-bg` | Generates premium section backgrounds — CSS mesh gradients or real images via Imagen |
| `/design-review` | Art director review — audits every image section by section, replaces bad ones, loops until premium |
| `/qa-check` | Screenshots the page with Puppeteer, reads it visually, fixes layout/spacing issues, loops until clean |
| `/seo-optimize` | Adds meta tags, fixes heading hierarchy, writes alt text, adds structured data, optimizes for rankings |

## Recommended Funnel Workflow

1. `/research-client` — scrape their existing site for context
2. `/write-copy` — write copy in the right voice using intake form + research
3. `/new-funnel` — build the HTML from copy + reference designs
4. `/generate-bg` — generate section backgrounds where needed
5. `/design-review` — art director pass on all images
6. `/qa-check` — layout/spacing/connector pass
7. `/seo-optimize` — meta tags, alt text, structured data
8. `/ghl-embed` — get the embed code ready to paste

---

## Folder Conventions

| Folder | Purpose |
|---|---|
| `references/` | Drop premium funnel screenshots here for `/new-funnel` to use as reference |
| `uploads/` | Drop images here before running `/upload-to-ghl` |
| `.env` | API credentials — gitignored, never committed |
| `.env.example` | Template showing which keys are needed |
