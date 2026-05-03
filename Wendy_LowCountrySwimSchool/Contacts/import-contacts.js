#!/usr/bin/env node
/*
 * Import / sync contacts from contacts.csv into GHL Business Pipeline.
 *
 *   node import-contacts.js              # dry-run (default), writes .work/report.csv + .work/report.json
 *   node import-contacts.js --execute    # writes to GHL
 *   node import-contacts.js --execute --limit=10   # only process first 10 actionable rows (smoke test)
 *
 * Token + location come from CLI flags or env (GHL_TOKEN, GHL_LOCATION_ID).
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const DRY_RUN = !args.includes('--execute');
const LIMIT_ARG = args.find((a) => a.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1], 10) : Infinity;

const TOKEN = process.env.GHL_TOKEN || 'pit-87c7aef8-8e3b-4e7d-9861-f2dd170fd1ce';
const LOCATION_ID = process.env.GHL_LOCATION_ID || 'LHyUDIth9k9Kk9qv4BzQ';
const PIPELINE_ID = 'Q3dkWNQ1ljmXf9AexnNI';

const STAGES = {
  'Leads (Social Media)': '19d38c61-75b1-41d4-a2c6-42b34af91378',
  'Leads (Website)': 'e4b63572-4bb1-4982-9bb6-48da4fc15d3b',
  'Tried calling - Left a message': 'e4d42f1b-04da-4485-9f72-d9684045ee5a',
  'Waitlist': '1a7eb39d-f40d-4450-a615-8377ff31cb92',
  'Summer - Follow Up List': '47b8fecc-9cd9-46d5-8c1c-64259ad54e73',
  'Registered': '0985432f-1d46-4805-b0cd-4a33614e94a7',
  'Enrolled': 'a1f80ea6-e82e-445b-8731-4a294683a079',
  'Review / Referral Request': '30e7995f-dd90-4919-808c-7a46b9cae3af',
};

const ABANDONED_DEFAULT_STAGE = STAGES['Tried calling - Left a message'];

// Stage positions in the pipeline (lower = earlier).
const STAGE_POS = {
  [STAGES['Leads (Social Media)']]: 0,
  [STAGES['Leads (Website)']]: 1,
  [STAGES['Tried calling - Left a message']]: 2,
  [STAGES['Waitlist']]: 3,
  [STAGES['Summer - Follow Up List']]: 4,
  [STAGES['Registered']]: 5,
  [STAGES['Enrolled']]: 6,
  [STAGES['Review / Referral Request']]: 7,
};
const POS_REGISTERED = 5;

const CSV_PATH = path.join(__dirname, 'contacts.csv');
const WORK = path.join(__dirname, '.work');
const REPORT_JSON = path.join(WORK, 'report.json');
const REPORT_CSV = path.join(WORK, 'report.csv');
const ERRORS_CSV = path.join(WORK, 'errors.csv');

const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  Version: '2021-07-28',
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

// ---------- helpers ----------

function parseCSV(text) {
  // Minimal RFC 4180-ish parser. Handles quoted fields with commas.
  const rows = [];
  let row = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
      } else cur += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (c === '\r') { /* skip */ }
      else cur += c;
    }
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

function normalizePhone(raw) {
  if (!raw) return null;
  // Strip "Phone:" prefix
  let s = String(raw).replace(/^[Pp]hone\s*:\s*/, '').trim();
  // Common typo: '=' instead of '-'
  s = s.replace(/=/g, '-');
  // If contains @ it's actually an email, not a phone
  if (s.includes('@')) return null;
  // Extract digits
  let digits = s.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  if (digits.length === 10) return '+1' + digits;
  // Sometimes a name+phone got concatenated and we extract a longer string; take last 10
  if (digits.length > 11) return '+1' + digits.slice(-10);
  return null; // too few digits
}

