#!/usr/bin/env python3
"""
Fetch the Systema Floyd dashboard snapshot from the Apps Script web app
that reads the four canonical registration sheets owned by
systemafloydsheets@gmail.com.

This replaces the GHL-based fetch-systema-snapshot.py for the registrations
data path. Tom edits the sheets directly (and an automation appends new
form submissions), so the sheets are the source of truth.

Output:
  Tom_Systema_Floyd/dashboard/snapshot.json   (live snapshot)
  Tom_Systema_Floyd/dashboard/history/<YYYY-MM-DD>.json  (daily archive)
  Tom_Systema_Floyd/dashboard/history/index.json         (date index)

Env:
  FLOYD_SNAPSHOT_URL   - full /exec URL of the deployed web app
  FLOYD_SNAPSHOT_KEY   - optional shared key, appended as ?key=...
"""
import json
import os
import sys
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

DEFAULT_URL = "https://script.google.com/macros/s/AKfycbw6YVSJXxwEz5UPavqQYEn_c2oFGi2-Y7Re8KlGNQytqOLeYI3k_7v85YIvuTptKI5j/exec"
URL = os.environ.get("FLOYD_SNAPSHOT_URL", DEFAULT_URL)
KEY = os.environ.get("FLOYD_SNAPSHOT_KEY")

ROOT = Path(__file__).resolve().parents[2]
OUT  = ROOT / "Tom_Systema_Floyd" / "dashboard" / "snapshot.json"
HISTORY_DIR = OUT.parent / "history"

UA = "Mozilla/5.0 (compatible; SystemaFloyd-DashboardSnapshot/2.0)"


def fetch():
    url = URL + (("?" + urlencode({"key": KEY})) if KEY else "")
    req = Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urlopen(req, timeout=120) as r:
            data = r.read()
    except HTTPError as e:
        body = e.read()[:600].decode("utf-8", errors="replace")
        print(f"HTTP {e.code} from web app: {body}", file=sys.stderr)
        raise
    except URLError as e:
        print(f"URL error: {e}", file=sys.stderr)
        raise
    try:
        return json.loads(data)
    except json.JSONDecodeError:
        print(f"Web app returned non-JSON (first 400 chars):\n{data[:400]!r}", file=sys.stderr)
        raise


def main():
    print(f"Fetching snapshot from {URL}", file=sys.stderr)
    snap = fetch()
    if "error" in snap and "totals" not in snap:
        print(f"Web app returned error: {snap.get('error')}", file=sys.stderr)
        return 1
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(snap, indent=2))
    print(f"Wrote {OUT}", file=sys.stderr)

    HISTORY_DIR.mkdir(exist_ok=True)
    today_str = time.strftime("%Y-%m-%d", time.gmtime())
    (HISTORY_DIR / f"{today_str}.json").write_text(json.dumps(snap, indent=2))
    available = sorted(p.stem for p in HISTORY_DIR.glob("????-??-??.json"))
    (HISTORY_DIR / "index.json").write_text(json.dumps({
        "dates": available,
        "latest": available[-1] if available else None,
    }, indent=2))

    summary = {
        "totals": snap.get("totals", {}),
        "summer.byCampus": (snap.get("summer") or {}).get("byCampus", {}),
        "free.byCampus":   (snap.get("free")   or {}).get("byCampus", {}),
        "combined.byCampus": (snap.get("combined") or {}).get("byCampus", {}),
        "weeksTracked": len(snap.get("weekOrder", [])),
    }
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
