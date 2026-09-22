/* Renders the guest-facing invitation from W.data. */
(function (W) {
  'use strict';

  const U = W.util, D = W.data, M = W.motifs, MO = W.motion, el = U.el, $ = U.$;

  /* Number that receives RSVPs on WhatsApp. Country code, no + or spaces.
     Leave blank to hide the button. */
  const RSVP_WHATSAPP = '';

  /* ---------------- ornament injection ---------------- */

  function paintOrnaments() {
    $('#door-l').innerHTML = M.doorPanel('l', 'L');
    $('#door-r').innerHTML = M.doorPanel('r', 'R');
    $('#hero-mandala').innerHTML = M.mandalaSvg('', 24, 'currentColor');
    $('#foot-mandala').innerHTML = M.mandalaSvg('', 20, 'currentColor');
    $('#feather-l').innerHTML = M.peacockFeather('currentColor', 'currentColor');
    $('#feather-r').innerHTML = M.peacockFeather('currentColor', 'currentColor');
    $('#corner-bl').innerHTML = M.corner('currentColor');
    $('#corner-br').innerHTML = M.corner('currentColor');

    const strands = window.innerWidth < 700 ? 9 : (window.innerWidth < 1100 ? 14 : 20);
    $('#hero-garland').innerHTML = M.garlandRow(strands, 7);
  }

  /* ---------------- the gate ---------------- */

  function initGate() {
    const gate = $('#gate');
    const ring = $('#gate-ring');
    if (!gate) return;

    // Skip the doors on repeat visits in the same session, and via ?open=1.
    let skip = /[?&]open=1/.test(location.search);
    try { skip = skip || sessionStorage.getItem('vm-opened') === '1'; } catch (e) { /* ignore */ }
    if (skip) {
      gate.classList.add('is-open', 'is-done');
      document.body.classList.remove('is-locked');
      return;
    }

    function open() {
      try { sessionStorage.setItem('vm-opened', '1'); } catch (e) { /* ignore */ }
      MO.openDoors(gate);
    }

    ring.addEventListener('click', open);
    ring.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
    // Tapping anywhere on the doors works too.
    gate.addEventListener('click', function (e) {
      if (e.target === ring) return;
      open();
    });
  }

  /* ---------------- countdown ---------------- */

  function initCountdown() {
    const host = $('#countdown');
    if (!host) return;
    const target = new Date(2027, 1, 2, 11, 0, 0); // phere muhurat
    const units = [['Days', 'd'], ['Hours', 'h'], ['Minutes', 'm'], ['Seconds', 's']];
    const cells = {};

    units.forEach(function (u) {
      const b = el('b', { text: '0' });
      cells[u[1]] = b;
      host.appendChild(el('div', { class: 'cd', 'data-reveal': 'up' }, [
        b, el('span', { text: u[0] })
      ]));
    });

    function tick() {
      const diff = target - new Date();
      if (diff <= 0) {
        Object.keys(cells).forEach(function (k) { cells[k].textContent = '0'; });
        return;
      }
      MO.rollTo(cells.d, Math.floor(diff / 86400000), 700);
      MO.rollTo(cells.h, Math.floor(diff / 3600000) % 24, 400);
      MO.rollTo(cells.m, Math.floor(diff / 60000) % 60, 300);
      cells.s.textContent = String(Math.floor(diff / 1000) % 60);
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------- function cards ---------------- */

  function renderFunctions() {
    const host = $('#fn-grid');
    if (!host) return;
    const glyphs = [M.paisley, M.kalash, M.peacockFeather, M.mandalaSvg, M.paisley];

    D.functions.filter(function (f) { return f.publicInvite; }).forEach(function (f, i) {
      const rows = el('div', { class: 'fn__rows' });
      function row(label, value) {
        rows.appendChild(el('div', { class: 'fn__row' }, [
          el('b', { text: label }), el('span', { html: value })
        ]));
      }
      row('When', U.fmtDate(f.date, true));
      row('Time', f.muhurat
        ? f.start + ' onwards · <strong>muhurat ' + f.muhurat + '</strong>'
        : f.start + ' – ' + f.end);
      row('Where', f.area);
      row('Dress', f.dressCode);

      const glyphFn = glyphs[i % glyphs.length];
      const glyph = glyphFn === M.mandalaSvg ? M.mandalaSvg('', 16, 'currentColor') : glyphFn('currentColor');

      host.appendChild(el('article', {
        class: 'fn sweep', 'data-reveal': 'rise', 'data-tilt': '6'
      }, [
        el('div', { class: 'tilt-sheen' }),
        el('div', { class: 'fn__glyph', html: glyph }),
        el('div', { class: 'fn__no', text: 'Function ' + String(i + 1).padStart(2, '0') }),
        el('h3', { class: 'fn__name', text: f.name }),
        el('div', { class: 'fn__tag', text: f.tagline }),
        f.blurb ? el('p', { class: 'fn__blurb', text: f.blurb }) : null,
        rows,
        f.optional ? el('div', { class: 'fn__note', text: 'Optional and informal — for guests already in Udaipur.' }) : null
      ]));
    });
  }

  /* ---------------- schedule ---------------- */

  const KEY = /HALDI|RING CEREMONY|Sangeet begins|BARAAT|VARMALA|PHERE|Couple entry|Vidaai|Rooms open/i;

  function sortKey(t) {
    const parts = String(t).split(':');
    const mins = Number(parts[0]) * 60 + Number(parts[1] || 0);
    return mins < 4 * 60 ? mins + 24 * 60 : mins;
  }

  function renderSchedule() {
    const host = $('#schedule-body');
    if (!host) return;
    const byDate = U.groupBy(
      D.functions.filter(function (f) { return f.publicInvite; }),
      function (f) { return f.date; }
    );

    Object.keys(byDate).sort().forEach(function (date, idx) {
      const items = [];
      byDate[date].forEach(function (f) {
        // A null second element marks a vendor-only beat — never show those here.
        f.schedule.forEach(function (r) {
          if (r[1]) items.push({ t: r[0], text: r[1] });
        });
      });
      // A 00:30 close belongs at the end of the evening it finishes, not at
      // dawn — anything before 04:00 sorts as the small hours of the next day.
      items.sort(function (a, b) { return sortKey(a.t) - sortKey(b.t); });

      host.appendChild(el('div', { class: 'day', 'data-reveal': 'up' }, [
        el('div', { class: 'day__head' }, [
          el('h3', { text: U.fmtDate(date, true) }),
          el('span', { text: 'Day ' + (idx + 1) })
        ]),
        el('ul', { class: 'tl' }, items.map(function (it) {
          return el('li', { class: KEY.test(it.text) ? 'is-key' : '' }, [
            el('time', { text: it.t }), el('p', { text: it.text })
          ]);
        }))
      ]));
    });
  }

  /* ---------------- travel ---------------- */

  function renderTravel() {
    const host = $('#travel-grid');
    if (!host) return;
    const t = D.venue.travel;

    [
      ['By air', '<strong>' + t.airport + '</strong><br>We run shared pickups. Share your flight details in the RSVP form and we will arrange it.'],
      ['By train', '<strong>' + t.rail + '</strong><br>Pickups from the station too — just tell us your train and arrival time.'],
      ['By road', t.road + '<br>Parking is available at the venue.'],
      ['Weather &amp; packing', t.weather + '<br><strong>' + t.pack + '</strong>'],
      ['Where to stay', 'You are staying with us — rooms are held for you at the wedding venue itself, so there is nothing for you to book.<br>Room details go out with the formal invitation, and your own room shows up on <a href="guest.html">your guest page</a> once it is allotted.', 'half'],
      ['While you are here', WHILE_HERE, 'wide']
    ].forEach(function (c) {
      // The four travel modes are short enough to sit four across; the two prose
      // cards need a wider column or the lines wrap every four words.
      host.appendChild(el('div', {
        class: 'info sweep' + (c[2] ? ' info--' + c[2] : ''),
        'data-reveal': 'up', 'data-tilt': c[2] === 'wide' ? null : '5'
      }, [
        el('div', { class: 'tilt-sheen' }),
        el('h4', { html: c[0] }),
        el('p', { html: c[1] })
      ]));
    });
  }

  /* Udaipur, ordered so it is actually usable: what fits in a spare morning,
     what needs a whole day, and what to bring home. Each block is its own
     element so the multi-column layout cannot split a heading from its list. */
  const WHILE_HERE = [
    ['', 'Udaipur deserves more than a wedding weekend. If you can, come a day early or leave a day late.'],
    ['A spare morning',
      'City Palace and the Crystal Gallery · Jagdish Temple, five minutes uphill · ' +
      'Bagore ki Haveli, then its folk dance show at 19:00 — buy tickets by 18:15, it fills up.'],
    ['A spare evening',
      'A Lake Pichola boat from Rameshwar Ghat around 17:00, for the light on Jag Mandir · ' +
      'sunset from Sajjangarh Monsoon Palace · Ambrai or Upre for dinner across the water from the palace.'],
    ['A whole spare day',
      'Kumbhalgarh Fort with the Ranakpur Jain temples on the way back (2 hr each way, share a cab) · ' +
      'Shilpgram for crafts · Eklingji and Nagda, 22 km north.'],
    ['To bring home',
      'Pichwai and miniature painting, bandhej and leheriya, Molela clay plaques, ' +
      'juttis and silver from Bada Bazaar and Hathi Pol. Bargain, kindly.'],
    ['', 'Ask any of us for directions — half the family has done all of it twice.']
  ].map(function (b) {
    return '<span class="wh">' + (b[0] ? '<b>' + b[0] + '</b>' : '') + b[1] + '</span>';
  }).join('');

  /* ---------------- RSVP ---------------- */

  function renderRsvp() {
    const host = $('#rsvp-card');
    if (!host) return;
    const shown = D.functions.filter(function (f) { return f.publicInvite; });

    const fnBoxes = el('div', { class: 'rsvp-fns' }, shown.map(function (f) {
      return el('label', { class: 'check' }, [
        el('input', { type: 'checkbox', name: 'fn', value: f.id, checked: 'checked' }),
        el('span', { text: f.name })
      ]);
    }));

    function field(label, input) { return el('label', { class: 'field' }, [el('span', { html: label }), input]); }
    function sel(name, options) {
      return el('select', { name: name }, options.map(function (o) { return el('option', { value: o, text: o }); }));
    }

    const form = el('form', { id: 'rsvp-form', novalidate: 'novalidate' }, [
      el('div', { class: 'grid-2' }, [
        field('Your name (or family name)', el('input', { type: 'text', name: 'name', placeholder: 'e.g. Sharma Family' })),
        field('Mobile number', el('input', { type: 'tel', name: 'phone', placeholder: '10 digits', inputmode: 'numeric' }))
      ]),
      el('div', { class: 'grid-2' }, [
        field('City you travel from', el('input', { type: 'text', name: 'city', placeholder: 'e.g. Delhi' })),
        field('Whose side?', sel('side', ['Bride — Mahak', 'Groom — Vaibhav']))
      ]),
      field('Will you join us?', sel('attending', ['Yes, joyfully', 'Yes, but only for some functions', 'Sadly cannot make it'])),
      el('div', { class: 'grid-2' }, [
        field('Adults attending', el('input', { type: 'number', name: 'adults', min: '0', value: '1' })),
        field('Children attending', el('input', { type: 'number', name: 'kids', min: '0', value: '0' }))
      ]),
      field('Which functions will you attend?', fnBoxes),
      el('div', { class: 'grid-2' }, [
        field('Food preference', sel('diet', D.DIETS)),
        field('Arriving in Udaipur on', el('input', { type: 'date', name: 'arrival', value: '2027-01-31', min: '2027-01-25', max: '2027-02-05' }))
      ]),
      el('div', { class: 'grid-2' }, [
        field('Travelling by', sel('mode', ['Flight', 'Train', 'Car', 'Bus', 'Not decided'])),
        field('Flight / train number &amp; arrival time', el('input', { type: 'text', name: 'travelDetail', placeholder: 'e.g. 6E 6521, 14:30' }))
      ]),
      field('Anything we should know?', el('textarea', {
        name: 'notes', placeholder: 'Room preferences, mobility needs, allergies, a song request for the sangeet…'
      })),
      el('div', { style: 'display:flex;gap:11px;flex-wrap:wrap;margin-top:8px' }, [
        el('button', { class: 'btn', type: 'submit' }, el('span', { text: 'Send RSVP' })),
        RSVP_WHATSAPP ? el('button', { class: 'btn btn--ghost', type: 'button', id: 'rsvp-wa' }, el('span', { text: 'Send on WhatsApp' })) : null
      ]),
      el('p', { class: 'hint', style: 'margin-top:14px', text:
        'If you would rather just call, the numbers are on the printed card.' })
    ]);

    U.clear(host).appendChild(form);
    form.addEventListener('submit', onSubmit);
    const wa = $('#rsvp-wa');
    if (wa) wa.addEventListener('click', function () { sendWhatsApp(collect(form)); });
  }

  function collect(form) {
    const fd = new FormData(form);
    return {
      name: (fd.get('name') || '').trim(),
      phone: (fd.get('phone') || '').trim(),
      city: (fd.get('city') || '').trim(),
      side: /Groom/.test(fd.get('side')) ? 'Groom' : 'Bride',
      attending: fd.get('attending'),
      adults: Number(fd.get('adults')) || 0,
      kids: Number(fd.get('kids')) || 0,
      functions: U.$$('input[name=fn]:checked', form).map(function (i) { return i.value; }),
      diet: fd.get('diet'),
      arrival: fd.get('arrival'),
      mode: fd.get('mode'),
      travelDetail: (fd.get('travelDetail') || '').trim(),
      notes: (fd.get('notes') || '').trim()
    };
  }

  function rsvpText(r) {
    const names = r.functions.map(function (id) {
      const f = D.functions.find(function (x) { return x.id === id; });
      return f ? f.name : id;
    });
    return [
      'RSVP — Vaibhav & Mahak',
      'Name: ' + r.name,
      'Side: ' + r.side + (r.city ? ' · from ' + r.city : ''),
      'Attending: ' + r.attending,
      'Guests: ' + r.adults + ' adults, ' + r.kids + ' children',
      'Functions: ' + (names.join(', ') || '—'),
      'Food: ' + r.diet,
      'Arriving: ' + (r.arrival || '—') + ' by ' + r.mode + (r.travelDetail ? ' (' + r.travelDetail + ')' : ''),
      r.phone ? 'Phone: ' + r.phone : '',
      r.notes ? 'Notes: ' + r.notes : ''
    ].filter(Boolean).join('\n');
  }

  function sendWhatsApp(r) {
    if (!r.name) { U.toast('Please add your name first.', 'warn'); return; }
    window.open('https://wa.me/' + RSVP_WHATSAPP + '?text=' + encodeURIComponent(rsvpText(r)), '_blank');
  }

  function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const r = collect(form);
    if (!r.name) {
      U.toast('Please tell us your name.', 'warn');
      form.querySelector('[name=name]').focus();
      return;
    }

    const btn = form.querySelector('button[type=submit]');
    if (btn) btn.disabled = true;

    // Try the database first; fall back to local storage so a reply is never lost.
    const send = (W.db && W.db.isConfigured())
      ? W.db.submitRsvp(r)
      : Promise.reject(new Error('not configured'));

    send.catch(function () { W.store.submitRsvp(r); })
      .then(function () { showDone(r); });
  }

  function showDone(r) {
    const host = $('#rsvp-card');
    U.clear(host);
    host.appendChild(el('div', { class: 'done' }, [
      el('div', { class: 'done__tick', text: '✓' }),
      el('h3', { text: 'Thank you, ' + r.name.split(' ')[0] + '!' }),
      el('p', {
        html: /cannot/.test(r.attending)
          ? 'We will miss you, truly. Thank you for letting us know — we will raise a glass in your name.'
          : 'We have your reply. We will be in touch about your room and pickup closer to the date.'
      }),
      el('div', { class: 'orn' }, el('i', { text: '❁' })),
      el('div', { style: 'display:flex;gap:11px;justify-content:center;flex-wrap:wrap' }, [
        el('button', {
          class: 'btn btn--ghost', type: 'button',
          onclick: function () {
            if (!navigator.clipboard) { U.toast('Copy is not supported here.', 'warn'); return; }
            navigator.clipboard.writeText(rsvpText(r))
              .then(function () { U.toast('Copied — paste it to us on WhatsApp.'); });
          }
        }, el('span', { text: 'Copy my reply' })),
        el('a', { class: 'btn btn--gold', href: 'guest.html' }, el('span', { text: 'See my details' })),
        el('button', {
          class: 'btn btn--ghost', type: 'button',
          onclick: function () { renderRsvp(); host.scrollIntoView({ behavior: 'smooth' }); }
        }, el('span', { text: 'Add another family' }))
      ])
    ]));
  }

  /* ---------------- calendar & share ---------------- */

  function initActions() {
    const ics = $('#btn-ics');
    if (ics) ics.addEventListener('click', function () {
      const events = D.functions.filter(function (f) { return f.publicInvite; }).map(function (f) {
        return {
          uid: f.id, date: f.date, start: f.start, end: f.end,
          title: f.name + ' — Vaibhav & Mahak',
          location: 'Udaipur, Rajasthan',
          description: f.tagline + '\nDress code: ' + f.dressCode
        };
      });
      U.download('vaibhav-mahak-wedding.ics', U.buildICS(events, 'Vaibhav & Mahak'), 'text/calendar');
      U.toast('Calendar file downloaded — open it to add every function.');
    });

    const share = $('#btn-share');
    if (share) share.addEventListener('click', function () {
      const payload = {
        title: 'Vaibhav & Mahak — Udaipur, 2 Feb 2027',
        text: 'We are getting married in Udaipur! 1 & 2 February 2027. Details and RSVP:',
        url: location.href.split('?')[0]
      };
      if (navigator.share) navigator.share(payload).catch(function () { /* dismissed */ });
      else if (navigator.clipboard) {
        navigator.clipboard.writeText(payload.text + ' ' + payload.url)
          .then(function () { U.toast('Invitation link copied.'); });
      } else U.toast('Copy the link from the address bar to share.', 'warn');
    });
  }

  /* ---------------- boot ---------------- */

  document.addEventListener('DOMContentLoaded', function () {
    paintOrnaments();
    initGate();
    initCountdown();
    renderFunctions();
    renderSchedule();
    renderTravel();
    renderRsvp();
    initActions();

    MO.boot(document);
    MO.initProgress($('#thread'));
    MO.initStickyNav($('#nav'), 140);
    MO.initSmoothLinks(document);
    MO.petals($('#hero-petals'), { count: 30, speed: 1 });
  });
})(window.W);
