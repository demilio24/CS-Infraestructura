// Generate the side-by-side comparison HTML for Mandy.
// Styled to match her actual site: Canela serif, cream palette, uppercase
// section titles with thin rules, process-step numbering, Dior-level footer.
const fs = require('fs');
const path = require('path');

const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'mandy-comparisons-urls.json'), 'utf8'));
const F = manifest.folders;

const REVISIONS = [
  {
    folder: 'reflection-2026-04-23',
    title: 'Reflection',
    summary: `One reflection only with a "+ Read More" toggle. REFLECTION header in Canela 34px, quote in Canela 22px, name and location in Neue Haas 15px, "+ READ MORE" link in Neue Haas 15px.`,
  },
  {
    folder: 'statement-2026-04-24',
    title: 'Velus Statement',
    summary: `Mobile body 20px, header 32 to 36px, max-width about 600px, all left-aligned. Top + menu icon at far right.`,
  },
  {
    folder: 'editorial-2026-04-24',
    title: 'A Study in Restraint',
    summary: `Headlines (Canela) 32 to 36px, body (Neue Haas) 20px, feature quote 22px.`,
  },
  {
    folder: 'about-2026-04-24',
    title: 'About, Bio Body',
    summary: `Bio body reduced from 20px to 18px so the long-form reading feels right.`,
    note: 'No reference attached, adjustment-only.',
  },
  {
    folder: 'our-work-2026-04-24',
    title: 'Our Work',
    summary: `Title in Canela, body Neue Haas 20px / line-height 1.7 / max-width 600px / left-aligned. Full-width images. "VIEW COLLECTIONS" link refined to 15px Neue Haas, .18em letter-spacing, centered, thin underline.`,
  },
  {
    folder: 'process-2026-04-24',
    title: 'Our Process',
    summary: `Step titles Canela 30px, body Neue Haas 19px, numbers 15px. Service-statement body bumped to 19px in the follow-up.`,
  },
  {
    folder: 'service-dropdown-2026-04-24',
    title: 'Services Dropdown',
    summary: `Arrows replaced with a minimal + / − toggle. Service titles 24 to 26px, body 18px.`,
  },
  {
    folder: 'v-monogram-2026-04-24',
    title: 'V Monogram, Loading Page',
    summary: `Color lightened to soft warm gray (#D8D3CC). Opacity reduced to about 0.4. Scaled down 12%. Fades out on scroll instead of waiting for the timer.`,
  },
  {
    folder: 'home-logo-scroll-2026-04-24',
    title: 'Home, Logo + Menu + Scroll',
    summary: `Mobile logo +3% larger. + icon centered vertically with the logo and given proper margin from the right edge. Scroll indicator opacity bumped to .95, divider line bumped to .85.`,
    note: 'No reference attached, adjustment-only.',
  },
  {
    folder: 'footer-2026-04-24',
    title: 'Footer + Instagram, Dior-level',
    summary: `"VELUS INTERIORS" set in Canela about 25px, all caps, centered. Lines in Neue Haas 17px (Chicago, email, phone). @velusinteriors set on its own at 18px with extra space above. Everything centered.`,
    note: 'No reference attached, adjustment-only.',
  },
  {
    folder: 'collections-gradient-2026-04-24',
    title: 'Collections, Image Gradient and Title',
    summary: `Subtle dark gradient overlay added to the bottom 35% of every project tile. Title set to pure white #FFFFFF with a soft 0 1px 8px text-shadow. Title raised so it does not overlap the browser bar.`,
  },
  {
    folder: 'collections-photos-valmont-2026-04-24',
    title: 'Collections, Add Valmont Residence',
    summary: `Valmont Residence (Palm Beach, Florida) added as a new project with the green-bar photo as hero. The same image also replaces the first photo on the home page Our Work stack.`,
  },
  {
    folder: 'collections-cooper-2026-04-24',
    title: 'Collections, Add Cooper Residence Kitchen',
    summary: `Cooper Residence (Wilmette, Illinois) added as a new project with the dark kitchen photo as hero.`,
  },
  {
    folder: 'photo-expansion-2026-04-24',
    title: 'Photo Expansion, Lightbox',
    summary: `Left and right arrows removed entirely. Counter bumped to 16px and reformatted as "01 / 03". Counter centered closer under the image. Top padding increased so the project title and location sit clearly above the image with breathing room.`,
    note: 'No reference attached, built to spec.',
  },
  {
    folder: 'stojka-mirror-2026-04-24',
    title: 'Stojka, Mirror Photo First',
    summary: `Mirror photo (round mirror in entryway) is now the hero of the Stojka project and the first slide in the gallery.`,
  },
];

