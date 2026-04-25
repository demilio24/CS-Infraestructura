// Walk every revision folder under Mandy_VeLUS_Design/comparisons/, upload
// each image to Mandy's GHL media library, and write a JSON manifest with
// CDN URLs that the doc generator will use.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ENV = require('fs').readFileSync(path.resolve(__dirname, '.env'), 'utf8');
function envVal(k){ const m = ENV.match(new RegExp('^' + k + '=(.+)$', 'm')); return m ? m[1].trim() : null; }
const KEY = envVal('GHL_API_KEY_MANDY');
const LOC = envVal('GHL_LOCATION_ID_MANDY');
if (!KEY || !LOC) { console.error('Missing Mandy GHL creds'); process.exit(1); }

const ROOT = path.resolve(__dirname, '..', 'Mandy_VeLUS_Design', 'comparisons');
const MANIFEST_OUT = path.resolve(__dirname, 'mandy-comparisons-manifest.json');

const SKIP_DIRS = new Set(['MANDYS-ORIGINAL-IMAGES']);
const IMG_RE = /\.(png|jpe?g|webp|gif)$/i;

function uploadOne(absPath, niceName){
  const args = [
    '-X','POST','https://services.leadconnectorhq.com/medias/upload-file',
    '-H', `Authorization: Bearer ${KEY}`,
    '-H', 'Version: 2021-07-28',
    '-F', `file=@${absPath};filename=${niceName}`,
    '-F', `locationId=${LOC}`,
    '-s'
  ];
  const r = spawnSync('curl', args, { encoding: 'utf8', maxBuffer: 50*1024*1024 });
  if (r.status !== 0) { console.error('curl exit', r.status, r.stderr); return null; }
  try {
    const j = JSON.parse(r.stdout);
    return j.fileId || j.id || j.url || j.cdnUrl || j;
  } catch(e){
    console.error('parse fail for', niceName, '\n', r.stdout.slice(0,500));
    return null;
  }
}

const manifest = { generatedAt: new Date().toISOString(), folders: [] };
const folders = fs.readdirSync(ROOT).filter(n => {
  if (SKIP_DIRS.has(n)) return false;
  return fs.statSync(path.join(ROOT,n)).isDirectory();
});

console.log(`Found ${folders.length} revision folders.\n`);

for (const folder of folders) {
  const dir = path.join(ROOT, folder);
  const files = fs.readdirSync(dir).filter(f => IMG_RE.test(f));
  const entry = { folder, files: [] };
  console.log(`\n== ${folder} ==`);
  for (const f of files) {
    const abs = path.join(dir, f);
    const nice = `velus-${folder}-${f}`.replace(/\s+/g,'_');
    process.stdout.write(`  ${f} ... `);
    const result = uploadOne(abs, nice);
    let url = null;
    if (result && typeof result === 'object') {
      url = result.url || result.cdnUrl || (result.fileId ? `https://assets.cdn.filesafe.space/${LOC}/media/${result.fileId}` : null);
    } else if (typeof result === 'string' && result.startsWith('http')) {
      url = result;
    }
    if (url) {
      console.log('OK');
      console.log(`    ${url}`);
    } else {
      console.log('FAIL');
      console.log('    response:', JSON.stringify(result).slice(0,200));
    }
    entry.files.push({ name: f, url, raw: result });
  }
  manifest.folders.push(entry);
}

fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2));
console.log(`\nManifest written: ${MANIFEST_OUT}`);
