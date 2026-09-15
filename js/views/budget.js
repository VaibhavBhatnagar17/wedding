/* Budget — planned vs committed vs paid, editable in place. */
window.W = window.W || {}; W.views = W.views || {};

W.views.budget = function () {
  'use strict';
  const U = W.util, UI = W.ui, D = W.data, S = W.store, el = U.el;
  const st = S.get();
  const t = S.budgetTotals();
  const wrap = el('div');

  wrap.appendChild(UI.pageHead('Budget',
    'The plan column is fixed at ₹20,00,000. Fill in <strong>committed</strong> as you sign each vendor and <strong>paid</strong> as money goes out — the variance tells you immediately whether you are still inside the envelope.',
    [
      UI.btn('Export CSV', function () {
        U.download('budget.csv', U.toCSV(st.budget.map(function (b) {
          return { head: b.head, category: b.cat, basis: b.basis, planned: b.amount, committed: b.actual, paid: b.paid, variance: b.actual - b.amount };
        }), ['head', 'category', 'basis', 'planned', 'committed', 'paid', 'variance']), 'text/csv');
        U.toast('Budget downloaded.');
      }, 'ghost'),
      UI.btn('Print', function () { window.print(); }, 'ghost')
    ]));

  wrap.appendChild(UI.stats([
    UI.stat('Planned', U.lakh(t.planned), '25 line items'),
    UI.stat('Committed', U.lakh(t.actual),
      t.actual ? U.pct(t.actual, t.planned) + ' of the budget' : 'Nothing signed yet'),
    UI.stat('Paid out', U.lakh(t.paid), U.inr(t.outstanding) + ' outstanding'),
    // Variance is only meaningful once something has actually been committed.
    t.actual === 0
      ? UI.stat('Variance', '—', 'Fill in the committed column')
      : UI.stat('Variance', (t.variance > 0 ? '+' : '') + U.inr(t.variance),
          t.variance > 0 ? 'Over plan — find a cut' : (t.variance < 0 ? 'Still under plan' : 'Exactly on plan'),
          t.variance > 0 ? 'bad' : 'ok'),
    UI.stat('Contingency', U.lakh(82125), 'Do not touch until January', 'warn'),
    UI.stat('Left to commit', U.lakh(Math.max(0, t.planned - t.actual)), 'against the ₹20 L cap')
  ]));

  if (t.variance > 0) {
    wrap.appendChild(el('div', { class: 'callout callout--warn', html:
      '<b>You are ' + U.inr(t.variance) + ' over plan.</b> The fastest levers, in order: drop 25 guests from the core list (~₹44,000), ' +
      'move the sangeet to one live counter instead of two (~₹21,000), rent the third and fourth outfits instead of buying, ' +
      'and switch the reception dessert spread to Indian sweets only.' }));
  }

  /* by category */
  const cats = S.budgetByCategory();
  wrap.appendChild(UI.panel('By category', { sub: 'Planned share of ₹20 lakh' },
    UI.hbars(cats.map(function (c) {
      return {
        label: c.cat,
        value: c.planned,
        max: cats[0].planned,
        tone: c.cat === 'Contingency' ? 'gold' : (c.actual > c.planned ? 'over' : null),
        right: U.inr(c.planned) + ' planned · ' + U.pct(c.planned, t.planned) +
          (c.actual ? ' · <strong>' + U.inr(c.actual) + ' committed</strong>' : '')
      };
    }))));

  /* line items grouped by category */
  cats.forEach(function (c) {
    const rows = c.rows;
    wrap.appendChild(UI.panel(c.cat, {
      sub: U.inr(c.planned) + ' planned · ' + U.inr(c.actual) + ' committed · ' + U.inr(c.paid) + ' paid',
      flush: true
    }, UI.table([
      {
        key: 'head', label: 'Line item', render: function (b) {
          return el('div', {}, [
            el('div', { class: 'nm', text: b.head }),
            el('div', { class: 'sm', text: b.basis })
          ]);
        }
      },
      { key: 'amount', label: 'Planned', num: true, render: function (b) { return U.inr(b.amount); } },
      {
        key: 'actual', label: 'Committed', num: true, render: function (b) {
          return UI.moneyInput(b.actual, function (val) {
            S.update(function (s) {
              const row = s.budget.find(function (x) { return x.id === b.id; });
              if (row) row.actual = val;
            });
          });
        }
      },
      {
        key: 'paid', label: 'Paid', num: true, render: function (b) {
          return UI.moneyInput(b.paid, function (val) {
            S.update(function (s) {
              const row = s.budget.find(function (x) { return x.id === b.id; });
              if (row) row.paid = val;
            });
          });
        }
      },
      {
        key: 'var', label: 'Variance', num: true, render: function (b) {
          const d = b.actual ? b.actual - b.amount : 0;
          if (!d) return el('span', { class: 'sm', text: '—' });
          return UI.badge((d > 0 ? '+' : '') + U.inr(d), d > 0 ? 'bad' : 'ok');
        }
      }
    ], rows, {
      footer: [
        el('td', { text: 'Subtotal' }),
        el('td', { class: 'num', text: U.inr(c.planned) }),
        el('td', { class: 'num', text: U.inr(c.actual) }),
        el('td', { class: 'num', text: U.inr(c.paid) }),
        el('td', { class: 'num', text: c.actual ? U.inr(c.actual - c.planned) : '—' })
      ]
    })));
  });

  /* the cuts */
  const cutTotal = U.sum(D.cuts, function (c) { return c.saving; });
  wrap.appendChild(UI.panel('How the money was found', {
    sub: 'Roughly ' + U.lakh(cutTotal) + ' of savings versus a conventionally planned wedding of this size',
    flush: true
  }, UI.table([
    { key: 'decision', label: 'Decision', render: function (r) { return el('span', { text: r.decision }); } },
    { key: 'saving', label: 'Saves', num: true, render: function (r) { return el('strong', { text: U.inr(r.saving) }); } }
  ], D.cuts, {
    footer: [el('td', { text: 'Total found' }), el('td', { class: 'num', text: U.inr(cutTotal) })]
  })));

  wrap.appendChild(UI.panel('Do not cut these', {}, el('ul', { class: 'ul-clean' },
    D.protect.map(function (p) { return el('li', { class: 'yes', text: p }); }))));

  return wrap;
};
