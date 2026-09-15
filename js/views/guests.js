/* Guest manager — the workhorse screen. */
window.W = window.W || {}; W.views = W.views || {};

(function (W) {
  'use strict';
  const U = W.util, UI = W.ui, D = W.data, S = W.store, el = U.el;

  // Filter state lives outside the render so it survives re-renders.
  const f = { q: '', side: '', group: '', rsvp: '', fn: '', diet: '' };
  let sortKey = 'name', sortDir = 1;

  const FN_OPTS = D.functions.map(function (x) { return { value: x.id, label: x.name }; });

  function matches(g) {
    if (f.side && g.side !== f.side) return false;
    if (f.group && g.group !== f.group) return false;
    if (f.rsvp && g.rsvp !== f.rsvp) return false;
    if (f.diet && g.diet !== f.diet) return false;
    if (f.fn && !(g.inv && g.inv[f.fn])) return false;
    if (f.q) {
      const q = f.q.toLowerCase();
      const hay = [g.name, g.city, g.phone, g.email, g.notes, g.room, g.group].join(' ').toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }

  function sorted(list) {
    return list.slice().sort(function (a, b) {
      let va, vb;
      if (sortKey === 'heads') { va = S.heads(a); vb = S.heads(b); }
      else { va = String(a[sortKey] || '').toLowerCase(); vb = String(b[sortKey] || '').toLowerCase(); }
      if (va < vb) return -1 * sortDir;
      if (va > vb) return 1 * sortDir;
      return 0;
    });
  }

  /* ---------- add / edit ---------- */

  function guestForm(g) {
    const body = el('div');
    body.appendChild(el('div', { class: 'grid-2' }, [
      UI.field('Name (person or family)', UI.input('name', g.name, { placeholder: 'e.g. Sharma Family', required: 'required' })),
      UI.field('City', UI.input('city', g.city, { placeholder: 'e.g. Delhi' }))
    ]));
    body.appendChild(el('div', { class: 'grid-2' }, [
      UI.field('Side', UI.select('side', g.side, ['Bride', 'Groom'])),
      UI.field('Group', UI.select('group', g.group, D.GROUPS))
    ]));
    body.appendChild(el('div', { class: 'grid-2' }, [
      UI.field('Adults', UI.input('adults', g.adults, { type: 'number', min: '1' })),
      UI.field('Children', UI.input('kids', g.kids, { type: 'number', min: '0' }))
    ]));
    body.appendChild(el('div', { class: 'grid-2' }, [
      UI.field('Mobile', UI.input('phone', g.phone, { type: 'tel' })),
      UI.field('Email', UI.input('email', g.email, { type: 'email' }))
    ]));
    body.appendChild(el('div', { class: 'grid-2' }, [
      UI.field('Food preference', UI.select('diet', g.diet, D.DIETS)),
      UI.field('RSVP', UI.select('rsvp', g.rsvp, D.RSVPS))
    ]));

    body.appendChild(el('label', { class: 'field' }, [
      el('span', { text: 'Invited to' }),
      el('div', { class: 'chip-row', style: 'gap:12px' }, D.functions.map(function (x) {
        return UI.checkbox('inv_' + x.id, g.inv && g.inv[x.id], x.name);
      }))
    ]));

    body.appendChild(el('div', { class: 'grid-2' }, [
      UI.field('Arriving on', UI.input('arrival', g.arrival, { type: 'date' })),
      UI.field('Arrival time', UI.input('arrivalTime', g.arrivalTime, { type: 'time' }))
    ]));
    body.appendChild(el('div', { class: 'grid-2' }, [
      UI.field('Departing on', UI.input('departure', g.departure, { type: 'date' })),
      UI.field('Travelling by', UI.select('mode', g.mode, ['', 'Flight', 'Train', 'Car', 'Bus', 'Not decided']))
    ]));
    body.appendChild(el('div', { class: 'grid-2' }, [
      UI.field('Room', UI.input('room', g.room, { placeholder: 'e.g. 204' })),
      el('div', { style: 'padding-top:22px;display:flex;gap:16px;flex-wrap:wrap' }, [
        UI.checkbox('hostPaid', g.hostPaid, 'Room paid by us'),
        UI.checkbox('giftReceived', g.giftReceived, 'Gift received')
      ])
    ]));
    body.appendChild(UI.field('Notes', el('textarea', { name: 'notes', text: g.notes || '' })));
    return body;
  }

  function readForm(box) {
    function v(name) { const n = box.querySelector('[name="' + name + '"]'); return n ? n.value : ''; }
    function c(name) { const n = box.querySelector('[name="' + name + '"]'); return n ? n.checked : false; }
    const inv = {};
    D.functions.forEach(function (x) { inv[x.id] = c('inv_' + x.id); });
    return {
      name: v('name').trim(), city: v('city').trim(), side: v('side'), group: v('group'),
      adults: Math.max(1, Number(v('adults')) || 1), kids: Math.max(0, Number(v('kids')) || 0),
      phone: v('phone').trim(), email: v('email').trim(), diet: v('diet'), rsvp: v('rsvp'),
      inv: inv,
      arrival: v('arrival'), arrivalTime: v('arrivalTime'), departure: v('departure'), mode: v('mode'),
      room: v('room').trim(), hostPaid: c('hostPaid'), giftReceived: c('giftReceived'),
      notes: v('notes').trim()
    };
  }

  function openGuest(existing) {
    const g = existing || S.blankGuest();
    const m = UI.modal(existing ? 'Edit guest' : 'Add guest', guestForm(g), {
      confirmLabel: existing ? 'Save changes' : 'Add guest',
      onConfirm: function () {
        const patch = readForm(m.box);
        if (!patch.name) { U.toast('A name is required.', 'warn'); return false; }
        if (existing) { S.updateGuest(existing.id, patch); U.toast('Guest updated.'); }
        else { S.addGuest(patch); U.toast('Guest added.'); }
      }
    });
  }

  /* ---------- CSV import ---------- */

  function openImport() {
    const modeSel = UI.select('mode', 'append', [
      { value: 'append', label: 'Add to the existing list' },
      { value: 'replace', label: 'Replace the entire list' }
    ]);
    const status = el('div', { style: 'margin-top:12px;font-size:13px;color:var(--muted)' });
    let pendingText = null;

    const body = el('div', {}, [
      el('p', { html: 'Upload a CSV with a <strong>name</strong> column. Function columns (<code>haldi</code>, <code>sangeet</code>, <code>phere</code>, <code>reception</code>, <code>mehndi</code>) accept <code>yes</code>/<code>no</code>.' }),
      el('div', { style: 'margin-bottom:12px' },
        UI.btn('Download the template', function () { S.csvTemplate(); }, 'ghost')),
      UI.field('On import', modeSel),
      UI.fileButton('Choose CSV file…', '.csv,text/csv', function (text, filename) {
        pendingText = text;
        const rows = U.parseCSV(text);
        status.innerHTML = '<strong>' + filename + '</strong> — ' + rows.length + ' row' + (rows.length === 1 ? '' : 's') + ' ready to import.';
      }),
      status
    ]);

    UI.modal('Import guest list', body, {
      confirmLabel: 'Import',
      onConfirm: function () {
        if (!pendingText) { U.toast('Choose a CSV file first.', 'warn'); return false; }
        const res = S.importGuestsCSV(pendingText, modeSel.value);
        if (res.error) { U.toast(res.error, 'bad'); return false; }
        U.toast('Imported ' + res.added + ' guest' + (res.added === 1 ? '' : 's') +
          (res.skipped ? ' · ' + res.skipped + ' row(s) skipped (no name)' : '') + '.');
      }
    });
  }

  /* ---------- render ---------- */

  W.views.guests = function () {
    const st = S.get();
    const wrap = el('div');

    wrap.appendChild(UI.pageHead('Guests',
      'One row per family or party — that is how caterers and hotels count. Headcount rolls up from adults plus children.',
      [
        UI.btn('Add guest', function () { openGuest(null); }),
        UI.btn('Import CSV', openImport, 'ghost'),
        UI.btn('Export CSV', function () { S.exportGuestsCSV(); U.toast('Guest list downloaded.'); }, 'ghost')
      ]));

    /* stats */
    const totalHeads = U.sum(st.guests, S.heads);
    const confirmed = st.guests.filter(function (g) { return g.rsvp === 'Confirmed'; });
    const pending = st.guests.filter(function (g) { return g.rsvp === 'Pending'; });
    const declined = st.guests.filter(function (g) { return g.rsvp === 'Declined'; });

    wrap.appendChild(UI.stats([
      UI.stat('Parties', st.guests.length, totalHeads + ' heads in total'),
      UI.stat('Confirmed', U.sum(confirmed, S.heads), confirmed.length + ' parties', 'ok'),
      UI.stat('Pending', U.sum(pending, S.heads), pending.length + ' parties', pending.length ? 'warn' : null),
      UI.stat('Declined', U.sum(declined, S.heads), declined.length + ' parties'),
      UI.stat('Reception invited', S.functionStats('reception').invitedHeads, 'target ' + D.couple.guestCountReception),
      UI.stat('Core invited', S.functionStats('phere').invitedHeads, 'target ' + D.couple.guestCountCore)
    ]));

    /* filters */
    const qInput = UI.input('q', f.q, { placeholder: 'Search name, city, phone, notes…' });
    qInput.addEventListener('input', U.debounce(function (e) { f.q = e.target.value; W.render(); }, 250));

    function filterSelect(key, blank, options) {
      const s = UI.select(key, f[key], [{ value: '', label: blank }].concat(options));
      s.addEventListener('change', function (e) { f[key] = e.target.value; W.render(); });
      return s;
    }

    const shown = sorted(st.guests.filter(matches));

    const filters = el('div', { class: 'filters no-print' }, [
      qInput,
      filterSelect('side', 'Both sides', ['Bride', 'Groom']),
      filterSelect('group', 'All groups', D.GROUPS),
      filterSelect('rsvp', 'Any RSVP', D.RSVPS),
      filterSelect('fn', 'Any function', FN_OPTS),
      filterSelect('diet', 'Any diet', D.DIETS),
      el('div', { class: 'spacer' }),
      el('div', { class: 'count', text: shown.length + ' of ' + st.guests.length + ' parties · ' + U.sum(shown, S.heads) + ' heads' }),
      UI.btn('Clear', function () {
        Object.keys(f).forEach(function (k) { f[k] = ''; });
        W.render();
      }, 'ghost')
    ]);

    /* table */
    const columns = [
      {
        key: 'name', label: 'Name', render: function (g) {
          return el('div', {}, [
            el('div', { class: 'nm', text: g.name || '(unnamed)' }),
            el('div', { class: 'sm', text: [g.group, g.city].filter(Boolean).join(' · ') })
          ]);
        }
      },
      { key: 'side', label: 'Side', render: function (g) { return UI.badge(g.side, g.side === 'Bride' ? 'info' : 'gold'); } },
      {
        key: 'heads', label: 'Pax', num: true, render: function (g) {
          return el('div', {}, [
            el('div', { text: String(S.heads(g)) }),
            g.kids ? el('div', { class: 'sm', text: g.adults + 'A ' + g.kids + 'C' }) : null
          ]);
        }
      },
      {
        key: 'inv', label: 'Functions', sortable: false, render: function (g) {
          const short = { mehndi: 'Me', haldi: 'Ha', sangeet: 'Sa', phere: 'Ph', reception: 'Re' };
          return el('div', { class: 'chip-row' }, D.functions.map(function (x) {
            const on = g.inv && g.inv[x.id];
            return el('span', {
              class: 'badge' + (on ? ' badge--gold' : ''),
              style: on ? '' : 'opacity:.32',
              title: x.name + (on ? ' — invited' : ' — not invited'),
              text: short[x.id] || x.id.slice(0, 2)
            });
          }));
        }
      },
      {
        key: 'rsvp', label: 'RSVP', render: function (g) {
          const s = UI.select('rsvp', g.rsvp, D.RSVPS);
          s.style.maxWidth = '116px';
          s.addEventListener('change', function (e) { S.updateGuest(g.id, { rsvp: e.target.value }); });
          return s;
        }
      },
      { key: 'diet', label: 'Diet', render: function (g) { return el('span', { class: 'sm', text: g.diet }); } },
      {
        key: 'room', label: 'Room', render: function (g) {
          return el('div', {}, [
            el('span', { text: g.room || '—' }),
            g.hostPaid ? el('div', {}, UI.badge('we pay', 'warn')) : null
          ]);
        }
      },
      {
        key: 'actions', label: '', sortable: false, render: function (g) {
          return el('div', { class: 'row-actions no-print' }, [
            UI.btn('Edit', function () { openGuest(g); }, 'ghost btn--sm'),
            el('button', {
              class: 'btn btn--danger btn--sm', type: 'button', text: '✕', title: 'Remove',
              onclick: function () {
                UI.confirmModal('Remove guest',
                  'Remove <strong>' + (g.name || 'this guest') + '</strong> from the list? This cannot be undone.',
                  function () { S.removeGuest(g.id); U.toast('Removed.'); }, 'Remove');
              }
            })
          ]);
        }
      }
    ];

    const body = shown.length
      ? UI.table(columns, shown, {
          onSort: function (key) {
            if (key === 'actions' || key === 'inv') return;
            if (sortKey === key) sortDir = -sortDir; else { sortKey = key; sortDir = 1; }
            W.render();
          }
        })
      : UI.empty('No guests match',
          st.guests.length ? 'Try clearing the filters.' : 'Import your list as a CSV, or add the first family by hand.',
          UI.btn('Add guest', function () { openGuest(null); }));

    const panel = el('section', { class: 'panel' }, [filters, el('div', { class: 'panel__body panel__body--flush' }, body)]);
    wrap.appendChild(panel);

    /* dietary rollup — the caterer will ask for exactly this */
    const dietRows = D.functions.filter(function (x) { return x.perPlate > 0; }).map(function (x) {
      const counts = S.dietCounts(x.id);
      return el('tr', {}, [el('td', { class: 'nm', text: x.name })].concat(
        D.DIETS.map(function (d) { return el('td', { class: 'num', text: counts[d] || 0 }); })
      ));
    });

    wrap.appendChild(UI.panel('Dietary counts to hand the caterer', {
      sub: 'Excludes anyone who has declined. Jain and no-onion-no-garlic guests need a separate labelled counter.',
      flush: true
    }, el('div', { class: 'tbl-scroll' },
      el('table', { class: 'tbl' }, [
        el('thead', {}, el('tr', {}, [el('th', { text: 'Function' })].concat(
          D.DIETS.map(function (d) { return el('th', { class: 'num', text: d }); })
        ))),
        el('tbody', {}, dietRows)
      ])
    )));

    return wrap;
  };
})(window.W);
