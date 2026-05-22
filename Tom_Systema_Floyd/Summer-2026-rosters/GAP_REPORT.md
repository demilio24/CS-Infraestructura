# Gap report — Systema Floyd Summer 2026

Sources reviewed:
1. May 8 "Updated csv files for summer" — 12 weekly CSVs (already applied)
2. May 9 "Another form missing I found" — image attachment (1 form)
3. May 8 — 14 form-screenshot images (separate email, transcribed via OCR)
4. May 7 thread "Updated info on students" — 4 batch CSV attachments
5. May 7 thread "Re: Summer Camp 2026 registrations" — Tom's structured reply with SKIP markers
6. May 6 "Fwd: Summer Camp Registration" — Anna McIntosh form
7. Existing rows already present in Upper/Lower campus sheets (legacy)
8. Florida GHL contacts (we just upserted 61 parents)

## A. New students confirmed missing from May 8 CSVs (HIGH CONFIDENCE)

These came from form-submission screenshots Tom sent on May 8. Their parent emails do NOT appear in the May 8 master CSVs, so they were never added to the campus sheets when we applied the CSVs.

| # | Student | Parent | Parent email | Week(s) | Days | Lunch | Shirt | Notes | Campus |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Hannah Bennett** (b. Nov 19, 2020) | Savannah Bennett | savannahhuizenga@icloud.com | Week 3 (Jun 15-19) | Full Week | None | Small | Potty trained | **Lower** (age 5) |
| 2 | **Miles Younes** (b. Nov 16, 2020) | Kim Younes | **kimyounes11@gmail.com** | Week 3 (Jun 15-19) | Full Week | None |  | Potty trained | **Lower** (age 5) |
| 3 | **Sloane Kassatly** (b. Apr 24, 2019) | Stacy Kassatly | **stacykassatly@gmail.com** | Week 6 (Jul 6-10) | Full Week | None | Medium | No shirt needed; potty trained | **Upper** (age 7) |
| 4 | **Liam McPherson** (b. Mar 16, 2020) | Allison McPherson | **allisonm.mcpherson@gmail.com** | Week 8 (Jul 20-24) | 3 days | Pizza ($7.75/day) | Small (+$30) |  | **Upper** (age 6) |
| 5 | **Luke McPherson** (b. Aug 6, 2020) | Allison McPherson | **allisonm.mcpherson@gmail.com** | Week 8 (Jul 20-24) | 4 days | Pizza ($30/week) | Small (+$30) |  | **Lower** (age 5, sibling) |
| 6 | **Bennett Carter** (b. Mar 7, 2021) | Michelle Carter | **shelleycarterrn@gmail.com** | Week 1 + Week 2 (Jun 1-12) | 5 days each | Pizza ($30/week) | Extra Small (+$30) | Before care ($20/day) | **Lower** (age 5) |
| 7 | **Saylor Carter** (b. Jan 30, 2017) | Michelle Carter | **shelleycarterrn@gmail.com** | Week 1 + Week 2 (Jun 1-12) | 5 days each | Pizza ($30/week) | Medium (+$30) | Before care ($20/day) | **Upper** (age 9) |
| 8 | **Norah Skaar** (b. Nov 16, 2019) | Cathleen Ward | **cdenisew@icloud.com** | Week 2 + Week 8 (Jun 8-12, Jul 20-24) | 5 days each | None | Medium (+$30) |  | **Upper** (age 6) |
| 9 | **Anna McIntosh** (b. Jul 24, 2019) | Linda Pratka | lpratka@pm.me | Week 2 (Jun 8-12) | 3 days | None |  | Gluten/dairy/sugar/hand-sanitizer allergy; potty trained | **Upper** (age 6) — sibling of Paul |

**5 new parent emails** above (bold) are not in our 61-parent GHL upsert — they need to be added to GHL too:
- kimyounes11@gmail.com
- stacykassatly@gmail.com
- allisonm.mcpherson@gmail.com
- shelleycarterrn@gmail.com
- cdenisew@icloud.com

## B. Existing-student gaps — additional weeks not in May 8 CSVs

From the May 7 batch CSVs (`additional_weeks_students.csv`):

| Student | Parent email | Week to add | In May 8 CSV? | Action |
|---|---|---|---|---|
| **Aria Falzone** | marilyn@thefalzones.net | Week 12 (Aug 17-21) | NO | Add to Lower week 12 |
| Lilly Heyes | priscilla-ten@hotmail.com | Week 9 (Jul 27-31) | NO | **AMBIGUOUS** — see C |
| LJ Howe | howewedding17@gmail.com | Week 9 (Jul 27-31) | YES | already added |
| Jacob Perna | jinglejudi@gmail.com | Week 9 (Jul 27-31) | YES | already added |
| Reagan Olowin | amandaolowin@gmail.com | Week 12 (Aug 17-21) | YES | already added |
| Wyld Torrealba | laurenmusselman84@gmail.com | Week 12 (Aug 17-21) | YES | already added |

## C. SKIP / cancelled flags from May 7 thread (CONFLICT)

Tom's May 7 reply marked these as **SKIP / cancelled**, but they ARE in the May 8 master CSVs we applied (and now in the sheets):

| Student | Parent | Tom's annotation | Currently in sheet (post-apply) |
|---|---|---|---|
| Lilly Heyes | priscilla-ten@hotmail.com | "SKIP; parent canceled" | YES — Weeks 6, 7, 8 |
| Benjamin Mosst | jennifermosst@gmail.com | "SKIP; this is a Georgia student" | YES — Week 3 |
| Hawthorn Fennell | fennelljason42@gmail.com | "SKIP; canceled due to location" | YES — Weeks 2, 3, 5, 6, 12 |
| Lyla Falzone | marilyn@thefalzones.net | "SKIP; cancelled" | YES — Weeks 2, 3 |
| Aria Falzone | marilyn@thefalzones.net | "SKIP; cancelled" (via Lyla note) | YES — Weeks 1-10 |

**Interpretation:** the May 8 CSVs (sent AFTER the May 7 SKIP annotations) re-include all 5 of these. Either Tom changed his mind and re-registered them, or the SKIP annotations were incorrect. **Need user confirmation: keep these or remove?**

## D. May 9 "Another form missing I found" image

Form is for **Ryder Tarantino** (ryan.t76@icloud.com) — already in our data with the same 8-week registration. Not a new gap.

## Recommended next actions

1. **Confirm Section A** — should I add all 9 students above to the right campus weekly tab + upsert the 5 new parent emails to Florida GHL?
2. **Confirm Section B** — add Aria Falzone to Lower Week 12, and Lilly Heyes to Week 8 if she's not actually cancelled?
3. **Confirm Section C** — keep the 5 SKIP/cancelled-flagged students in the sheets, or remove? (The May 8 CSVs included them, so they're currently in.)
