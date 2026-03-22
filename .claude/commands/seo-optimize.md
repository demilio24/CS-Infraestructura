Optimize a funnel HTML file for search engines. Go through every SEO element — meta tags, image alt text, image filenames, headings, structured data, page speed signals — and make sure the page is set up to rank and get found.

---

## SEO CHECKLIST

### 1. Meta Tags
Verify and update in the `<head>`:

```html
<!-- Primary -->
<title>[Primary Keyword] | [Business Name] | [City, State]</title>
<meta name="description" content="[150-160 chars. Lead with the primary keyword. Include location. End with a soft CTA.]">
<link rel="canonical" href="[Full page URL]">

<!-- Open Graph (for social sharing and GHL previews) -->
<meta property="og:title" content="[Same as title tag]">
<meta property="og:description" content="[Same as meta description]">
<meta property="og:image" content="[Hero image URL — 1200x630 ideally]">
<meta property="og:url" content="[Full page URL]">
<meta property="og:type" content="website">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="[Same as title]">
<meta name="twitter:description" content="[Same as meta description]">
<meta name="twitter:image" content="[Hero image URL]">
```

Rules:
- Title: 50-60 characters max. Format: `[Service] in [City] | [Business Name]`
- Description: 150-160 characters. Must include primary keyword and location naturally.
- Never stuff keywords. Write for humans first.

---

### 2. Heading Hierarchy
- One `<h1>` per page only — the hero headline. Must contain the primary keyword.
- `<h2>` for section headlines. Should include secondary keywords naturally.
- `<h3>` for card titles and sub-sections.
- Never skip levels (no h1 → h3).
- Verify the hierarchy is correct and audit any violations.

---

### 3. Image Optimization

For every `<img>` tag on the page:

**Alt text rules:**
- Describe what is actually in the image, plus context
- Include the primary keyword naturally where relevant — not forced
- Never: `alt=""`, `alt="image"`, `alt="photo"`, `alt="hero"`
- Good: `alt="Swim instructor teaching child backstroke at LowCountry Swim School in Charleston SC"`
- Good: `alt="Charles Taylor, veteran-owned mobile notary serving Miami-Dade County"`

**Filename recommendations (report only — can't rename CDN files):**
- If images are local files, rename: `founder-photo.jpg` not `IMG_4523.jpg`
- Format: `[what-it-shows]-[business-name]-[city].jpg`
- Report what CDN filenames should be named ideally

**Lazy loading:**
- All images below the fold should have `loading="lazy"`
- Hero image should NOT have `loading="lazy"` — it must load immediately

---

### 4. Structured Data (JSON-LD)

Add a `<script type="application/ld+json">` block to the `<head>`. Choose the right schema type:

**Local Business (default for most clients):**
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "[Business Name]",
  "description": "[1-2 sentence description]",
  "url": "[Page URL]",
  "telephone": "[Phone]",
  "email": "[Email]",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[Street]",
    "addressLocality": "[City]",
    "addressRegion": "[State]",
    "postalCode": "[ZIP]",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "[lat]",
    "longitude": "[lng]"
  },
  "openingHours": "[Mo-Fr 09:00-17:00]",
  "priceRange": "$$",
  "image": "[Hero image URL]",
  "sameAs": ["[Instagram URL]", "[Facebook URL]", "[Google Business URL]"]
}
```

For swim schools, notaries, coaches: use `"@type": "SportsClub"`, `"NotaryPublic"`, or `"ProfessionalService"` as appropriate.

---

### 5. Page Speed Signals
Check and fix:
- All `<img>` tags have explicit `width` and `height` attributes (prevents layout shift)
- No render-blocking scripts in `<head>` (move to bottom of body or add `defer`)
- Google Fonts uses `display=swap` in the import URL
- No duplicate CSS or JS includes

---

### 6. Internal Linking
- If the page references other services or pages, link to them with descriptive anchor text
- Never use "click here" as anchor text — use descriptive text like "our adaptive swim program"

---

## Steps

1. Read the HTML file.
2. Go through every checklist item above.
3. Make all fixes directly in the file.
4. Report what was changed in a clean summary:
   - Title tag: old → new
   - Meta description: old → new
   - Images updated: how many alt texts fixed
   - Structured data: added/updated
   - Heading issues: what was fixed
   - Speed fixes: what was changed
5. Commit and push. Return the GHL embed code.
