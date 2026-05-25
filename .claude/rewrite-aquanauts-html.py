"""
Load Tristan_AquanautsAcademy/image_url_map.json and rewrite every
Wix URL in funnel/home.html + funnel/home-b.html with its GHL CDN
equivalent. Idempotent.
"""
import json, re
from pathlib import Path

ROOT = Path(r'c:\Users\emili\OneDrive\Documents\GitHub\Websites\Tristan_AquanautsAcademy')
MAP_PATH = ROOT / 'image_url_map.json'
mapping = json.loads(MAP_PATH.read_text())
print(f'Loaded {len(mapping)} mappings')

# Replace longest URLs first so we never partial-replace a substring.
keys = sorted(mapping.keys(), key=len, reverse=True)

for fname in ('home.html', 'home-b.html'):
    fp = ROOT / 'funnel' / fname
    text = fp.read_text(encoding='utf-8')
    before = text.count('static.wixstatic.com')
    replaced = 0
    for k in keys:
        if k in text:
            n = text.count(k)
            text = text.replace(k, mapping[k])
            replaced += n
    after = text.count('static.wixstatic.com')
    fp.write_text(text, encoding='utf-8')
    print(f'{fname}: replaced {replaced} occurrences; wix refs {before} -> {after}')
