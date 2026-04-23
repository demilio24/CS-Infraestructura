const fs = require('fs');
const path = require('path');

const API_KEY = 'pit-359b3244-3d2e-4661-af15-8a59bcbdc09f';
const LOCATION_ID = 'dYpRMKt41LMBrYEUoeLG';
const VERSION = '2021-07-28';

(async () => {
  const buf = fs.readFileSync('f:/GitHub/Websites/Mandy_VeLUS_Design/New Images/6.jpeg');
  const blob = new Blob([buf], { type: 'image/jpeg' });
  const form = new FormData();
  form.append('file', blob, 'editorial_6.jpeg');
  form.append('locationId', LOCATION_ID);
  const res = await fetch(`https://services.leadconnectorhq.com/medias/upload-file`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Version': VERSION, 'Accept': 'application/json' },
    body: form,
  });
  const data = await res.json();
  console.log(data.url || data.fileUrl || JSON.stringify(data));
})();
