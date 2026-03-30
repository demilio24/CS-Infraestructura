Run a thorough functional and mobile audit on an HTML page. This catches real-world bugs that visual QA misses: broken modals, iframe leaks, scroll issues, tap target problems, iOS quirks, and interactive element failures.

This is different from `/qa-master` (which checks copy, structure, SEO, code quality) and `/live-test` (which simulates a user journey). This skill specifically hunts for **bugs that break functionality on real devices**.

---

## AUDIT CATEGORIES

### 1. IFRAME & EMBED AUDIT

Check every `<iframe>` on the page:

- [ ] No iframe loads its `src` until it needs to be visible (use `src="about:blank"` + `data-src` for modals/lazy embeds)
- [ ] Hidden iframes have `visibility: hidden` on their container, not just `opacity: 0` or `display: none` (iOS Safari can leak form elements like `<select>` through opacity-hidden containers)
- [ ] GHL form embeds use the lazy-load pattern (script injected on first open, not on page load)
- [ ] Calendar embeds have sufficient `min-height` (at least 700px mobile, 820px desktop)
- [ ] No iframe has `scrolling="no"` if its content might exceed the container height on mobile

### 2. MODAL & OVERLAY AUDIT

Check every modal/overlay:

- [ ] Modal container uses `visibility: hidden` + `opacity: 0` when closed (not just opacity)
- [ ] Opening the modal sets `document.body.style.overflow = 'hidden'` to prevent background scroll
- [ ] Closing the modal removes the overflow lock (`document.body.style.removeProperty('overflow')`)
- [ ] Modal can be closed by: X button, backdrop click, Escape key
- [ ] On mobile (max-width 600px): modal goes full-screen (`width: 100%; height: 100%; border-radius: 0`)
- [ ] Modal body has `overflow-y: auto; -webkit-overflow-scrolling: touch` for scrollable content
- [ ] The `zoom` CSS trick for desktop forms is removed on mobile (`zoom: 1; width: 100%`)
- [ ] Modal iframe has enough height for the full form including country dropdowns and submit button

### 3. BUTTON & LINK AUDIT

Click every `<button>` and `<a>` on the page:

- [ ] Every CTA button triggers the correct action (opens modal, scrolls to section, etc.)
- [ ] No button triggers an unintended browser behavior (country dropdown, form submit, navigation)
- [ ] `<a href="javascript:void(0)">` buttons have `onclick` handlers that work
- [ ] No `<a>` tag has an empty `href=""` (causes page reload)
- [ ] All touch targets are minimum 44x44px on mobile
- [ ] Buttons inside dark sections have sufficient contrast
- [ ] No button text wraps awkwardly on mobile (check at 320px and 390px)

### 4. SCROLL & OVERFLOW AUDIT

Run horizontal overflow detection:

```js
// Puppeteer: detect any element causing horizontal overflow
const overflows = await page.evaluate(() => {
  const docWidth = document.documentElement.clientWidth;
  const results = [];
  document.querySelectorAll('*').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.right > docWidth + 2 || rect.left < -2) {
      results.push({
        tag: el.tagName,
        class: el.className.toString().substring(0, 50),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width)
      });
    }
  });
  return results;
});
```

- [ ] Zero elements overflow horizontally at 390px
- [ ] Zero elements overflow horizontally at 320px (iPhone SE)
- [ ] `overflow-x: hidden` is on `body`, not used as a band-aid on sections
- [ ] No fixed-width elements (e.g., `width: 500px`) without mobile overrides
- [ ] Scroll animations fire correctly (no permanently invisible sections)
- [ ] Sticky elements don't overlap content on mobile

### 5. iOS / SAFARI SPECIFIC AUDIT

- [ ] `<meta name="viewport">` includes `maximum-scale=1.0` if page has input fields (prevents iOS zoom on focus)
- [ ] No `position: fixed` elements inside scrollable containers (breaks on iOS)
- [ ] `-webkit-overflow-scrolling: touch` on all custom scroll containers
- [ ] Background `backdrop-filter` has `-webkit-backdrop-filter` prefix too
- [ ] `100vh` is not used for full-height layouts on iOS (use `100dvh` or JS fallback, as 100vh includes the Safari toolbar)
- [ ] Form `<select>` elements inside hidden iframes cannot be tapped through the overlay

### 6. VIDEO PLAYER AUDIT (if applicable)

- [ ] Video does not autoplay with sound (muted autoplay only)
- [ ] Unmute overlay appears and works on tap
- [ ] Play/pause works on mobile tap
- [ ] Progress bar is tappable on mobile (large enough hit area)
- [ ] Speed button cycles correctly
- [ ] Fullscreen works on mobile
- [ ] Video controls show on hover (desktop) and pause state (mobile)

### 7. FORM & CHECKOUT FLOW AUDIT

- [ ] Checkout/booking form is reachable and submittable on mobile
- [ ] Form fields don't get cut off by modal boundaries
- [ ] Country/state dropdowns open correctly on mobile (not clipped)
- [ ] Submit button is visible without scrolling past the fold in the modal
- [ ] After form submission, redirect works correctly
- [ ] Payment form (if embedded) loads Stripe/payment fields correctly

### 8. CROSS-PAGE FLOW AUDIT (if multiple pages)

- [ ] Purchase page → onboarding page: email parameter passes via URL
- [ ] Calendar page loads and displays the booking widget
- [ ] Back/forward browser navigation doesn't break page state
- [ ] Modal state resets on page reload (not stuck open)

---

## HOW TO RUN

1. Read the HTML file to understand the page structure.

2. Launch Puppeteer at both 1280px (desktop) and 390px (mobile).

3. For each category, run the checks programmatically where possible:
   - Use `page.evaluate()` to test DOM state
   - Use `page.click()` to test interactions
   - Screenshot before/after each interaction
   - Read screenshots to visually verify

4. For each failure:
   - Note the category, specific check, and what's wrong
   - Fix it immediately in the HTML
   - Re-test to confirm the fix

5. Return a report:

```
FUNCTIONAL AUDIT REPORT
========================
Iframes & Embeds:    PASS (X issues fixed)
Modals & Overlays:   PASS (X issues fixed)
Buttons & Links:     PASS (X issues fixed)
Scroll & Overflow:   PASS (X issues fixed)
iOS / Safari:        PASS (X issues fixed)
Video Player:        PASS / N/A
Forms & Checkout:    PASS (X issues fixed)
Cross-Page Flow:     PASS / N/A

TOTAL FIXES: X
STATUS: SHIP IT
```

---

## KEY PRINCIPLE

This audit catches bugs that only appear on real devices. If you can't test something in Puppeteer (e.g., iOS-specific behavior), check the code for known patterns that cause issues and apply the fix preventatively. It's better to fix a potential iOS bug than to ship it and find out on a client's phone.
