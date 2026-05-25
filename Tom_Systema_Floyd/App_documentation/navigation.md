# Systema Floyd, Funnel Nav Structure

Canonical reference for the shared nav bar across every Systema Floyd funnel
page. Last reorg landed in commit `46cfc770` per the 2026-05-22 check-in call.

## Structure

**Left side** (after the logo):

| Item | Type | Target |
|---|---|---|
| About | Link | `#about` on home, else `https://www.systemafloyd.com/#about` (target=_top) |
| Programs | Dropdown | 4 items, see below |
| Seminars & Events | Dropdown | 2 items, see below |

**Right side**:

| Item | Type | Target |
|---|---|---|
| Private Lessons | Link | `https://www.systemafloyd.com/private-lessons` (target=_top) |
| Gallery | Link | `#gallery` on home, else home `#gallery` |
| Reviews | Link | `#reviews` on home, else home `#reviews` |
| Get Started | CTA | `#top` (scrolls to hero form on each page) |

### Programs dropdown (4 items)

1. After School, `https://www.systemafloyd.com/after-school-class-registration`
2. Camps, `https://www.systemafloyd.com/camp-registration`
3. Spirit Dance, `https://www.systemafloyd.com/spirit-dance`
4. Rent A Sensei, `https://www.systemafloyd.com/rent-a-sensei`

### Seminars & Events dropdown (2 items)

1. Vladimir Vasiliev Seminar, `https://www.systemafloyd.com/vlad-seminar`
2. Birthday Parties, `https://www.systemafloyd.com/birthday-parties`

### Removed in this reorg

- **Why Us**, Tom asked for it to be cut.
- **Team**, dropped to make room for the Private Lessons link.

## Important details

- **Inner-page nav links use absolute `https://www.systemafloyd.com/...` URLs
  with `target=_top`.** Without `target=_top` the click would navigate inside
  the GHL iframe instead of swapping the parent page, so visitors would see a
  Systema Floyd page nested inside the GHL preview chrome. Don't change to
  relative paths.
- **Home-page in-page links use anchors** (`#about`, `#gallery`, `#reviews`)
  without `target=_top` so they smooth-scroll within the iframe.
- **Mobile menu mirrors the same 3 categories** (About, Programs section,
  Seminars & Events section, Private Lessons, Get Started CTA). The dropdowns
  flatten into labeled sections rather than collapse toggles.

## Where the nav lives

The nav block is duplicated inline in each of these 7 funnel pages
(`Tom_Systema_Floyd/funnel/`):

`home.html` · `after-school.html` · `birthday-parties.html` · `camps.html` ·
`private-lessons.html` · `rent-a-sensei.html` · `spirit-dance.html`

There is no shared partial, every page carries its own copy of the nav HTML.

## How to change a nav item

1. Edit `.claude/scratch/sf-update-nav.py`. The `URL` / `IMG` dicts at the top
   are the source of truth for hrefs and dropdown thumbnails; the `build_nav`
   function emits the desktop + mobile blocks.
2. Run `python .claude/scratch/sf-update-nav.py`. The script rewrites the nav
   block in all 7 pages so they stay in sync.
3. Visual QA the home page in a browser (or via `.claude/scratch/sf-nav-screenshot.js`).
4. Commit, push, then update this doc in the same session per
   `feedback_doc_after_push.md`.

## Dependent GHL pages

For dropdown links to resolve, these GHL pages must exist with the iframe
embed wrapper from [`.claude/CLAUDE.md`](../../.claude/CLAUDE.md):
`/vlad-seminar`, `/birthday-parties`, `/private-lessons`, `/spirit-dance`,
`/rent-a-sensei`. Tracked as blocked item #2 in `SESSION_RESUME.md`.
