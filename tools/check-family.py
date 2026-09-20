#!/usr/bin/env python3
"""Validate the family list and draw it back as a tree.

    python3 tools/check-family.py tools/templates/family-tree.csv

The point of drawing it back is that you can see whether the sheet says what you
meant. A wrong `parent_id` is invisible in a spreadsheet and obvious in a tree.

Columns:
    id          F2-03 — family prefix and a sequence number. Never reuse one, and
                never renumber: every link in the sheet points at it. Renaming a
                person is free, which matters while half the names are still
                "Shubham's Father".
    name        as you know them today. Placeholders are fine.
    side        Groom or Bride
    family      free text, for your own grouping
    gender      M or F
    age         a number. Within five years is fine — it only has to land on the
                right side of 18 and 70
    spouse_id   the id of their husband or wife, set on both rows
    parent_id   the id of ONE parent, whichever is the blood relative. The spouse
                link supplies the other, so a couple is never typed twice. Blank
                for the eldest generation and for anyone who married in
    relation    plain English, for your reading only — "Groom's chachi"
    notes       anything
"""

import csv
import sys
from collections import defaultdict

BOLD, DIM, RED, YEL, GRN, CYA, OFF = (
    "\033[1m", "\033[2m", "\033[31m", "\033[33m", "\033[32m", "\033[36m", "\033[0m")

# Bands the room planner in check-guests.py works in, so the two sheets agree.
def band(age):
    if age is None:
        return None
    if age < 4:
        return "Infant"
    if age < 12:
        return "Child"
    if age < 18:
        return "Teen"
    if age < 60:
        return "Adult"
    return "Senior"


def load(path):
    with open(path, newline="", encoding="utf-8-sig") as fh:
        rows = list(csv.DictReader(fh))
    if not rows:
        sys.exit(f"{path} is empty.")
    for col in ("id", "name"):
        if col not in rows[0]:
            sys.exit(f"{path} has no `{col}` column. Start from tools/templates/.")

    people, errors, warnings = {}, [], []
    for i, r in enumerate(rows, start=2):
        pid = (r.get("id") or "").strip()
        name = (r.get("name") or "").strip()
        if not pid and not name:
            continue
        if not pid:
            errors.append(f"line {i} ({name or 'unnamed'}): no id")
            continue
        if not name:
            errors.append(f"line {i}: id {pid} has no name")
        if pid in people:
            errors.append(f"line {i}: id {pid!r} already used on line {people[pid]['_line']}")
            continue

        age = (r.get("age") or "").strip()
        if age:
            try:
                age = int(float(age))
            except ValueError:
                errors.append(f"{pid} ({name}): age {age!r} is not a number")
                age = None
        else:
            age = None

        gender = (r.get("gender") or "").strip().upper()[:1]
        if gender and gender not in ("M", "F"):
            errors.append(f"{pid} ({name}): gender {gender!r} must be M or F")
            gender = ""

        people[pid] = {
            "_line": i, "id": pid, "name": name, "gender": gender, "age": age,
            "side": (r.get("side") or "").strip(),
            "family": (r.get("family") or "").strip(),
            "spouse": (r.get("spouse_id") or "").strip(),
            "parent": (r.get("parent_id") or "").strip(),
            "relation": (r.get("relation") or "").strip(),
            "notes": (r.get("notes") or "").strip(),
        }

    # links must point somewhere, and spouse links must agree with each other
    for p in people.values():
        who = f"{p['id']} ({p['name']})"
        if p["spouse"]:
            s = people.get(p["spouse"])
            if not s:
                errors.append(f"{who}: spouse_id {p['spouse']!r} is not an id in this sheet")
            elif s["spouse"] != p["id"]:
                errors.append(
                    f"{who}: spouse_id points at {s['id']} but {s['id']} "
                    f"points at {s['spouse'] or 'nobody'} — set it on both rows")
            elif s["gender"] and p["gender"] and s["gender"] == p["gender"]:
                warnings.append(f"{who} and {s['name']} are married but both {p['gender']}")
        if p["parent"]:
            if p["parent"] == p["id"]:
                errors.append(f"{who}: parent_id points at itself")
            elif p["parent"] not in people:
                errors.append(f"{who}: parent_id {p['parent']!r} is not an id in this sheet")

    # A parent_id loop would hang every walk below, so find them up front and
    # mark the people involved rather than trusting later code to be careful.
    looped = set()
    for p in people.values():
        seen, cur = set(), p
        while cur and cur["parent"] in people:
            if cur["id"] in seen:
                looped.add(p["id"])
                errors.append(f"{p['id']} ({p['name']}): parent_id forms a loop")
                break
            seen.add(cur["id"])
            cur = people[cur["parent"]]
    for pid in looped:
        people[pid]["looped"] = True

    return people, errors, warnings


