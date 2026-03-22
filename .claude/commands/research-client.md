Research a client's existing website and return a structured context report that the `/write-copy` and `/new-funnel` skills can use.

## Purpose

Before writing copy or building a funnel, run this skill first. It reads every page of the client's existing website and extracts: their voice, key services, proof points, team, location, and anything else that makes them unique. The output feeds directly into the copywriter as extra context.

---

## Steps

1. **Ask the user** for the client's website URL (or URLs if they have multiple).

2. **Fetch the homepage** using WebFetch. Read the full page content.

3. **Find all internal links** — extract every unique internal page URL from the homepage (About, Services, Team, FAQ, Contact, Blog, Gallery, etc.)

4. **Fetch each page** — use WebFetch on each URL. Read and extract:
   - Page headline and subheadline
   - All body copy (condensed — remove nav/footer boilerplate)
   - Service names, descriptions, pricing if visible
   - Team member names, titles, bios
   - Testimonials or reviews
   - Stats and proof points (years in business, clients served, certifications, awards)
   - Location and service area
   - Any unique differentiators or claims

5. **Also check for:**
   - Google Business Profile links (if present)
   - Social media bios (Instagram, Facebook — check if linked)
   - Any press mentions or award badges visible on the site

6. **Return a structured report** in this format:

```
===========================================
CLIENT RESEARCH REPORT: [Business Name]
===========================================

BUSINESS OVERVIEW
- Name:
- Tagline:
- Location / Service Area:
- Founded:
- Owner/Founder Name:

SERVICES (list all with brief descriptions)
1.
2.
3.

PROOF POINTS & STATS
- Years in business:
- Clients served:
- Ratings/reviews:
- Certifications:
- Awards:
- Notable claims ("only in X", "#1 in Y"):

TEAM
- [Name] — [Role] — [Key credential or fact]

VOICE & TONE OBSERVATIONS
- How do they currently talk about themselves?
- What words or phrases do they repeat?
- What's missing from their current messaging?

TESTIMONIALS FOUND
- "[Quote]" — [Author, if named]

UNIQUE DIFFERENTIATORS
- What makes them genuinely different?
- What do they say no other competitor offers?

PAGES REVIEWED
- [URL] — [what was on it]

GAPS & OPPORTUNITIES
- Information that seems missing or undersold
- Sections where the copy could be much stronger
===========================================
```

7. **Hand off** — Tell the user: "Research complete. Run `/write-copy` and paste this report below the client form answers for richer copy."
