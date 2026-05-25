# `_drafts/` Inventory + Cleanup Recommendation

This folder holds build-iteration variations from the original site build (2026-05-24 to 2026-05-25). The chosen variations were consolidated into `index.html`, `blog/index.html`, and the section-specific CSS files. HANDOFF.md section 7 flags this folder as deletable.

The drafts are excluded from production via `robots.txt` (`Disallow: /Nils/website/_drafts/`) and aren't linked from any production page, so leaving them in place has no SEO / UX impact, only repo weight (~190 KB total).

**Final call belongs to Emilio.** This file is a recommendation, not an action.

---

## Inventory

| File | Size | What it is | Recommendation |
|---|---|---|---|
| `ghl-media-gallery.html` | 16 KB | Browsable inline gallery of every candidate GHL image. **Actively referenced from HANDOFF.md §4 + §11** as the visual asset-audit tool. | **Keep** |
| `ghl-media-inventory.md` | 8 KB | Text reference of GHL media URLs. **Actively referenced from HANDOFF.md §4 + §11**, also called out in the Reviews wall row table (§4). | **Keep** |
| `landing-v1a.html` | 23 KB | Full-page landing variation: wider + flat proof grid + beefed contact. Superseded by current `index.html`. | Delete |
| `landing-v1b.html` | 22 KB | Full-page landing variation: wider + equal-height proof cols + closing route halves. Superseded. | Delete |
| `landing-v2.html` | 24 KB | Full-page landing variation: alternating bg + chapter numbers. Superseded. | Delete |
| `landing-v3.html` | 23 KB | Full-page landing variation: chapter dividers, all-white. Superseded. | Delete |
| `home-hero.html` | 4 KB | Hero section variation. Chosen version is now inlined in `index.html`. | Delete |
| `home-route-halves.html` | 9 KB | Route-halves CTA variations (B1-B4 buttons). B3 brutalist button is in production. | Delete |
| `home-proof.html` | 6 KB | Proof-section home variation. Superseded. | Delete |
| `home-about.html` | 5 KB | About-section home variation. Superseded. | Delete |
| `home-blog.html` | 8 KB | Blog-teaser variation. Chosen V4 layout is in production. | Delete |
| `proof-hero.html` | 4 KB | Proof-hero variation. Chosen V3 is in production. | Delete |
| `proof-cases.html` | 17 KB | Proof-cases layout variation. Chosen V1 is in production. | Delete |
| `proof-cta.html` | 4 KB | Proof CTA variation. Not used (proof now ends in #contact echo). | Delete |
| `about-hero.html` | 3 KB | About-hero variation. Chosen V2 is in production. | Delete |
| `about-story-team.html` | 7 KB | About story/team variation. Timeline version is in production. | Delete |
| `about-process-cta.html` | 8 KB | About-process CTA variation. FAQ-only V3 is in production. | Delete |
| `about-faq-variations.html` | 16 KB | 4 FAQ layout variations (A-D). Variation D (magazine longform) is in production. | Delete |
| `contact-page.html` | 7 KB | Contact-page variation. Current contact section + closing route halves is the live version. | Delete |
| `blog-index.html` | 14 KB | Blog index variation. Superseded by `blog/index.html`. | Delete |

---

## Recommended action

1. **Keep** the two GHL-media files (still referenced from HANDOFF.md).
2. **Delete** every other file plus the empty `.gitkeep` becomes the only thing left.

Suggested command (review before running):

```bash
git rm Nils/website/_drafts/landing-v1a.html \
       Nils/website/_drafts/landing-v1b.html \
       Nils/website/_drafts/landing-v2.html \
       Nils/website/_drafts/landing-v3.html \
       Nils/website/_drafts/home-hero.html \
       Nils/website/_drafts/home-route-halves.html \
       Nils/website/_drafts/home-proof.html \
       Nils/website/_drafts/home-about.html \
       Nils/website/_drafts/home-blog.html \
       Nils/website/_drafts/proof-hero.html \
       Nils/website/_drafts/proof-cases.html \
       Nils/website/_drafts/proof-cta.html \
       Nils/website/_drafts/about-hero.html \
       Nils/website/_drafts/about-story-team.html \
       Nils/website/_drafts/about-process-cta.html \
       Nils/website/_drafts/about-faq-variations.html \
       Nils/website/_drafts/contact-page.html \
       Nils/website/_drafts/blog-index.html
```

Everything stays recoverable via `git log -- Nils/website/_drafts/` if you ever want to revisit a variation. No git history is lost.

## Alternative: archive instead of delete

If you want a single artifact to keep without the weight, you could compress the variations into one tarball at `_drafts/_archive-2026-05-25.tar.gz` and `git rm` the loose files. This trades 19 individual files for one ~50 KB binary blob. Not recommended for plain HTML, since git already deltas text efficiently and the diffs help auditing.

## Why not just keep everything?

- The variations are reachable via `git log` if anyone wants to study build history.
- HANDOFF.md §7 explicitly flags the folder as deletable.
- The README still documents the variation-naming convention, which is the part future you actually needs.
