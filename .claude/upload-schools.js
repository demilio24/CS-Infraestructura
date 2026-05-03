#!/usr/bin/env node
// Uploads school logos to GHL and prints mapping.
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const apiKey = (env.match(/^GHL_API_KEY=(.+)$/m) || [])[1]?.trim();

const SCHOOLS = [
  { key: 'discovery', name: 'Discovery Dayschool', src: 'https://3560d23970958d79ecb1.cdn6.editmysite.com/uploads/b/3560d23970958d79ecb16b9296b428acb9bef0cc58cc5dc8128bfb8bf73b8c2e/discovery%20day%20school_1701046692.png' },
  { key: 'holy-cross', name: 'Holy Cross', src: 'https://3560d23970958d79ecb1.cdn6.editmysite.com/uploads/b/3560d23970958d79ecb16b9296b428acb9bef0cc58cc5dc8128bfb8bf73b8c2e/Holy%20Cross_1704763492.png' },
  { key: 'seacrest', name: 'Seacrest', src: 'https://3560d23970958d79ecb1.cdn6.editmysite.com/uploads/b/3560d23970958d79ecb16b9296b428acb9bef0cc58cc5dc8128bfb8bf73b8c2e/2025-08-21_09-03-53_1755781445.png' },
  { key: 'st-ann', name: 'St. Ann Catholic', src: 'https://3560d23970958d79ecb1.cdn6.editmysite.com/uploads/b/3560d23970958d79ecb16b9296b428acb9bef0cc58cc5dc8128bfb8bf73b8c2e/saint%20ann%20catholic_1701046600.png' },
  { key: 'st-jude-spirit', name: 'St. Jude (Spirit Dance)', src: 'https://3560d23970958d79ecb1.cdn6.editmysite.com/uploads/b/3560d23970958d79ecb16b9296b428acb9bef0cc58cc5dc8128bfb8bf73b8c2e/2023-11-26_22-38-17_1701056302.png' },
  { key: 'st-vincent', name: 'St. Vincent', src: 'https://3560d23970958d79ecb1.cdn6.editmysite.com/uploads/b/3560d23970958d79ecb16b9296b428acb9bef0cc58cc5dc8128bfb8bf73b8c2e/saint%20vincent_1701047346.png' },
  { key: 'unity', name: 'Unity School', src: 'https://3560d23970958d79ecb1.cdn6.editmysite.com/uploads/b/3560d23970958d79ecb16b9296b428acb9bef0cc58cc5dc8128bfb8bf73b8c2e/2025-05-06_14-34-46_1746556528.png' },
  { key: 'wellington', name: 'Wellington Elementary', src: 'https://3560d23970958d79ecb1.cdn6.editmysite.com/uploads/b/3560d23970958d79ecb16b9296b428acb9bef0cc58cc5dc8128bfb8bf73b8c2e/IMG_1951_1736305329.jpeg' },
  { key: 'flagler', name: 'Flagler Montessori', src: 'https://3560d23970958d79ecb1.cdn6.editmysite.com/uploads/b/3560d23970958d79ecb16b9296b428acb9bef0cc58cc5dc8128bfb8bf73b8c2e/2024-08-12_11-33-37_1723476825.png' },
  { key: 'kings-academy', name: "The King's Academy", src: 'https://3560d23970958d79ecb1.cdn6.editmysite.com/uploads/b/3560d23970958d79ecb16b9296b428acb9bef0cc58cc5dc8128bfb8bf73b8c2e/2025-08-21_09-10-10_1755781818.png' },
  { key: 'south-olive', name: 'South Olive', src: 'https://3560d23970958d79ecb1.cdn6.editmysite.com/uploads/b/3560d23970958d79ecb16b9296b428acb9bef0cc58cc5dc8128bfb8bf73b8c2e/south%20olive%20elementary_1701049219.png' },
  { key: 'st-andrews', name: "St. Andrew's School", src: 'https://3560d23970958d79ecb1.cdn6.editmysite.com/uploads/b/3560d23970958d79ecb16b9296b428acb9bef0cc58cc5dc8128bfb8bf73b8c2e/2025-08-21_09-17-30_1755782261.png' },
  { key: 'st-joan-arc', name: 'St. Joan of Arc', src: 'https://3560d23970958d79ecb1.cdn6.editmysite.com/uploads/b/3560d23970958d79ecb16b9296b428acb9bef0cc58cc5dc8128bfb8bf73b8c2e/saint%20joanne%20of%20arc_1701048821.png' },
  { key: 'st-jude', name: 'St. Jude', src: 'https://3560d23970958d79ecb1.cdn6.editmysite.com/uploads/b/3560d23970958d79ecb16b9296b428acb9bef0cc58cc5dc8128bfb8bf73b8c2e/st%20jude_1701049023.png' },
  { key: 'st-juliana-spirit', name: 'St. Juliana (Spirit Dance)', src: 'https://3560d23970958d79ecb1.cdn6.editmysite.com/uploads/b/3560d23970958d79ecb16b9296b428acb9bef0cc58cc5dc8128bfb8bf73b8c2e/2024-08-12_11-45-48_1723477557.png' },
  { key: 'palm-beach-public', name: 'Palm Beach Public', src: 'https://3560d23970958d79ecb1.cdn6.editmysite.com/uploads/b/3560d23970958d79ecb16b9296b428acb9bef0cc58cc5dc8128bfb8bf73b8c2e/palm%20beach%20public%20comets_1701049655.png' },
  { key: 'play-pals', name: 'Play Pals', src: 'https://3560d23970958d79ecb1.cdn6.editmysite.com/uploads/b/3560d23970958d79ecb16b9296b428acb9bef0cc58cc5dc8128bfb8bf73b8c2e/2024-08-12_11-29-31_1723476585.png' },
  { key: 'st-clare', name: 'St. Clare', src: 'https://3560d23970958d79ecb1.cdn6.editmysite.com/uploads/b/3560d23970958d79ecb16b9296b428acb9bef0cc58cc5dc8128bfb8bf73b8c2e/saint%20clare%20catholic%20school_1701049506.png' },
  { key: 'st-juliana', name: 'St. Juliana', src: 'https://3560d23970958d79ecb1.cdn6.editmysite.com/uploads/b/3560d23970958d79ecb16b9296b428acb9bef0cc58cc5dc8128bfb8bf73b8c2e/saint%20juliana_1701050542.png' },
  { key: 'guidepost', name: 'Guidepost Montessori', src: 'https://3560d23970958d79ecb1.cdn6.editmysite.com/uploads/b/3560d23970958d79ecb16b9296b428acb9bef0cc58cc5dc8128bfb8bf73b8c2e/g%20school_1701226147.png' },
  { key: 'palm-beach-public-spirit', name: 'Palm Beach Public (Spirit Dance)', src: 'https://3560d23970958d79ecb1.cdn6.editmysite.com/uploads/b/3560d23970958d79ecb16b9296b428acb9bef0cc58cc5dc8128bfb8bf73b8c2e/2024-01-08_20-09-49_1704762604.png' }
];

