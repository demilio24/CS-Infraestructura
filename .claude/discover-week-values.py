#!/usr/bin/env python3
"""Sample contacts to see what week values actually appear for each camp."""
import json, os, sys, time
from collections import Counter
from urllib.request import Request, urlopen

TOKEN = os.environ.get("GHL_PIT_SYSTEMA", "pit-ba33c398-1647-41c9-9024-98f203d6b30c")
LOC = "8IWtNFlmgJ8bif9DivHT"

F_SUMMER_DATES = "boH43tBf1W4BXcz1aRh4"
F_FREE_DATES   = "0H3m5fBvXwD3frq75XKa"
F_FREE_REG     = "NdulijXuqRPG6FNdPJ5q"

def http_post(url, body):
    req = Request(url, data=json.dumps(body).encode(), headers={
        "Authorization": f"Bearer {TOKEN}",
        "Version": "2021-07-28",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; SystemaFloyd-DashboardSnapshot/1.0)",
    }, method="POST")
    with urlopen(req, timeout=60) as r:
        return json.loads(r.read())

def cf(c, fid):
    for f in c.get("customFields") or []:
        if f.get("id") == fid:
            return f.get("value")
    return None

def main():
    summer = Counter()
    free = Counter()
    free_reg = Counter()
    after = None
    fetched = 0
    while True:
        body = {"locationId": LOC, "pageLimit": 100}
        if after: body["searchAfter"] = after
        d = http_post("https://services.leadconnectorhq.com/contacts/search", body)
        batch = d.get("contacts", [])
        if not batch: break
        for c in batch:
            sd = cf(c, F_SUMMER_DATES) or []
            fd = cf(c, F_FREE_DATES)   or []
            fr = cf(c, F_FREE_REG)     or []
            for v in sd: summer[v] += 1
            for v in fd: free[v] += 1
            for v in fr: free_reg[v] += 1
        fetched += len(batch)
        after = batch[-1].get("searchAfter")
        if not after or len(batch) < 100: break
        time.sleep(0.1)
    print(f"Sampled {fetched} contacts\n")
    print("=== SUMMER CAMP — Select Camp Dates values:")
    for v, n in summer.most_common():
        print(f"  {n:4d}× {v!r}")
    print("\n=== FREE CAMP — Camp Week Choices values:")
    for v, n in free.most_common():
        print(f"  {n:4d}× {v!r}")
    print("\n=== FREE CAMP — Free Camp Registration values:")
    for v, n in free_reg.most_common():
        print(f"  {n:4d}× {v!r}")

if __name__ == "__main__":
    main()
