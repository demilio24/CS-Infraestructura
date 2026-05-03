const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const https = require('https');

const photos = [
  {
    label: 'times-square',
    src: 'https://assets.cdn.filesafe.space/stoLOEGDIvEDY3xQI4B8/media/69c0b42b3b3a588539e628ff.jpg',
  },
  {
    label: 'on-stage',
    src: 'https://assets.cdn.filesafe.space/stoLOEGDIvEDY3xQI4B8/media/69c0b42bad1400e266fb9783.jpg',
  },
  {
    label: 'award-plaque',
    src: 'https://assets.cdn.filesafe.space/stoLOEGDIvEDY3xQI4B8/media/69c0b3d3aae4071024855a3e.jpg',
  },
];

const OUT_DIR = path.resolve('f:/GitHub/Websites/uploads');

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

(async () => {
  for (const p of photos) {
    process.stdout.write(`Fetching ${p.label}… `);
    const buf = await fetchBuffer(p.src);
    const meta = await sharp(buf).metadata();
    process.stdout.write(`${meta.width}x${meta.height}, ${Math.round(buf.length / 1024)} KB original\n`);

    // Cover desktop retina (~720px wide max in real layout) + a bit of headroom
    const TARGET_W = 900;
    const longSide = meta.width > meta.height ? 'width' : 'height';

    const outPng = path.join(OUT_DIR, `nils-${p.label}.png`);
    const outWebp = path.join(OUT_DIR, `nils-${p.label}.webp`);

    // PNG version (re-uploadable to GHL — its CDN auto-converts PNG→WebP)
    const pngBuf = await sharp(buf)
      .resize({ [longSide]: TARGET_W, withoutEnlargement: true })
      .png({ compressionLevel: 9, quality: 88 })
      .toBuffer();
    fs.writeFileSync(outPng, pngBuf);

    // WebP version (in case you'd rather host the WebP directly)
    const webpBuf = await sharp(buf)
      .resize({ [longSide]: TARGET_W, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    fs.writeFileSync(outWebp, webpBuf);

    console.log(
      `  → nils-${p.label}.png  (${Math.round(pngBuf.length / 1024)} KB)\n` +
        `  → nils-${p.label}.webp (${Math.round(webpBuf.length / 1024)} KB)`
    );
  }
  console.log('\nDone. Saved to f:/GitHub/Websites/uploads/');
})();
