# Vaibhav & Mahak — Udaipur, February 2027

Three things live in this folder:

1. **[`PLAN.md`](PLAN.md)** — the wedding plan. Budget, function sequence, décor, menus, venue shortlist, risks. Read this first.
2. **[`SETUP.md`](SETUP.md)** — how to put the site online and connect the guest database.
3. **A website** with three pages:
   - **`index.html`** — the invitation from Vaibhav's family, and **`mahak.html`** the same invitation from Mahak's. Share these with guests.
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

It opens on a pair of carved jharokha doors sealed with a wax seal — the V·M
monogram inside a ring of Mewar sun rays. Tapping it cracks the seal in two, a
soft shehnai begins (with a pause button in the nav, remembered for next time),
and the doors swing apart onto an arch card with your names and both sets of
parents in gold. Below that, everything a guest needs, in this order:

- **What our family does** — a short list of the family's own part in each
  function, linked to the programme. Each family's card shows its own.
- **The programme** — 23 events across 1–3 February, with time, place,
  "be seated by" times, who each is for and the family's part in it. Each card
  leaves out the other family's private ceremonies, so Vaibhav's shows 21 and
  Mahak's 22. The eleven moments people
  travel for each carry a Mewar-style miniature painting in a cusped Rajput arch.
- **The venue** — a drone flight: a real 3D map (satellite imagery over
  elevation data) that the guest flies by scrolling, from Lake Pichola past the
  City Palace and Fateh Sagar, east over the Aravallis, down onto Hotel
  Khumani's rooftop, where the painted hotel rises over the real one. Then the
  address, directions, a call button, what happens where, and distances.
- **Stay, travel and weather** — arrival and early-arrival rooms, checkout,
  meals, pickups, routes by road, packing, and a live forecast that switches on
  in the last two weeks (Open-Meteo, no key).
- **Questions** — 9 answers with a search box that works in both scripts.
- **Help desk** — tap-to-call hotel numbers, the nearest 24-hour hospital
  (500 m) and 112.
- **RSVP**, and a link to the guest's own page.

The whole page switches between **English and Hindi** from the nav (or the gate)
and remembers the choice. The Hindi is written, not machine-translated, and set
properly: Devanagari is never letter-spaced or split into characters, because
both break the headline the letters hang from.

On the wedding days a **live ribbon** shows what is happening now and what is
next, and highlights it in the programme. Try it with
`index.html?open=1&now=2027-02-01T20:10`. The calendar file carries every event
with a reminder 10–30 minutes before each key one — the main defence against
people arriving late, along with published times that never overlap.

The paintings are in `assets/art/`, the shehnai in `assets/audio/`, and the
WhatsApp preview images are `assets/og.jpg` and `assets/og-mahak.jpg`, made by
`python3.11 tools/make-og.py` (it needs Pillow). Credits are in the footer.

The palette is maroon, sindoor red, saffron, marigold and gold — a shaadi joda,
not a Mughal one. Colours live in `assets/css/tokens.css` and nowhere else, so
the whole site re-tints from that one file.

The layout is editorial rather than centred. Every size on the page comes from
one fluid scale in `tokens.css`, topping out around 9rem, because the page has no
photography and the headlines have to do that work instead. Section heads set
their title large and left against a hairline rule with an index number in the
margin, and the standfirst in the opposite column — centring all of them was what
made the page read as one flat band after another. In the programme the painted
moments alternate either side of a gold thread on wide screens and stack along
it on phones; meals and rest sit on the thread as small cards. A fixed
film-grain layer over everything keeps the large flat fills from looking
machine-made.

Motion is tied to meaning rather than sprinkled on. The two script names are
revealed by an ink wipe that uncovers them left to right, since the face joins
its letters and cutting it into characters breaks the joins; the display-face
headings, which have separated letterforms, do split and rise character by
character. The running order draws its own rail as you scroll it, using native
CSS `animation-timeline`. That last one is additive only: it is about 85% of
browsers and Firefox still has it behind a flag, so it sits inside an
`@supports (animation-timeline: scroll())` block and the rail simply stays fully
drawn everywhere else.

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

## Two cards, two addresses

There is one invitation, which speaks for whichever family sent it. On
Mahak's card her name comes first, the line above the names says the Kalra
family invites you, the seal reads M·V, and the parents swap sides. Each card
shows its own family's part in each function, its own RSVP number, and only
the ceremonies its guests attend: Ganesh puja and the tel ceremony are Mahak's
side's, the sehra bandi is Vaibhav's. The hashtag is #VaibhavWedsMahak on both.

The family is picked by `js/side.js`, in this order: `data-side="bride"` on the
page (that is what `mahak.html` is), `?side=bride` in the address, or a
hostname containing `mahakwedsvaibhav`. Everything else is Vaibhav's card.
Nothing is remembered, so one phone can open both.

`mahak.html` is generated from `index.html`, because WhatsApp reads the preview
title and image before any script runs. **After editing `index.html`, run
`python3 tools/build-sides.py`**; the browser tests fail if you forget.

Who does what in each function is the `role` field on each event in
`js/data.js`, with a `groom` and a `bride` line. The ones there now are a first
draft: each family should read its own card and correct them. Some interface
words have a per-family version, written `key@bride` in `js/i18n.js`.

### Putting each card on its own address

GitHub Pages serves only one custom domain per repository, so for
`vaibhavwedsmahak.in` and `mahakwedsvaibhav.in` the site moves to Cloudflare
Pages, which is free and can serve both from this repository.

