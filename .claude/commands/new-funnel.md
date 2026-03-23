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
- Hero is full-width, centered layout (not 2-column)
- **Video goes INSIDE the hero** — below the headline and CTA button, same max-width as the rest of the hero. NOT in a separate section below.
- Survey/opt-in form goes at the bottom of the page (linked from CTA buttons), NOT directly below the video
- Survey must be **multi-step** (one question at a time, auto-advances on click, back navigation available)
- Trust bar goes BELOW the hero, with exactly 3 pills using the client's real numbers. **Order by impact: ad spend or revenue generated first, star rating second, clients served last.** The strongest proof point always leads. Never use generic icons or vague claims.

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

**Option C — Dark navy hero with blue corner glows (for VSL pages / high-authority feel):**
Use this when the brand needs to feel premium and trustworthy. White text, arc decoration at top, fades to white at bottom to connect seamlessly with the next section.
```css
.hero {
  background:
    linear-gradient(180deg, transparent 40%, rgba(255,255,255,0.55) 78%, #ffffff 100%),
    radial-gradient(ellipse 65% 80% at 0%   0%, rgba(4,107,210,0.80) 0%, transparent 55%),
    radial-gradient(ellipse 65% 80% at 100% 0%, rgba(4,107,210,0.80) 0%, transparent 55%),
    #030d1c;
  overflow: hidden;
}
/* Decorative arc ring at top */
.hero::before {
  content: '';
  position: absolute;
  top: -320px; left: 50%;
  transform: translateX(-50%);
  width: 860px; height: 660px;
  border-radius: 50%;
  border: 1px solid rgba(4,107,210,0.28);
  box-shadow: 0 0 0 36px rgba(4,107,210,0.04), 0 0 0 72px rgba(4,107,210,0.025);
  pointer-events: none; z-index: 0;
}
/* Dot grid */
.hero::after {
  content: '';
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px);
  background-size: 32px 32px;
  pointer-events: none; z-index: 0;
}
```
⚠️ **Section connection rule:** The bottom fade to white (`linear-gradient` layer) is what makes the hero connect cleanly to the next white section. Always include it on dark heroes. Never use floating shapes or "bubble" elements to bridge sections — they look disconnected and cheap. Gradient fades are the correct solution.

---

## Image sourcing rules (in priority order)

1. **Client's existing website** — always check the research report's VISUAL ASSETS section first. Real photos of the founder, team, awards, and work are far better than generated images.
2. **Generate with Google Imagen** — for sections where no real photo exists (problem illustrations, background scenes, lifestyle shots). Use `/generate-image` workflow.
3. **Unsplash fallback** — only if Imagen fails. Use the Unsplash API with a specific search query.

**Never leave a section without a visual.** Every section needs at least one: a background image, an illustration, an icon grid, a photo, a stat graphic, or a floating proof card.

**Review/testimonial grid rule:** All review screenshot images MUST use a uniform `aspect-ratio` CSS property (e.g. `aspect-ratio: 4/3`) with `object-fit: cover`. Never display review images at their natural size — they will all be different sizes and the grid will look broken.

**Video testimonials rule:** Never use bare `<video>` tags without a custom play button overlay. Always wrap each video in a card with:
- A dark overlay div with a centered blue play button circle
- `onclick="playVid(this)"` — clicking removes the overlay and plays the video
- `preload="none"` to avoid loading all videos at once

**About/founder photo rule:** Use `object-fit: contain` (NOT `cover`) with `object-position: center` so the full photo is visible — cropping with `cover` cuts off important parts of the image (awards, plaques, context).

**Hero logo watermark:** For white-on-transparent PNG logos, use: `filter: brightness(0) sepia(1) saturate(5) hue-rotate(195deg); opacity: 0.055;` to render a blue watermark effect.

**Fire badge phrasing:** The fire badge should wrap the FULL highlighted phrase (e.g. "4x more clients"), not just the number. The asterisk appears as a superscript inside the badge.

