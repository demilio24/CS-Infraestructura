"""Inject (or update):
- The product detail modal (CSS + markup + JS + JSON data)
- The sticky filter bar (search input + category pills) at the top of the catalog
- A row of mini preview thumbnails below each product card

All idempotent: re-running replaces existing injected blocks.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SHOP = ROOT / "Tristan_AquanautsAcademy" / "funnel" / "shop.html"
DATA_FILE = Path(__file__).parent / "aquanauts_shop_product_data.json"

products = json.loads(DATA_FILE.read_text(encoding="utf-8"))
html = SHOP.read_text(encoding="utf-8")

CSS_ADDITIONS = """
/* PRODUCT MODAL */
.product-card { cursor: pointer; }
.product-card:focus-visible { outline: 3px solid var(--teal); outline-offset: 3px; }
.product-card.hidden, .cat-section.hidden { display: none; }
.product-card .product-minithumbs { display: flex; gap: 6px; margin-top: 12px; }
.product-card .product-minithumbs button { flex: 1; min-width: 0; aspect-ratio: 1/1; max-width: 56px; border: 1.5px solid var(--line); border-radius: 8px; background: #fff; padding: 0; cursor: pointer; overflow: hidden; transition: all .15s ease; }
.product-card .product-minithumbs button:hover { border-color: var(--blue); transform: translateY(-1px); }
.product-card .product-minithumbs img { width: 100%; height: 100%; object-fit: cover; display: block; }
.product-card .product-minithumbs.empty { display: none; }
.product-card .product-ask-link { display: inline-flex; align-items: center; gap: 5px; margin-top: 10px; font-family: 'Outfit', sans-serif; font-weight: 600; font-size: 0.82rem; color: var(--coral-2); text-decoration: none; transition: color .15s ease; }
.product-card .product-ask-link:hover { color: var(--coral); text-decoration: underline; }
.product-card .product-ask-link svg { width: 13px; height: 13px; flex-shrink: 0; }

/* SHOP FILTER BAR */
.shop-filter { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,0.95); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid var(--line); padding: 14px 0; margin-bottom: 28px; }
.shop-filter-inner { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.shop-filter-search { position: relative; flex: 0 1 320px; min-width: 220px; }
.shop-filter-search svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--muted); width: 16px; height: 16px; pointer-events: none; }
.shop-filter-search input { width: 100%; padding: 11px 18px 11px 40px; border: 1.5px solid var(--line); border-radius: 50px; background: #fff; font-family: 'Manrope', sans-serif; font-size: 0.94rem; color: var(--navy); transition: border-color .2s ease; }
.shop-filter-search input:focus { outline: none; border-color: var(--blue); }
.shop-filter-pills { display: flex; gap: 8px; flex: 1; overflow-x: auto; padding: 2px 0; scrollbar-width: thin; }
.shop-filter-pills::-webkit-scrollbar { height: 4px; }
.shop-filter-pills .filter-pill { flex-shrink: 0; padding: 9px 18px; border-radius: 50px; border: 1.5px solid var(--line); background: #fff; color: var(--navy); font-family: 'Outfit', sans-serif; font-weight: 600; font-size: 0.86rem; cursor: pointer; transition: all .2s ease; }
.shop-filter-pills .filter-pill:hover { border-color: var(--blue); color: var(--blue); }
.shop-filter-pills .filter-pill.active { background: var(--navy); border-color: var(--navy); color: #fff; }
.shop-empty { text-align: center; padding: 60px 24px; color: var(--muted); display: none; }
.shop-empty.show { display: block; }
@media (max-width: 720px) {
  .shop-filter { margin-bottom: 18px; padding: 12px 0; }
  .shop-filter-inner { gap: 10px; }
  .shop-filter-search { flex-basis: 100%; }
  .shop-filter-pills { flex-basis: 100%; }
}

/* PRODUCT MODAL */
.aq-modal { position: fixed; inset: 0; background: rgba(10,30,58,0.6); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); display: none; align-items: center; justify-content: center; z-index: 200; padding: 24px; }
.aq-modal.open { display: flex; animation: aqModalFade .25s ease; }
@keyframes aqModalFade { from { opacity: 0; } to { opacity: 1; } }
.aq-modal-panel { position: relative; background: #fff; border-radius: 24px; width: min(1100px, 100%); max-height: 92vh; overflow: hidden; display: grid; grid-template-columns: 1.05fr 1fr; box-shadow: 0 30px 80px rgba(10,30,58,0.4); animation: aqPanelRise .35s cubic-bezier(.2,.85,.3,1); }
@keyframes aqPanelRise { from { transform: translateY(20px); opacity: 0; } to { transform: none; opacity: 1; } }
.aq-modal-close { position: absolute; top: 16px; right: 18px; width: 38px; height: 38px; border-radius: 50%; background: #fff; border: 1.5px solid var(--line); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 5; transition: all .2s ease; color: var(--navy); }
.aq-modal-close:hover { background: var(--bg-soft); border-color: var(--navy); transform: rotate(90deg); }
.aq-modal-gallery { background: var(--bg-soft); padding: 24px; display: flex; flex-direction: column; max-height: 92vh; overflow: hidden; min-width: 0; }
.aq-modal-bigimg { flex: 1; background: #fff; border-radius: 16px; overflow: hidden; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(10,30,58,0.08); min-height: 0; }
.aq-modal-bigimg img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; }
.aq-modal-thumbs { display: flex; gap: 8px; margin-top: 14px; overflow-x: auto; padding: 4px; flex-shrink: 0; scrollbar-width: thin; }
.aq-modal-thumbs::-webkit-scrollbar { height: 6px; }
.aq-modal-thumbs::-webkit-scrollbar-thumb { background: var(--line); border-radius: 4px; }
.aq-modal-thumbs button { flex-shrink: 0; width: 64px; height: 64px; border-radius: 10px; border: 2px solid transparent; background: #fff; padding: 0; cursor: pointer; overflow: hidden; transition: border-color .2s ease, transform .15s ease; }
.aq-modal-thumbs button.active { border-color: var(--blue); }
.aq-modal-thumbs button:hover { transform: translateY(-2px); }
.aq-modal-thumbs img { width: 100%; height: 100%; object-fit: cover; display: block; }
/* Info column: pin head (title/price/size) at top, body (description) scrolls,
   actions (CTA + microcopy) pinned at bottom and always visible. */
.aq-modal-info { padding: 0; max-height: 92vh; display: flex; flex-direction: column; min-height: 0; }
.aq-modal-info-head { padding: 36px 36px 12px; flex-shrink: 0; }
.aq-modal-info-body { padding: 4px 36px; overflow-y: auto; flex: 1 1 auto; min-height: 0; }
.aq-modal-info-actions { padding: 16px 36px 28px; flex-shrink: 0; border-top: 1px solid var(--line); background: #fff; display: flex; flex-direction: column; gap: 12px; }
.aq-modal-title { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: clamp(1.5rem, 2.6vw, 2rem); color: var(--navy); margin: 0 0 8px; line-height: 1.18; padding-right: 40px; }
.aq-modal-price { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.6rem; color: var(--blue); margin-bottom: 6px; }
.aq-modal-partner { display: inline-flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 600; color: var(--muted); margin-bottom: 22px; }
.aq-modal-partner::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--teal); }
.aq-modal-size { display: flex; flex-direction: column; gap: 8px; margin-bottom: 22px; }
.aq-modal-size[hidden] { display: none; }
.aq-modal-size-label { font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 0.86rem; color: var(--navy); }
.aq-modal-size select { font-family: 'Outfit', sans-serif; font-weight: 600; font-size: 0.95rem; padding: 11px 14px; border: 1.5px solid var(--line); border-radius: 10px; background: #fff; color: var(--navy); cursor: pointer; transition: border-color .2s ease; }
.aq-modal-size select:hover { border-color: var(--blue); }
.aq-modal-desc { font-family: 'Manrope', sans-serif; font-size: 0.96rem; color: var(--muted); line-height: 1.65; margin: 0 0 24px; white-space: pre-line; }
.aq-modal-cta { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 28px; background: linear-gradient(135deg, var(--coral) 0%, var(--coral-2) 100%); color: var(--navy); font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 1rem; border-radius: 12px; text-decoration: none; box-shadow: 0 6px 18px rgba(250,165,107,0.42); transition: transform .2s ease, box-shadow .2s ease; align-self: stretch; }
.aq-modal-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(250,165,107,0.55); }
.aq-modal-foot { font-size: 0.82rem; color: var(--muted); line-height: 1.5; margin: 0; }
body.modal-locked { overflow: hidden; }
@media (max-width: 820px) {
  .aq-modal { padding: 0; align-items: flex-end; }
  .aq-modal-panel { grid-template-columns: 1fr; grid-template-rows: auto 1fr; max-height: 95vh; border-radius: 22px 22px 0 0; }
  .aq-modal-gallery { max-height: 42vh; padding: 16px; }
  .aq-modal-info { max-height: none; min-height: 0; }
  .aq-modal-info-head { padding: 22px 22px 10px; }
  .aq-modal-info-body { padding: 0 22px; }
  .aq-modal-info-actions { padding: 14px 22px 22px; }
  .aq-modal-title { padding-right: 50px; }
}
"""

FILTER_BAR_HTML = """
<!-- SHOP FILTER BAR -->
<div class="shop-filter">
  <div class="container shop-filter-inner">
    <div class="shop-filter-search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <input type="search" id="shopSearch" placeholder="Search products, colours, names..." aria-label="Search products">
    </div>
    <div class="shop-filter-pills" role="tablist">
      <button class="filter-pill active" data-shop-filter="all" type="button">All</button>
      <button class="filter-pill" data-shop-filter="caps-hats" type="button">Caps & Hats</button>
      <button class="filter-pill" data-shop-filter="swim-rings" type="button">Swim Rings</button>
      <button class="filter-pill" data-shop-filter="beach-toys" type="button">Beach & Toys</button>
      <button class="filter-pill" data-shop-filter="headbands" type="button">Headbands</button>
      <button class="filter-pill" data-shop-filter="happy-nappy" type="button">Happy Nappy</button>
    </div>
  </div>
</div>
<div class="shop-empty container" id="shopEmpty">
  <h3 style="font-family:'Outfit',sans-serif;font-weight:800;color:var(--navy);margin-bottom:8px;">No products match.</h3>
  <p>Try a different search term or category.</p>
</div>
"""

MODAL_HTML = """
<!-- PRODUCT MODAL -->
<div class="aq-modal" id="aqModal" role="dialog" aria-modal="true" aria-labelledby="aqModalTitle">
  <div class="aq-modal-panel" role="document">
    <button class="aq-modal-close" type="button" aria-label="Close">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
    <div class="aq-modal-gallery">
      <div class="aq-modal-bigimg"><img id="aqModalBigImg" src="" alt=""></div>
      <div class="aq-modal-thumbs" id="aqModalThumbs"></div>
    </div>
    <div class="aq-modal-info">
      <div class="aq-modal-info-head">
        <h2 class="aq-modal-title" id="aqModalTitle"></h2>
        <div class="aq-modal-price" id="aqModalPrice"></div>
        <div class="aq-modal-partner">Splash About via Aquanauts</div>
        <div class="aq-modal-size" id="aqModalSize" hidden>
          <label class="aq-modal-size-label" for="aqModalSizeSelect">Size</label>
          <select id="aqModalSizeSelect"></select>
        </div>
      </div>
      <div class="aq-modal-info-body">
        <div class="aq-modal-desc" id="aqModalDesc"></div>
      </div>
      <div class="aq-modal-info-actions">
        <a href="#" class="aq-modal-cta" id="aqModalCta">
          Email Tristan about this
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        </a>
        <div class="aq-modal-foot">We don't sell online. Tristan will reply quickly and order on your behalf for your next session.</div>
      </div>
    </div>
  </div>
</div>
__JSON_BLOB__
<script>
(function(){
  const raw = document.getElementById('aqProductData').textContent;
  const products = JSON.parse(raw);
  const norm = s => (s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const byKey = {};
  products.forEach(p => { byKey[norm(p.name)] = p; });

  // Map cat-section title text -> filter slug.
  const categoryMap = {
    'caps & hats': 'caps-hats',
    'caps and hats': 'caps-hats',
    'swim rings': 'swim-rings',
    'beach & water toys': 'beach-toys',
    'beach and water toys': 'beach-toys',
    'swimming headbands': 'headbands',
    'happy nappy': 'happy-nappy',
  };

  function findCategory(card) {
    const section = card.closest('.cat-section');
    const titleEl = section?.querySelector('.cat-title');
    const title = (titleEl?.textContent || '').toLowerCase().replace(/[^a-z& ]/g, '').trim();
    for (const key in categoryMap) {
      if (title.includes(key)) return categoryMap[key];
    }
    return 'other';
  }

  const modal = document.getElementById('aqModal');
  const bigImg = document.getElementById('aqModalBigImg');
  const thumbsEl = document.getElementById('aqModalThumbs');
  const titleEl = document.getElementById('aqModalTitle');
  const priceEl = document.getElementById('aqModalPrice');
  const sizeWrap = document.getElementById('aqModalSize');
  const sizeSel = document.getElementById('aqModalSizeSelect');
  const descEl = document.getElementById('aqModalDesc');
  const closeBtn = modal.querySelector('.aq-modal-close');

  function buildProductMailto(p) {
    const name = ((p && (p.title || p.name)) || '').trim();
    const subject = 'Interested in ' + name;
    const body = "Hi Tristan,\\n\\nI'm interested in the " + name + ' from your shop. Could you let me know about availability and how to order?\\n\\nThanks!';
    return 'mailto:tristan@aquanautsacademy.ca?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  function lookup(name, tag) {
    let key = norm(name);
    if (byKey[key]) return byKey[key];
    key = norm(tag + ' ' + name);
    if (byKey[key]) return byKey[key];
    key = norm(name + ' ' + tag);
    if (byKey[key]) return byKey[key];
    const candidate = norm(name).replace(/·/g, '');
    let best = null, bestLen = 0;
    for (const k of Object.keys(byKey)) {
      if (candidate && (candidate.includes(k) || k.includes(candidate))) {
        if (k.length > bestLen) { best = byKey[k]; bestLen = k.length; }
      }
    }
    return best;
  }

  function setBig(url, gallery) {
    bigImg.src = url;
    thumbsEl.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.src === url));
  }

  function openModal(p, initialIdx) {
    if (!p) return;
    initialIdx = Math.max(0, Math.min(initialIdx || 0, (p.gallery || []).length - 1));
    titleEl.textContent = p.title || p.name;
    priceEl.textContent = p.price || '';
    descEl.textContent = (p.description || '').trim();
    sizeSel.innerHTML = '';
    if (p.sizes && p.sizes.length) {
      sizeWrap.style.display = 'flex';
      sizeWrap.hidden = false;
      sizeSel.innerHTML = p.sizes.map(s => `<option>${s}</option>`).join('');
    } else {
      sizeWrap.style.display = 'none';
      sizeWrap.hidden = true;
    }
    const gallery = (p.gallery && p.gallery.length) ? p.gallery : (p.main ? [p.main] : []);
    bigImg.alt = p.title || p.name || '';
    thumbsEl.innerHTML = '';
    gallery.forEach((url, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.src = url;
      b.className = i === initialIdx ? 'active' : '';
      b.innerHTML = `<img src="${url}" alt="" loading="lazy">`;
      b.addEventListener('click', () => setBig(url, gallery));
      thumbsEl.appendChild(b);
    });
    bigImg.src = gallery[initialIdx] || '';
    const ctaLink = document.getElementById('aqModalCta');
    if (ctaLink) ctaLink.href = buildProductMailto(p);
    modal.classList.add('open');
    document.body.classList.add('modal-locked');
    closeBtn.focus();
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.classList.remove('modal-locked');
    bigImg.src = '';
    thumbsEl.innerHTML = '';
  }

  // Per-card decoration: category attr + mini-thumb strip + click handlers.
  document.querySelectorAll('.product-card').forEach(card => {
    const name = (card.querySelector('.product-name')?.textContent || '').trim();
    const tag = (card.querySelector('.product-tag')?.textContent || '').trim();
    const p = lookup(name, tag);
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.dataset.category = findCategory(card);
    // Mini thumbnails: gallery[1..3] (skip the main thumbnail which is gallery[0])
    if (p && p.gallery && p.gallery.length > 1) {
      const mini = document.createElement('div');
      mini.className = 'product-minithumbs';
      const extras = p.gallery.slice(1, 4);
      extras.forEach((url, i) => {
        const idx = i + 1;
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', `View image ${idx + 1} of ${p.title || p.name}`);
        b.dataset.imgIdx = String(idx);
        b.innerHTML = `<img src="${url}" alt="" loading="lazy">`;
        b.addEventListener('click', e => {
          e.stopPropagation();
          openModal(p, idx);
        });
        mini.appendChild(b);
      });
      card.appendChild(mini);
    }
    if (p) {
      const ask = document.createElement('a');
      ask.className = 'product-ask-link';
      ask.href = buildProductMailto(p);
      ask.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><span>Ask about this</span>';
      ask.addEventListener('click', e => e.stopPropagation());
      card.appendChild(ask);
    }
    card.addEventListener('click', () => openModal(p, 0));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(p, 0); }
    });
  });

  // Filter / search.
  const searchInput = document.getElementById('shopSearch');
  const pills = document.querySelectorAll('.shop-filter-pills .filter-pill');
  const emptyState = document.getElementById('shopEmpty');
  let activeFilter = 'all';
  function applyFilter() {
    const q = norm(searchInput.value);
    let totalVisible = 0;
    document.querySelectorAll('.product-card').forEach(card => {
      const matchCat = activeFilter === 'all' || card.dataset.category === activeFilter;
      const txt = norm(card.textContent);
      const matchQ = !q || txt.includes(q);
      const visible = matchCat && matchQ;
      card.classList.toggle('hidden', !visible);
      if (visible) totalVisible += 1;
    });
    document.querySelectorAll('.cat-section').forEach(s => {
      const anyVisible = Array.from(s.querySelectorAll('.product-card')).some(c => !c.classList.contains('hidden'));
      s.classList.toggle('hidden', !anyVisible);
    });
    emptyState.classList.toggle('show', totalVisible === 0);
  }
  searchInput.addEventListener('input', applyFilter);
  pills.forEach(p => p.addEventListener('click', () => {
    pills.forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    activeFilter = p.dataset.shopFilter;
    applyFilter();
  }));

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
})();
</script>
"""

# Embed data as JSON inside a non-executing <script> tag. Escape </script> in the JSON.
json_blob = json.dumps(products, ensure_ascii=False)
json_blob_safe = json_blob.replace("</", "<\\/")
data_tag = f'<script type="application/json" id="aqProductData">{json_blob_safe}</script>'

# IMPORTANT: re.sub interprets backslash sequences (\n, \1, \\) in the replacement
# *string*. Our replacement chunks contain a JSON blob with literal "\\n" escapes
# that must survive verbatim, so we always pass a lambda that returns the literal
# replacement.

# 1) Replace existing injected CSS block (or append fresh).
if "/* PRODUCT MODAL */" in html:
    html = re.sub(
        r"\n/\* PRODUCT MODAL \*/.*?</style>",
        lambda _m: CSS_ADDITIONS + "\n</style>",
        html,
        count=1,
        flags=re.DOTALL,
    )
else:
    html = html.replace("</style>", CSS_ADDITIONS + "\n</style>", 1)

# 2) Insert (or replace) filter bar at the top of the catalog section.
if "<!-- SHOP FILTER BAR -->" in html:
    html = re.sub(
        r"<!-- SHOP FILTER BAR -->.*?<div class=\"shop-empty container\" id=\"shopEmpty\">.*?</div>\s*",
        lambda _m: FILTER_BAR_HTML.strip() + "\n",
        html,
        count=1,
        flags=re.DOTALL,
    )
else:
    html = re.sub(
        r'(<section class="catalog"[^>]*>\s*)',
        lambda m: m.group(1) + FILTER_BAR_HTML.strip() + "\n",
        html,
        count=1,
    )

# 3) Replace existing modal block or insert fresh.
modal_block = MODAL_HTML.replace("__JSON_BLOB__", data_tag)
if 'id="aqModal"' in html:
    html = re.sub(
        r"<!-- PRODUCT MODAL -->.*?</script>\s*\n(?=</body>)",
        lambda _m: modal_block.strip() + "\n",
        html,
        count=1,
        flags=re.DOTALL,
    )
else:
    html = html.replace("</body>", modal_block + "\n</body>", 1)

SHOP.write_text(html, encoding="utf-8")
print("Patched", SHOP)
print("  CSS additions:", len(CSS_ADDITIONS), "chars")
print("  Filter bar HTML:", len(FILTER_BAR_HTML), "chars")
print("  Modal markup + JS + data:", len(modal_block), "chars")
print("  Products embedded:", len(products))
