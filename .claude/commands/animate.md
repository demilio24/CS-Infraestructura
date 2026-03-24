Add a polished, premium CSS animation layer to a funnel page. Every section gets intentional motion that makes the page feel alive without being distracting.

---

## ANIMATIONS TO IMPLEMENT

### 1. Scroll-Triggered Fade-Up (ALL sections, ALL cards)

Every section content and card fades up as it enters the viewport.

```css
.animate-on-scroll {
  opacity: 0;
  transform: translateY(28px);
  transition:
    opacity 0.55s ease,
    transform 0.55s ease;
}
.animate-on-scroll.visible {
  opacity: 1;
  transform: translateY(0);
}
.delay-1 {
  transition-delay: 0.1s;
}
.delay-2 {
  transition-delay: 0.2s;
}
.delay-3 {
  transition-delay: 0.3s;
}
.delay-4 {
  transition-delay: 0.4s;
}
.delay-5 {
  transition-delay: 0.5s;
}
.delay-6 {
  transition-delay: 0.6s;
}
```

```js
// Single IntersectionObserver for all animate-on-scroll elements
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 },
);
document
  .querySelectorAll(".animate-on-scroll")
  .forEach((el) => observer.observe(el));
```

Add `.animate-on-scroll` to: section headers, all cards, all process steps, testimonials, gallery items, about content.
Add `.delay-1` through `.delay-6` to stagger grid items.

---

### 2. Counter Animation (stat numbers)

Numbers animate from 0 to their target value when they enter the viewport.

```js
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const suffix = el.dataset.suffix || "";
  const duration = 1800;
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.floor(ease * target) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
// Trigger on scroll into view — use the same IntersectionObserver
// Add data-target="100" data-suffix="+" to stat number elements
```

---

### 3. Navbar Shadow on Scroll

```js
window.addEventListener("scroll", () => {
  document
    .querySelector("nav")
    .classList.toggle("scrolled", window.scrollY > 20);
});
// CSS: nav.scrolled { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
```

---

### 4. Hero Form Pulse (when any in-page CTA is clicked)

When any button linking to #hero is clicked, after 800ms scroll delay, pulse the form card.

```js
document.querySelectorAll('a[href="#hero"]').forEach((link) => {
  link.addEventListener("click", () => {
    setTimeout(() => {
      const form = document.querySelector(".hero-form-card");
      if (form) {
        form.classList.add("form-highlight");
        setTimeout(() => form.classList.remove("form-highlight"), 2000);
      }
    }, 800);
  });
});
```

```css
@keyframes formPulse {
  0% {
    box-shadow:
      0 24px 64px rgba(0, 0, 0, 0.3),
      0 0 0 0px rgba(var(--color-primary-rgb), 0.5);
  }
  50% {
    box-shadow:
      0 24px 64px rgba(0, 0, 0, 0.3),
      0 0 0 14px rgba(var(--color-primary-rgb), 0);
  }
  100% {
    box-shadow:
      0 24px 64px rgba(0, 0, 0, 0.3),
      0 0 0 0px rgba(var(--color-primary-rgb), 0);
  }
}
.hero-form-card.form-highlight {
  animation: formPulse 1.6s ease-out;
  border: 2px solid var(--color-primary);
}
```

---

### 5. Hero Accent Word — Animated Gradient Text

The one key accent word in the H1 gets a subtle animated gradient.

```css
@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
.hero-accent-word {
  background: linear-gradient(
    135deg,
    var(--color-primary),
    var(--color-accent),
    var(--color-primary)
  );
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient-shift 4s ease infinite;
}
```

Apply to ONE word only in the H1 — never in body sections.

### 5b. Hero Stat Badge — Fire / Emphasis Effect (use when a bold stat is the headline anchor)

When a key stat or number needs to feel visceral and high-energy (e.g. "4x", "10x", "#1"), wrap it in a badge with a fire/glow animation instead of a plain gradient:

```html
<span
  class="fire-badge"
  data-tooltip="On average, our websites get a 4x higher conversion rate than the industry average."
>
  4x
  <span class="fire-badge-asterisk">*</span>
</span>
```

```css
.fire-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  padding: 4px 14px 4px 12px;
  border-radius: 8px;
  position: relative;
  cursor: default;
  box-shadow: 0 0 0 0 rgba(var(--color-primary-rgb), 0.5);
  animation: fire-pulse 2.5s ease-in-out infinite;
}
@keyframes fire-pulse {
  0%,
  100% {
    box-shadow:
      0 0 0 0 rgba(var(--color-primary-rgb), 0.5),
      0 0 16px 2px rgba(var(--color-primary-rgb), 0.3);
  }
  50% {
    box-shadow:
      0 0 0 8px rgba(var(--color-primary-rgb), 0),
      0 0 32px 8px rgba(var(--color-primary-rgb), 0.5);
  }
}
.fire-badge-asterisk {
  font-size: 0.65em;
  vertical-align: super;
  opacity: 0.85;
}
/* Tooltip on hover */
.fire-badge::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: #0a0a0a;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  padding: 10px 14px;
  border-radius: 8px;
  white-space: nowrap;
  max-width: 280px;
  white-space: normal;
  width: 260px;
  text-align: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  z-index: 100;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}
.fire-badge:hover::after {
  opacity: 1;
}
```

