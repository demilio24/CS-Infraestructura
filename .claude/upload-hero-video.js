const fs = require('fs');

const API_KEY = 'pit-359b3244-3d2e-4661-af15-8a59bcbdc09f';
const LOCATION_ID = 'dYpRMKt41LMBrYEUoeLG';
const VERSION = '2021-07-28';
const FILE = 'f:/GitHub/Websites/Mandy_VeLUS_Design/HeroVideo.mov';

(async () => {
  const buf = fs.readFileSync(FILE);
  console.log(`Uploading ${FILE} (${(buf.length / 1024 / 1024).toFixed(2)} MB)...`);
  const blob = new Blob([buf], { type: 'video/quicktime' });
  const form = new FormData();
  form.append('file', blob, 'hero_video.mov');
  form.append('locationId', LOCATION_ID);
  const res = await fetch('https://services.leadconnectorhq.com/medias/upload-file', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Version': VERSION, 'Accept': 'application/json' },
    body: form,
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
})();
