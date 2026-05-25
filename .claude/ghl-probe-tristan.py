"""Probe an existing GHL custom field to learn the exact option schema, then try creating the age field two ways."""
import json, urllib.request, urllib.error, ssl, os

LOC = 'xBWIIj9IjYQL2XdtjJ1A'
TOKEN = os.environ['GHL_TOKEN_TRISTAN']
INTENT_ID = '6JTnsxZJBRqmgcDKDNnc'

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

# Get one field by id to see the exact schema
print("--- GET single field ---")
code, data = api('GET', f'/locations/{LOC}/customFields/{INTENT_ID}')
print(f"HTTP {code}")
print(json.dumps(data, indent=2)[:3000])

# Try POST age with options as ARRAY OF STRINGS
print("\n--- POST age, options as strings ---")
body = {
    'name': 'Lead Form Swimmer Age',
    'dataType': 'SINGLE_OPTIONS',
    'placeholder': 'Swimmer age',
    'position': 2,
    'options': [
        '6 to 18 months (Infant Survival)',
        '2 to 4 years',
        '5 to 12 years',
        '13 to 18 years',
        'Adult (18+)',
        'Adult 55+',
        'Adaptive (any age)',
    ],
    'model': 'contact',
}
code, data = api('POST', f'/locations/{LOC}/customFields', body)
print(f"HTTP {code}: {json.dumps(data)[:600]}")
