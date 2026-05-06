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

  const lunches = {
    summer: aggregateLunches_(allSummer),
    free:   aggregateLunches_(allFree),
  };

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
    lunches:  lunches,
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
      const breakfastVal = idx['Breakfast'] >= 0 ? String(row[idx['Breakfast']] || '').trim() : '';
      const notes = idx['Additional Notes'] >= 0 ? String(row[idx['Additional Notes']] || '').trim() : '';
      const days = ['Mon','Tue','Wed','Thu','Fri'].map(d => isDayChecked_(row[idx[d]]));
      enrollments.push({
        type: 'summer',
        week: week,
        campus: campusLabel,
        name: name,
        email: email || null,
        lunch: hasLunch_(lunchVal),
        lunchRaw: lunchVal || null,
        breakfastRaw: breakfastVal || null,
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
      const breakfastVal = idx['Breakfast'] >= 0 ? String(row[idx['Breakfast']] || '').trim() : '';
      const school = idx['School'] >= 0 ? String(row[idx['School']] || '').trim() : '';
      // Free sheets currently have no per-day attendance columns, so assume
      // a kid attends every weekday they're registered for that week.
      const days = [true, true, true, true, true];
      enrollments.push({
        type: 'free',
        week: week,
        campus: campusLabel,
        name: name,
        email: email || null,
        lunch: hasLunch_(lunchVal),
        lunchRaw: lunchVal || null,
        breakfastRaw: breakfastVal || null,
        allergy: null,
        school: school || null,
        days: days,
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

/* ───────────────── Lunch parsing + aggregation ─────────────────
 *
 * Lunch column values are free-text and messy. We parse them into a
 * structured order so the kitchen-prep dashboard (lunches.html) can
 * group by camp → week → day → category → sub-type and show counts.
 *
 * Order shape:
 *   {
 *     category:   'pizza' | 'celis' | 'breakfast' | 'none' | 'other',
 *     subtypeKey: 'pizza-weekly' | 'pizza-daily' | 'pizza-specific' |
 *                 'celis-melt-belt' | 'celis-wrap-trap' | 'celis-other' |
 *                 'breakfast-daily' | 'none' | 'other-<hash>',
 *     label:      human-readable display string ("Melt Belt grilled cheese"),
 *     sandwich:   parsed sandwich type (or null),
 *     sides:      parsed sides description (or null),
 *     smoothie:   parsed smoothie name (or null),
 *     specificDays: array of weekday names ['Monday','Friday'] or null,
 *     priceModel: 'weekly' | 'daily' | 'unknown',
 *     hasBreakfastAddon: boolean,    // "Pizza ($30/week) + Breakfast Daily"
 *     raw:        original text (for the "Other" category when classification fails)
 *   }
 */

const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
const DAY_ABBR  = { Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday', Fri:'Friday',
                    Tues:'Tuesday', Thur:'Thursday', Thurs:'Thursday',
                    Mo:'Monday', Tu:'Tuesday', We:'Wednesday', Th:'Thursday', Fr:'Friday' };

function parseLunch_(raw) {
  const txt = String(raw == null ? '' : raw).trim();
  if (!txt || /^none$/i.test(txt) || /^no\s*lunch$/i.test(txt) || /^n\/a$/i.test(txt) || /^no$/i.test(txt)) {
    return { category: 'none', subtypeKey: 'none', label: 'No lunch', priceModel: 'unknown',
             specificDays: null, sandwich: null, sides: null, smoothie: null,
             hasBreakfastAddon: false, raw: txt || null };
  }

  const lower = txt.toLowerCase();
  const specificDays = extractDays_(txt);
  const hasBreakfastAddon = /\bbreakfast\b/i.test(txt) && /pizza/i.test(txt);

  // Pizza family
  if (/\bpizza\b/i.test(lower)) {
    let priceModel = 'unknown';
    if (/\$30\s*\/\s*week/i.test(txt) || /per\s*week/i.test(txt)) priceModel = 'weekly';
    else if (/\$7\.75\s*\/\s*day/i.test(txt) || /per\s*day/i.test(txt) || /\/day\b/i.test(txt)) priceModel = 'daily';

    let subtypeKey, label;
    if (specificDays && specificDays.length > 0 && specificDays.length < 5) {
      subtypeKey = 'pizza-specific';
      label = 'Pizza specific days (' + specificDays.map(shortDay_).join('/') + ')';
    } else if (priceModel === 'weekly') {
      subtypeKey = 'pizza-weekly';
      label = 'Pizza weekly ($30/wk)';
    } else if (priceModel === 'daily') {
      subtypeKey = 'pizza-daily';
      label = 'Pizza daily ($7.75/day)';
    } else {
      subtypeKey = 'pizza-other';
      label = 'Pizza (unspecified pricing)';
    }
    return { category: 'pizza', subtypeKey, label, priceModel,
             specificDays: specificDays || null,
             sandwich: null, sides: null, smoothie: null,
             hasBreakfastAddon, raw: txt };
  }

  // Celis specialty (sandwich/wrap + sides + smoothie)
  if (/\bcelis\b/i.test(lower) || /\bmelt\s*belt\b/i.test(lower) ||
      /\bwrap\s*trap\b/i.test(lower) || /\bsmoothie\b/i.test(lower) ||
      /\bsandwich\s*:/i.test(lower) || /\bsides?\s*:/i.test(lower)) {
    const sandwich = detectSandwich_(txt);
    const sides    = detectSides_(txt);
    const smoothie = detectSmoothie_(txt);
    let subtypeKey, label;
    if (/melt\s*belt/i.test(txt)) {
      subtypeKey = 'celis-melt-belt';
      label = 'Celis: Melt Belt grilled cheese';
    } else if (/wrap\s*trap/i.test(txt)) {
      subtypeKey = 'celis-wrap-trap';
      label = 'Celis: Wrap Trap turkey wrap';
    } else {
      subtypeKey = 'celis-other';
      label = 'Celis: specialty (unspecified)';
    }
    // Append side+smoothie to label so different combos appear as
    // distinct rows in the kitchen-prep table.
    const combo = [];
    if (sides)    combo.push(sides);
    if (smoothie) combo.push(smoothie);
    if (combo.length) label += ' + ' + combo.join(' + ');
    return { category: 'celis', subtypeKey: subtypeKey + '|' + (sides || '') + '|' + (smoothie || ''),
             label, priceModel: /\$15\s*\/\s*day/i.test(txt) ? 'daily' : 'unknown',
             specificDays: specificDays || null,
             sandwich, sides, smoothie,
             hasBreakfastAddon: false, raw: txt };
  }

  // Anything else — keep the raw text as the sub-type so we can spot
  // miscategorisations and tighten the parser later.
  return { category: 'other', subtypeKey: 'other|' + txt.slice(0, 60).toLowerCase(),
           label: txt.length > 80 ? txt.slice(0, 77) + '…' : txt,
           priceModel: 'unknown', specificDays: specificDays || null,
           sandwich: null, sides: null, smoothie: null,
           hasBreakfastAddon: false, raw: txt };
}

function parseBreakfast_(raw) {
  const txt = String(raw == null ? '' : raw).trim();
  if (!txt || /^none$/i.test(txt) || /^no$/i.test(txt) || /^n\/a$/i.test(txt)) {
    return { category: 'none', subtypeKey: 'none', label: 'No breakfast', raw: txt || null };
  }
  if (/^yes$/i.test(txt)) {
    return { category: 'breakfast', subtypeKey: 'breakfast-daily', label: 'Breakfast (yes)', raw: txt };
  }
  // Anything else — likely the long Celis-style breakfast description.
  return { category: 'breakfast', subtypeKey: 'breakfast-' + txt.slice(0, 30).toLowerCase().replace(/\s+/g,'-'),
           label: txt.length > 60 ? txt.slice(0, 57) + '…' : txt, raw: txt };
}

function extractDays_(txt) {
  const found = {};
  // Full names + common abbreviations. Skip "May" (month) but allow Mo/Tu/We/Th/Fr.
  const re = /\b(Mondays?|Mon|Mo|Tuesdays?|Tues|Tue|Tu|Wednesdays?|Wed|We|Thursdays?|Thurs|Thur|Thu|Th|Fridays?|Fri|Fr)\b/gi;
  let m;
  while ((m = re.exec(txt)) !== null) {
    const tok = m[1];
    const norm = normalizeDayToken_(tok);
    if (norm) found[norm] = true;
  }
  const days = Object.keys(found);
  return days.length ? days.sort((a,b) => DAY_NAMES.indexOf(a) - DAY_NAMES.indexOf(b)) : null;
}

function normalizeDayToken_(tok) {
  const t = String(tok).trim();
  const tl = t.toLowerCase();
  if (tl.startsWith('mon')) return 'Monday';
  if (tl === 'mo')          return 'Monday';
  if (tl.startsWith('tue')) return 'Tuesday';
  if (tl === 'tu')          return 'Tuesday';
  if (tl.startsWith('wed')) return 'Wednesday';
  if (tl === 'we')          return 'Wednesday';
  if (tl.startsWith('thu')) return 'Thursday';
  if (tl === 'th')          return 'Thursday';
  if (tl.startsWith('fri')) return 'Friday';
  if (tl === 'fr')          return 'Friday';
  return null;
}

function shortDay_(name) {
  const m = { Monday:'Mon', Tuesday:'Tue', Wednesday:'Wed', Thursday:'Thu', Friday:'Fri' };
  return m[name] || name;
}

function detectSandwich_(txt) {
  if (/melt\s*belt[^,]*grilled\s*cheese/i.test(txt)) return 'Melt Belt grilled cheese';
  if (/melt\s*belt/i.test(txt))                       return 'Melt Belt';
  if (/wrap\s*trap[^,]*turkey/i.test(txt))            return 'Wrap Trap turkey & cheese';
  if (/wrap\s*trap/i.test(txt))                       return 'Wrap Trap';
  if (/grilled\s*cheese/i.test(txt))                  return 'Grilled cheese';
  return null;
}

function detectSides_(txt) {
  // Sides come after "Sides:" or are mentioned standalone (chips, fruit cup).
  const sides = [];
  if (/chips?\s*\(?\s*deep\s*river/i.test(txt))    sides.push('Chips (Deep River)');
  else if (/chips?/i.test(txt))                    sides.push('Chips');
  if (/small\s*fruit\s*cup/i.test(txt))            sides.push('Small fruit cup');
  else if (/fruit\s*cup/i.test(txt))               sides.push('Fruit cup');
  return sides.length ? sides.join(' + ') : null;
}

function detectSmoothie_(txt) {
  if (/smooth\s*moves[^,]*very\s*berry/i.test(txt)) return 'Smooth Moves: Very Berry';
  if (/shake\s*break[^,]*el\s*tropical/i.test(txt)) return 'Shake Break: El Tropical';
  if (/smooth\s*moves/i.test(txt))                  return 'Smooth Moves';
  if (/shake\s*break/i.test(txt))                   return 'Shake Break';
  if (/smoothie\s*:/i.test(txt))                    return 'Smoothie (unspecified)';
  return null;
}

/**
 * Aggregate lunches across enrollments into the dashboard-ready shape:
 *
 *   {
 *     "<weekLabel>": {
 *       rows: [
 *         { category, subtypeKey, label, byDay: { Mon: n, Tue: n, ... }, total }
 *       ],
 *       totals: { byDay: { Mon: n, ... }, all: n },
 *     },
 *     ...
 *   }
 */
function aggregateLunches_(enrollments) {
  const out = {};
  WEEK_ORDER.forEach(w => {
    out[w] = { rows: [], rowsByKey: {}, totals: { byDay: zeroDay_(), all: 0 } };
  });
  // Track per-week intra-week dedup so two duplicate rows for the same kid
  // don't double-count their lunch order.
  const seen = {};
  enrollments.forEach(e => {
    if (!out[e.week]) return;
    const nk = nameKey_(e.name);
    if (!nk) return;
    const dedupKey = e.week + '|' + nk;
    if (seen[dedupKey]) return;
    seen[dedupKey] = true;

    const order = parseLunch_(e.lunchRaw);
    const days = applicableDays_(order, e.days);
    if (!days.length) return;

    const slice = out[e.week];
    let row = slice.rowsByKey[order.subtypeKey];
    if (!row) {
      row = {
        category:   order.category,
        subtypeKey: order.subtypeKey,
        label:      order.label,
        byDay:      zeroDay_(),
        total:      0,
      };
      slice.rowsByKey[order.subtypeKey] = row;
      slice.rows.push(row);
    }
    days.forEach(dShort => {
      row.byDay[dShort] = (row.byDay[dShort] || 0) + 1;
      row.total++;
      slice.totals.byDay[dShort] = (slice.totals.byDay[dShort] || 0) + 1;
      slice.totals.all++;
    });
  });
  // Sort rows: pizza first, then celis, then breakfast, then none, other last
  const order = { pizza:1, celis:2, breakfast:3, none:4, other:5 };
  WEEK_ORDER.forEach(w => {
    out[w].rows.sort((a,b) => {
      const oa = order[a.category] || 9;
      const ob = order[b.category] || 9;
      if (oa !== ob) return oa - ob;
      return a.label.localeCompare(b.label);
    });
    delete out[w].rowsByKey;
  });
  return out;
}

function zeroDay_() { return { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 }; }

/** Days the lunch order applies to: explicit days from the order text if
 *  any, otherwise the kid's attendance days (Mon-Fri checks). */
function applicableDays_(order, days) {
  const SHORT = ['Mon','Tue','Wed','Thu','Fri'];
  if (order.specificDays && order.specificDays.length) {
    return order.specificDays.map(shortDay_);
  }
  const out = [];
  for (let i = 0; i < SHORT.length; i++) {
    if (days[i]) out.push(SHORT[i]);
  }
  // Some kids in the sheet have no day-checks set but still ordered lunch.
  // Default to all-five so their lunch shows up at least once that week.
  if (!out.length) return SHORT.slice();
  return out;
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
