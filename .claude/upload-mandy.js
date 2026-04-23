const fs = require('fs');
const path = require('path');

const API_KEY = 'pit-359b3244-3d2e-4661-af15-8a59bcbdc09f';
const LOCATION_ID = 'dYpRMKt41LMBrYEUoeLG';
const VERSION = '2021-07-28';

const SRC = 'f:/GitHub/Websites/.claude/tmp_imgs/cropped';
const FILES = ['IMG_3699.jpeg','IMG_3702.jpeg','IMG_3703.jpeg','IMG_3720.jpeg'];

async function upload(file) {
  const buf = fs.readFileSync(path.join(SRC, file));
  const blob = new Blob([buf], { type: 'image/jpeg' });
  const form = new FormData();
  form.append('file', blob, file);
  form.append('locationId', LOCATION_ID);

  const res = await fetch(`https://services.leadconnectorhq.com/medias/upload-file`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Version': VERSION,
      'Accept': 'application/json',
    },
    body: form,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Upload ${file}: HTTP ${res.status} — ${text}`);
  const data = JSON.parse(text);
  return data;
}

(async () => {
  const results = {};
  for (const f of FILES) {
    try {
      const r = await upload(f);
      results[f] = r;
      const url = r.url || r.fileUrl || (r.meta && r.meta.url) || JSON.stringify(r);
      console.log(`${f} -> ${url}`);
    } catch (e) {
      console.error(`${f} FAILED:`, e.message);
    }
  }
  fs.writeFileSync('f:/GitHub/Websites/.claude/tmp_imgs/upload-results.json', JSON.stringify(results, null, 2));
})();
