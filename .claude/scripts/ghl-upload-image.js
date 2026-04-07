#!/usr/bin/env node
/**
 * ghl-upload-image.js
 * Downloads an image/video from a URL and uploads it to a GoHighLevel media library.
 *
 * Binary upload preferred — gives proper GHL CDN URLs (assets.cdn.filesafe.space).
 * Falls back to hosted upload if binary fails.
 * Supports retry with backoff on rate limits (429) or server errors (5xx).
 *
 * Usage:
 *   node ghl-upload-image.js <media_url> <ghl_api_key> [filename]
 *
 * Output (JSON):
 *   { "success": true, "url": "https://...", "name": "...", "fileId": "...", ... }
 */

const https = require('https');
const http = require('http');
const path = require('path');
const crypto = require('crypto');

const [,, mediaUrl, apiKey, customFilename] = process.argv;

if (!mediaUrl || !apiKey) {
  console.error(JSON.stringify({ error: 'Usage: node ghl-upload-image.js <media_url> <ghl_api_key> [filename]' }));
  process.exit(1);
}

const TIMEOUT_MS = 30000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 5000;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fetchBuffer(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    if (redirects <= 0) return reject(new Error('Too many redirects'));
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: TIMEOUT_MS }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).href;
        return resolve(fetchBuffer(loc, redirects - 1));
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType: res.headers['content-type'] || guessContentType(url) }));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout fetching ${url}`)); });
  });
}

function guessContentType(url) {
  const ext = path.extname(new URL(url).pathname).toLowerCase().split('?')[0];
  const map = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.avif': 'image/avif', '.mp4': 'video/mp4', '.webm': 'video/webm',
    '.mov': 'video/quicktime', '.avi': 'video/x-msvideo',
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
        catch { reject(new Error(`GHL (${res.statusCode}): ${raw.substring(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('GHL upload timeout')); });
    req.write(body);
    req.end();
  });
}

function uploadHosted(fileUrl, filename, key) {
  return new Promise((resolve, reject) => {
    const boundary = '----FormBoundary' + crypto.randomBytes(16).toString('hex');
    const parts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="hosted"\r\n\r\ntrue`,
      `--${boundary}\r\nContent-Disposition: form-data; name="fileUrl"\r\n\r\n${fileUrl}`,
      `--${boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\n${filename}`,
      `--${boundary}--`,
    ].join('\r\n') + '\r\n';
    const body = Buffer.from(parts, 'utf-8');

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
        catch { reject(new Error(`GHL (${res.statusCode}): ${raw.substring(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('GHL hosted upload timeout')); });
    req.write(body);
    req.end();
  });
}

function isRetryable(status) {
  return status === 429 || (status >= 500 && status < 600);
}

(async () => {
  try {
    const urlPath = new URL(mediaUrl).pathname;
    const filename = customFilename
      || decodeURIComponent(path.basename(urlPath)).replace(/-\d+w/, '').replace(/\+/g, '-')
      || `media_${Date.now()}`;

    // Binary upload preferred — gives proper GHL CDN URLs
    const { buffer, contentType } = await fetchBuffer(mediaUrl);

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) await sleep(RETRY_DELAY_MS * attempt);

      const binary = await uploadBinary(buffer, contentType, filename, apiKey);
      if (binary.status >= 200 && binary.status < 300) {
        console.log(JSON.stringify({ success: true, method: 'binary', url: binary.url, fileId: binary.fileId, originalUrl: mediaUrl, filename, contentType }));
        return;
      }
      if (!isRetryable(binary.status)) {
        // Try hosted fallback once
        const hosted = await uploadHosted(mediaUrl, filename, apiKey);
        if (hosted.status >= 200 && hosted.status < 300) {
          console.log(JSON.stringify({ success: true, method: 'hosted', url: hosted.url, fileId: hosted.fileId, originalUrl: mediaUrl, filename, contentType }));
          return;
        }
        console.log(JSON.stringify({ success: false, error: `Binary ${binary.status}: ${binary.message || 'unknown'} | Hosted ${hosted.status}: ${hosted.message || 'unknown'}`, originalUrl: mediaUrl }));
        return;
      }
      // Retryable — loop again
    }

    console.log(JSON.stringify({ success: false, error: 'Max retries exceeded (rate limited or server error)', originalUrl: mediaUrl }));
  } catch (err) {
    console.log(JSON.stringify({ success: false, error: err.message, originalUrl: mediaUrl }));
  }
})();
