<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Kicking Kiddos | Award-Winning Private Swim Lessons in Topeka, KS</title>
    <meta
      name="description"
      content="3x Platinum Award-winning private swim lessons for children in Topeka, KS. One-on-one instruction, safety-first approach, $25/lesson. Book your spot today."
    />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap"
      rel="stylesheet"
    />
    <style>
      /* ── Reset & Base ── */
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; font-size: 16px; }
      body {
        font-family: 'Poppins', sans-serif;
        color: #0f1c29;
        background: #fff;
        line-height: 1.6;
        overflow-x: hidden;
      }
      img { display: block; max-width: 100%; }
      a { text-decoration: none; color: inherit; }

      /* ── Tokens ── */
      :root {
        --blue:      #1a7bc4;
        --blue-dark: #155fa0;
        --blue-deep: #0d3d66;
        --accent:    #f4845f;
        --accent-dk: #d9633e;
        --gold:      #c9a227;
        --gold-lt:   #f0d168;
        --surface:   #f4f9fd;
        --border:    #d4e8f5;
        --text:      #0f1c29;
        --muted:     #4a6070;
        --white:     #ffffff;
        --dark:      #0a1520;

        --sh-sm:   0 2px 8px rgba(26,123,196,.12);
        --sh-card: 0 6px 24px rgba(26,123,196,.12);
        --sh-lift: 0 16px 48px rgba(26,123,196,.22);

        --r-sm: 8px;
        --r-md: 14px;
        --r-lg: 22px;

        --max: 1100px;
      }

      /* ── Utility ── */
      .container { max-width: var(--max); margin: 0 auto; padding: 0 24px; }
      .section { padding: 90px 0; }
      .section--alt { background: var(--surface); }
      .section--dark { background: var(--dark); color: #fff; }
      .section--blue { background: var(--blue); color: #fff; }

      .eyebrow {
        display: inline-block;
        font-size: .72rem;
        font-weight: 700;
        letter-spacing: .14em;
        text-transform: uppercase;
        color: var(--blue);
        background: rgba(26,123,196,.1);
        padding: 5px 14px;
        border-radius: 100px;
        margin-bottom: 14px;
      }
      .eyebrow--light {
        color: var(--gold-lt);
        background: rgba(249,209,104,.15);
      }
      .eyebrow--white {
        color: #fff;
        background: rgba(255,255,255,.18);
      }

      h1, h2, h3, h4 { line-height: 1.2; }

      .section-title {
        font-size: clamp(1.7rem, 4vw, 2.5rem);
        font-weight: 800;
        margin-bottom: 16px;
        color: var(--text);
      }
      .section-title--white { color: #fff; }
      .section-sub {
        font-size: 1.05rem;
        color: var(--muted);
        max-width: 600px;
      }
      .section-sub--white { color: rgba(255,255,255,.82); }
      .section-header { margin-bottom: 52px; }
      .section-header.centered { text-align: center; }
      .section-header.centered .section-sub { margin: 0 auto; }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-family: inherit;
        font-size: .95rem;
        font-weight: 700;
        border: none;
        cursor: pointer;
        border-radius: 100px;
        padding: 14px 30px;
        transition: transform .18s, box-shadow .18s, background .18s;
        text-align: center;
      }
      .btn:hover { transform: translateY(-2px); }
      .btn--primary {
        background: var(--accent);
        color: #fff;
        box-shadow: 0 6px 22px rgba(244,132,95,.38);
      }
      .btn--primary:hover {
        background: var(--accent-dk);
        box-shadow: 0 10px 30px rgba(244,132,95,.48);
      }
      .btn--white {
        background: #fff;
        color: var(--blue);
        box-shadow: 0 4px 18px rgba(0,0,0,.12);
      }
      .btn--white:hover { box-shadow: 0 8px 28px rgba(0,0,0,.18); }
      .btn--outline {
        background: transparent;
        border: 2px solid rgba(255,255,255,.6);
        color: #fff;
      }
      .btn--outline:hover { background: rgba(255,255,255,.12); }
      .btn--lg { font-size: 1.05rem; padding: 16px 36px; }

      /* ── Scroll reveal ── */
      .reveal { opacity: 0; transform: translateY(28px); transition: opacity .55s ease, transform .55s ease; }
      .reveal.visible { opacity: 1; transform: none; }

      /* ── Wave dividers ── */
      .wave-wrap { line-height: 0; overflow: hidden; }
      .wave-wrap svg { display: block; width: 100%; }

      /* ════════════════════════════════════
         NAV
      ════════════════════════════════════ */
      .nav {
        position: fixed;
        top: 0; left: 0; right: 0;
        z-index: 100;
        padding: 0 24px;
        height: 68px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(10,21,32,.88);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border-bottom: 1px solid rgba(255,255,255,.07);
        transition: background .3s;
      }
      .nav.scrolled { background: rgba(10,21,32,.97); }
      .nav__logo {
        font-size: 1.15rem;
        font-weight: 800;
        color: #fff;
        letter-spacing: -.01em;
      }
      .nav__logo span { color: var(--gold-lt); }
      .nav__links {
        display: none;
        list-style: none;
        gap: 32px;
      }
      .nav__links a {
        font-size: .88rem;
        font-weight: 500;
        color: rgba(255,255,255,.78);
        transition: color .18s;
      }
      .nav__links a:hover { color: #fff; }
      .nav__cta { display: none; }
      .nav__hamburger {
        background: none;
        border: none;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 5px;
        padding: 4px;
      }
      .nav__hamburger span {
        display: block;
        width: 24px;
        height: 2px;
        background: #fff;
        border-radius: 2px;
        transition: transform .25s, opacity .25s;
      }
      .nav__hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
      .nav__hamburger.open span:nth-child(2) { opacity: 0; }
      .nav__hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

      .nav__mobile {
        position: fixed;
        top: 68px; left: 0; right: 0;
        background: rgba(10,21,32,.97);
        backdrop-filter: blur(14px);
        padding: 28px 24px 36px;
        display: none;
        flex-direction: column;
        gap: 22px;
        z-index: 99;
        border-bottom: 1px solid rgba(255,255,255,.08);
      }
      .nav__mobile.open { display: flex; }
      .nav__mobile a {
        color: rgba(255,255,255,.85);
        font-size: 1.05rem;
        font-weight: 600;
      }
      .nav__mobile a:hover { color: #fff; }

      @media (min-width: 768px) {
        .nav__links, .nav__cta { display: flex; }
        .nav__hamburger { display: none; }
      }

      /* ════════════════════════════════════
         HERO
      ════════════════════════════════════ */
      .hero {
        position: relative;
        min-height: 100vh;
        display: flex;
        align-items: center;
        padding-top: 68px;
        overflow: hidden;
      }
      .hero__bg {
        position: absolute;
        inset: 0;
        background-image: url('https://assets.cdn.filesafe.space/y8AfcwWjebLRDs50RH69/media/69a889bfbffadfa0e6814eb7.jpg');
        background-size: cover;
        background-position: center 30%;
      }
      .hero__overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          105deg,
          rgba(8,18,32,.88) 0%,
          rgba(13,61,102,.72) 50%,
          rgba(8,18,32,.45) 100%
        );
      }
      .hero__content {
        position: relative;
        z-index: 2;
        max-width: var(--max);
        margin: 0 auto;
        padding: 80px 24px 100px;
        display: grid;
        gap: 60px;
        align-items: center;
      }
      .hero__badge-row {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 6px;
      }
      .hero__award-mini {
        width: 52px;
        height: 52px;
        object-fit: contain;
        filter: drop-shadow(0 2px 8px rgba(0,0,0,.5));
      }
      .hero__badge-text {
        font-size: .78rem;
        font-weight: 700;
        color: var(--gold-lt);
        letter-spacing: .06em;
        text-transform: uppercase;
      }
      .hero__title {
        font-size: clamp(2.2rem, 6vw, 3.8rem);
        font-weight: 900;
        color: #fff;
        line-height: 1.1;
        margin-bottom: 20px;
      }
      .hero__title em {
        font-style: normal;
        color: var(--gold-lt);
      }
      .hero__body {
        font-size: 1.1rem;
        color: rgba(255,255,255,.82);
        max-width: 540px;
        margin-bottom: 36px;
        line-height: 1.7;
      }
      .hero__cta-row {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        align-items: center;
      }
      .hero__trust {
        margin-top: 40px;
        display: flex;
        flex-wrap: wrap;
        gap: 24px;
      }
      .hero__trust-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: .82rem;
        color: rgba(255,255,255,.72);
        font-weight: 500;
      }
      .hero__trust-item svg { flex-shrink: 0; }
      .hero__stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        max-width: 380px;
      }
      .hero__stat-card {
        background: rgba(255,255,255,.1);
        border: 1px solid rgba(255,255,255,.15);
        backdrop-filter: blur(10px);
        border-radius: var(--r-md);
        padding: 20px 18px;
        text-align: center;
      }
      .hero__stat-num {
        font-size: 1.9rem;
        font-weight: 800;
        color: var(--gold-lt);
        line-height: 1;
        margin-bottom: 4px;
      }
      .hero__stat-label {
        font-size: .72rem;
        color: rgba(255,255,255,.7);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: .06em;
      }

      @media (min-width: 900px) {
        .hero__content {
          grid-template-columns: 1fr 380px;
        }
      }

      /* ════════════════════════════════════
         AWARDS STRIP
      ════════════════════════════════════ */
      .awards-strip {
        background: var(--dark);
        padding: 52px 0 56px;
      }
      .awards-strip .container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 36px;
      }
      .awards-strip__headline {
        text-align: center;
        color: #fff;
        font-size: 1rem;
        font-weight: 600;
        letter-spacing: .06em;
        text-transform: uppercase;
        color: rgba(255,255,255,.55);
      }
      .awards-strip__row {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        gap: 24px 48px;
      }
      .award-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        text-align: center;
      }
      .award-card__img {
        width: 130px;
        height: 130px;
        object-fit: contain;
        filter: drop-shadow(0 4px 18px rgba(201,162,39,.35));
        transition: transform .2s, filter .2s;
      }
      .award-card:hover .award-card__img {
        transform: scale(1.06);
        filter: drop-shadow(0 6px 24px rgba(201,162,39,.5));
      }
      .award-card__year {
        font-size: .78rem;
        font-weight: 700;
        color: var(--gold-lt);
        letter-spacing: .1em;
        text-transform: uppercase;
      }
      .award-card__name {
        font-size: .7rem;
        color: rgba(255,255,255,.5);
        font-weight: 500;
      }
      .awards-strip__divider {
        width: 1px;
        height: 90px;
        background: rgba(255,255,255,.1);
        display: none;
      }
      @media (min-width: 700px) {
        .awards-strip__divider { display: block; }
      }

      /* ════════════════════════════════════
         PROOF BAR
      ════════════════════════════════════ */
      .proof-bar {
        background: var(--blue);
        padding: 28px 0;
      }
      .proof-bar__inner {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px 40px;
      }
      .proof-item {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #fff;
        font-size: .9rem;
        font-weight: 500;
      }
      .proof-item__dot {
        width: 8px; height: 8px;
        border-radius: 50%;
        background: var(--gold-lt);
        flex-shrink: 0;
      }

      /* ════════════════════════════════════
         WHY DIFFERENT
      ════════════════════════════════════ */
      .diff-grid {
        display: grid;
        gap: 28px;
        grid-template-columns: 1fr;
      }
      .diff-card {
        background: #fff;
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        padding: 32px 28px;
        box-shadow: var(--sh-card);
        transition: transform .2s, box-shadow .2s;
        display: flex;
        gap: 20px;
        align-items: flex-start;
      }
      .diff-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--sh-lift);
      }
      .diff-card__icon {
        width: 52px;
        height: 52px;
        border-radius: var(--r-sm);
        background: rgba(26,123,196,.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.6rem;
        flex-shrink: 0;
      }
      .diff-card__title {
        font-size: 1.05rem;
        font-weight: 700;
        margin-bottom: 6px;
        color: var(--text);
      }
      .diff-card__body {
        font-size: .9rem;
        color: var(--muted);
        line-height: 1.65;
      }
      @media (min-width: 640px) {
        .diff-grid { grid-template-columns: 1fr 1fr; }
      }
      @media (min-width: 960px) {
        .diff-grid { grid-template-columns: repeat(3, 1fr); }
      }

      /* ════════════════════════════════════
         COMPARISON TABLE
      ════════════════════════════════════ */
      .compare-wrap {
        overflow-x: auto;
        border-radius: var(--r-lg);
        box-shadow: var(--sh-lift);
        border: 1px solid var(--border);
      }
      .compare-table {
        width: 100%;
        border-collapse: collapse;
        background: #fff;
        min-width: 540px;
      }
      .compare-table thead tr {
        background: var(--blue-deep);
        color: #fff;
      }
      .compare-table th {
        padding: 18px 22px;
        font-size: .88rem;
        font-weight: 700;
        text-align: center;
        letter-spacing: .04em;
        text-transform: uppercase;
      }
      .compare-table th:first-child { text-align: left; }
      .compare-table thead th.highlight {
        background: var(--blue);
        position: relative;
      }
      .compare-table thead th.highlight::after {
        content: 'Our Approach';
        display: block;
        font-size: .65rem;
        font-weight: 600;
        color: var(--gold-lt);
        letter-spacing: .08em;
        margin-top: 2px;
        text-transform: uppercase;
      }
      .compare-table tbody tr {
        border-bottom: 1px solid var(--border);
        transition: background .15s;
      }
      .compare-table tbody tr:last-child { border-bottom: none; }
      .compare-table tbody tr:hover { background: var(--surface); }
      .compare-table td {
        padding: 15px 22px;
        font-size: .9rem;
        text-align: center;
        color: var(--muted);
      }
      .compare-table td:first-child {
        text-align: left;
        font-weight: 600;
        color: var(--text);
      }
      .compare-table td.highlight {
        background: rgba(26,123,196,.05);
        font-weight: 600;
        color: var(--blue-dark);
      }
      .check { color: #22c55e; font-size: 1.1rem; }
      .cross { color: #ef4444; font-size: 1.1rem; }
      .neutral { color: var(--muted); }

      /* ════════════════════════════════════
         PROGRAMS
      ════════════════════════════════════ */
      .programs-grid {
        display: grid;
        gap: 28px;
        grid-template-columns: 1fr;
      }
      .prog-card {
        background: #fff;
        border-radius: var(--r-lg);
        overflow: hidden;
        box-shadow: var(--sh-card);
        border: 1px solid var(--border);
        transition: transform .22s, box-shadow .22s;
        display: flex;
        flex-direction: column;
      }
      .prog-card:hover {
        transform: translateY(-5px);
        box-shadow: var(--sh-lift);
      }
      .prog-card__img {
        width: 100%;
        height: 220px;
        object-fit: cover;
      }
      .prog-card__body {
        padding: 26px 24px;
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      .prog-card__tag {
        font-size: .7rem;
        font-weight: 700;
        letter-spacing: .1em;
        text-transform: uppercase;
        color: var(--blue);
        background: rgba(26,123,196,.1);
        border-radius: 100px;
        padding: 3px 12px;
        display: inline-block;
        margin-bottom: 12px;
      }
      .prog-card__title {
        font-size: 1.2rem;
        font-weight: 700;
        margin-bottom: 8px;
        color: var(--text);
      }
      .prog-card__desc {
        font-size: .88rem;
        color: var(--muted);
        line-height: 1.65;
        flex: 1;
        margin-bottom: 20px;
      }
      .prog-card__price {
        font-size: 1.35rem;
        font-weight: 800;
        color: var(--blue);
        margin-bottom: 16px;
      }
      .prog-card__price span {
        font-size: .8rem;
        font-weight: 500;
        color: var(--muted);
      }
      @media (min-width: 640px) { .programs-grid { grid-template-columns: 1fr 1fr; } }
      @media (min-width: 960px) { .programs-grid { grid-template-columns: repeat(3, 1fr); } }

      /* ════════════════════════════════════
         PROCESS
      ════════════════════════════════════ */
      .process-steps {
        display: grid;
        gap: 32px;
        position: relative;
      }
      .process-step {
        display: flex;
        gap: 22px;
        align-items: flex-start;
      }
      .process-step__num {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: var(--blue);
        color: #fff;
        font-size: 1.2rem;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 4px 16px rgba(26,123,196,.35);
      }
      .process-step__title {
        font-size: 1.05rem;
        font-weight: 700;
        margin-bottom: 6px;
        color: var(--text);
      }
      .process-step__body {
        font-size: .9rem;
        color: var(--muted);
        line-height: 1.65;
      }
      @media (min-width: 680px) {
        .process-steps { grid-template-columns: 1fr 1fr; }
      }
      @media (min-width: 960px) {
        .process-steps { grid-template-columns: repeat(4, 1fr); }
      }

      /* ════════════════════════════════════
         GALLERY
      ════════════════════════════════════ */
      .gallery-grid {
        display: grid;
        gap: 14px;
        grid-template-columns: 1fr 1fr;
      }
      .gallery-grid__item {
        border-radius: var(--r-md);
        overflow: hidden;
        aspect-ratio: 4/3;
        box-shadow: var(--sh-card);
      }
      .gallery-grid__item:first-child {
        grid-column: 1 / -1;
        aspect-ratio: 16/7;
      }
      .gallery-grid__item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform .4s ease;
      }
      .gallery-grid__item:hover img { transform: scale(1.04); }
      @media (min-width: 700px) {
        .gallery-grid {
          grid-template-columns: repeat(3, 1fr);
        }
        .gallery-grid__item:first-child {
          grid-column: 1 / -1;
        }
      }

      /* ════════════════════════════════════
         TESTIMONIALS
      ════════════════════════════════════ */
      .testi-grid {
        display: grid;
        gap: 22px;
      }
      .testi-card {
        background: #fff;
        border-radius: var(--r-lg);
        padding: 28px 26px;
        box-shadow: var(--sh-card);
        border: 1px solid var(--border);
        position: relative;
      }
      .testi-card::before {
        content: '\201C';
        position: absolute;
        top: 14px;
        left: 20px;
        font-size: 4rem;
        line-height: 1;
        color: var(--blue);
        opacity: .15;
        font-family: Georgia, serif;
      }
      .testi-card__stars {
        color: #f59e0b;
        font-size: 1rem;
        margin-bottom: 12px;
      }
      .testi-card__quote {
        font-size: .92rem;
        color: var(--text);
        line-height: 1.7;
        margin-bottom: 18px;
      }
      .testi-card__author {
        font-size: .82rem;
        font-weight: 700;
        color: var(--blue);
      }
      .testi-card__detail {
        font-size: .78rem;
        color: var(--muted);
        font-weight: 400;
      }
      @media (min-width: 640px) { .testi-grid { grid-template-columns: 1fr 1fr; } }
      @media (min-width: 960px) { .testi-grid { grid-template-columns: repeat(3, 1fr); } }

      /* ════════════════════════════════════
         ABOUT
      ════════════════════════════════════ */
      .about-layout {
        display: grid;
        gap: 52px;
        align-items: center;
      }
      .about-img-wrap {
        position: relative;
        max-width: 500px;
        margin: 0 auto;
        width: 100%;
      }
      .about-img {
        width: 100%;
        border-radius: var(--r-lg);
        box-shadow: var(--sh-lift);
        display: block;
      }
      .about-badge {
        position: absolute;
        bottom: -18px;
        right: -10px;
        background: var(--dark);
        border-radius: var(--r-md);
        padding: 16px 18px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: var(--sh-lift);
        max-width: 220px;
      }
      .about-badge__icon { font-size: 1.8rem; }
      .about-badge__num {
        font-size: 1.3rem;
        font-weight: 800;
        color: var(--gold-lt);
        line-height: 1;
      }
      .about-badge__label {
        font-size: .7rem;
        color: rgba(255,255,255,.6);
        font-weight: 500;
      }
      .about-awards-row {
        display: flex;
        gap: 12px;
        margin-top: 28px;
        flex-wrap: wrap;
      }
      .about-award-thumb {
        width: 64px;
        height: 64px;
        object-fit: contain;
        filter: drop-shadow(0 2px 8px rgba(201,162,39,.4));
        transition: transform .2s;
      }
      .about-award-thumb:hover { transform: scale(1.1); }
      .about-bullets {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin: 24px 0 32px;
      }
      .about-bullets li {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        font-size: .93rem;
        color: var(--muted);
      }
      .about-bullets li::before {
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--blue);
        margin-top: 7px;
        flex-shrink: 0;
      }
      @media (min-width: 880px) {
        .about-layout { grid-template-columns: 1fr 1fr; }
        .about-img-wrap { max-width: none; margin: 0; }
      }

      /* ════════════════════════════════════
         WHO WE HELP
      ════════════════════════════════════ */
      .who-layout {
        display: grid;
        gap: 52px;
        align-items: center;
      }
      .who-img {
        width: 100%;
        max-width: 520px;
        border-radius: var(--r-lg);
        box-shadow: var(--sh-lift);
        display: block;
        margin: 0 auto;
      }
      .who-list {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin: 28px 0 36px;
      }
      .who-item {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        padding: 16px 18px;
      }
      .who-item__icon {
        font-size: 1.4rem;
        flex-shrink: 0;
        margin-top: 2px;
      }
      .who-item__title {
        font-size: .95rem;
        font-weight: 700;
        color: var(--text);
        margin-bottom: 2px;
      }
      .who-item__body {
        font-size: .84rem;
        color: var(--muted);
      }
      @media (min-width: 880px) {
        .who-layout { grid-template-columns: 1fr 1fr; }
        .who-img { max-width: none; margin: 0; }
      }

      /* ════════════════════════════════════
         FAQ
      ════════════════════════════════════ */
      .faq-list { max-width: 760px; margin: 0 auto; }
      .faq-item {
        border-bottom: 1px solid var(--border);
      }
      .faq-item:first-child { border-top: 1px solid var(--border); }
      .faq-trigger {
        width: 100%;
        background: none;
        border: none;
        cursor: pointer;
        font-family: inherit;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        padding: 20px 4px;
        text-align: left;
        font-size: .97rem;
        font-weight: 600;
        color: var(--text);
        transition: color .18s;
      }
      .faq-trigger:hover { color: var(--blue); }
      .faq-trigger__icon {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 2px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        color: var(--blue);
        flex-shrink: 0;
        transition: transform .25s, background .18s;
      }
      .faq-item.open .faq-trigger__icon {
        transform: rotate(45deg);
        background: var(--blue);
        border-color: var(--blue);
        color: #fff;
      }
      .faq-answer {
        max-height: 0;
        overflow: hidden;
        transition: max-height .35s ease;
      }
      .faq-answer p {
        padding: 0 4px 20px;
        font-size: .9rem;
        color: var(--muted);
        line-height: 1.7;
      }

      /* ════════════════════════════════════
         FINAL CTA
      ════════════════════════════════════ */
      .cta-section {
        background: linear-gradient(135deg, var(--blue-deep) 0%, var(--blue) 100%);
        padding: 90px 0;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      .cta-section::before {
        content: '';
        position: absolute;
        inset: 0;
        background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='1' fill='white' fill-opacity='0.04'/%3E%3C/svg%3E") repeat;
      }
      .cta-section > * { position: relative; }
      .cta-section .section-title { color: #fff; margin-bottom: 14px; }
      .cta-section .section-sub { color: rgba(255,255,255,.78); margin: 0 auto 36px; }
      .cta-section .hero__trust {
        justify-content: center;
        margin-top: 32px;
      }
      .cta-section .hero__trust-item { color: rgba(255,255,255,.7); }

      /* ════════════════════════════════════
         FOOTER
      ════════════════════════════════════ */
      .footer {
        background: var(--dark);
        padding: 48px 0 36px;
        color: rgba(255,255,255,.55);
      }
      .footer__inner {
        display: flex;
        flex-direction: column;
        gap: 28px;
        align-items: center;
        text-align: center;
      }
      .footer__logo {
        font-size: 1.2rem;
        font-weight: 800;
        color: #fff;
      }
      .footer__logo span { color: var(--gold-lt); }
      .footer__tagline {
        font-size: .82rem;
        color: rgba(255,255,255,.45);
        margin-top: 4px;
      }
      .footer__links {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 24px;
        justify-content: center;
        list-style: none;
      }
      .footer__links a {
        font-size: .82rem;
        color: rgba(255,255,255,.55);
        transition: color .18s;
      }
      .footer__links a:hover { color: #fff; }
      .footer__copy {
        font-size: .78rem;
        color: rgba(255,255,255,.3);
      }

      /* ════════════════════════════════════
         BOOKING MODAL
      ════════════════════════════════════ */
      .modal-backdrop {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(8,18,32,.7);
        backdrop-filter: blur(6px);
        z-index: 200;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .modal-backdrop.open { display: flex; }
      .modal {
        background: #fff;
        border-radius: var(--r-lg);
        width: 100%;
        max-width: 520px;
        box-shadow: 0 30px 80px rgba(0,0,0,.35);
        overflow: hidden;
        animation: modalIn .3s ease;
      }
      @keyframes modalIn {
        from { opacity: 0; transform: scale(.93) translateY(20px); }
        to   { opacity: 1; transform: none; }
      }
      .modal__header {
        background: linear-gradient(135deg, var(--blue-deep), var(--blue));
        padding: 28px 28px 24px;
        color: #fff;
        position: relative;
      }
      .modal__close {
        position: absolute;
        top: 16px; right: 16px;
        background: rgba(255,255,255,.15);
        border: none;
        color: #fff;
        width: 30px; height: 30px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background .18s;
      }
      .modal__close:hover { background: rgba(255,255,255,.28); }
      .modal__title { font-size: 1.3rem; font-weight: 800; margin-bottom: 4px; }
      .modal__sub { font-size: .84rem; color: rgba(255,255,255,.75); }
      .modal__body { padding: 28px; }
      .form-group { margin-bottom: 18px; }
      .form-group label {
        display: block;
        font-size: .82rem;
        font-weight: 600;
        color: var(--text);
        margin-bottom: 6px;
      }
      .form-group input,
      .form-group select,
      .form-group textarea {
        width: 100%;
        padding: 11px 14px;
        border: 1.5px solid var(--border);
        border-radius: var(--r-sm);
        font-family: inherit;
        font-size: .92rem;
        color: var(--text);
        background: #fff;
        transition: border-color .18s, box-shadow .18s;
        outline: none;
      }
      .form-group input:focus,
      .form-group select:focus,
      .form-group textarea:focus {
        border-color: var(--blue);
        box-shadow: 0 0 0 3px rgba(26,123,196,.12);
      }
      .form-group textarea { resize: vertical; min-height: 90px; }
      .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .modal__submit {
        width: 100%;
        padding: 14px;
        border-radius: 100px;
        font-size: 1rem;
        font-weight: 700;
        background: var(--accent);
        color: #fff;
        border: none;
        cursor: pointer;
        transition: background .18s, box-shadow .18s, transform .18s;
        box-shadow: 0 6px 22px rgba(244,132,95,.38);
        font-family: inherit;
        margin-top: 4px;
      }
      .modal__submit:hover {
        background: var(--accent-dk);
        transform: translateY(-1px);
        box-shadow: 0 10px 28px rgba(244,132,95,.48);
      }
      .form-note {
        font-size: .75rem;
        color: var(--muted);
        text-align: center;
        margin-top: 10px;
      }
      .form-success {
        display: none;
        text-align: center;
        padding: 32px 28px 36px;
      }
      .form-success__icon { font-size: 3rem; margin-bottom: 14px; }
      .form-success__title {
        font-size: 1.3rem;
        font-weight: 800;
        color: var(--text);
        margin-bottom: 8px;
      }
      .form-success__body { font-size: .9rem; color: var(--muted); }
    </style>
  </head>
  <body>

    <!-- NAV -->
    <nav class="nav" id="mainNav">
      <a href="#" class="nav__logo">Kicking <span>Kiddos</span></a>
      <ul class="nav__links">
        <li><a href="#programs">Programs</a></li>
        <li><a href="#gallery">Gallery</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#testimonials">Reviews</a></li>
        <li><a href="#faq">FAQ</a></li>
      </ul>
      <a href="#" class="btn btn--primary nav__cta" onclick="openModal(); return false;">Book a Spot</a>
      <button class="nav__hamburger" id="hamburger" aria-label="Open menu">
        <span></span><span></span><span></span>
      </button>
    </nav>

    <div class="nav__mobile" id="mobileMenu">
      <a href="#programs" onclick="closeMobile()">Programs</a>
      <a href="#gallery" onclick="closeMobile()">Gallery</a>
      <a href="#about" onclick="closeMobile()">About</a>
      <a href="#testimonials" onclick="closeMobile()">Reviews</a>
      <a href="#faq" onclick="closeMobile()">FAQ</a>
      <a href="#" class="btn btn--primary" onclick="openModal(); closeMobile(); return false;">Book a Spot</a>
    </div>

    <!-- HERO -->
    <section class="hero">
      <div class="hero__bg"></div>
      <div class="hero__overlay"></div>
      <div class="hero__content container">
        <div class="hero__text">
          <div class="hero__badge-row">
            <img src="https://assets.cdn.filesafe.space/y8AfcwWjebLRDs50RH69/media/69a8891b36702f0821bf2de3.png" alt="2023 Platinum Award" class="hero__award-mini" />
            <img src="https://assets.cdn.filesafe.space/y8AfcwWjebLRDs50RH69/media/69a8891b22141b0d302d4e2a.png" alt="2024 Platinum Award" class="hero__award-mini" />
            <img src="https://assets.cdn.filesafe.space/y8AfcwWjebLRDs50RH69/media/69a8891d618c8d22c1cf5cf3.png" alt="2025 Platinum Award" class="hero__award-mini" />
            <span class="hero__badge-text">3x Platinum Award Winner</span>
          </div>
          <h1 class="hero__title">
            Your Child Learns to<br/>
            <em>Love the Water.</em><br/>
            Safely.
          </h1>
          <p class="hero__body">
            Private, one-on-one swim lessons for children 16 months and up in Topeka, KS.
            Award-winning instruction, real results, zero overwhelm.
          </p>
          <div class="hero__cta-row">
            <a href="#" class="btn btn--primary btn--lg" onclick="openModal(); return false;">
              Book Your First Lesson
            </a>
            <a href="#programs" class="btn btn--outline btn--lg">See Programs</a>
          </div>
          <div class="hero__trust">
            <div class="hero__trust-item">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.6)" stroke-width="2"/><path d="M8 12l3 3 5-5" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Starting at $25/lesson
            </div>
            <div class="hero__trust-item">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.6)" stroke-width="2"/><path d="M8 12l3 3 5-5" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Ages 16 months and up
            </div>
            <div class="hero__trust-item">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.6)" stroke-width="2"/><path d="M8 12l3 3 5-5" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Topeka, KS
            </div>
          </div>
        </div>
        <div class="hero__stats">
          <div class="hero__stat-card">
            <div class="hero__stat-num">3x</div>
            <div class="hero__stat-label">Platinum Award</div>
          </div>
          <div class="hero__stat-card">
            <div class="hero__stat-num">1:1</div>
            <div class="hero__stat-label">Private Lessons</div>
          </div>
          <div class="hero__stat-card">
            <div class="hero__stat-num">16mo+</div>
            <div class="hero__stat-label">Ages Welcome</div>
          </div>
          <div class="hero__stat-card">
            <div class="hero__stat-num">$25</div>
            <div class="hero__stat-label">Per Lesson</div>
          </div>
        </div>
      </div>
    </section>

    <!-- AWARDS STRIP -->
    <section class="awards-strip">
      <div class="container">
        <p class="awards-strip__headline">Recognized for excellence in aquatic instruction</p>
        <div class="awards-strip__row">
          <div class="award-card">
            <img
              src="https://assets.cdn.filesafe.space/y8AfcwWjebLRDs50RH69/media/69a8891b36702f0821bf2de3.png"
              alt="2023 Platinum Award Winner"
              class="award-card__img"
            />
            <div class="award-card__year">2023</div>
            <div class="award-card__name">Platinum Award Winner</div>
          </div>
          <div class="awards-strip__divider"></div>
          <div class="award-card">
            <img
              src="https://assets.cdn.filesafe.space/y8AfcwWjebLRDs50RH69/media/69a8891b22141b0d302d4e2a.png"
              alt="2024 Platinum Award Winner"
              class="award-card__img"
            />
            <div class="award-card__year">2024</div>
            <div class="award-card__name">Platinum Award Winner</div>
          </div>
          <div class="awards-strip__divider"></div>
          <div class="award-card">
            <img
              src="https://assets.cdn.filesafe.space/y8AfcwWjebLRDs50RH69/media/69a8891d618c8d22c1cf5cf3.png"
              alt="2025 Platinum Award Winner"
              class="award-card__img"
            />
            <div class="award-card__year">2025</div>
            <div class="award-card__name">Platinum Award Winner</div>
          </div>
        </div>
      </div>
    </section>

    <!-- PROOF BAR -->
    <div class="proof-bar">
      <div class="container">
        <div class="proof-bar__inner">
          <div class="proof-item"><div class="proof-item__dot"></div>100% private, one-on-one instruction</div>
          <div class="proof-item"><div class="proof-item__dot"></div>Flexible scheduling around your family</div>
          <div class="proof-item"><div class="proof-item__dot"></div>Safety-first, confidence-building approach</div>
          <div class="proof-item"><div class="proof-item__dot"></div>Topeka's most awarded swim instructor</div>
        </div>
      </div>
    </div>

    <!-- WAVE -->
    <div class="wave-wrap" style="background: var(--surface);">
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,0 C360,60 1080,0 1440,60 L1440,0 L0,0 Z" fill="#1a7bc4"/>
      </svg>
    </div>

    <!-- WHY DIFFERENT -->
    <section class="section section--alt" id="why">
      <div class="container">
        <div class="section-header centered reveal">
          <span class="eyebrow">Why Kicking Kiddos</span>
          <h2 class="section-title">Not All Swim Lessons Are Equal</h2>
          <p class="section-sub">
            We built a program where every child gets the undivided attention they need to grow confident in the water.
          </p>
        </div>
        <div class="diff-grid">
          <div class="diff-card reveal">
            <div class="diff-card__icon">🏊</div>
            <div>
              <div class="diff-card__title">100% Private Instruction</div>
              <div class="diff-card__body">Your child is never sharing the pool with strangers. Every minute of every lesson is focused entirely on them.</div>
            </div>
          </div>
          <div class="diff-card reveal">
            <div class="diff-card__icon">🎯</div>
            <div>
              <div class="diff-card__title">Progress at Their Pace</div>
              <div class="diff-card__body">No waiting for the group to catch up. Lessons adapt to your child's skill level and comfort every single session.</div>
            </div>
          </div>
          <div class="diff-card reveal">
            <div class="diff-card__icon">🛡️</div>
            <div>
              <div class="diff-card__title">Safety First, Always</div>
              <div class="diff-card__body">Water safety isn't an afterthought. We weave life-saving habits into every lesson from day one.</div>
            </div>
          </div>
          <div class="diff-card reveal">
            <div class="diff-card__icon">😊</div>
            <div>
              <div class="diff-card__title">Fear to Confidence</div>
              <div class="diff-card__body">Hesitant swimmers become water-lovers. Our calm, encouraging approach transforms anxiety into joy.</div>
            </div>
          </div>
          <div class="diff-card reveal">
            <div class="diff-card__icon">📅</div>
            <div>
              <div class="diff-card__title">Flexible Scheduling</div>
              <div class="diff-card__body">Lessons that fit your family's calendar, not the other way around. Weekdays, evenings, weekends available.</div>
            </div>
          </div>
          <div class="diff-card reveal">
            <div class="diff-card__icon">🏆</div>
            <div>
              <div class="diff-card__title">Award-Winning Results</div>
              <div class="diff-card__body">Three consecutive Platinum Awards don't happen by accident. They're earned through student outcomes and parent trust.</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- WAVE -->
    <div class="wave-wrap" style="background: #fff;">
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,60 C360,0 1080,60 1440,0 L1440,60 L0,60 Z" fill="#f4f9fd"/>
      </svg>
    </div>

    <!-- COMPARISON -->
    <section class="section" id="compare">
      <div class="container">
        <div class="section-header centered reveal">
          <span class="eyebrow">Private vs. Group</span>
          <h2 class="section-title">See the Difference for Yourself</h2>
          <p class="section-sub">Group lessons have their place. Private lessons have the results.</p>
        </div>
        <div class="compare-wrap reveal">
          <table class="compare-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Group Lessons</th>
                <th class="highlight">Private at Kicking Kiddos</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Instructor attention</td>
                <td class="neutral">Shared with 4-8 kids</td>
                <td class="highlight check">100% on your child</td>
              </tr>
              <tr>
                <td>Pace of learning</td>
                <td class="neutral">Group average</td>
                <td class="highlight check">Your child's pace</td>
              </tr>
              <tr>
                <td>Fear &amp; anxiety support</td>
                <td class="cross">Limited, group must move on</td>
                <td class="highlight check">Deep, patient support</td>
              </tr>
              <tr>
                <td>Schedule flexibility</td>
                <td class="cross">Fixed class times</td>
                <td class="highlight check">You choose the time</td>
              </tr>
              <tr>
                <td>Skill assessment</td>
                <td class="neutral">General level check</td>
                <td class="highlight check">Individual evaluation every lesson</td>
              </tr>
              <tr>
                <td>Award recognition</td>
                <td class="cross">N/A</td>
                <td class="highlight check">3x Platinum Award Winner</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- WAVE -->
    <div class="wave-wrap" style="background: var(--surface);">
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,0 C360,60 1080,0 1440,60 L1440,0 L0,0 Z" fill="#fff"/>
      </svg>
    </div>

    <!-- PROGRAMS -->
    <section class="section section--alt" id="programs">
      <div class="container">
        <div class="section-header centered reveal">
          <span class="eyebrow">Programs</span>
          <h2 class="section-title">A Lesson Plan for Every Swimmer</h2>
          <p class="section-sub">From first splash to stroke refinement, we meet your child exactly where they are.</p>
        </div>
        <div class="programs-grid">
          <div class="prog-card reveal">
            <img
              src="https://assets.cdn.filesafe.space/y8AfcwWjebLRDs50RH69/media/69a889bf4b6c779873132419.jpg"
              alt="Parent and Toddler Swim Lessons"
              class="prog-card__img"
            />
            <div class="prog-card__body">
              <span class="prog-card__tag">Ages 16 months - 3 years</span>
              <h3 class="prog-card__title">Parent + Toddler</h3>
              <p class="prog-card__desc">
                Bond in the water while building foundational water safety skills. You stay in the pool with your little one as they discover the joy of swimming in a calm, supportive environment.
              </p>
              <div class="prog-card__price">$25 <span>/ lesson</span></div>
              <a href="#" class="btn btn--primary" onclick="openModal(); return false;">Book Now</a>
            </div>
          </div>
          <div class="prog-card reveal">
            <img
              src="https://assets.cdn.filesafe.space/y8AfcwWjebLRDs50RH69/media/69a889bfb003fa9d728f71c7.jpg"
              alt="Beginner Swim Lessons"
              class="prog-card__img"
            />
            <div class="prog-card__body">
              <span class="prog-card__tag">Ages 3 - 7 years</span>
              <h3 class="prog-card__title">Beginner Swimmers</h3>
              <p class="prog-card__desc">
                Turn fear into confidence. We focus on water safety, breath control, floating, and the first strokes, all at the child's pace with no pressure and lots of encouragement.
              </p>
              <div class="prog-card__price">$25 <span>/ lesson</span></div>
              <a href="#" class="btn btn--primary" onclick="openModal(); return false;">Book Now</a>
            </div>
          </div>
          <div class="prog-card reveal">
            <img
              src="https://assets.cdn.filesafe.space/y8AfcwWjebLRDs50RH69/media/69a889bfbffadfa0e6814eb7.jpg"
              alt="Intermediate and Advanced Swim Lessons"
              class="prog-card__img"
            />
            <div class="prog-card__body">
              <span class="prog-card__tag">Ages 7+</span>
              <h3 class="prog-card__title">Intermediate + Advanced</h3>
              <p class="prog-card__desc">
                Refine technique, build stamina, and master all four strokes. Whether your child wants to swim laps or compete, we set the foundation for a lifelong love of the water.
              </p>
              <div class="prog-card__price">$25 <span>/ lesson</span></div>
              <a href="#" class="btn btn--primary" onclick="openModal(); return false;">Book Now</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- WAVE -->
    <div class="wave-wrap" style="background: #fff;">
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,60 C360,0 1080,60 1440,0 L1440,60 L0,60 Z" fill="#f4f9fd"/>
      </svg>
    </div>

    <!-- PROCESS -->
    <section class="section" id="process">
      <div class="container">
        <div class="section-header centered reveal">
          <span class="eyebrow">How It Works</span>
          <h2 class="section-title">Getting Started Is Simple</h2>
          <p class="section-sub">Four easy steps between today and your child's first splash.</p>
        </div>
        <div class="process-steps">
          <div class="process-step reveal">
            <div class="process-step__num">1</div>
            <div>
              <div class="process-step__title">Book a Spot</div>
              <div class="process-step__body">Fill out our quick form. We'll reach out within 24 hours to confirm your schedule.</div>
            </div>
          </div>
          <div class="process-step reveal">
            <div class="process-step__num">2</div>
            <div>
              <div class="process-step__title">Skills Assessment</div>
              <div class="process-step__body">Your child's first lesson starts with a quick, low-pressure evaluation so we can build the perfect plan.</div>
            </div>
          </div>
          <div class="process-step reveal">
            <div class="process-step__num">3</div>
            <div>
              <div class="process-step__title">Private Lessons Begin</div>
              <div class="process-step__body">One-on-one instruction, every session, tailored to your child's pace and goals.</div>
            </div>
          </div>
          <div class="process-step reveal">
            <div class="process-step__num">4</div>
            <div>
              <div class="process-step__title">Watch Them Thrive</div>
              <div class="process-step__body">Confidence grows lesson by lesson. You'll see the difference, and so will they.</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- GALLERY -->
    <section class="section section--alt" id="gallery">
      <div class="container">
        <div class="section-header centered reveal">
          <span class="eyebrow">In the Water</span>
          <h2 class="section-title">Real Lessons, Real Progress</h2>
        </div>
        <div class="gallery-grid">
          <div class="gallery-grid__item reveal">
            <img
              src="https://assets.cdn.filesafe.space/y8AfcwWjebLRDs50RH69/media/69a889bfbffadfa0e6814eb7.jpg"
              alt="Swim instructor with child in the pool"
            />
          </div>
          <div class="gallery-grid__item reveal">
            <img
              src="https://assets.cdn.filesafe.space/y8AfcwWjebLRDs50RH69/media/69a889bf4b6c779873132419.jpg"
              alt="Child learning to swim"
            />
          </div>
          <div class="gallery-grid__item reveal">
            <img
              src="https://assets.cdn.filesafe.space/y8AfcwWjebLRDs50RH69/media/69a889bfb003fa9d728f71c7.jpg"
              alt="Kids swimming lesson"
            />
          </div>
          <div class="gallery-grid__item reveal">
            <img
              src="https://assets.cdn.filesafe.space/y8AfcwWjebLRDs50RH69/media/69a889bf6fa6585490c2d61d.jpg"
              alt="Swimming lesson at the pool"
            />
          </div>
          <div class="gallery-grid__item reveal">
            <img
              src="https://assets.cdn.filesafe.space/y8AfcwWjebLRDs50RH69/media/69a889bf22141bc1b32d7a7d.jpg"
              alt="Child swimming with instructor"
            />
          </div>
          <div class="gallery-grid__item reveal">
            <img
              src="https://assets.cdn.filesafe.space/y8AfcwWjebLRDs50RH69/media/69a889c17bdf383f2a45d3b9.jpg"
              alt="Swim lesson progress"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- WAVE -->
    <div class="wave-wrap" style="background: #fff;">
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,60 C360,0 1080,60 1440,0 L1440,60 L0,60 Z" fill="#f4f9fd"/>
      </svg>
    </div>

    <!-- TESTIMONIALS -->
    <section class="section" id="testimonials">
      <div class="container">
        <div class="section-header centered reveal">
          <span class="eyebrow">Parent Reviews</span>
          <h2 class="section-title">Families Love Kicking Kiddos</h2>
          <p class="section-sub">Real parents, real children, real results.</p>
        </div>
        <div class="testi-grid">
          <div class="testi-card reveal">
            <div class="testi-card__stars">★★★★★</div>
            <p class="testi-card__quote">
              "My daughter was terrified of water. After just four private lessons she was jumping in on her own and asking to come back every week. Absolute miracle worker."
            </p>
            <div class="testi-card__author">Sarah M. <span class="testi-card__detail">- Mom of a 5-year-old</span></div>
          </div>
          <div class="testi-card reveal">
            <div class="testi-card__stars">★★★★★</div>
            <p class="testi-card__quote">
              "We tried group lessons twice and they never clicked. Private lessons here were a completely different experience. The patience and personalized attention made all the difference."
            </p>
            <div class="testi-card__author">David R. <span class="testi-card__detail">- Dad of a 7-year-old</span></div>
          </div>
          <div class="testi-card reveal">
            <div class="testi-card__stars">★★★★★</div>
            <p class="testi-card__quote">
              "Worth every penny. My son went from barely putting his face in the water to swimming a full lap independently. The personalized approach is unmatched."
            </p>
            <div class="testi-card__author">Jennifer K. <span class="testi-card__detail">- Mom of a 9-year-old</span></div>
          </div>
          <div class="testi-card reveal">
            <div class="testi-card__stars">★★★★★</div>
            <p class="testi-card__quote">
              "I enrolled my 18-month-old in the parent and toddler program. She loves the water now and has zero fear. The instructor is incredibly gentle and encouraging with the little ones."
            </p>
            <div class="testi-card__author">Melissa T. <span class="testi-card__detail">- Mom of a toddler</span></div>
          </div>
          <div class="testi-card reveal">
            <div class="testi-card__stars">★★★★★</div>
            <p class="testi-card__quote">
              "The flexible scheduling was a lifesaver for our busy family. And the quality of instruction is second to none. The Platinum Awards are well deserved."
            </p>
            <div class="testi-card__author">Chris B. <span class="testi-card__detail">- Dad of two</span></div>
          </div>
          <div class="testi-card reveal">
            <div class="testi-card__stars">★★★★★</div>
            <p class="testi-card__quote">
              "Best investment we made for our kids this year. The confidence they gained in the water has carried over into everything they do. Highly, highly recommend."
            </p>
            <div class="testi-card__author">Amanda L. <span class="testi-card__detail">- Mom of three</span></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ABOUT -->
    <section class="section section--alt" id="about">
      <div class="container">
        <div class="about-layout">
          <div class="about-img-wrap reveal">
            <img
              src="https://assets.cdn.filesafe.space/y8AfcwWjebLRDs50RH69/media/69a889bf6fa6586d8ec2d61c.jpg"
              alt="Kicking Kiddos swim instructor"
              class="about-img"
            />
            <div class="about-badge">
              <div class="about-badge__icon">🏆</div>
              <div>
                <div class="about-badge__num">3x</div>
                <div class="about-badge__label">Platinum Award Winner</div>
              </div>
            </div>
          </div>
          <div class="reveal">
            <span class="eyebrow">About Kicking Kiddos</span>
            <h2 class="section-title">Passionate About Water Safety and Happy Kids</h2>
            <p style="color: var(--muted); font-size: .95rem; line-height: 1.75; margin-bottom: 16px;">
              Kicking Kiddos was founded on a simple belief: every child deserves to feel safe, confident, and joyful in the water. With years of experience teaching children as young as 16 months, our program is rooted in patience, encouragement, and proven technique.
            </p>
            <p style="color: var(--muted); font-size: .95rem; line-height: 1.75; margin-bottom: 24px;">
              We have been recognized three years in a row with the Platinum Award for excellence in aquatic instruction. It is a recognition we are proud of, and one that reflects the trust our families place in us every single lesson.
            </p>
            <ul class="about-bullets">
              <li>Certified water safety and swim instruction professionals</li>
              <li>Patient, encouraging approach designed for children at every level</li>
              <li>Safety skills woven into every lesson, every time</li>
              <li>Flexible scheduling to fit your family's life</li>
              <li>Proudly serving the Topeka, Kansas community</li>
            </ul>
            <div class="about-awards-row">
              <img src="https://assets.cdn.filesafe.space/y8AfcwWjebLRDs50RH69/media/69a8891b36702f0821bf2de3.png" alt="2023 Platinum Award" class="about-award-thumb" />
              <img src="https://assets.cdn.filesafe.space/y8AfcwWjebLRDs50RH69/media/69a8891b22141b0d302d4e2a.png" alt="2024 Platinum Award" class="about-award-thumb" />
              <img src="https://assets.cdn.filesafe.space/y8AfcwWjebLRDs50RH69/media/69a8891d618c8d22c1cf5cf3.png" alt="2025 Platinum Award" class="about-award-thumb" />
              <img src="https://assets.cdn.filesafe.space/y8AfcwWjebLRDs50RH69/media/69a8891dedd0875c9c1ba671.png" alt="Youth Swimming Award 2025" class="about-award-thumb" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- WAVE -->
    <div class="wave-wrap" style="background: #fff;">
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,60 C360,0 1080,60 1440,0 L1440,60 L0,60 Z" fill="#f4f9fd"/>
      </svg>
    </div>

    <!-- WHO WE HELP -->
    <section class="section" id="who">
      <div class="container">
        <div class="who-layout">
          <div class="reveal">
            <span class="eyebrow">Who We Serve</span>
            <h2 class="section-title">Every Child Deserves to Feel Safe in the Water</h2>
            <p style="color: var(--muted); font-size: .95rem; line-height: 1.75; margin-bottom: 8px;">
              We work with children at all levels, from their very first encounter with water to advanced stroke development. If any of these sound like your child, we are the right fit.
            </p>
            <ul class="who-list">
              <li class="who-item">
                <span class="who-item__icon">😰</span>
                <div>
                  <div class="who-item__title">The Fearful Swimmer</div>
                  <div class="who-item__body">Refuses to put their face in, panics near deep water, or clings to the wall. Our patient approach turns fear into confidence, one breath at a time.</div>
                </div>
              </li>
              <li class="who-item">
                <span class="who-item__icon">👶</span>
                <div>
                  <div class="who-item__title">Toddlers (16 Months+)</div>
                  <div class="who-item__body">The perfect age to begin water safety skills. Parent-assisted lessons build a happy relationship with the water from the very start.</div>
                </div>
              </li>
              <li class="who-item">
                <span class="who-item__icon">🌱</span>
                <div>
                  <div class="who-item__title">Beginners Building Basics</div>
                  <div class="who-item__body">Never formally learned to swim? No problem. We build water safety, floating, and foundational strokes in a zero-pressure environment.</div>
                </div>
              </li>
              <li class="who-item">
                <span class="who-item__icon">🚀</span>
                <div>
                  <div class="who-item__title">Swimmers Leveling Up</div>
                  <div class="who-item__body">Already swimming but want to improve technique, stamina, or prepare for a swim team? We take developing swimmers to the next level.</div>
                </div>
              </li>
            </ul>
            <a href="#" class="btn btn--primary btn--lg" onclick="openModal(); return false;">Find the Right Program</a>
          </div>
          <div class="reveal">
            <img
              src="https://assets.cdn.filesafe.space/y8AfcwWjebLRDs50RH69/media/69a889bf6fa6586d8ec2d61c.jpg"
              alt="Child in swim lesson"
              class="who-img"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- WAVE -->
    <div class="wave-wrap" style="background: var(--surface);">
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,0 C360,60 1080,0 1440,60 L1440,0 L0,0 Z" fill="#fff"/>
      </svg>
    </div>

    <!-- FAQ -->
    <section class="section section--alt" id="faq">
      <div class="container">
        <div class="section-header centered reveal">
          <span class="eyebrow">FAQ</span>
          <h2 class="section-title">Questions? We Have Answers.</h2>
        </div>
        <div class="faq-list reveal">
          <div class="faq-item">
            <button class="faq-trigger" onclick="toggleFaq(this)">
              How young can my child start lessons?
              <span class="faq-trigger__icon">+</span>
            </button>
            <div class="faq-answer">
              <p>We welcome children as young as 16 months in our parent-assisted toddler program. Early water exposure builds confidence and safety awareness that lasts a lifetime.</p>
            </div>
          </div>
          <div class="faq-item">
            <button class="faq-trigger" onclick="toggleFaq(this)">
              What does a private lesson actually look like?
              <span class="faq-trigger__icon">+</span>
            </button>
            <div class="faq-answer">
              <p>Each lesson is 30 minutes of focused, one-on-one instruction tailored to your child's current skill level and goals. We start with a quick check-in, then move through skill-building exercises at a pace that feels comfortable and fun for your child.</p>
            </div>
          </div>
          <div class="faq-item">
            <button class="faq-trigger" onclick="toggleFaq(this)">
              How do you handle children who are scared of the water?
              <span class="faq-trigger__icon">+</span>
            </button>
            <div class="faq-answer">
              <p>Fear is completely normal and something we are very experienced with. We never force a child to do anything they are not ready for. Instead, we use games, patience, and a step-by-step approach to build comfort and trust. Most fearful swimmers show significant progress within a few lessons.</p>
            </div>
          </div>
          <div class="faq-item">
            <button class="faq-trigger" onclick="toggleFaq(this)">
              How often should my child take lessons?
              <span class="faq-trigger__icon">+</span>
            </button>
            <div class="faq-answer">
              <p>We recommend at least one lesson per week for consistent progress. Children who attend twice a week often reach their goals faster. Consistency is the single biggest factor in swimming improvement.</p>
            </div>
          </div>
          <div class="faq-item">
            <button class="faq-trigger" onclick="toggleFaq(this)">
              Why have you won the Platinum Award three years in a row?
              <span class="faq-trigger__icon">+</span>
            </button>
            <div class="faq-answer">
              <p>The Platinum Award recognizes outstanding quality and results in aquatic instruction. We have received it in 2023, 2024, and 2025 because of our commitment to personalized instruction, safety-first curriculum, and the measurable progress our students make. Our families and their children are the reason we keep earning it.</p>
            </div>
          </div>
          <div class="faq-item">
            <button class="faq-trigger" onclick="toggleFaq(this)">
              Where are lessons held?
              <span class="faq-trigger__icon">+</span>
            </button>
            <div class="faq-answer">
              <p>Lessons are held at our private pool facility in Topeka, KS. Details are provided after booking. We maintain a clean, safe, and welcoming environment for every family.</p>
            </div>
          </div>
          <div class="faq-item">
            <button class="faq-trigger" onclick="toggleFaq(this)">
              What is the price per lesson?
              <span class="faq-trigger__icon">+</span>
            </button>
            <div class="faq-answer">
              <p>Private lessons start at $25 per session. Packages are available for families who want to commit to a consistent schedule. We believe top-quality swim instruction should be accessible to every family in our community.</p>
            </div>
          </div>
          <div class="faq-item">
            <button class="faq-trigger" onclick="toggleFaq(this)">
              What if we need to cancel or reschedule?
              <span class="faq-trigger__icon">+</span>
            </button>
            <div class="faq-answer">
              <p>Life happens. We ask for at least 24 hours notice for cancellations or rescheduling. We do our best to accommodate your family's needs and find a time that works.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- WAVE -->
    <div class="wave-wrap" style="background: var(--blue);">
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,0 C360,60 1080,0 1440,60 L1440,0 L0,0 Z" fill="#f4f9fd"/>
      </svg>
    </div>

    <!-- FINAL CTA -->
    <section class="cta-section">
      <div class="container">
        <span class="eyebrow eyebrow--light">Ready to Start?</span>
        <h2 class="section-title section-title--white">Give Your Child the Gift of Water Confidence</h2>
        <p class="section-sub section-sub--white">
          Spots fill up fast. Book your child's first private lesson today and join Topeka's most trusted swim instruction program.
        </p>
        <a href="#" class="btn btn--white btn--lg" onclick="openModal(); return false;">
          Book a Lesson, Starting at $25
        </a>
        <div class="hero__trust">
          <div class="hero__trust-item">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.5)" stroke-width="2"/><path d="M8 12l3 3 5-5" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            No commitment required
          </div>
          <div class="hero__trust-item">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.5)" stroke-width="2"/><path d="M8 12l3 3 5-5" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            3x Platinum Award winner
          </div>
          <div class="hero__trust-item">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.5)" stroke-width="2"/><path d="M8 12l3 3 5-5" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Response within 24 hours
          </div>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer">
      <div class="container">
        <div class="footer__inner">
          <div>
            <div class="footer__logo">Kicking <span>Kiddos</span></div>
            <div class="footer__tagline">Award-winning private swim lessons in Topeka, KS</div>
          </div>
          <ul class="footer__links">
            <li><a href="#programs">Programs</a></li>
            <li><a href="#gallery">Gallery</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#testimonials">Reviews</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
          <div class="footer__copy">&copy; 2025 Kicking Kiddos. All rights reserved. Topeka, KS.</div>
        </div>
      </div>
    </footer>

    <!-- BOOKING MODAL -->
    <div class="modal-backdrop" id="modalBackdrop" onclick="handleBackdropClick(event)">
      <div class="modal">
        <div class="modal__header">
          <button class="modal__close" onclick="closeModal()" aria-label="Close">&times;</button>
          <div class="modal__title">Book Your Child's First Lesson</div>
          <div class="modal__sub">We'll reach out within 24 hours to confirm your spot.</div>
        </div>
        <div class="modal__body" id="modalBody">
          <form id="bookingForm" onsubmit="submitForm(event)">
            <div class="form-row">
              <div class="form-group">
                <label for="parentName">Parent / Guardian Name</label>
                <input type="text" id="parentName" name="parentName" placeholder="Jane Smith" required />
              </div>
              <div class="form-group">
                <label for="childName">Child's Name</label>
                <input type="text" id="childName" name="childName" placeholder="Emma" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="childAge">Child's Age</label>
                <select id="childAge" name="childAge" required>
                  <option value="" disabled selected>Select age</option>
                  <option>16 months - 2 years</option>
                  <option>3 - 4 years</option>
                  <option>5 - 6 years</option>
                  <option>7 - 9 years</option>
                  <option>10 - 12 years</option>
                  <option>13+ years</option>
                </select>
              </div>
              <div class="form-group">
                <label for="swimLevel">Current Swim Level</label>
                <select id="swimLevel" name="swimLevel" required>
                  <option value="" disabled selected>Select level</option>
                  <option>No experience</option>
                  <option>Very beginner</option>
                  <option>Some experience</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="phone">Phone Number</label>
                <input type="tel" id="phone" name="phone" placeholder="(785) 555-0100" required />
              </div>
              <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" name="email" placeholder="jane@email.com" required />
              </div>
            </div>
            <div class="form-group">
              <label for="availability">Preferred Days / Times</label>
              <input type="text" id="availability" name="availability" placeholder="e.g. Weekday afternoons or Saturday mornings" />
            </div>
            <div class="form-group">
              <label for="message">Anything else we should know? (optional)</label>
              <textarea id="message" name="message" placeholder="Any fears, special needs, or goals for your child..."></textarea>
            </div>
            <button type="submit" class="modal__submit">Request My Spot</button>
            <p class="form-note">No spam, ever. We will only contact you about your lesson.</p>
          </form>
        </div>
        <div class="form-success" id="formSuccess">
          <div class="form-success__icon">🎉</div>
          <div class="form-success__title">You're on the list!</div>
          <p class="form-success__body">
            Thanks for reaching out. We'll be in touch within 24 hours to confirm your child's first lesson. We can't wait to meet you!
          </p>
        </div>
      </div>
    </div>

    <script>
      /* NAV */
      const nav = document.getElementById('mainNav');
      window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 40);
      });
      const hamburger = document.getElementById('hamburger');
      const mobileMenu = document.getElementById('mobileMenu');
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        mobileMenu.classList.toggle('open');
      });
      function closeMobile() {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
      }

      /* SCROLL REVEAL */
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            observer.unobserve(e.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

      /* FAQ */
      function toggleFaq(btn) {
        const item = btn.closest('.faq-item');
        const answer = item.querySelector('.faq-answer');
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(i => {
          i.classList.remove('open');
          i.querySelector('.faq-answer').style.maxHeight = null;
        });
        if (!isOpen) {
          item.classList.add('open');
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      }

      /* MODAL */
      function openModal() {
        document.getElementById('modalBackdrop').classList.add('open');
        document.body.style.overflow = 'hidden';
      }
      function closeModal() {
        document.getElementById('modalBackdrop').classList.remove('open');
        document.body.style.overflow = '';
      }
      function handleBackdropClick(e) {
        if (e.target === document.getElementById('modalBackdrop')) closeModal();
      }
      document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

      /* FORM SUBMIT */
      const GHL_WEBHOOK = 'YOUR_GHL_WEBHOOK_URL_HERE';
      async function submitForm(e) {
        e.preventDefault();
        const form = document.getElementById('bookingForm');
        const btn = form.querySelector('.modal__submit');
        btn.textContent = 'Sending...';
        btn.disabled = true;

        const data = {
          parentName: form.parentName.value,
          childName: form.childName.value,
          childAge: form.childAge.value,
          swimLevel: form.swimLevel.value,
          phone: form.phone.value,
          email: form.email.value,
          availability: form.availability.value,
          message: form.message.value,
          source: 'Kicking Kiddos Website'
        };

        try {
          await fetch(GHL_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
        } catch (_) {}

        document.getElementById('modalBody').style.display = 'none';
        document.getElementById('formSuccess').style.display = 'block';
      }
    </script>
  </body>
</html>
