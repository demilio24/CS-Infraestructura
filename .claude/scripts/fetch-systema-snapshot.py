#!/usr/bin/env python3
"""
Fetch all Systema Floyd contacts from GHL and build a dashboard snapshot
derived purely from form-populated fields (NOT the legacy Registration field).

Campus rule (per Tom, 2026-04-29):
  - Cutoff: June 1, 2026.
  - Student is "Lower Campus" if they are 6 or younger on June 1, 2026
    (i.e. their 7th birthday falls AFTER June 1, 2026).
  - Otherwise "Upper Campus".

A "registration" is counted per student, not per contact. A contact may have
1-4 students (Student 1-4 DOB fields) plus the legacy single-student DOB field
("Student's birthday (Free Camp)" / "Student Birthday (Summer Camp)").

Outputs Tom_Systema_Floyd/dashboard/snapshot.json.
"""
import json
import os
import sys
import time
from datetime import date
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

TOKEN = os.environ.get("GHL_PIT_SYSTEMA", "pit-ba33c398-1647-41c9-9024-98f203d6b30c")
LOC = "8IWtNFlmgJ8bif9DivHT"
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "Tom_Systema_Floyd" / "dashboard" / "snapshot.json"

CUTOFF = date(2026, 6, 1)

# Field IDs (form-populated)
F_SUMMER_DATES   = "boH43tBf1W4BXcz1aRh4"  # Select Camp Dates (Summer Camp)
F_FREE_DATES     = "0H3m5fBvXwD3frq75XKa"  # Camp Week Choices (Free Camp)
F_FREE_REG       = "NdulijXuqRPG6FNdPJ5q"  # Free Camp Registration (Upper/Lower + weeks)
F_FREE_SCHOOL    = "mtDthaZW5nm0SWGlp7XU"  # Select School (Free Camp)
F_AS_CLASS       = "UluqGJoN855415yTyiXd"  # Select Class (After School)
F_INTEREST       = "BzxbIyGULm8LDXFJ90Dc"  # Interest

# DOB fields (in priority order — primary first)
DOB_FIELDS = [
    "vlRjxxuVjFo6KIbtQcqU",  # Student 1 - Date of Birth
    "PFHDpoRt6KwWeSuvNOEH",  # Student 2 - Date of Birth
    "Rls0IbGaK7ZNxQ3OM2gU",  # Student 3 - Date of Birth
    "rA7S8h1JJeQUb9q11Z9W",  # Student 4 - Date of Birth
]
# Single-student fallback DOBs (only counted if Student 1-4 are all empty)
DOB_FALLBACKS = [
    "oHlCv49wt2OTGuwUoNsn",  # Student Birthday (Summer Camp)
    "cuEVHLcCCk8c7zaMRQOj",  # Student's birthday (Free Camp)
]

WEEK_ORDER = [
    "June 1st-5th",
    "June 8th-12th",
    "June 15th-19th",
    "June 22nd-26th",
    "June 29th-July 3rd",
    "July 6th-10th",
    "July 13th-17th",
    "July 20th-24th",
    "July 27th-31st",
    "August 3rd-7th",
    "August 10th-14th",
    "August 17th-21st",
]
WEEK_ALIASES = {
    "June 1st - June 5th": "June 1st-5th",
    "July 27th-30th": "July 27th-31st",
}


UA = "Mozilla/5.0 (compatible; SystemaFloyd-DashboardSnapshot/1.0)"


def http_post(url, body):
    req = Request(
        url,
        data=json.dumps(body).encode(),
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Version": "2021-07-28",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": UA,
        },
        method="POST",
    )
    with urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def fetch_all_contacts():
    contacts = []
    search_after = None
    while True:
        body = {"locationId": LOC, "pageLimit": 100}
        if search_after:
            body["searchAfter"] = search_after
        try:
            data = http_post(
                "https://services.leadconnectorhq.com/contacts/search", body
            )
        except HTTPError as e:
            print(f"HTTP {e.code}: {e.read()[:300]}", file=sys.stderr)
            raise
        batch = data.get("contacts", [])
        if not batch:
            break
        contacts.extend(batch)
        last = batch[-1]
        search_after = last.get("searchAfter") or last.get("search_after")
        print(f"  fetched {len(contacts)} / {data.get('total','?')}", file=sys.stderr)
        if not search_after or len(batch) < 100:
            break
        time.sleep(0.12)
    return contacts


def cf_value(c, field_id):
    for f in c.get("customFields") or []:
        if f.get("id") == field_id:
            return f.get("value")
    return None


def canon_week(label):
    if not label:
        return None
    return WEEK_ALIASES.get(label, label)


def parse_dob(v):
    if not v:
        return None
    try:
        return date.fromisoformat(v[:10])
    except Exception:
        return None


def campus_for(dob):
    """Return 'Upper Campus' if 7th bday <= cutoff else 'Lower Campus'."""
    if not dob:
        return None
    try:
        seventh = date(dob.year + 7, dob.month, dob.day)
    except ValueError:
        # Feb 29 birthday → use Feb 28 of +7 year
        seventh = date(dob.year + 7, dob.month, 28)
    return "Upper Campus" if seventh <= CUTOFF else "Lower Campus"


def students_on_contact(c):
    """Return list of campus labels (one per student with a DOB), in priority order."""
    students = []
    for fid in DOB_FIELDS:
        dob = parse_dob(cf_value(c, fid))
        if dob:
            students.append(campus_for(dob))
    if not students:
        for fid in DOB_FALLBACKS:
            dob = parse_dob(cf_value(c, fid))
            if dob:
                students.append(campus_for(dob))
                break
    return students


