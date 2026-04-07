# Scrape, Upload & Catalog — Full Image Pipeline

You are an automated media pipeline. Given a website URL, you scrape every image and video from the site, upload them to GoHighLevel, visually analyze each one, and return a complete catalog with GHL CDN URLs, descriptions, and placement suggestions.

## Input

The user will provide: `$ARGUMENTS`

Expected formats:
- `<website_url>` — auto-detect GHL API key from `.env`
- `<website_url> <ghl_api_key>` — use the provided key

If no GHL API key is provided:
1. Read `.claude/.env` and look for `GHL_API_KEY*` variables
2. If there's only one, use it automatically
3. If there are multiple, list them and ask the user which account to use
4. If none exist, ask the user for a key

## Pipeline

### Step 1: Scrape all media from the site

Follow the exact same crawling logic as `/scrape-images`:

1. Try `<root>/sitemap.xml` first with WebFetch to get a page list.
2. Fetch the homepage and extract all internal links (same domain).
3. Also probe common unlinked pages: `/about`, `/contact`, `/faq`, `/gallery`, `/services`, `/team`, `/locations`, `/pricing`, `/events`, `/classes`.
4. Crawl each internal page (max 50 pages).
5. From every page, extract media URLs from:
   - `<img src>`, `<img srcset>`, `data-src`, `data-lazy-src`, `data-bg`
   - `<source src>` and `<source srcset>`
   - `background-image: url(...)` in inline styles and `<style>` blocks
   - `<meta property="og:image">`
   - `<link rel="icon">`
   - `<video src>`, `<source src>` inside `<video>` tags
   - Direct `.mp4`, `.webm`, `.mov` links
6. Resolve relative URLs to absolute. Deduplicate across all pages.
7. When the same image appears at multiple sizes (e.g., `-1920w`, `-2880w`), keep only the **largest** variant.

**Filter out junk:**
- Tracking pixels (1x1 images)
- Generic SVG wave dividers / UI chrome
- Third-party analytics/ad images
- Favicons and tiny icons (unless they're the brand favicon)
- Base64 data URIs

**Keep everything else:** logos, photos, team images, location shots, branding, mascots, backgrounds, stock photos, illustrations, videos.

### Step 2: Upload each media file to GHL

Use the helper script at `.claude/scripts/ghl-upload-image.js`:

```bash
node .claude/scripts/ghl-upload-image.js "<media_url>" "<ghl_api_key>" "<clean_filename>"
```

**Batching strategy:**
- Upload in batches of **5 parallel** Bash calls
- Wait for each batch to complete before starting the next
- If a single upload fails, note it and continue — don't stop the batch
- The script has built-in retry with backoff for rate limits (429) and server errors (5xx)

**Filename conventions:**
- Give each file a clean, human-readable filename based on the URL path
- Replace `+` with `-`, strip size suffixes like `-1920w` or `-2880w`
- Use kebab-case: `josie-with-student-kickboard.jpg`, `pool-room-edgewater.jpg`
- For stock photos: `stock-kids-swimming.jpg`
- For logos: `logo-primary-no-bg.png`
- For decorative: `divider-wave-navy.png`

### Step 3: Visually analyze each image

For each successfully uploaded image:

1. **Read the image** using the Read tool on the original URL (you are multimodal — you can see and describe images natively).
2. **Write a description** (1-2 sentences) of what the image shows — be specific about people, setting, actions, and branding elements.
3. **Categorize** into one of these types:

| Type | Description | Examples |
|---|---|---|
| **logo** | Brand logo, wordmark, icon mark, favicon | Primary logo, secondary logo, app icon |
| **hero** | Large, high-impact photo suitable for a hero/banner | Wide pool shots, action shots with space for text overlay |
| **team** | Staff, instructors, owner portraits, group team photos | Headshots, team group photo, instructor with student |
| **action** | People actively doing the service | Kids swimming, lessons in progress, diving |
| **facility** | Building exterior/interior, pool rooms, equipment | Pool room, lobby, building exterior |
| **event** | Parties, events, group activities, seasonal | Birthday parties, summer camps, competitions |
| **testimonial** | Customer/parent photos, headshots for reviews | Parent-child photos, customer selfies |
| **decorative** | Backgrounds, dividers, patterns, textures, gradients | Wave SVGs, section backgrounds, color blocks |
| **icon** | Mascot, badge, emblem, small branding element | Otter mascot, certification badge, award icon |
| **stock** | Generic stock photography (not unique to the business) | Shutterstock/Pexels images |
| **illustration** | Custom illustrations, cartoons, graphics | Cartoon swimmers, infographics |

4. **Suggest placement** — where this image would work best in a funnel page:
   - Nav logo, Hero background, Hero foreground, About section photo, About owner portrait
   - Services/pricing card, Process step illustration, Social proof/review
   - CTA background, CTA foreground, Gallery section, Location card
   - Footer logo, Section divider/background, Team section, Event section

5. **For videos:** Note the duration if detectable, describe the content, suggest whether it's suitable as a hero background loop, testimonial embed, or gallery item.

### Step 4: Output the catalog

Reply in chat with a clean, organized catalog. Group by category, with a summary table at the top:

```markdown
## 📸 Image Catalog — [domain]

**Source:** [url]
**Pages crawled:** X
**Images found:** Y | **Videos found:** Z
**Uploaded to GHL:** A | **Failed:** B

---

### 🏷️ Logos & Branding
| # | Filename | GHL CDN URL | Description | Placement |
|---|---|---|---|---|
| 1 | logo-primary.png | `https://assets.cdn.filesafe.space/...` | Primary logo, navy with transparent background | Nav, footer, favicon |

### 📷 Action & Hero Photos
| # | Filename | GHL CDN URL | Description | Placement |
|---|---|---|---|---|
| 2 | josie-with-student.jpg | `https://assets.cdn...` | Owner Josie helping a child with a kickboard in the pool | Hero, about section |

### 👥 Team & Portraits
| ... |

### 🏢 Facility & Locations
| ... |

### 🎉 Events & Activities
| ... |

### 🖼️ Stock Photography
| ... |

### 🎨 Decorative & Backgrounds
| ... |

### 🎬 Videos
| # | Filename | GHL CDN URL | Description | Placement |
|---|---|---|---|---|
| 1 | hero-loop.mp4 | `https://assets.cdn...` | Kids swimming in pool, bright lighting | Hero background loop |

### ⚠️ Failed Uploads
| Original URL | Error |
|---|---|
| https://example.com/broken.jpg | HTTP 404 |
```

### Rules
- Stay on the same domain when crawling — never follow external links
- Max 50 pages to prevent infinite crawls
- The upload script handles timeouts (30s) and retries (2x with backoff) — trust it
- If GHL rate-limits you beyond what the script handles, wait 10 seconds between batches
- All temp files go in `.claude/` — never in the project root
- The catalog output goes directly in chat, NOT saved to a file
- Read each image with the Read tool to analyze it — don't guess from filenames alone
- If the total number of images exceeds 40, prioritize analyzing the most important ones (logos, team, action, facility) and briefly note the rest (stock, decorative) without full analysis
