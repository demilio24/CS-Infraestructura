Research a client's existing website and return a structured context report that the `/write-copy` and `/new-funnel` skills can use.

## Purpose

Before writing copy or building a funnel, run this skill first. It reads the client's website AND uses Perplexity to find external data (reviews, press, social proof, industry stats). The combined output feeds directly into the copywriter for richer, more specific copy.

---

## Steps

### PHASE 1 — Scrape the website

1. **Fetch the homepage** using WebFetch. Read the full page content.

2. **Find all internal links** — extract every unique internal page URL (About, Services, Team, FAQ, Contact, Blog, Gallery, etc.)

3. **Fetch each page** — use WebFetch on each URL. Extract:
   - Page headline and subheadline
   - All body copy (remove nav/footer boilerplate)
   - Service names, descriptions, pricing if visible
   - Team member names, titles, bios
   - Testimonials or reviews
   - Stats and proof points (years in business, clients served, certifications, awards)
   - Location and service area
   - Any unique differentiators or claims

---

### PHASE 2 — Perplexity deep research

Run these searches using Perplexity (`sonar-pro` model). Load `PERPLEXITY_API_KEY` from `.env`.

```bash
PERPLEXITY_KEY=$(grep PERPLEXITY_API_KEY .env | cut -d '=' -f2)

curl -s "https://api.perplexity.ai/chat/completions" \
  -H "Authorization: Bearer ${PERPLEXITY_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sonar-pro",
    "messages": [
      {"role": "user", "content": "Research [BUSINESS NAME] in [CITY]. Find: Google reviews and rating, Yelp reviews, Facebook reviews, any press mentions or news articles, any awards or certifications, social media presence and follower counts, any notable clients or case studies, and what customers commonly praise or complain about. Return everything you find."}
    ]
  }'
```

Run a second search for industry context:
```bash
curl -s "https://api.perplexity.ai/chat/completions" \
  -H "Authorization: Bearer ${PERPLEXITY_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sonar-pro",
    "messages": [
      {"role": "user", "content": "What are the most common pain points and buying triggers for people looking for [SERVICE TYPE] in [CITY/REGION]? What do they worry about before hiring? What outcome are they really looking for? What makes them choose one provider over another?"}
    ]
  }'
```

---

### PHASE 3 — Compile the report

Combine website data + Perplexity findings into this structured report:

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
- Google rating + review count:
- Yelp/Facebook rating:
- Certifications:
- Awards:
- Press mentions:
- Notable claims ("only in X", "#1 in Y"):

TEAM
- [Name] — [Role] — [Key credential or fact]

VOICE & TONE OBSERVATIONS
- How do they currently talk about themselves?
- What words or phrases do they repeat?
- What's missing from their current messaging?

TESTIMONIALS FOUND
- "[Quote]" — [Author, if named] — [Source]

UNIQUE DIFFERENTIATORS
- What makes them genuinely different?
- What do they say no other competitor offers?

CUSTOMER PAIN POINTS (from Perplexity)
- What do buyers in this niche worry about before hiring?
- What outcome are they really looking for?
- What triggers the decision to finally act?

PAGES REVIEWED
- [URL] — [what was on it]

GAPS & OPPORTUNITIES
- Information that seems missing or undersold
- Sections where the copy could be much stronger
===========================================
```

4. **Extract all visual assets** — While fetching each page, collect every image and video URL found. Categorize them:

```
VISUAL ASSETS FOUND
===================
FOUNDER/TEAM PHOTOS:
- [URL] — [description: headshot, award photo, team photo, etc.]

AWARD/CERTIFICATION IMAGES:
- [URL] — [what it shows]

RESULT/PROOF SCREENSHOTS:
- [URL] — [what result it shows]

CLIENT TESTIMONIAL VIDEOS:
- [URL] — [who it is, what they say]

HERO/BACKGROUND IMAGES:
- [URL] — [context: hero banner, section bg, etc.]

LOGOS:
- [URL] — [variation: main, white, dark, icon only]

REVIEW SCREENSHOTS (for masonry grid):
- [URL] — [platform: Google, Trustpilot, Facebook, etc.]
```

This section feeds directly into `/new-funnel` so the developer knows exactly which real client images to use in each section. Real photos are always preferred over generated or stock images.

5. **Hand off** — Pass this report directly to `/write-copy` as context.
