// Live-site verification: Sarah C. and Becca S. were added to Wendy LCSS home.html
// Loads the deployed GitHub Pages URL, scrolls to the team grid, asserts both cards
// exist with the right photos, and screenshots proof.

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const URL = 'https://demilio24.github.io/Websites/Wendy_LowCountrySwimSchool/home.html';
const OUT = path.join(__dirname, 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

const EXPECTED = [
  {
    name: 'Sarah C.',
    photoSubstr: 'f52049ef-fbc6-483c-bbb9-ea62ae2d2670',
    bioSubstr: '17 years coaching',
  },
  {
    name: 'Becca S.',
    photoSubstr: '4e0d7581-a627-435f-97a0-5e21d68ce8d4',
    bioSubstr: 'aqua fitness',
  },
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  console.log(`→ Loading ${URL}`);
  const resp = await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  console.log(`  HTTP ${resp.status()}`);

  // Click the "Swim Instructors" filter to make sure we only see instructor cards
  await page.waitForSelector('.team-grid', { timeout: 15000 });

  // Pull every team member card -> {name, imgSrc, bio}
  const cards = await page.$$eval('.team-member', (els) =>
    els.map((el) => ({
      name: (el.querySelector('.member-name')?.textContent || '').trim(),
      title: (el.querySelector('.member-title')?.textContent || '').trim(),
      bio: (el.querySelector('.member-bio')?.textContent || '').trim(),
      img: el.querySelector('img.member-image')?.getAttribute('src') || '',
      index: el.getAttribute('data-index'),
      category: el.getAttribute('data-category'),
    }))
  );

  console.log(`→ Found ${cards.length} total team cards`);

  const findings = [];
  let allPass = true;
  for (const exp of EXPECTED) {
    const match = cards.find((c) => c.name === exp.name);
    if (!match) {
      findings.push({ name: exp.name, ok: false, why: 'card not found' });
      allPass = false;
      continue;
    }
    const photoOk = match.img.includes(exp.photoSubstr);
    const bioOk = match.bio.toLowerCase().includes(exp.bioSubstr.toLowerCase());
    findings.push({
      name: exp.name,
      ok: photoOk && bioOk,
      photo: photoOk ? 'OK' : `MISMATCH (got ${match.img})`,
      bio: bioOk ? 'OK' : `MISMATCH (bio="${match.bio.slice(0, 80)}…")`,
      index: match.index,
      category: match.category,
    });
    if (!(photoOk && bioOk)) allPass = false;
  }

  console.log('\n=== VERIFICATION ===');
  for (const f of findings) console.log(JSON.stringify(f, null, 2));

  // Cards are filtered/hidden by default. Click the "Swim Instructors" filter
  // so the new cards become visible for screenshots.
  console.log('\n→ Clicking "Swim Instructors" filter...');
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.filter-btn')].find((b) =>
      /swim instructors/i.test(b.textContent)
    );
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Scroll to the LAST instructor card (Becca should be near the end) and screenshot
  // both the wide team grid context and a tight crop of the two new cards.
  const newCards = await page.$$eval('.team-member', (els) =>
    els
      .filter((el) => {
        const n = el.querySelector('.member-name')?.textContent.trim();
        return n === 'Sarah C.' || n === 'Becca S.';
      })
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { name: el.querySelector('.member-name').textContent.trim(), top: r.top + window.scrollY, left: r.left, height: r.height, width: r.width };
      })
  );

  console.log('\n→ Live-DOM positions of new cards:');
  console.log(JSON.stringify(newCards, null, 2));

  if (newCards.length === 2) {
    // Scroll to Sarah (first new card) and screenshot a viewport showing both
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.max(0, newCards[0].top - 100));
    await new Promise((r) => setTimeout(r, 800));
    const wide = path.join(OUT, 'wendy-new-instructors-live.png');
    await page.screenshot({ path: wide, fullPage: false });
    console.log(`→ Saved wide screenshot: ${wide}`);

    // Also screenshot each card individually
    for (const exp of EXPECTED) {
      const handle = await page.evaluateHandle((name) => {
        return [...document.querySelectorAll('.team-member')].find(
          (el) => el.querySelector('.member-name')?.textContent.trim() === name
        );
      }, exp.name);
      const el = handle.asElement();
      if (el) {
        const safe = exp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const file = path.join(OUT, `wendy-live-card-${safe}.png`);
        await el.screenshot({ path: file });
        console.log(`→ Saved card screenshot for ${exp.name}: ${file}`);
      }
    }
  }

  await browser.close();
  console.log(`\n=== RESULT: ${allPass ? 'PASS — both instructors live with correct photo + bio' : 'FAIL — see findings above'} ===`);
  process.exit(allPass ? 0 : 1);
})().catch((err) => {
  console.error('TEST CRASH:', err);
  process.exit(2);
});
