const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = 'f:/GitHub/Websites/Mandy_VeLUS_Design/collectionsphotos';
const OUT = 'f:/GitHub/Websites/.claude/tmp_imgs/cropped';

const FILES = [
  'IMG_3699.jpeg',
  'IMG_3702.jpeg',
  'IMG_3703.jpeg',
  'IMG_3720.jpeg',
];

// Crop pixels from bottom — watermark is roughly 5% of image height,
// so crop 6% to clear it without eating into content
const CROP_RATIO = 0.06;

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  for (const f of FILES) {
    const inPath = path.join(SRC, f);
    const outPath = path.join(OUT, f);
    const meta = await sharp(inPath).metadata();
    const cropPx = Math.round(meta.height * CROP_RATIO);
    const newHeight = meta.height - cropPx;
    await sharp(inPath)
      .extract({ left: 0, top: 0, width: meta.width, height: newHeight })
      .jpeg({ quality: 92 })
      .toFile(outPath);
    console.log(`${f}: ${meta.width}x${meta.height} -> ${meta.width}x${newHeight} (-${cropPx}px)`);
  }
})();
