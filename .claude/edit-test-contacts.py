#!/usr/bin/env python3
"""Tag the 4 internal test contacts with `internal-test`, and for the three
clear-cut testers (#2 Emilio fwtest, #3 Tommy, #4 Melissa/Sean) also clear
their camp-registration fields so they no longer count as registered.

Juliana Lima (#5) gets the tag only — her contact also has 'Alex Henry' as
a second student, and we don't know whether Alex is real. Tag-only is
non-destructive and reversible. (Per Tom's confirmation 2026-05-01.)

Run:  python .claude/edit-test-contacts.py
Add:  --apply  to actually write changes (default is dry-run preview).
"""
import json, os, sys, time
from urllib.request import Request, urlopen
from urllib.error import HTTPError

# Windows console — force UTF-8 so unicode labels print without crashing
if hasattr(sys.stdout, "reconfigure"):
    try: sys.stdout.reconfigure(encoding="utf-8")
    except Exception: pass

TOKEN = os.environ.get("GHL_PIT_SYSTEMA", "pit-ba33c398-1647-41c9-9024-98f203d6b30c")
LOC = "8IWtNFlmgJ8bif9DivHT"
APPLY = "--apply" in sys.argv

# Contact IDs discovered earlier via .claude/find-test-contacts.py
# (Skipping VAJ2wzBQoXZrlcuIeNYM — that's Emilio's REAL contact, no test data)
CONTACTS = [
    # id, label, clear_camp_fields
    ("kdoxnoc7DHfa5clOWWO0", "Emilio Arias (fwtest@gmail.com)",      True),
    ("DeWN0dud767UA7p5Wtyr", "Tommy Floyd (floydkarateinstitute)",   True),
    ("HW79nI8mechIEgg9MoKr", "Melissa Nasiff → student Sean Nasiff", True),
    ("X3L4gYXi2w2pcZAyaIdo", "Juliana Lima (has Alex Henry too)",    False),  # tag only
]

# Camp-registration fields that drive student counts
CLEAR_FIELDS = [
    ("boH43tBf1W4BXcz1aRh4", "Select Camp Dates (Summer Camp)"),
    ("0H3m5fBvXwD3frq75XKa", "Camp Week Choices (Free Camp)"),
    ("NdulijXuqRPG6FNdPJ5q", "Free Camp Registration"),
    ("mtDthaZW5nm0SWGlp7XU", "Select School (Free Camp)"),
    ("UluqGJoN855415yTyiXd", "Select Class (After School)"),
]

TAG = "internal-test"

UA = "Mozilla/5.0 (compatible; SystemaFloyd-DashboardSnapshot/1.0)"
HDR = {
    "Authorization": f"Bearer {TOKEN}",
    "Version": "2021-07-28",
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": UA,
}


def http(method, url, body=None):
    data = json.dumps(body).encode() if body else None
    req = Request(url, data=data, headers=HDR, method=method)
    try:
        with urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read() or b"{}")
    except HTTPError as e:
        return e.code, {"error": e.read().decode()[:500]}


def get_contact(cid):
    code, data = http("GET", f"https://services.leadconnectorhq.com/contacts/{cid}")
    if code != 200:
        return None
    return data.get("contact") or data


def update_contact(cid, body):
    return http("PUT", f"https://services.leadconnectorhq.com/contacts/{cid}", body)


def main():
    print(f"Mode: {'APPLY' if APPLY else 'DRY-RUN (use --apply to write)'}\n")
    for cid, label, clear in CONTACTS:
        c = get_contact(cid)
        if not c:
            print(f"  [FAIL] {cid}  {label}: could not fetch contact")
            continue

        existing_tags = c.get("tags") or []
        new_tags = list(existing_tags)
        if TAG not in [t.lower() for t in new_tags]:
            new_tags.append(TAG)

        body = {"tags": new_tags}

        if clear:
            # Clear camp-registration fields by sending empty arrays/strings.
            # GHL expects customFields as a list of {id, value}.
            body["customFields"] = [{"id": fid, "value": ""} for fid, _ in CLEAR_FIELDS]

        print(f"--- {cid}  {label}")
        print(f"    tags: {existing_tags}  ->{new_tags}")
        if clear:
            print(f"    clear: {[name for _, name in CLEAR_FIELDS]}")
        else:
            print(f"    (tag only — leaving fields untouched)")

        if APPLY:
            code, resp = update_contact(cid, body)
            ok = (code in (200, 201))
            print(f"    {'[OK]' if ok else '[FAIL]'} update: HTTP {code}")
            if not ok:
                print(f"    response: {resp}")
            time.sleep(0.4)  # gentle rate limit
        else:
            print(f"    (dry-run — no write)")
        print()

    if not APPLY:
        print("To actually apply these changes, re-run with: --apply")


if __name__ == "__main__":
    main()
