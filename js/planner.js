/* Console shell: sidebar, hash router, re-render on state change. */
(function (W) {
  'use strict';

  const U = W.util, UI = W.ui, D = W.data, S = W.store, el = U.el, $ = U.$;

  const ROUTES = [
    { id: 'dashboard', label: 'Dashboard', icon: '◈' },
    { id: 'guests', label: 'Guests', icon: '☰', count: function () { return S.get().guests.length; } },
    { id: 'functions', label: 'Functions', icon: '❁', count: function () { return D.functions.length; } },
    { id: 'venue', label: 'Venue', icon: '⌂' },
    { id: 'budget', label: 'Budget', icon: '₹' },
    { id: 'vendors', label: 'Vendors', icon: '✎', count: function () {
        return S.get().vendors.filter(function (v) { return v.status === 'To book'; }).length || null;
      } },
    { id: 'rooms', label: 'Rooms', icon: '⚿' },
    { id: 'travel', label: 'Travel desk', icon: '✈' },
    { id: 'checklist', label: 'Checklist', icon: '✓', count: function () {
        return S.get().checklist.filter(function (c) { return !c.done; }).length || null;
      } },
    { id: 'strategy', label: 'Strategy', icon: '❖' },
    { id: 'inbox', label: 'RSVP inbox', icon: '✉', count: function () { return S.readRsvps().length || null; } }
  ];

  function currentRoute() {
    const id = (location.hash || '').replace(/^#\/?/, '') || 'dashboard';
    return ROUTES.some(function (r) { return r.id === id; }) ? id : 'dashboard';
  }

  /* ---------- sidebar ---------- */

  function buildSidebar() {
    const days = U.daysUntil(D.couple.weddingDate);

    const nav = el('ul', { class: 'side__nav' }, ROUTES.map(function (r) {
      const n = r.count ? r.count() : null;
      return el('li', {}, el('a', {
        href: '#/' + r.id, dataset: { route: r.id }
      }, [
        el('i', { text: r.icon }),
        el('span', { text: r.label }),
        n ? el('span', { class: 'n', text: String(n) }) : null
      ]));
    }));

    return el('aside', { class: 'side', id: 'side' }, [
      el('div', { class: 'side__brand' }, [
        el('div', { class: 'side__mono', text: 'Vaibhav & Mahak' }),
        el('div', { class: 'side__sub', text: 'Udaipur · Feb 2027' })
      ]),
      el('div', { class: 'side__cd' }, [
        el('b', { text: days > 0 ? String(days) : '0' }),
        el('span', { text: days > 0 ? 'days to the phere' : 'the day is here' })
      ]),
      nav,
      el('div', { class: 'side__foot' }, [
        el('a', { href: 'index.html', target: '_blank', text: 'View the invitation ↗' }),
        el('a', { href: '#', text: 'Backup / restore', onclick: function (e) { e.preventDefault(); openData(); } })
      ])
    ]);
  }

  function markActive() {
    const id = currentRoute();
    U.$$('.side__nav a').forEach(function (a) {
      a.classList.toggle('is-active', a.dataset.route === id);
    });
  }

  /* ---------- backup / restore ---------- */

  function openData() {
    const body = el('div', {}, [
      el('p', { html: 'Everything in this console lives in <strong>this browser only</strong>. There is no server. ' +
        'Download a backup regularly, and restore it to move the plan to another device or share it with family.' }),
      el('div', { style: 'display:flex;gap:10px;flex-wrap:wrap;margin:16px 0' }, [
        UI.btn('Download backup (.json)', function () { S.exportAll(); U.toast('Backup downloaded.'); }, 'gold'),
        UI.fileButton('Restore from backup…', '.json,application/json', function (text) {
          const res = S.importAll(text);
          if (res.ok) { U.toast('Restored.'); render(); }
          else U.toast(res.error, 'bad');
        })
      ]),
      el('div', { style: 'display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px' }, [
        UI.btn('Export guest list (.csv)', function () { S.exportGuestsCSV(); }, 'ghost'),
        UI.btn('Download CSV template', function () { S.csvTemplate(); }, 'ghost')
      ]),
      el('hr', { style: 'border:none;border-top:1px solid var(--line);margin:18px 0' }),
      el('p', { style: 'font-size:13px;color:var(--muted)', html:
        'Resetting wipes your guest list, budget entries and vendor notes, and restores the original plan.' }),
      UI.btn('Reset everything', function () {
        UI.confirmModal('Reset everything',
          'This deletes your guest list, all budget and vendor entries, and every checklist tick. Download a backup first if you are not certain.',
          function () { S.resetAll(); U.toast('Reset to the original plan.'); render(); }, 'Reset');
      }, 'danger')
    ]);
    UI.modal('Backup & restore', body, {});
  }

  /* ---------- render ---------- */

  function render() {
    const id = currentRoute();
    const main = $('#main');
    if (!main) return;
    U.clear(main);

    const view = W.views[id];
    if (!view) {
      main.appendChild(UI.pageHead('Not found', 'That screen does not exist.'));
      return;
    }
    try {
      main.appendChild(view());
    } catch (err) {
      main.appendChild(UI.pageHead('Something broke', 'The ' + id + ' screen failed to render.'));
      main.appendChild(el('pre', {
        style: 'background:#fdeef0;border:1px solid #ecc3c6;border-radius:9px;padding:14px;overflow:auto;font-size:12.5px',
        text: String(err && err.stack || err)
      }));
      if (window.console) console.error(err);
    }

    // Refresh sidebar counts without losing scroll position.
    const side = $('#side');
    if (side) {
      const wasOpen = side.classList.contains('is-open');
      const fresh = buildSidebar();
      if (wasOpen) fresh.classList.add('is-open');
      side.replaceWith(fresh);
    }
    markActive();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  W.render = render;

  /* ---------- boot ---------- */

  document.addEventListener('DOMContentLoaded', function () {
    const shell = el('div', { class: 'shell' }, [
      buildSidebar(),
      el('main', { class: 'main', id: 'main' })
    ]);

    const toggle = el('button', {
      class: 'side__toggle no-print', type: 'button', 'aria-label': 'Menu', text: '☰',
      onclick: function () { $('#side').classList.toggle('is-open'); }
    });

    document.body.appendChild(toggle);
    document.body.appendChild(shell);

    // Close the mobile drawer after navigating.
    document.addEventListener('click', function (e) {
      const a = e.target.closest && e.target.closest('.side__nav a');
      if (a) { const s = $('#side'); if (s) s.classList.remove('is-open'); }
    });

    window.addEventListener('hashchange', render);
    // Re-render on any state mutation so counts and totals stay honest.
    S.subscribe(U.debounce(render, 60));

    if (!location.hash) location.hash = '#/dashboard';
    render();
  });
})(window.W);