function normalizeEmail(raw) {
  if (!raw) return null;
  let s = String(raw).replace(/^[Ee]mail\s*:\s*/, '').trim().toLowerCase();
  if (!s) return null;
  // Reject obvious non-email placeholders
  if (!s.includes('@')) return null;
  if (!s.includes('.')) return null;
  if (/\s/.test(s)) return null;
  // Fix common typo: gmaiil.com -> gmail.com
  s = s.replace(/@gmaiil\.com$/, '@gmail.com');
  s = s.replace(/@yahoo\.co$/, '@yahoo.com');
  return s;
}

function cleanName(raw) {
  if (!raw) return { first: '', last: '', full: '' };
  let s = String(raw).replace(/^[Nn]ame\s*:\s*/, '').trim();
  // Strip trailing concatenated phone (e.g. "Heather Shafik843-288-1615")
  s = s.replace(/\s*\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}.*$/, '').trim();
  s = s.replace(/\s+/g, ' ');
  // Title-case if all-caps
  if (s === s.toUpperCase()) {
    s = s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const parts = s.split(' ');
  const first = parts[0] || '';
  const last = parts.slice(1).join(' ') || '';
  return { first, last, full: s };
}

function extractPhoneFromName(rawName) {
  const m = String(rawName || '').match(/(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/);
  return m ? normalizePhone(m[1]) : null;
}

const STAGE_FROM_CSV = {
  'Tried calling - Left a message': { stage: STAGES['Tried calling - Left a message'], status: 'open' },
  'Waitlist': { stage: STAGES['Waitlist'], status: 'open' },
  'Registered': { stage: STAGES['Registered'], status: 'open' },
  'Summer - Follow Up List': { stage: STAGES['Summer - Follow Up List'], status: 'open' },
  'Abandoned': { stage: ABANDONED_DEFAULT_STAGE, status: 'abandoned' },
  '': { stage: STAGES['Leads (Website)'], status: 'open' },
};

function mapStage(csvStage) {
  const key = (csvStage || '').trim();
  if (key in STAGE_FROM_CSV) return STAGE_FROM_CSV[key];
  return null;
}

// ---------- API ----------

async function ghl(method, url, body) {
  const opts = { method, headers: HEADERS };
  if (body) opts.body = JSON.stringify(body);
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, opts);
    if (res.status === 429) {
      const wait = 1000 * Math.pow(2, attempt);
      console.warn(`  429 rate-limited, sleeping ${wait}ms`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (_) {}
    if (!res.ok) {
      const err = new Error(`${method} ${url} -> ${res.status} ${text.slice(0, 200)}`);
      err.status = res.status;
      err.body = json || text;
      throw err;
    }
    return json;
  }
  throw new Error(`Exhausted retries for ${method} ${url}`);
}

async function fetchAllContacts() {
  const all = [];
  let url = `https://services.leadconnectorhq.com/contacts/?locationId=${LOCATION_ID}&limit=100`;
  let page = 0;
  while (url) {
    page++;
    const data = await ghl('GET', url);
    const contacts = data.contacts || [];
    all.push(...contacts);
    process.stdout.write(`  contacts page ${page} (+${contacts.length}, total ${all.length})\r`);
    url = data.meta && data.meta.nextPageUrl ? data.meta.nextPageUrl : null;
    if (page > 100) break; // safety
  }
  process.stdout.write('\n');
  return all;
}

async function fetchAllOpportunities() {
  const all = [];
  let url = `https://services.leadconnectorhq.com/opportunities/search?location_id=${LOCATION_ID}&pipeline_id=${PIPELINE_ID}&limit=100`;
  let page = 0;
  while (url) {
    page++;
    const data = await ghl('GET', url);
    const opps = data.opportunities || [];
    all.push(...opps);
    process.stdout.write(`  opportunities page ${page} (+${opps.length}, total ${all.length})\r`);
    url = data.meta && data.meta.nextPageUrl ? data.meta.nextPageUrl : null;
    if (page > 200) break;
  }
  process.stdout.write('\n');
  return all;
}

// ---------- main ----------

async function main() {
  console.log(`Mode: ${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  console.log(`Location: ${LOCATION_ID}`);
  console.log(`Pipeline: ${PIPELINE_ID}`);

  // 1. Parse CSV
  const text = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parseCSV(text);
  const header = rows.shift();
  console.log(`CSV rows: ${rows.length} (excluding header)`);

  // 2. Build cleaned rows
  const errors = [];
  const cleaned = rows
    .map((r, idx) => {
      const lineNo = idx + 2; // 1-indexed + header
      let [name, number, stage, notes, email] = r;
      // Field 8 (column index 7) sometimes contains email or extra value due to inline parsing
      const cleanedName = cleanName(name);
      let phone = normalizePhone(number);
      let mail = normalizeEmail(email);
      // If number column was actually an email, swap
      if (!phone && number && String(number).includes('@')) {
        const maybeEmail = normalizeEmail(number);
        if (maybeEmail && !mail) mail = maybeEmail;
      }
      // If we still have no phone but the name has digits, try to extract
      if (!phone) phone = extractPhoneFromName(name);
      // Email-in-name (shouldn't happen but safe)
      if (!mail && email && !email.includes('@')) {
        // Sometimes the email column has "WANTS SAT AFTERNOON" or "NO INFO" — leave it null
      }
      const noteText = String(notes || '').trim();
      const stageInfo = mapStage(stage);
      const issue = [];
      if (!cleanedName.full) issue.push('no-name');
      if (!phone && !mail) issue.push('no-phone-no-email');
      if (!stageInfo) issue.push(`unknown-stage:${stage}`);
      return {
        lineNo,
        rawStage: stage,
        first: cleanedName.first,
        last: cleanedName.last,
        full: cleanedName.full,
        phone,
        email: mail,
        note: noteText,
        stageInfo,
        issue,
      };
    });

  // Filter rows we cannot process at all
  const skippedHard = cleaned.filter((r) => r.issue.length);
  for (const r of skippedHard) errors.push({ line: r.lineNo, name: r.full, phone: r.phone, email: r.email, reason: r.issue.join(';') });
  const valid = cleaned.filter((r) => !r.issue.length);
  console.log(`Valid rows: ${valid.length}    Hard-skip: ${skippedHard.length}`);

  // 3. Fetch GHL state
  console.log('Fetching all GHL contacts...');
  const contacts = await fetchAllContacts();
  console.log(`  ${contacts.length} contacts in GHL`);
  console.log('Fetching all GHL opportunities in pipeline...');
  const opps = await fetchAllOpportunities();
  console.log(`  ${opps.length} opportunities in pipeline`);

  // 4. Index
  const byPhone = new Map();
  const byEmail = new Map();
  for (const c of contacts) {
    if (c.phone) byPhone.set(c.phone, c);
    if (c.email) byEmail.set(String(c.email).toLowerCase(), c);
  }
  const oppsByContact = new Map();
  for (const o of opps) {
    if (!oppsByContact.has(o.contactId)) oppsByContact.set(o.contactId, []);
    oppsByContact.get(o.contactId).push(o);
  }

  // 5. Plan actions
  const planned = [];
  for (const r of valid) {
    let contact = (r.phone && byPhone.get(r.phone)) || (r.email && byEmail.get(r.email)) || null;
    const target = r.stageInfo;
    const actions = [];
    if (!contact) {
      actions.push({ kind: 'CREATE_CONTACT', payload: {
        firstName: r.first,
        lastName: r.last,
        name: r.full,
        ...(r.email ? { email: r.email } : {}),
        ...(r.phone ? { phone: r.phone } : {}),
        locationId: LOCATION_ID,
      }});
      actions.push({ kind: 'CREATE_OPP', payload: {
        pipelineId: PIPELINE_ID,
        pipelineStageId: target.stage,
        status: target.status,
        name: r.full,
        locationId: LOCATION_ID,
      }});
      if (r.note) actions.push({ kind: 'ADD_NOTE', payload: { body: r.note } });
    } else {
      // Backfill email/phone if GHL contact is missing them and CSV has them.
      const patch = {};
      if (r.email && !contact.email) patch.email = r.email;
      if (r.phone && !contact.phone) patch.phone = r.phone;
      if (Object.keys(patch).length) {
        actions.push({ kind: 'UPDATE_CONTACT', contactId: contact.id, payload: patch });
      }
      const existingOpps = (oppsByContact.get(contact.id) || []).filter((o) => o.pipelineId === PIPELINE_ID);
      if (existingOpps.length === 0) {
        actions.push({ kind: 'CREATE_OPP', payload: {
          pipelineId: PIPELINE_ID,
          pipelineStageId: target.stage,
          status: target.status,
          name: r.full,
          contactId: contact.id,
          locationId: LOCATION_ID,
        }});
      } else {
        // Use most recently updated opp
        const opp = existingOpps.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
        const existingPos = STAGE_POS[opp.pipelineStageId] ?? -1;
        const targetPos = STAGE_POS[target.stage] ?? -1;
        if (target.status === 'abandoned') {
          // Only mark abandoned if not already at Registered or later (GHL source-of-truth).
          if (existingPos >= POS_REGISTERED) {
            actions.push({ kind: 'SKIP_PROTECTED_DEMOTE', note: `existing stage pos ${existingPos} >= Registered; abandoned skipped`, fromStage: opp.pipelineStageId, fromStatus: opp.status });
          } else if (opp.status !== 'abandoned') {
            actions.push({ kind: 'UPDATE_OPP_STATUS', oppId: opp.id, fromStatus: opp.status, fromStage: opp.pipelineStageId, payload: { status: 'abandoned', pipelineId: PIPELINE_ID, pipelineStageId: opp.pipelineStageId } });
          }
        } else if (existingPos > targetPos) {
          // Demotion guarded: GHL says they're further along than the CSV.
          actions.push({ kind: 'SKIP_PROTECTED_DEMOTE', note: `existing pos ${existingPos} > target pos ${targetPos}`, fromStage: opp.pipelineStageId, fromStatus: opp.status });
        } else if (existingPos < targetPos) {
          actions.push({ kind: 'UPDATE_OPP_STAGE', oppId: opp.id, fromStage: opp.pipelineStageId, fromStatus: opp.status, payload: { pipelineId: PIPELINE_ID, pipelineStageId: target.stage, status: 'open' } });
        }
        // existingPos === targetPos -> no action needed
      }
    }
    planned.push({
      lineNo: r.lineNo,
      name: r.full,
      phone: r.phone,
      email: r.email,
      csvStage: r.rawStage,
      contactId: contact ? contact.id : null,
      actions,
    });
  }

  // 6. Summary
  const summary = {
    csv_rows: rows.length,
    valid_rows: valid.length,
    hard_skip: skippedHard.length,
    actions: { CREATE_CONTACT: 0, UPDATE_CONTACT: 0, CREATE_OPP: 0, UPDATE_OPP_STAGE: 0, UPDATE_OPP_STATUS: 0, ADD_NOTE: 0, SKIP_PROTECTED_DEMOTE: 0, NO_OP: 0 },
  };
  for (const p of planned) {
    const realActions = p.actions.filter((a) => a.kind !== 'SKIP_PROTECTED_DEMOTE');
    if (!realActions.length) summary.actions.NO_OP++;
    for (const a of p.actions) summary.actions[a.kind] = (summary.actions[a.kind] || 0) + 1;
  }
  console.log('\nPlanned actions:');
  console.log(JSON.stringify(summary, null, 2));

  // 7. Write reports
  fs.writeFileSync(REPORT_JSON, JSON.stringify({ summary, planned, errors }, null, 2));
  const reportRows = [
    ['line', 'name', 'phone', 'email', 'csv_stage', 'existing_contact', 'actions'].join(','),
    ...planned.map((p) => [
      p.lineNo,
      JSON.stringify(p.name),
      p.phone || '',
      p.email || '',
      JSON.stringify(p.csvStage),
      p.contactId || '',
      JSON.stringify(p.actions.map((a) => a.kind).join('|')),
    ].join(',')),
  ].join('\n');
  fs.writeFileSync(REPORT_CSV, reportRows);
  const errorRows = ['line,name,phone,email,reason', ...errors.map((e) => `${e.line},${JSON.stringify(e.name || '')},${e.phone || ''},${e.email || ''},${JSON.stringify(e.reason)}`)].join('\n');
  fs.writeFileSync(ERRORS_CSV, errorRows);
  console.log(`\nReports written:\n  ${REPORT_JSON}\n  ${REPORT_CSV}\n  ${ERRORS_CSV}`);

  if (DRY_RUN) {
    console.log('\nDry-run complete. Re-run with --execute to apply changes.');
    return;
  }

  // 8. Execute
  console.log('\n=== EXECUTING ===');
  let processed = 0;
  for (const p of planned) {
    if (processed >= LIMIT) break;
    const realActions = p.actions.filter((a) => a.kind !== 'SKIP_PROTECTED_DEMOTE');
    if (!realActions.length) continue;
    processed++;
    let contactId = p.contactId;
    for (const a of realActions) {
      try {
        if (a.kind === 'CREATE_CONTACT') {
          const res = await ghl('POST', 'https://services.leadconnectorhq.com/contacts/', a.payload);
          contactId = res.contact && res.contact.id;
          console.log(`[${p.lineNo}] CREATE_CONTACT -> ${contactId}`);
        } else if (a.kind === 'UPDATE_CONTACT') {
          await ghl('PUT', `https://services.leadconnectorhq.com/contacts/${a.contactId}`, a.payload);
          console.log(`[${p.lineNo}] UPDATE_CONTACT ${a.contactId}  +${Object.keys(a.payload).join(',')}`);
        } else if (a.kind === 'CREATE_OPP') {
          const payload = { ...a.payload, contactId };
          const res = await ghl('POST', 'https://services.leadconnectorhq.com/opportunities/', payload);
          console.log(`[${p.lineNo}] CREATE_OPP -> ${res.opportunity && res.opportunity.id} (${a.payload.status})`);
        } else if (a.kind === 'UPDATE_OPP_STAGE' || a.kind === 'UPDATE_OPP_STATUS') {
          await ghl('PUT', `https://services.leadconnectorhq.com/opportunities/${a.oppId}`, a.payload);
          console.log(`[${p.lineNo}] ${a.kind} ${a.oppId}`);
        } else if (a.kind === 'ADD_NOTE') {
          await ghl('POST', `https://services.leadconnectorhq.com/contacts/${contactId}/notes`, a.payload);
          console.log(`[${p.lineNo}] ADD_NOTE`);
        }
      } catch (e) {
        console.error(`[${p.lineNo}] ${a.kind} FAILED:`, e.message);
        errors.push({ line: p.lineNo, name: p.name, phone: p.phone, email: p.email, reason: `${a.kind}: ${e.message}` });
      }
      await new Promise((r) => setTimeout(r, 200)); // ~5 rps
    }
  }
  // Re-write errors with execution failures
  const errorRows2 = ['line,name,phone,email,reason', ...errors.map((e) => `${e.line},${JSON.stringify(e.name || '')},${e.phone || ''},${e.email || ''},${JSON.stringify(e.reason)}`)].join('\n');
  fs.writeFileSync(ERRORS_CSV, errorRows2);
  console.log(`\nDone. Errors: ${errors.length}. See ${ERRORS_CSV}`);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
