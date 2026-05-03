#!/usr/bin/env python3
"""Find the 4 internal test contacts in GHL and show their current camp-
registration fields, so we can confirm before clearing them.
"""
import json, os, sys, time
from urllib.request import Request, urlopen

TOKEN = os.environ.get("GHL_PIT_SYSTEMA", "pit-ba33c398-1647-41c9-9024-98f203d6b30c")
LOC = "8IWtNFlmgJ8bif9DivHT"

TARGETS = {"emilio arias", "tom floyd", "juliana lima", "sean nasiff"}

# Camp-registration fields that drive student counts
F_SUMMER_DATES = "boH43tBf1W4BXcz1aRh4"
F_FREE_DATES   = "0H3m5fBvXwD3frq75XKa"
F_FREE_REG     = "NdulijXuqRPG6FNdPJ5q"
F_FREE_SCHOOL  = "mtDthaZW5nm0SWGlp7XU"
F_AS_CLASS     = "UluqGJoN855415yTyiXd"

# Per-student name fields (1-4 + legacy)
NAME_FIELDS = [
    ("Student 1 Name", "NzRxGhIZJ0RZclSGprrF"),
    ("Student 2 Name", "yKxmNI57yrPozW0Zd3cA"),
    ("Student 3 Name", "eyNFkL0qAZug3mMnQBvk"),
    ("Student 4 Name", "nPhA81OMvPttlnwQtujH"),
    ("Summer Name (legacy)", "WitmrGYAPRw66ONJuRjQ"),
    ("Free Name (legacy)",   "rwAlfmxIbkk5k7nmgahu"),
    ("AS Name (legacy)",     "mCopCd8PHPPGBdo30zYK"),
]


def http(method, url, body=None):
    data = json.dumps(body).encode() if body else None
    req = Request(url, data=data, headers={
        "Authorization": f"Bearer {TOKEN}",
        "Version": "2021-07-28",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; SystemaFloyd-DashboardSnapshot/1.0)",
    }, method=method)
    with urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def cf(c, fid):
    for f in c.get("customFields") or []:
        if f.get("id") == fid:
            return f.get("value")
    return None


def norm(s):
    return " ".join(str(s or "").strip().lower().split())


def main():
    matches = []
    after = None
    while True:
        body = {"locationId": LOC, "pageLimit": 100}
        if after: body["searchAfter"] = after
        d = http("POST", "https://services.leadconnectorhq.com/contacts/search", body)
        batch = d.get("contacts", [])
        if not batch: break
        for c in batch:
            full = norm(f"{c.get('firstName') or ''} {c.get('lastName') or ''}")
            name = norm(c.get("name"))
            student_names = [norm(cf(c, fid)) for _, fid in NAME_FIELDS]
            hit_via = None
            if full in TARGETS:    hit_via = f"contact name '{full}'"
            elif name in TARGETS:  hit_via = f"contact name field '{name}'"
            else:
                for (lbl, _), sn in zip(NAME_FIELDS, student_names):
                    if sn in TARGETS:
                        hit_via = f"{lbl}='{sn}'"
                        break
            if hit_via:
                matches.append((c, hit_via))
        after = batch[-1].get("searchAfter")
        if not after or len(batch) < 100: break
        time.sleep(0.1)

    print(f"Found {len(matches)} match(es)\n")
    for c, hit_via in matches:
        print(f"--- id={c.get('id')}  matched via {hit_via}")
        print(f"    name:       {c.get('firstName')!r} {c.get('lastName')!r}  (full='{c.get('name')}')")
        print(f"    email:      {c.get('email')}")
        print(f"    tags:       {c.get('tags')}")
        print(f"    Summer Dates:   {cf(c, F_SUMMER_DATES)}")
        print(f"    Free Dates:     {cf(c, F_FREE_DATES)}")
        print(f"    Free Reg:       {cf(c, F_FREE_REG)}")
        print(f"    Free School:    {cf(c, F_FREE_SCHOOL)}")
        print(f"    AS Class:       {cf(c, F_AS_CLASS)}")
        print(f"    Student names:  {[cf(c, fid) for _, fid in NAME_FIELDS if cf(c, fid)]}")
        print()


if __name__ == "__main__":
    main()
