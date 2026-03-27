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
  "hormozi",
  "imangadzhireels",
  "wesmcdowell",
  "leilahormozi",
  "max_sher",
  "funnelslayer",
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

  // Embed data directly into the HTML
  const dataJson = JSON.stringify({
    date: snap.date,
    myAccount: snap.myAccount,
    myReels: snap.myReels,
    competitors: snap.competitors,
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nils Digital Dashboard</title>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0f1117;--surface:#1a1d27;--surface2:#22252f;--border:#2a2d3a;
  --text:#e4e4e7;--muted:#71717a;--blue:#3b82f6;--blue-dim:#1e3a5f;
  --green:#22c55e;--green-dim:#14532d;--red:#ef4444;--red-dim:#7f1d1d;
  --yellow:#eab308;--radius:10px;
}
body{font-family:'Instrument Sans',-apple-system,sans-serif;background:var(--bg);color:var(--text);padding:24px;font-size:14px;line-height:1.5}
.wrap{max-width:1100px;margin:0 auto}

/* Header */
.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;flex-wrap:wrap;gap:12px}
.hdr h1{font-size:20px;font-weight:700}
.hdr .sub{color:var(--muted);font-size:12px}
.filters{display:flex;gap:6px;flex-wrap:wrap}
.fbtn{padding:6px 14px;border-radius:20px;border:1px solid var(--border);background:transparent;color:var(--muted);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s}
.fbtn:hover{border-color:var(--blue);color:var(--text)}
.fbtn.active{background:var(--blue);border-color:var(--blue);color:#fff}

/* KPI row */
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:24px}
.kpi{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px}
.kpi .label{font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.kpi .val{font-size:26px;font-weight:700;line-height:1}
.kpi .delta{font-size:11px;font-weight:600;margin-top:6px;display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:10px}
.kpi .delta.up{background:var(--green-dim);color:var(--green)}
.kpi .delta.down{background:var(--red-dim);color:var(--red)}
.kpi .delta.flat{background:var(--surface2);color:var(--muted)}

/* Activity grid */
.activity-section{margin-bottom:24px}
.activity-section .title{font-size:13px;font-weight:600;margin-bottom:10px;color:var(--muted)}
.grid-wrap{overflow-x:auto;padding-bottom:4px}
.activity-grid{display:flex;gap:3px}
.week-col{display:flex;flex-direction:column;gap:3px}
.day-cell{width:14px;height:14px;border-radius:3px;background:var(--surface2);position:relative;cursor:default}
.day-cell[data-count="0"]{background:var(--surface2)}
.day-cell[data-level="1"]{background:#1e3a5f}
.day-cell[data-level="2"]{background:#1d4ed8}
.day-cell[data-level="3"]{background:#3b82f6}
.day-cell[data-level="4"]{background:#60a5fa}
.day-cell .tip{display:none;position:absolute;bottom:20px;left:50%;transform:translateX(-50%);background:#000;color:#fff;padding:4px 8px;border-radius:6px;font-size:10px;white-space:nowrap;z-index:10;pointer-events:none}
.day-cell:hover .tip{display:block}
.grid-legend{display:flex;align-items:center;gap:4px;margin-top:8px;font-size:10px;color:var(--muted)}
.grid-legend .swatch{width:12px;height:12px;border-radius:2px}
.month-labels{display:flex;margin-bottom:4px;font-size:10px;color:var(--muted)}
.month-labels span{flex-shrink:0}

/* Posts table */
.posts-section{margin-bottom:24px}
.posts-section .title{font-size:13px;font-weight:600;margin-bottom:10px;color:var(--muted)}
.tbl-wrap{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:12px}
th{text-align:left;padding:10px 14px;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);border-bottom:1px solid var(--border);background:var(--surface2)}
td{padding:8px 14px;border-bottom:1px solid var(--border)}
tr:last-child td{border-bottom:none}
tr:hover td{background:rgba(59,130,246,.04)}
a{color:var(--blue);text-decoration:none}
a:hover{text-decoration:underline}
.hook-td{max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.perf-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}
.perf-dot.high{background:var(--green)}.perf-dot.mid{background:var(--yellow)}.perf-dot.low{background:var(--red)}

/* Compact competitor row */
.comp-section{margin-bottom:24px}
.comp-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}
.comp-mini{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px 14px}
.comp-mini .cname{font-size:12px;font-weight:700;margin-bottom:8px;color:var(--text)}
.comp-mini .crow{display:flex;justify-content:space-between;font-size:11px;padding:3px 0;color:var(--muted)}
.comp-mini .crow .cv{color:var(--text);font-weight:600}

/* Top hooks */
.hooks-section{margin-bottom:24px}
.hook-item{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 14px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;font-size:12px}
.hook-item .hook-text{flex:1;margin-right:12px}
.hook-item .hook-meta{color:var(--muted);white-space:nowrap;font-size:11px}

@media(max-width:640px){
  .kpis{grid-template-columns:repeat(2,1fr)}
  .kpi .val{font-size:20px}
  body{padding:12px}
}
</style>
</head>
<body>
<div class="wrap" id="app"></div>

<script>
const DATA = ${dataJson};

const MY = DATA.myAccount;
const reels = DATA.myReels.map(r => ({...r, _date: r.timestamp ? r.timestamp.split('T')[0] : ''})).sort((a,b) => a.timestamp.localeCompare(b.timestamp));
const compData = DATA.competitors;

// Competitor stats
function compStats(arr) {
  if(!arr.length) return {n:0,v:0,l:0,c:0,e:0};
  const tv=arr.reduce((s,r)=>s+r.views,0);
  const tl=arr.reduce((s,r)=>s+r.likes,0);
  const tc=arr.reduce((s,r)=>s+r.comments,0);
  return {n:arr.length,v:Math.round(tv/arr.length),l:Math.round(tl/arr.length),c:Math.round(tc/arr.length),e:+(arr.reduce((s,r)=>s+r.engagement,0)/arr.length).toFixed(2)};
}

// Date helpers
const today = new Date(DATA.date + 'T12:00:00');
function daysAgo(d, n) { const x = new Date(d); x.setDate(x.getDate() - n); return x; }
function fmt(d) { return d.toISOString().split('T')[0]; }
function filterReels(arr, days) {
  if (days === 0) return arr;
  const cutoff = fmt(daysAgo(today, days));
  return arr.filter(r => r._date >= cutoff);
}

let currentFilter = 0; // 0 = all

function render() {
  const filtered = filterReels(reels, currentFilter);
  const prevPeriodReels = currentFilter > 0
    ? reels.filter(r => {
        const cutStart = fmt(daysAgo(today, currentFilter * 2));
        const cutEnd = fmt(daysAgo(today, currentFilter));
        return r._date >= cutStart && r._date < cutEnd;
      })
    : [];

  // KPIs
  const totalPosts = filtered.length;
  const totalViews = filtered.reduce((s,r) => s + r.views, 0);
  const totalLikes = filtered.reduce((s,r) => s + r.likes, 0);
  const totalComments = filtered.reduce((s,r) => s + r.comments, 0);
  const avgViews = totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0;
  const avgEng = totalPosts > 0 ? +(filtered.reduce((s,r) => s + r.engagement, 0) / totalPosts).toFixed(2) : 0;
  const avgDur = totalPosts > 0 ? +(filtered.reduce((s,r) => s + r.duration, 0) / totalPosts).toFixed(0) : 0;

  // Previous period for deltas
  const prevPosts = prevPeriodReels.length;
  const prevViews = prevPeriodReels.reduce((s,r) => s + r.views, 0);
  const prevLikes = prevPeriodReels.reduce((s,r) => s + r.likes, 0);
  const prevComments = prevPeriodReels.reduce((s,r) => s + r.comments, 0);
  const prevAvgViews = prevPosts > 0 ? Math.round(prevViews / prevPosts) : 0;

  function delta(curr, prev) {
    if (prev === 0 && curr === 0) return '<span class="delta flat">--</span>';
    if (prev === 0) return '<span class="delta up">NEW</span>';
    const pct = Math.round((curr - prev) / prev * 100);
    if (pct > 0) return '<span class="delta up">+' + pct + '%</span>';
    if (pct < 0) return '<span class="delta down">' + pct + '%</span>';
    return '<span class="delta flat">0%</span>';
  }

  const showDelta = currentFilter > 0;

  // ── Activity Grid (past 90 days) ──
  const gridDays = 91;
  const postMap = {};
  const viewMap = {};
  reels.forEach(r => {
    if (!r._date) return;
    postMap[r._date] = (postMap[r._date] || 0) + 1;
    viewMap[r._date] = (viewMap[r._date] || 0) + r.views;
  });
  // Find max views in a day for scaling
  const maxDayViews = Math.max(1, ...Object.values(viewMap));

  let gridHtml = '';
  const startDate = daysAgo(today, gridDays - 1);
  // Align to start of week (Sunday)
  const startDay = startDate.getDay();
  const alignedStart = daysAgo(startDate, startDay);

  const weeks = [];
  let current = new Date(alignedStart);
  let weekCol = [];
  const monthPositions = [];
  let lastMonth = -1;

  while (current <= today || weekCol.length > 0) {
    const d = fmt(current);
    const inRange = current >= daysAgo(today, gridDays - 1) && current <= today;
    const count = postMap[d] || 0;
    const views = viewMap[d] || 0;
    const level = !inRange ? -1 : count === 0 ? 0 : views <= maxDayViews * 0.25 ? 1 : views <= maxDayViews * 0.5 ? 2 : views <= maxDayViews * 0.75 ? 3 : 4;

    const mo = current.getMonth();
    if (mo !== lastMonth && inRange) {
      monthPositions.push({ idx: weeks.length, name: current.toLocaleString('en', {month:'short'}) });
      lastMonth = mo;
    }

    if (inRange || (current <= today)) {
      weekCol.push(level === -1
        ? '<div class="day-cell" style="visibility:hidden"></div>'
        : '<div class="day-cell" data-count="' + count + '" data-level="' + level + '"><span class="tip">' + d + ': ' + count + ' post' + (count!==1?'s':'') + ', ' + views.toLocaleString() + ' views</span></div>'
      );
    }

    if (weekCol.length === 7 || current > today) {
      while (weekCol.length < 7) weekCol.push('<div class="day-cell" style="visibility:hidden"></div>');
      weeks.push('<div class="week-col">' + weekCol.join('') + '</div>');
      weekCol = [];
      if (current > today) break;
    }
    current.setDate(current.getDate() + 1);
  }

  gridHtml = '<div class="activity-grid">' + weeks.join('') + '</div>';
  gridHtml += '<div class="grid-legend"><span>Less</span><div class="swatch" style="background:var(--surface2)"></div><div class="swatch" style="background:#1e3a5f"></div><div class="swatch" style="background:#1d4ed8"></div><div class="swatch" style="background:#3b82f6"></div><div class="swatch" style="background:#60a5fa"></div><span>More</span></div>';

  // ── Posts Table ──
  const sortedFiltered = [...filtered].sort((a,b) => b.timestamp.localeCompare(a.timestamp));
  const maxV = Math.max(1, ...filtered.map(r => r.views));
  let postsHtml = sortedFiltered.map(r => {
    const perf = r.views >= maxV * 0.6 ? 'high' : r.views >= maxV * 0.25 ? 'mid' : 'low';
    const date = r._date || '-';
    const dur = r.duration ? Math.round(r.duration) + 's' : '-';
    return '<tr><td>' + date + '</td><td><span class="perf-dot ' + perf + '"></span>' + r.views.toLocaleString() + '</td><td>' + r.likes + '</td><td>' + r.comments + '</td><td>' + r.engagement + '%</td><td>' + dur + '</td><td class="hook-td" title="' + esc(r.hook) + '">' + esc(r.hook) + '</td><td><a href="' + r.url + '" target="_blank">View</a></td></tr>';
  }).join('');

  // ── Competitors (compact) ──
  let compHtml = Object.entries(compData).map(([name, arr]) => {
    const s = compStats(arr);
    return '<div class="comp-mini"><div class="cname">@' + name + '</div><div class="crow"><span>Avg Views</span><span class="cv">' + s.v.toLocaleString() + '</span></div><div class="crow"><span>Avg Likes</span><span class="cv">' + s.l.toLocaleString() + '</span></div><div class="crow"><span>Avg Eng</span><span class="cv">' + s.e + '%</span></div></div>';
  }).join('');

  // ── Top Competitor Hooks ──
  const allComp = [];
  Object.entries(compData).forEach(([n, arr]) => arr.forEach(r => allComp.push(r)));
  const topHooks = allComp.sort((a,b) => b.views - a.views).slice(0, 8);
  let hooksHtml = topHooks.map(r =>
    '<div class="hook-item"><div class="hook-text">"' + esc(r.hook) + '"</div><div class="hook-meta">@' + r.username + ' &middot; ' + r.views.toLocaleString() + ' views</div></div>'
  ).join('');

  // ── Assemble ──
  document.getElementById('app').innerHTML = \`
    <div class="hdr">
      <div>
        <h1>@\${MY} Dashboard</h1>
        <div class="sub">Last scraped: \${DATA.date}</div>
      </div>
      <div class="filters">
        <button class="fbtn \${currentFilter===7?'active':''}" onclick="setFilter(7)">7d</button>
        <button class="fbtn \${currentFilter===14?'active':''}" onclick="setFilter(14)">14d</button>
        <button class="fbtn \${currentFilter===30?'active':''}" onclick="setFilter(30)">30d</button>
        <button class="fbtn \${currentFilter===90?'active':''}" onclick="setFilter(90)">90d</button>
        <button class="fbtn \${currentFilter===0?'active':''}" onclick="setFilter(0)">All</button>
      </div>
    </div>

    <div class="kpis">
      <div class="kpi"><div class="label">Posts</div><div class="val">\${totalPosts}</div>\${showDelta ? delta(totalPosts, prevPosts) : ''}</div>
      <div class="kpi"><div class="label">Total Views</div><div class="val">\${totalViews.toLocaleString()}</div>\${showDelta ? delta(totalViews, prevViews) : ''}</div>
      <div class="kpi"><div class="label">Avg Views</div><div class="val">\${avgViews.toLocaleString()}</div>\${showDelta ? delta(avgViews, prevAvgViews) : ''}</div>
      <div class="kpi"><div class="label">Total Likes</div><div class="val">\${totalLikes.toLocaleString()}</div>\${showDelta ? delta(totalLikes, prevLikes) : ''}</div>
      <div class="kpi"><div class="label">Total Comments</div><div class="val">\${totalComments.toLocaleString()}</div>\${showDelta ? delta(totalComments, prevComments) : ''}</div>
      <div class="kpi"><div class="label">Avg Engagement</div><div class="val">\${avgEng}%</div></div>
      <div class="kpi"><div class="label">Avg Duration</div><div class="val">\${avgDur}s</div></div>
    </div>

    <div class="activity-section">
      <div class="title">Posting Activity (past 90 days)</div>
      <div class="grid-wrap">\${gridHtml}</div>
    </div>

    <div class="posts-section">
      <div class="title">Your Reels \${currentFilter > 0 ? '(past ' + currentFilter + ' days)' : '(all time)'}</div>
      <div class="tbl-wrap">
        <table>
          <tr><th>Date</th><th>Views</th><th>Likes</th><th>Comments</th><th>Eng%</th><th>Dur</th><th>Hook</th><th></th></tr>
          \${postsHtml || '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:20px">No posts in this period</td></tr>'}
        </table>
      </div>
    </div>

    <div class="comp-section">
      <div class="title" style="font-size:13px;font-weight:600;color:var(--muted);margin-bottom:10px">Competitor Benchmarks</div>
      <div class="comp-row">\${compHtml}</div>
    </div>

    <div class="hooks-section">
      <div class="title" style="font-size:13px;font-weight:600;color:var(--muted);margin-bottom:10px">Top Competitor Hooks (steal these)</div>
      \${hooksHtml}
    </div>

    <div style="text-align:center;padding:20px;color:var(--muted);font-size:11px">
      <code>node scrape-dashboard.js</code> to refresh &middot; <code>node scrape-dashboard.js --build-only</code> to rebuild from cache
    </div>
  \`;
}

function setFilter(d) { currentFilter = d; render(); }
function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

render();
</script>
</body>
</html>`;

  fs.writeFileSync(DASHBOARD_PATH, html);
  console.log(`Dashboard built: ${DASHBOARD_PATH}`);
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
