// Query GHL media library, find every "velus-*" comparison upload, write a
// name -> CDN URL manifest the doc generator can use.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ENV = fs.readFileSync(path.resolve(__dirname, '.env'), 'utf8');
const KEY = ENV.match(/^GHL_API_KEY_MANDY=(.+)$/m)[1].trim();
const LOC = ENV.match(/^GHL_LOCATION_ID_MANDY=(.+)$/m)[1].trim();

function fetchPage(offset, limit){
  const url = `https://services.leadconnectorhq.com/medias/files?locationId=${LOC}&limit=${limit}&offset=${offset}&sortBy=createdAt&sortOrder=desc&type=file`;
  const r = spawnSync('curl', ['-s', url, '-H', `Authorization: Bearer ${KEY}`, '-H', 'Version: 2021-07-28'], { encoding: 'utf8', maxBuffer: 50*1024*1024 });
  return JSON.parse(r.stdout);
}

const all = [];
let offset = 0;
while (true){
  const pg = fetchPage(offset, 100);
  if (!pg.files || pg.files.length === 0) break;
  all.push(...pg.files);
  if (pg.files.length < 100) break;
  offset += 100;
}

const velus = all.filter(f => f.name && f.name.startsWith('velus-'));
console.log(`Found ${velus.length} velus-* files in media library.`);

// Build folder -> { original: url, real_mobile: url, real_desktop: url } map
const out = {};
for (const f of velus){
  // names are like: velus-<folder>-<filename>
  const m = f.name.match(/^velus-(.+?)-(image-[a-z0-9-]+(?:-original|-real-mobile|-real-desktop))\.[a-z]+$/i);
  if (!m){ continue; }
  const folder = m[1];
  const role = m[2];
  if (!out[folder]) out[folder] = {};
  // De-dupe: keep newest URL only (since pages are sorted desc, first wins)
  if (!out[folder][role]) out[folder][role] = f.url;
}

const manifest = { generatedAt: new Date().toISOString(), location: LOC, folders: out };
const outPath = path.resolve(__dirname, 'mandy-comparisons-urls.json');
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
console.log(`Wrote ${outPath}`);
console.log('Folders:', Object.keys(out).length);
for (const f of Object.keys(out).sort()){
  console.log(`\n  ${f}`);
  for (const k of Object.keys(out[f])) console.log(`    ${k} -> ${out[f][k]}`);
}
