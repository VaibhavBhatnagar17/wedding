"""Pin the room-planner rules that matter, since they encode family decisions
rather than arithmetic and would be easy to refactor away."""
import importlib.util, pathlib, sys
spec = importlib.util.spec_from_file_location("cg", pathlib.Path("tools/check-guests.py"))
cg = importlib.util.module_from_spec(spec); spec.loader.exec_module(cg)

def inv(iid, group="Extended family", no_share=False, side="Groom"):
    return {"_line": 0, "invite_id": iid, "household": iid, "side": side,
            "group": group, "city": "", "phone": "", "phones": [],
            "needs_room": True, "no_share": no_share,
            "invited": list(cg.FUNCTIONS), "notes": ""}

def per(name, band, gender, spouse=""):
    return {"_line": 0, "name": name, "invite_id": "", "band": band,
            "gender": gender, "diet": "Veg", "couple_with": spouse, "room_notes": ""}

fails = []
def check(label, fn):
    try:
        fn(); print("  ok   ", label)
    except AssertionError as e:
        fails.append(label); print("  FAIL ", label, "\n        ", e)

def plan(invites, people, density="dense"):
    for iid, ppl in people.items():
        for p in ppl: p["invite_id"] = iid
    return cg.plan_rooms(invites, people, density)

def test_caregiving():
    iv = {"A": inv("A")}
    pl = {"A": [per("Son", "Adult", "M", "Bahu"), per("Bahu", "Adult", "F", "Son"),
                per("Ma", "Senior", "F")]}
    rooms = plan(iv, pl)
    assert len(rooms) == 1, f"expected one room, got {len(rooms)}"
    assert rooms[0]["ground"], "a room with a senior in it must be ground floor"
    assert len(rooms[0]["occupants"]) == 3, rooms[0]["occupants"]

def test_senior_couple_with_child_couple():
    iv = {"A": inv("A")}
    pl = {"A": [per("Son", "Adult", "M", "Bahu"), per("Bahu", "Adult", "F", "Son"),
                per("Pa", "Senior", "M"), per("Ma", "Senior", "F")]}
    rooms = plan(iv, pl)
    assert len(rooms) == 1, f"parents plus couple should be one room, got {len(rooms)}"
    assert rooms[0]["two_doubles"], "four adults need two double beds"

def test_lone_seniors_not_mixed_by_gender():
    # Two unrelated seniors of different genders on one invitation must not be
    # put in a room together just because the arithmetic allows it.
    iv = {"A": inv("A")}
    pl = {"A": [per("Dadi", "Senior", "F"), per("Nana", "Senior", "M")]}
    rooms = plan(iv, pl)
    assert len(rooms) == 2, f"expected two rooms, got {len(rooms)}"

def test_seniors_never_share_across_families():
    iv = {"A": inv("A"), "B": inv("B")}
    pl = {"A": [per("S1", "Adult", "M", "S2"), per("S2", "Adult", "F", "S1"),
                per("Ma", "Senior", "F")],
          "B": [per("T1", "Adult", "M", "T2"), per("T2", "Adult", "F", "T1")]}
    rooms = plan(iv, pl)
    care = [r for r in rooms if any(p["band"] == "Senior" for p in r["occupants"])]
    assert len(care) == 1 and not care[0]["mixed"], "senior room was merged with another family"

def test_immediate_family_and_no_share_kept_alone():
    iv = {"P": inv("P", group="Immediate family"), "Q": inv("Q", no_share=True),
          "R": inv("R"), "S": inv("S")}
    pl = {k: [per(k + "1", "Adult", "M", k + "2"), per(k + "2", "Adult", "F", k + "1")]
          for k in "PQRS"}
    rooms = plan(iv, pl)
    for r in rooms:
        ids = {p["invite_id"] for p in r["occupants"]}
        assert not (ids & {"P", "Q"}) or len(ids) == 1, f"P or Q was doubled up: {ids}"
    assert any(r["kind"] == "Two couples" for r in rooms), "R and S should have merged"

def test_comfortable_never_merges_couples():
    iv = {"R": inv("R"), "S": inv("S")}
    pl = {k: [per(k + "1", "Adult", "M", k + "2"), per(k + "2", "Adult", "F", k + "1")]
          for k in "RS"}
    rooms = plan(iv, pl, "comfortable")
    assert len(rooms) == 2, f"comfortable should keep couples apart, got {len(rooms)}"

for name, fn in sorted(globals().items()):
    if name.startswith("test_"): check(name[5:].replace("_", " "), fn)
print(("FAILED " + ", ".join(fails)) if fails else "\nall room rules hold")
sys.exit(1 if fails else 0)
