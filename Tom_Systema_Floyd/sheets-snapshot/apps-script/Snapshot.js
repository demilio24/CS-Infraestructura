/**
 * Floyd Roster Snapshot API
 *
 * Reads the four canonical registration spreadsheets owned by
 * systemafloydsheets@gmail.com and emits a snapshot in the exact shape
 * Tom_Systema_Floyd/dashboard/index.html consumes from snapshot.json.
 *
 * Tab N in each sheet maps to WEEK_ORDER[N-1]. Tab order = chronological week order.
 *
 * Sheets:
 *   Upper Campus: Systema Summer Camp 2026          → roster.upper, type=summer, campus=Upper
 *   Lower Campus: Systema Summer Camp 2026          → roster.lower, type=summer, campus=Lower
 *   FREE Summer Camp 2026 - Higher Campus: Systema  → roster.free,  type=free,   campus=Upper
 *   FREE Summer Camp 2026 - Lower Campus: Systema   → roster.free,  type=free,   campus=Lower
 *
 * Web app endpoint:
 *   GET → JSON snapshot
 *   GET ?key=<token> → same; key is optional read-protection if SECRET_KEY is set
 */

const SHEETS = {
  upper:      '1qejcgNQt3sS_UZ9Gl9Txr8TOocw3LzK5PjPICqnRrGA',
  lower:      '18A_sc917xnxYo3UQ8_cGogqg46Im6qUQlakOC9Oc-Fs',
  freeUpper:  '1rK4p6jS1xqSf1qNO9-3ljCRzJcUIDF87sNo_UehBWYQ',
  freeLower:  '1_659v7by990V4OJMd86nBG-HUN6_AzZNOAPoQN0LMxY',
};

const WEEK_ORDER = [
  'June 1st-5th',
  'June 8th-12th',
  'June 15th-19th',
  'June 22nd-26th',
  'June 29th-July 3rd',
  'July 6th-10th',
  'July 13th-17th',
  'July 20th-24th',
  'July 27th-31st',
  'August 3rd-7th',
  'August 10th-14th',
  'August 17th-21st',
];

const PROGRAM_ORDER = [
  'Foundations Block',
  'School Pickup Track',
  'Homework & Discipline Lab',
  'Minis Movement',
  'Leadership Apprentice',
];
const DAY_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

const CUTOFF_ISO = '2026-06-01';
const LOCATION_ID = '8IWtNFlmgJ8bif9DivHT';

function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    const expected = PropertiesService.getScriptProperties().getProperty('SECRET_KEY');
    if (expected && params.key !== expected) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'unauthorized' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const snap = buildSnapshot();
    const out = ContentService.createTextOutput(JSON.stringify(snap))
      .setMimeType(ContentService.MimeType.JSON);
    return out;
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      error: String(err && err.message || err),
      stack: String(err && err.stack || ''),
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/* ───────────────────────── Core builder ───────────────────────── */

function buildSnapshot() {
  const summerEnrollments = readCampSheet_(SHEETS.upper, 'Upper Campus');
  const lowerEnrollments  = readCampSheet_(SHEETS.lower, 'Lower Campus');
  const freeUpperEnrolls  = readFreeSheet_(SHEETS.freeUpper, 'Upper Campus');
  const freeLowerEnrolls  = readFreeSheet_(SHEETS.freeLower, 'Lower Campus');

  const allSummer = summerEnrollments.concat(lowerEnrollments);
  const allFree   = freeUpperEnrolls.concat(freeLowerEnrolls);

  const summer   = aggregate_(allSummer, 'summer');
  const free     = aggregate_(allFree,   'free');
  // Combined dedup: a kid in both summer + free counts once toward unique
  // totals, so re-run the aggregator over the merged list rather than
  // adding the two slice totals (that would double-count crossover kids).
  const combined = aggregate_(allSummer.concat(allFree), 'combined');

  const roster = buildRoster_(allSummer, allFree);
  const bySchool = {};
  allFree.forEach(e => {
    if (e.school) bySchool[e.school] = (bySchool[e.school] || 0) + 1;
  });

  return {
    generatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    locationId:  LOCATION_ID,
    cutoff:      CUTOFF_ISO,
    source:      'sheets',
    totals: {
      contacts:        0,
      summer:          summer.total,
      free:            free.total,
      afterSchool:     0,
      leadOnly:        0,
      newLast7Days:    0,
      newLast30Days:   0,
    },
    weekOrder:    WEEK_ORDER,
    programOrder: PROGRAM_ORDER,
    dayOrder:     DAY_ORDER,
    afterSchool: emptyAfterSchool_(),
    summer: {
      total:        summer.total,
      byCampus:     summer.byCampus,
      byWeek:       summer.byWeek,
      byWeekCampus: summer.byWeekCampus,
    },
    free: {
      total:        free.total,
      byCampus:     free.byCampus,
      byWeek:       free.byWeek,
      byWeekCampus: free.byWeekCampus,
      bySchool:     sortDesc_(bySchool),
    },
    combined: combined,
    interest: {},
    sources:  {},
    roster:   roster,
  };
}

