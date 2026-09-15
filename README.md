# Vaibhav & Mahak — Udaipur, February 2027

Two things live in this folder:

1. **[`PLAN.md`](PLAN.md)** — the wedding plan. Budget, function sequence, décor, menus, venue shortlist, risks. Read this first.
2. **A website** with two pages:
   - **`index.html`** — the invitation. Share this with guests.
   - **`planner.html`** — the private planning console. Guests, budget, vendors, rooms, travel desk, checklist.

## Running it

There is no build step and no dependencies. **Double-click `index.html`** and it opens.

If your browser blocks local storage on `file://` (Safari sometimes does), serve it instead:

```sh
cd "$(dirname "$0")"
python3 -m http.server 8899
```

Then open <http://localhost:8899/index.html>.

## The invitation

An opening curtain, the arch with your names, a live countdown, cards for all five functions, a full running order, travel and packing notes, and an RSVP form. Guests can add every function to their phone calendar in one tap and share the link.

Append `?open=1` to skip the opening curtain — useful when sending a deep link, e.g. `index.html?open=1#rsvp`.

## The planning console

| Screen | What it is for |
|---|---|
| **Dashboard** | Countdown, budget position, headcount against catering guarantees, and anything that needs attention today |
| **Guests** | One row per family. Per-function invites, RSVP, headcount, diet, room, travel. Filter, search, sort. CSV in and out. Dietary counts to hand the caterer. |
| **Functions** | Running order, décor brief and menu for each function, plus cost per function |
| **Venue** | The brief to take to site visits, the deal to chase, the shortlist, and what is deliberately out of range |
| **Budget** | 25 line items summing to ₹20,00,000. Enter committed and paid; it computes variance. |
| **Vendors** | Category, contact, status, quoted vs agreed vs paid, and what to ask each one |
| **Rooms** | Rooming list, who you are paying for, room count at two per room |
| **Travel desk** | Arrivals grouped by date and time so pickups can be batched |
| **Checklist** | 28 tasks sequenced backwards from the date |
| **Strategy** | Why every number is what it is. Read once, properly. |
| **RSVP inbox** | Replies from the invitation page, mergeable into the guest list |

### Your data

Everything you type is stored in **your browser only**. There is no server and nothing is uploaded.

- **Back up regularly** — sidebar → *Backup / restore* → *Download backup*. That one JSON file is your whole plan.
- Restore the same file to move everything to another device or to hand it to a family member.
- Clearing your browser data will wipe it. Keep a backup in your email or Drive.

### Importing your guest list

Guests → *Import CSV*. Download the template first to see the expected columns. The only required column is `name`; function columns (`mehndi`, `haldi`, `sangeet`, `phere`, `reception`) take `yes` or `no`.

One row per **family or party**, not per person — that is how caterers and hotels count, and it is what makes the headcount maths come out right.

## Collecting RSVPs for real

The invitation form currently saves replies in the guest's own browser, so you only see them if they replied on your device. In practice most RSVPs will arrive by phone and WhatsApp and you will enter them on the Guests screen — which is fine.

To collect them centrally, replace one function — `submitRsvp()` in `js/store.js` — with a `fetch()` to a Google Form, Google Sheet or Supabase endpoint. Nothing else needs to change.

To turn on the "Send on WhatsApp" button, set `RSVP_WHATSAPP` at the top of `js/invite.js` to a number with country code and no `+` or spaces, e.g. `'919876543210'`.

## Changing the plan

All content is in **`js/data.js`** — couple details, functions, schedules, décor, menus, budget lines, venue shortlist, vendors, checklist, risks. Edit that one file and both pages update. No build, no restart.

If you change budget amounts, keep the total at ₹20,00,000 or the dashboard will tell you it does not add up.

## Publishing it

It is a static site, so anything works: Netlify or Vercel (drag the folder in), GitHub Pages, or Cloudflare Pages.

`planner.html` carries `noindex` so it stays out of search results, but **it is not password-protected** — anyone with the link can read it. If that matters, publish only `index.html` and its `assets/` and `js/` folders, and keep `planner.html` local.

## Tests

```sh
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc tools/smoke-test.js
```

47 checks: the budget still sums to ₹20,00,000, per-plate figures match the budget lines, Indian number formatting, CSV round-trips through commas and quotes, the store's add/update/remove/import/backup paths, and every screen renders with zero guests, twenty guests and four hundred.
