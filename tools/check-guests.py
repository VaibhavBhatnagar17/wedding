#!/usr/bin/env python3
"""Check the guest list, estimate the room block, and produce the import file.

The list lives in one Google Sheet with two tabs, both exported as CSV
(File → Download → Comma-separated values, once per tab):

  1-invitations.csv   one row per invitation card — the phone, the functions,
                      whether they need a room
  2-people.csv        one row per named person, joined by invite_id

Run:

    python3 tools/check-guests.py 1-invitations.csv 2-people.csv

It refuses anything the database would refuse, estimates how many rooms the
block needs under sane sharing rules, and writes guest-list-flat.csv for the
planner console's CSV import. It never edits your sheets — silently "correcting"
a phone number is worse than refusing it.
"""

import csv
import math
import os
import re
import sys
from collections import Counter, defaultdict

# Must match the CHECK constraints in supabase/schema.sql and the vocabularies
# in js/data.js, or an import fails on the last row instead of the first.
SIDES = {"Bride", "Groom", "Both"}
GROUPS = {"Immediate family", "Extended family", "Friends",
          "Colleagues", "Neighbours", "Family friends"}
DIETS = {"Veg", "Jain", "No onion/garlic", "Vegan", "Non-veg"}
FUNCTIONS = ["haldi", "sangeet", "phere", "reception"]
GENDERS = {"M", "F"}

# Age bands exist for room allocation, not for curiosity. Each one implies a
# different bed: an infant shares, a child takes half of one, a teen takes a
# whole bed but will happily be three to a room.
BANDS = ["Infant", "Child", "Teen", "Adult", "Senior"]
BED_LOAD = {"Infant": 0.0, "Child": 0.5, "Teen": 1.0, "Adult": 1.0, "Senior": 1.0}

YES = {"y", "yes", "true", "1"}
NO = {"", "n", "no", "false", "0"}

# From js/data.js — invite caps and the catering guarantees we pay for.
CAPS = {"core": 300, "reception": 650}
GUARANTEES = {"core": 275, "reception": 600}

# Rooms at the shortlisted venues, so the estimate lands as a decision.
VENUE_ROOMS = [
    ("Labh Garh Palace Resort", 100), ("Ramada Udaipur", 90),
    ("Shouryagarh Resort & Spa", 82), ("Justa Rajputana", 65),
    ("Chunda Palace / Shikarbadi", 60), ("The Lalit Laxmi Vilas", 55),
    ("Bhairavgarh Palace", 45),
]

# Most restrictive first — a household's flat diet has to be the safest one.
DIET_RANK = ["Vegan", "Jain", "No onion/garlic", "Veg", "Non-veg"]

BOLD, DIM, RED, YEL, GRN, CYA, OFF = (
    "\033[1m", "\033[2m", "\033[31m", "\033[33m", "\033[32m", "\033[36m", "\033[0m")

errors, warnings = [], []


