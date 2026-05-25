"""Final PUT pass: rename + repopulate options for the two existing fields."""
import json, urllib.request, urllib.error, ssl, os, time

LOC = 'xBWIIj9IjYQL2XdtjJ1A'
SETUP_PATH = r'F:\GitHub\Websites\Tristan_AquanautsAcademy\.ghl_form_setup.json'
TOKEN = os.environ['GHL_TOKEN_TRISTAN']

INTENT_ID = '6JTnsxZJBRqmgcDKDNnc'
LOCATION_ID = 'uv5pZioA9EuxVABXNpxy'
AGE_ID = 'DZFtnzJksaTkgxGUJuNs'

INTENT_OPTIONS = [
    'Private swim lessons for my child',
    'Private swim lessons for my child with autism, ADHD, or sensory needs',
    'Swim lessons for me (adult)',
    'Mobile lessons at my private pool',
    'Lifeguard for a private event or facility',
    'Aquayoga (gentle in-water yoga)',
    'Pool host (rent my pool to Aquanauts)',
    'Partnership for our school or organization',
    'Sponsorship for a swimmer or family',
    'Just exploring, talk to me first',
]
LOCATION_OPTIONS = [
    'Nanaimo (Central)',
    'Nanoose Bay (Pacific Shores Resort)',
    'Parksville (Oceanside Manor)',
    'Victoria (near Hillside Mall)',
    'Shawnigan Lake (summer mobile)',
    'Campbell River, Ramada by Wyndham',
    'Campbell River, Naturally Pacific Resort',
    'Port Alberni (seasonal)',
    'Mobile / in-home pool',
    'Not sure yet, recommend one',
]

def api(method, path, body=None):
    url = f'https://services.leadconnectorhq.com{path}'
    data = json.dumps(body).encode() if body else None
    h = {'Authorization': f'Bearer {TOKEN}', 'Version': '2021-07-28', 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0'}
    if body: h['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        r = urllib.request.urlopen(req, timeout=30, context=ssl.create_default_context())
        return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try: err = json.loads(e.read().decode())
        except Exception: err = {'raw': e.read().decode()[:600]}
        return e.code, err

# Try PUT shape 1: name + placeholder + position + options (string array)
def put_field(field_id, name, placeholder, position, options):
    body = {
        'name': name,
        'placeholder': placeholder,
        'position': position,
        'options': options,
        'model': 'contact',
    }
    code, data = api('PUT', f'/locations/{LOC}/customFields/{field_id}', body)
    return code, data

print("PUT intent...")
code, data = put_field(INTENT_ID, 'Lead Form Intent', 'What are you looking for?', 0, INTENT_OPTIONS)
print(f"  HTTP {code}: {json.dumps(data)[:400]}")

print("PUT location...")
code, data = put_field(LOCATION_ID, 'Lead Form Location', 'Closest location', 1, LOCATION_OPTIONS)
print(f"  HTTP {code}: {json.dumps(data)[:400]}")

# Verify
print("\nVerify final state:")
final = {}
for fid, key in [(INTENT_ID, 'intent'), (LOCATION_ID, 'location'), (AGE_ID, 'age')]:
    code, data = api('GET', f'/locations/{LOC}/customFields/{fid}')
    if code == 200:
        cf = data.get('customField', {})
        opts = cf.get('picklistOptions', cf.get('options', []))
        print(f"  [{key}] {cf.get('name')!r}  id={cf.get('id')}  key={cf.get('fieldKey')}  options={len(opts)}")
        final[key] = {
            'id': cf.get('id'),
            'name': cf.get('name'),
            'fieldKey': cf.get('fieldKey'),
            'placeholder': cf.get('placeholder'),
            'options_count': len(opts),
            'options': opts,
        }
    else:
        print(f"  [{key}] GET failed: HTTP {code}: {json.dumps(data)[:300]}")

# Persist
prev = {}
try: prev = json.load(open(SETUP_PATH))
except Exception: pass
prev['final'] = final
prev['final_at'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
json.dump(prev, open(SETUP_PATH, 'w'), indent=2)
print(f"\nWrote final state to {SETUP_PATH}")
