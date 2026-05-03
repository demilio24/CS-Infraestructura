# Nils-Quiz-Fast-Direct Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `nils-quiz-fast-direct.html` — a quiz-led funnel variant of `nils-vsl-fast.html` where 4 questions in the hero lead directly to the calendar booking widget, with the VSL relocated to its own section below the hero.

**Architecture:** Start from a copy of `nils-vsl-fast.html`. Strip the modal + unused hero elements. Rebuild the hero with a white quiz card over the dark-blue background, reusing the existing `.survey-*` CSS classes (already designed for a white surface). Move the video player into a new section below the hero. Simplify the JS: keep `pick()` / `goStep()` / `updateProgress()` / scroll-proxy; drop `openModal()` / `closeModal()` / `nextFromInput()` / `logSurveyToGitHub()`. Every quiz path ends at the same calendar iframe — no qualification branching, no tracking.

**Tech Stack:** Single static HTML file. Vanilla JS, no build step, no test framework. Design tokens and components inherited from `nils-vsl-fast.html`.

**Spec:** `docs/superpowers/specs/2026-04-24-nils-quiz-fast-direct-design.md`

---

## File structure

**Created:**
- `F:/GitHub/Websites/Nils/funnel/nils-quiz-fast-direct.html` — the new page

**Not modified:**
- `nils-vsl-fast.html`, `nils-vsl-fast-direct.html`, `nils-vsl.html`, `vsl.html` — other variants stay intact
- `survey-log.json` — not touched (new page does not log)

## Testing approach

This is a static HTML page with no test framework. Verification is done by opening the file in a browser at each commit checkpoint and checking the listed behaviors. Each task ends with a manual-check step that describes exactly what to look for.

The working directory for all commands is `F:/GitHub/Websites/Nils/`.

---

### Task 1: Seed the new file from the base

**Files:**
- Create: `funnel/nils-quiz-fast-direct.html` (copy of `funnel/nils-vsl-fast.html`)

- [ ] **Step 1: Copy the base file**

Run: `cp funnel/nils-vsl-fast.html funnel/nils-quiz-fast-direct.html`

- [ ] **Step 2: Sanity check — the copy opens and renders identical to the base**

Open `funnel/nils-quiz-fast-direct.html` in a browser. Expected: page looks exactly like `nils-vsl-fast.html` — dark blue hero with video, "Apply Now" button opens a 4-question modal.

- [ ] **Step 3: Commit**

```bash
git add funnel/nils-quiz-fast-direct.html
git commit -m "feat(funnel): seed nils-quiz-fast-direct from nils-vsl-fast"
```

---

### Task 2: Remove the modal markup and the survey-log script

All edits in this task happen in `funnel/nils-quiz-fast-direct.html`.

**Files:**
- Modify: `funnel/nils-quiz-fast-direct.html`

- [ ] **Step 1: Delete the entire `#apply-modal` block**

Locate the block that begins with `<!-- ══════════════════════════════════════════ APPLY NOW MODAL -->` and ends with the closing `</div>` of `id="apply-modal"`. In the base file these are lines 5870-6089. Delete every line from the comment through the closing `</div>` of `apply-modal`.

Use the Edit tool with `old_string` set to the full block (starting at the `<!-- … APPLY NOW MODAL -->` comment and ending at the `</div>` that closes `apply-modal`), and `new_string` set to the empty string.

- [ ] **Step 2: Delete the survey-log-to-GitHub `<script>` block**

Locate the `<script>` block whose first line inside is `// === SURVEY LOG → GITHUB ===` (in the base file, lines ~6630-6674). Delete the entire `<script> … </script>` block including its opening and closing tags.

- [ ] **Step 3: Quick sanity check — file still opens**

Open `funnel/nils-quiz-fast-direct.html` in a browser. Expected: page renders, but clicking any "Apply Now" button now does nothing (no modal exists) and the browser console shows `ReferenceError: openModal is not defined` once you click. That's expected at this checkpoint — we'll remove those buttons in Task 3 and prune the JS in Task 7.

- [ ] **Step 4: Commit**

```bash
git add funnel/nils-quiz-fast-direct.html
git commit -m "refactor(quiz): remove modal markup and survey-log script"
```

---

### Task 3: Replace all `openModal()` CTA buttons with scroll-to-quiz targets

