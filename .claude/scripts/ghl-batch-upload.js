#!/usr/bin/env node
/**
 * ghl-batch-upload.js
 * Parallel batch uploader to GoHighLevel media library with folder placement.
 *
 * Usage:
 *   node ghl-batch-upload.js <dir> <apiKey> <locationId> <parentId> <outFile> [concurrency] [prefix]
 *
 * - Scans <dir> for .jpg/.jpeg/.png
 * - Uploads each file into the folder identified by <parentId>
 * - Writes one JSONL line per upload to <outFile> (appends, resumable)
 * - Skips any filename already recorded as success in <outFile>
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const [,, dir, apiKey, locationId, parentId, outFile, concurrencyArg, prefixArg] = process.argv;
if (!dir || !apiKey || !locationId || !parentId || !outFile) {
  console.error('Usage: node ghl-batch-upload.js <dir> <apiKey> <locationId> <parentId> <outFile> [concurrency] [prefix]');
  process.exit(1);
}
const CONCURRENCY = parseInt(concurrencyArg || '6', 10);
const PREFIX = prefixArg || '';
const TIMEOUT_MS = 90000;
const MAX_RETRIES = 3;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function contentTypeFor(p) {
  const ext = path.extname(p).toLowerCase();
  return ({ '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' })[ext] || 'application/octet-stream';
}

function uploadOne(localPath, filename) {
  return new Promise((resolve, reject) => {
    const buffer = fs.readFileSync(localPath);
    const boundary = '----FB' + crypto.randomBytes(12).toString('hex');
    const CRLF = '\r\n';
    const parts = [];
    const appendField = (name, value) => {
      parts.push(Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}${value}${CRLF}`));
    };
    appendField('hosted', 'false');
    appendField('parentId', parentId);
    appendField('name', filename);
    appendField('altType', 'location');
    appendField('altId', locationId);
    parts.push(Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="file"; filename="${filename}"${CRLF}Content-Type: ${contentTypeFor(localPath)}${CRLF}${CRLF}`));
    parts.push(buffer);
    parts.push(Buffer.from(`${CRLF}--${boundary}--${CRLF}`));
    const body = Buffer.concat(parts);

    const req = https.request({
      hostname: 'services.leadconnectorhq.com',
      path: '/medias/upload-file',
      method: 'POST',
      timeout: TIMEOUT_MS,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        try {
          const parsed = JSON.parse(raw);
          resolve({ status: res.statusCode, ...parsed });
        } catch {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

async function uploadWithRetry(localPath, filename) {
  let lastErr = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) await sleep(2000 * attempt);
    try {
      const r = await uploadOne(localPath, filename);
      if (r.status >= 200 && r.status < 300 && r.url) return { success: true, url: r.url, fileId: r.fileId, filename };
      if (r.status === 429 || (r.status >= 500 && r.status < 600)) { lastErr = `HTTP ${r.status}`; continue; }
      return { success: false, error: `HTTP ${r.status}: ${(r.raw || r.message || JSON.stringify(r)).toString().substring(0, 250)}`, filename };
    } catch (e) { lastErr = e.message; }
  }
  return { success: false, error: lastErr || 'unknown', filename };
}

function loadDone(outFile) {
  const done = new Set();
  if (!fs.existsSync(outFile)) return done;
  const lines = fs.readFileSync(outFile, 'utf8').split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.success && obj.filename) done.add(obj.filename);
    } catch {}
  }
  return done;
}

(async () => {
  const allFiles = fs.readdirSync(dir)
    .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
    .sort((a, b) => {
      const na = parseInt((a.match(/-(\d+)\./) || [0, 0])[1], 10);
      const nb = parseInt((b.match(/-(\d+)\./) || [0, 0])[1], 10);
      return na - nb;
    });

  const done = loadDone(outFile);
  const queue = allFiles
    .map(f => ({ localPath: path.join(dir, f), filename: PREFIX + f }))
    .filter(t => !done.has(t.filename));

  console.log(`[batch] total=${allFiles.length} already_done=${done.size} to_upload=${queue.length} concurrency=${CONCURRENCY}`);
  const outStream = fs.createWriteStream(outFile, { flags: 'a' });
  let idx = 0, ok = 0, fail = 0;
  const startTime = Date.now();

  async function worker(id) {
    while (true) {
      const i = idx++;
      if (i >= queue.length) return;
      const task = queue[i];
      const res = await uploadWithRetry(task.localPath, task.filename);
      outStream.write(JSON.stringify({ ...res, localPath: task.localPath }) + '\n');
      if (res.success) ok++; else fail++;
      if ((ok + fail) % 10 === 0 || i === queue.length - 1) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
        console.log(`[batch] ${ok + fail}/${queue.length}  ok=${ok} fail=${fail}  elapsed=${elapsed}s`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i)));
  outStream.end();
  console.log(`[batch] DONE ok=${ok} fail=${fail}`);
})();
