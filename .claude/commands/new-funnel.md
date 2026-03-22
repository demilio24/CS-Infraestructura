Build a new premium HTML funnel page.

## How to read the reference screenshots

The images in `references/` are presentation-style mockups, NOT literal page layouts. Each screenshot shows:

- A **decorative background** (dark gradient, shapes, blurs) — IGNORE this entirely
- **Multiple funnel sections** floating on top, arranged diagonally in an S-pattern, overlapping each other
- Each floating panel = a **real full-width section** of the actual funnel page

To extract the real design: mentally "unstack" the panels from top-right → center → bottom-left and treat each as a separate full-width section.

Design language across the references:
- Predominantly white or very light gray backgrounds with bold blue/color accents — this is a trust-first industry
- Oversized bold headlines with one italic/colored accent word
- Rounded pill CTA buttons, prominent, with arrow icon
- Rich visual variety — sections use background images, stat cards, illustrations, floating proof panels
- NO two sections look the same — alternate white, light gray, and blue backgrounds

---

## Page type rules

### VSL pages
- **NO navigation bar** — removes distraction, keeps focus on the video and form
- Hero is full-width, centered layout (not 2-column), video is the dominant element
- Survey/opt-in form goes directly below the video
- Survey must be **multi-step** (one question at a time, auto-advances on click, back navigation available)

### Standard landing pages / homepages
- Navigation bar with logo, links, and CTA button
- Hero is 2-column: headline+copy left, form right
- Form lives ONLY in the hero — never repeated elsewhere

---

## Hero background rule (MANDATORY)

A plain white hero is NEVER acceptable. Every hero must have visual depth. Choose ONE:

**Option A — Radial glow (default for white/light pages):**
```css
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 60% 0%, rgba(4,107,210,0.10) 0%, transparent 65%),
    radial-gradient(ellipse 40% 40% at 10% 80%, rgba(4,107,210,0.06) 0%, transparent 50%);
  pointer-events: none;
}
```

**Option B — Background image from client site (preferred if available):**
- Use a real photo from the client's website (from the research report's VISUAL ASSETS section)
- Add a white-to-transparent overlay so text stays readable:
```css
background: linear-gradient(to right, rgba(255,255,255,0.97) 40%, rgba(255,255,255,0.7) 70%, rgba(255,255,255,0.4) 100%),
            url('CLIENT_IMAGE_URL') center/cover no-repeat;
```

**Option C — Dark hero with image (for high-contrast sections):**
```css
background: linear-gradient(135deg, rgba(5,10,24,0.88) 0%, rgba(4,107,210,0.75) 100%),
            url('IMAGE_URL') center/cover no-repeat;
```

---

## Image sourcing rules (in priority order)

1. **Client's existing website** — always check the research report's VISUAL ASSETS section first. Real photos of the founder, team, awards, and work are far better than generated images.
2. **Generate with Google Imagen** — for sections where no real photo exists (problem illustrations, background scenes, lifestyle shots). Use `/generate-image` workflow.
3. **Unsplash fallback** — only if Imagen fails. Use the Unsplash API with a specific search query.

**Never leave a section without a visual.** Every section needs at least one: a background image, an illustration, an icon grid, a photo, a stat graphic, or a floating proof card.

**Visual requirement applies to ALL content sections** — including "Who We Are," "How It Works," "Problem" sections, and any section describing a system or process. Users read headlines + scan images. If a section has no visual, it will be skipped entirely. The only acceptable exception is a form or survey step.

**Copy density rule:** Most visitors will NOT read body paragraphs. Write headlines that stand alone and bullet points that communicate the result, not the feature. Remove any paragraph that could be deleted without losing a key point. Every word must earn its place — talk in terms of outcomes and results, not process or effort.

---

## Trust badge / credential pill rule (MANDATORY)

Every trust badge, logo, or image inside a pill/bar must have a **fixed height**. Never use raw `<img>` without constraining it.

```css
/* All images inside trust bars and credential pills */
.trust-item img,
.cred-item img {
  height: 22px;        /* fixed — never auto */
  width: auto;
  object-fit: contain;
  display: block;
}
```

All pill items must be the same height. Use `align-items: center` and consistent padding on the container. Test that the Trustpilot badge, text items, and icon items all render at the same height visually.

---

## Section transition rules

Transitions connect sections. The style must match the business personality. **Never apply a transition style meant for one niche to a different one.**

| Business type | Transition style |
|---|---|
| B2B agency, tech, finance, legal | Sharp diagonal cut OR clean gradient fade OR simple background color change (no waves) |
| Local service, family business, healthcare | Gentle organic wave (2 overlapping paths) |
| Fitness, energy brands | Medium bold wave or angular cut |
| Luxury, high-end | No wave — just a clean line or subtle drop shadow between sections |

**Default for B2B/agency pages:**
```html
<!-- Diagonal cut — clean and professional -->
<div style="background:{CURRENT_BG}; line-height:0; overflow:hidden;">
  <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style="display:block;width:100%;height:60px;">
    <polygon points="0,60 1440,0 1440,60" fill="{NEXT_BG_COLOR}"/>
  </svg>
</div>
```

---

## Results / social proof rule

**Never link users to a separate results page.** Embed results directly in the page. A user who clicks away to see proof is a lost conversion.

For VSL pages: include the full client testimonial video grid and review screenshots directly in the results section. Pull videos and review images from the client's existing proof assets (from research report).

Keep the results section **scannable** — users should be able to absorb credibility in 10 seconds without watching a video. Use:
- 3-column video grid (videos are the detail, not the hook)
- A masonry or horizontal scroll of review screenshots above/before the videos
- One bold stat bar: "100+ clients · 5.0 stars · $2M+ ad spend managed"

---

## Multi-step survey / form rules (VSL pages)

Single-page surveys convert worse. Use one question at a time:

```js
// Auto-advance: as soon as user selects an option, move to next question
document.querySelectorAll('.survey-option').forEach(opt => {
  opt.addEventListener('click', () => {
    // mark selected
    const name = opt.dataset.name;
    document.querySelectorAll(`[data-name="${name}"]`).forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    // auto-advance after 280ms (enough time to see the selection register)
    setTimeout(() => goToStep(currentStep + 1), 280);
  });
});
```

Requirements:
- Progress bar at top showing which step out of total
- Each question slides in from right, slides out to left (smooth, fast: 300ms)
- Back button visible from step 2 onward
- Final step after last question = submit button + reassurance copy
- On submit: inline success state (don't redirect), then CTA button to schedule a call

---

## Steps

1. **Gather info** — From the build pipeline context or from the user:
   - Client name (folder and filename)
   - Page type (VSL, homepage, landing page, thank you page)
   - Research report (has copy, images, branding)
   - GHL Form ID if applicable

2. **Check research report for visual assets** — Extract all image URLs categorized as founder, team, awards, results. Plan which image goes in which section.

3. **Generate missing visuals** — For sections without a real client image, invoke the `/generate-image` workflow. Generate at minimum: one hero background or section background, one about/founder visual if no real photo exists.

4. **Build the page** — Single-file HTML. Inline CSS + JS only. Fully responsive.
   - Apply hero background rule
   - Apply trust badge height rule
   - Apply transition style appropriate to the business type
   - Apply multi-step survey if VSL page
   - Embed results directly (no external links for proof)

5. **Save, push, return embed** — Git add, commit, push. Return the full GHL iframe embed code.
