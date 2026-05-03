#!/usr/bin/env python3
"""One-off: list all custom fields in the Systema Floyd GHL location."""
import json, os, sys
from urllib.request import Request, urlopen
from urllib.error import HTTPError

TOKEN = os.environ.get("GHL_PIT_SYSTEMA", "pit-ba33c398-1647-41c9-9024-98f203d6b30c")
LOC = "8IWtNFlmgJ8bif9DivHT"

def http_get(url):
    req = Request(url, headers={
        "Authorization": f"Bearer {TOKEN}",
        "Version": "2021-07-28",
        "Accept": "application/json",
        "User-Agent": "SystemaFloyd-FieldDiscovery/1.0",
    })
    with urlopen(req, timeout=60) as r:
        return json.loads(r.read())

def main():
    url = f"https://services.leadconnectorhq.com/locations/{LOC}/customFields"
    try:
        data = http_get(url)
    except HTTPError as e:
        print(f"HTTP {e.code}: {e.read()[:500]}", file=sys.stderr)
        sys.exit(1)
    fields = data.get("customFields") or []
    print(f"Total custom fields: {len(fields)}\n")
    # Print every field — name, id, dataType, model
    for f in fields:
        name = f.get("name") or "(no name)"
        fid = f.get("id")
        dt = f.get("dataType")
        model = f.get("model")
        print(f"[{model}] {name}  ::  id={fid}  type={dt}")

if __name__ == "__main__":
    main()
