const sharp = require('sharp');

const files = [
  'f:/GitHub/Websites/Mandy_VeLUS_Design/HomeImage1_cropped.png',
  'f:/GitHub/Websites/Mandy_VeLUS_Design/HomeImage2_cropped.png',
];

(async () => {
  for (const f of files) {
    const meta = await sharp(f).metadata();
    // Extract bottom-right 800x400 region for inspection
    const w = 800, h = 400;
    const left = meta.width - w;
    const top = meta.height - h;
    const outPath = f.replace('.png', '_bottomright.png');
    await sharp(f).extract({ left, top, width: w, height: h }).toFile(outPath);
    console.log(`${f}: cropped image is ${meta.width}x${meta.height}, bottom-right sample saved → ${outPath}`);
  }
})();
