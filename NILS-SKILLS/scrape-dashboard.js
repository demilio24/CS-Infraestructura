#!/usr/bin/env node
/**
 * Nils Digital — Dashboard Data Scraper + Builder
 *
 * Usage:
 *   node scrape-dashboard.js              # scrape all accounts + rebuild dashboard
 *   node scrape-dashboard.js --build-only # rebuild dashboard from local data (no API calls)
 *   node scrape-dashboard.js --limit 20   # change reels per competitor
 */

const fs = require("fs");
const path = require("path");

const ENV_PATH = path.join(__dirname, ".env");
const DATA_DIR = path.join(__dirname, "dashboard-data");
const DASHBOARD_PATH = path.join(__dirname, "dashboard.html");
const ACTOR_ID = "apify~instagram-reel-scraper";

const MY_ACCOUNT = "nilsdigital";
const COMPETITORS = [
  "badmarketing",
  "funnelslayer",
  "hookagency",
  "kickchargecreative",
];
const DEFAULT_LIMIT = 20;

// ── API helpers ─────────────────────────────────────────
function loadKeys() {
  if (!fs.existsSync(ENV_PATH)) { console.error("No .env"); process.exit(1); }
  const keys = [];
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^APIFY_KEY_\d+=(.+)$/);
    if (m && m[1].trim()) keys.push(m[1].trim());
  }
  if (!keys.length) { console.error("No keys in .env"); process.exit(1); }
  return keys;
}

let keys = [], keyIdx = 0;
function nextKey() { return keys[keyIdx++ % keys.length]; }

async function scrapeAccount(username, limit) {
  let attempts = 0;
  while (attempts < keys.length) {
    const key = nextKey();
    try {
      console.log(`  [@${username}] scraping...`);
      const res = await fetch(
        `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?waitForFinish=300`,
        { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({ username: [username], resultsLimit: limit }) }
      );
      if (res.status === 402 || res.status === 429) { attempts++; continue; }
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      const dsId = (await res.json())?.data?.defaultDatasetId;
      if (!dsId) throw new Error("no dataset");
      const items = await (await fetch(
        `https://api.apify.com/v2/datasets/${dsId}/items?format=json`,
        { headers: { Authorization: `Bearer ${key}` } }
      )).json();
      console.log(`  [@${username}] ${items.length} reels`);
      return items;
    } catch (e) { console.error(`  [@${username}] ${e.message}`); attempts++; }
  }
  return [];
}

function parseReel(r, username) {
  const views = r.videoViewCount || r.viewCount || r.videoPlayCount || 0;
  const likes = r.likesCount || r.likes || 0;
  const comments = r.commentsCount || r.comments || 0;
  return {
    username: r.ownerUsername || username,
    shortCode: r.shortCode || "",
    url: r.url || "",
    caption: (r.caption || "").slice(0, 300),
    hook: (r.caption || "").split(/[.!?\n]/)[0].slice(0, 120),
    views, likes, comments,
    engagement: views > 0 ? +((likes + comments) / views * 100).toFixed(2) : 0,
    timestamp: r.timestamp || r.takenAtTimestamp || "",
    duration: r.videoDuration || 0,
  };
}

function stats(reels) {
  if (!reels.length) return { reels: 0, totalViews: 0, avgViews: 0, avgLikes: 0, avgComments: 0, avgEngagement: 0 };
  const tv = reels.reduce((s,r) => s + r.views, 0);
  const tl = reels.reduce((s,r) => s + r.likes, 0);
  const tc = reels.reduce((s,r) => s + r.comments, 0);
  return {
    reels: reels.length, totalViews: tv,
    avgViews: Math.round(tv / reels.length),
    avgLikes: Math.round(tl / reels.length),
    avgComments: Math.round(tc / reels.length),
    avgEngagement: +(reels.reduce((s,r) => s + r.engagement, 0) / reels.length).toFixed(2),
  };
}

// ── Snapshot I/O ────────────────────────────────────────
function saveSnapshot(date, myReels, compData) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const snap = { date, myAccount: MY_ACCOUNT, myReels, competitors: {} };
  for (const [n, reels] of Object.entries(compData)) snap.competitors[n] = reels;
  fs.writeFileSync(path.join(DATA_DIR, `snapshot-${date}.json`), JSON.stringify(snap, null, 2));
  console.log(`Snapshot saved: snapshot-${date}.json`);
}