def err(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


def truthy(v):
    return (v or "").strip().lower() in YES


# ───────────────────────────── reading ─────────────────────────────

def read(path, required):
    with open(path, newline="", encoding="utf-8-sig") as fh:
        rows = list(csv.DictReader(fh))
    if not rows:
        die(f"{path} has no rows.")
    missing = [c for c in required if c not in rows[0]]
    if missing:
        die(f"{path} is missing column(s): {', '.join(missing)}. "
            f"Start from tools/templates/.")
    return rows


def load_invitations(path):
    rows = read(path, ["invite_id", "household", "side"])
    invites, phones = {}, defaultdict(list)

    for i, r in enumerate(rows, start=2):
        iid = (r.get("invite_id") or "").strip()
        house = (r.get("household") or "").strip()
        where = f"invitations line {i}"
        if not iid:
            err(f"{where}: no invite_id — nothing can be joined to this row")
            continue
        if not house:
            err(f"{where}: invite_id {iid} has no household name")
        if iid in invites:
            err(f"{where}: invite_id {iid!r} is already used on line {invites[iid]['_line']}")
            continue
        label = f"{iid} ({house or 'unnamed'})"

        side = (r.get("side") or "").strip()
        if side not in SIDES:
            err(f"{label}: side {side!r} must be one of {sorted(SIDES)}")
        group = (r.get("group") or "").strip()
        if group and group not in GROUPS:
            warn(f"{label}: group {group!r} is not one of the six the site knows")

        # phones — the portal's only way to recognise anyone
        nums = []
        for col in ("phone", "phone_alt"):
            raw = (r.get(col) or "").strip()
            if not raw:
                continue
            d = re.sub(r"\D", "", raw)
            if len(d) > 10:
                d = d[-10:]          # norm_phone() drops the country code
            if len(d) != 10:
                err(f"{label}: {col} {raw!r} is {len(d)} digits, needs 10")
            elif d[0] not in "6789":
                err(f"{label}: {col} {raw!r} does not look like an Indian mobile")
            else:
                nums.append(d)
                phones[d].append(label)
        if not nums:
            warn(f"{label}: no phone — nobody in this family can open their page")

        invited = []
        for fn in FUNCTIONS:
            v = (r.get(fn) or "").strip().lower()
            if v in YES:
                invited.append(fn)
            elif v not in NO:
                err(f"{label}: {fn}={v!r} — use yes or no")
        if not invited:
            warn(f"{label}: invited to nothing — they would see an empty page")
        if "phere" in invited and "reception" not in invited:
            warn(f"{label}: at the phere but not the reception — almost certainly a typo")

        invites[iid] = {
            "_line": i, "invite_id": iid, "household": house,
            "side": side, "group": group, "city": (r.get("city") or "").strip(),
            "phone": nums[0] if nums else "", "phones": nums,
            "needs_room": truthy(r.get("needs_room")),
            "invited": invited, "notes": (r.get("notes") or "").strip(),
        }

    for d, who in sorted(phones.items()):
        if len(who) > 1:
            err(f"phone {d} is on {len(who)} invitations ({', '.join(who)}) — "
                "the database requires it to be unique")
    return invites


def load_people(path, invites):
    rows = read(path, ["invite_id", "name", "age_band"])
    people = defaultdict(list)

    for i, r in enumerate(rows, start=2):
        where = f"people line {i}"
        iid = (r.get("invite_id") or "").strip()
        name = (r.get("name") or "").strip()
        if not name:
            err(f"{where}: no name — this person will not exist anywhere")
            continue
        label = f"{where} ({name})"
        if not iid:
            err(f"{label}: no invite_id — which family are they on?")
            continue
        if iid not in invites:
            err(f"{label}: invite_id {iid!r} is not in the invitations sheet")
            continue

        band = (r.get("age_band") or "").strip()
        if band not in BANDS:
            err(f"{label}: age_band {band!r} must be one of {BANDS}")
            band = "Adult"
        gender = (r.get("gender") or "").strip().upper()[:1]
        if gender not in GENDERS:
            if band in ("Adult", "Senior", "Teen"):
                err(f"{label}: gender must be M or F — room sharing depends on it")
            gender = ""
        diet = (r.get("diet") or "").strip()
        if diet and diet not in DIETS:
            err(f"{label}: diet {diet!r} must be one of {sorted(DIETS)}")

        people[iid].append({
            "_line": i, "name": name, "invite_id": iid, "band": band,
            "gender": gender, "diet": diet or "Veg",
            "couple_with": (r.get("couple_with") or "").strip(),
            "room_notes": (r.get("room_notes") or "").strip(),
        })

    for iid, inv in invites.items():
        if not people.get(iid):
            err(f"{iid} ({inv['household']}): no people listed — "
                "an invitation with nobody on it")

    # couple_with has to point both ways, inside the same household
    for iid, ppl in people.items():
        by_name = {p["name"]: p for p in ppl}
        for p in ppl:
            spouse = p["couple_with"]
            if not spouse:
                continue
            if spouse not in by_name:
                err(f"people line {p['_line']} ({p['name']}): couple_with "
                    f"{spouse!r} is not on the same invitation")
            elif by_name[spouse]["couple_with"] != p["name"]:
                err(f"people line {p['_line']} ({p['name']}): couple_with "
                    f"{spouse!r} is not reciprocal — set both rows")
            elif p["band"] in ("Child", "Infant", "Teen"):
                err(f"people line {p['_line']} ({p['name']}): a {p['band']} "
                    "cannot be in a couple")
    return people


# ─────────────────────── the room block ───────────────────────

def plan_rooms(invites, people):
    """Estimate the block under rules that hold up at an Indian wedding.

    Married couples are the floor and cannot be compressed. Everything else
    can: kids fold into their parents' room, teens are happiest three to a
    room with same-gender cousins, and single adults share. Seniors get their
    own ground-floor rooms and never share with children.
    """
    rooms = []
    pool = defaultdict(list)   # (side, group, gender, class) -> [person]

    def add(kind, occupants, inv, ground=False, mixed=False):
        load = sum(BED_LOAD[p["band"]] for p in occupants)
        rooms.append({
            "kind": kind, "occupants": occupants, "invite": inv,
            "ground": ground, "mixed": mixed,
            "extra_beds": max(0, math.ceil(load) - 2),
        })

    for iid, inv in invites.items():
        if not inv["needs_room"]:
            continue
        ppl = list(people.get(iid, []))

        # couples first — one room each, absorbing up to two of their children
        paired, seen = [], set()
        for p in ppl:
            if p["couple_with"] and p["name"] not in seen:
                spouse = next((q for q in ppl if q["name"] == p["couple_with"]), None)
                if spouse:
                    paired.append([p, spouse])
                    seen.update({p["name"], spouse["name"]})
        rest = [p for p in ppl if p["name"] not in seen]

        kids = [p for p in rest if p["band"] in ("Infant", "Child")]
        rest = [p for p in rest if p["band"] not in ("Infant", "Child")]
        ki = 0
        for pair in paired:
            take = kids[ki:ki + 2]
            ki += len(take)
            add("Couple" + (" + kids" if take else ""), pair + take, inv)
        spare_kids = kids[ki:]

        seniors = [p for p in rest if p["band"] == "Senior"]
        rest = [p for p in rest if p["band"] != "Senior"]
        for g in ("F", "M", ""):
            same = [p for p in seniors if p["gender"] == g]
            for j in range(0, len(same), 2):
                add("Senior", same[j:j + 2], inv, ground=True)

        if spare_kids:
            # A child with no parent's room to fold into needs an adult with them.
            host = next((r for r in reversed(rooms) if r["invite"] is inv), None)
            if host:
                host["occupants"].extend(spare_kids)
                load = sum(BED_LOAD[p["band"]] for p in host["occupants"])
                host["extra_beds"] = max(0, math.ceil(load) - 2)
            else:
                names = ", ".join(p["name"] for p in spare_kids)
                warn(f"{iid} ({inv['household']}): {names} — a child with no adult "
                     "on the same invitation. Who are they rooming with?")
                add("Needs an adult", spare_kids, inv)

        # teens and single adults go into a pool so cousins and friends can share
        for p in rest:
            cls = "Teen" if p["band"] == "Teen" else "Adult"
            pool[(inv["side"], inv["group"], p["gender"], cls)].append(p)

    for (side, group, gender, cls), members in sorted(
            pool.items(), key=lambda kv: str(kv[0])):
        # Teens and friends are happy three to a room; family adults, two.
        per = 3 if (cls == "Teen" or group in ("Friends", "Colleagues")) else 2
        for j in range(0, len(members), per):
            chunk = members[j:j + per]
            inv = invites[chunk[0]["invite_id"]]
            mixed = len({p["invite_id"] for p in chunk}) > 1
            add(f"Shared · {gender or '?'} · {cls.lower()}s", chunk, inv, mixed=mixed)

    return rooms


# ───────────────────────────── report ─────────────────────────────

def main(inv_path, ppl_path):
    invites = load_invitations(inv_path)
    people = load_people(ppl_path, invites)

    heads, parties = Counter(), Counter()
    for iid, inv in invites.items():
        n = len(people.get(iid, []))
        for fn in inv["invited"]:
            heads[fn] += n
            parties[fn] += 1

    total_people = sum(len(v) for v in people.values())
    print(f"\n{BOLD}{len(invites)} invitations · {total_people} named people{OFF}")

    print(f"\n{BOLD}Headcount{OFF}")
    for fn in FUNCTIONS:
        cap = CAPS["reception"] if fn == "reception" else CAPS["core"]
        gtee = GUARANTEES["reception"] if fn == "reception" else GUARANTEES["core"]
        n = heads[fn]
        flag = (f"  {RED}{n - cap} over the {cap} cap{OFF}" if n > cap
                else (f"  {DIM}{cap - n} spare{OFF}" if n else ""))
        print(f"  {fn:<10} {n:>4} heads  {DIM}({parties[fn]} invitations, "
              f"guarantee {gtee}){OFF}{flag}")

    diets = Counter(p["diet"] for v in people.values() for p in v)
    if diets:
        print(f"\n{BOLD}Kitchen{OFF}")
        for d, n in diets.most_common():
            print(f"  {d:<18} {n:>4}")

    rooms = plan_rooms(invites, people)
    staying = sum(len(people.get(i, [])) for i, v in invites.items() if v["needs_room"])
    if rooms:
        print(f"\n{BOLD}Room block{OFF}  {DIM}(1 & 2 Feb, two nights){OFF}")
        kinds = Counter(r["kind"] for r in rooms)
        for k, n in kinds.most_common():
            print(f"  {n:>3} × {k}")
        extra = sum(r["extra_beds"] for r in rooms)
        ground = sum(1 for r in rooms if r["ground"])
        mixed = [r for r in rooms if r["mixed"]]
        print(f"  {BOLD}{len(rooms)} rooms{OFF} for {staying} staying guests "
              f"{DIM}({staying / len(rooms):.1f} per room){OFF}")
        if extra:
            print(f"  {DIM}{extra} extra bed(s) / rollaway(s) to request{OFF}")
        if ground:
            print(f"  {DIM}{ground} ground-floor room(s) for seniors{OFF}")
        if mixed:
            print(f"  {YEL}{len(mixed)} room(s) share across families — "
                  f"confirm they are comfortable{OFF}")
            for r in mixed[:6]:
                who = ", ".join(f"{p['name']} ({p['invite_id']})" for p in r["occupants"])
                print(f"      {DIM}{who}{OFF}")

        print(f"\n{BOLD}Which venues fit{OFF}  "
              f"{DIM}(+3 buffer rooms held back){OFF}")
        need = len(rooms) + 3
        for name, n in VENUE_ROOMS:
            mark = f"{GRN}fits{OFF}" if n >= need else f"{RED}short by {need - n}{OFF}"
            print(f"  {name:<28} {n:>4} rooms   {mark}")

    if warnings:
        print(f"\n{BOLD}{YEL}Worth a look ({len(warnings)}){OFF}")
        for w in warnings:
            print(f"  {YEL}·{OFF} {w}")

    if errors:
        print(f"\n{BOLD}{RED}Must fix before importing ({len(errors)}){OFF}")
        for e in errors:
            print(f"  {RED}✗{OFF} {e}")
        print(f"\n{RED}Not ready.{OFF} Fix these in the sheet, re-download, run again.\n")
        return 1

    out = write_flat(invites, people, os.path.dirname(os.path.abspath(inv_path)))
    print(f"\n{GRN}Ready.{OFF} Wrote {CYA}{out}{OFF}")
    print(f"{DIM}Planner console → Guests → Import CSV (Replace) → "
          f"Export for Supabase.{OFF}\n")
    return 0


def write_flat(invites, people, outdir):
    """Collapse to one row per invitation, which is what the site imports today.

    The named people and their age bands stay in the sheet; here they become the
    adults/kids counts the current schema stores, with the individual names and
    diets folded into notes so nothing is lost on the way through.
    """
    cols = ["name", "side", "group", "city", "adults", "kids", "phone", "diet",
            "rsvp", "haldi", "sangeet", "phere", "reception", "needsRoom", "notes"]
    rows = []
    for iid, inv in invites.items():
        ppl = people.get(iid, [])
        adults = sum(1 for p in ppl if p["band"] in ("Adult", "Senior", "Teen"))
        kids = sum(1 for p in ppl if p["band"] in ("Child", "Infant"))
        ds = {p["diet"] for p in ppl}
        diet = next((d for d in DIET_RANK if d in ds), "Veg")
        roster = "; ".join(
            f"{p['name']} ({p['band']}"
            + (f", {p['diet']}" if p["diet"] != diet else "") + ")" for p in ppl)
        notes = " · ".join(filter(None, [inv["notes"], roster]))
        rows.append({
            "name": inv["household"], "side": inv["side"], "group": inv["group"],
            "city": inv["city"], "adults": max(1, adults), "kids": kids,
            "phone": inv["phone"], "diet": diet, "rsvp": "Pending",
            "haldi": yn(inv, "haldi"), "sangeet": yn(inv, "sangeet"),
            "phere": yn(inv, "phere"), "reception": yn(inv, "reception"),
            "needsRoom": "yes" if inv["needs_room"] else "no", "notes": notes,
        })
    path = os.path.join(outdir, "guest-list-flat.csv")
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=cols)
        w.writeheader()
        w.writerows(rows)
    return path