1. Buy both domains from any registrar.
2. Make a free Cloudflare account. Go to *Workers & Pages → Create → Pages →
   Connect to Git* and pick this repository. There is no build command, and the
   output directory is the root (`/`).
3. In the project's *Custom domains*, add both. Cloudflare will ask you to point
   each domain's nameservers at it; do that at the registrar.
4. `functions/_middleware.js` then serves Mahak's card at the root of
   `mahakwedsvaibhav.in`. Vaibhav's address serves `index.html` as usual.
5. Change the absolute preview-image link (`og:image`) in `index.html` to the
   new address, then run `python3 tools/build-sides.py`, which carries it into
   `mahak.html`. WhatsApp needs the full address there, not a relative one.
6. Send each family its own link, and test both by pasting them into a WhatsApp
   chat with yourself before sending them out.

Until then, Mahak's card is `mahak.html` beside `index.html` on GitHub Pages.

## The guest portal

`guest.html` asks for a mobile number and shows that guest — and only that
guest — their own page:

- the room number and hotel, and whether it is on you
- only the functions they are actually invited to, with timings
- their arrival, and the pickup you have arranged for them
- their table at the reception
- a personal line you have written for them
- photo albums as the photographers deliver them
- a wedding guide: arriving, weather, what to pack, things to do in Udaipur
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

To turn on the "Send on WhatsApp" button, set `rsvpWhatsapp` for each family in
`sides` near the top of `js/data.js`, to a number with country code and no `+`
or spaces, e.g. `'919876543210'`. Each card sends its replies to its own
family.

## Changing the plan

All content is in **`js/data.js`** — couple details, functions, décor, menus, budget lines, venue, vendors, checklist, risks — and above all **`programme`**, the single list of every event and its time. The invitation, the guest portal, the calendar file and the planner's run sheets all read it, so a time only ever changes in one place. Each entry has `[english, hindi]` text; `ops` holds a planner-only note that guests never see.

The rest of the guest copy — stay, travel, the questions, the help desk and the flight's waypoints — is in **`js/content.js`**, and the interface strings are in **`js/i18n.js`**, both in English and Hindi. The smoke test fails if a Hindi line is missing.

`toConfirm` at the bottom of `data.js` lists what the site already publishes but you have not settled yet (the muhurat, help-desk numbers, where the phere happen, a second hotel past 170 staying guests, each family's part, the two addresses). It shows on the planner dashboard; delete each line once it is confirmed.

If you change budget amounts, keep the total at ₹20,00,000 or the dashboard will tell you it does not add up.

## Publishing it

It is a static site with no build step, so anything works: GitHub Pages,
Netlify, Vercel or Cloudflare Pages. Step-by-step instructions are in
**[`SETUP.md`](SETUP.md)**. For the two family addresses, use Cloudflare Pages
(see *Two cards, two addresses* above).

`planner.html` carries `noindex` so it stays out of search results, but **it is not password-protected** — anyone with the link can read it. If that matters, publish only `index.html` and its `assets/` and `js/` folders, and keep `planner.html` local.

## Tests

Two layers, neither needing any installed packages.

```sh
# 103 unit checks — no browser
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc tools/smoke-test.js

# 95 checks in a real headless Chrome
python3 tools/cdp.py check

# screenshots of every page, desktop and mobile, into /tmp/shots
python3 tools/cdp.py shots

# one section at a time, framed and full-height — for judging type and spacing
python3 tools/cdp.py zoom
```

The unit tests cover the budget still summing to ₹20,00,000, per-plate figures
matching the budget lines, Indian number formatting, CSV round-trips through
commas and quotes, the store's add/update/remove/import/backup paths, phone
number normalisation, guest lookup (including that private notes never reach
the portal), the Supabase export column names, and every screen rendering with
zero guests, twenty and four hundred. They also hold the schedule to its rules:
the programme is in time order, published times never overlap the moments
guests must attend, each breakfast closes on paper before the next event, the
bride has at least two and a half hours between the tel ceremony and the
varmala, and planner notes never leak into guest text. Every guest-facing line
must exist in both languages, and a completeness audit fails the build if any of
21 questions a guest will ask — arrival, checkout, pickups, meals,
each family's part, weather, elders, the hospital — has no answer on the site. Other checks hold the
families' decisions: no dress guidance, none of the dropped questions, no
"underground" anywhere, no bar and no mention of drinks, and a sagaai that is
the couple's dance into the rings with a live singer. Each card must name its
own family and keep to its own ceremonies, in both languages.

The browser tests drive a real Chrome over the DevTools protocol: they break the
seal and open the doors, render every event on the card and load its paintings,
open Mahak's card and check her name leads, her family's ceremonies appear and
the RSVP defaults to her side, check `mahak.html` is up to date with `index.html`,
switch the page to Hindi and back, fake the clock to the evening of 1 February to
check the live ribbon, fly the map to the hotel, read the calendar file for its
reminders and the after-party's 1 am finish, type a number into the portal, check
an unknown number is refused and a real one loads the right guest, save an RSVP,
and assert that no element is ever left invisible by a failed animation. They
also hold the layout in place: that the paintings alternate sides on a wide
screen, that section heads stay asymmetric and at display scale, that split
headings keep an `aria-label` while their characters stay hidden from assistive
tech, that the script names are wiped rather than cut into characters, and that
neither page scrolls sideways at 360px. The names must be written by the scroll
observer rather than its safety timer, and held behind the doors until they part.
On the flight, no landmark label may sit on the caption or hang off an edge.
`tools/cdp.py` is a small from-scratch
WebSocket and CDP client, so there is nothing to install.
