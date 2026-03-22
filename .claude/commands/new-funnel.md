Build a new premium HTML funnel page.

## Steps

1. **Gather info** — Ask the user:
   - Client name (used for folder and filename)
   - Page type (e.g. homepage, landing page, thank you page, proof page)
   - Mode: "recreate" (pixel-perfect match to reference) or "inspire" (use reference style for new content)
   - Any copy/content to include (headline, subheadline, bullet points, CTA text, etc.)

2. **Read references** — Use the Read tool to visually inspect all images in the `references/` folder. Analyze:
   - Layout structure (sections, spacing, hierarchy)
   - Color palette
   - Typography style (font weights, sizes, capitalization)
   - UI components (cards, buttons, badges, testimonials, etc.)
   - Overall tone and feel

3. **Build the page** — Create a single-file HTML page (`ClientName/page-name.html`) that:
   - Matches or is inspired by the reference quality
   - Uses inline CSS (no external frameworks)
   - Is fully responsive (mobile + desktop)
   - Loads fast (no unnecessary dependencies)
   - Uses Google Fonts if needed
   - Images should use GHL CDN URLs if available, otherwise use placeholder URLs

4. **Save, push, and return embed** — After writing the file:
   - Git add, commit, and push to GitHub
   - Return the full GHL iframe embed code (per the ghl-embed format in CLAUDE.md) with the GitHub Pages URL filled in
