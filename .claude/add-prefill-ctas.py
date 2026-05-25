"""Aquanauts: add pre-fill CTAs to every program/team/location card + enhance scroll handler.

Strategy:
  - Per-program card: add an explicit `Book ... ->` link with data-program=<slug>
  - Per-location card: keep existing 'Book here' link, add data-location inferred from h3 text via JS
  - Per-team card: keep existing 'Book with X' link, add data-location inferred from 'Serves:' text via JS
  - JS handler: when any '#hero-form' link clicks, set program/location selects + highlight form card

Idempotent: re-running won't double-insert (checks for existing markers).
"""
import sys, os, re

FILES = [
    ('A', r'F:\GitHub\Websites\Tristan_AquanautsAcademy\funnel\home.html'),
    ('B', r'F:\GitHub\Websites\Tristan_AquanautsAcademy\funnel\home-b.html'),
]

PROGRAM_INJECTIONS = [
    ('popular">$110</span>', 'private', 'Book Private Lessons'),
    ('Semi-private</span><span class="price-value">from $35</span>', 'family', 'Book Family Lessons'),
    ('Coverage</span><span class="price-value">Island-wide</span>', 'mobile', 'Book Mobile Lessons'),
    ('BC AFU funding</span><span class="price-value">Pathway available</span>', 'adaptive', 'Book Free Assessment'),
    ('Length</span><span class="price-value">30 or 60 min</span>', 'adult', 'Book Adult Lessons'),
    ('Coverage</span><span class="price-value">Facility + camp staffing</span>', 'lifeguard', 'Get a Quote'),
]

CSS_A = """
.program-card-cta { display: inline-flex; align-items: center; gap: 6px; margin-top: 16px; padding: 10px 16px; background: rgba(30,77,146,0.08); color: var(--blue); border: 1.5px solid var(--line); border-radius: 10px; font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 0.88rem; transition: all 0.2s; align-self: flex-start; }
.program-card-cta:hover { background: var(--blue); color: #fff; border-color: var(--blue); transform: translateY(-1px); }
@keyframes formPulse { 0%, 100% { transform: scale(1); } 25% { transform: scale(1.015); box-shadow: 0 24px 70px rgba(58,216,212,0.5), 0 0 0 4px rgba(58,216,212,0.3); } }
.hero-form-card.form-highlight { animation: formPulse 1.6s ease-out 1; }
"""

CSS_B = """
.program-card-cta { display: inline-flex; align-items: center; gap: 6px; margin-top: 16px; padding: 10px 16px; background: rgba(91,231,255,0.08); color: var(--cyan); border: 1px solid rgba(91,231,255,0.3); border-radius: 100px; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.88rem; transition: all 0.2s; align-self: flex-start; }
.program-card-cta:hover { background: var(--cyan); color: var(--space); border-color: var(--cyan); }
@keyframes formPulseB { 0%, 100% { transform: scale(1); } 25% { transform: scale(1.015); box-shadow: 0 30px 80px rgba(91,231,255,0.5), 0 0 0 4px rgba(91,231,255,0.35); } }
.hero-form-card.form-highlight { animation: formPulseB 1.6s ease-out 1; }
"""

OLD_JS = """document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href');
  if (id.length < 2) return;
  const t = document.querySelector(id);
  if (!t) return;
  e.preventDefault();
  const y = t.getBoundingClientRect().top + window.scrollY - 70;
  window.scrollTo({ top: y, behavior: 'smooth' });
}));"""

