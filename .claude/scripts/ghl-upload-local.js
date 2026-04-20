#!/usr/bin/env node
/**
 * ghl-upload-local.js
 * Uploads a local file to a GoHighLevel media library (binary upload).
 *
 * Usage:
 *   node ghl-upload-local.js <local_path> <ghl_api_key> [filename]
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const [,, localPath, apiKey, customFilename] = process.argv;

if (!localPath || !apiKey) {
  console.error(JSON.stringify({ error: 'Usage: node ghl-upload-local.js <local_path> <ghl_api_key> [filename]' }));
  process.exit(1);
}

const TIMEOUT_MS = 60000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 5000;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function guessContentType(p) {
  const ext = path.extname(p).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.avif': 'image/avif', '.mp4': 'video/mp4', '.webm': 'video/webm',
    '.mov': 'video/quicktime',
  };
  return map[ext] || 'application/octet-stream';
}

function uploadBinary(buffer, contentType, filename, key) {
  return new Promise((resolve, reject) => {
    const boundary = '----FormBoundary' + crypto.randomBytes(16).toString('hex');
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([Buffer.from(header), buffer, Buffer.from(footer)]);

    const req = https.request({
      hostname: 'services.leadconnectorhq.com',
      path: '/medias/upload-file',
      method: 'POST',
      timeout: TIMEOUT_MS,
      headers: {
        'Authorization': `Bearer ${key}`,
        'Version': '2021-07-28',
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        try { resolve({ status: res.statusCode, ...JSON.parse(raw) }); }
        catch { reject(new Error(`GHL (${res.statusCode}): ${raw.substring(0, 300)}`)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('GHL upload timeout')); });
    req.write(body);
    req.end();
  });
}

function isRetryable(status) {
  return status === 429 || (status >= 500 && status < 600);
}

(async () => {
  try {
    if (!fs.existsSync(localPath)) {
      console.log(JSON.stringify({ success: false, error: `File not found: ${localPath}` }));
      return;
    }
    const buffer = fs.readFileSync(localPath);
    const contentType = guessContentType(localPath);
    const filename = customFilename || path.basename(localPath).replace(/\+/g, '-');

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) await sleep(RETRY_DELAY_MS * attempt);
      const r = await uploadBinary(buffer, contentType, filename, apiKey);
      if (r.status >= 200 && r.status < 300) {
        console.log(JSON.stringify({ success: true, url: r.url, fileId: r.fileId, filename, contentType, localPath }));
        return;
      }
      if (!isRetryable(r.status)) {
        console.log(JSON.stringify({ success: false, error: `HTTP ${r.status}: ${r.message || JSON.stringify(r).substring(0, 300)}`, localPath }));
        return;
      }
    }
    console.log(JSON.stringify({ success: false, error: 'Max retries exceeded', localPath }));
  } catch (err) {
    console.log(JSON.stringify({ success: false, error: err.message, localPath }));
  }
})();
