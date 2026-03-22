# Claude Code Instructions

## GitHub Pages Links
Whenever the user asks for a public link or GitHub Pages link, always return it as a full GHL iframe embed — never a bare URL. This is so they can paste it directly into GoHighLevel custom code elements.

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
