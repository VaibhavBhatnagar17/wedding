#!/usr/bin/env python3
"""Check a guest-list CSV before it goes anywhere near the database.

Export your Google Sheet as CSV (File → Download → Comma-separated values),
then:

    python3 tools/check-guests.py ~/Downloads/guest-list.csv

It reports anything that would break the import or the guest portal, and prints
headcounts per function against the invite caps and catering guarantees. It only
reads the file — it never rewrites your list, because silently "correcting" a
phone number is worse than refusing it.
"""

import csv
import re
import sys
from collections import Counter, defaultdict

# Must match the CHECK constraints in supabase/schema.sql and the vocabularies
# in js/data.js, or the import fails on the last row instead of the first.
SIDES = {"Bride", "Groom", "Both"}
DIETS = {"Veg", "Jain", "No onion/garlic", "Vegan", "Non-veg"}
RSVPS = {"Pending", "Confirmed", "Declined", "Tentative"}
FUNCTIONS = ["haldi", "sangeet", "phere", "reception"]
YES = {"y", "yes", "true", "1"}
NO = {"", "n", "no", "false", "0"}

# From js/data.js — invite caps and the catering guarantees we pay for.
CAPS = {"core": 300, "reception": 650}
GUARANTEES = {"core": 275, "reception": 600}

BOLD, DIM, RED, YEL, GRN, OFF = "\033[1m", "\033[2m", "\033[31m", "\033[33m", "\033[32m", "\033[0m"


def main(path):
    with open(path, newline="", encoding="utf-8-sig") as fh:
        rows = list(csv.DictReader(fh))

    if not rows:
        die("That file has no rows.")
    if "name" not in rows[0]:
        die('No "name" column. Start from tools/guest-list-template.csv.')

    errors, warnings = [], []
    phones = defaultdict(list)
    heads = Counter()
    parties = Counter()
    by_side = Counter()
    seen_names = defaultdict(list)

    for i, r in enumerate(rows, start=2):  # +2: header is line 1
        where = f"line {i}"
        name = (r.get("name") or "").strip()
        if not name:
            errors.append(f"{where}: no name — this row will be skipped entirely")
            continue
        label = f"{where} ({name})"
        seen_names[name.lower()].append(i)

        # ── phone: the portal's only way to recognise anyone ──────────────
        raw = (r.get("phone") or "").strip()
        digits = re.sub(r"\D", "", raw)
        if not digits:
            warnings.append(f"{label}: no phone — they cannot open their own page")
        else:
            if len(digits) > 10:
                digits = digits[-10:]  # norm_phone() drops the country code
            if len(digits) != 10:
                errors.append(f"{label}: phone {raw!r} is {len(digits)} digits, needs 10")
            elif digits[0] not in "6789":
                errors.append(f"{label}: phone {raw!r} does not look like an Indian mobile")
            else:
                phones[digits].append(f"{name} ({where})")

        # ── vocabularies that the database enforces ──────────────────────
        side = (r.get("side") or "").strip()
        if side not in SIDES:
            errors.append(f"{label}: side {side!r} must be one of {sorted(SIDES)}")
        else:
            by_side[side] += 1

        diet = (r.get("diet") or "").strip()
        if diet and diet not in DIETS:
            errors.append(f"{label}: diet {diet!r} must be one of {sorted(DIETS)}")

        rsvp = (r.get("rsvp") or "").strip()
        if rsvp and rsvp not in RSVPS:
            errors.append(f"{label}: rsvp {rsvp!r} must be one of {sorted(RSVPS)}")

        # ── headcount ────────────────────────────────────────────────────
        adults = as_int(r.get("adults"), 1)
        kids = as_int(r.get("kids"), 0)
        if adults is None or kids is None:
            errors.append(f"{label}: adults/kids must be whole numbers")
            adults, kids = adults or 1, kids or 0
        if adults < 1:
            warnings.append(f"{label}: {adults} adults — one row is one invitation, so this is usually at least 1")
        party = adults + kids
        if party > 12:
            warnings.append(f"{label}: {party} people on one row — split it if they need more than one room")

        # ── invited functions ────────────────────────────────────────────
        invited = []
        for fn in FUNCTIONS:
            v = (r.get(fn) or "").strip().lower()
            if v in YES:
                invited.append(fn)
            elif v not in NO:
                errors.append(f"{label}: {fn}={v!r} — use yes or no")
        if not invited:
            warnings.append(f"{label}: invited to nothing — they will see an empty page")
        for fn in invited:
            heads[fn] += party
            parties[fn] += 1
        if "phere" in invited and "reception" not in invited:
            warnings.append(f"{label}: at the phere but not the reception — almost certainly a typo")

    # ── duplicates ───────────────────────────────────────────────────────
    for digits, who in sorted(phones.items()):
        if len(who) > 1:
            errors.append(f"phone {digits} is used by {len(who)} rows: {', '.join(who)}"
                          " — the database requires it to be unique")
    for name, lines in sorted(seen_names.items()):
        if len(lines) > 1:
            warnings.append(f"{name!r} appears on {len(lines)} rows (lines {', '.join(map(str, lines))})"
                            " — intentional, or a double entry?")

    # ── report ───────────────────────────────────────────────────────────
    print(f"\n{BOLD}{len(rows)} rows read from {path}{OFF}")

    print(f"\n{BOLD}Headcount{OFF}")
    core = max((heads[f] for f in ("haldi", "sangeet", "phere")), default=0)
    for fn in FUNCTIONS:
        cap = CAPS["reception"] if fn == "reception" else CAPS["core"]
        gtee = GUARANTEES["reception"] if fn == "reception" else GUARANTEES["core"]
        n = heads[fn]
        flag = f"  {RED}over the {cap} cap{OFF}" if n > cap else (
            f"  {DIM}{cap - n} spare{OFF}" if n else "")
        print(f"  {fn:<10} {n:>4} heads  {DIM}({parties[fn]} invitations, "
              f"guarantee {gtee}){OFF}{flag}")
    print(f"  {DIM}largest daytime/evening function: {core} heads{OFF}")

    print(f"\n{BOLD}Split{OFF}")
    for side, n in by_side.most_common():
        print(f"  {side:<10} {n:>4} invitations")

    if warnings:
        print(f"\n{BOLD}{YEL}Worth a look ({len(warnings)}){OFF}")
        for w in warnings:
            print(f"  {YEL}·{OFF} {w}")

    if errors:
        print(f"\n{BOLD}{RED}Must fix before importing ({len(errors)}){OFF}")
        for e in errors:
            print(f"  {RED}✗{OFF} {e}")
        print(f"\n{RED}Not ready.{OFF} Fix the above in the sheet, re-download, run this again.\n")
        return 1

    print(f"\n{GRN}Ready to import.{OFF} Planner console → Guests → Import CSV, "
          "then Export for Supabase.\n")
    return 0


def as_int(v, default):
    v = (v or "").strip()
    if not v:
        return default
    try:
        return int(float(v))
    except ValueError:
        return None


def die(msg):
    print(f"{RED}{msg}{OFF}", file=sys.stderr)
    sys.exit(2)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
