/* Shared helpers. Loaded as a classic script so the site works from file:// too. */
window.W = window.W || {};

(function (W) {
  'use strict';

  /* ---------- DOM ---------- */

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        const v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'dataset') Object.assign(node.dataset, v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') {
          node.addEventListener(k.slice(2).toLowerCase(), v);
        } else node.setAttribute(k, v);
      });
    }
    (Array.isArray(children) ? children : children ? [children] : []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
    });
    return node;
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }

  /* ---------- numbers & dates ---------- */

  // Indian grouping: 12,34,567
  function inr(n) {
    const num = Math.round(Number(n) || 0);
    const neg = num < 0;
    const s = String(Math.abs(num));
    let out;
    if (s.length <= 3) out = s;
    else {
      const last3 = s.slice(-3);
      let rest = s.slice(0, -3);
      const parts = [];
      while (rest.length > 2) { parts.unshift(rest.slice(-2)); rest = rest.slice(0, -2); }
      if (rest) parts.unshift(rest);
      out = parts.join(',') + ',' + last3;
    }
    return (neg ? '-₹' : '₹') + out;
  }

  // 1234567 -> "12.35 L"
  function lakh(n) {
    const v = (Number(n) || 0) / 100000;
    return '₹' + (Math.abs(v) >= 10 ? v.toFixed(2) : v.toFixed(2)) + ' L';
  }

  function pct(part, whole) {
    if (!whole) return '0%';
    return Math.round((part / whole) * 1000) / 10 + '%';
  }

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function parseISO(s) {
    if (!s) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) { const d = new Date(s); return isNaN(d) ? null : d; }
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  function fmtDate(iso, withDay) {
    const d = parseISO(iso);
    if (!d) return '—';
    const base = d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    return withDay ? DAYS[d.getDay()] + ', ' + base : base;
  }

  function daysUntil(iso) {
    const d = parseISO(iso);
    if (!d) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((d - today) / 86400000);
  }

  /* ---------- ids ---------- */

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function slug(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  /* ---------- CSV ---------- */

  function csvEscape(v) {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function toCSV(rows, columns) {
    const cols = columns || Object.keys(rows[0] || {});
    const lines = [cols.map(csvEscape).join(',')];
    rows.forEach(function (r) {
      lines.push(cols.map(function (c) { return csvEscape(r[c]); }).join(','));
    });
    return lines.join('\r\n');
  }

  // Tolerant CSV parser: handles quotes, escaped quotes, CRLF.
  function parseCSV(text) {
    const rows = [];
    let row = [], field = '', inQuotes = false;
    const src = String(text || '').replace(/^\uFEFF/, '');
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (inQuotes) {
        if (c === '"') {
          if (src[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += c;
      } else if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    if (!rows.length) return [];
    const header = rows.shift().map(function (h) { return h.trim(); });
    return rows
      .filter(function (r) { return r.some(function (v) { return String(v).trim() !== ''; }); })
      .map(function (r) {
        const o = {};
        header.forEach(function (h, i) { o[h] = (r[i] === undefined ? '' : String(r[i]).trim()); });
        return o;
      });
  }

  function download(filename, text, mime) {
    const blob = new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ---------- calendar (.ics) ---------- */

  function icsStamp(dateISO, time) {
    const d = parseISO(dateISO);
    const hm = /^(\d{1,2}):(\d{2})/.exec(time || '00:00');
    d.setHours(Number(hm[1]), Number(hm[2]), 0, 0);
    // Emit floating local time — no TZ conversion surprises for guests.
    const p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + 'T' + p(d.getHours()) + p(d.getMinutes()) + '00';
  }

  function buildICS(events, calName) {
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Vaibhav & Mahak//Wedding//EN',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:' + (calName || 'Wedding')
    ];
    events.forEach(function (e) {
      lines.push('BEGIN:VEVENT');
      lines.push('UID:' + (e.uid || uid('evt')) + '@vaibhav-mahak');
      lines.push('DTSTAMP:' + icsStamp(e.date, e.start) + 'Z');
      lines.push('DTSTART:' + icsStamp(e.date, e.start));
      lines.push('DTEND:' + icsStamp(e.date, e.end || e.start));
      lines.push('SUMMARY:' + icsText(e.title));
      if (e.location) lines.push('LOCATION:' + icsText(e.location));
      if (e.description) lines.push('DESCRIPTION:' + icsText(e.description));
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  function icsText(s) {
    return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  }

  /* ---------- misc ---------- */

  function debounce(fn, ms) {
    let t;
    return function () {
      const args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms || 200);
    };
  }

  function sum(arr, pick) {
    return arr.reduce(function (a, x) { return a + (Number(pick ? pick(x) : x) || 0); }, 0);
  }

  function groupBy(arr, pick) {
    const out = {};
    arr.forEach(function (x) {
      const k = pick(x);
      (out[k] = out[k] || []).push(x);
    });
    return out;
  }

  function toast(msg, kind) {
    let host = $('#toast-host');
    if (!host) {
      host = el('div', { id: 'toast-host', class: 'toast-host' });
      document.body.appendChild(host);
    }
    const t = el('div', { class: 'toast' + (kind ? ' toast--' + kind : ''), text: msg });
    host.appendChild(t);
    setTimeout(function () { t.classList.add('is-out'); }, 2600);
    setTimeout(function () { t.remove(); }, 3200);
  }

  W.util = {
    el: el, $: $, $$: $$, clear: clear,
    inr: inr, lakh: lakh, pct: pct,
    fmtDate: fmtDate, daysUntil: daysUntil, parseISO: parseISO, MONTHS: MONTHS, DAYS: DAYS,
    uid: uid, slug: slug,
    toCSV: toCSV, parseCSV: parseCSV, download: download,
    buildICS: buildICS,
    debounce: debounce, sum: sum, groupBy: groupBy, toast: toast
  };
})(window.W);
