const sharp = require('sharp');
const path = require('path');

const src = 'f:/GitHub/Websites/Mandy_VeLUS_Design/comparisons/MANDYS-ORIGINAL-IMAGES/download.jfif';
const out = 'f:/GitHub/Websites/Mandy_VeLUS_Design/comparisons/MANDYS-ORIGINAL-IMAGES/image-two-original.png';

(async () => {
  const meta = await sharp(src).metadata();
  console.log(`source: ${meta.width}x${meta.height} ${meta.format}`);
  await sharp(src).png().toFile(out);
  console.log(`saved: ${out}`);
})();
