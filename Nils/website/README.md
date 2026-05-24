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

## Updating the blog search index

After adding or updating blog posts:

```bash
cd Nils/website
./scripts/build-search.sh
```

This regenerates `pagefind/` from the static HTML. Commit the contents of `blog/posts/` and re-deploy; the user's browser fetches `pagefind/` at runtime.

## Section variations

During the build phase, every section of every page exists as 2-4 variations in `_drafts/<page>-<section>.html`. Emilio picks one, then the chosen variation is consolidated into the production page file.

## Publishing a blog post (BabyLoveGrowth flow)

BabyLoveGrowth writes a raw post HTML to `blog/posts/<slug>.html`. The post-process script wraps it with site chrome and injects the CTA based on the post's primary tag:

```bash
node scripts/inject-post-cta.mjs blog/posts/<slug>.html
```

Re-run `scripts/build-search.sh` to refresh the Pagefind index.
