/* The personal guest portal: phone number in, everything about that guest out. */
(function (W) {
  'use strict';

  const U = W.util, D = W.data, DB = W.db, M = W.motifs, MO = W.motion, el = U.el, $ = U.$;
  const cfg = W.config || {};
  const REMEMBER = 'vm-guest-phone';

  let guest = null;

  /* ---------------- ornaments ---------------- */

  function paintOrnaments() {
    $('#lookup-mandala').innerHTML = M.mandalaSvg('', 22, 'currentColor');
    const strands = window.innerWidth < 700 ? 8 : (window.innerWidth < 1100 ? 13 : 18);
    $('#me-garland').innerHTML = M.garlandRow(strands, 11);
  }

  /* A banner while the site is still running on sample data. */
  function paintDemoNote() {
    if (DB.isConfigured()) return;
    $('#demo-note').innerHTML =
      '<div class="demo-note">Running on <strong>sample guests</strong> — the database is not connected yet. ' +
      'Try <code>9876500001</code>. See <code>SETUP.md</code> to connect Supabase.</div>';
  }

  /* ---------------- lookup ---------------- */

  function initLookup() {
    const form = $('#lookup-form');
    const input = $('#phone');
    const err = $('#lookup-err');
    const btn = $('#lookup-btn');

    if (cfg.helpPhone) {
      $('#lookup-help').innerHTML = 'Not finding yourself? Message ' +
        (cfg.helpName || 'us') + ' on <a href="https://wa.me/' +
        cfg.helpPhone.replace(/\D/g, '') + '">WhatsApp</a> and we will add you.';
    }

    // Group the digits as they type, purely for readability.
    input.addEventListener('input', function () {
      const d = input.value.replace(/\D/g, '').slice(-10);
      input.value = d.length > 5 ? d.slice(0, 5) + ' ' + d.slice(5) : d;
      err.textContent = '';
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const p = DB.normPhone(input.value);
      if (p.length !== 10) {
        err.textContent = 'Please enter all 10 digits of your mobile number.';
        input.focus();
        return;
      }

      btn.disabled = true;
      const label = btn.querySelector('span');
      label.innerHTML = '<span class="spinner"></span> Looking you up…';

      DB.getGuest(p).then(function (g) {
        if (!g) {
          err.innerHTML = 'We could not find that number on the guest list. ' +
            'Please check it, or message us and we will fix it right away.';
          btn.disabled = false;
          label.textContent = 'Find my invitation';
          return;
        }
        try { localStorage.setItem(REMEMBER, p); } catch (e2) { /* private mode */ }
        show(g);
      }).catch(function (ex) {
        err.textContent = ex.message || 'Something went wrong. Please try again.';
        btn.disabled = false;
        label.textContent = 'Find my invitation';
      });
    });

    // Straight back in on a return visit.
    let saved = '';
    try { saved = localStorage.getItem(REMEMBER) || ''; } catch (e) { /* ignore */ }
    const fromUrl = (location.hash.match(/p=(\d{10})/) || [])[1];
    const auto = fromUrl || saved;
    if (auto) {
      DB.getGuest(auto).then(function (g) { if (g) show(g); }).catch(function () { /* fall through */ });
    }
  }

  function signOut() {
    try { localStorage.removeItem(REMEMBER); } catch (e) { /* ignore */ }
    location.hash = '';
    location.reload();
  }

  /* ---------------- render the personal page ---------------- */

  function show(g) {
    guest = g;

    renderHeader(g);
    renderKeys(g);
    renderFunctions(g);
    renderTravel(g);
    renderGuide();
    renderRsvpEditor(g);

    DB.getAlbums().then(renderAlbums);
    DB.getAnnouncements().then(renderNews);

    // Swap the screens, then bring the animations up on the new content.
    $('#lookup').classList.add('is-gone');
    $('#me').classList.add('is-live');
    window.scrollTo(0, 0);

    requestAnimationFrame(function () {
      MO.boot($('#me'));
      MO.petals($('#me-petals'), { count: 22, speed: .85 });
    });

    $('#me-out').addEventListener('click', signOut);
    $('#me-ics').addEventListener('click', function () { downloadIcs(g); });
  }

  function renderHeader(g) {
    $('#me-name').textContent = g.name;

    const bits = [];
    if (g.salutation) bits.push(g.salutation);
    if (g.side) bits.push(g.side + '’s side');
    if (g.city) bits.push('travelling from ' + g.city);
    $('#me-sub').textContent = bits.join(' · ');

    const msg = $('#me-msg');
    if (g.message) { msg.textContent = g.message; msg.hidden = false; }
    else msg.hidden = true;

    const chips = U.clear($('#me-chips'));
    const rsvpClass = g.rsvp === 'Yes' || g.rsvp === 'Confirmed' ? 'chip--yes'
      : (g.rsvp === 'No' || g.rsvp === 'Declined' ? 'chip--no' : 'chip--pending');
    const rsvpText = g.rsvp === 'Yes' || g.rsvp === 'Confirmed' ? 'You’re coming ✓'
      : (g.rsvp === 'No' || g.rsvp === 'Declined' ? 'You can’t make it' : 'Awaiting your reply');

    chips.appendChild(el('span', { class: 'chip ' + rsvpClass, text: rsvpText, 'data-reveal': 'up' }));
    const party = g.adults + g.kids;
    if (party > 0) {
      chips.appendChild(el('span', {
        class: 'chip', 'data-reveal': 'up',
        text: party + (party === 1 ? ' guest' : ' guests') +
          (g.kids ? ' (' + g.adults + ' adults, ' + g.kids + ' children)' : '')
      }));
    }
    if (g.diet) chips.appendChild(el('span', { class: 'chip', text: g.diet, 'data-reveal': 'up' }));
    const count = invitedIds(g).length;
    chips.appendChild(el('span', {
      class: 'chip', 'data-reveal': 'up',
      text: count + (count === 1 ? ' function' : ' functions')
    }));
  }

  function renderKeys(g) {
    const host = U.clear($('#me-keys'));

    function key(label, value, note, small) {
      host.appendChild(el('div', { class: 'key sweep', 'data-reveal': 'rise', 'data-tilt': '6' }, [
        el('div', { class: 'tilt-sheen' }),
        el('div', { class: 'key__label', text: label }),
        el('div', { class: 'key__val' + (small ? ' key__val--sm' : ''), html: value }),
        note ? el('div', { class: 'key__note', html: note }) : null
      ]));
    }

    if (g.room) {
      key('Your room', g.room,
        (g.hotel || '') + (g.hostPaid ? '<br><strong>Our treat — nothing to pay</strong>' : ''));
    } else if (g.needsRoom) {
      key('Your room', 'Coming soon', 'We are allocating rooms in January. You will see it here.', true);
    }

    if (g.table && g.invited.reception) {
      key('Reception table', g.table, 'Look for the marigold table number');
    }

    if (g.pickup) {
      key('Your pickup', 'Arranged', g.pickup, true);
    } else if (g.arrival) {
      key('You arrive', U.fmtDate(g.arrival, false),
        (g.arrivalTime ? 'at ' + g.arrivalTime : '') +
        (g.mode ? (g.arrivalTime ? ' · ' : '') + 'by ' + g.mode : '') || 'Tell us your timing and we will send a car', true);
    }

    if (!host.children.length) {
      key('Your details', 'On the way',
        'Rooms, tables and pickups are arranged in January. Check back here.', true);
    }
  }

  function invitedIds(g) {
    return D.functions
      .filter(function (f) { return f.publicInvite && g.invited[f.id]; })
      .map(function (f) { return f.id; });
  }

  /* Only the guest's own functions. Listing the rest greyed out just tells
     someone what they are missing, so we leave them out entirely. */
  function renderFunctions(g) {
    const host = U.clear($('#me-fns'));
    const all = D.functions.filter(function (f) { return f.publicInvite; });
    const mine = all.filter(function (f) { return g.invited[f.id]; });

    $('#me-fn-note').textContent = mine.length === all.length
      ? 'You are invited to everything — we would not have it any other way.'
      : mine.length === 1
        ? 'Here is your function, with the timing and where to be.'
        : 'Your ' + mine.length + ' functions, in order.';

    if (!mine.length) {
      host.appendChild(el('p', { class: 'myfn__none', text:
        'We are still finalising your functions. Call us and we will sort it out right away.' }));
      return;
    }

    mine.forEach(function (f) {
      host.appendChild(el('div', { class: 'myfn__row', 'data-reveal': 'up' }, [
        el('div', { class: 'myfn__when' }, [
          el('b', { text: U.fmtDate(f.date, false).replace(/,.*/, '') }),
          el('span', { text: f.muhurat ? f.muhurat : f.start })
        ]),
        el('div', { class: 'myfn__body' }, [
          el('h3', { text: f.name }),
          el('p', { text: f.area + ' · ' + f.dressCode })
        ]),
        el('div', { class: 'myfn__badge', text: 'You’re invited' })
      ]));
    });
  }

  function renderTravel(g) {
    const host = U.clear($('#me-travel'));
    const t = D.venue.travel;

    function card(title, html) {
      host.appendChild(el('div', {
        class: 'info sweep', 'data-reveal': 'up', 'data-tilt': '5',
        style: 'background:rgba(253,250,241,.06);border-color:rgba(232,200,106,.26);color:var(--champagne)'
      }, [
        el('div', { class: 'tilt-sheen' }),
        el('h4', { html: title, style: 'color:var(--gold-pale)' }),
        el('p', { html: html, style: 'color:rgba(247,236,201,.78)' })
      ]));
    }

    const arrive = [];
    if (g.arrival) arrive.push('<strong>' + U.fmtDate(g.arrival, true) + '</strong>');
    if (g.arrivalTime) arrive.push('at ' + g.arrivalTime);
    if (g.mode) arrive.push('by ' + g.mode);
    if (g.travelDetail) arrive.push('(' + g.travelDetail + ')');
    card('Your arrival', arrive.length
      ? arrive.join(' ') + (g.pickup ? '<br>' + g.pickup : '<br>Send us your flight or train details and we will arrange a pickup.')
      : 'We do not have your travel plans yet. Update them below and we will sort your pickup.');

    if (g.departure) card('Your departure', '<strong>' + U.fmtDate(g.departure, true) + '</strong><br>Drop to the airport or station is arranged — no need to book a cab.');

    if (g.hotel || g.room) {
      card('Where you are staying', '<strong>' + (g.hotel || 'The wedding venue') + '</strong>' +
        (g.room ? '<br>Room ' + g.room : '') +
        (g.checkIn ? '<br>Check-in ' + U.fmtDate(g.checkIn, false) : '') +
        (g.checkOut ? ' · Check-out ' + U.fmtDate(g.checkOut, false) : '') +
        (g.hostPaid ? '<br><strong>This one is on us.</strong>' : ''));
    }

    card('Getting to Udaipur', '<strong>Air:</strong> ' + t.airport +
      '<br><strong>Rail:</strong> ' + t.rail + '<br><strong>Road:</strong> ' + t.road);
    card('Weather', t.weather + '<br><strong>' + t.pack + '</strong>');
  }

  function renderAlbums(albums) {
    const host = U.clear($('#me-albums'));
    const list = albums && albums.length ? albums : (D.albums || []);

    list.forEach(function (a) {
      const live = !!a.url;
      const thumb = a.cover
        ? el('img', { src: a.cover, alt: '', loading: 'lazy' })
        : el('div', { html: M.mandalaSvg('', 14, 'currentColor') });

      host.appendChild(el('a', {
        class: 'album' + (live ? '' : ' is-soon'),
        href: live ? a.url : '#',
        target: live ? '_blank' : null,
        rel: live ? 'noopener' : null,
        'data-reveal': 'rise'
      }, [
        el('div', { class: 'album__thumb' }, thumb),
        el('div', { class: 'album__body' }, [
          el('h4', { text: a.title }),
          el('p', {
            text: live
              ? (a.count ? a.count + ' photographs · tap to open' : 'Tap to open')
              : (a.note || 'Coming soon')
          })
        ])
      ]));
    });
  }

  function renderNews(items) {
    if (!items || !items.length) return;
    const sec = $('#me-news-sec');
    const host = U.clear($('#me-news'));
    sec.hidden = false;

    items.forEach(function (n) {
      host.appendChild(el('div', { class: 'news__item', 'data-reveal': 'up' }, [
        n.created_at ? el('time', { text: U.fmtDate(String(n.created_at).slice(0, 10), true) }) : null,
        el('h4', { text: n.title }),
        n.body ? el('p', { text: n.body }) : null
      ]));
    });
  }

  function renderGuide() {
    const host = U.clear($('#me-guide'));
    const icons = {
      paisley: function () { return M.paisley('currentColor'); },
      kalash: function () { return M.kalash('currentColor'); },
      mandala: function () { return M.mandalaSvg('', 14, 'currentColor'); },
      feather: function () { return M.peacockFeather('currentColor', 'currentColor'); }
    };

    (D.guide || []).forEach(function (g, i) {
      const dl = el('dl', {});
      g.items.forEach(function (row) {
        dl.appendChild(el('dt', { text: row[0] }));
        dl.appendChild(el('dd', { html: row[1] }));
      });

      const item = el('div', { class: 'gitem' + (i === 0 ? ' is-open' : ''), 'data-reveal': 'up' }, [
        el('button', { class: 'gitem__btn', type: 'button', 'aria-expanded': i === 0 ? 'true' : 'false' }, [
          el('span', { class: 'gitem__ico', html: (icons[g.icon] || icons.mandala)() }),
          el('span', { text: g.title }),
          el('span', { class: 'gitem__caret', text: '▾' })
        ]),
        el('div', { class: 'gitem__body' }, el('div', { class: 'gitem__inner' }, dl))
      ]);

      const btn = item.querySelector('.gitem__btn');
      btn.addEventListener('click', function () {
        const open = item.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      host.appendChild(item);
    });
  }

  /* ---------------- guest edits their own reply ---------------- */

  function renderRsvpEditor(g) {
    const host = U.clear($('#me-rsvp'));
    let choice = (g.rsvp === 'Confirmed' ? 'Yes' : (g.rsvp === 'Declined' ? 'No' : g.rsvp)) || 'Pending';

    const seg = el('div', { class: 'seg' }, [['Yes', 'Yes, joining'], ['Maybe', 'Not sure yet'], ['No', 'Cannot make it']]
      .map(function (o) {
        return el('button', {
          type: 'button', class: choice === o[0] ? 'is-on' : '', text: o[1],
          onclick: function () {
            choice = o[0];
            U.$$('.seg button', seg).forEach(function (b) { b.classList.remove('is-on'); });
            this.classList.add('is-on');
          }
        });
      }));

    function field(label, input) {
      return el('label', { class: 'field' }, [el('span', { text: label }), input]);
    }

    const adults = el('input', { type: 'number', min: '0', max: '30', value: String(g.adults) });
    const kids = el('input', { type: 'number', min: '0', max: '30', value: String(g.kids) });
    const diet = el('select', {}, D.DIETS.map(function (d) {
      return el('option', { value: d, text: d, selected: d === g.diet ? 'selected' : null });
    }));
    const note = el('textarea', { placeholder: 'Anything else we should know?' });

    const save = el('button', { class: 'btn', type: 'submit' }, el('span', { text: 'Save my reply' }));

    const form = el('form', {}, [
      field('Will you join us?', seg),
      el('div', { class: 'grid-2' }, [
        field('Adults', adults), field('Children', kids)
      ]),
      field('Food preference', diet),
      field('A note for us', note),
      el('div', { style: 'margin-top:8px' }, save)
    ]);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      save.disabled = true;
      save.querySelector('span').innerHTML = '<span class="spinner"></span> Saving…';

      const patch = {
        rsvp: choice,
        adults: Math.max(0, Number(adults.value) || 0),
        kids: Math.max(0, Number(kids.value) || 0),
        diet: diet.value,
        notes: note.value.trim()
      };

      DB.updateRsvp(g.phone, patch).then(function (ok) {
        if (!ok) throw new Error('We could not save that.');
        Object.assign(g, patch);
        renderHeader(g);
        U.toast('Thank you — your reply is saved.');
        U.clear(host).appendChild(el('div', { class: 'done' }, [
          el('div', { class: 'done__tick', text: '✓' }),
          el('h3', { text: 'Saved' }),
          el('p', {
            text: choice === 'No'
              ? 'We will miss you. Thank you for telling us.'
              : 'We have you down for ' + (patch.adults + patch.kids) +
                ((patch.adults + patch.kids) === 1 ? ' guest.' : ' guests.')
          }),
          el('button', {
            class: 'btn btn--ghost', type: 'button',
            onclick: function () { renderRsvpEditor(g); }
          }, el('span', { text: 'Change it again' }))
        ]));
      }).catch(function (ex) {
        U.toast(ex.message || 'Could not save. Please try again.', 'bad');
        save.disabled = false;
        save.querySelector('span').textContent = 'Save my reply';
      });
    });

    host.appendChild(form);
  }

  /* ---------------- calendar for just this guest ---------------- */

  function downloadIcs(g) {
    const mine = D.functions.filter(function (f) { return f.publicInvite && g.invited[f.id]; });
    if (!mine.length) { U.toast('No functions to add yet.', 'warn'); return; }

    const events = mine.map(function (f) {
      return {
        uid: f.id + '-' + g.phone, date: f.date, start: f.start, end: f.end,
        title: f.name + ' — Vaibhav & Mahak',
        location: (g.hotel || 'Udaipur') + ', Rajasthan',
        description: f.tagline + '\nDress code: ' + f.dressCode +
          (g.room ? '\nYour room: ' + g.room : '') +
          (g.table && f.id === 'reception' ? '\nYour table: ' + g.table : '')
      };
    });
    U.download('my-wedding-schedule.ics', U.buildICS(events, 'Vaibhav & Mahak'), 'text/calendar');
    U.toast('Added ' + events.length + ' functions to your calendar file.');
  }

  /* ---------------- boot ---------------- */

  document.addEventListener('DOMContentLoaded', function () {
    paintDemoNote();
    paintOrnaments();
    initLookup();
    MO.boot(document);
    MO.petals($('#lookup-petals'), { count: 20, speed: .8 });
    MO.initSmoothLinks(document);
  });
})(window.W);
