"""
Aquanauts: download every static.wixstatic.com image referenced in
funnel/home.html + funnel/home-b.html, upload each to Tristan's GHL
media library (locationId xBWIIj9IjYQL2XdtjJ1A), and emit:
  - uploads/<filename> (binaries, gitignored)
  - image_url_map.json   { <full_wix_url>: <full_ghl_cdn_url> }
  - image_inventory.md   human-readable summary

Cloudflare blocks Python's default UA; we always send a real browser UA.
Wix may 403 hotlinked downloads, so we set Referer: https://aquanautsacademy.ca/.
GHL token is read from $GHL_TOKEN (preferred) or Tristan_AquanautsAcademy/.ghl_creds.json.
"""
import json, os, re, ssl, sys, time, mimetypes, uuid, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(r'c:\Users\emili\OneDrive\Documents\GitHub\Websites\Tristan_AquanautsAcademy')
FUNNEL_DIR = ROOT / 'funnel'
UPLOADS_DIR = ROOT / 'uploads'
CREDS_PATH = ROOT / '.ghl_creds.json'
MAP_PATH = ROOT / 'image_url_map.json'
INV_PATH = ROOT / 'image_inventory.md'

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

LOC = 'xBWIIj9IjYQL2XdtjJ1A'
TOKEN = os.environ.get('GHL_TOKEN', '').strip()
if not TOKEN:
    try:
        TOKEN = json.loads(CREDS_PATH.read_text()).get('acces_token', '').strip()
    except Exception:
        TOKEN = ''
if not TOKEN or TOKEN == 'PLACEHOLDER_INJECT_FROM_ENV':
    print('FATAL: no GHL token. Set $env:GHL_TOKEN before running.', file=sys.stderr)
    sys.exit(1)
print(f'Token len: {len(TOKEN)}')

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
GHL_HEADERS = {
    'Authorization': f'Bearer {TOKEN}',
    'Version': '2021-07-28',
    'Accept': 'application/json',
    'User-Agent': UA,
}

WIX_RE = re.compile(r'https://static\.wixstatic\.com/[^\s"\'<>)]+')

ctx = ssl.create_default_context()

def collect_wix_urls():
    urls = set()
    for fn in ('home.html', 'home-b.html'):
        text = (FUNNEL_DIR / fn).read_text(encoding='utf-8')
        for m in WIX_RE.findall(text):
            urls.add(m)
    return sorted(urls)

def wix_filename(url):
    # https://static.wixstatic.com/media/07f34f_xxxx~mv2.jpg  -> 07f34f_xxxx~mv2.jpg
    tail = url.rsplit('/', 1)[-1]
    # Some Wix URLs append /v1/fill/... — but we matched up to first whitespace/quote;
    # strip any trailing path segments just in case.
    tail = tail.split('?')[0]
    return tail

def safe_local_name(wix_name):
    # Local filename is the Wix tail; "~" is fine on NTFS.
    return wix_name

def download_wix(url, dest_path):
    req = urllib.request.Request(url, headers={
        'User-Agent': UA,
        'Referer': 'https://aquanautsacademy.ca/',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    })
    with urllib.request.urlopen(req, timeout=60, context=ctx) as r:
        ct = r.headers.get('Content-Type', 'application/octet-stream').split(';')[0].strip()
        data = r.read()
    dest_path.write_bytes(data)
    return ct, len(data)

def multipart_body(boundary, fields, file_field, filename, content_type, file_bytes):
    lines = []
    for k, v in fields.items():
        lines.append(f'--{boundary}'.encode())
        lines.append(f'Content-Disposition: form-data; name="{k}"'.encode())
        lines.append(b'')
        lines.append(str(v).encode())
    lines.append(f'--{boundary}'.encode())
    lines.append(f'Content-Disposition: form-data; name="{file_field}"; filename="{filename}"'.encode())
    lines.append(f'Content-Type: {content_type}'.encode())
    lines.append(b'')
    lines.append(file_bytes)
    lines.append(f'--{boundary}--'.encode())
    lines.append(b'')
    return b'\r\n'.join(lines)

def upload_to_ghl(local_path, content_type):
    boundary = '----aquanauts-' + uuid.uuid4().hex
    body = multipart_body(
        boundary,
        fields={'hosted': 'false', 'name': local_path.name, 'locationId': LOC},
        file_field='file',
        filename=local_path.name,
        content_type=content_type,
        file_bytes=local_path.read_bytes(),
    )
    h = dict(GHL_HEADERS)
    h['Content-Type'] = f'multipart/form-data; boundary={boundary}'
    h['Content-Length'] = str(len(body))
    req = urllib.request.Request(
        'https://services.leadconnectorhq.com/medias/upload-file',
        data=body, method='POST', headers=h,
    )
    try:
        with urllib.request.urlopen(req, timeout=120, context=ctx) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            err_body = e.read().decode()
            try:
                err = json.loads(err_body)
            except Exception:
                err = {'raw': err_body[:600]}
        except Exception:
            err = {'raw': '(no body)'}
        return e.code, err