const TEXT_ONLY_NOTES = [
  {
    title: 'Karkalis Residence, Add Photo',
    summary: `IMG_6773 added to the Karkalis Residence gallery. Visible inside the photo expansion lightbox.`,
  },
  {
    title: 'Badger Residence, Add Photos and Location Fix',
    summary: `Location updated from "Lake View, Chicago" to "Lakeview, Illinois". The 3 prior placeholder photos replaced with your 5 final photos. Visible inside the photo expansion lightbox.`,
  },
];

const NUMS = ['one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen'];

function img(url, label){
  if (!url) return `<div class="missing">Not yet captured</div>`;
  return `<a href="${url}" target="_blank" rel="noopener"><img src="${url}" alt="${label}" loading="lazy"/></a>`;
}

const sectionsHtml = REVISIONS.map((r, idx) => {
  const u = F[r.folder] || {};
  const original = u['image-' + NUMS[idx] + '-original'];
  const real = u['image-' + NUMS[idx] + '-real-mobile'];
  const num = String(idx + 1).padStart(2, '0');
  const note = r.note ? `<div class="note">${r.note}</div>` : '';
  return `
    <article class="rev">
      <header class="rev-head">
        <div class="num">${num}</div>
        <hr class="rule"/>
        <h2>${r.title}</h2>
      </header>
      <p class="summary">${r.summary}</p>
      ${note}
      <div class="pair">
        <figure class="col">
          <figcaption>Your reference</figcaption>
          ${img(original, r.title + ' reference')}
        </figure>
        <figure class="col">
          <figcaption>Live site, mobile</figcaption>
          ${img(real, r.title + ' live')}
        </figure>
      </div>
    </article>`;
}).join('\n');

