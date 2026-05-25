"""Aquanauts: add topic-filter bubbles to the reviews section, remove the Google CTA row.

Categories (data-review-tags values):
  - kids      (8 of 9 reviews)
  - adaptive  (4 — autism / neurodiverse stories)
  - adults    (1 — Melissa, 62, learning front crawl)
  - fear      (2 — Kirsten + Heidi: child afraid of water on face)

Reviewer -> tags:
  Erin M     -> kids adaptive
  Andrew B   -> kids
  Melissa S  -> adults
  Kirsten R  -> kids fear
  Heidi R    -> kids adaptive fear
  Amanda C   -> kids adaptive
  Ranu D     -> kids
  Cristina P -> kids adaptive
  Natali S   -> kids
"""
import sys, os

FILES = [
    ('A', r'F:\GitHub\Websites\Tristan_AquanautsAcademy\funnel\home.html'),
    ('B', r'F:\GitHub\Websites\Tristan_AquanautsAcademy\funnel\home-b.html'),
]

TAGS = {
    'Erin M.':     'kids adaptive',
    'Andrew B.':   'kids',
    'Melissa S.':  'adults',
    'Kirsten R.':  'kids fear',
    'Heidi R.':    'kids adaptive fear',
    'Amanda C.':   'kids adaptive',
    'Ranu D.':     'kids',
    'Cristina P.': 'kids adaptive',
    'Natali S.':   'kids',
}

FILTER_HTML = '''    <div class="filter-row anim" style="margin-bottom: 32px;">
      <button class="filter-btn active" data-review-filter="all">All Reviews</button>
      <button class="filter-btn" data-review-filter="kids">For Kids</button>
      <button class="filter-btn" data-review-filter="adaptive">Adaptive / Neurodiverse</button>
      <button class="filter-btn" data-review-filter="adults">Adult Learners</button>
      <button class="filter-btn" data-review-filter="fear">Beat Fear of Water</button>
    </div>
'''

# JS handler for review filter (extends existing filter wiring)
REVIEW_FILTER_JS = '''
const reviewFilters = document.querySelectorAll('.filter-btn[data-review-filter]');
const reviewCards = document.querySelectorAll('.reviews-grid .review-card');
reviewFilters.forEach(btn => btn.addEventListener('click', () => {
  reviewFilters.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const f = btn.dataset.reviewFilter;
  reviewCards.forEach(card => {
    if (f === 'all') { card.classList.remove('hidden'); return; }
    const tags = (card.dataset.reviewTags || '').split(' ');
    card.classList.toggle('hidden', !tags.includes(f));
  });
}));
'''

def process(theme, path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    original_len = len(content)

    # 1) Tag each review card with data-review-tags based on author name
    tagged = 0
    for author, tags in TAGS.items():
        # Each review card has a unique <div class="review-author-name">AUTHOR</div>
        # The owning <div class="review-card anim" ...> starts a fixed pattern of lines back.
        # Strategy: locate the review-author-name line, then back up to the review-card
        # opening tag and append data-review-tags="<tags>" if not present.
        marker = f'<div class="review-author-name">{author}</div>'
        if marker not in content:
            print(f"  [{theme}] WARN: author marker not found: {author}")
            continue
        # If already tagged, skip
        if f'data-review-tags="{tags}"' in content and content.count(f'data-review-tags="{tags}"') >= sum(1 for k, v in TAGS.items() if v == tags):
            # Too coarse — fine for now, we'll re-check below
            pass

        # Locate this author's card opening tag by walking backwards from the marker
        idx = content.find(marker)
        # search backwards for nearest '<div class="review-card'
        back = content.rfind('<div class="review-card', 0, idx)
        if back < 0:
            print(f"  [{theme}] WARN: review-card opening not found for {author}")
            continue
        # If already has data-review-tags on this opening, skip
        end_of_open = content.find('>', back)
        opening = content[back:end_of_open + 1]
        if 'data-review-tags=' in opening:
            print(f"  [{theme}] {author}: already tagged")
            continue
        new_opening = opening[:-1] + f' data-review-tags="{tags}">'
        content = content[:back] + new_opening + content[end_of_open + 1:]
        tagged += 1

    print(f"  [{theme}] Cards tagged: {tagged}/{len(TAGS)}")

    # 2) Inject filter row above the reviews-grid
    # Anchor: the opening of reviews-grid
    if 'data-review-filter' in content:
        print(f"  [{theme}] Review filter row already present, skipped")
    else:
        anchor = '<div class="reviews-grid">'
        if anchor in content:
            content = content.replace(anchor, FILTER_HTML.rstrip() + '\n    ' + anchor, 1)
            print(f"  [{theme}] Filter row injected")
        else:
            print(f"  [{theme}] WARN: reviews-grid anchor not found")

    # 3) Remove the reviews-cta-row block (the Read More Reviews on Google button)
    # The block spans from <div class="reviews-cta-row anim"> to its closing </div>
    start_marker = '    <div class="reviews-cta-row anim">'
    if start_marker in content:
        start = content.find(start_marker)
        # find the closing </div> at column 4 indent that follows
        # The block is: opening div, <a>...</a>, <span>...</span>, </div>
        # Look for next "    </div>\n" after start
        end_search = content.find('    </div>\n', start)
        if end_search > 0:
            # Include the newline after </div>
            end = end_search + len('    </div>\n')
            content = content[:start] + content[end:]
            print(f"  [{theme}] Removed reviews-cta-row block")
        else:
            print(f"  [{theme}] WARN: reviews-cta-row close not found")
    else:
        print(f"  [{theme}] reviews-cta-row already removed, skipped")

    # 4) Add the review-filter JS handler before the closing </script> tag
    if 'data-review-filter' in content and 'reviewFilters' not in content:
        # Find the final </script> in the file
        close = content.rfind('</script>')
        if close > 0:
            content = content[:close] + REVIEW_FILTER_JS + '\n' + content[close:]
            print(f"  [{theme}] Filter JS handler injected")
        else:
            print(f"  [{theme}] WARN: </script> not found for JS injection")
    elif 'reviewFilters' in content:
        print(f"  [{theme}] Filter JS already present, skipped")

    if len(content) != original_len:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  [{theme}] Saved ({original_len} -> {len(content)} chars, {len(content) - original_len:+d})")
    else:
        print(f"  [{theme}] No changes")

if __name__ == '__main__':
    for theme, path in FILES:
        print(f"\n=== {theme}: {os.path.basename(path)} ===")
        process(theme, path)
    print('\nDONE.')