/* ───────────────────────── Sheet readers ───────────────────────── */

function readCampSheet_(spreadsheetId, campusLabel) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const tabs = ss.getSheets();
  const enrollments = [];
  for (let i = 0; i < tabs.length && i < WEEK_ORDER.length; i++) {
    const week = WEEK_ORDER[i];
    const sheet = tabs[i];
    const range = sheet.getDataRange();
    if (!range || range.getNumRows() < 2) continue;
    const values = range.getValues();
    const header = values[0].map(h => normalizeHeader_(h));
    const idx = headerIndex_(header, [
      'Student Name', 'Age', 'Breakfast', 'Lunch',
      'Before / After Care', 'Shirt?', 'Email', 'Additional Notes',
      'Mon', 'Tue', 'Wed', 'Thu', 'Fri',
    ]);
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      const name = String(row[idx['Student Name']] || '').trim();
      if (!name) continue;
      const email = String(row[idx['Email']] || '').trim();
      const lunchVal = idx['Lunch'] >= 0 ? String(row[idx['Lunch']] || '').trim() : '';
      const notes = idx['Additional Notes'] >= 0 ? String(row[idx['Additional Notes']] || '').trim() : '';
      const days = ['Mon','Tue','Wed','Thu','Fri'].map(d => isDayChecked_(row[idx[d]]));
      enrollments.push({
        type: 'summer',
        week: week,
        campus: campusLabel,
        name: name,
        email: email || null,
        lunch: hasLunch_(lunchVal),
        allergy: extractAllergy_(notes),
        notes: notes || null,
        days: days,
        incomplete: !email,
      });
    }
  }
  return enrollments;
}

function readFreeSheet_(spreadsheetId, campusLabel) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const tabs = ss.getSheets();
  const enrollments = [];
  for (let i = 0; i < tabs.length && i < WEEK_ORDER.length; i++) {
    const week = WEEK_ORDER[i];
    const sheet = tabs[i];
    const range = sheet.getDataRange();
    if (!range || range.getNumRows() < 2) continue;
    const values = range.getValues();
    const header = values[0].map(h => normalizeHeader_(h));
    const idx = headerIndex_(header, [
      'School', 'Student Name', 'Grade', 'Age', 'Shirt Size',
      'Breakfast', 'Lunch', 'Email Address', 'Parent/Guardian Name',
    ]);
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      const name = String(row[idx['Student Name']] || '').trim();
      if (!name) continue;
      const email = idx['Email Address'] >= 0 ? String(row[idx['Email Address']] || '').trim() : '';
      const lunchVal = idx['Lunch'] >= 0 ? String(row[idx['Lunch']] || '').trim() : '';
      const school = idx['School'] >= 0 ? String(row[idx['School']] || '').trim() : '';
      enrollments.push({
        type: 'free',
        week: week,
        campus: campusLabel,
        name: name,
        email: email || null,
        lunch: hasLunch_(lunchVal),
        allergy: null,
        school: school || null,
        incomplete: !email,
      });
    }
  }
  return enrollments;
}

/* ───────────────────────── Aggregation ───────────────────────── */

/**
 * Aggregate raw rows into the dashboard's expected slice shape.
 *
 *   total          = unique students across all weeks (kpi-num "total" card)
 *   byCampus       = unique students per campus (kpi-num "upper"/"lower")
 *   byWeek         = enrollments per week, intra-week deduped
 *                    (subtitle "X enrollments in total" = sum of byWeek)
 *   byWeekCampus   = enrollments per week × campus (stacked bar input)
 *
 * Intra-week dedup: if the same student has two rows in the same week's tab
 * (re-submission, manual paste, etc), it counts as one enrollment for that
 * week. Across weeks, each week-attendance still counts once toward
 * enrollments — that's what makes total < enrollments for multi-week kids.
 */
function aggregate_(enrollments, type) {
  const byWeek = WEEK_ORDER.reduce((m, w) => { m[w] = 0; return m; }, {});
  const byWeekCampus = WEEK_ORDER.reduce((m, w) => {
    m[w] = { 'Upper Campus': 0, 'Lower Campus': 0, 'Unknown': 0 };
    return m;
  }, {});

  const seenInWeek = {};       // weekKey -> { nameKey: true }
  const primaryCampus = {};    // nameKey -> first-seen campus (so a kid is
                               // counted once globally toward exactly one
                               // campus, byCampus.* sums to total cleanly)

  enrollments.forEach(e => {
    if (!byWeek.hasOwnProperty(e.week)) return;
    const nameKey = nameKey_(e.name);
    if (!nameKey) return;
    const ck = (e.campus === 'Upper Campus' || e.campus === 'Lower Campus') ? e.campus : 'Unknown';

    if (!seenInWeek[e.week]) seenInWeek[e.week] = {};
    if (seenInWeek[e.week][nameKey]) return;      // intra-week dup, skip
    seenInWeek[e.week][nameKey] = true;

    byWeek[e.week]++;
    byWeekCampus[e.week][ck]++;

    if (!primaryCampus[nameKey]) primaryCampus[nameKey] = ck;
  });

  const byCampus = { 'Upper Campus': 0, 'Lower Campus': 0, 'Unknown': 0 };
  Object.keys(primaryCampus).forEach(k => { byCampus[primaryCampus[k]]++; });

  return {
    total:        Object.keys(primaryCampus).length,
    enrollments:  Object.values(byWeek).reduce((a, b) => a + b, 0),
    byCampus,
    byWeek,
    byWeekCampus,
  };
}

