const fs = require('fs');
const sharp = require('sharp');

const API_KEY = 'pit-359b3244-3d2e-4661-af15-8a59bcbdc09f';
const LOCATION_ID = 'dYpRMKt41LMBrYEUoeLG';
const VERSION = '2021-07-28';

const images = [
  { src: 'f:/GitHub/Websites/Mandy_VeLUS_Design/HomeImage1.png', out: 'f:/GitHub/Websites/Mandy_VeLUS_Design/HomeImage1_cropped.png', label: 'home_image_1_desktop.png' },
  { src: 'f:/GitHub/Websites/Mandy_VeLUS_Design/HomeImage2.png', out: 'f:/GitHub/Websites/Mandy_VeLUS_Design/HomeImage2_cropped.png', label: 'home_image_2_desktop.png' },
];

async function cropAndUpload(img) {
  // Inspect
  const meta = await sharp(img.src).metadata();
  console.log(`${img.label}: ${meta.width}x${meta.height}`);

  // Crop bottom 12% to fully clear the Gemini watermark
  const cropBottom = Math.round(meta.height * 0.12);
  const newHeight = meta.height - cropBottom;
  await sharp(img.src)
    .extract({ left: 0, top: 0, width: meta.width, height: newHeight })
    .toFile(img.out);
  console.log(`  cropped → ${meta.width}x${newHeight}`);

  // Upload to GHL
  const buf = fs.readFileSync(img.out);
  const blob = new Blob([buf], { type: 'image/png' });
  const form = new FormData();
  form.append('file', blob, img.label);
  form.append('locationId', LOCATION_ID);
  const res = await fetch('https://services.leadconnectorhq.com/medias/upload-file', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Version': VERSION, 'Accept': 'application/json' },
    body: form,
  });
  const data = await res.json();
  console.log(`  uploaded: ${data.url}`);
  return data.url;
}

(async () => {
  for (const img of images) {
    await cropAndUpload(img);
  }
})();