def draw(people):
    """Print each family as a tree. A person's children are anyone whose
    parent_id is them or their spouse."""
    kids = defaultdict(list)
    for p in people.values():
        if p["parent"] in people:
            kids[p["parent"]].append(p)

    def children_of(p, fam):
        if p.get("looped"):
            return []
        out = list(kids.get(p["id"], []))
        if p["spouse"] in people:
            out += kids.get(p["spouse"], [])
        # Only descend into people this family owns. A marriage joins two
        # families, and the children hang off one side or the other.
        return sorted((c for c in out if c["family"] == fam), key=lambda x: x["id"])

    def line(p, prefix, is_last, depth, fam, shown):
        if p["id"] in shown:
            return
        shown.add(p["id"])
        bits, s = [p["name"]], people.get(p["spouse"])
        if s:
            # A spouse from another family is named here but still drawn in full
            # under their own family, so neither tree loses them.
            if s["family"] == fam:
                shown.add(s["id"])
                bits.append("+ " + s["name"])
            else:
                bits.append(f"+ {s['name']} {DIM}[{s['family']}]{OFF}")
        tag = [f"{q['name'].split()[0]} {q['age']}"
               for q in ([p, s] if s else [p]) if q and q["age"] is not None]
        stem = "└─ " if is_last else "├─ "
        extra = f"  {DIM}({', '.join(tag)}){OFF}" if tag else ""
        rel = f"  {DIM}{p['relation']}{OFF}" if p["relation"] else ""
        print(f"{prefix}{stem if depth else ''}{' '.join(bits)}{extra}{rel}")

        ch = children_of(p, fam)
        nxt = (prefix + ("   " if is_last else "│  ")) if depth else ""
        for j, c in enumerate(ch):
            line(c, nxt, j == len(ch) - 1, depth + 1, fam, shown)

    by_family = defaultdict(list)
    for p in people.values():
        by_family[p["family"] or "(no family)"].append(p)

    for fam in sorted(by_family, key=lambda f: by_family[f][0]["id"]):
        members = sorted(by_family[fam], key=lambda x: x["id"])
        shown = set()
        roots = [p for p in members
                 if not p.get("looped")
                 and p["parent"] not in people
                 and not (p["spouse"] in people
                          and people[p["spouse"]]["family"] == fam
                          and people[p["spouse"]]["parent"] in people)]
        print(f"\n{BOLD}{fam}{OFF} {DIM}· {len(members)} people{OFF}")
        for r in roots:
            line(r, "", True, 0, fam, shown)
        for p in [m for m in members if m["id"] not in shown]:
            shown.add(p["id"])
            note = f"  {YEL}{p['notes']}{OFF}" if p["notes"] else f"  {YEL}not linked to anyone{OFF}"
            print(f"   {YEL}?{OFF} {p['name']}{note}")


def main(path):
    people, errors, warnings = load(path)
    if errors:
        print(f"\n{BOLD}{RED}Must fix ({len(errors)}){OFF}")
        for e in errors:
            print(f"  {RED}✗{OFF} {e}")
        print(f"\n{DIM}Tree below is drawn from whatever still resolves.{OFF}")
    draw(people)

    gens = defaultdict(int)
    for p in people.values():
        d, cur, seen = 1, p, {p["id"]}
        while cur["parent"] in people and cur["parent"] not in seen:
            d += 1
            cur = people[cur["parent"]]
            seen.add(cur["id"])
        gens[d] += 1

    print(f"\n{BOLD}Totals{OFF}")
    print(f"  {len(people)} people across {len({p['family'] for p in people.values()})} families")
    for d in sorted(gens):
        print(f"  generation {d}: {gens[d]}")
    deepest = max(gens) if gens else 0
    print(f"  {DIM}deepest line is {deepest} generation{'s' if deepest != 1 else ''}{OFF}")

    bands = defaultdict(int)
    for p in people.values():
        bands[band(p["age"]) or "age not given"] += 1
    print(f"\n{BOLD}Age bands{OFF} {DIM}(what the room planner needs){OFF}")
    for k in ("Senior", "Adult", "Teen", "Child", "Infant", "age not given"):
        if bands.get(k):
            tone = YEL if k == "age not given" else ""
            print(f"  {tone}{k:<14} {bands[k]:>3}{OFF}")

    missing_g = [p for p in people.values() if not p["gender"]]
    unlinked = [p for p in people.values()
                if not p["spouse"] and p["parent"] not in people]
    todo = [p for p in people.values() if "DECIDE" in p["notes"].upper()]

    if todo:
        print(f"\n{BOLD}{CYA}Waiting on you ({len(todo)}){OFF}")
        for p in todo:
            print(f"  {CYA}·{OFF} {p['name']} — {p['notes']}")
    if missing_g:
        print(f"\n  {YEL}{len(missing_g)} people have no gender{OFF} "
              f"{DIM}— rooms cannot be shared out without it{OFF}")
    if unlinked:
        print(f"  {YEL}{len(unlinked)} people are not linked to anyone yet{OFF}")

    if warnings:
        print(f"\n{BOLD}{YEL}Worth a look ({len(warnings)}){OFF}")
        for w in warnings:
            print(f"  {YEL}·{OFF} {w}")
    if errors:
        print(f"\n{RED}{len(errors)} error(s) above — fix those first.{OFF}\n")
        return 1
    print(f"\n{GRN}Every link in the sheet resolves.{OFF}\n")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