def main():
    print("Fetching contacts…", file=sys.stderr)
    contacts = fetch_all_contacts()
    print(f"Total contacts: {len(contacts)}", file=sys.stderr)

    # Per-camp-type containers
    summer_total = 0
    free_total = 0
    after_school_total = 0
    lead_only = 0

    summer_by_week = {w: 0 for w in WEEK_ORDER}
    free_by_week   = {w: 0 for w in WEEK_ORDER}

    summer_by_campus = {"Upper Campus": 0, "Lower Campus": 0, "Unknown": 0}
    free_by_campus   = {"Upper Campus": 0, "Lower Campus": 0, "Unknown": 0}

    # Stacked-bar input: per week, [upper, lower, unknown] for each camp type
    summer_week_campus = {w: {"Upper Campus": 0, "Lower Campus": 0, "Unknown": 0} for w in WEEK_ORDER}
    free_week_campus   = {w: {"Upper Campus": 0, "Lower Campus": 0, "Unknown": 0} for w in WEEK_ORDER}

    free_by_school = {}
    interest_counts = {}
    sources = {}
    new_30d = 0
    new_7d  = 0
    now_t = time.time()

    for c in contacts:
        da = c.get("dateAdded")
        if da:
            try:
                t = time.mktime(time.strptime(da[:19], "%Y-%m-%dT%H:%M:%S"))
                if now_t - t < 30 * 86400: new_30d += 1
                if now_t - t <  7 * 86400: new_7d  += 1
            except Exception:
                pass

        src = (c.get("source") or "").strip() or "(blank)"
        sources[src] = sources.get(src, 0) + 1

        interest = cf_value(c, F_INTEREST)
        if interest:
            interest_counts[interest] = interest_counts.get(interest, 0) + 1

        summer_dates = cf_value(c, F_SUMMER_DATES) or []
        free_dates   = cf_value(c, F_FREE_DATES)   or []
        free_reg     = cf_value(c, F_FREE_REG)     or []
        free_school  = cf_value(c, F_FREE_SCHOOL)
        as_class     = cf_value(c, F_AS_CLASS)

        is_summer = bool(summer_dates)
        is_free   = bool(free_dates) or bool(free_reg) or bool(free_school)
        is_as     = bool(as_class) and as_class != "N/A"

        students = students_on_contact(c)
        # If the contact is registered for a camp but has no DOB on file, count
        # one student-of-unknown-campus so totals still make sense.
        if (is_summer or is_free) and not students:
            students = [None]

        # Tally Summer Camp
        if is_summer:
            for s in students:
                key = s or "Unknown"
                summer_by_campus[key] += 1
                summer_total += 1
                for w in summer_dates:
                    cw = canon_week(w)
                    if cw in WEEK_ORDER:
                        summer_by_week[cw] += 1
                        summer_week_campus[cw][key] += 1

        # Tally Free Camp (combine free_dates + free_reg week values, dedupe)
        if is_free:
            free_weeks = set()
            for w in free_dates: free_weeks.add(canon_week(w))
            for v in free_reg:
                cw = canon_week(v)
                if cw in WEEK_ORDER:
                    free_weeks.add(cw)
            free_weeks = {w for w in free_weeks if w in WEEK_ORDER}
            for s in students:
                key = s or "Unknown"
                free_by_campus[key] += 1
                free_total += 1
                for w in free_weeks:
                    free_by_week[w] += 1
                    free_week_campus[w][key] += 1
            if free_school:
                free_by_school[free_school] = free_by_school.get(free_school, 0) + 1

        if is_as:
            after_school_total += 1
        if not (is_summer or is_free or is_as):
            lead_only += 1

    # Combined campus totals across both camps
    combined_by_campus = {
        "Upper Campus": summer_by_campus["Upper Campus"] + free_by_campus["Upper Campus"],
        "Lower Campus": summer_by_campus["Lower Campus"] + free_by_campus["Lower Campus"],
        "Unknown":      summer_by_campus["Unknown"]      + free_by_campus["Unknown"],
    }
    combined_by_week = {w: summer_by_week[w] + free_by_week[w] for w in WEEK_ORDER}

    snapshot = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "locationId": LOC,
        "cutoff": CUTOFF.isoformat(),
        "totals": {
            "contacts": len(contacts),
            "summer": summer_total,
            "free": free_total,
            "afterSchool": after_school_total,
            "leadOnly": lead_only,
            "newLast7Days": new_7d,
            "newLast30Days": new_30d,
        },
        "weekOrder": WEEK_ORDER,
        "summer": {
            "total": summer_total,
            "byCampus": summer_by_campus,
            "byWeek": summer_by_week,
            "byWeekCampus": summer_week_campus,
        },
        "free": {
            "total": free_total,
            "byCampus": free_by_campus,
            "byWeek": free_by_week,
            "byWeekCampus": free_week_campus,
            "bySchool": dict(sorted(free_by_school.items(), key=lambda x: -x[1])),
        },
        "combined": {
            "total": summer_total + free_total,
            "byCampus": combined_by_campus,
            "byWeek": combined_by_week,
        },
        "interest": dict(sorted(interest_counts.items(), key=lambda x: -x[1])),
        "sources": dict(sorted(sources.items(), key=lambda x: -x[1])[:30]),
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(snapshot, indent=2))
    print(f"\nWrote {OUT}", file=sys.stderr)
    summary = {
        "totals": snapshot["totals"],
        "summer.byCampus": summer_by_campus,
        "free.byCampus": free_by_campus,
        "combined.byCampus": combined_by_campus,
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
