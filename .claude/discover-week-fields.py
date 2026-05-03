#!/usr/bin/env python3
"""Show the actual options for the Summer Camp and Free Camp week fields."""
import json, os, sys
from urllib.request import Request, urlopen

TOKEN = os.environ.get("GHL_PIT_SYSTEMA", "pit-ba33c398-1647-41c9-9024-98f203d6b30c")
LOC = "8IWtNFlmgJ8bif9DivHT"

# Fields of interest
F_SUMMER_DATES = "boH43tBf1W4BXcz1aRh4"  # Select Camp Dates (Summer Camp)
F_FREE_DATES   = "0H3m5fBvXwD3frq75XKa"  # Camp Week Choices (Free Camp)
F_FREE_REG     = "NdulijXuqRPG6FNdPJ5q"  # Free Camp Registration (Upper/Lower + weeks)

def http_get(url):
    req = Request(url, headers={
        "Authorization": f"Bearer {TOKEN}",
        "Version": "2021-07-28",
        "Accept": "application/json",
    })
    with urlopen(req, timeout=60) as r:
        return json.loads(r.read())

def main():
    url = f"https://services.leadconnectorhq.com/locations/{LOC}/customFields"
    data = http_get(url)
    fields = data.get("customFields") or []
    by_id = {f.get("id"): f for f in fields}

    for label, fid in [
        ("SUMMER (Select Camp Dates)", F_SUMMER_DATES),
        ("FREE (Camp Week Choices)",   F_FREE_DATES),
        ("FREE (Free Camp Registration)", F_FREE_REG),
    ]:
        f = by_id.get(fid)
        if not f:
            print(f"\n=== {label} — NOT FOUND")
            continue
        print(f"\n=== {label}  id={fid}  type={f.get('dataType')}")
        opts = f.get("picklistOptions") or f.get("options") or []
        if not opts:
            # Some GHL responses use different key names — dump the raw field
            print("  (no picklistOptions; full field dump:)")
            print(json.dumps(f, indent=2)[:1500])
            continue
        for o in opts:
            if isinstance(o, dict):
                print(f"  - {o.get('label') or o.get('name') or o}  (value={o.get('value')})")
            else:
                print(f"  - {o}")

if __name__ == "__main__":
    main()
