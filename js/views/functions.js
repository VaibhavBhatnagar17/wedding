/* Functions — schedule, décor brief, menu and headcount for each event. */
window.W = window.W || {}; W.views = W.views || {};

W.views.functions = function () {
  'use strict';
  const U = W.util, UI = W.ui, D = W.data, S = W.store, el = U.el;
  const wrap = el('div');

  wrap.appendChild(UI.pageHead('Functions',
    'Five functions across three days at one venue. Timings, décor briefs and menus — this is what you hand to the venue and the décor team.',
    [UI.btn('Print run sheet', function () { window.print(); }, 'ghost')]));

  const KEY = /HALDI|RING|SANGEET|BARAAT|VARMALA|PHERE|Couple entry|Vidaai|mehndi begins|Lighting test|sound OFF/i;

  /* sequence summary */
  wrap.appendChild(UI.panel('The sequence, and why', {}, [
    el('div', { class: 'qa' }, [
      el('b', { text: 'Engagement sits inside the sangeet evening' }),
      el('span', { text: 'A 30-minute ring ceremony at 19:00 on the sangeet stage. A standalone engagement means another dinner for 285, another décor setup and another venue slot — about ₹2.6 lakh. This reads as intentional and paces the night better.' })
    ]),
    el('div', { class: 'qa' }, [
      el('b', { text: 'Haldi and phere are daylight functions' }),
      el('span', { text: 'No lighting rig on two of the four setups. It is also how you get a 300-guest haldi for ₹475 a head — a brunch, not a lunch.' })
    ]),
    el('div', { class: 'qa' }, [
      el('b', { text: 'Mandap and reception need separate spaces' }),
      el('span', { text: 'Both fall on 2 Feb. Sharing one lawn forces a brutal three-hour décor flip between lunch and the reception. Negotiate free use of a second lawn — it is the most valuable thing you can ask the venue for after the rate itself.' })
    ]),
    el('div', { class: 'qa' }, [
      el('b', { text: 'A rest block from 13:00 to 16:30 on Day 1, and 16:00 to 18:30 on Day 2' }),
      el('span', { text: 'Non-negotiable. Guests who are exhausted by the reception do not dance, and the couple photographs badly. Protect these two windows against every request to add something.' })
    ]),
    el('div', { class: 'qa' }, [
      el('b', { text: 'Vidaai on the morning of 3 Feb' }),
      el('span', { text: 'Doing it at 22:45 after the reception means a rushed goodbye in the dark on 16 hours of no sleep. The next morning gives you daylight, calm, and one extra night only for immediate family.' })
    ])
  ]));

  /* per-function detail */
  D.functions.forEach(function (fn, idx) {
    const stats = S.functionStats(fn.id);
    const guarantee = fn.id === 'reception' ? D.couple.guaranteeReception : D.couple.guaranteeCore;

    const meta = el('dl', { class: 'kv', style: 'margin-bottom:16px' });
    function kv(k, v) { meta.appendChild(el('dt', { text: k })); meta.appendChild(el('dd', { html: v })); }
    kv('Date', U.fmtDate(fn.date, true));
    kv('Window', fn.start + ' – ' + fn.end + (fn.muhurat ? ' · <strong>muhurat ' + fn.muhurat + '</strong>' : ''));
    kv('Space', fn.area);
    kv('Dress code', fn.dressCode);
    kv('Invited', fn.guests + ' planned · <strong>' + stats.invitedHeads + '</strong> on the list · ' +
      stats.confirmedHeads + ' confirmed');
    if (fn.perPlate) {
      kv('Per plate', U.inr(fn.perPlate) + ' × guarantee ' + guarantee + ' = <strong>' + U.inr(fn.perPlate * guarantee) + '</strong>');
      kv('Décor', U.inr(fn.decorBudget));
    } else {
      kv('Cost', 'Folded into the welcome-food line · <strong>zero décor spend</strong>');
    }

    const sched = el('ul', { class: 'sched' }, fn.schedule.map(function (r) {
      return el('li', { class: KEY.test(r[1]) ? 'is-key' : '' }, [
        el('time', { text: r[0] }), el('span', { text: r[1] })
      ]);
    }));

    const cols = el('div', { class: 'cols' }, [
      el('div', {}, [
        el('h4', { style: 'font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin-bottom:10px', text: 'Running order' }),
        sched
      ]),
      el('div', {}, [
        el('h4', { style: 'font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin-bottom:10px', text: 'Décor brief' }),
        el('ul', { class: 'ul-clean' }, fn.decor.map(function (d) { return el('li', { text: d }); })),
        el('h4', { style: 'font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin:20px 0 10px', text: 'Menu' }),
        el('ul', { class: 'ul-clean' }, fn.menu.map(function (d) { return el('li', { text: d }); }))
      ])
    ]);

    wrap.appendChild(UI.panel(
      String(idx + 1).padStart(2, '0') + ' · ' + fn.name + (fn.optional ? '  (optional)' : ''),
      { sub: fn.tagline },
      [
        el('p', { style: 'font-size:14px', text: fn.summary }),
        meta,
        cols
      ]
    ));
  });

  /* cost roll-up */
  const rows = D.functions.map(function (fn) {
    const guarantee = fn.id === 'reception' ? D.couple.guaranteeReception : D.couple.guaranteeCore;
    const food = fn.perPlate * (fn.perPlate ? guarantee : 0);
    return { fn: fn, food: food, decor: fn.decorBudget, total: food + fn.decorBudget };
  });
  const totalAll = U.sum(rows, function (r) { return r.total; });

  wrap.appendChild(UI.panel('Cost per function', {
    sub: 'Food and décor only — photography, entertainment and personal spend sit outside this table.',
    flush: true
  }, UI.table([
    { key: 'name', label: 'Function', render: function (r) { return el('span', { class: 'nm', text: r.fn.name }); } },
    { key: 'pax', label: 'Guarantee', num: true, render: function (r) { return r.fn.perPlate ? (r.fn.id === 'reception' ? D.couple.guaranteeReception : D.couple.guaranteeCore) : '—'; } },
    { key: 'pp', label: 'Per plate', num: true, render: function (r) { return r.fn.perPlate ? U.inr(r.fn.perPlate) : '—'; } },
    { key: 'food', label: 'Food', num: true, render: function (r) { return r.food ? U.inr(r.food) : '—'; } },
    { key: 'decor', label: 'Décor', num: true, render: function (r) { return r.decor ? U.inr(r.decor) : '₹0'; } },
    { key: 'total', label: 'Total', num: true, render: function (r) { return el('strong', { text: U.inr(r.total) }); } }
  ], rows, {
    footer: [
      el('td', { text: 'Total', colspan: '5' }),
      el('td', { class: 'num', text: U.inr(totalAll) })
    ]
  })));

  return wrap;
};
