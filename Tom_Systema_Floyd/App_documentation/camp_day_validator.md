# Systema Floyd — Camp Day Validator

> Client-side JavaScript file (`camp-validator.js`) pasted into a Custom Code
> element at the bottom of the summer camp signup form in GoHighLevel (GHL).
> Keeps the "how many days you chose" dropdown in sync with the per-week
> "which days will you attend" checkboxes, and prevents the form from being
> submitted until every week has the right number of days selected.

The script runs entirely in the browser. It does not call any external APIs
and does not modify any data outside the form itself.

> **Code lives at:** `Tom_Systema_Floyd/Form/script.html` in this repo (also
> pasted into the GHL form's Custom Code element).

## What the script does, in order

1. Reads the selected option in the **Select Camp Duration** dropdown
   (`Full Week`, `Four days`, `Three days`, `Two days`, `One day`) and turns
   it into a number (5, 4, 3, 2, or 1).
2. Finds every visible **Which day(s) will you attend the week of...** field
   on the page.
3. Watches the checkboxes in each of those fields.
4. If the user checks more boxes than the duration allows, it automatically
   unticks the **oldest** one. **Newest intent wins.**
5. Shows a colored hint under each week telling the user how many more days
   to pick, or confirming the week is complete.
6. Adds a **Select All / Deselect All** pill inside the "Select Camp Dates"
   label.
7. When there are two or more weeks on the page, adds a **Copy to all weeks**
   pill next to each week's label so the user can mirror one week's choices
   into every other week.
8. Blocks form submission (and the GHL redirect) until every visible week has
   exactly the required number of days ticked. On a blocked submit it
   refreshes the hints and smooth-scrolls to the first incomplete week.

## DOM dependencies

The script assumes GHL's standard form-builder markup.

| Element | Selector / Pattern |
|---|---|
| Field labels | Inside `.form-builder--item` elements |
| Field wrappers | `.form-field-wrapper` (with `.form-builder--item` as fallback) |
| Duration dropdown | Vue-multiselect. Selected option read from `li.multiselect__element[aria-selected="true"]`, falling back to `.multiselect__tag`, `.multiselect__single`, then `.multiselect__tags-wrap` in that order |
| "Select Camp Dates" group | Element whose `id` ends with `-checkbox-container` |
| Form | `#_builder-form`, with any `<form>` on the page as fallback |
| Submit buttons | `button[type="submit"]`, `.hl-submit-button`, `.ghl-submit-btn`, or `.hl-btn-submit` |

Labels are matched by **regex against their text content**:

| Field | Label pattern |
|---|---|
| Duration | Starts with `Select Camp Duration` |
| Dates | Starts with `Select Camp Dates` |
| Week | Contains `Which day(s) will you attend the week of` |

## Subsystems

### Duration resolution

Locates the duration wrapper, reads the selected text, and maps it to an
expected number via an ordered list of regexes. Unknown values disable all
downstream behavior, and the unknown string is logged once with `console.warn`
so misconfiguration is debuggable.

### Per-week enforcement

Remembers the order in which each day checkbox was ticked. When a week exceeds
the allowed count, the oldest tick is automatically removed. **The box the
user just clicked is protected from eviction** if there's any older tick
available, so their latest action always survives.

### Hints

A soft amber pill appears under any week that's incomplete (e.g. "Select 2
more days..."), and a green pill confirms when the count is exactly right.
Hints are rebuilt from scratch on every update. There is no diffing.

### Submit guard

Two layers of protection:

1. A **capture-phase submit listener** on the form element itself.
2. A **capture-phase click listener** on the document watching the submit
   buttons. This one also calls `stopImmediatePropagation` so GHL's own
   submit handler never runs.

Together these block both the network call and the redirect when validation
fails.

### Select All button

Injected inside the "Select Camp Dates" label. Toggles all boxes in the dates
container between fully checked and fully unchecked, with a filled-blue
`is-active` state while everything is selected.

### Copy to all weeks

Only rendered when two or more week fields are visible, and only enabled when
the source week has exactly the right number of days ticked. On click it
copies the checked pattern to every other visible week, flashes "Copied" for
900 ms with the button disabled during the flash to prevent overlapping
animations, then re-evaluates whether it should stay enabled.

### Lifecycle

On `DOMContentLoaded` (or immediately if the DOM is already ready) the script:

1. Seeds internal state from any pre-checked boxes.
2. Attaches capture-phase `change` and `click` listeners on the document.
3. Installs the buttons.
4. Attaches the submit guard.
5. Renders the initial hints.

Then a **700 ms interval** re-runs the same installers. All installers are
idempotent, so this loop is safe. It exists specifically to recover after GHL
re-mounts the form (step navigation, conditional logic, live editing).

## Styling

All styles are injected once into a single `<style>` tag with
`id="camp-validator-css"`.

| Element | Style |
|---|---|
| Pill buttons (palette) | Background `#EAF1FF`, text `#1e4fd6`, border `#B9CCF7` |
| Pill button text color | Set with `!important` because GHL's inherited label color would otherwise beat the class selector and render the button text black |
| Tap target (desktop) | Minimum 36 px |
| Tap target (mobile, < 480 px) | Minimum 40 px, buttons drop to their own line so they don't collide with wrapped label text |
| Incomplete-week hint | Warm amber |
| Complete-week hint | Mint green |

## Safety features

| Feature | Mechanism |
|---|---|
| Duplicate-load guard | The whole IIFE bails immediately if `window.__campValidatorLoaded` is already true, so pasting the script twice (or GHL re-running the custom code block) does not double up intervals and event listeners |
| Re-entrancy guard | A private `enforcing` flag prevents enforcement-triggered clicks from recursively triggering more enforcement |
| Idempotent installers | `form.__campGuard`, `documentGuardAttached`, and "does this button already exist" checks ensure nothing is attached twice even though installers run on an interval |

## Known behaviors and trade-offs

| Behavior | Detail |
|---|---|
| Unknown duration option | If the duration dropdown contains an option whose text does not match any entry in `DURATION_MAP` (for example, "Five days"), the script silently disables itself and logs the unrecognized text to the console once per unique value |
| Copy to all weeks assumption | Matches checkboxes by index across weeks, so it assumes every week presents the same day options in the same order. This is true for a Monday-through-Friday form, which is the only configuration in use |
| Strong checkbox references | Checkbox references in the tick-order map are held strongly. If GHL ever removed a week's DOM, those references would persist until the page unloads. The impact is negligible for a single form fill |
| 700 ms polling loop | This is the recovery mechanism for GHL re-renders. A `MutationObserver` would be lighter but would add complexity. The trade-off was intentional |
| Literal `<script>` tags in the file | The file opens with a literal `<script>` tag so it can be pasted into a GHL Custom Code element. IDEs that parse the file as TypeScript/JSX will flag spurious "unexpected token" errors on the CSS template literal. These are false positives |

## Configuration reference

The following values are defined as constants near the top of the IIFE and are
the only things you would normally edit.

| Constant | Purpose |
|---|---|
| `DURATION_MAP` | Ordered list of regex-to-number pairs that maps the duration dropdown text to an expected day count. **Add a new entry here to support a new duration option.** |
| `RECOVERY_INTERVAL_MS` | The 700 ms polling interval for re-running idempotent installers after GHL re-mounts the form |
| `COPIED_FLASH_MS` | The 900 ms duration of the "Copied" confirmation state on the "Copy to all weeks" button |
| Pill color palette | Background `#EAF1FF`, text `#1e4fd6`, border `#B9CCF7`. Defined inline in the injected stylesheet |
| Hint colors | Amber for incomplete, mint green for complete. Defined inline in the injected stylesheet |

## Edge cases handled

| Scenario | Behavior |
|---|---|
| User picks "Three days" then ticks a fourth box | Oldest tick is automatically removed; latest click survives |
| User changes duration mid-fill | Hints recalculate on the next change event; over-ticked weeks self-correct as the user interacts |
| Duration dropdown contains an unknown option | Script silently disables itself and warns once per unique value to the console |
| User clicks Submit with incomplete weeks | Submission and GHL redirect are both blocked; hints refresh; page smooth-scrolls to first incomplete week |
| GHL re-mounts the form (step navigation, conditional logic, live editing) | 700 ms recovery loop re-installs buttons, listeners, and hints |
| Script is pasted twice or the Custom Code block re-runs | Duplicate-load guard prevents double event listeners and double intervals |
| Only one week is visible on the page | "Copy to all weeks" buttons are not rendered |
| Source week is not yet complete | "Copy to all weeks" button is rendered but disabled |
| User clicks "Select All" twice | Toggles between all-checked and all-unchecked; visual `is-active` state reflects current toggle |
| Pre-checked boxes when the form first loads | Tick-order state is seeded so enforcement works correctly from the start |

## How to update the script

The file lives as the entire contents of a Custom Code element at the bottom of
the GHL form. To update:

1. Open the form in the GHL form builder.
2. Locate the Custom Code element at the bottom.
3. Paste the new version of `camp-validator.js` in full, including the
   surrounding `<script>` tags.
4. Save the form and reload the public-facing form URL to verify.

The duplicate-load guard ensures that pasting an updated version while the old
version is cached in a user's browser will not cause double-execution. The new
version takes over on the next page load.

## Maintenance notes

- **To support a new camp duration option:** Add a new regex-to-number entry
  in `DURATION_MAP` matching the new option text.
- **To change the pill button colors:** Edit the palette values in the
  injected `<style>` block. Note the `!important` on text color is required to
  override GHL's inherited label color.
- **To change the recovery interval:** Adjust the `setInterval` duration.
  700 ms is the current value and was chosen as a balance between
  responsiveness after re-mounts and CPU overhead.
- **To add a new submit button selector:** Add it to the document-level click
  listener's selector list. This is needed if GHL ever changes its submit
  button class names.
- **To debug an unknown duration option:** Open the browser console on the
  form page. Any unrecognized duration text will be logged with `console.warn`
  exactly once per unique value.
- **If the form stops blocking incomplete submissions:** Verify the script is
  still loaded (check for `window.__campValidatorLoaded` in the console). If
  it is loaded but submission still goes through, GHL may have changed its
  submit button markup. Update the submit selector list accordingly.
