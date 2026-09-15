/* Renders the guest-facing invitation from W.data. */
(function (W) {
  'use strict';

  const U = W.util, D = W.data, el = U.el, $ = U.$;

  /* Set this to the number that should receive RSVPs on WhatsApp.
     Country code, no + and no spaces. Leave blank to hide the button. */
  const RSVP_WHATSAPP = '';

  /* ---------- opener ---------- */

  function initOpener() {
    const opener = $('#opener');
    const btn = $('#opener-btn');
    if (!opener) return;
    // Only curtain on the first visit of a session; repeat visits go straight in.
    // ?open=1 skips it entirely — handy for deep links and printing.
    let seen = /[?&]open=1/.test(location.search);
    try { seen = seen || sessionStorage.getItem('vm-opened') === '1'; } catch (e) { /* ignore */ }
    if (seen) { opener.classList.add('is-open'); opener.style.display = 'none'; return; }
    document.body.style.overflow = 'hidden';
    function open() {
      opener.classList.add('is-open');
      document.body.style.overflow = '';
      try { sessionStorage.setItem('vm-opened', '1'); } catch (e) { /* ignore */ }
      setTimeout(function () { opener.style.display = 'none'; }, 900);
    }
    btn.addEventListener('click', open);
    opener.addEventListener('click', function (e) { if (e.target === opener) open(); });
  }

  /* ---------- garland ---------- */

  function initGarland() {
    const host = $('#garland');
    if (!host) return;
    const n = Math.min(48, Math.max(18, Math.floor(window.innerWidth / 26)));
    for (let i = 0; i < n; i++) host.appendChild(el('i'));
  }

  /* ---------- countdown ---------- */

  function initCountdown() {
    const host = $('#countdown');
    if (!host) return;
    const target = new Date(2027, 1, 2, 11, 0, 0); // 2 Feb 2027, 11:00 — phere muhurat

    function tick() {
      const diff = target - new Date();
      U.clear(host);
      if (diff <= 0) {
        host.appendChild(el('div', { class: 'cd' }, [
          el('b', { text: '❁' }), el('span', { text: 'Married' })
        ]));
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor(diff / 3600000) % 24;
      const m = Math.floor(diff / 60000) % 60;
      const s = Math.floor(diff / 1000) % 60;
      [[d, 'Days'], [h, 'Hours'], [m, 'Minutes'], [s, 'Seconds']].forEach(function (p) {
        host.appendChild(el('div', { class: 'cd' }, [
          el('b', { text: String(p[0]) }), el('span', { text: p[1] })
        ]));
      });
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- function cards ---------- */

  function renderFunctions() {
    const host = $('#fn-grid');
    if (!host) return;
    const shown = D.functions.filter(function (f) { return f.publicInvite; });
    shown.forEach(function (f, i) {
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

      host.appendChild(el('article', { class: 'fn reveal' }, [
        el('div', { class: 'fn__no', text: 'Function ' + String(i + 1).padStart(2, '0') }),
        el('h3', { class: 'fn__name', text: f.name }),
        el('div', { class: 'fn__tag', text: f.tagline }),
        rows,
        f.optional ? el('div', { class: 'fn__note', text: 'Optional and informal — for guests already in Udaipur.' }) : null
      ]));
    });
  }

  /* ---------- timeline ---------- */

  const KEY_WORDS = /HALDI|RING|SANGEET|BARAAT|VARMALA|PHERE|Couple entry|Guest arrival \(650\)|Vidaai|mehndi begins/;

  function renderTimeline() {
    const host = $('#timeline-body');
    if (!host) return;
    const byDate = U.groupBy(D.functions.filter(function (f) { return f.publicInvite; }), function (f) { return f.date; });
    Object.keys(byDate).sort().forEach(function (date, idx) {
      const items = [];
      byDate[date].forEach(function (f) {
        f.schedule.forEach(function (row) { items.push({ t: row[0], text: row[1] }); });
      });
      items.sort(function (a, b) { return a.t.localeCompare(b.t); });

      const list = el('ul', { class: 'tl' });
      items.forEach(function (it) {
        list.appendChild(el('li', { class: KEY_WORDS.test(it.text) ? 'is-key' : '' }, [
          el('time', { text: it.t }),
          el('p', { text: it.text })
        ]));
      });

      host.appendChild(el('div', { class: 'day reveal' }, [
        el('div', { class: 'day__head' }, [
          el('h3', { text: U.fmtDate(date, true) }),
          el('span', { text: 'Day ' + idx })
        ]),
        list
      ]));
    });
  }

  /* ---------- travel ---------- */

  function renderTravel() {
    const host = $('#travel-grid');
    if (!host) return;
    const t = D.venue.travel;

    const cards = [
      ['By air', '<strong>' + t.airport + '</strong><br>We will run shared pickups. Share your flight details in the RSVP form and we will arrange it.'],
      ['By train', '<strong>' + t.rail + '</strong><br>Pickups from the station too — just tell us your train and arrival time.'],
      ['By road', t.road + '<br>Parking is available at the venue.'],
      ['Weather &amp; packing', t.weather + '<br><strong>' + t.pack + '</strong>'],
      ['Where to stay', 'Rooms are blocked at the wedding venue at a negotiated rate. The booking link and rate will be sent with the formal invitation in December.'],
      ['While you are here', 'City Palace, Lake Pichola boat ride at sunset, Sajjangarh Monsoon Palace, Bagore ki Haveli evening dance show, Shilpgram. Stay on a day — it is worth it.']
    ];

    cards.forEach(function (c) {
      host.appendChild(el('div', { class: 'info reveal' }, [
        el('h4', { html: c[0] }),
        el('p', { html: c[1] })
      ]));
    });
  }

  /* ---------- RSVP ---------- */

  function renderRsvp() {
    const host = $('#rsvp-card');
    if (!host) return;
    const shown = D.functions.filter(function (f) { return f.publicInvite; });

    const fnBoxes = el('div', { class: 'rsvp-fns' });
    shown.forEach(function (f) {
      fnBoxes.appendChild(el('label', { class: 'check' }, [
        el('input', { type: 'checkbox', name: 'fn', value: f.id, checked: f.id !== 'mehndi' }),
        el('span', { text: f.name })
      ]));
    });

    const form = el('form', { id: 'rsvp-form', novalidate: 'novalidate' }, [
      el('div', { class: 'grid-2' }, [
        field('Your name (or family name)', el('input', { type: 'text', name: 'name', required: 'required', placeholder: 'e.g. Sharma Family' })),
        field('Mobile number', el('input', { type: 'tel', name: 'phone', placeholder: '10 digits' }))
      ]),
      el('div', { class: 'grid-2' }, [
        field('City you are travelling from', el('input', { type: 'text', name: 'city', placeholder: 'e.g. Delhi' })),
        field('Whose side?', select('side', ['Bride — Mahak', 'Groom — Vaibhav']))
      ]),
      el('label', { class: 'field' }, [
        el('span', { text: 'Will you join us?' }),
        select('attending', ['Yes, joyfully', 'Yes, but only for some functions', 'Sadly cannot make it'])
      ]),
      el('div', { class: 'grid-2' }, [
        field('Adults attending', el('input', { type: 'number', name: 'adults', min: '0', value: '1' })),
        field('Children attending', el('input', { type: 'number', name: 'kids', min: '0', value: '0' }))
      ]),
      el('label', { class: 'field' }, [
        el('span', { text: 'Which functions will you attend?' }),
        fnBoxes
      ]),
      el('div', { class: 'grid-2' }, [
        field('Food preference', select('diet', D.DIETS)),
        field('Arriving in Udaipur on', el('input', { type: 'date', name: 'arrival', value: '2027-01-31', min: '2027-01-25', max: '2027-02-05' }))
      ]),
      el('div', { class: 'grid-2' }, [
        field('Travelling by', select('mode', ['Flight', 'Train', 'Car', 'Bus', 'Not decided'])),
        field('Flight / train number &amp; arrival time', el('input', { type: 'text', name: 'travelDetail', placeholder: 'e.g. 6E 6521, 14:30' }))
      ]),
      field('Anything we should know?', el('textarea', { name: 'notes', placeholder: 'Room preferences, mobility needs, allergies, a song request for the sangeet…' })),
      el('div', { style: 'display:flex;gap:10px;flex-wrap:wrap;margin-top:6px' }, [
        el('button', { class: 'btn', type: 'submit', text: 'Send RSVP' }),
        RSVP_WHATSAPP ? el('button', { class: 'btn btn--ghost', type: 'button', id: 'rsvp-wa', text: 'Send on WhatsApp' }) : null
      ]),
      el('p', { class: 'hint', html: 'Your reply is saved in this browser and, once we connect the form, sent straight to us. If you would rather just call — the numbers are on the printed card.' })
    ]);

    host.appendChild(form);
    form.addEventListener('submit', onSubmit);
    const wa = $('#rsvp-wa');
    if (wa) wa.addEventListener('click', function () { sendWhatsApp(collect(form)); });

    function field(label, input) {
      return el('label', { class: 'field' }, [el('span', { html: label }), input]);
    }
    function select(name, options) {
      return el('select', { name: name }, options.map(function (o) {
        return el('option', { value: o, text: o });
      }));
    }
  }

  function collect(form) {
    const fd = new FormData(form);
    const fns = U.$$('input[name=fn]:checked', form).map(function (i) { return i.value; });
    return {
      name: (fd.get('name') || '').trim(),
      phone: (fd.get('phone') || '').trim(),
      city: (fd.get('city') || '').trim(),
      side: /Groom/.test(fd.get('side')) ? 'Groom' : 'Bride',
      attending: fd.get('attending'),
      adults: Number(fd.get('adults')) || 0,
      kids: Number(fd.get('kids')) || 0,
      functions: fns,
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
    W.store.submitRsvp(r);

    const host = $('#rsvp-card');
    U.clear(host);
    host.appendChild(el('div', { class: 'rsvp__done' }, [
      el('div', { class: 'tick', text: '✓' }),
      el('h3', { text: 'Thank you, ' + r.name.split(' ')[0] + '!' }),
      el('p', {
        html: /cannot/.test(r.attending)
          ? 'We will miss you, truly. Thank you for letting us know — we will raise a glass in your name.'
          : 'We have got your reply. We will be in touch about rooms and your pickup closer to the date.'
      }),
      el('div', { class: 'rule-orn' }, el('span', { text: '❁' })),
      el('div', { style: 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap' }, [
        el('button', {
          class: 'btn btn--ghost', type: 'button', text: 'Copy my reply',
          onclick: function () {
            const t = rsvpText(r);
            if (navigator.clipboard) {
              navigator.clipboard.writeText(t).then(function () { U.toast('Copied — paste it to us on WhatsApp.'); });
            } else U.toast('Copy not supported in this browser.', 'warn');
          }
        }),
        RSVP_WHATSAPP ? el('button', {
          class: 'btn', type: 'button', text: 'Also send on WhatsApp',
          onclick: function () { sendWhatsApp(r); }
        }) : null,
        el('button', {
          class: 'btn btn--ghost', type: 'button', text: 'Add another family',
          onclick: function () { U.clear(host); renderRsvp(); host.scrollIntoView({ behavior: 'smooth' }); }
        })
      ])
    ]));
  }

  /* ---------- calendar + share ---------- */

  function initActions() {
    const ics = $('#btn-ics');
    if (ics) {
      ics.addEventListener('click', function () {
        const events = D.functions.filter(function (f) { return f.publicInvite; }).map(function (f) {
          return {
            uid: f.id, date: f.date, start: f.start, end: f.end,
            title: f.name + ' — Vaibhav & Mahak',
            location: 'Udaipur, Rajasthan',
            description: f.tagline + '\nDress code: ' + f.dressCode
          };
        });
        U.download('vaibhav-mahak-wedding.ics', U.buildICS(events, 'Vaibhav & Mahak'), 'text/calendar');
        U.toast('Calendar file downloaded — open it to add all functions.');
      });
    }

    const share = $('#btn-share');
    if (share) {
      share.addEventListener('click', function () {
        const payload = {
          title: 'Vaibhav & Mahak — Udaipur, 2 Feb 2027',
          text: 'We are getting married in Udaipur! 31 Jan – 2 Feb 2027. Details and RSVP:',
          url: location.href
        };
        if (navigator.share) {
          navigator.share(payload).catch(function () { /* user dismissed */ });
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(payload.text + ' ' + payload.url)
            .then(function () { U.toast('Invitation link copied.'); });
        } else {
          U.toast('Copy the address bar link to share.', 'warn');
        }
      });
    }
  }

  /* ---------- reveal on scroll ---------- */

  function initReveal() {
    const items = U.$$('.reveal');
    function revealAll() { items.forEach(function (i) { i.classList.add('is-in'); }); }

    if (!('IntersectionObserver' in window)) { revealAll(); return; }

    // Opt into the hidden starting state only now that we know we can undo it.
    document.documentElement.classList.add('js-anim');

    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    items.forEach(function (i) { io.observe(i); });

    // Safety net: if the observer never fires, nothing stays invisible.
    setTimeout(revealAll, 2500);
  }

  /* ---------- boot ---------- */

  document.addEventListener('DOMContentLoaded', function () {
    initOpener();
    initGarland();
    initCountdown();
    renderFunctions();
    renderTimeline();
    renderTravel();
    renderRsvp();
    initActions();
    initReveal();
  });
})(window.W);