The base file has 11 buttons with `onclick="openModal()"` scattered through the page (hero, calculator, case-study, how-it-works, etc.). The hero's button gets **removed entirely** (the quiz replaces it). The other 10 will scroll users back up to the quiz card.

**Files:**
- Modify: `funnel/nils-quiz-fast-direct.html`

- [ ] **Step 1: Find all `openModal()` references**

Use Grep with pattern `openModal` on `funnel/nils-quiz-fast-direct.html`, output mode `content`, with line numbers. You should see CTA button `onclick` attributes and (at the bottom) the function definition. Keep the list — you'll edit each one.

- [ ] **Step 2: Change every `onclick="openModal()"` to `onclick="scrollToQuiz()"`**

Use Edit with `replace_all: true`. Single edit:
- `old_string`: `onclick="openModal()"`
- `new_string`: `onclick="scrollToQuiz()"`

(The function `scrollToQuiz` will be defined in Task 7. It's fine if it's undefined at this checkpoint — this task only changes markup.)

- [ ] **Step 3: Update the CTA button text to match the new flow (optional wording change)**

Leave the existing button text untouched for now. The copy change to "Take the 60-second qualifier ↑" only applies to the new secondary CTA under the VSL in Task 6.

- [ ] **Step 4: Commit**

```bash
git add funnel/nils-quiz-fast-direct.html
git commit -m "refactor(quiz): retarget existing CTAs from openModal to scrollToQuiz"
```

---

### Task 4: Rebuild the hero

Gut the hero's current innards and replace them with the quiz-led layout.

**Files:**
- Modify: `funnel/nils-quiz-fast-direct.html`

- [ ] **Step 1: Locate the hero block**

The hero is `<section class="hero" id="hero"> … </section>` starting at approximately line 3967 in the base file. The full block spans through a closing `</section>` at line ~4173 in the base.

- [ ] **Step 2: Replace the hero's inner content**

Use Edit. Replace the entire `<section class="hero" id="hero"> … </section>` block with:

```html
<section class="hero" id="hero">
  <div class="hero-inner">
    <div class="hero-eyebrow anim">
      Free strategy call · 60-second qualifier
    </div>

    <h1 class="hero-h1 anim d1">
      <span class="h1-line">Find out if Google Ads</span>
      <span class="h1-line">will work for <strong>your business</strong>.</span>
    </h1>

    <p class="hero-sub anim d2">
      Answer 4 quick questions to see if you qualify for a free strategy call.
    </p>

    <!-- QUIZ CARD (populated in Task 6) -->
    <div class="quiz-hero-card anim d3" id="quiz-card">
      <!-- quiz markup inserted in Task 6 -->
    </div>

    <p class="hero-disclaimer anim d4">
      Takes 60 seconds · 200+ businesses served · 5.0 on Trustpilot
    </p>
  </div>
</section>
```

- [ ] **Step 3: Open in a browser to verify**

Expected: the hero now shows only the eyebrow, new headline ("Find out if Google Ads will work for **your business**."), the subhead, an empty white-less space where the quiz card will go (wrapper is present but empty), and the disclaimer. No video, no "Apply Now" button. Other sections below still render unchanged.

- [ ] **Step 4: Commit**

```bash
git add funnel/nils-quiz-fast-direct.html
git commit -m "feat(quiz): rebuild hero with quiz-led copy and empty quiz-card slot"
```

---

### Task 5: Add CSS for the quiz card

Add a new CSS block styling the `.quiz-hero-card` wrapper. This goes inside the existing `<style>` block at the top of the file, near the other survey/modal styles.

**Files:**
- Modify: `funnel/nils-quiz-fast-direct.html`

- [ ] **Step 1: Insert the quiz-card CSS**