NEW_JS = """// Smooth scroll + form pre-fill (for CTAs targeting #hero-form)
function inferLocation(link) {
  const lc = link.closest('.loc-card');
  if (lc) {
    const t = ((lc.querySelector('h3') || {}).textContent || '').toLowerCase();
    if (t.includes('campbell river')) return 'campbell-river';
    if (t.includes('nanoose')) return 'nanoose';
    if (t.includes('parksville')) return 'parksville';
    if (t.includes('victoria')) return 'victoria';
    if (t.includes('shawnigan')) return 'shawnigan';
    if (t.includes('mobile') || t.includes('in-home')) return 'mobile';
    if (t.includes('nanaimo')) return 'nanaimo';
  }
  const tc = link.closest('.team-card');
  if (tc) {
    const s = ((tc.querySelector('.team-card-serves') || {}).textContent || '').toLowerCase();
    if (s.includes('campbell river')) return 'campbell-river';
    if (s.includes('port alberni')) return 'port-alberni';
    if (s.includes('victoria') || s.includes('shawnigan')) return 'victoria';
    if (s.includes('parksville') || s.includes('nanoose')) return 'parksville';
    if (s.includes('nanaimo') || s.includes('central')) return 'nanaimo';
  }
  return null;
}
function highlightForm() {
  const card = document.querySelector('.hero-form-card');
  if (!card) return;
  card.classList.add('form-highlight');
  setTimeout(() => card.classList.remove('form-highlight'), 1800);
}
document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href');
  if (id.length < 2) return;
  const t = document.querySelector(id);
  if (!t) return;
  e.preventDefault();
  if (id === '#hero-form') {
    const program = a.dataset.program;
    const location = a.dataset.location || inferLocation(a);
    if (program) {
      const sel = document.querySelector('select[name="program_interest"]');
      if (sel) { sel.value = program; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    if (location) {
      const sel = document.querySelector('select[name="location"]');
      if (sel) { sel.value = location; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    if (program || location) setTimeout(highlightForm, 500);
  }
  const y = t.getBoundingClientRect().top + window.scrollY - 70;
  window.scrollTo({ top: y, behavior: 'smooth' });
}));"""

def process(theme, path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    original_len = len(content)

    # Step 1: CSS additions (idempotent — check if .program-card-cta already exists)
    if '.program-card-cta {' not in content:
        css = CSS_A if theme == 'A' else CSS_B
        anchor = '@media (max-width: 1024px)'
        if anchor in content:
            content = content.replace(anchor, css.strip() + '\n\n' + anchor, 1)
            print(f"  [{theme}] CSS injected")
        else:
            print(f"  [{theme}] WARN: CSS anchor not found")
    else:
        print(f"  [{theme}] CSS already present, skipped")

    # Step 2: Program card CTA injections
    injected = 0
    for marker, slug, label in PROGRAM_INJECTIONS:
        # The marker is the last price line value; the structure after is:
        # </div>      <- closes program-card-prices
        # </div>      <- closes program-card-body
        # We want to inject the CTA right before the body close
        old = f'{marker}</div>\n          </div>\n        </div>'
        # Already injected?
        check = f'data-program="{slug}"'
        if check in content:
            print(f"  [{theme}] {slug}: already injected")
            continue
        if old in content:
            cta = f'          <a href="#hero-form" class="program-card-cta" data-program="{slug}">{label} →</a>'
            new = f'{marker}</div>\n          </div>\n{cta}\n        </div>'
            content = content.replace(old, new, 1)
            injected += 1
        else:
            print(f"  [{theme}] WARN: marker not found for {slug} (looking for: {marker[-50:]})")
    print(f"  [{theme}] CTA injections: {injected}/6")

    # Step 3: Replace JS handler
    if OLD_JS in content:
        content = content.replace(OLD_JS, NEW_JS, 1)
        print(f"  [{theme}] JS handler enhanced")
    elif 'inferLocation' in content:
        print(f"  [{theme}] JS already enhanced, skipped")
    else:
        print(f"  [{theme}] WARN: JS anchor not found")

    if len(content) != original_len:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  [{theme}] Saved ({original_len} -> {len(content)} chars, +{len(content) - original_len})")
    else:
        print(f"  [{theme}] No changes, skipped write")

if __name__ == '__main__':
    for theme, path in FILES:
        print(f"\n=== {theme}: {os.path.basename(path)} ===")
        process(theme, path)
    print('\nDONE.')
