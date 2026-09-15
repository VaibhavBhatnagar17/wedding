/* Vendors — who is booked, what they quoted, what is still owed. */
window.W = window.W || {}; W.views = W.views || {};

W.views.vendors = function () {
  'use strict';
  const U = W.util, UI = W.ui, S = W.store, el = U.el;
  const st = S.get();
  const wrap = el('div');

  const STATUSES = ['To book', 'Quoted', 'Negotiating', 'Booked', 'Paid in full'];

  const target = U.sum(st.vendors, function (v) { return v.target; });
  const booked = U.sum(st.vendors, function (v) { return v.booked; });
  const paid = U.sum(st.vendors, function (v) { return v.paid; });
  const openCount = st.vendors.filter(function (v) { return v.status === 'To book'; }).length;

  wrap.appendChild(UI.pageHead('Vendors',
    'One row per category with the budget target already filled in. Record what each vendor quotes, what you finally agree, and what you have paid.',
    [UI.btn('Export CSV', function () {
      U.download('vendors.csv', U.toCSV(st.vendors.map(function (v) {
        return {
          category: v.cat, vendor: v.name, contact: v.contact || '', status: v.status,
          target: v.target, quoted: v.quoted, agreed: v.booked, paid: v.paid,
          balance: v.booked - v.paid, decideBy: v.by, note: v.note
        };
      }), ['category', 'vendor', 'contact', 'status', 'target', 'quoted', 'agreed', 'paid', 'balance', 'decideBy', 'note']), 'text/csv');
      U.toast('Vendor sheet downloaded.');
    }, 'ghost')]));

  wrap.appendChild(UI.stats([
    UI.stat('Categories', st.vendors.length, openCount + ' still to book', openCount ? 'warn' : 'ok'),
    UI.stat('Budget target', U.lakh(target), 'across all vendors'),
    UI.stat('Agreed', U.lakh(booked), booked > target ? U.inr(booked - target) + ' over target' : U.inr(target - booked) + ' still open',
      booked > target ? 'bad' : null),
    UI.stat('Paid', U.lakh(paid), U.inr(booked - paid) + ' balance due'),
    UI.stat('Advance discipline', '30%', 'never more upfront', 'warn')
  ]));

  wrap.appendChild(el('div', { class: 'callout', html:
    '<b>Payment rules that will save you.</b> Never more than 30% as advance. Hold back 30% until after the event. ' +
    'Get a written cancellation and postponement clause from every vendor, including the venue. Pay by bank transfer with a GST invoice wherever possible — ' +
    'cash gives you no recourse if someone does not turn up.' }));

  function statusTone(s) {
    return { 'To book': 'bad', 'Quoted': 'warn', 'Negotiating': 'warn', 'Booked': 'ok', 'Paid in full': 'ok' }[s];
  }

  function patch(id, key, val) {
    S.update(function (s) {
      const row = s.vendors.find(function (x) { return x.id === id; });
      if (row) row[key] = val;
    });
  }

  wrap.appendChild(UI.panel('All vendors', { flush: true }, UI.table([
    {
      key: 'cat', label: 'Category', render: function (v) {
        return el('div', {}, [
          el('div', { class: 'nm', text: v.cat }),
          el('div', { class: 'sm', text: 'decide by ' + U.fmtDate(v.by) })
        ]);
      }
    },
    {
      key: 'name', label: 'Vendor', render: function (v) {
        const i = UI.input('name', v.name, { placeholder: 'not chosen', style: 'min-width:150px' });
        i.addEventListener('change', function (e) { patch(v.id, 'name', e.target.value.trim()); });
        return i;
      }
    },
    {
      key: 'contact', label: 'Contact', render: function (v) {
        const i = UI.input('contact', v.contact || '', { placeholder: 'mobile', style: 'min-width:118px' });
        i.addEventListener('change', function (e) { patch(v.id, 'contact', e.target.value.trim()); });
        return i;
      }
    },
    {
      key: 'status', label: 'Status', render: function (v) {
        const s = UI.select('status', v.status, STATUSES);
        s.style.minWidth = '124px';
        s.addEventListener('change', function (e) { patch(v.id, 'status', e.target.value); });
        return el('div', {}, [s, el('div', { style: 'margin-top:4px' }, UI.badge(v.status, statusTone(v.status)))]);
      }
    },
    { key: 'target', label: 'Target', num: true, render: function (v) { return U.inr(v.target); } },
    {
      key: 'quoted', label: 'Quoted', num: true, render: function (v) {
        return UI.moneyInput(v.quoted, function (val) { patch(v.id, 'quoted', val); });
      }
    },
    {
      key: 'booked', label: 'Agreed', num: true, render: function (v) {
        return UI.moneyInput(v.booked, function (val) { patch(v.id, 'booked', val); });
      }
    },
    {
      key: 'paid', label: 'Paid', num: true, render: function (v) {
        return UI.moneyInput(v.paid, function (val) { patch(v.id, 'paid', val); });
      }
    },
    {
      key: 'balance', label: 'Balance', num: true, render: function (v) {
        const b = v.booked - v.paid;
        if (!v.booked) return el('span', { class: 'sm', text: '—' });
        const advPct = v.booked ? Math.round((v.paid / v.booked) * 100) : 0;
        return el('div', {}, [
          el('div', { text: U.inr(b) }),
          advPct > 30 && advPct < 100 ? el('div', {}, UI.badge(advPct + '% paid', 'warn')) : null
        ]);
      }
    }
  ], st.vendors, {
    footer: [
      el('td', { text: 'Total', colspan: '4' }),
      el('td', { class: 'num', text: U.inr(target) }),
      el('td', { class: 'num', text: U.inr(U.sum(st.vendors, function (v) { return v.quoted; })) }),
      el('td', { class: 'num', text: U.inr(booked) }),
      el('td', { class: 'num', text: U.inr(paid) }),
      el('td', { class: 'num', text: U.inr(booked - paid) })
    ]
  })));

  /* negotiation notes */
  wrap.appendChild(UI.panel('What to ask each one', { flush: true }, UI.table([
    { key: 'cat', label: 'Category', render: function (v) { return el('span', { class: 'nm', text: v.cat }); } },
    { key: 'note', label: 'Brief' },
    { key: 'by', label: 'Decide by', render: function (v) { return U.fmtDate(v.by); } }
  ], st.vendors)));

  return wrap;
};
