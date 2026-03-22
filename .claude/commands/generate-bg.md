Generate a premium background for a funnel section — either as pure CSS or as a real image via Google Imagen.

## When to use which method

- **CSS** (default, instant, no API needed): mesh gradients, radial glows, noise textures, diagonal splits, animated particles, geometric patterns
- **Imagen** (when CSS won't cut it): photorealistic scenes, complex illustrations, textured backgrounds that need to feel like real photography

---

## CSS Background Patterns (use these first)

### Dark mesh gradient (most common in references)
```css
background: radial-gradient(ellipse at 20% 50%, #1a0a3c 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, #0d2b5e 0%, transparent 55%),
            radial-gradient(ellipse at 60% 80%, #0a1628 0%, transparent 50%),
            #050a18;
```

### Gold/black (luxury, finance niches)
```css
background: radial-gradient(ellipse at 30% 40%, #2a1a00 0%, transparent 60%),
            radial-gradient(ellipse at 70% 70%, #1a0f00 0%, transparent 50%),
            #0a0600;
```

### Noise texture overlay (add grain/depth)
```css
background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
```

### Smooth section connector (SVG wave between sections)
```html
<div style="position:relative; margin-bottom:-2px;">
  <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style="display:block;width:100%;height:80px;">
    <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="{NEXT_SECTION_COLOR}"/>
  </svg>
</div>
```

---

## Steps

1. **Ask the user:**
   - Which section(s) need a background?
   - What niche/feel? (dark tech, luxury gold, health/green, light professional, etc.)
   - CSS only or generate a real image?

2. **If CSS:** Pick the best pattern(s) from above, combine them, and apply directly to the section. Add a noise overlay for premium texture.

3. **If Imagen:** Follow the `/generate-image` workflow to create the background image, then apply it with:
   ```css
   background: url('{CDN_URL}') center/cover no-repeat;
   ```
   Layer a semi-transparent overlay on top to keep text readable:
   ```css
   background: linear-gradient(rgba(5,10,24,0.75), rgba(5,10,24,0.75)),
               url('{CDN_URL}') center/cover no-repeat;
   ```

4. **Always check:** After applying, flag this section for `/qa-check` to confirm it looks right.