**NO fire/flame text effects.** SVG turbulence filters or glow effects on headline words are explicitly rejected — they look terrible. To emphasize a phrase in the headline, use a solid underline + JS tooltip instead:
```css
.fire-text {
  text-decoration: underline; text-decoration-style: solid;
  text-decoration-color: rgba(255,255,255,0.50); text-underline-offset: 5px;
  text-decoration-thickness: 1.5px; cursor: default;
}
```

**Tooltip rule (MANDATORY — never use CSS `::after` tooltips inside headlines):** CSS pseudo-element tooltips inside `h1` escape the stacking context and overlap surrounding content. ALWAYS use a JS-injected body-level tooltip:
```js
(function() {
  const tip = document.createElement('div');
  tip.id = 'global-tip';
  document.body.appendChild(tip);
  document.querySelectorAll('[data-tip]').forEach(el => {
    el.addEventListener('mouseenter', function() {
      tip.textContent = this.dataset.tip;
      const r = this.getBoundingClientRect();
      const tipW = 280;
      let left = r.left + r.width / 2 - tipW / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - tipW - 8));
      tip.style.left = left + 'px';
      tip.style.top = (r.top - 16) + 'px';
      tip.style.transform = 'translateY(-100%)';
      tip.classList.add('visible');
    });
    el.addEventListener('mouseleave', () => tip.classList.remove('visible'));
  });
})();
```
```css
#global-tip {
  position: fixed; z-index: 99999; width: 280px;
  background: #1a1a2e; border-radius: 12px; padding: 14px 16px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.50);
  font-size: 13px; color: rgba(255,255,255,0.90); line-height: 1.6;
  pointer-events: none; opacity: 0; transition: opacity 0.15s ease;
}
#global-tip.visible { opacity: 1; }
#global-tip::before {
  content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
  border: 6px solid transparent; border-top-color: #1a1a2e;
}
```

**Visual requirement applies to ALL content sections** — including "Who We Are," "How It Works," "Problem" sections, and any section describing a system or process. Users read headlines + scan images. If a section has no visual, it will be skipped entirely. The only acceptable exception is a form or survey step.

**Headline line-break rule:** Use `<span class="h1-line">` with `display: block` to enforce exact line breaks at specific words — never rely on the viewport to produce the right wrap. This guarantees the headline always reads as intended:
```css
.h1-line { display: block; }
```
```html
<h1 class="hero-h1">
  <span class="h1-line">First line of the headline here</span>
  <span class="h1-line">Second line of the headline here</span>
</h1>
```
Set `hero-inner` to `max-width: 1400px` on VSL pages so longer headlines have room at large viewports.

**Bullet point style (VSL hero sub-copy):** Stack vertically, center-aligned, with a small solid dot `::before`. No em-dashes — they look like lazy typography. Each point should be outcome-focused and concise (under 12 words):
```css
.hero-sub-grid {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; max-width: 700px; margin: 0 auto 32px; text-align: center;
}
.hero-sub-grid .sub-item {
  font-size: 15px; font-weight: 500; color: rgba(255,255,255,0.82);
  line-height: 1.4; display: flex; align-items: center; gap: 8px;
}
.hero-sub-grid .sub-item::before {
  content: ''; width: 5px; height: 5px; border-radius: 50%;
  background: rgba(255,255,255,0.55); flex-shrink: 0;
}
```

**Copy density rule:** Most visitors will NOT read body paragraphs. Write headlines that stand alone and bullet points that communicate the result, not the feature. Remove any paragraph that could be deleted without losing a key point. Every word must earn its place — talk in terms of outcomes and results, not process or effort.

---

## Font system rule (MANDATORY)