Locate the existing `.survey-progress { … }` rule in the `<style>` block (it's at approximately line 3337 in the base, inside `/* Survey inside modal */`). Immediately **above** that comment, insert:

```css
/* ── QUIZ HERO CARD ─────────────────────────── */
.quiz-hero-card {
  max-width: 620px;
  margin: 32px auto 20px;
  background: #fff;
  border-radius: 24px;
  padding: 36px 32px;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.18),
    0 4px 12px rgba(0, 0, 0, 0.08);
  text-align: left;
  position: relative;
  overflow: hidden;
}

.quiz-hero-card .survey-progress {
  padding-right: 0;
}

.quiz-hero-card .survey-q {
  font-size: 22px;
  line-height: 1.3;
}

.quiz-hero-card .survey-opt {
  font-size: 16px;
}

.quiz-hero-card #scalendar {
  margin-top: 8px;
}

.quiz-hero-card #scalendar iframe {
  width: 100%;
  height: 640px;
  border: 0;
  border-radius: 12px;
}

@media (max-width: 640px) {
  .quiz-hero-card {
    padding: 24px 20px;
    border-radius: 20px;
    margin-inline: 16px;
  }
  .quiz-hero-card .survey-q {
    font-size: 19px;
  }
  .quiz-hero-card #scalendar iframe {
    height: 540px;
  }
}
```

- [ ] **Step 2: Verify CSS parses (visual check)**

Open the page in a browser. Expected: no visual change yet (the quiz-card wrapper is still empty from Task 4), but DevTools → Elements shows the `.quiz-hero-card` class with the new styles applied. No CSS parse errors in the console.

- [ ] **Step 3: Commit**

```bash
git add funnel/nils-quiz-fast-direct.html
git commit -m "feat(quiz): add quiz-hero-card card styles"
```

---

### Task 6: Populate the quiz card with questions and the calendar block

**Files:**
- Modify: `funnel/nils-quiz-fast-direct.html`

- [ ] **Step 1: Insert the quiz markup inside `#quiz-card`**

Find the `<div class="quiz-hero-card anim d3" id="quiz-card">` wrapper inserted in Task 4 and replace its inner content (currently just the `<!-- quiz markup inserted in Task 6 -->` comment) with:

```html
<div class="survey-progress">
  <div class="survey-step-lbl" id="slabel">Question 1 of 4</div>
  <div class="survey-bar">
    <div class="survey-fill" id="sfill" style="width: 20%"></div>
  </div>
</div>

<!-- Q1 -->
<div class="survey-step active" data-step="1">
  <div class="survey-q">
    Are you currently able to take on more clients?
  </div>
  <div class="survey-opts">
    <button
      class="survey-opt"
      data-name="capacity"
      onclick="pick(this, 1)"
    >
      <span class="survey-check"></span> Yes, I'm ready to take on more clients
    </button>
    <button
      class="survey-opt"
      data-name="capacity"
      onclick="pick(this, 1)"
    >
      <span class="survey-check"></span> No
    </button>
  </div>
</div>

<!-- Q2 -->
<div class="survey-step" data-step="2">
  <div class="survey-q">
    What is the average lifetime value of your client?
  </div>
  <div class="survey-opts">
    <button
      class="survey-opt"
      data-name="ltv"
      onclick="pick(this, 2)"
    >
      <span class="survey-check"></span> Less than $1,500
    </button>
    <button
      class="survey-opt"
      data-name="ltv"
      onclick="pick(this, 2)"
    >
      <span class="survey-check"></span> More than $1,500
    </button>
  </div>
  <button class="survey-back" onclick="goStep(1)">← Back</button>
</div>

<!-- Q3 -->
<div class="survey-step" data-step="3">
  <div class="survey-q">
    What are you currently doing for marketing?
  </div>
  <div class="survey-opts">
    <button
      class="survey-opt"
      data-name="marketing"
      onclick="pick(this, 3)"
    >
      <span class="survey-check"></span> Word of mouth and referrals
    </button>
    <button
      class="survey-opt"
      data-name="marketing"
      onclick="pick(this, 3)"
    >
      <span class="survey-check"></span> Paid ads
    </button>
  </div>
  <button class="survey-back" onclick="goStep(2)">← Back</button>
</div>

<!-- Q4 -->
<div class="survey-step" data-step="4">
  <div class="survey-q">
    What is your current monthly revenue?
  </div>
  <div class="survey-opts">
    <button
      class="survey-opt"
      data-name="revenue"
      onclick="pick(this, 4)"
    >
      <span class="survey-check"></span> Less than $20,000
    </button>
    <button
      class="survey-opt"
      data-name="revenue"
      onclick="pick(this, 4)"
    >
      <span class="survey-check"></span> More than $20,000
    </button>
  </div>
  <button class="survey-back" onclick="goStep(3)">← Back</button>
</div>

<!-- Calendar (shown after Q4) -->
<div id="scalendar" style="display: none">
  <div style="padding: 0 4px 10px">
    <p
      style="
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #046bd2;
        margin: 0 0 8px;
      "
    >
      You qualify
    </p>
    <p
      style="
        font-size: 22px;
        font-weight: 700;
        color: #111;
        line-height: 1.3;
        margin: 0 0 8px;
      "
    >
      Good news 🎉 you're a fit. Grab a time below.
    </p>
    <p style="font-size: 14px; color: #666; margin: 0; line-height: 1.6">
      This is a free strategy call. We'll show you exactly what a campaign would
      look like for your business, what results to expect, and what it costs. No
      fluff, no pressure.
    </p>
  </div>
  <iframe
    src="about:blank"
    scrolling="yes"
    id="quiz-cal-iframe"
  ></iframe>
  <div id="cal-scroll-proxy"></div>
  <p
    id="calendar-scroll-hint"
    style="
      display: none;
      text-align: center;
      font-size: 14px;
      color: #666;
      padding: 16px 8px 8px;
      line-height: 1.5;
    "
  >
    👇 Make sure you scroll down and press
    <strong style="color: #111">Schedule Meeting</strong>
  </p>
</div>
```

- [ ] **Step 2: Open the page and verify markup renders (JS will error until Task 7)**

Expected: the hero now shows a white card with "Question 1 of 4", a progress bar at 20%, the Q1 question text, and two answer buttons. Clicking a button throws `ReferenceError: pick is not defined` in the console — that's expected until Task 7.

- [ ] **Step 3: Commit**

```bash
git add funnel/nils-quiz-fast-direct.html
git commit -m "feat(quiz): populate quiz card with 4 questions and calendar block"
```

---

### Task 7: Rewrite the quiz JavaScript

Replace the existing modal/survey JS with a simpler, inline-quiz version. This edit targets the large `<script>` block that begins near line 6091 in the base file and contains functions like `openModal`, `closeModal`, `resetSurvey`, `pick`, `goStep`, `showCalendar`, `nextFromInput`, and the iframe scroll proxy.

**Files:**
- Modify: `funnel/nils-quiz-fast-direct.html`

- [ ] **Step 1: Locate the `/* ── MODAL ──────────────────────────────── */` comment**

Inside the `<script>` block (after the FAQ accordion logic, after the fire-badge tooltip handlers), find the comment `/* ── MODAL ──────────────────────────────── */`. In the base file this is around line 6432.

- [ ] **Step 2: Replace the block from that comment through the end of the iframe scroll proxy IIFE**

Use Edit. `old_string` = the full block from `/* ── MODAL ──────────────────────────────── */` through the closing `})();` of the iframe scroll proxy (in the base file, lines ~6432-6627). `new_string` =

```javascript
/* ── QUIZ ──────────────────────────────── */
const QUIZ_CAL_URL =
  "https://link.nilsdigital.com/widget/booking/wFhAJTJLU3Urtmxztnb5";

let curStep = 1;

function scrollToQuiz() {
  const el = document.getElementById("quiz-card");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateProgress(s) {
  const pct = s <= 4 ? (s / 5) * 100 : 100;
  const fill = document.getElementById("sfill");
  const lbl = document.getElementById("slabel");
  if (fill) fill.style.width = pct + "%";
  if (lbl)
    lbl.textContent = s <= 4 ? "Question " + s + " of 4" : "Almost done!";
}

function goStep(n) {
  const current = document.querySelector(".survey-step.active");
  if (current) current.classList.remove("active");
  const next = document.querySelector('.survey-step[data-step="' + n + '"]');
  if (next) next.classList.add("active");
  curStep = n;
  updateProgress(n);
}

function pick(btn, stepNum) {
  document
    .querySelectorAll('[data-name="' + btn.dataset.name + '"]')
    .forEach((o) => o.classList.remove("selected"));
  btn.classList.add("selected");
  setTimeout(
    () => (stepNum === 4 ? showCalendar() : goStep(stepNum + 1)),
    250,
  );
}

function showCalendar() {
  const iframe = document.getElementById("quiz-cal-iframe");
  if (iframe && iframe.src.indexOf("widget/booking") === -1) {
    iframe.src = QUIZ_CAL_URL;
  }
  document
    .querySelectorAll(".survey-step")
    .forEach((s) => (s.style.display = "none"));
  const progress = document.querySelector(".quiz-hero-card .survey-progress");
  if (progress) progress.style.display = "none";
  document.getElementById("scalendar").style.display = "block";
}

// Calendar iframe scroll proxy — lets users drag-to-scroll the page
// even when their finger is over the iframe, while still letting taps
// fall through to the calendar for date/input interaction.
(function () {
  var proxy = document.getElementById("cal-scroll-proxy");
  if (!proxy) return;
  var scrollEl =
    document.scrollingElement || document.documentElement || document.body;
  var startY = 0,
    startTop = 0,
    didScroll = false;

  proxy.addEventListener(
    "touchstart",
    function (e) {
      startY = e.touches[0].clientY;
      startTop = scrollEl.scrollTop;
      didScroll = false;
    },
    { passive: true },
  );

  proxy.addEventListener(
    "touchmove",
    function (e) {
      var dy = startY - e.touches[0].clientY;
      if (Math.abs(dy) > 5) didScroll = true;
      scrollEl.scrollTop = startTop + dy;
    },
    { passive: true },
  );

  proxy.addEventListener("touchend", function () {
    if (!didScroll) {
      proxy.style.pointerEvents = "none";
      setTimeout(function () {
        proxy.style.pointerEvents = "";
      }, 350);
    }
  });
})();
```

- [ ] **Step 3: Verify in a browser — end-to-end quiz flow**

Open `funnel/nils-quiz-fast-direct.html`. Click through:

1. Q1 "Yes" → card advances to Q2, progress bar now at 40%.
2. Q2 "More than $1,500" → card advances to Q3, progress bar at 60%.
3. Q3 "Paid ads" → card advances to Q4, progress bar at 80%.
4. Q4 "More than $20,000" → progress bar disappears, "You qualify / Good news 🎉" header appears, calendar iframe loads the GHL booking widget.
5. Go back through the flow (reload, click "← Back" from Q2) — should return to Q1 with the prior answer still highlighted.
6. Repeat with every "No" / "Less than" combination — must still reach the calendar.

Also click one of the existing `onclick="scrollToQuiz()"` buttons elsewhere on the page (e.g., in the FAQ or how-it-works section) — should smooth-scroll back to the quiz card.

Console must show no errors.

- [ ] **Step 4: Commit**

```bash
git add funnel/nils-quiz-fast-direct.html
git commit -m "feat(quiz): wire quiz JS with inline calendar reveal and scroll-to-quiz"
```

---

### Task 8: Build the VSL section below the hero

Insert a new `<section>` immediately after the hero's closing `</section>`. It holds the relocated video and the relocated 3-stat proof row.

**Files:**
- Modify: `funnel/nils-quiz-fast-direct.html`

- [ ] **Step 1: Insert the VSL section**

Find the closing `</section>` of the hero (the one matching `<section class="hero" id="hero">`). Immediately after that closing tag, insert:

```html
<!-- ══════════════════════════════════════════ VSL SECTION -->
<section class="vsl-section" id="vsl">
  <div class="vsl-inner">
    <div class="section-eyebrow anim">Watch the 2-minute overview</div>
    <h2 class="section-h2 anim d1">
      We'll build you a website that gets
      <span
        class="fire-badge"
        data-tip="Our clients on average see four times a higher conversion rate than their previous website."
        >4x more clients<sup>*</sup></span
      >
      and run
      <span
        class="fire-text"
        data-tip="We've personally managed over $2,000,000 in Google Ads spend. We know exactly what profitable campaigns look like, and we build them from day one."
        >extremely profitable</span
      >
      Google Ads.
    </h2>

    <div class="vsl-sub-grid anim d2">
      <div class="sub-item">
        Done-for-you setup: everything launches within 14 days
      </div>
      <div class="sub-item">
        Profitable results guaranteed within 30 days or you don't pay
      </div>
      <div class="sub-item">Takes just 1 to 2 hours of your time, total</div>
    </div>

    <div class="vsl-video-wrap anim d3">
      <div class="hvp paused" id="hvp">
        <video
          id="hvp-vid"
          src="https://assets.cdn.filesafe.space/stoLOEGDIvEDY3xQI4B8/media/69cac6a173e9821609376b82.mp4"
          playsinline
          preload="metadata"
          muted
        ></video>
        <div class="hvp-unmute-overlay" id="hvp-unmute">
          <div class="hvp-unmute-icon">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          </div>
          <div class="hvp-unmute-title">Click anywhere to unmute</div>
          <div class="hvp-unmute-sub">Video is playing</div>
        </div>
        <div class="hvp-center" id="hvp-center">
          <div class="hvp-play-btn" id="hvp-play-btn">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          </div>
        </div>
        <div class="hvp-controls">
          <div class="hvp-progress" id="hvp-progress">
            <div class="hvp-fill" id="hvp-fill"></div>
          </div>
          <div class="hvp-row">
            <button class="hvp-btn" id="hvp-playpause" aria-label="Play/Pause">
              <svg
                id="hvp-pp-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="#fff"
              >
                <polygon points="6,3 20,12 6,21" />
              </svg>
            </button>
            <div class="hvp-vol-wrap">
              <button class="hvp-btn" id="hvp-vol" aria-label="Mute/Unmute">
                <svg
                  id="hvp-vol-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="#fff"
                >
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path
                    id="hvp-vol-wave"
                    d="M15.54 8.46a5 5 0 0 1 0 7.07"
                  />
                </svg>
              </button>
              <input
                type="range"
                class="hvp-vol-slider"
                id="hvp-vol-slider"
                min="0"
                max="1"
                step="0.02"
                value="1"
                aria-label="Volume"
              />
            </div>
            <span class="hvp-time" id="hvp-time">0:00 / 0:00</span>
            <button
              class="hvp-btn hvp-speed-btn"
              id="hvp-speed"
              aria-label="Playback speed"
            >
              1.15×
            </button>
            <button class="hvp-btn" id="hvp-fs" aria-label="Fullscreen">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                stroke-width="2"
              >
                <path
                  d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="vsl-proof-row anim d4">
      <div class="hero-proof-item">
        <div class="hero-proof-num">$2M+</div>
        <div class="hero-proof-label">Ad spend managed</div>
      </div>
      <div class="hero-proof-item">
        <div class="tp-stars">★★★★★</div>
        <div class="hero-proof-num">5.0</div>
        <div class="hero-proof-label">on Trustpilot</div>
      </div>
      <div class="hero-proof-item">
        <div class="hero-proof-num">200+</div>
        <div class="hero-proof-label">Businesses served</div>
      </div>
    </div>

    <div class="vsl-cta anim d5">
      <button class="btn" onclick="scrollToQuiz()">
        Take the 60-second qualifier
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add minimal CSS for the VSL section**

Inside the existing `<style>` block, add the following rules at the very end of the style block (just before `</style>`):

```css
/* ── VSL SECTION (below hero) ───────────────── */
.vsl-section {
  background: var(--gray-bg);
  padding: 72px 24px 80px;
  text-align: center;
}
.vsl-inner {
  max-width: 1100px;
  margin: 0 auto;
}
.vsl-section .section-h2 {
  font-size: clamp(26px, 3.2vw, 42px);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--text);
  margin: 12px 0 20px;
}
.vsl-sub-grid {
  display: flex;
  gap: 24px;
  justify-content: center;
  flex-wrap: wrap;
  max-width: 900px;
  margin: 0 auto 32px;
}
.vsl-sub-grid .sub-item {
  font-size: 15px;
  color: rgba(10, 10, 10, 0.65);
  line-height: 1.5;
  flex: 1 1 240px;
  max-width: 280px;
}
.vsl-video-wrap {
  max-width: 820px;
  margin: 0 auto 36px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.18);
}
.vsl-proof-row {
  display: flex;
  gap: 48px;
  justify-content: center;
  flex-wrap: wrap;
  margin: 0 auto 36px;
}
.vsl-proof-row .hero-proof-item {
  color: var(--text);
}
.vsl-proof-row .hero-proof-num {
  color: var(--blue);
}
.vsl-proof-row .hero-proof-label {
  color: rgba(10, 10, 10, 0.6);
}
.vsl-cta {
  display: flex;
  justify-content: center;
}
@media (max-width: 640px) {
  .vsl-section {
    padding: 48px 16px 56px;
  }
  .vsl-proof-row {
    gap: 28px;
  }
}
```

- [ ] **Step 3: Verify in a browser**

Open the page. Expected:

1. Hero renders with the quiz card (as in Task 7).
2. Scroll down just past the hero — the VSL section appears on a light gray background.
3. Headline reads "We'll build you a website that gets **4x more clients** and run **extremely profitable** Google Ads." The 4x badge and the "extremely profitable" span use the existing blue/fire styles.
4. Sub-bullets, video player, 3-stat proof row, and the secondary "Take the 60-second qualifier" CTA all render.
5. Clicking the video play button plays the video (existing HVP JS still works since the markup IDs match).
6. Clicking "Take the 60-second qualifier" smooth-scrolls back up to the quiz card.

- [ ] **Step 4: Commit**

```bash
git add funnel/nils-quiz-fast-direct.html
git commit -m "feat(quiz): add VSL section with relocated video, proof, and scroll-back CTA"
```

---

### Task 9: Full-page manual verification pass

No file changes — this is a final walkthrough.

- [ ] **Step 1: Desktop browser walkthrough**

Open `funnel/nils-quiz-fast-direct.html` in Chrome at desktop width (≥ 1200px). Verify:

- Hero: eyebrow → headline → subhead → quiz card (white, shadowed) → trust micro-line.
- Quiz card is centered, max 620px wide.
- Click Q1 "Yes" → auto-advance to Q2 after ~250ms. Progress fills from 20% to 40%.
- Click Q2 "Less than $1,500" → advance to Q3 (60%).
- Click Q3 "Word of mouth and referrals" → advance to Q4 (80%).
- Click Q4 "Less than $20,000" → calendar appears inline, progress bar hides, iframe loads the GHL booking widget.
- Back buttons on Q2-Q4 work; no back on Q1.
- VSL section renders below hero with video, proof row, secondary CTA.
- Case studies, "how it works", FAQ, footer all render identically to `nils-vsl-fast.html`.
- Every other CTA on the page (calculator, case-study section, FAQ, etc.) smooth-scrolls back to the quiz card when clicked.
- DevTools console shows no errors.
- Search page source (Ctrl+F view-source) for `openModal`, `closeModal`, `apply-modal`, `nextFromInput`, `logSurveyToGitHub`, `q3-value` — expect **zero matches** for all six.

- [ ] **Step 2: Mobile browser walkthrough**

Open Chrome DevTools → device toolbar → iPhone 14 (or any ≤ 640px width). Verify:

- Quiz card fits within the screen, has 16px side margin, comfortable padding.
- Answer buttons stack and are fully tappable.
- Complete the flow through Q4 → calendar iframe renders inline at 540px height (mobile rule).
- Drag-to-scroll the iframe area works (`#cal-scroll-proxy` lets the page scroll past the iframe).
- VSL section stacks cleanly; video, proof row, CTA all readable.

