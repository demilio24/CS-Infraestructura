#!/usr/bin/env python3
"""Remove the `internal-test` tag from the 4 test contacts (per Tom 2026-05-01).
The tag is no longer needed: 3 of the 4 had their camp-registration fields
cleared so they don't show up regardless. Juliana retains her camp data and
will reappear in the dashboard until cleaned up another way.

Run:  python .claude/untag-test-contacts.py
"""
import json, os, sys, time
from urllib.request import Request, urlopen
from urllib.error import HTTPError

if hasattr(sys.stdout, "reconfigure"):
    try: sys.stdout.reconfigure(encoding="utf-8")
    except Exception: pass

TOKEN = os.environ.get("GHL_PIT_SYSTEMA", "pit-ba33c398-1647-41c9-9024-98f203d6b30c")
TAG = "internal-test"

CONTACT_IDS = [
    ("kdoxnoc7DHfa5clOWWO0", "Emilio Arias (fwtest@gmail.com)"),
    ("DeWN0dud767UA7p5Wtyr", "Tommy Floyd"),
    ("HW79nI8mechIEgg9MoKr", "Melissa Nasiff -> Sean Nasiff"),
    ("X3L4gYXi2w2pcZAyaIdo", "Juliana Lima"),
]

HDR = {
    "Authorization": f"Bearer {TOKEN}",
    "Version": "2021-07-28",
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (compatible; SystemaFloyd-DashboardSnapshot/1.0)",
}


def http(method, url, body=None):
    data = json.dumps(body).encode() if body else None
    req = Request(url, data=data, headers=HDR, method=method)
    try:
        with urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read() or b"{}")
    except HTTPError as e:
        return e.code, {"error": e.read().decode()[:500]}


def main():
    for cid, label in CONTACT_IDS:
        # Fetch current tags first
        code, data = http("GET", f"https://services.leadconnectorhq.com/contacts/{cid}")
        if code != 200:
            print(f"[FAIL] {cid}  {label}: fetch HTTP {code}")
            continue
        c = data.get("contact") or data
        existing = c.get("tags") or []
        new_tags = [t for t in existing if (t or "").strip().lower() != TAG.lower()]
        if new_tags == existing:
            print(f"[SKIP] {cid}  {label}: no '{TAG}' tag found  (tags={existing})")
            continue
        code2, _ = http("PUT", f"https://services.leadconnectorhq.com/contacts/{cid}",
                        {"tags": new_tags})
        ok = code2 in (200, 201)
        print(f"{'[OK]' if ok else '[FAIL]'} {cid}  {label}: {existing} -> {new_tags}  HTTP {code2}")
        time.sleep(0.4)


if __name__ == "__main__":
    main()