Every funnel must use a deliberate 3-font system. Default:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,600;1,700&display=swap" rel="stylesheet" />
```
```css
:root {
  --font-main:      'Google Sans', 'DM Sans', sans-serif;
  --font-secondary: 'DM Sans', 'Google Sans', sans-serif;
  --font-emphasis:  'Instrument Sans', 'Google Sans', sans-serif;
}
body { font-family: var(--font-main); }
/* Headlines, badges, CTAs, stats — emphasis font */
h1, h2, h3, h4, .hero-eyebrow, .btn, .hero-cta-full,
.step-num, .faq-num, .hero-proof-num, .vid-result-stat { font-family: var(--font-emphasis); }
/* Body copy, labels, bullets — secondary font */
.hero-sub, .hero-sub-grid .sub-item, .hero-proof-label,
.hero-disclaimer, p, li { font-family: var(--font-secondary); }
```

---

## CTA button rule

Blue pill button, gradient fill, gloss overlay, animated arrow circle. Never use a plain flat button:

```css
.hero-cta-full {
  display: inline-flex; align-items: center; gap: 12px;
  padding: 20px 48px;
  background: linear-gradient(135deg, #1a72e8 0%, #046bd2 50%, #0358b0 100%);
  color: #fff; font-family: var(--font-emphasis); font-size: 18px; font-weight: 700;
  border-radius: 100px; border: none; cursor: pointer;
  transition: transform 0.15s, box-shadow 0.2s, filter 0.2s;
  box-shadow: 0 8px 32px rgba(4,107,210,0.55), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2);
  position: relative; overflow: hidden;
}
.hero-cta-full::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 60%);
  border-radius: inherit; pointer-events: none;
}
.hero-cta-full:hover { transform: translateY(-3px); filter: brightness(1.06); }
.hero-cta-full .cta-arrow {
  width: 34px; height: 34px; border-radius: 50%;
  background: rgba(255,255,255,0.18);
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s, transform 0.2s;
}
.hero-cta-full:hover .cta-arrow { background: rgba(255,255,255,0.28); transform: translateX(3px); }
```

---

## Proof card rule (hero stat cards)

Dark navy glass, white numbers, muted labels. **Do not use white glass or light backgrounds** — dark glass reads better against a dark hero and feels more premium:

```css
.hero-proof-item {
  background: rgba(3, 18, 60, 0.60);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border-radius: 20px; padding: 18px 14px;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  flex: 1; text-align: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.35);
  position: relative;
}
.hero-proof-num { font-size: 32px; font-weight: 800; color: #fff; line-height: 1; letter-spacing: -0.03em; }
.hero-proof-label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.65); line-height: 1.3; }
```

**Cursor-light border effect on cards (MANDATORY for proof cards):** Light follows the cursor along the card border. Never darken the background — border glow only. Uses a JS-injected child div with `mask-composite: exclude`.

⚠️ **The `padding-box`/`border-box` CSS gradient border trick does NOT work with `backdrop-filter`** — `backdrop-filter` creates a stacking context that blocks it. Always use the JS-injected approach instead:

```css
.proof-border-glow {
  position: absolute; inset: 0; border-radius: 20px;
  pointer-events: none; z-index: 0;
  background: radial-gradient(
    140px circle at var(--cx, 50%) var(--cy, 50%),
    rgba(255,255,255,0.65), rgba(255,255,255,0.06) 70%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask:         linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: destination-out;
  mask-composite: exclude;
  padding: 1px; opacity: 0; transition: opacity 0.3s ease;
}
.hero-proof-item:hover .proof-border-glow { opacity: 1; }
.hero-proof-item > *:not(.proof-border-glow) { position: relative; z-index: 1; }
```
```js
document.querySelectorAll('.hero-proof-item').forEach(card => {
  const glow = document.createElement('div');
  glow.className = 'proof-border-glow';
  card.appendChild(glow);
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    glow.style.setProperty('--cx', (e.clientX - r.left) + 'px');
    glow.style.setProperty('--cy', (e.clientY - r.top) + 'px');
  });
  card.addEventListener('mouseleave', () => {
    glow.style.setProperty('--cx', '50%');
    glow.style.setProperty('--cy', '-50px');
  });
});
```
The border glow is `opacity: 0` by default and only appears on hover — never visible at rest.

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

## Screenshot rule (MANDATORY)

**Always take a Puppeteer screenshot after every significant change.** Do not wait for the user to report a visual problem — catch it yourself first. Run screenshots at minimum:
- After building the initial page
- After each major section update
- After any CSS layout or background change

```js
// Quick screenshot helper — run this after every edit
const puppeteer = require('puppeteer');
(async () => {
  const b = await puppeteer.launch({args:['--no-sandbox']});
  const p = await b.newPage();
  await p.setViewport({width:1440, height:900});
  await p.goto('file:///PATH/TO/FILE.html', {waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,2000));
  await p.screenshot({path:'qa-screenshots/check.png'});
  // Scroll to 40% and 80% to check mid and bottom
  await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight*0.4));
  await new Promise(r=>setTimeout(r,600));
  await p.screenshot({path:'qa-screenshots/check-mid.png'});
  await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight*0.8));
  await new Promise(r=>setTimeout(r,600));
  await p.screenshot({path:'qa-screenshots/check-bot.png'});
  await b.close();
})();
```

Save screenshots to `qa-screenshots/`. If something looks broken, fix it before reporting back to the user.

---

## Funnel swiper rule (for "How It Works" / client portfolio sections)

Use a Tinder-style card swiper to show client funnel screenshots. Key rules:
- `overflow-y: auto` on slides (not `overflow: hidden`) — users scroll inside each card to see the full funnel
- `height: auto` on images (not `object-fit: cover`) — never clip the funnel screenshot
- Track height `520px` gives enough room without being too tall
- Show prev/next peeking cards at reduced opacity

```css
.funnel-slide { overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; }
.funnel-slide img { width: 100%; height: auto; display: block; }
```

---

## FAQ section rule

Dark background (blue gradient), number badges on each question, blue glow on open state:
```css
.faq { background: linear-gradient(160deg, #030d1c 0%, #062b6e 55%, #0447a8 100%); }
.faq-item.open { border-color: rgba(4,107,210,0.7); box-shadow: 0 0 32px rgba(4,107,210,0.22); }
```
Add numbered badges (`<span class="faq-num">1</span>`) before each question text. The number badge turns solid blue when the item is open.

---

## Section transition rules

Transitions connect sections. Use clean background color alternation as the primary transition method. Diagonal SVG cuts have been explicitly rejected by the client — do not use them.

| Business type | Transition style |
|---|---|
| B2B agency, tech, finance, legal | **Simple background color change** — alternate white, light gray (#f5f7fa), and blue. No SVG shapes. |
| Local service, family business, healthcare | Gentle organic wave (2 overlapping paths) between sections |
| Fitness, energy brands | Medium bold wave or angular cut |
| Luxury, high-end | No wave — just a clean 1px border or subtle drop shadow |

**Default B2B section pattern (alternate these backgrounds):**
- White (#fff) → Light gray (#f5f7fa) → White → Blue (var(--blue)) → White → Light gray

The background color change itself IS the transition. No SVG dividers needed for B2B pages.

---

## Results / social proof rule

**Never link users to a separate results page.** Embed results directly in the page. A user who clicks away to see proof is a lost conversion.

For VSL pages: include the full client testimonial video grid and review screenshots directly in the results section. Pull videos and review images from the client's existing proof assets (from research report).

Keep the results section **scannable** — users should be able to absorb credibility in 10 seconds without watching a video. Use:
- **2-column video grid** — 3 columns is too wide and cards become unreadable. 2-col at `aspect-ratio: 4/5`.
- Max **6 review screenshots** — more than 6 makes the grid feel overwhelming and cheap. Use `height: 280px` cells so the text is actually legible.
- A result stat bar overlaid at the bottom of each video card (e.g. "12x ROI · in the first 60 days") — gives non-watchers a reason to care.
- Pulsing play button animation so cards look alive even before interaction.
- One bold stat bar: "100+ clients · 5.0 stars · $2M+ ad spend managed"

**Video card template:**
```html
<div class="vid-card" onclick="playVid(this)">
  <video preload="none" loop playsinline><source src="URL" type="video/mp4"/></video>
  <div class="vid-overlay">
    <div class="vid-play-circle">▶</div>
    <div class="vid-overlay-stars">★★★★★</div>
  </div>
  <div class="vid-result-bar">
    <div class="vid-result-stat">RESULT STAT</div>
    <div class="vid-result-desc">context line</div>
  </div>
</div>
```

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
