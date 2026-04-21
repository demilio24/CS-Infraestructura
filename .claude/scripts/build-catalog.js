#!/usr/bin/env node
/**
 * build-catalog.js
 * Merges upload-results.jsonl + per-batch description JSONs into a final catalog.
 *
 * Usage:
 *   node build-catalog.js <uploadResultsJsonl> <descriptionsDir> <outDir>
 *
 * Produces:
 *   <outDir>/catalog.json   — array of { filename, description, url, fileId }
 *   <outDir>/catalog.md     — markdown table for human browsing
 */

const fs = require('fs');
const path = require('path');

const [,, uploadsPath, descDir, outDir] = process.argv;
if (!uploadsPath || !descDir || !outDir) {
  console.error('Usage: node build-catalog.js <uploadResultsJsonl> <descriptionsDir> <outDir>');
  process.exit(1);
}

// Load uploads
const uploadsByName = {};
const uploadLines = fs.readFileSync(uploadsPath, 'utf8').split('\n').filter(Boolean);
for (const line of uploadLines) {
  try {
    const o = JSON.parse(line);
    if (o.success && o.filename) uploadsByName[o.filename] = { url: o.url, fileId: o.fileId };
  } catch {}
}

// Load descriptions from per-batch JSON files
const descByName = {};
if (fs.existsSync(descDir)) {
  for (const f of fs.readdirSync(descDir).filter(n => n.endsWith('.json'))) {
    try {
      const arr = JSON.parse(fs.readFileSync(path.join(descDir, f), 'utf8'));
      for (const item of arr) {
        if (item.filename && item.description) descByName[item.filename] = item.description;
      }
    } catch (e) {
      console.error(`Failed to parse ${f}: ${e.message}`);
    }
  }
}

// Build catalog in numeric order
const allFilenames = Object.keys(uploadsByName).sort((a, b) => {
  const na = parseInt((a.match(/-(\d+)\./) || [0, 0])[1], 10);
  const nb = parseInt((b.match(/-(\d+)\./) || [0, 0])[1], 10);
  return na - nb;
});

const catalog = allFilenames.map(fn => ({
  filename: fn,
  description: descByName[fn] || null,
  url: uploadsByName[fn].url,
  fileId: uploadsByName[fn].fileId,
}));

const withDesc = catalog.filter(c => c.description).length;
const withoutDesc = catalog.length - withDesc;

fs.writeFileSync(path.join(outDir, 'catalog.json'), JSON.stringify(catalog, null, 2));

// Markdown
let md = `# Center Lane Swim School — Photo Catalog\n\n`;
md += `**Total:** ${catalog.length} photos  `;
md += `**With descriptions:** ${withDesc}  **Pending:** ${withoutDesc}\n\n`;
md += `**GHL Folder:** CenterLaneSwim_2026 (ID: 69e65eae38381eafa8e345b4)\n\n`;
md += `| # | Filename | Description | URL |\n|---|---|---|---|\n`;
for (const c of catalog) {
  const num = (c.filename.match(/-(\d+)\./) || [0, 0])[1];
  const desc = (c.description || '_(pending)_').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  md += `| ${num} | ${c.filename} | ${desc} | [link](${c.url}) |\n`;
}
fs.writeFileSync(path.join(outDir, 'catalog.md'), md);

console.log(`Wrote ${catalog.length} entries to catalog.json + catalog.md  (descriptions: ${withDesc}/${catalog.length})`);
