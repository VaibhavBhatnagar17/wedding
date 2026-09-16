/* Rooms, travel desk and checklist. */
window.W = window.W || {}; W.views = W.views || {};

(function (W) {
  'use strict';
  const U = W.util, UI = W.ui, D = W.data, S = W.store, el = U.el;

  /* ================= ROOMS ================= */

  W.views.rooms = function () {
    const st = S.get();
    const wrap = el('div');

    // Anyone local, or who has declined, needs no room.
    const needsRoom = st.guests.filter(function (g) {
      return g.rsvp !== 'Declined' && !/^udaipur$/i.test((g.city || '').trim());
    });
    const assigned = needsRoom.filter(function (g) { return g.room; });
    const unassigned = needsRoom.filter(function (g) { return !g.room; });
    const hostPaid = st.guests.filter(function (g) { return g.hostPaid; });
    const hostHeads = U.sum(hostPaid, S.heads);

    // Two per room, rounded up.
    const roomsNeeded = needsRoom.reduce(function (a, g) { return a + Math.ceil(S.heads(g) / 2); }, 0);

    wrap.appendChild(UI.pageHead('Rooms',
      'The plan blocks rooms at a negotiated rate and lets guests pay their own. You cover ten — immediate family and the elders. Anyone based in Udaipur needs nothing.',
      [UI.btn('Export rooming list', function () {
        U.download('rooming-list.csv', U.toCSV(needsRoom.map(function (g) {
          return {
            room: g.room || '', name: g.name, pax: S.heads(g), side: g.side, group: g.group,
            city: g.city, phone: g.phone, paidBy: g.hostPaid ? 'Host' : 'Guest',
            arrival: g.arrival, departure: g.departure, notes: g.notes
          };
        }), ['room', 'name', 'pax', 'side', 'group', 'city', 'phone', 'paidBy', 'arrival', 'departure', 'notes']), 'text/csv');
        U.toast('Rooming list downloaded.');
      }, 'ghost')]));

    wrap.appendChild(UI.stats([
      UI.stat('Parties needing rooms', needsRoom.length, U.sum(needsRoom, S.heads) + ' heads'),
      UI.stat('Rooms needed', roomsNeeded, 'at 2 per room'),
      UI.stat('Assigned', assigned.length, unassigned.length + ' still unassigned', unassigned.length ? 'warn' : 'ok'),
      UI.stat('We are paying for', hostPaid.length, hostHeads + ' heads · budget covers 10 rooms',
        hostPaid.length > 10 ? 'bad' : 'ok'),
      UI.stat('Host room cost', U.inr(Math.max(hostPaid.length, 0) * 2 * 3000),
        'at ₹3,000/night × 2 nights',
        hostPaid.length > 10 ? 'bad' : null)
    ]));

    if (hostPaid.length > 10) {
      wrap.appendChild(el('div', { class: 'callout callout--warn', html:
        '<b>' + hostPaid.length + ' parties are marked as host-paid.</b> The budget covers ten rooms (₹60,000). ' +
        'Each additional room costs roughly ₹6,000 for two nights. Either trim the list or take it from contingency — but decide now, not in January.' }));
    }

    wrap.appendChild(el('div', { class: 'callout', html:
      '<b>How the room block works.</b> Negotiate a rate of ₹6,500–8,000 including breakfast against your food commitment, ' +
      'then circulate a booking link so guests pay the hotel direct. Extract 8–10 complimentary rooms and use those for the elders. ' +
      'Ground-floor rooms for anyone over 75 or with mobility needs — flag it in the guest notes and the hotel will honour it if you ask in December, not in January.' }));

    function patchRoom(id, key, val) { S.updateGuest(id, (function () { const o = {}; o[key] = val; return o; })()); }

    wrap.appendChild(UI.panel('Rooming list', {
      sub: 'Type a room number to assign. Tick the box for rooms you are paying for.',
      flush: true
    }, needsRoom.length ? UI.table([
      {
        key: 'room', label: 'Room', render: function (g) {
          const i = UI.input('room', g.room, { placeholder: '—', style: 'max-width:82px' });
          i.addEventListener('change', function (e) { patchRoom(g.id, 'room', e.target.value.trim()); });
          return i;
        }
      },
      {
        key: 'name', label: 'Guest', render: function (g) {
          return el('div', {}, [
            el('div', { class: 'nm', text: g.name }),
            el('div', { class: 'sm', text: [g.group, g.city].filter(Boolean).join(' · ') })
          ]);
        }
      },
      { key: 'pax', label: 'Pax', num: true, render: function (g) { return S.heads(g); } },
      { key: 'side', label: 'Side', render: function (g) { return UI.badge(g.side, g.side === 'Bride' ? 'info' : 'gold'); } },
      {
        key: 'arrival', label: 'In / out', render: function (g) {
          return el('span', { class: 'sm', text: (g.arrival ? U.fmtDate(g.arrival) : '?') + ' → ' + (g.departure ? U.fmtDate(g.departure) : '?') });
        }
      },
      {
        key: 'hostPaid', label: 'We pay', render: function (g) {
          const c = el('input', { type: 'checkbox', checked: g.hostPaid ? 'checked' : null, style: 'accent-color:var(--maroon)' });
          c.addEventListener('change', function (e) { patchRoom(g.id, 'hostPaid', e.target.checked); });
          return c;
        }
      },
      { key: 'notes', label: 'Notes', render: function (g) { return el('span', { class: 'sm', text: g.notes || '—' }); } }
    ], needsRoom.slice().sort(function (a, b) {
      // Unassigned first — that is the work queue.
      if (!a.room && b.room) return -1;
      if (a.room && !b.room) return 1;
      return String(a.room).localeCompare(String(b.room), undefined, { numeric: true });
    }))
      : UI.empty('Nobody needs a room yet', 'Add guests with a city other than Udaipur and they will appear here.')));

    return wrap;
  };

  /* ================= TRAVEL DESK ================= */

  W.views.travel = function () {
    const st = S.get();
    const wrap = el('div');

    const travelling = st.guests.filter(function (g) { return g.rsvp !== 'Declined' && g.arrival; });
    const noDetails = st.guests.filter(function (g) { return g.rsvp === 'Confirmed' && !g.arrival; });
    const byAir = travelling.filter(function (g) { return g.mode === 'Flight'; });
    const byRail = travelling.filter(function (g) { return g.mode === 'Train'; });

    wrap.appendChild(UI.pageHead('Travel desk',
      'Pickups grouped by arrival date and time. Batch anyone landing within 45 minutes of each other into one vehicle — that is where the transport budget is won or lost.',
      [UI.btn('Export pickup sheet', function () {
        U.download('pickup-sheet.csv', U.toCSV(travelling.map(function (g) {
          return {
            date: g.arrival, time: g.arrivalTime || '', mode: g.mode || '', name: g.name,
            pax: S.heads(g), phone: g.phone, city: g.city, departure: g.departure, notes: g.notes
          };
        }).sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); }),
          ['date', 'time', 'mode', 'name', 'pax', 'phone', 'city', 'departure', 'notes']), 'text/csv');
        U.toast('Pickup sheet downloaded.');
      }, 'ghost')]));

    wrap.appendChild(UI.stats([
      UI.stat('Travel plans on file', travelling.length, U.sum(travelling, S.heads) + ' heads'),
      UI.stat('Flying in', byAir.length, U.sum(byAir, S.heads) + ' heads · UDR airport'),
      UI.stat('By train', byRail.length, U.sum(byRail, S.heads) + ' heads · UDZ station'),
      UI.stat('Details missing', noDetails.length, 'confirmed but no arrival date',
        noDetails.length ? 'warn' : 'ok'),
      UI.stat('Transport budget', U.inr(40000), 'transfers, shuttle, baraat vehicle')
    ]));

    if (noDetails.length) {
      wrap.appendChild(el('div', { class: 'callout callout--warn', html:
        '<b>' + noDetails.length + ' confirmed part' + (noDetails.length === 1 ? 'y has' : 'ies have') + ' no travel details.</b> ' +
        'Chase these in the 20–25 January calling round — you cannot size vehicles without them.' }));
    }

    /* grouped by date */
    const byDate = U.groupBy(travelling, function (g) { return g.arrival; });
    Object.keys(byDate).sort().forEach(function (date) {
      const list = byDate[date].slice().sort(function (a, b) {
        return String(a.arrivalTime || '99:99').localeCompare(String(b.arrivalTime || '99:99'));
      });
      wrap.appendChild(UI.panel(U.fmtDate(date, true), {
        sub: list.length + ' arrival' + (list.length === 1 ? '' : 's') + ' · ' + U.sum(list, S.heads) + ' heads',
        flush: true
      }, UI.table([
        { key: 'arrivalTime', label: 'Time', render: function (g) { return el('span', { class: 'nm', text: g.arrivalTime || '—' }); } },
        { key: 'mode', label: 'Mode', render: function (g) { return g.mode ? UI.badge(g.mode, g.mode === 'Flight' ? 'info' : null) : '—'; } },
        {
          key: 'name', label: 'Guest', render: function (g) {
            return el('div', {}, [
              el('div', { class: 'nm', text: g.name }),
              el('div', { class: 'sm', text: g.city })
            ]);
          }
        },
        { key: 'pax', label: 'Pax', num: true, render: function (g) { return S.heads(g); } },
        { key: 'phone', label: 'Mobile', render: function (g) { return g.phone || '—'; } },
        { key: 'departure', label: 'Departs', render: function (g) { return g.departure ? U.fmtDate(g.departure) : '—'; } },
        { key: 'notes', label: 'Notes', render: function (g) { return el('span', { class: 'sm', text: g.notes || '—' }); } }
      ], list)));
    });

    if (!travelling.length) {
      wrap.appendChild(UI.panel('No travel details yet', {},
        UI.empty('Nothing to plan yet', 'Arrival dates come in through the RSVP form, or you can add them on each guest record.')));
    }

    const t = D.venue.travel;
    wrap.appendChild(UI.panel('Reference', {}, (function () {
      const dl = el('dl', { class: 'kv' });
      [['Airport', t.airport], ['Railway', t.rail], ['Road', t.road], ['Weather', t.weather]]
        .forEach(function (p) { dl.appendChild(el('dt', { text: p[0] })); dl.appendChild(el('dd', { text: p[1] })); });
      return dl;
    })()));

    return wrap;
  };

  /* ================= CHECKLIST ================= */

  W.views.checklist = function () {
    const st = S.get();
    const wrap = el('div');
    const done = st.checklist.filter(function (c) { return c.done; }).length;

    wrap.appendChild(UI.pageHead('Checklist',
      'Sequenced backwards from the wedding date. The order matters more than the dates — venue before décor, photographer before almost everything.',
      [UI.btn('Print', function () { window.print(); }, 'ghost')]));

    wrap.appendChild(UI.stats([
      UI.stat('Done', done + ' / ' + st.checklist.length, U.pct(done, st.checklist.length) + ' complete',
        done === st.checklist.length ? 'ok' : null),
      UI.stat('Days to go', Math.max(0, U.daysUntil(D.couple.weddingDate)), U.fmtDate(D.couple.weddingDate, true)),
      UI.stat('Open tasks', st.checklist.length - done, 'across all phases',
        st.checklist.length - done > 0 ? 'warn' : 'ok')
    ]));

    const phases = U.groupBy(st.checklist, function (c) { return c.phase; });
    const order = ['Sep–Oct 2026', 'Nov 2026', 'Dec 2026', 'Jan 2027', '20–25 Jan', '29–30 Jan'];

    order.filter(function (p) { return phases[p]; }).forEach(function (phase) {
      const items = phases[phase];
      const pdone = items.filter(function (c) { return c.done; }).length;

      wrap.appendChild(UI.panel(phase, {
        sub: pdone + ' of ' + items.length + ' done',
        actions: [UI.btn(pdone === items.length ? 'Reopen all' : 'Mark all done', function () {
          const target = pdone !== items.length;
          S.update(function (s) {
            s.checklist.forEach(function (c) { if (c.phase === phase) c.done = target; });
          });
        }, 'ghost')]
      }, el('ul', { class: 'ul-clean', style: 'margin:0' }, items.map(function (c) {
        const box = el('input', {
          type: 'checkbox', checked: c.done ? 'checked' : null,
          style: 'accent-color:var(--maroon);width:16px;height:16px;margin-right:10px;cursor:pointer'
        });
        box.addEventListener('change', function (e) {
          const v = e.target.checked;
          S.update(function (s) {
            const row = s.checklist.find(function (x) { return x.id === c.id; });
            if (row) row.done = v;
          });
        });
        return el('li', { style: 'padding-left:0;display:flex;align-items:flex-start;gap:0' }, [
          box,
          el('div', { style: 'flex:1' }, [
            el('span', {
              text: c.task,
              style: c.done ? 'text-decoration:line-through;color:var(--muted)' : ''
            }),
            el('div', {}, UI.badge(c.owner, 'info'))
          ])
        ]);
      }))));
    });

    // The ::before ornament clashes with the checkbox layout, so suppress it here.
    const style = el('style', { text: '.panel .ul-clean li[style*="padding-left:0"]::before{content:none}' });
    wrap.appendChild(style);

    return wrap;
  };
})(window.W);
