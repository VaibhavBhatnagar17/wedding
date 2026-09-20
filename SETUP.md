# Setup

Two things to do. The site works without either — this just makes it *yours*.

- [Part 1: put it online](#part-1-put-it-online) — about 5 minutes
- [Part 2: connect the guest database](#part-2-connect-the-guest-database) — about 15 minutes

---

## Part 1: put it online

The site is plain HTML, CSS and JavaScript. There is nothing to build and no
server to run, so any static host works. GitHub Pages is free and fast.

### The quick way

`gh` is already installed. Two commands:

```bash
gh auth login          # opens a browser — choose GitHub.com, then HTTPS
tools/deploy.sh        # creates the repo, pushes, turns Pages on
```

The script prints your live URL when it finishes. The first build takes two or
three minutes; after that every update is live in about a minute.

Run `tools/deploy.sh` again any time — it commits anything outstanding and
pushes. Pass a different repository name as the first argument if you'd rather
not call it `wedding`:

```bash
tools/deploy.sh vaibhav-mahak
```

### Using the GitHub website

1. Create a new **public** repository called `wedding` (no README, no
   `.gitignore` — the repo already has both).
2. Back in this folder:

   ```bash
   git remote add origin https://github.com/<your-username>/wedding.git
   git push -u origin main
   ```

3. On GitHub: **Settings → Pages → Source: Deploy from a branch →
   `main` / `/ (root)` → Save**.

### A nicer address

`vaibhavbhatnagar17.github.io/wedding` is fine, but a real domain reads better
on a printed card. Buy one (about ₹800/year), then:

1. Put the domain in a file called `CNAME` in this folder, on its own line.
2. At your registrar, add a `CNAME` record pointing `www` to
   `<your-username>.github.io`.
3. GitHub → Settings → Pages → Custom domain → enter it → tick **Enforce HTTPS**.

### Every update after that

```bash
git add -A && git commit -m "what changed" && git push
```

Live in about a minute.

---

## Part 2: connect the guest database

Without this, the guest portal runs on the sample guests in `js/data.js` and
shows a banner saying so. With it, every guest sees their own real room number,
table, pickup and photo albums.

### Why Supabase

It is a hosted Postgres database with a free tier that is far more than this
wedding needs, it has a spreadsheet-like editor for changing guest details, and
it works from a static site with no server of your own.

### Step 1 — create the project

1. Sign up at [supabase.com](https://supabase.com) (free, no card).
2. **New project**. Name it anything. Choose the **Mumbai (ap-south-1)** region
   so it is fast from India. Save the database password somewhere safe.
3. Wait about two minutes while it starts.

### Step 2 — create the tables

1. In the sidebar: **SQL Editor → New query**.
2. Open `supabase/schema.sql` from this folder, copy all of it, paste it in.
3. Click **Run**. It should say success.

That creates the tables, locks them down, and adds three sample guests.

### Step 3 — connect the website

1. In Supabase: **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key.
3. Paste both into `js/config.js`:

   ```js
   window.W.config = {
     SUPABASE_URL: 'https://abcdefgh.supabase.co',
     SUPABASE_ANON_KEY: 'eyJhbGciOi...',
     ...
   };
   ```

4. Commit and push. The banner on the portal disappears.

**The anon key is meant to be public** — it is in every visitor's page source
by design. `schema.sql` gives it no access to any table. It can only call five
functions, and the guest lookup returns a single row for a phone number the
caller already typed in. See *Who can see what* below.

### Step 4 — build and load the guest list

Build the list in Google Sheets, not in the planner console. Two people can edit
a sheet at once, it has history, and it works on a phone while you are on a call
with a relative. The console is for the operational side later — rooms, tables,
pickups.

**Set the sheet up once, as two tabs.** In Google Sheets, **File → Import →**
upload `tools/templates/1-invitations.csv` → *Insert new sheet*, then do the same
with `tools/templates/2-people.csv`. Both arrive with example rows showing the
conventions; delete them when you start.

The split matters. An invitation is what you send and what a phone number belongs
to. A person is who eats a meal and sleeps in a bed. Keeping household facts on
one tab means you can never end up with two rows disagreeing about whether the
Sharmas were invited to the haldi.

**Tab 1 — `invitations`.** One row per invitation card.

| column | values |
| --- | --- |
| `invite_id` | your own short code — `BH-CHACHA`, `KA-PARENTS`. This joins the two tabs, so never reuse or renumber one |
| `household` | the name on the card — `Vikram & Neha Bhatnagar` |
| `side` | `Bride`, `Groom` or `Both` — exact spelling, the database rejects anything else |
| `group` | `Immediate family`, `Extended family`, `Friends`, `Colleagues`, `Neighbours`, `Family friends` |
| `city` | where they travel from; this is what sizes the travel desk |
| `phone`, `phone_alt` | **10 digits, never repeated across rows.** One or two per family is plenty — the portal's only key |
| `needs_room` | `yes` or `no`. Locals get `no` |
| `haldi`, `sangeet`, `phere`, `reception` | `yes` or `no` |
| `notes` | ground-floor room, wheelchair, who is chasing them |

**Tab 2 — `people`.** One row per named person.

| column | values |
| --- | --- |
| `invite_id` | must match a row on tab 1. Use **Data → Data validation** against tab 1 so it becomes a dropdown |
| `name` | the individual, spelled how they would want it on a place card |
| `age_band` | `Infant`, `Child`, `Teen`, `Adult`, `Senior` — this is a bed size, not curiosity |
| `gender` | `M` or `F`. Required for adults, because same-gender sharing is what makes the room block fit |
| `couple_with` | spouse's name, on both rows. Marks the pairs who must have a room to themselves |
| `diet` | `Veg`, `Jain`, `No onion/garlic`, `Vegan`, `Non-veg` — per person, since one vegan in a family of six is the whole point |
| `room_notes` | age in years for children, snores, early riser, needs a lift |

Add your own working columns freely — `owner`, `tier`, `called_on`, whatever
helps. The tool only reads the columns above and ignores the rest, so your
process notes never reach the site.

**Check it before importing.** Download both tabs (**File → Download →
Comma-separated values**, once per tab) and run:

```bash
python3 tools/check-guests.py 1-invitations.csv 2-people.csv
```

It refuses anything the database would reject and flags what is merely
suspicious. It earns its keep on duplicate phone numbers — `+91 98765 43210` and
`9876543210` look different in a sheet but are the same key, and `phone` is
`unique` in the schema, so one clash fails the whole import — and on broken
joins, where a person points at an `invite_id` that no longer exists.

It also prints two things you will actually plan against: headcount per function
versus your 180 and 650 caps, and **the size of the room block**, worked out under
the sharing rules in `PLAN.md` §9a — couples doubled up two to a room, an elderly
parent placed in with the couple who care for them rather than in a seniors'
block, unmarried cousins three or four to a room. It reports how many rooms need
two double beds rather than two twins, how many rollaways to argue out of the
bill, and which shortlisted venues hold the block.

Put a senior on the same `invite_id` as the family who look after them and they
are roomed together automatically. That is both the right answer and about five
rooms cheaper than a separate seniors' block.

Households you never want doubled up with another family — both sets of parents,
the very elderly, the newly married — get `no_share` set to `yes` on tab 1 and the
planner leaves them alone.

You can run the estimate before a single name exists, which is the point:

```bash
python3 tools/check-guests.py --estimate \
  --couples 34 --couples-with-parents 10 --seniors 4 \
  --single-adults 44 --friends 32 --local 0.12
```

Add `--density comfortable` to price one-couple-per-room instead, which on these
numbers is 73 rooms against 52.

**Then load it.** A passing check writes `guest-list-flat.csv` next to your
export. That is the two tabs collapsed to one row per invitation, which is what
the site stores today — the individual names, age bands and diets ride along in
`notes` so nothing is lost.

1. Planner console (`planner.html` → **Guests → Import CSV**) → upload
   `guest-list-flat.csv`. Use *Replace* so re-importing an updated sheet does not
   duplicate everyone.
2. Click **Export for Supabase**. You get `guests-for-supabase.csv` with the
   column names and value vocabularies the database expects.
3. In Supabase: **Table Editor → guests → Insert → Import data from CSV** →
   upload that file.

Keep the sheet as the source of truth and repeat this whenever it changes. Once
rooms and tables are allotted, edit those directly in the Table Editor — the
guest sees it the next time they open their page, with no deploy.

### Working out who is actually related to whom

The guest list above is about invitations. Before that there is a prior question —
who exists and how are they connected — and for a family that runs to three
generations a flat list cannot answer it. `tools/templates/family-tree.csv` is the
shape that can:

| column | values |
| --- | --- |
| `id` | `F2-03` — family prefix and a sequence. **Never reuse or renumber one**, because every link points at it. Renaming a person is free, which matters while half the names are still "Shubham's Father" |
| `name` | as you know them today; placeholders are fine |
| `side` | `Groom` or `Bride` |
| `family` | free text, your own grouping |
| `gender` | `M` or `F` |
| `age` | a number. Within five years is fine — it only has to land on the right side of 18 and 70 |
| `spouse_id` | the id of their husband or wife, **set on both rows** |
| `parent_id` | the id of **one** parent, whichever is the blood relative. The spouse link supplies the other, so a couple is never typed twice. Blank for the eldest generation and for anyone who married in |
| `relation` | plain English, for your reading only — "Groom's chachi" |
| `notes` | anything |

Linking by `id` rather than by name is the whole trick. It means row order stops
mattering, a person can be a child in one family and a spouse in another, and
correcting a name never breaks anything.

```bash
python3 tools/check-family.py tools/templates/family-tree.csv
```

That draws the sheet back as a tree, which is the point — a wrong `parent_id` is
invisible in a spreadsheet and obvious in a tree. It also catches the things that
would quietly corrupt the list: duplicate ids, a `spouse_id` set on one row but
not the other, a `parent_id` pointing at a deleted row, and loops. At the end it
reports how many people still have no gender, since rooms cannot be shared out
without it.

### Step 5 — add the photo albums

As the photographers deliver, put the shared album links in the `albums` table:

| column | example |
| --- | --- |
| `title` | Haldi & Sangeet |
| `url` | the Google Photos or Drive share link |
| `function_id` | `haldi` |
| `photo_count` | 240 |

Albums with an empty `url` show as "coming soon", which is why the portal looks
right even before there are any photographs.

You can also post short notes to every guest's portal via the
`announcements` table.

---

## Who can see what

| | Can they? |
| --- | --- |
| A visitor lists all guests | **No.** Row Level Security is on and `anon` has no table access. |
| A visitor reads one guest by phone number | Yes — that is the point. They must already know the number. |
| A visitor sees your private `notes` column | **No.** The lookup function does not return it. |
| A guest changes their own RSVP | Yes — headcount, food and a note. |
| A guest changes their room or table | **No.** Those are not writable from the site. |

The honest limitation: a mobile number is a *soft* password. Somebody who knows
a guest's number can see that guest's room number. For a wedding this is the
right trade — nobody will remember a password, and everybody knows their own
phone number. If you would rather it were stricter, the usual next step is an
SMS one-time code, which needs a paid SMS provider.

Do not put anything genuinely sensitive in the `message` field.

---

## Local preview

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Opening the files directly with `file://`
mostly works, but `localStorage` is blocked in some browsers, so the planning
console will not save.

## Checking nothing is broken

```bash
python3 tools/test-rooms.py   # the room-sharing rules from PLAN.md §9a
python3 tools/cdp.py check    # 31 checks against a real headless browser
python3 tools/cdp.py shots    # writes screenshots to /tmp/shots
```

`test-rooms.py` is worth running after any change to `check-guests.py`. It pins
the decisions rather than the arithmetic — that an elderly parent stays in the
same room as the family who care for them, that two unrelated seniors of
different genders are never put together, and that both sets of parents are
never doubled up with another family. Those are easy to optimise away by
accident, because the room count improves when you do.

The browser checks need Google Chrome. Nothing else has dependencies.
