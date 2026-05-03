# Stage 2 — Helper functions + GHL API calls

> Add pure helper functions and the GHL contact-search API call. Still no automatic sheet writes — this stage just adds testable units. Ends with a smoke test that confirms each helper works and one live GHL API call to verify network access.

**Prerequisite:** [Stage 1](01-sheet-structure.md) acceptance confirmed
**Architecture spec:** [../billing-dashboard-plan.md](../billing-dashboard-plan.md)

---

## The prompt

Copy this entire block into the Claude Chrome extension:

```
STAGE 2 of 5 — Add pure helper functions and GHL API calls. Still no
sheet writes happen automatically; this stage just adds testable units.

═══════════════════════════════════════════════════════════════════════
GOAL FOR THIS STAGE ONLY
═══════════════════════════════════════════════════════════════════════

Add a new file Helpers.gs containing:
  - parsePrice(value)            → numeric price or null
  - extractMultiplier(value)     → "/day", "/week", or null
  - stripPriceFromLabel(label)   → label with the "($N...)" portion removed
  - parseDurationDays(allValues) → first integer from "# day(s)" pattern
                                    across ALL string values in a payload
  - resolveSubaccount(waiverOrigin) → "Florida" / "Georgia" / "Virginia"
                                       (default Florida if empty/unknown)
  - resolveKidName(customFields) → first non-empty value in
                                    STUDENT_NAME_FIELD_IDS, or "(unknown)"
  - parseMultiSelectValue(raw)   → handles JSON-array strings,
                                    comma-separated strings, and plain
                                    strings; returns an array
  - ghlSearchContactByEmail(subaccount, email) → contact_id or null
  - buildProfileUrl(locationId, contactId) → the deep-link URL string
  - buildBalanceFormula(profileUrl, firstTxRow, lastTxRow)
        → returns either a HYPERLINK formula string OR a plain text
          fallback "(not found in {sub})" if profileUrl is null

Plus a comprehensive test function stage2HelperTests() that exercises
each helper with realistic inputs and Logger.logs results.

═══════════════════════════════════════════════════════════════════════
SPECIFIC IMPLEMENTATIONS
═══════════════════════════════════════════════════════════════════════

──────────────────── parsePrice ────────────────────

Run PRICE_REGEX against the value (string). Return Number(match[1])
or null if no match.

  parsePrice("Pizza ($7.75/day)")  → 7.75
  parsePrice("T-shirt ($25)")      → 25
  parsePrice("Cabin Group A")      → null
  parsePrice("$0")                 → 0

──────────────────── extractMultiplier ────────────────────

Returns the multiplier suffix or null.

  extractMultiplier("Pizza ($7.75/day)")    → "/day"
  extractMultiplier("Camp ($285/week)")     → "/week"
  extractMultiplier("T-shirt ($25)")        → null
  extractMultiplier("No price here")        → null

──────────────────── stripPriceFromLabel ────────────────────

Removes the " ($N...)" suffix from a label, keeping the human-readable
portion. Trim trailing whitespace.

  stripPriceFromLabel("Pizza ($7.75/day)")          → "Pizza"
  stripPriceFromLabel("Camp 3-day ($285/week)")     → "Camp 3-day"
  stripPriceFromLabel("T-shirt — XL ($25)")         → "T-shirt — XL"
  stripPriceFromLabel("No price field")             → "No price field"

──────────────────── parseDurationDays ────────────────────

Walk an array of string values. Find the FIRST one matching
DURATION_REGEX. Return the integer N. If no match, return 1.

  parseDurationDays(["3 days ($285/week)", "Pizza ($7.75/day)"])  → 3
  parseDurationDays(["Pizza ($7.75/day)"])                         → 1
  parseDurationDays(["1 day ($125/week)"])                         → 1
  parseDurationDays(["Full Week ($365/week)"])                     → 1  (no digit)

──────────────────── resolveSubaccount ────────────────────

Maps Waiver Origin field value to a subaccount name. Case-insensitive
matching. Empty/null/unknown → DEFAULT_SUBACCOUNT.

  resolveSubaccount("Florida")  → "Florida"
  resolveSubaccount("Georgia")  → "Georgia"
  resolveSubaccount("VIRGINIA") → "Virginia"
  resolveSubaccount("")         → "Florida"
  resolveSubaccount(null)       → "Florida"
  resolveSubaccount("Texas")    → "Florida"

──────────────────── resolveKidName ────────────────────

Iterates STUDENT_NAME_FIELD_IDS. For each, look it up in customFields
(an array of {id, value} objects). Return the first non-empty trimmed
string. If none, return "(unknown)".

──────────────────── parseMultiSelectValue ────────────────────

GHL multi-select fields can come through as:
  - A JSON array string:  '["Jun 1-5", "Jun 8-12"]'
  - A comma-separated string:  'Jun 1-5, Jun 8-12'
  - A single string: 'Jun 1-5'
  - An actual array (already parsed by some webhook variants)

Always return an Array.

  parseMultiSelectValue('["a","b"]')  → ["a", "b"]
  parseMultiSelectValue('a, b')       → ["a", "b"]
  parseMultiSelectValue('a')          → ["a"]
  parseMultiSelectValue(['a','b'])    → ["a", "b"]
  parseMultiSelectValue(null)         → []
  parseMultiSelectValue('')           → []

──────────────────── ghlSearchContactByEmail ────────────────────

  function ghlSearchContactByEmail(subaccountName, email) {
    const meta = SUBACCOUNTS[subaccountName];
    const token = getTokenFor(subaccountName);
    const url = GHL_API_BASE + '/contacts/search';
    const body = {
      locationId: meta.locationId,
      query: email,
      pageLimit: 1
    };
    const resp = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Version': GHL_API_VERSION,
        'Accept': 'application/json',
      },
      payload: JSON.stringify(body),
      muteHttpExceptions: true
    });
    if (resp.getResponseCode() !== 200) return null;
    const data = JSON.parse(resp.getContentText());
    const first = (data.contacts || [])[0];
    return first ? first.id : null;
  }

──────────────────── buildProfileUrl ────────────────────

  function buildProfileUrl(locationId, contactId) {
    return `https://app.gohighlevel.com/v2/location/${locationId}/contacts/detail/${contactId}`;
  }