def yn(inv, fn):
    return "yes" if fn in inv["invited"] else "no"


# ──────────────────── estimating before the list exists ────────────────────

def estimate(a):
    """Size the room block from rough counts, months before there are names.

    This builds a stand-in list and runs it through the same plan_rooms() the
    real check uses, so the estimate and the eventual answer cannot drift apart.
    """
    invites, people, n = {}, {}, 0

    def household(group, needs, folk, couple=False):
        """folk is a list of (band, gender). With couple=True the first two are
        married — the link is wired here, from the names actually assigned, so it
        cannot fall out of step with them."""
        nonlocal n
        n += 1
        iid = f"EST-{n:04d}"
        invites[iid] = {
            "_line": 0, "invite_id": iid, "household": iid, "side": "Bride",
            "group": group, "city": "", "phone": "", "phones": [],
            "needs_room": needs, "invited": list(FUNCTIONS), "notes": "",
        }
        ppl = [
            {"_line": 0, "name": f"{iid}-{i}", "invite_id": iid, "band": b,
             "gender": g, "diet": "Veg", "couple_with": "", "room_notes": ""}
            for i, (b, g) in enumerate(folk)]
        if couple and len(ppl) >= 2:
            ppl[0]["couple_with"] = ppl[1]["name"]
            ppl[1]["couple_with"] = ppl[0]["name"]
        people[iid] = ppl

    # Locals are spread across the categories rather than taken off the top of
    # one, so the shape of the block stays realistic.
    stay = 1.0 - min(a.local, 0.9)
    pair = [("Adult", "M"), ("Adult", "F")]

    for i in range(a.couples):
        household("Extended family", i < round(a.couples * stay), pair, couple=True)
    for i in range(a.families_with_kids):
        kids = [("Child", "M"), ("Child", "F")][:a.kids_per_family]
        household("Extended family", i < round(a.families_with_kids * stay),
                  pair + kids, couple=True)
    for i in range(a.seniors):
        household("Extended family", i < round(a.seniors * stay),
                  [("Senior", "F" if i % 2 else "M")])
    for i in range(a.single_adults):
        household("Extended family", i < round(a.single_adults * stay),
                  [("Adult", "F" if i % 2 else "M")])
    for i in range(a.teens):
        household("Extended family", i < round(a.teens * stay),
                  [("Teen", "F" if i % 2 else "M")])
    for i in range(a.friends):
        household("Friends", i < round(a.friends * stay),
                  [("Adult", "F" if i % 2 else "M")])

    heads = sum(len(v) for v in people.values())
    staying = sum(len(people[i]) for i, v in invites.items() if v["needs_room"])
    rooms = plan_rooms(invites, people)
    if not rooms:
        die("Nothing to estimate — give it some counts.")

    print(f"\n{BOLD}Estimate{OFF}  {DIM}{heads} guests, "
          f"{staying} of them staying over{OFF}")
    floor = sum(1 for r in rooms if r["kind"].startswith("Couple"))
    for k, c in Counter(r["kind"] for r in rooms).most_common():
        print(f"  {c:>3} × {k}")
    print(f"  {BOLD}{len(rooms)} rooms{OFF} "
          f"{DIM}({staying / len(rooms):.1f} per room, "
          f"{sum(r['extra_beds'] for r in rooms)} extra beds){OFF}")
    print(f"\n  {CYA}{floor} of those {len(rooms)} are married couples.{OFF} "
          f"{DIM}That is the floor —{OFF}\n  {DIM}no amount of clever pairing "
          f"compresses a couple into half a room.{OFF}")

    need = len(rooms) + 3
    print(f"\n{BOLD}Which venues fit{OFF}  {DIM}(+3 buffer rooms held back){OFF}")
    for name, cnt in VENUE_ROOMS:
        mark = f"{GRN}fits{OFF}" if cnt >= need else f"{RED}short by {need - cnt}{OFF}"
        print(f"  {name:<28} {cnt:>4} rooms   {mark}")
    if not any(c >= need for _, c in VENUE_ROOMS):
        print(f"\n  {YEL}No single shortlisted property holds this block.{OFF} "
              f"{DIM}Either put the{OFF}\n  {DIM}friends and younger cousins in a "
              f"second hotel with a shuttle, or{OFF}\n  {DIM}cut couples from the "
              f"core list — they cost a room each.{OFF}")
    print()
    return 0