Use this pattern whenever a bold outcome stat is the centerpiece of the headline.

---

### 6. Card Hover Micro-Interactions

```css
.card {
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}
.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.14);
}
/* NEVER use translateX or diagonal movement on hover */
```

---

### 7. Button Hover

```css
.btn {
  transition: all 0.2s ease;
}
.btn-primary:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
```

---

### 8. FAQ / Accordion Toggle

⚠️ **NEVER use `max-height` for accordion animation.** It creates unequal open/close speeds because the transition always animates to `400px` even if the content is only `80px` tall — open feels slow, close feels instant. Always use real `height` driven by `scrollHeight`.

```css
.faq-answer {
  height: 0;
  overflow: hidden;
  transition: height 0.32s cubic-bezier(0.4, 0, 0.2, 1);
}
.faq-icon {
  transition: transform 0.3s ease;
}
.faq-item.open .faq-icon {
  transform: rotate(45deg);
}
.faq-item.open {
  border-color: var(--color-primary);
}
```

```js
// Height-matched accordion — open and close travel the same distance
document.querySelectorAll(".faq-question").forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".faq-item");
    const ans = item.querySelector(".faq-answer");
    const isOpen = item.classList.contains("open");

    // Close all open items
    document.querySelectorAll(".faq-item.open").forEach((openItem) => {
      const a = openItem.querySelector(".faq-answer");
      a.style.height = a.scrollHeight + "px"; // pin auto → px before animating
      openItem.classList.remove("open");
      a.offsetHeight; // force reflow
      a.style.height = "0px";
    });

    // Open clicked item (only if it wasn't already open)
    if (!isOpen) {
      const target = ans.scrollHeight;
      ans.style.height = "0px";
      item.classList.add("open");
      ans.offsetHeight; // force reflow
      ans.style.height = target + "px";
      ans.addEventListener("transitionend", function done(e) {
        if (e.propertyName !== "height") return;
        ans.style.height = "auto"; // switch to auto so resize works
        ans.removeEventListener("transitionend", done);
      });
    }
  });
});
```

**Key rules:**

- Always use `ans.offsetHeight` (read a layout property) to force the browser to commit the starting height before the transition begins — without this, the browser batches the changes and the animation won't run.
- Check `e.propertyName !== 'height'` in `transitionend` — other CSS properties on the item (border-color, box-shadow) also fire `transitionend` events.
- After open animation completes, set `height: 'auto'` so the answer never gets clipped if the window is resized.
- When closing, pin `height` from `auto` to an explicit `px` value FIRST, then animate to `0px`. Transitioning from `auto` doesn't work.

---

### 9. Service Card Expand/Collapse

```js
document.querySelectorAll(".service-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".service-card");
    const detail = card.querySelector(".service-detail");
    const isOpen = card.classList.contains("expanded");
    card.classList.toggle("expanded", !isOpen);
    detail.style.maxHeight = isOpen ? "0" : detail.scrollHeight + "px";
    detail.style.opacity = isOpen ? "0" : "1";
    btn.textContent = isOpen ? "Learn More" : "Show Less";
  });
});
```

---

### 10. Mobile Nav Toggle

```js
const hamburger = document.querySelector(".hamburger");
const mobileMenu = document.querySelector(".mobile-menu");
hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  mobileMenu.classList.toggle("open");
});
// Close when link clicked
document.querySelectorAll(".mobile-menu a").forEach((link) => {
  link.addEventListener("click", () => {
    hamburger.classList.remove("active");
    mobileMenu.classList.remove("open");
  });
});
```

---

## STEPS

1. **Read the HTML file.**

2. **Audit what's already there** — check for existing animate-on-scroll classes, IntersectionObservers, counter animations, FAQ toggles. List what's missing.

3. **Add all missing animations** — work through each category above. Apply `.animate-on-scroll` and stagger delays to every section element.

4. **Add counter data-target attributes** — find all stat numbers and add `data-target` and `data-suffix` attributes.

5. **Ensure single IntersectionObserver** — never duplicate it. One observer handles everything.

6. **Screenshot and verify** — Use Puppeteer (preferred) or Screenshotone (fallback) to screenshot the page. Confirm the static state is correct: above-fold elements visible, below-fold elements at opacity 0 waiting to animate in.

7. **Test interactions** — FAQ toggles, card expands, mobile menu, form pulse.

8. **Edit the HTML file** with all changes.
