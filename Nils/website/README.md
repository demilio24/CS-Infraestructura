# Nils Digital — Organic Website

Static HTML site, no build step. Hosted on GitHub Pages.

## Local dev

Serve the folder with any static server:

```bash
cd Nils/website
python -m http.server 8000
# or
npx http-server -p 8000
```

Then open `http://localhost:8000/`.

## Scripts

| Script | Purpose |
|---|---|
| `scripts/build-search.sh` | Regenerates the Pagefind blog search index (`pagefind/`) from the static HTML. Re-run after publishing posts. |
| `scripts/build-sitemap.mjs` | Rebuilds `sitemap.xml` from home + `/blog/` + every published post under `blog/posts/*.html`. Skips files starting with `_` and any post with `<meta name="robots" content="noindex">`. Post lastmod comes from `<meta name="blg-date">` (falls back to file mtime). |
| `scripts/inject-post-cta.mjs` | BabyLoveGrowth post-process: wraps a raw post in `blog/_template.html` and injects the tag-specific CTA. |

### Updating the blog search index

After adding or updating blog posts:

```bash
cd Nils/website
./scripts/build-search.sh
```

This regenerates `pagefind/` from the static HTML. Commit the contents of `blog/posts/` and re-deploy; the user's browser fetches `pagefind/` at runtime.

### Rebuilding the sitemap

After publishing or removing a post, regenerate `sitemap.xml`:

```bash
node scripts/build-sitemap.mjs
```

Run from anywhere; output goes to `Nils/website/sitemap.xml`. Commit the regenerated file.

## Section variations

During the build phase, every section of every page exists as 2-4 variations in `_drafts/<page>-<section>.html`. Emilio picks one, then the chosen variation is consolidated into the production page file.

## Publishing a blog post (BabyLoveGrowth flow)

BabyLoveGrowth writes a raw post HTML to `blog/posts/<slug>.html`. The post-process script wraps it with site chrome and injects the CTA based on the post's primary tag:

```bash
node scripts/inject-post-cta.mjs blog/posts/<slug>.html
```

Re-run `scripts/build-search.sh` to refresh the Pagefind index.