def die(msg):
    print(f"{RED}{msg}{OFF}", file=sys.stderr)
    sys.exit(2)


if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser(
        description="Check the guest list, or estimate the room block before it exists.")
    ap.add_argument("invitations", nargs="?", help="1-invitations.csv")
    ap.add_argument("people", nargs="?", help="2-people.csv")
    ap.add_argument("--estimate", action="store_true",
                    help="skip the sheets and size the block from counts")
    ap.add_argument("--couples", type=int, default=0, help="married couples travelling without children")
    ap.add_argument("--families-with-kids", type=int, default=0, help="couples bringing children")
    ap.add_argument("--kids-per-family", type=int, default=2, choices=[1, 2])
    ap.add_argument("--seniors", type=int, default=0, help="seniors not part of a couple above")
    ap.add_argument("--single-adults", type=int, default=0, help="unmarried adult relatives")
    ap.add_argument("--teens", type=int, default=0, help="12–17, travelling without parents")
    ap.add_argument("--friends", type=int, default=0, help="friends and colleagues")
    ap.add_argument("--local", type=float, default=0.1,
                    help="fraction already in Udaipur who need no room (default 0.1)")
    args = ap.parse_args()

    if args.estimate:
        sys.exit(estimate(args))
    if not (args.invitations and args.people):
        ap.error("give both CSVs, or use --estimate with counts")
    sys.exit(main(args.invitations, args.people))
