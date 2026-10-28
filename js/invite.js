/* Renders the guest-facing invitation from W.data and W.content, in English or
   Hindi. Every section is a render function that can run again, so switching
   language redraws the content in place without a reload. */
(function (W) {
  'use strict';

  const U = W.util, D = W.data, C = W.content, I = W.i18n, M = W.motifs, MO = W.motion;
  const el = U.el, $ = U.$, $$ = U.$$;
  const V = D.venue.booked;

  /* Whose card this is (see side.js). The other family's own ceremonies are
     left off, so each card shows only what its guests attend. */
  const SIDE = W.side === 'bride' ? 'bride' : 'groom';
  const MINE = D.programme.filter(function (e) { return !e.side || e.side === SIDE; });
  const RSVP_WHATSAPP = D.sides[SIDE].rsvpWhatsapp;

  /* Elements drawn after boot get revealed at once — they are already on
     screen, and an observer would leave them hidden until the next scroll. */
  function shown(node) {
    $$('[data-reveal]', node).forEach(function (n) { n.classList.add('is-revealed'); });
    if (node.hasAttribute && node.hasAttribute('data-reveal')) node.classList.add('is-revealed');
    return node;
  }

  function telHref(n) { return 'tel:' + String(n).replace(/[^\d+]/g, ''); }

  /* ---------------- whose card ---------------- */

  /* index.html is written in Vaibhav's family's order. On Mahak's family's
     card her name and her parents come first, everywhere they appear. */
  function initSide() {
    if (SIDE !== 'bride') return;
    const names = $('.names'), ns = $$('.names__n', names);
    if (names && ns.length === 2) {
      const delay = ns[1].getAttribute('data-delay');
      ns[1].removeAttribute('data-delay');
      ns[0].setAttribute('data-delay', delay);
      names.insertBefore(ns[1], names.firstChild);
      names.appendChild(ns[0]);
    }
    const parents = $('.parents'), ps = $$('.parents__side', parents);
    if (parents && ps.length === 2) parents.insertBefore(ps[1], ps[0]);
    const mono = $('.nav__mono');
    if (mono && mono.lastChild && mono.lastChild.nodeType === 3) mono.lastChild.textContent = 'M & V';
    if (mono) mono.setAttribute('aria-label', 'Mahak and Vaibhav');
    document.title = 'Mahak & Vaibhav · 1 & 2 February 2027 · Hotel Khumani, Udaipur';
  }

  /* ---------------- ornaments ---------------- */

  function paintOrnaments() {
    $('#door-l').innerHTML = M.doorPanel('l', 'L');
    $('#door-r').innerHTML = M.doorPanel('r', 'R');
    const mono = SIDE === 'bride' ? 'M·V' : 'V·M';
    $('#seal-l').innerHTML = M.seal('seal-a', mono);
    $('#seal-r').innerHTML = M.seal('seal-b', mono);
    $('#hero-mandala').innerHTML = M.mandalaSvg('', 24, 'currentColor');
    $('#foot-mandala').innerHTML = M.mandalaSvg('', 20, 'currentColor');
    $('#feather-l').innerHTML = M.peacockFeather('currentColor', 'currentColor');
    $('#feather-r').innerHTML = M.peacockFeather('currentColor', 'currentColor');
    $('#corner-bl').innerHTML = M.corner('currentColor');
    $('#corner-br').innerHTML = M.corner('currentColor');
    $('#card-sun').innerHTML = M.sun('currentColor');
    $('#nav-sun').innerHTML = M.sun('currentColor');
    $('#foot-sun').innerHTML = M.sun('currentColor');
    const strands = window.innerWidth < 700 ? 9 : (window.innerWidth < 1100 ? 14 : 20);
    $('#hero-garland').innerHTML = M.garlandRow(strands, 7);
  }

  /* ---------------- the shehnai ---------------- */

  /* Browsers only allow sound after a tap, so it starts with the seal. A guest
     who pauses it stays paused on every later visit. */
  const Sound = (function () {
    const KEY = 'vm-sound';
    let audio = null, on = false;
    function pref() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
    function remember(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* ignore */ } }
    function ensure() {
      if (audio) return audio;
      audio = new Audio('assets/audio/shehnai.m4a');
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0;
      return audio;
    }
    function fade(to, ms, done) {
      const from = audio.volume, t0 = performance.now();
      (function step(now) {
        const k = Math.min(1, (now - t0) / ms);
        audio.volume = Math.max(0, Math.min(1, from + (to - from) * k));
        if (k < 1) requestAnimationFrame(step); else if (done) done();
      })(t0);
    }
    function paint() {
      const b = $('#sound-btn');
      if (!b) return;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', I.t(on ? 'sound.off' : 'sound.on'));
      b.classList.toggle('is-on', on);
    }
    function play() {
      ensure();
      const p = audio.play();
      on = true; paint();
      if (p && p.catch) p.catch(function () { on = false; paint(); });
      fade(0.32, 2200);
    }
    function pause() {
      if (!audio) return;
      on = false; paint();
      fade(0, 600, function () { audio.pause(); });
    }
    return {
      start: function () { if (pref() !== 'off') play(); },
      toggle: function () {
        if (on) { pause(); remember('off'); } else { play(); remember('on'); }
      },
      paint: paint
    };
  })();

  /* ---------------- the gate ---------------- */

  function initGate() {
    const gate = $('#gate');
    const seal = $('#gate-ring');
    if (!gate) return;

    let skip = /[?&]open=1/.test(location.search);
    try { skip = skip || sessionStorage.getItem('vm-opened') === '1'; } catch (e) { /* ignore */ }
    if (skip) {
      gate.classList.add('is-open', 'is-done');
      document.body.classList.remove('is-locked');
      return;
    }

    let opened = false;
    function open() {
      if (opened) return;
      opened = true;
      try { sessionStorage.setItem('vm-opened', '1'); } catch (e) { /* ignore */ }
      Sound.start();
      // The seal cracks and falls away first; the doors follow it.
      seal.classList.add('is-broken');
      setTimeout(function () { MO.openDoors(gate); }, MO.reduced ? 0 : 520);
    }

    seal.addEventListener('click', function (e) { e.stopPropagation(); open(); });
    gate.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('[data-lang-toggle]')) return;
      open();
    });
  }

  /* ---------------- language & menu ---------------- */

  function initLang() {
    $$('[data-lang-toggle]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); I.toggle(); });
    });
    I.onChange(function () {
      renderAll(true);
      Sound.paint();
      if (fly.ctl) fly.ctl.relabel();
      paintCaps(fly.leg);
    });
  }

  function initMenu() {
    const btn = $('#menu-btn'), menu = $('#menu');
    if (!btn || !menu) return;
    function set(open) {
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.documentElement.classList.toggle('menu-open', open);
    }
    btn.addEventListener('click', function () { set(menu.hidden); });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) set(false);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  }

  /* ---------------- countdown ---------------- */

  function initCountdown() {
    const host = $('#countdown');
    if (!host) return;
    const target = new Date(2027, 1, 2, 11, 0, 0);
    const cells = {};
    [['cd.d', 'd'], ['cd.h', 'h'], ['cd.m', 'm'], ['cd.s', 's']].forEach(function (u) {
      const b = el('b', { text: '0' });
      cells[u[1]] = b;
      host.appendChild(el('div', { class: 'cd', 'data-reveal': 'up' }, [b, el('span', { 'data-i18n': u[0], text: I.t(u[0]) })]));
    });
    function tick() {
      const diff = target - new Date();
      if (diff <= 0) { Object.keys(cells).forEach(function (k) { cells[k].textContent = '0'; }); return; }
      MO.rollTo(cells.d, Math.floor(diff / 86400000), 700);
      MO.rollTo(cells.h, Math.floor(diff / 3600000) % 24, 400);
      MO.rollTo(cells.m, Math.floor(diff / 60000) % 60, 300);
      cells.s.textContent = String(Math.floor(diff / 1000) % 60);
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------- the programme ---------------- */

  const SUN = { '2027-02-01': ['07:17', '18:19'], '2027-02-02': ['07:16', '18:20'], '2027-02-03': ['07:16', '18:20'] };
  const PIN = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6.1-6.5-11A6.5 6.5 0 0 1 18.5 10c0 4.9-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>';

  function seatedHere(e) { return e.seated && (!e.seatedFor || e.seatedFor === SIDE); }

  function chip(text, kind) { return el('span', { class: 'chip chip--' + kind, text: text }); }

  function renderEvent(e, flip) {
    const art = e.art ? el('figure', { class: 'ev__art' + (flip ? ' is-flip' : '') }, [
      el('div', { class: 'ev__arch' }, el('img', {
        src: 'assets/art/art-' + e.art + '.webp', alt: I.pick(e.t), width: '600', height: '800',
        loading: 'lazy', decoding: 'async'
      }))
    ]) : null;

    const chips = [];
    if (seatedHere(e)) chips.push(chip(I.t(e.gather ? 'prog.gather' : 'prog.seated', { t: I.time(e.seated) }), 'seat'));
    if (e.who && e.who !== 'stay') chips.push(chip(I.t('who.' + e.who), 'who'));

    const body = el('div', { class: 'ev__body' }, [
      el('time', { class: 'ev__time', datetime: e.date + 'T' + e.start, text: e.open ? I.t('prog.onwards', { t: I.time(e.start) }) : I.span(e.start, e.end) }),
      el('h4', { class: 'ev__title', text: I.pick(e.t) }),
      el('p', { class: 'ev__where', html: PIN + '<span>' + I.pick(e.where) + '</span>' }),
      e.note ? el('p', { class: 'ev__note', text: I.pick(e.note) }) : null,
      e.role && e.role[SIDE] ? el('p', { class: 'ev__role' }, [
        el('b', { text: I.t('prog.ours') }), el('span', { text: I.pick(e.role[SIDE]) })
      ]) : null,
      chips.length ? el('div', { class: 'ev__chips' }, chips) : null
    ]);

    const cls = ['ev', e.art ? 'ev--art' : 'ev--line', e.key ? 'is-key' : '', e.meal ? 'ev--meal' : '',
      flip ? 'ev--flip' : ''].filter(Boolean).join(' ');
    return el('li', { class: cls, id: 'ev-' + e.id, 'data-ev': e.id, 'data-reveal': e.art ? 'rise' : 'up' }, [art, body]);
  }

  function renderProgramme(again) {
    const host = $('#prog');
    if (!host) return;
    U.clear(host);
    const byDate = U.groupBy(MINE, function (e) { return e.date; });
    Object.keys(byDate).sort().forEach(function (date) {
      const events = byDate[date];
      let artCount = 0;
      const keys = events.filter(function (e) { return e.key; });
      const head = el('header', { class: 'pday__head' }, [
        el('span', { class: 'pday__no', text: I.t('prog.day.' + date) }),
        el('h3', { class: 'pday__date', text: I.date(date, { year: true }) }),
        SUN[date] ? el('p', { class: 'pday__sun', text: I.t('prog.sun', { a: I.time(SUN[date][0]), b: I.time(SUN[date][1]) }) }) : null,
        keys.length ? el('nav', { class: 'pday__jump' }, keys.map(function (e) {
          return el('a', { href: '#ev-' + e.id, text: I.pick(e.t) });
        })) : null
      ]);
      const list = el('ol', { class: 'ptl' }, events.map(function (e) {
        const flip = e.art ? (artCount++ % 2 === 1) : false;
        return renderEvent(e, flip);
      }));
      const day = el('section', { class: 'pday', id: 'day-' + date }, [head, list]);
      host.appendChild(again ? shown(day) : day);
    });
    markNow();
  }

  /* ---------------- the flight ---------------- */

  const fly = { leg: 0, ctl: null, btn: 'again' };

  function paintCaps(active) {
    const host = $('#fly-caps');
    if (!host) return;
    U.clear(host);
    C.flight.forEach(function (w, i) {
      host.appendChild(el('li', { class: 'fly__cap' + (i === active ? ' is-on' : ''), 'data-leg': String(i) }, [
        el('b', { text: I.pick(w.cap) }),
        el('span', { text: I.pick(w.sub) })
      ]));
    });
    const again = $('#fly-again');
    if (again) again.textContent = I.t('venue.' + fly.btn);
  }

  function setLeg(i) {
    if (i === fly.leg) return;
    fly.leg = i;
    $$('#fly-caps .fly__cap').forEach(function (c) { c.classList.toggle('is-on', Number(c.getAttribute('data-leg')) === i); });
  }

  function initFlight() {
    const stage = $('#fly');
    if (!stage || !W.flyin) return;
    paintCaps(0);
    const bar = $('#fly-bar'), land = $('#venue'), again = $('#fly-again');
    function offer(kind) {
      fly.btn = kind;
      again.textContent = I.t('venue.' + kind);
      again.hidden = false;
    }
    fly.ctl = W.flyin.mount({
      stage: stage,
      video: $('#fly-film'),
      pins: $('#fly-pins'),
      landmarks: C.landmarks,
      label: function (lm) { return I.pick(lm.name); },
      avoid: function () {
        const c = $('#fly-caps .fly__cap.is-on');
        return c ? c.getBoundingClientRect() : null;
      },
      onFrame: function (p, leg) {
        if (bar) bar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
        setLeg(leg);
        land.classList.toggle('is-flying', p > 0.02 && !land.classList.contains('is-landed'));
      },
      onLanded: function (on) {
        land.classList.toggle('is-landed', on);
        if (on) { land.classList.remove('is-flying'); offer('again'); } else again.hidden = true;
      },
      onBlocked: function () { offer('play'); },
      onReady: function () { land.classList.add('is-live'); },
      onStatic: function () { land.classList.add('is-static'); }
    });
    again.addEventListener('click', function () { again.hidden = true; fly.ctl.replay(); });
  }

  /* ---------------- venue details ---------------- */

  function renderVenue(again) {
    const host = $('#venue-body');
    if (!host) return;
    U.clear(host);

    const fig = el('figure', { class: 'venue__art', 'data-reveal': 'arch' }, [
      el('img', {
        src: 'assets/art/venue-khumani.webp', alt: I.t('venue.portrait'),
        srcset: 'assets/art/venue-khumani-640.webp 640w, assets/art/venue-khumani.webp 1024w',
        sizes: '(max-width: 900px) 92vw, 560px', width: '1024', height: '768', loading: 'lazy', decoding: 'async'
      }),
      el('figcaption', { text: I.t('venue.portrait') })
    ]);

    const addr = el('div', { class: 'venue__addr' }, [
      el('span', { class: 'eyebrow', text: I.t('venue.addrLabel') }),
      el('h3', { text: I.pick(['Hotel Khumani by Hills N Dunes', 'होटल खुमानी (हिल्स एन ड्यून्स)']) }),
      el('p', { text: I.t('venue.addr') }),
      el('div', { class: 'venue__btns' }, [
        el('a', { class: 'btn btn--gold', href: C.map.directions, target: '_blank', rel: 'noopener' }, el('span', { text: I.t('venue.dir') })),
        el('a', { class: 'btn btn--ghost', href: C.map.query, target: '_blank', rel: 'noopener' }, el('span', { text: I.t('venue.maps') })),
        el('a', { class: 'btn btn--ghost', href: telHref(V.phones[0]) }, el('span', { text: I.t('venue.call') })),
        el('button', {
          class: 'btn btn--ghost', type: 'button', onclick: function () {
            const text = 'Hotel Khumani by Hills N Dunes, ' + V.address;
            if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { U.toast(I.t('venue.copied')); });
          }
        }, el('span', { text: I.t('venue.copy') }))
      ])
    ]);

    const spaces = el('div', { class: 'venue__list' }, [
      el('h4', { text: I.t('venue.spaces') }),
      el('ul', {}, C.spaces.map(function (s) {
        return el('li', {}, [el('b', { text: I.pick(s.where) }), el('span', { text: I.pick(s.what) })]);
      }))
    ]);
    const far = el('div', { class: 'venue__list' }, [
      el('h4', { text: I.t('venue.far') }),
      el('ul', {}, C.distances.map(function (d) {
        return el('li', {}, [el('b', { text: I.pick(d[0]) }), el('span', { text: I.pick(d[1]) })]);
      }))
    ]);

    const node = el('div', { class: 'venue__grid' }, [
      fig,
      el('div', { class: 'venue__info', 'data-reveal': 'up' }, [addr, el('div', { class: 'venue__cols' }, [spaces, far])])
    ]);
    host.appendChild(again ? shown(node) : node);
  }

  /* ---------------- stay, travel, weather ---------------- */

  function card(c, extra) {
    return el('article', { class: 'card sweep' + (extra ? ' ' + extra : ''), 'data-reveal': 'up' }, [
      el('h4', { text: I.pick(c.t) }),
      el('p', { text: I.pick(c.b) })
    ]);
  }

  function renderStay(again) {
    const host = $('#stay-grid');
    if (!host) return;
    U.clear(host);
    C.stay.forEach(function (c) { host.appendChild(again ? shown(card(c)) : card(c)); });
  }

  let forecast = null;

  function weatherCard() {
    const w = C.weather;
    const body = [el('h4', { text: I.t('wx.title') })];
    if (forecast && forecast.length) {
      body.push(el('p', { class: 'wx__live', text: I.t('wx.live') }));
      body.push(el('ul', { class: 'wx' }, forecast.map(function (d) {
        return el('li', {}, [
          el('b', { text: I.date(d.date, { day: false }) }),
          el('span', { text: Math.round(d.hi) + '° / ' + Math.round(d.lo) + '°' }),
          d.rain !== null ? el('i', { text: I.t('wx.rain', { p: d.rain }) }) : null
        ]);
      })));
    } else {
      body.push(el('p', { text: I.t('wx.normal', { hi: w.dayHigh, lo: w.nightLow, sr: I.time(w.sunrise), ss: I.time(w.sunset) }) }));
      body.push(el('p', { class: 'hint', text: I.t('wx.note') }));
    }
    return el('article', { class: 'card card--wx sweep', 'data-reveal': 'up' }, body);
  }

  /* Open-Meteo forecasts 16 days ahead, so only ask inside that window. */
  function fetchForecast() {
    const days = U.daysUntil('2027-02-01');
    if (days === null || days > 15 || days < -3 || !window.fetch) return;
    const w = C.weather;
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + w.lat + '&longitude=' + w.lon +
      '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FKolkata' +
      '&start_date=2027-01-31&end_date=2027-02-03';
    fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      if (!j.daily || !j.daily.time) return;
      forecast = j.daily.time.map(function (t, i) {
        return { date: t, hi: j.daily.temperature_2m_max[i], lo: j.daily.temperature_2m_min[i],
          rain: j.daily.precipitation_probability_max ? j.daily.precipitation_probability_max[i] : null };
      });
      renderTravel(true);
    }).catch(function () { /* keep the normals */ });
  }

  function renderTravel(again) {
    const host = $('#travel-grid');
    if (!host) return;
    U.clear(host);
    const items = C.travel.map(function (c) { return card(c); });
    items.splice(3, 0, weatherCard());
    const here = el('article', { class: 'card card--wide', 'data-reveal': 'up' }, [
      el('h4', { text: I.pick(['While you are in Udaipur', 'उदयपुर में हों तो']) }),
      el('div', { class: 'here' }, C.whileHere.map(function (b) {
        return el('p', { class: 'wh' }, [el('b', { text: I.pick(b.t) }), el('span', { text: I.pick(b.b) })]);
      }))
    ]);
    items.push(here);
    items.forEach(function (n) { host.appendChild(again ? shown(n) : n); });
  }

  /* ---------------- questions ---------------- */

  function renderFaq(again) {
    const host = $('#faq-list');
    if (!host) return;
    U.clear(host);
    C.faq.forEach(function (f, i) {
      const n = el('details', { class: 'qa', 'data-reveal': 'up', 'data-k': (f.q.join(' ') + ' ' + f.a.join(' ') + ' ' + (f.k || '')).toLowerCase() }, [
        el('summary', {}, [el('span', { text: I.pick(f.q) }), el('i', { 'aria-hidden': 'true' })]),
        el('div', { class: 'qa__a' }, el('p', { text: I.pick(f.a) }))
      ]);
      if (i === 0) n.setAttribute('open', 'open');
      host.appendChild(again ? shown(n) : n);
    });
    host.appendChild(el('p', { class: 'faq__none', hidden: 'hidden', text: I.t('faq.none') }));
    filterFaq();
  }

  function filterFaq() {
    const q = (($('#faq-q') || {}).value || '').trim().toLowerCase();
    let hits = 0;
    $$('#faq-list .qa').forEach(function (d) {
      const hit = !q || q.split(/\s+/).every(function (w) { return d.getAttribute('data-k').indexOf(w) >= 0; });
      d.hidden = !hit;
      if (hit) hits++;
      if (q && hit) d.setAttribute('open', 'open');
    });
    const none = $('#faq-list .faq__none');
    if (none) none.hidden = hits > 0;
  }

  /* ---------------- help desk ---------------- */

  const HELP_ICON = {
    hotel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    hospital: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/></svg>',
    sos: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17v.5"/></svg>'
  };

  function renderHelp(again) {
    const host = $('#help-grid');
    if (!host) return;
    U.clear(host);
    C.help.forEach(function (h) {
      const links = [];
      if (h.tel) links.push(el('a', { href: telHref(h.tel), text: h.tel }));
      if (h.tel2) links.push(el('a', { href: telHref(h.tel2), text: h.tel2 }));
      if (h.mail) links.push(el('a', { href: 'mailto:' + h.mail, text: h.mail }));
      const n = el('article', { class: 'helpc helpc--' + h.kind, 'data-reveal': 'up' }, [
        el('span', { class: 'helpc__ic', html: HELP_ICON[h.kind] }),
        el('h4', { text: I.pick(h.t) }),
        el('p', { text: I.pick(h.b) }),
        el('div', { class: 'helpc__links' }, links)
      ]);
      host.appendChild(again ? shown(n) : n);
    });
  }

  /* ---------------- live: now and next ---------------- */

  function clock() {
    const m = /[?&]now=([0-9T:\-]+)/.exec(location.search);
    if (m) {
      const p = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(m[1]);
      if (p) return new Date(+p[1], +p[2] - 1, +p[3], +p[4], +p[5]);
    }
    return new Date();
  }

  function at(date, hhmm) {
    const p = date.split('-'), t = hhmm.split(':');
    return new Date(+p[0], +p[1] - 1, +p[2], +t[0], +t[1]);
  }

  function windowOf(e) {
    const s = at(e.date, e.start);
    let f = e.end ? at(U.endDateFor(e.date, e.start, e.end), e.end) : new Date(s.getTime() + 30 * 60000);
    if (f <= s) f = new Date(s.getTime() + 30 * 60000);
    return [s, f];
  }

  /* The current moment: a key event outranks a meal running alongside it. */
  function nowNext(now) {
    let cur = null, nxt = null;
    MINE.forEach(function (e) {
      const w = windowOf(e);
      if (now >= w[0] && now < w[1]) {
        if (!cur || (e.key && !cur.key) || (!!e.key === !!cur.key && w[0] > windowOf(cur)[0])) cur = e;
      } else if (w[0] > now && (!nxt || w[0] < windowOf(nxt)[0])) {
        nxt = e;
      }
    });
    return { cur: cur, nxt: nxt };
  }

  function markNow() {
    const now = clock();
    const live = now >= new Date(2027, 0, 31, 18, 0) && now < new Date(2027, 1, 3, 11, 0);
    const host = $('#now');
    $$('.ev.is-now').forEach(function (n) { n.classList.remove('is-now'); });
    if (!live || !host) { if (host) host.hidden = true; return; }
    const nn = nowNext(now);
    if (nn.cur) { const n = $('#ev-' + nn.cur.id); if (n) n.classList.add('is-now'); }
    U.clear(host);
    if (nn.cur) {
      host.appendChild(el('a', { class: 'now__cell now__cell--on', href: '#ev-' + nn.cur.id }, [
        el('i', { class: 'now__dot' }),
        el('small', { text: I.t('now.now') }),
        el('b', { text: I.pick(nn.cur.t) }),
        el('span', { text: I.pick(nn.cur.where) + (nn.cur.end && !nn.cur.open ? ' · ' + I.t('now.until', { t: I.time(nn.cur.end) }) : '') })
      ]));
    }
    if (nn.nxt) {
      const mins = Math.round((windowOf(nn.nxt)[0] - now) / 60000);
      host.appendChild(el('a', { class: 'now__cell', href: '#ev-' + nn.nxt.id }, [
        el('small', { text: I.t('now.next') }),
        el('b', { text: I.pick(nn.nxt.t) }),
        el('span', { text: (mins <= 90 ? I.t('now.in', { n: mins }) : I.t('now.at', { t: I.time(nn.nxt.start) })) + ' · ' + I.pick(nn.nxt.where) })
      ]));
    }
    host.hidden = !host.children.length;
    document.documentElement.classList.toggle('has-now', !host.hidden);
  }

  /* ---------------- RSVP ---------------- */

  function fnLabel(f) { return I.pick([f.name, f.nameHi]); }

  function renderRsvp() {
    const host = $('#rsvp-card');
    if (!host) return;
    const shownFns = D.functions.filter(function (f) { return f.publicInvite; });

    const fnBoxes = el('div', { class: 'rsvp-fns' }, shownFns.map(function (f) {
      return el('label', { class: 'check' }, [
        el('input', { type: 'checkbox', name: 'fn', value: f.id, checked: 'checked' }),
        el('span', { 'data-fn': f.id, text: fnLabel(f) })
      ]);
    }));

    function field(key, input) {
      return el('label', { class: 'field' }, [el('span', { 'data-i18n': key, text: I.t(key) }), input]);
    }
    function sel(name, options) {
      return el('select', { name: name }, options.map(function (o) {
        return el('option', { value: o[0], 'data-i18n': o[1], text: I.t(o[1]) });
      }));
    }
    function inp(attrs, ph) {
      const a = Object.assign({}, attrs);
      if (ph) { a['data-i18n-attr'] = 'placeholder:' + ph; a.placeholder = I.t(ph); }
      return el('input', a);
    }

    const form = el('form', { id: 'rsvp-form', novalidate: 'novalidate' }, [
      el('div', { class: 'grid-2' }, [
        field('rsvp.name', inp({ type: 'text', name: 'name' }, 'rsvp.namePh')),
        field('rsvp.phone', inp({ type: 'tel', name: 'phone', inputmode: 'numeric' }, 'rsvp.phonePh'))
      ]),
      el('div', { class: 'grid-2' }, [
        field('rsvp.city', inp({ type: 'text', name: 'city' }, 'rsvp.cityPh')),
        field('rsvp.side', sel('side', SIDE === 'bride'
          ? [['Bride', 'rsvp.sideBride'], ['Groom', 'rsvp.sideGroom']]
          : [['Groom', 'rsvp.sideGroom'], ['Bride', 'rsvp.sideBride']]))
      ]),
      field('rsvp.attending', sel('attending', [
        ['Yes, joyfully', 'rsvp.yes'], ['Yes, but only for some functions', 'rsvp.some'], ['Sadly cannot make it', 'rsvp.no']
      ])),
      el('div', { class: 'grid-2' }, [
        field('rsvp.adults', el('input', { type: 'number', name: 'adults', min: '0', value: '1' })),
        field('rsvp.kids', el('input', { type: 'number', name: 'kids', min: '0', value: '0' }))
      ]),
      field('rsvp.fns', fnBoxes),
      el('div', { class: 'grid-2' }, [
        field('rsvp.diet', sel('diet', D.DIETS.map(function (d) { return [d, 'diet.' + d]; }))),
        field('rsvp.arrival', el('input', { type: 'date', name: 'arrival', value: '2027-02-01', min: '2027-01-29', max: '2027-02-03' }))
      ]),
      el('div', { class: 'grid-2' }, [
        field('rsvp.mode', sel('mode', [['Flight', 'rsvp.flight'], ['Train', 'rsvp.train'], ['Car', 'rsvp.car'], ['Bus', 'rsvp.bus'], ['Not decided', 'rsvp.undecided']])),
        field('rsvp.detail', inp({ type: 'text', name: 'travelDetail' }, 'rsvp.detailPh'))
      ]),
      field('rsvp.notes', el('textarea', { name: 'notes', 'data-i18n-attr': 'placeholder:rsvp.notesPh', placeholder: I.t('rsvp.notesPh') })),
      el('div', { class: 'rsvp-actions' }, [
        el('button', { class: 'btn', type: 'submit' }, el('span', { 'data-i18n': 'rsvp.send', text: I.t('rsvp.send') })),
        RSVP_WHATSAPP ? el('button', { class: 'btn btn--ghost', type: 'button', id: 'rsvp-wa' }, el('span', { 'data-i18n': 'rsvp.wa', text: I.t('rsvp.wa') })) : null
      ]),
      el('p', { class: 'hint', 'data-i18n': 'rsvp.hint', text: I.t('rsvp.hint') })
    ]);

    U.clear(host).appendChild(form);
    form.addEventListener('submit', onSubmit);
    const wa = $('#rsvp-wa');
    if (wa) wa.addEventListener('click', function () { sendWhatsApp(collect(form)); });
  }

  /* The form keeps whatever the guest has typed when the language changes:
     only its labels move, through data-i18n, plus the function names here. */
  function relabelRsvp() {
    $$('#rsvp-card [data-fn]').forEach(function (s) {
      const f = D.functions.find(function (x) { return x.id === s.getAttribute('data-fn'); });
      if (f) s.textContent = fnLabel(f);
    });
  }

  function collect(form) {
    const fd = new FormData(form);
    return {
      name: (fd.get('name') || '').trim(),
      phone: (fd.get('phone') || '').trim(),
      city: (fd.get('city') || '').trim(),
      side: fd.get('side') === 'Groom' ? 'Groom' : 'Bride',
      attending: fd.get('attending'),
      adults: Number(fd.get('adults')) || 0,
      kids: Number(fd.get('kids')) || 0,
      functions: $$('input[name=fn]:checked', form).map(function (i) { return i.value; }),
      diet: fd.get('diet'),
      arrival: fd.get('arrival'),
      mode: fd.get('mode'),
      travelDetail: (fd.get('travelDetail') || '').trim(),
      notes: (fd.get('notes') || '').trim(),
      lang: I.lang
    };
  }

  /* The message is for the two of us, so it stays in English whatever the
     guest is reading the page in. */
  function rsvpText(r) {
    const names = r.functions.map(function (id) {
      const f = D.functions.find(function (x) { return x.id === id; });
      return f ? f.name : id;
    });
    return [
      'RSVP — Vaibhav & Mahak · ' + D.sides[SIDE].family + ' card',
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
    if (!r.name) { U.toast(I.t('toast.name'), 'warn'); return; }
    window.open('https://wa.me/' + RSVP_WHATSAPP + '?text=' + encodeURIComponent(rsvpText(r)), '_blank');
  }

  function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const r = collect(form);
    if (!r.name) {
      U.toast(I.t('toast.name'), 'warn');
      form.querySelector('[name=name]').focus();
      return;
    }
    const btn = form.querySelector('button[type=submit]');
    if (btn) btn.disabled = true;
    const send = (W.db && W.db.isConfigured()) ? W.db.submitRsvp(r) : Promise.reject(new Error('not configured'));
    send.catch(function () { W.store.submitRsvp(r); }).then(function () { showDone(r); });
  }

  function showDone(r) {
    const host = $('#rsvp-card');
    U.clear(host);
    host.appendChild(el('div', { class: 'done' }, [
      el('div', { class: 'done__tick', text: '✓' }),
      el('h3', { text: I.t('rsvp.thanks', { n: r.name.split(' ')[0] }) }),
      el('p', { text: I.t(/cannot/.test(r.attending) ? 'rsvp.missYou' : 'rsvp.got') }),
      el('div', { class: 'orn' }, el('i', { text: '❁' })),
      el('div', { class: 'rsvp-actions rsvp-actions--mid' }, [
        el('button', {
          class: 'btn btn--ghost', type: 'button',
          onclick: function () {
            if (!navigator.clipboard) { U.toast(I.t('toast.nocopy'), 'warn'); return; }
            navigator.clipboard.writeText(rsvpText(r)).then(function () { U.toast(I.t('toast.copiedReply')); });
          }
        }, el('span', { text: I.t('rsvp.copy') })),
        el('a', { class: 'btn btn--gold', href: 'guest.html' }, el('span', { text: I.t('rsvp.mine') })),
        el('button', {
          class: 'btn btn--ghost', type: 'button',
          onclick: function () { renderRsvp(); host.scrollIntoView({ behavior: 'smooth' }); }
        }, el('span', { text: I.t('rsvp.another') }))
      ])
    ]));
  }

  /* ---------------- calendar & share ---------------- */

  function calendarEvents() {
    return MINE.map(function (e) {
      return {
        uid: 'vm-' + e.id, date: e.date, start: e.start, end: e.open ? '' : e.end || '', alarm: e.alarm || 0,
        title: I.pick(e.t) + ' — ' + I.t('names.pair'),
        location: I.pick(e.where) + ', Hotel Khumani, Bhuwana Bypass, Udaipur',
        description: [I.pick(e.note),
          seatedHere(e) ? I.t(e.gather ? 'prog.gather' : 'prog.seated', { t: I.time(e.seated) }) : '',
          e.role && e.role[SIDE] ? I.pick(e.role[SIDE]) : ''].filter(Boolean).join('\n')
      };
    });
  }

  function initActions() {
    $$('[data-ics]').forEach(function (b) {
      b.addEventListener('click', function () {
        U.download(SIDE === 'bride' ? 'mahak-vaibhav-wedding.ics' : 'vaibhav-mahak-wedding.ics',
          U.buildICS(calendarEvents(), I.t('names.pair')), 'text/calendar');
        U.toast(I.t('toast.ics'));
      });
    });
    const share = $('#btn-share');
    if (share) share.addEventListener('click', function () {
      const payload = { title: I.t('names.pair') + ' — Udaipur, 1 & 2 Feb 2027', text: I.t('share.text'), url: location.href.split('?')[0].split('#')[0] };
      if (navigator.share) navigator.share(payload).catch(function () { /* dismissed */ });
      else if (navigator.clipboard) navigator.clipboard.writeText(payload.text + ' ' + payload.url).then(function () { U.toast(I.t('toast.copied')); });
      else U.toast(I.t('toast.nocopy'), 'warn');
    });
    const q = $('#faq-q');
    if (q) q.addEventListener('input', filterFaq);
    const snd = $('#sound-btn');
    if (snd) snd.addEventListener('click', Sound.toggle);
  }

  /* ---------------- boot ---------------- */

  function renderAll(again) {
    renderProgramme(again);
    renderVenue(again);
    renderStay(again);
    renderTravel(again);
    renderFaq(again);
    renderHelp(again);
    if (again) relabelRsvp();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSide();
    I.apply(document);
    paintOrnaments();
    initGate();
    initLang();
    initMenu();
    initCountdown();
    renderAll(false);
    renderRsvp();
    initActions();
    initFlight();
    fetchForecast();
    Sound.paint();
    setInterval(markNow, 30000);

    MO.boot(document);
    MO.initProgress($('#thread'));
    MO.initStickyNav($('#nav'), 140);
    MO.initSmoothLinks(document);
    MO.petals($('#hero-petals'), { count: 30, speed: 1 });
  });

  W.invite = { nowNext: nowNext, calendarEvents: calendarEvents, windowOf: windowOf, side: SIDE, programme: MINE };
})(window.W);
