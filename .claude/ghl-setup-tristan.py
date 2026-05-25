"""
Tristan Tolley (Aquanauts Swim Academy) GHL setup:
 - persist fresh token into Tristan_AquanautsAcademy/.ghl_creds.json
 - create/verify 3 custom contact fields matching lead_form_routing.md:
     * Lead Form Intent (10 single-select options)
     * Lead Form Location (9 single-select options)
     * Lead Form Swimmer Age (7 single-select options, optional)
 - list Blake Friis workflows so we can reference his lead-notification workflow

Reads tokens from env vars (GHL_TOKEN_TRISTAN, GHL_TOKEN_BLAKE).
No labels contain em-dashes (project rule).
"""
import json, urllib.request, urllib.error, ssl, sys, os, time

TRISTAN_LOC = 'xBWIIj9IjYQL2XdtjJ1A'
BLAKE_LOC = 'QAATOsdHXqvMWz9TvKmV'
CREDS_PATH = r'F:\GitHub\Websites\Tristan_AquanautsAcademy\.ghl_creds.json'
SETUP_PATH = r'F:\GitHub\Websites\Tristan_AquanautsAcademy\.ghl_form_setup.json'
BLAKE_WF_PATH = r'F:\GitHub\Websites\.claude\blake-workflows.json'

TRISTAN_TOKEN = os.environ.get('GHL_TOKEN_TRISTAN', '')
BLAKE_TOKEN = os.environ.get('GHL_TOKEN_BLAKE', '')
if not TRISTAN_TOKEN:
    print("FATAL: GHL_TOKEN_TRISTAN env var not set.")
    sys.exit(1)

def api(token, method, path, body=None):
    url = f'https://services.leadconnectorhq.com{path}'
    data = json.dumps(body).encode() if body else None
    h = {
        'Authorization': f'Bearer {token}',
        'Version': '2021-07-28',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
    }
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

# 1) Refresh Tristan creds file with the new token
creds = json.load(open(CREDS_PATH))
creds['acces_token'] = TRISTAN_TOKEN
json.dump(creds, open(CREDS_PATH, 'w'), indent=2)
print(f"Tristan creds refreshed (locationId={creds.get('locationId')}, token_len={len(TRISTAN_TOKEN)})")

# 2) Sanity check token
code, data = api(TRISTAN_TOKEN, 'GET', f'/locations/{TRISTAN_LOC}')
print(f"GET /locations/{TRISTAN_LOC}: HTTP {code}")
if code != 200:
    print(f"  Error: {json.dumps(data)[:400]}")
    sys.exit(1)
print(f"  Account: {data.get('location', {}).get('name', '(no name)')}")

# 3) List existing custom fields
code, data = api(TRISTAN_TOKEN, 'GET', f'/locations/{TRISTAN_LOC}/customFields')
if code != 200:
    print(f"  Error listing customFields: {json.dumps(data)[:400]}")
    sys.exit(1)
existing = data.get('customFields', data.get('customField', []))
print(f"Existing custom fields: {len(existing)}")

def find_existing(name_substrings):
    for f in existing:
        nm = (f.get('name','') or '').lower()
        if any(s in nm for s in name_substrings):
            return f
    return None

# 4) Field definitions matching lead_form_routing.md
INTENT_FIELD = {
    'name': 'Lead Form Intent',
    'dataType': 'SINGLE_OPTIONS',
    'placeholder': 'What are you looking for?',
    'position': 0,
    'options': [
        {'label': 'Private swim lessons for my child', 'value': 'private_child'},
        {'label': 'Private swim lessons for my child with autism, ADHD, or sensory needs', 'value': 'adaptive'},
        {'label': 'Swim lessons for me (adult)', 'value': 'adult'},
        {'label': 'Mobile lessons at my private pool', 'value': 'mobile'},
        {'label': 'Lifeguard for a private event or facility', 'value': 'lifeguard'},
        {'label': 'Aquayoga (gentle in-water yoga)', 'value': 'aquayoga'},
        {'label': 'Pool host (rent my pool to Aquanauts)', 'value': 'pool_host'},
        {'label': 'Partnership for our school or organization', 'value': 'partnership'},
        {'label': 'Sponsorship for a swimmer or family', 'value': 'sponsorship'},
        {'label': 'Just exploring, talk to me first', 'value': 'exploring'},
    ],
    'model': 'contact',
}

