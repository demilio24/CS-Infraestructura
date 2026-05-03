#!/usr/bin/env python3
"""Clear camp-registration custom fields on remaining test contacts.

Per Tom: just empty the week-fields and the snapshot script's existing
is_summer / is_free / is_as gates will skip them. No tag, no name list,
no Python filter required — clean source of truth.

Targets:
  - Aston Floyd (under the gym's own contact, free-camp test entry)
  - Juliana Lima (summer camp + after-school test entry; Alex Henry data
    on the same contact also clears as a side effect — flagging this)
"""
import json, os, sys, time
from urllib.request import Request, urlopen
from urllib.error import HTTPError

if hasattr(sys.stdout, "reconfigure"):
    try: sys.stdout.reconfigure(encoding="utf-8")
    except Exception: pass

TOKEN = os.environ.get("GHL_PIT_SYSTEMA", "pit-ba33c398-1647-41c9-9024-98f203d6b30c")
APPLY = "--apply" in sys.argv

# field id -> label
F = {
    "boH43tBf1W4BXcz1aRh4": "Select Camp Dates (Summer Camp)",
    "0H3m5fBvXwD3frq75XKa": "Camp Week Choices (Free Camp)",
    "NdulijXuqRPG6FNdPJ5q": "Free Camp Registration",
    "mtDthaZW5nm0SWGlp7XU": "Select School (Free Camp)",
    "UluqGJoN855415yTyiXd": "Select Class (After School)",
}

# contact_id -> (label, [field_ids_to_clear])
TARGETS = {
    "0TROoWuINpcteBUV4dxz": (
        "Aston Floyd (under Systema Floyd gym admin contact)",
        ["0H3m5fBvXwD3frq75XKa", "NdulijXuqRPG6FNdPJ5q", "mtDthaZW5nm0SWGlp7XU"],
    ),
    "X3L4gYXi2w2pcZAyaIdo": (
        "Juliana Lima (also clears Alex Henry's data — flagged)",
        ["boH43tBf1W4BXcz1aRh4", "UluqGJoN855415yTyiXd"],
    ),
}

HDR = {"Authorization": f"Bearer {TOKEN}", "Version": "2021-07-28",
       "Content-Type": "application/json", "Accept": "application/json",
       "User-Agent": "Mozilla/5.0 (compatible; SystemaFloyd-DashboardSnapshot/1.0)"}


def http(method, url, body=None):
    data = json.dumps(body).encode() if body else None
    req = Request(url, data=data, headers=HDR, method=method)
    try:
        with urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read() or b"{}")
    except HTTPError as e:
        return e.code, {"error": e.read().decode()[:500]}


def main():
    print(f"Mode: {'APPLY' if APPLY else 'DRY-RUN (use --apply)'}\n")
    for cid, (label, fids) in TARGETS.items():
        # Show current values first so we have a recovery record in the log
        code, data = http("GET", f"https://services.leadconnectorhq.com/contacts/{cid}")
        if code != 200:
            print(f"[FAIL] {cid}  {label}: fetch HTTP {code}")
            continue
        c = data.get("contact") or data
        print(f"--- {cid}  {label}")
        for fid in fids:
            cur = next((f.get("value") for f in (c.get("customFields") or []) if f.get("id") == fid), None)
            print(f"    BEFORE  {F[fid]}: {cur!r}")
        if APPLY:
            body = {"customFields": [{"id": fid, "value": ""} for fid in fids]}
            code2, resp = http("PUT", f"https://services.leadconnectorhq.com/contacts/{cid}", body)
            ok = code2 in (200, 201)
            print(f"    {'[OK]' if ok else '[FAIL]'} update HTTP {code2}")
            if not ok:
                print(f"    response: {resp}")
            time.sleep(0.4)
        else:
            print(f"    (dry-run — no write)")
        print()


if __name__ == "__main__":
    main()