const notesHtml = TEXT_ONLY_NOTES.map((n, i) => {
  const num = String(REVISIONS.length + i + 1).padStart(2, '0');
  return `
    <article class="rev rev-note">
      <header class="rev-head">
        <div class="num">${num}</div>
        <hr class="rule"/>
        <h2>${n.title}</h2>
      </header>
      <p class="summary">${n.summary}</p>
    </article>`;
}).join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>VELUS Interiors, Revision Round 1</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<style>
  @font-face{font-family:'Canela';src:url('../Fonts/Canela-Light.woff2') format('woff2');font-weight:300;font-style:normal;font-display:swap}
  @font-face{font-family:'Canela';src:url('../Fonts/Canela-Regular.woff2') format('woff2');font-weight:400;font-style:normal;font-display:swap}
  @font-face{font-family:'Neue Haas Grotesk';src:url('../Fonts/NeueHaasGroteskDisplay-55Roman.woff2') format('woff2');font-weight:400;font-style:normal;font-display:swap}
  @font-face{font-family:'Neue Haas Grotesk';src:url('../Fonts/NeueHaasGroteskDisplay-65Medium.woff2') format('woff2');font-weight:500;font-style:normal;font-display:swap}

  :root{
    --bg:#F6F3EF;
    --paper:#FBF9F5;
    --ink:#1A1A1A;
    --muted:#6E665E;
    --rule:#D0D0D0;
    --serif:'Canela','Cormorant Garamond',Georgia,serif;
    --body:'Neue Haas Grotesk','Helvetica Neue',Arial,sans-serif;
    --ui:'Neue Haas Grotesk','Helvetica Neue',Arial,sans-serif;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:var(--bg);color:var(--ink);font-family:var(--body);-webkit-font-smoothing:antialiased;font-weight:400}
  a{color:inherit;text-decoration:none}
  img{display:block;max-width:100%;height:auto}

  /* TOP NAV (matches her solid nav) */
  nav.top{position:sticky;top:0;background:var(--bg);border-bottom:1px solid rgba(26,26,26,.08);z-index:50;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:0 40px;height:88px}
  nav.top .nav-logo{display:grid;place-items:center;text-align:center;grid-column:2}
  nav.top .nav-logo .wm{font-family:var(--serif);font-weight:400;font-size:24px;letter-spacing:.18em;text-transform:uppercase;line-height:1;color:var(--ink)}
  nav.top .nav-logo .sub{font-family:var(--body);font-size:9px;letter-spacing:.42em;text-transform:uppercase;color:var(--ink);margin-top:6px;opacity:.85}
  @media(max-width:768px){nav.top{padding:0 24px;height:68px}nav.top .nav-logo .wm{font-size:18px}nav.top .nav-logo .sub{font-size:8px;margin-top:4px}}

  .page{max-width:1180px;margin:0 auto;padding:80px 40px 120px}

  /* HERO */
  header.hero{text-align:center;padding-bottom:84px;margin-bottom:56px;border-bottom:1px solid var(--rule)}
  header.hero .eyebrow{font-family:var(--ui);font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:var(--muted);margin-bottom:24px}
  header.hero h1{font-family:var(--serif);font-weight:400;font-size:clamp(38px,5vw,58px);letter-spacing:.08em;text-transform:uppercase;line-height:1.1;color:var(--ink)}
  header.hero hr.rule{border:0;width:96px;height:1px;background:var(--rule);margin:36px auto 28px}
  header.hero .lede{max-width:580px;margin:0 auto;font-family:var(--body);font-size:16px;line-height:1.7;color:#3A332C;font-weight:400}
  header.hero .meta{margin-top:32px;font-family:var(--ui);font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:var(--muted)}

  /* REVISION SECTION */
  article.rev{padding:64px 0;border-bottom:1px solid var(--rule);position:relative}
  article.rev:last-of-type{border-bottom:none}

  .rev-head{max-width:760px;margin:0 0 32px}
  .rev-head .num{font-family:var(--ui);font-size:11px;letter-spacing:.32em;color:var(--muted);opacity:.55;margin-bottom:18px;font-weight:400}
  .rev-head hr.rule{border:0;width:64px;height:1px;background:var(--rule);margin:0 0 22px}
  .rev-head h2{font-family:var(--serif);font-weight:400;font-size:clamp(26px,2.6vw,32px);letter-spacing:.08em;text-transform:uppercase;line-height:1.2;color:var(--ink)}

  .summary{max-width:760px;font-family:var(--body);font-size:16px;line-height:1.7;color:#3A332C;font-weight:400}
  .note{max-width:760px;margin-top:14px;font-family:var(--ui);font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);opacity:.7}

  .pair{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:44px}
  figure.col{margin:0;background:var(--paper);padding:18px 18px 16px;border:1px solid var(--rule)}
  figure.col figcaption{font-family:var(--ui);font-size:10px;letter-spacing:.32em;text-transform:uppercase;color:var(--muted);margin-bottom:14px;font-weight:400}
  figure.col img{width:100%;height:auto;background:#fff}
  .missing{padding:60px 16px;background:#F0EBE2;border:1px dashed #C9C0B0;color:var(--muted);font-family:var(--ui);font-size:11px;text-align:center;letter-spacing:.22em;text-transform:uppercase}

  article.rev-note .summary{margin-bottom:0}

  /* DIVIDER FOR ADDITIONAL UPDATES */
  .divider-block{margin:88px 0 12px;text-align:center;border-top:1px solid var(--rule);padding-top:64px}
  .divider-block .eyebrow{font-family:var(--ui);font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:var(--muted);margin-bottom:18px}
  .divider-block h3{font-family:var(--serif);font-weight:400;font-size:clamp(22px,2.4vw,28px);letter-spacing:.18em;text-transform:uppercase;line-height:1.2;color:var(--ink)}
  .divider-block hr.rule{border:0;width:64px;height:1px;background:var(--rule);margin:24px auto 14px}
  .divider-block .lede{max-width:520px;margin:0 auto;font-family:var(--body);font-size:14px;line-height:1.7;color:var(--muted)}

  /* FOOTER (Dior-level, matches her new spec) */
  footer.colophon{margin-top:120px;padding:80px 24px 40px;border-top:1px solid var(--rule);text-align:center}
  footer.colophon .wm{font-family:var(--serif);font-weight:400;font-size:25px;letter-spacing:.22em;text-transform:uppercase;color:var(--ink);margin-bottom:28px;line-height:1.1}
  footer.colophon .info{display:flex;flex-direction:column;align-items:center;gap:18px;font-family:var(--body);font-size:17px;line-height:1.5;color:#2B2B2B;opacity:.88}
  footer.colophon .ig{margin-top:30px;font-family:var(--body);font-size:18px;font-weight:500;color:var(--ink);opacity:.95}
  footer.colophon .colophon-line{margin-top:42px;padding-top:24px;border-top:1px solid var(--rule);font-family:var(--ui);font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--muted);opacity:.75}

  @media(max-width:768px){
    .page{padding:48px 22px 80px}
    header.hero{padding-bottom:56px;margin-bottom:32px}
    article.rev{padding:48px 0}
    .pair{grid-template-columns:1fr;gap:28px;margin-top:32px}
    .rev-head{margin-bottom:24px}
    .summary{font-size:15.5px}
    footer.colophon{margin-top:80px;padding:60px 24px 36px}
    footer.colophon .info{font-size:16px;gap:14px}
  }
</style>
</head>
<body>

<nav class="top">
  <div></div>
  <div class="nav-logo">
    <div class="wm">VELUS</div>
    <div class="sub">Interiors</div>
  </div>
  <div></div>
</nav>

<main class="page">

  <header class="hero">
    <div class="eyebrow">Revision Round 01 · April 24, 2026</div>
    <h1>Site Revisions</h1>
    <hr class="rule"/>
    <p class="lede">Each section pairs your reference (left) with the current state of the live site (right). Click any image to open it full size in a new tab.</p>
    <div class="meta">${REVISIONS.length + TEXT_ONLY_NOTES.length} revisions · all complete</div>
  </header>

  ${sectionsHtml}

  <div class="divider-block">
    <div class="eyebrow">Additional Updates</div>
    <h3>Photo Library</h3>
    <hr class="rule"/>
    <p class="lede">These changes are visible inside the photo expansion lightbox when a project is opened.</p>
  </div>

  ${notesHtml}

</main>

<footer class="colophon">
  <div class="wm">VELUS INTERIORS</div>
  <div class="info">
    <div>Chicago, Illinois</div>
    <div>mandy@velusinteriors.com</div>
    <div>+1 (954) 540-9039</div>
  </div>
  <div class="ig">@velusinteriors</div>
  <div class="colophon-line">Prepared by NILS Digital · April 24, 2026</div>
</footer>

</body>
</html>`;

const out = path.resolve(__dirname, '..', 'Mandy_VeLUS_Design', 'comparisons', 'mandy-revisions-2026-04-24.html');
fs.writeFileSync(out, html);
console.log(`wrote ${out}`);
