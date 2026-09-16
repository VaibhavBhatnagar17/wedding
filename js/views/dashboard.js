/* Dashboard — the one screen to check every morning. */
window.W = window.W || {}; W.views = W.views || {};

W.views.dashboard = function () {
  'use strict';
  const U = W.util, UI = W.ui, D = W.data, S = W.store, el = U.el;
  const st = S.get();

  const days = U.daysUntil(D.couple.weddingDate);
  const bt = S.budgetTotals();
  const core = S.functionStats('phere');
  const rec = S.functionStats('reception');
  const pendingParties = st.guests.filter(function (g) { return g.rsvp === 'Pending'; }).length;
  const doneTasks = st.checklist.filter(function (c) { return c.done; }).length;
  const inbox = S.readRsvps().length;

  const wrap = el('div');

  wrap.appendChild(UI.pageHead(
    'Vaibhav & Mahak',
    'Udaipur · 31 Jan – 2 Feb 2027 · phere at 11:00 on the 2nd. Budget ₹20,00,000 all-in.',
    [
      UI.btn('Open invitation', function () { window.open('index.html', '_blank'); }, 'ghost'),
      UI.btn('Backup everything', function () { S.exportAll(); U.toast('Backup downloaded.'); }, 'gold')
    ]
  ));

  /* ---- headline stats ---- */

  wrap.appendChild(UI.stats([
    UI.stat('Days to go', days > 0 ? days : 'Today', U.fmtDate(D.couple.weddingDate, true)),
    UI.stat('Budget planned', U.lakh(bt.planned), 'Locked at ₹20.00 L'),
    UI.stat('Committed so far', U.lakh(bt.actual),
      bt.actual === 0 ? 'Nothing signed yet'
        : (bt.variance > 0 ? '<strong>' + U.inr(bt.variance) + ' over plan</strong>'
          : (bt.variance < 0 ? U.inr(-bt.variance) + ' still uncommitted' : 'Exactly on plan')),
      bt.actual === 0 ? null : (bt.variance > 0 ? 'bad' : 'ok')),
    UI.stat('Paid out', U.lakh(bt.paid), U.inr(bt.outstanding) + ' still owed'),
    UI.stat('Guest parties', st.guests.length, pendingParties + ' awaiting RSVP', pendingParties ? 'warn' : 'ok'),
    UI.stat('Checklist', doneTasks + ' / ' + st.checklist.length, 'tasks done')
  ]));

  /* ---- alerts ---- */

  const alerts = [];
  if (!st.venueChoice.name) {
    alerts.push('<b>No venue booked.</b> This is the critical path — everything else waits on it. Site-visit three properties from the shortlist and negotiate on a Tuesday rate.');
  }
  const noPhotog = st.vendors.find(function (v) { return v.cat === 'Photography' && v.status === 'To book'; });
  if (noPhotog) {
    alerts.push('<b>Photographer not booked.</b> The good ones in Udaipur are gone 12+ months out for February. Book this before the décor.');
  }
  if (core.confirmedHeads > D.couple.guaranteeCore) {
    alerts.push('<b>Core functions are over the catering guarantee.</b> ' + core.confirmedHeads +
      ' confirmed against a guarantee of ' + D.couple.guaranteeCore + '. Every extra head costs about ₹1,725 across the two days.');
  }
  if (rec.confirmedHeads > D.couple.guaranteeReception) {
    alerts.push('<b>Reception is over the guarantee.</b> ' + rec.confirmedHeads +
      ' confirmed against ' + D.couple.guaranteeReception + '. Renegotiate before you cross 5%.');
  }
  if (inbox) {
    alerts.push('<b>' + inbox + ' new RSVP' + (inbox > 1 ? 's' : '') + '</b> waiting in the inbox. Merge them into the guest list.');
  }

  if (alerts.length) {
    wrap.appendChild(UI.panel('Needs your attention', {}, alerts.map(function (a) {
      return el('div', { class: 'callout callout--warn', html: a });
    })));
  }

  /* ---- two columns ---- */

  const cols = el('div', { class: 'cols' });

  /* headcount vs guarantee */
  const fnRows = D.functions.filter(function (f) { return f.perPlate > 0; }).map(function (f) {
    const s = S.functionStats(f.id);
    const guarantee = f.guarantee;
    return {
      label: f.name,
      value: s.confirmedHeads,
      max: guarantee,
      tone: s.confirmedHeads > guarantee ? 'over' : 'ok',
      right: '<strong>' + s.confirmedHeads + '</strong> confirmed · ' + s.pendingHeads +
        ' pending · guarantee ' + guarantee
    };
  });

  cols.appendChild(UI.panel('Headcount against catering guarantee', {
    sub: 'Venues bill max(guarantee, actual). Stay at or just under the bar.'
  }, [
    UI.hbars(fnRows),
    el('p', { class: 'hint', style: 'margin:16px 0 0;font-size:12.5px;color:var(--muted)',
      html: 'Expect 88–92% of invited family to show, and 85–90% at the reception. Give final numbers 72 hours out with a 5% flex clause.' })
  ]));

  /* budget by category */
  const cats = S.budgetByCategory();
  cols.appendChild(UI.panel('Where the ₹20 lakh goes', { sub: 'Planned allocation by head' }, [
    UI.hbars(cats.map(function (c) {
      return {
        label: c.cat,
        value: c.planned,
        max: cats[0].planned,
        tone: c.cat === 'Contingency' ? 'gold' : null,
        right: U.inr(c.planned) + ' · <span style="color:var(--muted)">' + U.pct(c.planned, bt.planned) + '</span>'
      };
    }))
  ]));

  wrap.appendChild(cols);

  /* ---- next up ---- */

  const nextTasks = st.checklist.filter(function (c) { return !c.done; }).slice(0, 8);
  const cols2 = el('div', { class: 'cols' });

  cols2.appendChild(UI.panel('Next eight things to do', {
    actions: [UI.btn('Full checklist', function () { location.hash = '#/checklist'; }, 'ghost')]
  }, nextTasks.length
    ? el('ul', { class: 'ul-clean' }, nextTasks.map(function (t) {
        return el('li', {}, [
          el('div', {}, [
            el('span', { text: t.task }), ' ',
            UI.badge(t.phase, 'gold'), ' ',
            el('span', { class: 'sm', style: 'color:var(--muted)', text: t.owner })
          ])
        ]);
      }))
    : UI.empty('All clear', 'Every task on the checklist is done. Go and enjoy your wedding.')));

  /* Shares are computed, not written down, so a re-cut of the budget cannot
     leave this row of badges quoting last month's percentages. */
  const planned = st.budget.reduce(function (n, b) { return n + b.amount; }, 0);
  const share = function (cat) {
    const n = st.budget.reduce(function (a, b) { return b.cat === cat ? a + b.amount : a; }, 0);
    return Math.round(n / planned * 1000) / 10 + '%';
  };

  cols2.appendChild(UI.panel('The plan in one paragraph', {}, [
    el('p', { style: 'font-size:14px', html:
      'Four functions across two days at <strong>one venue</strong>, so nobody travels between them. ' +
      'The engagement is folded into the sangeet evening as a 30-minute ring ceremony — that single merge saves about ₹2.6 lakh. ' +
      'Haldi and phere sit in <strong>daylight</strong>, which removes any lighting spend from two of the four setups. ' +
      'Haldi is a ₹475 brunch and the wedding meal is a Rajasthani thali rather than a fourteen-counter buffet. ' +
      'Guest rooms are blocked at a negotiated rate but paid by guests; you cover ten of about fifty. ' +
      'Money is concentrated where it shows: the mandap, reception lighting, and photography.' }),
    el('div', { class: 'chip-row' }, [
      UI.badge('F&B ' + share('Food & Beverage'), 'gold'),
      UI.badge('Décor ' + share('Décor')),
      UI.badge('Photo ' + share('Photo & Video')),
      UI.badge('Personal ' + share('Personal')),
      UI.badge('Contingency ' + share('Contingency'), 'info')
    ]),
    el('div', { style: 'margin-top:14px' },
      UI.btn('Read the full strategy', function () { location.hash = '#/strategy'; }, 'ghost'))
  ]));

  wrap.appendChild(cols2);
  return wrap;
};
