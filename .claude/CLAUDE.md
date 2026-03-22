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
| `/upload-to-ghl` | Uploads images from `uploads/` to GHL media library, returns CDN URLs |
| `/generate-image` | Generates an image with Google Imagen (nano banana) and optionally uploads to GHL |

---

## Folder Conventions

| Folder | Purpose |
|---|---|
| `references/` | Drop premium funnel screenshots here for `/new-funnel` to use as reference |
| `uploads/` | Drop images here before running `/upload-to-ghl` |
| `.env` | API credentials — gitignored, never committed |
| `.env.example` | Template showing which keys are needed |
