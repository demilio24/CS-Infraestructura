#!/usr/bin/env node
/**
 * Nils Digital — Instagram Reels Competitor Scraper
 *
 * Pulls Reels data from competitor accounts via Apify,
 * rotates API keys, and outputs a sorted performance report.
 *
 * Usage:
 *   node scrape-reels.js                    # scrape all tracked accounts
 *   node scrape-reels.js @hormozi @wesmcdowell   # scrape specific accounts
 *   node scrape-reels.js --limit 10         # limit reels per account (default 20)
 */

const fs = require("fs");
const path = require("path");

// ── Config ──────────────────────────────────────────────
const ENV_PATH = path.join(__dirname, ".env");
const REPORT_DIR = path.join(__dirname, "reports");
const ACTOR_ID = "apify~instagram-reel-scraper";

// Default accounts to track
const DEFAULT_ACCOUNTS = [
  "hormozi",
  "imangadzhireels",
  "wesmcdowell",
  "leilahormozi",
  "max_sher",
  "funnelslayer",
];

const DEFAULT_LIMIT = 20;

// ── Load API keys from .env ─────────────────────────────
function loadKeys() {
  if (!fs.existsSync(ENV_PATH)) {
    console.error("ERROR: .env file not found at", ENV_PATH);
    process.exit(1);
  }
  const env = fs.readFileSync(ENV_PATH, "utf-8");
  const keys = [];
  for (const line of env.split("\n")) {
    const match = line.match(/^APIFY_KEY_\d+=(.+)$/);
    if (match && match[1].trim()) keys.push(match[1].trim());
  }
  if (keys.length === 0) {
    console.error("ERROR: No APIFY_KEY values found in .env");
    process.exit(1);
  }
  return keys;
}

// ── Key rotation ────────────────────────────────────────
let keys = [];
let keyIndex = 0;
function getKey() {
  const key = keys[keyIndex % keys.length];
  keyIndex++;
  return key;
}

// ── Apify API calls ─────────────────────────────────────
async function runActor(username, limit, apiKey) {
  const url = `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?waitForFinish=300`;

  const input = {
    username: [username],
    resultsLimit: limit,
  };

  console.log(`  [${username}] Starting scrape (key ...${apiKey.slice(-6)})...`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errText = await res.text();
    // If this key failed, try the next one
    if (res.status === 402 || res.status === 429) {
      console.log(`  [${username}] Key exhausted (${res.status}), rotating...`);
      return null; // signal to retry with next key
    }
    throw new Error(`Apify API error ${res.status}: ${errText}`);
  }

  const run = await res.json();
  const datasetId = run?.data?.defaultDatasetId;
  if (!datasetId) throw new Error("No datasetId in response");

  return datasetId;
}

async function getResults(datasetId, apiKey) {
  const url = `https://api.apify.com/v2/datasets/${datasetId}/items?format=json`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch results: ${res.status}`);
  return res.json();
}

// ── Scrape one account with key rotation ────────────────
async function scrapeAccount(username, limit) {
  let attempts = 0;
  while (attempts < keys.length) {
    const apiKey = getKey();
    try {
      const datasetId = await runActor(username, limit, apiKey);
      if (datasetId === null) {
        attempts++;
        continue; // try next key
      }
      const results = await getResults(datasetId, apiKey);
      console.log(`  [${username}] Got ${results.length} reels`);
      return results;
    } catch (err) {
      console.error(`  [${username}] Error: ${err.message}`);
      attempts++;
    }
  }
  console.error(`  [${username}] All keys exhausted, skipping.`);
  return [];
}

// ── Parse reel data into clean format ───────────────────
function parseReel(reel, username) {
  return {
    username: reel.ownerUsername || username,
    id: reel.id || reel.shortCode || "unknown",
    shortCode: reel.shortCode || "",
    url: reel.url || (reel.shortCode ? `https://www.instagram.com/reel/${reel.shortCode}/` : ""),
    caption: (reel.caption || "").slice(0, 300),
    hook: extractHook(reel.caption || ""),
    views: reel.videoViewCount || reel.viewCount || reel.videoPlayCount || 0,
    likes: reel.likesCount || reel.likes || 0,
    comments: reel.commentsCount || reel.comments || 0,
    timestamp: reel.timestamp || reel.takenAtTimestamp || "",
    duration: reel.videoDuration || 0,
    engagement: 0, // calculated below
  };
}

function extractHook(caption) {
  if (!caption) return "";
  // First sentence or first 100 chars
  const firstSentence = caption.split(/[.!?\n]/)[0];
  return firstSentence.slice(0, 120);
}