def main():
    urls = collect_wix_urls()
    print(f'Distinct Wix URLs: {len(urls)}')

    mapping = {}
    if MAP_PATH.exists():
        try:
            mapping = json.loads(MAP_PATH.read_text())
            print(f'Resuming from existing map ({len(mapping)} entries already uploaded)')
        except Exception:
            mapping = {}

    rows = []  # (wix_url, local_name, ct, size, ghl_url, status)
    for i, url in enumerate(urls, 1):
        local_name = safe_local_name(wix_filename(url))
        local_path = UPLOADS_DIR / local_name
        print(f'\n[{i}/{len(urls)}] {url}')

        if url in mapping and mapping[url]:
            print(f'  cached -> {mapping[url]}')
            rows.append((url, local_name, 'cached', local_path.stat().st_size if local_path.exists() else 0, mapping[url], 'cached'))
            continue

        # Download (skip if local already present and non-empty)
        try:
            if local_path.exists() and local_path.stat().st_size > 0:
                ct = mimetypes.guess_type(local_name)[0] or 'image/jpeg'
                size = local_path.stat().st_size
                print(f'  local exists, ct={ct}, size={size}')
            else:
                ct, size = download_wix(url, local_path)
                print(f'  downloaded ct={ct}, size={size}')
        except urllib.error.HTTPError as e:
            print(f'  DOWNLOAD HTTP {e.code}: {e.reason}')
            rows.append((url, local_name, '', 0, '', f'download_http_{e.code}'))
            continue
        except Exception as e:
            print(f'  DOWNLOAD ERR: {e}')
            rows.append((url, local_name, '', 0, '', f'download_err_{e}'))
            continue

        if 'image' not in ct:
            # GHL is picky; force a sensible content-type from filename
            ct = mimetypes.guess_type(local_name)[0] or 'image/jpeg'

        # Upload
        code, data = upload_to_ghl(local_path, ct)
        if code in (200, 201):
            file_obj = data.get('fileUrl') and data or data.get('file', data)
            ghl_url = data.get('fileUrl') or data.get('url') or (data.get('file', {}) or {}).get('url')
            if not ghl_url:
                # Some responses nest under data.file.url or data.data.fileUrl
                d = data.get('data') if isinstance(data.get('data'), dict) else {}
                ghl_url = d.get('fileUrl') or d.get('url') or ghl_url
            print(f'  upload HTTP {code}: {ghl_url or json.dumps(data)[:300]}')
            if ghl_url:
                mapping[url] = ghl_url
                rows.append((url, local_name, ct, size, ghl_url, 'uploaded'))
                # Persist the map after every successful upload (so a crash doesn't lose progress)
                MAP_PATH.write_text(json.dumps(mapping, indent=2, sort_keys=True))
            else:
                rows.append((url, local_name, ct, size, '', f'upload_no_url:{json.dumps(data)[:200]}'))
        else:
            print(f'  upload HTTP {code}: {json.dumps(data)[:400]}')
            rows.append((url, local_name, ct, size, '', f'upload_http_{code}'))

        time.sleep(0.25)

    # Final write of map
    MAP_PATH.write_text(json.dumps(mapping, indent=2, sort_keys=True))
    print(f'\nWrote {MAP_PATH} with {len(mapping)} mappings.')

    # Inventory
    lines = []
    lines.append('# Aquanauts image inventory')
    lines.append('')
    lines.append(f'_Generated {time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}_')
    lines.append('')
    lines.append(f'- Distinct Wix images referenced across `funnel/home.html` + `funnel/home-b.html`: **{len(urls)}**')
    lines.append(f'- Uploaded to GHL media library (locationId `{LOC}`): **{sum(1 for r in rows if r[5] in ("uploaded","cached"))}**')
    lines.append(f'- Failures: **{sum(1 for r in rows if r[5] not in ("uploaded","cached"))}**')
    lines.append('')
    lines.append('| # | Wix URL | Local | Type | Size (KB) | GHL URL | Status |')
    lines.append('|---|---------|-------|------|-----------|---------|--------|')
    for i, (u, ln, ct, sz, gu, st) in enumerate(rows, 1):
        kb = f'{sz/1024:.1f}' if sz else ''
        lines.append(f'| {i} | `{u}` | `{ln}` | {ct} | {kb} | {gu or "(none)"} | {st} |')
    INV_PATH.write_text('\n'.join(lines))
    print(f'Wrote {INV_PATH}')

if __name__ == '__main__':
    main()