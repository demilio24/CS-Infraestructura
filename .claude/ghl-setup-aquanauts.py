"""
Aquanauts GHL setup: refresh local creds + check/create custom fields.
Reads the access token from the user-provided env var GHL_TOKEN (set just before running),
falls back to the local .ghl_creds.json acces_token field if env not set.
"""
import json, urllib.request, urllib.error, ssl, sys, os, time

CREDS_PATH = r'F:\GitHub\Websites\Tristan_AquanautsAcademy\.ghl_creds.json'
SETUP_PATH = r'F:\GitHub\Websites\Tristan_AquanautsAcademy\.ghl_form_setup.json'

creds = json.load(open(CREDS_PATH))
TOKEN = os.environ.get('GHL_TOKEN') or creds.get('acces_token', '')
if not TOKEN:
    print("FATAL: no token. Set GHL_TOKEN env var or populate .ghl_creds.json[acces_token].")
    sys.exit(1)

LOC = creds['locationId']
print(f"locationId: {LOC}")
print(f"Token length: {len(TOKEN)}")

# Persist the token back to the creds file if it came from env
if os.environ.get('GHL_TOKEN'):
    creds['acces_token'] = TOKEN
    json.dump(creds, open(CREDS_PATH, 'w'), indent=2)
    print("Creds file refreshed with env token.")

HEADERS = {
    'Authorization': f'Bearer {TOKEN}',
    'Version': '2021-07-28',
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
}

def api(method, path, body=None):
    url = f'https://services.leadconnectorhq.com{path}'
    data = json.dumps(body).encode() if body else None
    h = dict(HEADERS)
    if body: h['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        r = urllib.request.urlopen(req, timeout=30, context=ssl.create_default_context())
        return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            err = json.loads(e.read().decode())
        except Exception:
            err = {'raw': e.read().decode()[:400]}
        return e.code, err

# 1) Verify token works
code, data = api('GET', f'/locations/{LOC}')
print(f"\nGET /locations/{LOC}: HTTP {code}")
if code != 200:
    print(f"  Error: {json.dumps(data)[:400]}")
    sys.exit(1)
print(f"  Account: {data.get('location', {}).get('name', '(no name)')}")

# 2) List existing custom fields
code, data = api('GET', f'/locations/{LOC}/customFields')
print(f"\nGET customFields: HTTP {code}")
if code != 200:
    print(f"  Error: {json.dumps(data)[:400]}")
    sys.exit(1)
fields = data.get('customFields', data.get('customField', []))
print(f"  Existing custom fields: {len(fields)}")

existing_program = None
existing_location = None
for f in fields:
    n = (f.get('name','') or '').lower()
    k = (f.get('fieldKey','') or '').lower()
    if 'program' in n or 'program' in k:
        existing_program = f
        print(f"  PROGRAM match: name={f.get('name')!r} key={f.get('fieldKey')!r} id={f.get('id')!r}")
    if 'location' in n or 'location' in k or 'closest' in n or 'closest' in k:
        existing_location = f
        print(f"  LOCATION match: name={f.get('name')!r} key={f.get('fieldKey')!r} id={f.get('id')!r}")

# 3) Define fields to create
PROGRAM_FIELD = {
    'name': 'Program of interest',
    'dataType': 'SINGLE_OPTIONS',
    'placeholder': 'Select a program',
    'position': 0,
    'options': [
        'Private 1:1 lessons',
        'Family or semi-private',
        'Mobile lessons (we come to you)',
        'Adaptive aquatics',
        'Adult lessons',
        'Lifeguarding services',
        'Not sure yet',
    ],
    'model': 'contact',
}
LOCATION_FIELD = {
    'name': 'Closest location',
    'dataType': 'SINGLE_OPTIONS',
    'placeholder': 'Pick your area',
    'position': 1,
    'options': [
        'Nanaimo',
        'Nanoose Bay',
        'Parksville',
        'Victoria',
        'Campbell River',
        'Shawnigan Lake',
        'Port Alberni',
        'Mobile to my pool',
    ],
    'model': 'contact',
}

summary = {
    'program_interest': {},
    'location': {},
    'folder': {'name': 'Aquanauts Funnel', 'id': None, 'status': 'not-attempted', 'notes': ''},
    'verified_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
}

# 4) Create program_interest if missing
if existing_program:
    summary['program_interest'] = {
        'id': existing_program.get('id'),
        'internal_name': existing_program.get('fieldKey'),
        'options_count': len(existing_program.get('picklistOptions', existing_program.get('options', []))),
        'status': 'existed',
        'notes': 'Already present, not recreated.',
    }
else:
    print("\nCreating PROGRAM field...")
    code, data = api('POST', f'/locations/{LOC}/customFields', PROGRAM_FIELD)
    print(f"  POST customFields (program): HTTP {code}")
    if code in (200, 201):
        cf = data.get('customField', data)
        summary['program_interest'] = {
            'id': cf.get('id'),
            'internal_name': cf.get('fieldKey'),
            'options_count': len(PROGRAM_FIELD['options']),
            'status': 'created',
            'notes': 'OK',
        }
        print(f"  Created id={cf.get('id')} key={cf.get('fieldKey')}")
    else:
        summary['program_interest'] = {
            'id': None, 'status': 'failed', 'notes': f"HTTP {code}: {json.dumps(data)[:300]}",
        }
        print(f"  FAILED: {json.dumps(data)[:300]}")

# 5) Create location if missing
if existing_location:
    summary['location'] = {
        'id': existing_location.get('id'),
        'internal_name': existing_location.get('fieldKey'),
        'options_count': len(existing_location.get('picklistOptions', existing_location.get('options', []))),
        'status': 'existed',
        'notes': 'Already present, not recreated.',
    }
else:
    print("\nCreating LOCATION field...")
    code, data = api('POST', f'/locations/{LOC}/customFields', LOCATION_FIELD)
    print(f"  POST customFields (location): HTTP {code}")
    if code in (200, 201):
        cf = data.get('customField', data)
        summary['location'] = {
            'id': cf.get('id'),
            'internal_name': cf.get('fieldKey'),
            'options_count': len(LOCATION_FIELD['options']),
            'status': 'created',
            'notes': 'OK',
        }
        print(f"  Created id={cf.get('id')} key={cf.get('fieldKey')}")
    else:
        summary['location'] = {
            'id': None, 'status': 'failed', 'notes': f"HTTP {code}: {json.dumps(data)[:300]}",
        }
        print(f"  FAILED: {json.dumps(data)[:300]}")

# 6) Form folder - try to find or create
print("\nChecking form folders...")
code, data = api('GET', f'/locations/{LOC}/forms')
if code == 200:
    forms = data.get('forms', [])
    print(f"  Forms count: {len(forms)}")
    summary['folder']['status'] = 'api-unavailable'
    summary['folder']['notes'] = 'GHL v2 public API exposes form listing but not folder creation. Create the "Aquanauts Funnel" folder manually in the GHL UI (Sites > Forms > Folder icon).'
else:
    summary['folder']['status'] = 'api-unavailable'
    summary['folder']['notes'] = f'Forms list returned HTTP {code}. Folder creation must be done manually in the GHL UI.'
print(f"  Folder status: {summary['folder']['status']}")

# 7) Save summary
json.dump(summary, open(SETUP_PATH, 'w'), indent=2)
print(f"\nWrote {SETUP_PATH}")
print("\n=== SUMMARY ===")
print(json.dumps(summary, indent=2))