function fetchBuffer(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    if (redirects <= 0) return reject(new Error('redirects'));
    const cli = url.startsWith('https') ? https : http;
    const req = cli.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).href;
        return resolve(fetchBuffer(loc, redirects - 1));
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType: res.headers['content-type'] || 'image/png' }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function uploadBinary(buffer, contentType, filename, key) {
  return new Promise((resolve, reject) => {
    const boundary = '----FB' + crypto.randomBytes(12).toString('hex');
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([Buffer.from(header), buffer, Buffer.from(footer)]);
    const req = https.request({
      hostname: 'services.leadconnectorhq.com',
      path: '/medias/upload-file',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Version': '2021-07-28',
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        try { resolve({ status: res.statusCode, ...JSON.parse(raw) }); }
        catch { reject(new Error('GHL ' + res.statusCode + ': ' + raw.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  const results = {};
  for (const s of SCHOOLS) {
    try {
      const ext = path.extname(new URL(s.src).pathname).toLowerCase() || '.png';
      const filename = `school-${s.key}${ext}`;
      const { buffer, contentType } = await fetchBuffer(s.src);
      const r = await uploadBinary(buffer, contentType, filename, apiKey);
      if (r.status >= 200 && r.status < 300 && r.url) {
        results[s.key] = { name: s.name, url: r.url };
        console.error(`OK ${s.key} → ${r.url}`);
      } else {
        results[s.key] = { name: s.name, error: r.message || ('HTTP ' + r.status) };
        console.error(`FAIL ${s.key} ${r.status}`);
      }
    } catch (e) {
      results[s.key] = { name: s.name, error: e.message };
      console.error(`ERR ${s.key} ${e.message}`);
    }
  }
  console.log(JSON.stringify(results, null, 2));
})();
