#!/usr/bin/env python3
"""Find Aston Floyd's parent/guardian contact."""
import json, os, sys, time
from urllib.request import Request, urlopen

if hasattr(sys.stdout, "reconfigure"):
    try: sys.stdout.reconfigure(encoding="utf-8")
    except Exception: pass

TOKEN = os.environ.get("GHL_PIT_SYSTEMA", "pit-ba33c398-1647-41c9-9024-98f203d6b30c")
LOC = "8IWtNFlmgJ8bif9DivHT"

NAME_FIELDS = [
    ("Student 1 Name", "NzRxGhIZJ0RZclSGprrF"),
    ("Student 2 Name", "yKxmNI57yrPozW0Zd3cA"),
    ("Student 3 Name", "eyNFkL0qAZug3mMnQBvk"),
    ("Student 4 Name", "nPhA81OMvPttlnwQtujH"),
    ("Summer Name (legacy)", "WitmrGYAPRw66ONJuRjQ"),
    ("Free Name (legacy)",   "rwAlfmxIbkk5k7nmgahu"),
]
F_FREE_DATES   = "0H3m5fBvXwD3frq75XKa"
F_FREE_SCHOOL  = "mtDthaZW5nm0SWGlp7XU"
F_GUARDIAN_FN  = "CUJEHDn5mhOBqOCf6uhX"
F_GUARDIAN_LN  = "2G7pUw0Y9X7UkPM4tqe2"

HDR = {"Authorization": f"Bearer {TOKEN}", "Version": "2021-07-28",
       "Content-Type": "application/json", "Accept": "application/json",
       "User-Agent": "Mozilla/5.0 (compatible; SystemaFloyd-DashboardSnapshot/1.0)"}


def http_post(url, body):
    req = Request(url, data=json.dumps(body).encode(), headers=HDR, method="POST")
    with urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def cf(c, fid):
    for f in c.get("customFields") or []:
        if f.get("id") == fid:
            return f.get("value")
    return None


def main():
    after = None
    while True:
        body = {"locationId": LOC, "pageLimit": 100}
        if after: body["searchAfter"] = after
        d = http_post("https://services.leadconnectorhq.com/contacts/search", body)
        batch = d.get("contacts", [])
        if not batch: break
        for c in batch:
            for label, fid in NAME_FIELDS:
                name = (cf(c, fid) or "").strip().lower()
                if "aston" in name and "floyd" in name:
                    print(f"=== Match in {label}: '{cf(c, fid)}'")
                    print(f"  Contact ID:    {c.get('id')}")
                    print(f"  Contact name:  {c.get('firstName')} {c.get('lastName')}")
                    print(f"  Email:         {c.get('email')}")
                    print(f"  Phone:         {c.get('phone')}")
                    print(f"  Guardian:      {cf(c, F_GUARDIAN_FN)} {cf(c, F_GUARDIAN_LN)}")
                    print(f"  Free dates:    {cf(c, F_FREE_DATES)}")
                    print(f"  Free school:   {cf(c, F_FREE_SCHOOL)}")
                    print(f"  All student names on this contact:")
                    for lbl, fid2 in NAME_FIELDS:
                        v = cf(c, fid2)
                        if v: print(f"    - {lbl}: {v}")
                    print()
                    return
        after = batch[-1].get("searchAfter")
        if not after or len(batch) < 100: break
        time.sleep(0.1)
    print("No Aston Floyd found")


if __name__ == "__main__":
    main()
