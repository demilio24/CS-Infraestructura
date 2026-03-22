Build a new premium HTML funnel page.

## How to read the reference screenshots

The images in `references/` are presentation-style mockups, NOT literal page layouts. Each screenshot shows:

- A **decorative background** (dark gradient, shapes, blurs) — IGNORE this entirely, it is not part of the funnel
- **Multiple funnel sections** floating on top, arranged diagonally in an S-pattern, overlapping each other
- Each floating panel = a **real full-width section** of the actual funnel page

To extract the real design: mentally "unstack" the panels from top-right → center → bottom-left and treat each as a separate full-width section. The actual funnel is wide — these panels just look narrow because they're scaled down and overlapping in the mockup.

Common section patterns seen across the references:
- Hero: bold oversized headline + subtext + video thumbnail with play button + CTA button
- Trust bar: Trustpilot stars, logos, review counts
- Proof panels: floating result screenshots (Stripe dashboards, stat cards, testimonials)
- Benefits/features: icon + label + short description in card grid
- Social proof: testimonial quotes or faces with results
- Order/checkout form: name, payment fields, CTA button
- CTA sections: large bold repeated call-to-action with urgency copy

Design language across the references:
- Dark high-contrast backgrounds (navy, black, deep purple) with bold accent colors (gold, electric blue, green, cyan)
- Oversized bold headlines, sometimes with one italic/colored accent word
- Rounded pill CTA buttons, prominent, often with arrow icon
- Floating "proof" cards overlaid on hero images
- Rich section variety — no two sections look the same

---

## Steps

1. **Gather info** — Ask the user:
   - Client name (used for folder and filename)
   - Page type (homepage, landing page, VSL page, thank you page, proof page, opt-in page)
   - Which reference numbers to draw from (or "all of them")
   - Mode: "recreate" (match a specific reference as closely as possible) or "inspire" (use the reference style with new content)
   - Copy/content: headline, subheadline, bullet points, CTA text, any specific images or colors

2. **Read references** — Use the Read tool to visually inspect the specified reference images. Remember to ignore the decorative background and unstack the S-pattern panels into individual sections.

3. **Build the page** — Create a single-file HTML page (`ClientName/page-name.html`) that:
   - Matches the premium quality level of the references
   - Uses inline CSS only (no external frameworks)
   - Is fully responsive (mobile + desktop)
   - Loads fast (no unnecessary dependencies)
   - Uses Google Fonts if needed
   - Images use GHL CDN URLs if available, otherwise tasteful placeholder images

4. **Save, push, and return embed** — After writing the file:
   - Git add, commit, and push to GitHub
   - Return the full GHL iframe embed code (per the ghl-embed format in CLAUDE.md) with the GitHub Pages URL filled in