──────────────────── buildBalanceFormula ────────────────────

If profileUrl is non-null → return a string with the HYPERLINK formula
referencing the customer's tx range:

  =HYPERLINK("<profileUrl>", "$" & TEXT(SUMIFS(F{first}:F{last},
                                               G{first}:G{last}, "owed"), "0.00"))

If profileUrl is null → return the plain text "(not found in {subaccount})"
(no HYPERLINK wrapper).

Note: NO IFERROR. If the SUMIFS errors, we want it visible.

If firstTxRow > lastTxRow (i.e., customer has no tx rows yet), the
formula's range will be invalid. In that case, return "$0.00" plain
text so the cell shows zero gracefully. This is a one-time edge case;
once the first tx row is added, the formula works normally.

═══════════════════════════════════════════════════════════════════════
TEST FUNCTION — stage2HelperTests()
═══════════════════════════════════════════════════════════════════════

Write a test function that runs through every helper with the example
inputs above. Use Logger.log to print [PASS] or [FAIL] for each.

Plus one live test:
  ghlSearchContactByEmail('Florida', 'tomfloyd@example.com')
    → log the returned contact_id (or "null") so we know the API call
      actually works against the real subaccount.

═══════════════════════════════════════════════════════════════════════
ACCEPTANCE FOR STAGE 2
═══════════════════════════════════════════════════════════════════════

  1. New Apps Script file Helpers.gs exists with all listed functions.
  2. stage2HelperTests() runs without throwing.
  3. Every assertion logs [PASS]; none log [FAIL].
  4. The live ghlSearchContactByEmail test logs either a real contact_id
     or null (network call worked).

═══════════════════════════════════════════════════════════════════════
WHAT TO REPORT BACK
═══════════════════════════════════════════════════════════════════════

  1. Confirmation each acceptance item passes.
  2. The full Logger output of stage2HelperTests() (so I can see
     every PASS/FAIL line).
  3. Whether the live ghlSearchContactByEmail returned a contact_id
     or null.
  4. Any unresolved issues, ambiguities, or assumptions.
  5. Done. Do NOT proceed to Stage 3 — wait for the next prompt.
```

---

## Acceptance criteria

1. New Apps Script file `Helpers.gs` exists with all listed functions
2. `stage2HelperTests()` runs without throwing
3. Every assertion logs `[PASS]`; none log `[FAIL]`
4. Live `ghlSearchContactByEmail` logs a contact_id or null (network call worked)

## What to report back

1. Confirmation each acceptance item passes
2. Full Logger output of `stage2HelperTests()`
3. Whether the live `ghlSearchContactByEmail` returned a contact_id or null
4. Any unresolved issues, ambiguities, or assumptions

## Next stage

After Stage 2's report is approved, move to **[03-sheet-writes.md](03-sheet-writes.md)**.
