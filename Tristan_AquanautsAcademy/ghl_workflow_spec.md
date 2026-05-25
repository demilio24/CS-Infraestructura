# Aquanauts Funnel — GHL Workflow Spec

How to wire the post-submit routing for the hero lead form in GHL.

**Goal:** when a visitor submits the hero form, GHL reads their `program_interest` + `closest_location` answers and redirects them to the right Jane App deep link (or content page).

**Source of truth for URLs:** [lead_form_routing.md](lead_form_routing.md)
**Source of truth for context behind URLs:** [booking_flow_map.md](booking_flow_map.md)

---

## Pre-requisites (one-time setup in GHL UI)

1. **Folder created** under Sites > Forms named "Aquanauts Funnel" (manual UI step, public API doesn't expose folder creation).
2. **Custom fields confirmed** (already created via API on 2026-05-25):
   - `Program of interest` → field ID `6JTnsxZJBRqmgcDKDNnc`, key `contact.program_of_interest`, 7 options
   - `Closest location` → field ID `uv5pZioA9EuxVABXNpxy`, key `contact.closest_location`, 8 options
3. **Form built** inside that folder with these fields, in this order:
   - First name (default GHL field)
   - Last name (default GHL field)
   - Email (default GHL field, required)
   - Phone (default GHL field, required)
   - Program of interest (the custom dropdown above, required)
   - Closest location (the custom dropdown above, required)

Submit button copy: **Get Matched to an Instructor 🚀**
Form heading: **Talk to Our Swim Team 😊**
Subhead: **We will help you find the right program.**

---

## Workflow design

Create one workflow in GHL > Automation > Workflows named "**Aquanauts Funnel - Post Submit Router**".

### Trigger

- **Form Submitted** → form: the Aquanauts Funnel form created above.

### Step 1 — Set contact tag

- **Add Tag:** `funnel-aquanauts-2026`
- Why: lets us track all funnel leads in reporting without polluting other tag groups.

### Step 2 — IF/ELSE branch on `program_interest`

Each branch handles one program. Inside each program branch we then sub-branch on `closest_location` where it matters.

#### Branch 1 — `program_interest = adaptive`

All adaptive leads go to the content page first (assessment-first conversation). No location sub-branching.
- **Redirect URL:** `https://www.aquanautsacademy.ca/adaptive-aquatics`

#### Branch 2 — `program_interest = lifeguard`

Quote-required B2B service. Content page first.
- **Redirect URL:** `https://www.aquanautsacademy.ca/lifeguarding-services`

#### Branch 3 — `program_interest = other`

Visitor said "Not sure yet". Drop them on Jane App root so they can browse.
- **Redirect URL:** `https://aquanautsacademy.janeapp.com/`

#### Branch 4 — `program_interest = mobile`

Mobile-to-pool service. Location doesn't matter (it IS mobile).
- **Redirect URL:** `https://aquanautsacademy.janeapp.com/locations/mobile-swim-lessons-lifeguarding-vancouver-island/book`

#### Branch 5 — `program_interest IN (private, family, adult)`

These three programs all need location-aware routing. Sub-branch on `closest_location`:

| closest_location value | Redirect URL |
|---|---|
| `nanaimo` | `https://aquanautsacademy.janeapp.com/locations/nanaimo-south-location/book` |
| `nanoose` | `https://aquanautsacademy.janeapp.com/locations/nanoose-bay-pacific-shores-resort-and-spa/book` |
| `parksville` | `https://aquanautsacademy.janeapp.com/locations/parksville-location-private-indoor-pool/book` |
| `victoria` | `https://aquanautsacademy.janeapp.com/locations/victoria-location-private-indoor-pool/book` |
| `campbell-river` | `https://aquanautsacademy.janeapp.com/locations/campbell-river-naturally-pacific-resort/book` |
| `shawnigan` | `https://aquanautsacademy.janeapp.com/locations/shawnigan-lake-location-private-outdoor-pool/book` |
| `port-alberni` | `https://aquanautsacademy.janeapp.com/locations/mobile-swim-lessons-lifeguarding-vancouver-island/book` (Maurya is mobile from there) |
| `mobile` | `https://aquanautsacademy.janeapp.com/locations/mobile-swim-lessons-lifeguarding-vancouver-island/book` |

**Default (no match):** `https://aquanautsacademy.janeapp.com/`

### Step 3 — Send internal notification email

- **To:** info@aquanautsacademy.ca (and Tristan personally if desired)
- **From:** noreply@aquanautsacademy.ca (or whatever the sub-account's verified sender is)
- **Subject:** New lead: {{contact.first_name}} ({{contact.program_of_interest}} / {{contact.closest_location}})
- **Body:**
  ```
  New funnel lead.

  Name: {{contact.first_name}} {{contact.last_name}}
  Email: {{contact.email}}
  Phone: {{contact.phone}}
  Program of interest: {{contact.program_of_interest}}
  Closest location: {{contact.closest_location}}

  Recommended next action: based on their selections they should have been routed to:
  [insert URL from matrix above based on values]

  Reach out within 1 business day to match them with the right instructor.
  ```

### Step 4 — Send auto-reply SMS to the lead

- **To:** {{contact.phone}}
- **Body:**
  ```
  Hi {{contact.first_name}}, this is Aquanauts Swim Academy! Thanks for reaching out about {{contact.program_of_interest}}. We will match you to the right instructor and pool within 1 business day. Questions? Reply here or call/text us at 250-327-3212. - Tristan
  ```

### Step 5 — Add to pipeline

- **Pipeline:** Aquanauts Sales (create if it doesn't exist)
- **Stage:** New Lead

---

## Testing checklist before going live

- [ ] Submit the form with every `program_interest` value and confirm the redirect URL is correct for each
- [ ] Submit twice with the same `program_interest` but different `closest_location` to confirm sub-branching works on Private / Family / Adult
- [ ] Verify the internal notification email arrives at info@aquanautsacademy.ca within 30 seconds
- [ ] Verify the auto-reply SMS arrives at the test phone number (and is not flagged as spam by the carrier)
- [ ] Open the redirect URLs in an incognito browser to confirm none have been deprecated by Jane

---

## After the form is built — update the funnel HTML

The hero in `funnel/home.html` and `funnel/home-b.html` currently has a placeholder `<form>`. To wire it to the real GHL form:

1. Get the GHL form embed iframe URL (something like `https://link.nilsdigital.com/widget/form/<form-id>`)
2. Find this block in both HTML files:
   ```html
   <div id="ghl-form-placeholder">
     <form onsubmit="event.preventDefault(); alert('Form placeholder. GHL embed goes here.');">
       ...
     </form>
   </div>
   ```
3. Replace the inner `<form>` with:
   ```html
   <script src="https://link.nilsdigital.com/js/form_embed.js"></script>
   <iframe
     src="https://link.nilsdigital.com/widget/form/<form-id>"
     style="width:100%;border:none;border-radius:8px;overflow:hidden;display:block;background:transparent;"
     scrolling="no"
     id="inline-<form-id>"
     data-layout='{"id":"INLINE"}'
     data-trigger-type="alwaysShow"
     data-form-id="<form-id>"
     data-form-name="Aquanauts Funnel Hero"
     data-height="600"
     title="Talk to Our Swim Team"
   ></iframe>
   ```
4. Push both files to GitHub, GHL pages picks up the changes automatically via the iframe wrapper.

---

## Bonus future tweak (optional, mention to Tristan)

The current site's "Book Now" buttons everywhere point to Jane root with zero location/instructor segmentation, which is a real conversion gap. Once Tristan sees the redirect map working on the funnel, propose updating the existing site's CTAs to use the same per-location deep links. Quick win, no Jane changes needed.

For per-instructor deep links (`#/staff_member/{id}` pattern), 10 staff IDs are captured in `booking_flow_map.md`.