function nameKey_(s) {
  return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildRoster_(allSummer, allFree) {
  const roster = WEEK_ORDER.reduce((m, w) => {
    m[w] = { upper: [], lower: [], free: [] };
    return m;
  }, {});
  // Per-week dedup so a kid appearing twice in the same tab shows once.
  const seenSummer = {};   // weekKey -> { nameKey: true }
  const seenFree   = {};
  allSummer.forEach(e => {
    if (!roster[e.week]) return;
    const k = nameKey_(e.name);
    if (!k) return;
    if (!seenSummer[e.week]) seenSummer[e.week] = {};
    if (seenSummer[e.week][k]) return;
    seenSummer[e.week][k] = true;
    const bucket = e.campus === 'Upper Campus' ? 'upper' : 'lower';
    roster[e.week][bucket].push({
      name: e.name,
      campus: e.campus,
      lunch: e.lunch,
      allergy: e.allergy,
      incomplete: e.incomplete,
      type: 'summer',
    });
  });
  allFree.forEach(e => {
    if (!roster[e.week]) return;
    const k = nameKey_(e.name);
    if (!k) return;
    if (!seenFree[e.week]) seenFree[e.week] = {};
    if (seenFree[e.week][k]) return;
    seenFree[e.week][k] = true;
    roster[e.week].free.push({
      name: e.name,
      campus: e.campus || 'Unknown',
      lunch: e.lunch,
      allergy: null,
      incomplete: e.incomplete,
      type: 'free',
      school: e.school || null,
    });
  });
  WEEK_ORDER.forEach(w => {
    ['upper','lower','free'].forEach(b => {
      roster[w][b].sort((a, b2) => a.name.toLowerCase().localeCompare(b2.name.toLowerCase()));
    });
  });
  return roster;
}

function emptyAfterSchool_() {
  const dayZero = DAY_ORDER.reduce((m, d) => { m[d] = 0; return m; }, {});
  return {
    total: 0,
    byCampus: { 'Upper Campus': 0, 'Lower Campus': 0, 'Unknown': 0 },
    byProgram: PROGRAM_ORDER.reduce((m, p) => { m[p] = 0; return m; }, {}),
    byDayOfWeek: Object.assign({}, dayZero),
    byProgramDay: PROGRAM_ORDER.reduce((m, p) => {
      m[p] = Object.assign({}, dayZero);
      return m;
    }, {}),
    byCommitmentTier: { Monthly: 0, Semester: 0, Annual: 0 },
    waitlist: 0,
    roster: [],
  };
}

/* ───────────────────────── Helpers ───────────────────────── */

function normalizeHeader_(h) {
  return String(h || '').replace(/\s+/g, ' ').trim();
}

function headerIndex_(header, names) {
  const out = {};
  names.forEach(n => { out[n] = -1; });
  header.forEach((h, i) => {
    names.forEach(n => {
      if (out[n] === -1 && h.toLowerCase() === n.toLowerCase()) out[n] = i;
    });
  });
  return out;
}

function isDayChecked_(v) {
  if (v === true) return true;
  const s = String(v == null ? '' : v).trim().toLowerCase();
  if (!s) return false;
  if (s === 'no' || s === 'n' || s === 'x' || s === 'false') return false;
  if (s === 'yes' || s === 'y' || s === 'true' || s === '✓' || s === '✔') return true;
  return s.length > 0 && s !== 'no';
}

function hasLunch_(v) {
  const s = String(v == null ? '' : v).trim().toLowerCase();
  return !!s && s !== 'none' && s !== 'no' && s !== 'n/a' && s !== 'no lunch';
}

function extractAllergy_(notes) {
  if (!notes) return null;
  const m = notes.toLowerCase();
  if (m.indexOf('allerg') >= 0) return notes;
  return null;
}

function sortDesc_(obj) {
  const entries = Object.keys(obj).map(k => [k, obj[k]]);
  entries.sort((a, b) => b[1] - a[1]);
  const out = {};
  entries.forEach(([k, v]) => { out[k] = v; });
  return out;
}

/* ───────────────────────── Manual smoke test ─────────────────────────
   In the Apps Script editor, run runSmokeTest() once to confirm the
   builder reads all four sheets without errors. Output goes to
   View → Logs / Executions. */
function runSmokeTest() {
  const snap = buildSnapshot();
  Logger.log(JSON.stringify({
    summer: snap.summer.total,
    summerByCampus: snap.summer.byCampus,
    free: snap.free.total,
    weekKeys: Object.keys(snap.summer.byWeek).length,
    rosterWeekKeys: Object.keys(snap.roster).length,
  }, null, 2));
}
