// Batch re-capture every Mandy comparison section at 430px viewport
// (iPhone 14 Pro Max width) so wrapping matches her phone screenshots.
const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'Mandy_VeLUS_Design', 'comparisons');

const TARGETS = [
  // [selector, out-file, page-id]
  ['section.testimonies-section', 'reflection-2026-04-23/image-one-real-mobile.png', 'page-home'],
  ['section.statement', 'statement-2026-04-24/image-two-real-mobile.png', 'page-home'],
  ['section.editorial', 'editorial-2026-04-24/image-three-real-mobile.png', 'page-home'],
  ['.about-bio', 'about-2026-04-24/image-four-real-mobile.png', 'page-about'],
  ['section.work-section', 'our-work-2026-04-24/image-five-real-mobile.png', 'page-home'],
  ['.process-wrap', 'process-2026-04-24/image-six-real-mobile.png', 'page-services'],
  ['.svc-list', 'service-dropdown-2026-04-24/image-seven-real-mobile.png', 'page-services'],
  ['footer#site-footer', 'footer-2026-04-24/image-ten-real-mobile.png', 'page-home'],
];

for (const [sel, file, pg] of TARGETS) {
  const out = path.join(ROOT, file);
  console.log(`\n--- ${file} ---`);
  const r = spawnSync('node', ['qa-mandy-section.js', sel, out, pg], {
    cwd: __dirname,
    env: { ...process.env, VW: '430' },
    encoding: 'utf8',
  });
  process.stdout.write(r.stdout || '');
  if (r.stderr) process.stderr.write(r.stderr);
}