// ── Build the report ────────────────────────────────────
function buildReport(allReels) {
  const now = new Date().toISOString().split("T")[0];

  // Calculate engagement rate (likes + comments) / views
  for (const r of allReels) {
    r.engagement = r.views > 0 ? ((r.likes + r.comments) / r.views * 100).toFixed(2) : 0;
  }

  // Sort by views descending
  const byViews = [...allReels].sort((a, b) => b.views - a.views);

  // Sort by engagement rate descending
  const byEngagement = [...allReels].sort((a, b) => b.engagement - a.engagement);

  // Per-account stats
  const accounts = {};
  for (const r of allReels) {
    if (!accounts[r.username]) {
      accounts[r.username] = { reels: [], totalViews: 0, totalLikes: 0, totalComments: 0 };
    }
    accounts[r.username].reels.push(r);
    accounts[r.username].totalViews += r.views;
    accounts[r.username].totalLikes += r.likes;
    accounts[r.username].totalComments += r.comments;
  }

  let md = `# Instagram Reels Competitor Report\n`;
  md += `**Date:** ${now}\n`;
  md += `**Total Reels Scraped:** ${allReels.length}\n\n`;

  // Account summary
  md += `## Account Summary\n\n`;
  md += `| Account | Reels | Total Views | Avg Views | Avg Likes | Avg Comments |\n`;
  md += `|---------|-------|-------------|-----------|-----------|-------------|\n`;
  for (const [name, data] of Object.entries(accounts).sort((a, b) => b[1].totalViews - a[1].totalViews)) {
    const n = data.reels.length;
    md += `| @${name} | ${n} | ${data.totalViews.toLocaleString()} | ${Math.round(data.totalViews / n).toLocaleString()} | ${Math.round(data.totalLikes / n).toLocaleString()} | ${Math.round(data.totalComments / n)} |\n`;
  }

  // Top 20 by views
  md += `\n## Top 20 Reels by Views\n\n`;
  md += `| # | Account | Views | Likes | Eng% | Hook | URL |\n`;
  md += `|---|---------|-------|-------|------|------|-----|\n`;
  for (let i = 0; i < Math.min(20, byViews.length); i++) {
    const r = byViews[i];
    md += `| ${i + 1} | @${r.username} | ${r.views.toLocaleString()} | ${r.likes.toLocaleString()} | ${r.engagement}% | ${r.hook.replace(/\|/g, "/")} | [Link](${r.url}) |\n`;
  }

  // Top 20 by engagement
  md += `\n## Top 20 Reels by Engagement Rate\n\n`;
  md += `| # | Account | Eng% | Views | Likes | Hook | URL |\n`;
  md += `|---|---------|------|-------|-------|------|-----|\n`;
  for (let i = 0; i < Math.min(20, byEngagement.length); i++) {
    const r = byEngagement[i];
    md += `| ${i + 1} | @${r.username} | ${r.engagement}% | ${r.views.toLocaleString()} | ${r.likes.toLocaleString()} | ${r.hook.replace(/\|/g, "/")} | [Link](${r.url}) |\n`;
  }

  // Hook analysis
  md += `\n## Hook Patterns from Top Performers\n\n`;
  md += `These are the opening lines from the top 15 most-viewed reels:\n\n`;
  for (let i = 0; i < Math.min(15, byViews.length); i++) {
    const r = byViews[i];
    if (r.hook) md += `${i + 1}. **@${r.username}** (${r.views.toLocaleString()} views): "${r.hook}"\n`;
  }

  // Raw data as JSON too
  md += `\n---\n*Raw data saved to the same reports folder as JSON.*\n`;

  return { md, json: allReels, byViews, byEngagement };
}

// ── Main ────────────────────────────────────────────────
async function main() {
  keys = loadKeys();
  console.log(`Loaded ${keys.length} API key(s)\n`);

  // Parse CLI args
  const args = process.argv.slice(2);
  let limit = DEFAULT_LIMIT;
  let accounts = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else {
      accounts.push(args[i].replace(/^@/, ""));
    }
  }

  if (accounts.length === 0) accounts = DEFAULT_ACCOUNTS;

  console.log(`Scraping ${accounts.length} accounts (${limit} reels each):\n`);
  console.log(`  ${accounts.map((a) => "@" + a).join(", ")}\n`);

  // Scrape all accounts
  const allReels = [];
  for (const username of accounts) {
    const reels = await scrapeAccount(username, limit);
    for (const reel of reels) {
      allReels.push(parseReel(reel, username));
    }
  }

  if (allReels.length === 0) {
    console.log("\nNo reels scraped. Check your API keys and account names.");
    return;
  }

  // Build report
  const { md, json } = buildReport(allReels);

  // Save
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

  const date = new Date().toISOString().split("T")[0];
  const mdPath = path.join(REPORT_DIR, `reels-report-${date}.md`);
  const jsonPath = path.join(REPORT_DIR, `reels-data-${date}.json`);

  fs.writeFileSync(mdPath, md);
  fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2));

  console.log(`\nDone! Report saved to:`);
  console.log(`  ${mdPath}`);
  console.log(`  ${jsonPath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