function loadLatestSnapshot() {
  if (!fs.existsSync(DATA_DIR)) return null;
  const files = fs.readdirSync(DATA_DIR).filter(f => f.startsWith("snapshot-")).sort();
  if (!files.length) return null;
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, files[files.length - 1]), "utf-8"));
}

// ── Dashboard Builder ───────────────────────────────────
function buildDashboard() {
  const snap = loadLatestSnapshot();
  if (!snap) { console.error("No snapshot data. Run a scrape first."); process.exit(1); }

  const dataJson = JSON.stringify({
    date: snap.date,
    myAccount: snap.myAccount,
    myReels: snap.myReels,
    competitors: snap.competitors,
  });

  // Read client-side JS from external file to avoid template literal conflicts
  const clientJs = fs.readFileSync(path.join(__dirname, "dashboard-app.js"), "utf-8");

  const html = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<title>Nils Digital Dashboard</title>',
    '<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">',
    '<style>',
    '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}',
    ':root{--bg:#ffffff;--surface:#f9fafb;--surface2:#f3f4f6;--border:#e5e7eb;--text:#111827;--muted:#6b7280;--blue:#3b82f6;--blue-dim:#dbeafe;--green:#22c55e;--green-dim:#dcfce7;--red:#ef4444;--red-dim:#fee2e2;--yellow:#eab308;--radius:10px}',
    "body{font-family:'Instrument Sans',-apple-system,sans-serif;background:var(--bg);color:var(--text);padding:24px;font-size:14px;line-height:1.5}",
    '.wrap{max-width:1200px;margin:0 auto}',
    '.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:12px}',
    '.hdr h1{font-size:20px;font-weight:700}',
    '.filters{display:flex;gap:6px;flex-wrap:wrap;align-items:center}',
    '.fbtn{padding:6px 14px;border-radius:20px;border:1px solid var(--border);background:transparent;color:var(--muted);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s}',
    '.fbtn:hover{border-color:var(--blue);color:var(--text)}',
    '.fbtn.active{background:var(--blue);border-color:var(--blue);color:#fff}',
    '.refresh-info{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);margin-top:2px;flex-wrap:wrap}',
    '.refresh-dot{width:8px;height:8px;border-radius:50%;background:var(--green);flex-shrink:0}',
    '.refresh-hint{font-size:10px;color:var(--muted);opacity:.6}',
    // KPI cards with side-by-side comparison
    '.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:20px}',
    '.kpi{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px}',
    '.kpi-label{font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px}',
    '.kpi-compare{display:flex;align-items:center;gap:8px}',
    '.kpi-col{flex:1}',
    '.kpi-val{font-size:22px;font-weight:700;line-height:1}',
    '.kpi-who{font-size:10px;color:var(--muted);margin-top:3px}',
    '.kpi-col.me .kpi-val{color:var(--blue)}',
    '.kpi-col.them .kpi-val{color:var(--muted)}',
    '.kpi-vs{font-size:10px;color:var(--border);font-weight:600}',
    '.section-label{font-size:12px;font-weight:600;color:var(--muted);margin-bottom:8px}',
    '.period-label{font-weight:400;opacity:.6}',
    '.refresh-btn{padding:6px 14px;border-radius:20px;border:1px solid var(--border);background:transparent;color:var(--muted);font-size:12px;font-weight:600;text-decoration:none;font-family:inherit;transition:all .15s;display:inline-flex;align-items:center;gap:4px}',
    '.refresh-btn:hover{border-color:var(--blue);color:var(--blue);text-decoration:none}',
    '.hdr-controls{display:flex;flex-direction:column;gap:8px;align-items:flex-end}',
    '.control-row{display:flex;gap:8px;align-items:center}',
    '.control-label{font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.03em}',
    '.comp-select{padding:6px 12px;border-radius:20px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;appearance:auto}',
    '.comp-select:hover{border-color:var(--blue)}',
    '.inactive-note{font-size:9px;opacity:.5;font-weight:400}',
    '.kpi-na{font-size:18px;color:var(--border)}',
    '.outlier-badge{display:inline-block;background:var(--blue-dim);color:var(--blue);font-size:10px;font-weight:700;padding:1px 6px;border-radius:8px;margin-left:4px}',
    // Activity grid — compact with tooltip overflow visible
    '.activity-section{margin-bottom:16px;overflow:visible}',
    '.grid-wrap{overflow-x:auto;overflow-y:visible;padding-top:28px;padding-bottom:2px}',
    '.activity-grid{display:flex;gap:2px;max-height:40px;overflow:visible}',
    '.week-col{display:flex;flex-direction:column;gap:2px;flex:1;overflow:visible}',
    '.day-cell{width:100%;aspect-ratio:1;max-height:5px;min-width:4px;border-radius:1px;background:var(--surface2);position:relative;cursor:default;overflow:visible}',
    '.day-cell[data-level="1"]{background:#bfdbfe}',
    '.day-cell[data-level="2"]{background:#60a5fa}',
    '.day-cell[data-level="3"]{background:#3b82f6}',
    '.day-cell[data-level="4"]{background:#1d4ed8}',
    '.day-cell .tip{display:none;position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);background:var(--text);color:#fff;padding:4px 8px;border-radius:6px;font-size:10px;white-space:nowrap;z-index:10;pointer-events:none}',
    '.day-cell:hover .tip{display:block}',
    '.grid-legend{display:flex;align-items:center;gap:3px;margin-top:4px;font-size:9px;color:var(--muted)}',
    '.grid-legend .swatch{width:8px;height:8px;border-radius:1px}',
    // Posts table
    '.posts-section{margin-bottom:20px}',
    '.tbl-wrap{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow-x:auto}',
    'table{width:100%;border-collapse:collapse;font-size:12px}',
    'th{text-align:left;padding:8px 12px;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);border-bottom:1px solid var(--border);background:var(--surface2)}',
    'td{padding:7px 12px;border-bottom:1px solid var(--border)}',
    'tr:last-child td{border-bottom:none}',
    'tr:hover td{background:rgba(59,130,246,.04)}',
    'a{color:var(--blue);text-decoration:none}',
    'a:hover{text-decoration:underline}',
    '.hook-td{max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.perf-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}',
    '.perf-dot.high{background:var(--green)}.perf-dot.mid{background:var(--yellow)}.perf-dot.low{background:var(--red)}',
    '@media(max-width:640px){body{padding:12px}.kpis{grid-template-columns:repeat(2,1fr)}.kpi{padding:10px 12px}.kpi-val{font-size:18px}.hdr{flex-direction:column;gap:8px}.hdr h1{font-size:18px}.filters{width:100%}.activity-grid{max-height:30px}.tbl-wrap{font-size:11px}th,td{padding:5px 8px}.hook-td{max-width:140px}}',
    '</style>',
    '</head>',
    '<body>',
    '<div class="wrap" id="app"></div>',
    '<script>',
    'var DATA = ' + dataJson + ';',
    clientJs,
    '</script>',
    '</body>',
    '</html>',
  ].join('\n');

  fs.writeFileSync(DASHBOARD_PATH, html);
  console.log("Dashboard built: " + DASHBOARD_PATH);
}

// ── Main ────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const buildOnly = args.includes("--build-only");
  let limit = DEFAULT_LIMIT;
  const li = args.indexOf("--limit");
  if (li !== -1 && args[li+1]) limit = parseInt(args[li+1], 10);

  if (!buildOnly) {
    keys = loadKeys();
    console.log(`${keys.length} API key(s)\n`);

    const date = new Date().toISOString().split("T")[0];

    const myRaw = await scrapeAccount(MY_ACCOUNT, 50);
    const myReels = myRaw.map(r => parseReel(r, MY_ACCOUNT));

    const compResults = {};
    for (const c of COMPETITORS) {
      const raw = await scrapeAccount(c, limit);
      compResults[c] = raw.map(r => parseReel(r, c));
    }

    saveSnapshot(date, myReels, compResults);
  }

  buildDashboard();
  console.log("Done. Open dashboard.html in your browser.");
}

main().catch(e => { console.error(e); process.exit(1); });
