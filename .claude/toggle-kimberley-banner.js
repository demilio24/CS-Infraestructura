// Toggle the enrollment-paused banner on all Kimberley Kicking Kiddos pages.
// Usage: node toggle-kimberley-banner.js off   (comments out the banner)
//        node toggle-kimberley-banner.js on    (re-enables it)
const fs = require('fs');
const path = require('path');

const DIR = path.resolve(__dirname, '..', 'Kimberely_KickingKiddos');
const mode = (process.argv[2] || 'off').toLowerCase();

const START_MARK = /<!-- BANNER-START:[^>]*-->/;
const END_MARK = /<!-- BANNER-END -->/;

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.html'));
let changed = 0;

for (const f of files) {
  const p = path.join(DIR, f);
  let txt = fs.readFileSync(p, 'utf8');
  const startM = txt.match(START_MARK);
  const endM = txt.match(END_MARK);
  if (!startM || !endM) { console.log(`  skip ${f} (no banner markers)`); continue; }
  const startIdx = startM.index + startM[0].length;
  const endIdx = endM.index;
  const inner = txt.slice(startIdx, endIdx);
  let newInner;
  if (mode === 'off') {
    if (inner.trim().startsWith('<!--')) { console.log(`  already off: ${f}`); continue; }
    newInner = `\n<!--\n${inner.trim()}\n-->\n`;
  } else {
    const trimmed = inner.trim();
    if (!trimmed.startsWith('<!--') || !trimmed.endsWith('-->')) { console.log(`  already on: ${f}`); continue; }
    newInner = '\n' + trimmed.replace(/^<!--\s*/, '').replace(/\s*-->$/, '') + '\n';
  }
  const newTxt = txt.slice(0, startIdx) + newInner + txt.slice(endIdx);
  fs.writeFileSync(p, newTxt);
  console.log(`  ${mode}: ${f}`);
  changed++;
}
console.log(`\nDone. ${changed} file(s) updated.`);