LOCATION_FIELD = {
    'name': 'Lead Form Location',
    'dataType': 'SINGLE_OPTIONS',
    'placeholder': 'Closest location',
    'position': 1,
    'options': [
        {'label': 'Nanaimo (Central)', 'value': 'nanaimo'},
        {'label': 'Nanoose Bay (Pacific Shores Resort)', 'value': 'nanoose'},
        {'label': 'Parksville (Oceanside Manor)', 'value': 'parksville'},
        {'label': 'Victoria (near Hillside Mall)', 'value': 'victoria'},
        {'label': 'Shawnigan Lake (summer mobile)', 'value': 'shawnigan'},
        {'label': 'Campbell River, Ramada by Wyndham', 'value': 'campbell_ramada'},
        {'label': 'Campbell River, Naturally Pacific Resort', 'value': 'campbell_naturally_pacific'},
        {'label': 'Port Alberni (seasonal)', 'value': 'port_alberni'},
        {'label': 'Mobile / in-home pool', 'value': 'mobile_inhome'},
        {'label': 'Not sure yet, recommend one', 'value': 'unsure'},
    ],
    'model': 'contact',
}

AGE_FIELD = {
    'name': 'Lead Form Swimmer Age',
    'dataType': 'SINGLE_OPTIONS',
    'placeholder': 'Swimmer age',
    'position': 2,
    'options': [
        {'label': '6 to 18 months (Infant Survival)', 'value': 'infant'},
        {'label': '2 to 4 years', 'value': 'toddler'},
        {'label': '5 to 12 years', 'value': 'kid'},
        {'label': '13 to 18 years', 'value': 'teen'},
        {'label': 'Adult (18+)', 'value': 'adult'},
        {'label': 'Adult 55+', 'value': 'adult_55plus'},
        {'label': 'Adaptive (any age)', 'value': 'adaptive_any'},
    ],
    'model': 'contact',
}

DEFINITIONS = [
    ('intent',   INTENT_FIELD,   ['lead form intent', 'program of interest', 'intent']),
    ('location', LOCATION_FIELD, ['lead form location', 'closest location']),
    ('age',      AGE_FIELD,      ['lead form swimmer age', 'swimmer age']),
]

summary = {
    'fields': {},
    'blake_workflows': {'status': 'not-attempted', 'workflows': []},
    'folder': {'name': 'Aquanauts Funnel', 'status': 'manual', 'notes': 'GHL v2 API does not expose form folder creation. Create the folder in the UI: Sites > Forms > Folder icon.'},
    'verified_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
}

# 5) Create / verify each field
for key, body, match_subs in DEFINITIONS:
    found = find_existing(match_subs)
    if found:
        opts = found.get('picklistOptions', found.get('options', []))
        summary['fields'][key] = {
            'id': found.get('id'),
            'internal_name': found.get('fieldKey'),
            'name': found.get('name'),
            'options_count': len(opts),
            'expected_options_count': len(body['options']),
            'status': 'existed',
            'notes': 'Already present; not recreated. Check option list matches expected count.',
        }
        print(f"[{key}] existed: id={found.get('id')} key={found.get('fieldKey')} options={len(opts)} (expected {len(body['options'])})")
    else:
        print(f"[{key}] creating...")
        code, data = api(TRISTAN_TOKEN, 'POST', f'/locations/{TRISTAN_LOC}/customFields', body)
        if code in (200, 201):
            cf = data.get('customField', data)
            summary['fields'][key] = {
                'id': cf.get('id'),
                'internal_name': cf.get('fieldKey'),
                'name': cf.get('name'),
                'options_count': len(body['options']),
                'status': 'created',
                'notes': 'OK',
            }
            print(f"  created id={cf.get('id')} key={cf.get('fieldKey')}")
        else:
            summary['fields'][key] = {'id': None, 'status': 'failed', 'notes': f"HTTP {code}: {json.dumps(data)[:300]}"}
            print(f"  FAILED HTTP {code}: {json.dumps(data)[:300]}")

# 6) Blake workflows (read-only) for reference in Amina's brief
if BLAKE_TOKEN:
    code, data = api(BLAKE_TOKEN, 'GET', f'/workflows/?locationId={BLAKE_LOC}')
    summary['blake_workflows']['status'] = f'http {code}'
    if code == 200:
        wfs = data.get('workflows', []) or []
        slim = [{'id': w.get('id'), 'name': w.get('name'), 'status': w.get('status'), 'version': w.get('version')} for w in wfs]
        summary['blake_workflows']['workflows'] = slim
        json.dump(slim, open(BLAKE_WF_PATH, 'w'), indent=2)
        print(f"\nBlake workflows: {len(slim)} found, full list written to {BLAKE_WF_PATH}")
        for w in slim:
            nm = (w.get('name') or '').lower()
            if any(k in nm for k in ['lead', 'notif', 'internal', 'new contact', 'form sub']):
                print(f"  >> {w.get('name')!r}  id={w.get('id')}  status={w.get('status')}")
    else:
        print(f"Blake workflows error: HTTP {code}: {json.dumps(data)[:300]}")

# 7) Save summary
json.dump(summary, open(SETUP_PATH, 'w'), indent=2)
print(f"\nWrote {SETUP_PATH}")
print("\n=== SUMMARY (fields only) ===")
print(json.dumps(summary['fields'], indent=2))
