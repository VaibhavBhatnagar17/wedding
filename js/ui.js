/* Reusable UI pieces for the planner console. */
window.W = window.W || {};

(function (W) {
  'use strict';

  const U = W.util, el = U.el;

  function pageHead(title, blurb, actions) {
    return el('div', { class: 'page-head' }, [
      el('div', {}, [
        el('h1', { text: title }),
        blurb ? el('p', { html: blurb }) : null
      ]),
      actions && actions.length ? el('div', { class: 'page-actions no-print' }, actions) : null
    ]);
  }

  function stat(label, value, hint, tone) {
    return el('div', { class: 'stat' + (tone ? ' stat--' + tone : '') }, [
      el('div', { class: 'stat__label', text: label }),
      el('div', { class: 'stat__value', text: String(value) }),
      hint ? el('div', { class: 'stat__hint', html: hint }) : null
    ]);
  }

  function stats(items) {
    return el('div', { class: 'stats' }, items);
  }

  function panel(title, opts, body) {
    const o = opts || {};
    return el('section', { class: 'panel' }, [
      title ? el('div', { class: 'panel__head' }, [
        el('div', {}, [
          el('h2', { text: title }),
          o.sub ? el('div', { class: 'sub', html: o.sub }) : null
        ]),
        o.actions ? el('div', { class: 'page-actions no-print' }, o.actions) : null
      ]) : null,
      el('div', { class: 'panel__body' + (o.flush ? ' panel__body--flush' : '') }, body)
    ]);
  }

  function btn(label, onClick, variant) {
    return el('button', {
      class: 'btn' + (variant ? ' btn--' + variant : ''),
      type: 'button', text: label, onclick: onClick
    });
  }

  function badge(text, tone) {
    return el('span', { class: 'badge' + (tone ? ' badge--' + tone : ''), text: text });
  }

  function rsvpTone(status) {
    return { Confirmed: 'ok', Declined: 'bad', Tentative: 'warn', Pending: null }[status] || null;
  }

  /* Simple table builder.
     columns: [{ key, label, num, sortable, render(row), width }] */
  function table(columns, rows, opts) {
    const o = opts || {};
    const thead = el('thead', {}, el('tr', {}, columns.map(function (c) {
      return el('th', {
        class: (c.num ? 'num' : '') + (c.sortable !== false && o.onSort ? ' sortable' : ''),
        style: c.width ? 'width:' + c.width : null,
        text: c.label,
        onclick: (c.sortable !== false && o.onSort) ? function () { o.onSort(c.key); } : null
      });
    })));

    const tbody = el('tbody', {}, rows.map(function (r, i) {
      return el('tr', {}, columns.map(function (c) {
        const content = c.render ? c.render(r, i) : r[c.key];
        return el('td', { class: c.num ? 'num' : '' },
          content && typeof content === 'object' ? content : [String(content === undefined || content === null ? '—' : content)]);
      }));
    }));

    const parts = [thead, tbody];
    if (o.footer) parts.push(el('tfoot', {}, el('tr', {}, o.footer)));

    return el('div', { class: 'tbl-scroll' }, el('table', { class: 'tbl' }, parts));
  }

  function empty(title, msg, action) {
    return el('div', { class: 'empty' }, [
      el('b', { text: title }),
      el('div', { html: msg }),
      action ? el('div', { style: 'margin-top:14px' }, action) : null
    ]);
  }

  function bar(value, max, tone) {
    const w = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return el('div', { class: 'bar' }, el('i', {
      class: tone ? 'is-' + tone : '',
      style: 'width:' + w.toFixed(1) + '%'
    }));
  }

  function hbars(items) {
    // items: [{ label, value, max, right, tone }]
    return el('div', { class: 'hbars' }, items.map(function (it) {
      return el('div', {}, [
        el('div', { class: 'hbar__top' }, [
          el('b', { text: it.label }),
          el('span', { html: it.right })
        ]),
        bar(it.value, it.max, it.tone)
      ]);
    }));
  }

  /* ---------- modal ---------- */

  function modal(title, bodyNode, opts) {
    const o = opts || {};
    const backdrop = el('div', { class: 'modal-backdrop' });

    function close() {
      backdrop.remove();
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    const foot = el('div', { class: 'modal__foot' }, [
      el('button', { class: 'btn btn--ghost', type: 'button', text: o.cancelLabel || 'Cancel', onclick: close }),
      o.onConfirm ? el('button', {
        class: 'btn' + (o.danger ? ' btn--danger' : ''), type: 'button',
        text: o.confirmLabel || 'Save',
        onclick: function () { if (o.onConfirm(close) !== false) close(); }
      }) : null
    ]);

    const box = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' }, [
      el('div', { class: 'modal__head' }, [
        el('h3', { text: title }),
        el('button', { class: 'modal__x', type: 'button', 'aria-label': 'Close', text: '×', onclick: close })
      ]),
      el('div', { class: 'modal__body' }, bodyNode),
      foot
    ]);

    backdrop.appendChild(box);
    backdrop.addEventListener('click', function (e) { if (e.target === backdrop) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    const firstInput = box.querySelector('input, select, textarea');
    if (firstInput) firstInput.focus();
    return { close: close, box: box };
  }

  function confirmModal(title, message, onYes, confirmLabel) {
    modal(title, el('p', { html: message }), {
      confirmLabel: confirmLabel || 'Yes, do it',
      danger: true,
      onConfirm: function () { onYes(); }
    });
  }

  /* ---------- form fields ---------- */

  function field(label, input) {
    return el('label', { class: 'field' }, [el('span', { html: label }), input]);
  }

  function input(name, value, attrs) {
    return el('input', Object.assign({ type: 'text', name: name, value: value === undefined || value === null ? '' : value }, attrs || {}));
  }

  function select(name, value, options) {
    return el('select', { name: name }, options.map(function (o) {
      const val = typeof o === 'object' ? o.value : o;
      const lab = typeof o === 'object' ? o.label : o;
      return el('option', { value: val, text: lab, selected: String(val) === String(value) ? 'selected' : null });
    }));
  }

  function checkbox(name, checked, label) {
    return el('label', { class: 'check' }, [
      el('input', { type: 'checkbox', name: name, checked: checked ? 'checked' : null }),
      el('span', { text: label })
    ]);
  }

  /* Inline number input that writes back on change. */
  function moneyInput(value, onChange) {
    return el('input', {
      type: 'number', min: '0', step: '500', value: Number(value) || 0,
      style: 'max-width:118px;text-align:right',
      onchange: function (e) { onChange(Number(e.target.value) || 0); }
    });
  }

  function fileButton(label, accept, onText) {
    const inp = el('input', {
      type: 'file', accept: accept, class: 'sr-only',
      onchange: function (e) {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = function () { onText(String(reader.result), f.name); inp.value = ''; };
        reader.readAsText(f);
      }
    });
    const wrap = el('span', {}, [
      el('button', { class: 'btn btn--ghost', type: 'button', text: label, onclick: function () { inp.click(); } }),
      inp
    ]);
    return wrap;
  }

  W.ui = {
    pageHead: pageHead, stat: stat, stats: stats, panel: panel, btn: btn, badge: badge,
    rsvpTone: rsvpTone, table: table, empty: empty, bar: bar, hbars: hbars,
    modal: modal, confirmModal: confirmModal,
    field: field, input: input, select: select, checkbox: checkbox,
    moneyInput: moneyInput, fileButton: fileButton
  };
})(window.W);
