# Scrape Images from Website

You are a web scraper. Given a website URL, crawl the site and extract every image and video URL from all discoverable pages.

## Input

The user will provide: `$ARGUMENTS`

This should be a root URL like `https://example.com`. If no URL is provided, ask for one.

## Instructions

### Step 1: Fetch the sitemap (optional fast path)

Try fetching `<root>/sitemap.xml` first using WebFetch. If it exists, parse out all `<loc>` URLs — this gives you the full page list without crawling.

If the sitemap doesn't exist or returns an error, move to Step 2.

### Step 2: Crawl from the homepage

Start from the root URL:

1. Fetch the homepage HTML with WebFetch
2. Extract all internal links (same domain, `<a href="...">`)
3. Also check for common pages that may not be linked: `/about`, `/contact`, `/faq`, `/gallery`, `/services`, `/team`, `/locations`, `/pricing`, `/events`, `/classes`
4. Deduplicate and queue them
5. Fetch each internal page (up to 50 pages max to avoid runaway crawls)

### Step 3: Extract media URLs from every page

For each page's HTML, extract URLs from:

**Images:**
- `<img src="...">`
- `<img srcset="...">` (parse all URLs from the srcset attribute)
- `<source srcset="...">` inside `<picture>` tags
- `background-image: url(...)` in inline styles and `<style>` blocks
- `<meta property="og:image" content="...">`
- `<link rel="icon" href="...">`
- `data-src`, `data-lazy-src`, `data-bg` attributes (lazy-loaded images)
- `content` attributes on `<meta>` tags with image URLs
- CSS `url()` references in `style` attributes

**Videos:**
- `<video src="...">`
- `<source src="...">` inside `<video>` tags
- `<iframe src="...">` (note YouTube/Vimeo embeds but don't follow them)
- `data-src` on video elements
- Direct `.mp4`, `.webm`, `.mov` links in any `href` or `src`

Resolve all relative URLs to absolute URLs using the page's base URL.

### Step 4: Deduplicate intelligently

Many sites serve the same image at multiple sizes (e.g., `-1920w.jpg`, `-2880w.jpg`, `-600h.jpg`). When deduplicating:
- Group images that differ only in a size suffix (e.g., `-1920w`, `-2880w`, `-600h`)
- Keep the **largest** variant of each image
- Remove exact URL duplicates
- Separate images from videos in the output

### Step 5: Report results

Reply in chat with:

1. **Summary**: pages crawled, unique images found, unique videos found
2. **Image list**: every unique image URL, grouped by the page it was first found on
3. **Video list**: every unique video URL, grouped by the page it was first found on

Format:

```
## 🔍 Media Scrape Results — example.com

**Pages crawled:** 12
**Unique images found:** 47
**Unique videos found:** 3

---

### 🖼️ Images

#### Homepage (https://example.com/)
- https://example.com/images/hero.jpg
- https://example.com/images/logo.png

#### About (https://example.com/about)
- https://example.com/images/team.jpg

---

### 🎬 Videos

#### Homepage (https://example.com/)
- https://example.com/videos/hero-loop.mp4

#### About (https://example.com/about)
- [YouTube embed] https://www.youtube.com/embed/abc123
```

### Rules
- Stay on the same domain — never follow external links to other sites
- Max 50 pages to prevent infinite crawls
- Timeout after 10 seconds per page fetch
- Skip non-HTML resources (PDFs, ZIPs, etc.) — but DO capture linked media files
- If a page fails to load, note it in the output and continue
- Prefer the largest size variant when deduplicating
- Clearly separate images from videos
- Note embedded video platforms (YouTube, Vimeo, Wistia) but don't scrape those external sites
