# Vaibhav & Mahak — Udaipur, February 2027

Three things live in this folder:

1. **[`PLAN.md`](PLAN.md)** — the wedding plan. Budget, function sequence, décor, menus, venue shortlist, risks. Read this first.
2. **[`SETUP.md`](SETUP.md)** — how to put the site online and connect the guest database.
3. **A website** with three pages:
   - **`index.html`** — the invitation. Share this with guests.
   - **`guest.html`** — the personal portal. A guest enters their mobile number and sees their own room, schedule, pickup, table and photo albums.
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

It opens on a pair of carved doors that swing apart onto the invitation — an
arch card with your names and both sets of parents in gold, marigold strands
swaying overhead and petals drifting down. Below that: a live countdown, cards
for all four functions, the full running order for both days, travel and packing
notes, and an RSVP form. Guests can add every function to their phone calendar
in one tap.

The palette is maroon, sindoor red, saffron, marigold and gold — a shaadi joda,
not a Mughal one. Colours live in `assets/css/tokens.css` and nowhere else, so
the whole site re-tints from that one file.

The doors are layered rather than drawn as one image: the wood gradient, the
tiled lattice and the gold frame are CSS, and only the arch and the medallion are
SVG, each with `preserveAspectRatio="…meet"`. That is deliberate — a single
full-door SVG has to stretch to fit the viewport, which flattens the arch and
turns every lattice circle into an oval on a wide or short window. A smoke test
asserts no door SVG ever goes back to `preserveAspectRatio="none"`.

Append `?open=1` to skip the doors — useful for deep links, e.g.
`index.html?open=1#rsvp`. The doors also only appear once per browsing session.

Everything honours `prefers-reduced-motion`: if a guest has asked their phone to
stop animating things, the doors open instantly and nothing moves.

## The guest portal

`guest.html` asks for a mobile number and shows that guest — and only that
guest — their own page:

- the room number and hotel, and whether it is on you
- only the functions they are actually invited to, with timings and dress code
- their arrival, and the pickup you have arranged for them
- their table at the reception
- a personal line you have written for them
- photo albums as the photographers deliver them
- a wedding guide: what to wear, weather, what to pack, things to do in Udaipur
- a form to correct their own headcount and food preference

Out of the box this runs on the sample guests in `js/data.js` and says so in a
banner. Connect Supabase (see **[`SETUP.md`](SETUP.md)**) and it runs on your
real guest list, which you can edit in a web spreadsheet without redeploying.

**About privacy.** A mobile number is a soft password: someone who knows a
guest's number can see that guest's room number. That is the right trade for a
wedding, but it is a trade — don't put anything genuinely sensitive in a guest's
personal message. Guests can never list the guest list, and your private
`notes` column is never sent to the browser.

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

## Collecting RSVPs

With Supabase connected, replies from the invitation form land in the `rsvps`
table, and if the number is already on your guest list their row is updated
too. Without it, replies are saved in the guest's own browser — so in practice
most RSVPs will arrive by phone and WhatsApp and you will type them into the
Guests screen, which is fine.

To turn on the "Send on WhatsApp" button, set `RSVP_WHATSAPP` at the top of
`js/invite.js` to a number with country code and no `+` or spaces, e.g.
`'919876543210'`.

## Changing the plan

All content is in **`js/data.js`** — couple details, functions, schedules, décor, menus, budget lines, venue shortlist, vendors, checklist, risks. Edit that one file and both pages update. No build, no restart.

If you change budget amounts, keep the total at ₹20,00,000 or the dashboard will tell you it does not add up.

## Publishing it

It is a static site with no build step, so anything works: GitHub Pages,
Netlify, Vercel or Cloudflare Pages. Step-by-step instructions are in
**[`SETUP.md`](SETUP.md)**.

`planner.html` carries `noindex` so it stays out of search results, but **it is not password-protected** — anyone with the link can read it. If that matters, publish only `index.html` and its `assets/` and `js/` folders, and keep `planner.html` local.

## Tests

Two layers, neither needing any installed packages.

```sh
# 63 unit checks — no browser
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc tools/smoke-test.js

# 31 checks in a real headless Chrome
python3 tools/cdp.py check

# screenshots of every page, desktop and mobile, into /tmp/shots
python3 tools/cdp.py shots
```

The unit tests cover the budget still summing to ₹20,00,000, per-plate figures
matching the budget lines, Indian number formatting, CSV round-trips through
commas and quotes, the store's add/update/remove/import/backup paths, phone
number normalisation, guest lookup (including that private notes never reach
the portal), the Supabase export column names, and every screen rendering with
zero guests, twenty and four hundred.

The browser tests drive a real Chrome over the DevTools protocol: they tap the
doors open, type a number into the portal, check an unknown number is refused
and a real one loads the right guest, save an RSVP, and assert that no element
is ever left invisible by a failed animation. `tools/cdp.py` is a small
from-scratch WebSocket and CDP client, so there is nothing to install.
