"""Fix-up pass for Tristan fields:
 - PUT updates Program of interest -> Lead Form Intent (10 options)
 - PUT updates Closest location  -> Lead Form Location (10 options, incl. 'Not sure yet')
 - POST creates Lead Form Swimmer Age via `picklistOptions` (the v2 API key the prior body got wrong)
"""
import json, urllib.request, urllib.error, ssl, os, sys, time

LOC = 'xBWIIj9IjYQL2XdtjJ1A'
SETUP_PATH = r'F:\GitHub\Websites\Tristan_AquanautsAcademy\.ghl_form_setup.json'
TOKEN = os.environ.get('GHL_TOKEN_TRISTAN', '')
if not TOKEN:
    print("FATAL: GHL_TOKEN_TRISTAN not set."); sys.exit(1)

INTENT_ID = '6JTnsxZJBRqmgcDKDNnc'
LOCATION_ID = 'uv5pZioA9EuxVABXNpxy'

INTENT_OPTIONS = [
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
]
LOCATION_OPTIONS = [
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
]
AGE_OPTIONS = [
    {'label': '6 to 18 months (Infant Survival)', 'value': 'infant'},
    {'label': '2 to 4 years', 'value': 'toddler'},
    {'label': '5 to 12 years', 'value': 'kid'},
    {'label': '13 to 18 years', 'value': 'teen'},
    {'label': 'Adult (18+)', 'value': 'adult'},
    {'label': 'Adult 55+', 'value': 'adult_55plus'},
    {'label': 'Adaptive (any age)', 'value': 'adaptive_any'},
]

def api(method, path, body=None):
    url = f'https://services.leadconnectorhq.com{path}'
    data = json.dumps(body).encode() if body else None
    h = {
        'Authorization': f'Bearer {TOKEN}',
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
            err = {'raw': e.read().decode()[:600]}
        return e.code, err

results = {}

# 1) Update intent
print("PUT intent...")
body = {
    'name': 'Lead Form Intent',
    'placeholder': 'What are you looking for?',
    'position': 0,
    'picklistOptions': [o['label'] for o in INTENT_OPTIONS],
    'model': 'contact',
}
code, data = api('PUT', f'/locations/{LOC}/customFields/{INTENT_ID}', body)
print(f"  PUT intent: HTTP {code}: {json.dumps(data)[:300]}")
results['intent_update'] = {'http': code, 'response': data}

# 2) Update location
print("PUT location...")
body = {
    'name': 'Lead Form Location',
    'placeholder': 'Closest location',
    'position': 1,
    'picklistOptions': [o['label'] for o in LOCATION_OPTIONS],
    'model': 'contact',
}
code, data = api('PUT', f'/locations/{LOC}/customFields/{LOCATION_ID}', body)
print(f"  PUT location: HTTP {code}: {json.dumps(data)[:300]}")
results['location_update'] = {'http': code, 'response': data}

# 3) Create age field with `picklistOptions` as flat array of labels (per GHL v2 quirk)
print("POST age...")
body = {
    'name': 'Lead Form Swimmer Age',
    'dataType': 'SINGLE_OPTIONS',
    'placeholder': 'Swimmer age',
    'position': 2,
    'picklistOptions': [o['label'] for o in AGE_OPTIONS],
    'model': 'contact',
}
code, data = api('POST', f'/locations/{LOC}/customFields', body)
print(f"  POST age: HTTP {code}: {json.dumps(data)[:300]}")
results['age_create'] = {'http': code, 'response': data}

# 4) Re-list to verify final state
print("\nGET customFields verify...")
code, data = api('GET', f'/locations/{LOC}/customFields')
if code == 200:
    fields = data.get('customFields', data.get('customField', []))
    for f in fields:
        nm = (f.get('name','') or '')
        if 'Lead Form' in nm or 'Program of interest' in nm or 'Closest location' in nm:
            opts = f.get('picklistOptions', f.get('options', []))
            print(f"  - {nm!r}  id={f.get('id')}  fieldKey={f.get('fieldKey')}  options={len(opts)}")
            results.setdefault('final', []).append({
                'id': f.get('id'),
                'name': nm,
                'fieldKey': f.get('fieldKey'),
                'options_count': len(opts),
            })

# 5) Persist
prev = {}
try: prev = json.load(open(SETUP_PATH))
except Exception: pass
prev['fix_pass'] = results
prev['fix_pass_at'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
json.dump(prev, open(SETUP_PATH, 'w'), indent=2)
print(f"\nWrote {SETUP_PATH}")