- [ ] **Step 3: Run the quiz with the opposite answer set**

Reload the page, answer Q1 "No", Q2 "More than $1,500", Q3 "Paid ads", Q4 "More than $20,000". Calendar must still appear — confirm every path leads to the booking widget (no qualification branching).

- [ ] **Step 4: Commit a final no-op marker if desired**

No changes expected. If verification surfaced issues, fix them in their own commit and rerun Step 1-3.

---

## Self-review checklist

1. **Spec coverage.** Every spec section maps to a task:
   - Hero rebuild → Task 4
   - Quiz card styles → Task 5
   - Quiz card markup + 4 questions + calendar reveal → Task 6
   - JS adapted/pruned → Task 7
   - VSL section relocated → Task 8
   - Modal + survey-log removed → Tasks 2, 3, 7
   - Manual verification → Task 9

2. **Acceptance criteria coverage.** All 10 acceptance criteria from the spec are checked in Task 9's walkthrough.

3. **Deliberate non-goals** (no tracking, no qualification, no prefill) are enforced by Task 2 (removes log script) and Task 7 (no branching in `showCalendar`).

4. **Naming consistency across tasks:**
   - `scrollToQuiz()` — introduced in Task 3 (onclick), defined in Task 7. Consistent.
   - `#quiz-card` — introduced in Task 4, used in Task 7 (`scrollToQuiz`) and Task 8 (CTA). Consistent.
   - `#quiz-cal-iframe` — defined in Task 6, referenced in Task 7 (`showCalendar`). Consistent.
   - `QUIZ_CAL_URL` — defined once in Task 7's JS, used once in `showCalendar`. Consistent.
   - `data-name` values `capacity` / `ltv` / `marketing` / `revenue` — unique per question, no cross-talk in `pick()` deselect logic.
