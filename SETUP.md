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

**Set the sheet up once.** In Google Sheets: **File → Import →** upload
`tools/guest-list-template.csv` → *Replace current sheet*. That gives you the
thirteen columns that matter now, with four example rows showing the
conventions. Delete the examples when you start.

| column | values |
| --- | --- |
| `name` | one row per **invitation**, not per person — `Sharma Family`, not six rows |
| `side` | `Bride`, `Groom` or `Both` — exact spelling, the database rejects anything else |
| `group` | `Immediate family`, `Extended family`, `Friends`, `Colleagues`, `Neighbours`, `Family friends` |
| `city` | where they travel from; this is what sizes the travel desk |
| `adults`, `kids` | heads on this row. `adults` counts the invitee too, so a couple is `2` |
| `phone` | **10 digits, one per row, never repeated.** The portal's only key |
| `diet` | `Veg`, `Jain`, `No onion/garlic`, `Vegan`, `Non-veg` |
| `haldi`, `sangeet`, `phere`, `reception` | `yes` or `no` |
| `notes` | anything — ground-floor room, wheelchair, allergy, who is chasing them |

Add your own working columns freely — `owner`, `tier`, `called_on`, whatever
helps. The importer only reads the columns above and ignores the rest, so your
process notes never reach the site.

**Split a row** when a group needs more than one room, or when someone needs
their own portal page. Parents and a grown son on separate rows; a family of four
sharing one room on a single row.

**Check it before importing.** Export the sheet (**File → Download →
Comma-separated values**) and run:

```bash
python3 tools/check-guests.py ~/Downloads/guest-list.csv
```

It refuses anything the database would reject and flags the things that are
merely suspicious. The one it earns its keep on is duplicate phone numbers:
`+91 98765 43210` and `9876543210` look different in a sheet but are the same
key, and `phone` is `unique` in the schema, so one clash fails the entire
import. It also prints headcount per function against your 300 and 650 caps, so
you can see the reception filling up while there is still time to do something
about it.

**Then load it.**

1. Planner console (`planner.html` → **Guests → Import CSV**) → upload the same
   file. Use *Replace* so re-importing an updated sheet does not duplicate
   everyone.
2. Click **Export for Supabase**. You get `guests-for-supabase.csv` with the
   column names and value vocabularies the database expects.
3. In Supabase: **Table Editor → guests → Insert → Import data from CSV** →
   upload that file.

Keep the sheet as the source of truth and repeat this whenever it changes. Once
rooms and tables are allotted, edit those directly in the Table Editor — the
guest sees it the next time they open their page, with no deploy.

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
python3 tools/cdp.py check    # 31 checks against a real headless browser
python3 tools/cdp.py shots    # writes screenshots to /tmp/shots
```

Needs Google Chrome installed. No other dependencies.
