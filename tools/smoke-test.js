/* Headless smoke test. Run with:
     /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc tools/smoke-test.js
   Builds a minimal fake DOM, loads the app, renders every view and exercises the
   store, so regressions surface without opening a browser. */

/* ---------------- fake DOM ---------------- */

var listenersAttached = 0;

function Node(tag) {
  this.tagName = String(tag || '').toUpperCase();
  this.children = [];
  this.childNodes = [];
  this.attributes = {};
  this.dataset = {};
  this.style = {};
  this.className = '';
  this._text = '';
  this.value = '';
  this.checked = false;
  this.parentNode = null;
  var self = this;
  this.classList = {
    add: function (c) { if (!self._has(c)) self.className = (self.className + ' ' + c).trim(); },
    remove: function (c) {
      self.className = self.className.split(/\s+/).filter(function (x) { return x && x !== c; }).join(' ');
    },
    toggle: function (c, on) { if (on === undefined) on = !self._has(c); on ? this.add(c) : this.remove(c); },
    contains: function (c) { return self._has(c); }
  };
}
Node.prototype._has = function (c) { return this.className.split(/\s+/).indexOf(c) >= 0; };
Object.defineProperty(Node.prototype, 'textContent', {
  get: function () {
    return this._text + this.childNodes.map(function (c) { return c.textContent || ''; }).join('');
  },
  set: function (v) { this._text = String(v); this.childNodes = []; this.children = []; }
});
Object.defineProperty(Node.prototype, 'innerHTML', {
  get: function () { return this._html || ''; },
  set: function (v) { this._html = String(v); }
});
Object.defineProperty(Node.prototype, 'firstChild', {
  get: function () { return this.childNodes[0] || null; }
});
Node.prototype.appendChild = function (c) {
  if (c === null || c === undefined) throw new Error('appendChild(' + c + ') on <' + this.tagName + '>');
  c.parentNode = this;
  this.childNodes.push(c);
  if (c.tagName) this.children.push(c);
  return c;
};
Node.prototype.removeChild = function (c) {
  this.childNodes = this.childNodes.filter(function (x) { return x !== c; });
  this.children = this.children.filter(function (x) { return x !== c; });
  return c;
};
Node.prototype.remove = function () { if (this.parentNode) this.parentNode.removeChild(this); };
Node.prototype.replaceWith = function (n) {
  if (!this.parentNode) return;
  var i = this.parentNode.childNodes.indexOf(this);
  if (i >= 0) this.parentNode.childNodes[i] = n;
};
Node.prototype.setAttribute = function (k, v) { this.attributes[k] = String(v); };
Node.prototype.getAttribute = function (k) { return this.attributes[k]; };
Node.prototype.addEventListener = function () { listenersAttached++; };
Node.prototype.removeEventListener = function () {};
Node.prototype.focus = function () {};
Node.prototype.click = function () {};
Node.prototype.scrollIntoView = function () {};
Node.prototype.closest = function () { return null; };
Node.prototype._walk = function (out) {
  var self = this;
  this.childNodes.forEach(function (c) { if (c.tagName) { out.push(c); c._walk(out); } });
  return out;
};
Node.prototype.querySelectorAll = function (sel) {
  var all = this._walk([]);
  var m = /^\[name="?([^"\]]+)"?\]$/.exec(sel);
  if (m) return all.filter(function (n) { return n.attributes.name === m[1]; });
  var tags = sel.split(',').map(function (s) { return s.trim().toUpperCase(); });
  return all.filter(function (n) { return tags.indexOf(n.tagName) >= 0; });
};
Node.prototype.querySelector = function (sel) { return this.querySelectorAll(sel)[0] || null; };

function TextNode(t) { this._text = String(t); this.childNodes = []; }
Object.defineProperty(TextNode.prototype, 'textContent', {
  get: function () { return this._text; }, set: function (v) { this._text = String(v); }
});

var document = {
  body: new Node('body'),
  createElement: function (t) { return new Node(t); },
  createTextNode: function (t) { return new TextNode(t); },
  addEventListener: function () { listenersAttached++; },
  querySelector: function () { return null; },
  querySelectorAll: function () { return []; }
};

var _store = {};
var localStorage = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(_store, k) ? _store[k] : null; },
  setItem: function (k, v) { _store[k] = String(v); },
  removeItem: function (k) { delete _store[k]; }
};
var sessionStorage = localStorage;

var log = print; // keep jsc's own print before the window shim shadows it
var window = this;
window.document = document;
window.localStorage = localStorage;
window.sessionStorage = sessionStorage;
window.location = { hash: '#/dashboard', href: 'http://local/planner.html' };
window.navigator = {};
window.innerWidth = 1280;
window.scrollTo = function () {};
window.addEventListener = function () { listenersAttached++; };
window.open = function () {};
window.print = function () {};
window.setTimeout = function (fn) { return 0; };
window.setInterval = function () { return 0; };
window.clearTimeout = function () {};
window.Blob = function () {};
window.URL = { createObjectURL: function () { return 'blob:x'; }, revokeObjectURL: function () {} };
window.FormData = function () {};
window.IntersectionObserver = function () { this.observe = function () {}; this.unobserve = function () {}; };
window.FileReader = function () {};
if (typeof setTimeout === 'undefined') { var setTimeout = window.setTimeout; }

/* ---------------- load app ---------------- */

var FILES = [
  'js/util.js', 'js/data.js', 'js/store.js', 'js/ui.js',
  'js/views/dashboard.js', 'js/views/guests.js', 'js/views/functions.js',
  'js/views/venue.js', 'js/views/budget.js', 'js/views/vendors.js',
  'js/views/logistics.js', 'js/views/strategy.js',
  'js/config.js', 'js/db.js', 'js/motifs.js'
];

var pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); log('  ok    ' + name); pass++; }
  catch (e) { log('  FAIL  ' + name + '\n        ' + (e && e.message || e)); fail++; }
}

FILES.forEach(function (f) {
  check('load ' + f, function () {
    // eslint-disable-next-line no-eval
    eval(readFile(f));
  });
});

var W = window.W;

/* ---------------- data integrity ---------------- */

log('\nData integrity');

check('budget sums to exactly 20,00,000', function () {
  var total = W.data.budget.reduce(function (a, b) { return a + b.amount; }, 0);
  if (total !== 2000000) throw new Error('got ' + total);
});

check('budget line ids are unique', function () {
  var ids = W.data.budget.map(function (b) { return b.id; });
  if (new Set(ids).size !== ids.length) throw new Error('duplicate budget id');
});

check('every function has schedule, decor and menu', function () {
  W.data.functions.forEach(function (f) {
    if (!f.schedule.length) throw new Error(f.id + ' has no schedule');
    if (!f.decor.length) throw new Error(f.id + ' has no decor');
    if (!f.menu.length) throw new Error(f.id + ' has no menu');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) throw new Error(f.id + ' bad date');
  });
});

check('function ids match guest invite flags', function () {
  var g = W.data.seedGuests[0];
  W.data.functions.forEach(function (f) {
    if (!(f.id in g.inv)) throw new Error('seed guests missing inv.' + f.id);
  });
});

check('per-plate x guarantee matches the F&B budget lines', function () {
  var f = W.data.functions;
  function fn(id) { return f.find(function (x) { return x.id === id; }); }
  var expect = {
    b01: fn('haldi').perPlate * 275,
    b02: fn('sangeet').perPlate * 285,
    b03: fn('phere').perPlate * 285,
    b04: fn('reception').perPlate * 600
  };
  Object.keys(expect).forEach(function (id) {
    var row = W.data.budget.find(function (b) { return b.id === id; });
    if (row.amount !== expect[id]) throw new Error(id + ': budget ' + row.amount + ' vs computed ' + expect[id]);
  });
});

check('decor budget lines match the function decor figures', function () {
  var map = { b09: 'haldi', b10: 'sangeet', b11: 'phere', b12: 'reception' };
  Object.keys(map).forEach(function (id) {
    var row = W.data.budget.find(function (b) { return b.id === id; });
    var fn = W.data.functions.find(function (f) { return f.id === map[id]; });
    if (row.amount !== fn.decorBudget) throw new Error(id + ': ' + row.amount + ' vs ' + fn.decorBudget);
  });
});

/* ---------------- utils ---------------- */

log('\nUtilities');

check('inr uses Indian digit grouping', function () {
  var cases = [[0, '₹0'], [999, '₹999'], [1000, '₹1,000'], [130625, '₹1,30,625'], [2000000, '₹20,00,000'], [-5000, '-₹5,000']];
  cases.forEach(function (c) {
    if (W.util.inr(c[0]) !== c[1]) throw new Error(c[0] + ' -> ' + W.util.inr(c[0]) + ', want ' + c[1]);
  });
});

check('csv round-trips values containing commas, quotes and newlines', function () {
  var rows = [{ name: 'Sharma, Rakesh', notes: 'said "yes"', extra: 'line1\nline2' }];
  var cols = ['name', 'notes', 'extra'];
  var out = W.util.parseCSV(W.util.toCSV(rows, cols));
  if (out.length !== 1) throw new Error('expected 1 row, got ' + out.length);
  if (out[0].name !== 'Sharma, Rakesh') throw new Error('name mangled: ' + out[0].name);
  if (out[0].notes !== 'said "yes"') throw new Error('quotes mangled: ' + out[0].notes);
});

check('fmtDate renders the right weekday for 2 Feb 2027', function () {
  var s = W.util.fmtDate('2027-02-02', true);
  if (s !== 'Tuesday, 2 Feb 2027') throw new Error(s);
});

check('1 Feb 2027 is a Monday', function () {
  var s = W.util.fmtDate('2027-02-01', true);
  if (s !== 'Monday, 1 Feb 2027') throw new Error(s);
});

check('buildICS emits one VEVENT per function', function () {
  var ics = W.util.buildICS(W.data.functions.map(function (f) {
    return { uid: f.id, date: f.date, start: f.start, end: f.end, title: f.name };
  }), 'test');
  var n = (ics.match(/BEGIN:VEVENT/g) || []).length;
  if (n !== W.data.functions.length) throw new Error('got ' + n);
  if (ics.indexOf('END:VCALENDAR') < 0) throw new Error('unterminated calendar');
});

/* ---------------- store ---------------- */

log('\nStore');

check('seeds from data and computes headcounts', function () {
  var st = W.store.get();
  if (!st.guests.length) throw new Error('no seed guests');
  var rec = W.store.functionStats('reception');
  if (rec.invitedHeads <= 0) throw new Error('reception invitedHeads = ' + rec.invitedHeads);
  if (rec.confirmedHeads + rec.declinedHeads + rec.pendingHeads !== rec.invitedHeads) {
    throw new Error('rsvp buckets do not sum to invited');
  }
});

check('add, update and remove a guest', function () {
  var before = W.store.get().guests.length;
  W.store.addGuest({ name: 'Test Party', adults: 2, kids: 1, rsvp: 'Confirmed' });
  var st = W.store.get();
  if (st.guests.length !== before + 1) throw new Error('add failed');
  var g = st.guests[st.guests.length - 1];
  if (W.store.heads(g) !== 3) throw new Error('heads = ' + W.store.heads(g));
  W.store.updateGuest(g.id, { rsvp: 'Declined' });
  if (W.store.get().guests.find(function (x) { return x.id === g.id; }).rsvp !== 'Declined') throw new Error('update failed');
  W.store.removeGuest(g.id);
  if (W.store.get().guests.length !== before) throw new Error('remove failed');
});

check('declined guests are excluded from dietary counts', function () {
  W.store.addGuest({ name: 'Declined Party', adults: 5, diet: 'Jain', rsvp: 'Declined', inv: { reception: true } });
  var counts = W.store.dietCounts('reception');
  var jain = counts.Jain || 0;
  W.store.addGuest({ name: 'Coming Party', adults: 5, diet: 'Jain', rsvp: 'Confirmed', inv: { reception: true } });
  var after = W.store.dietCounts('reception').Jain || 0;
  if (after !== jain + 5) throw new Error('expected +5, got ' + (after - jain));
});

check('CSV import maps function columns and skips nameless rows', function () {
  var csv = 'name,side,adults,kids,haldi,sangeet,phere,reception,rsvp,diet\n' +
            'Import One,Groom,2,1,yes,yes,no,yes,Confirmed,Jain\n' +
            ',Bride,1,0,no,no,no,yes,Pending,Veg\n';
  var res = W.store.importGuestsCSV(csv, 'replace');
  if (res.added !== 1) throw new Error('added ' + res.added);
  if (res.skipped !== 1) throw new Error('skipped ' + res.skipped);
  var g = W.store.get().guests[0];
  if (g.name !== 'Import One') throw new Error('name ' + g.name);
  if (!g.inv.haldi || g.inv.phere) throw new Error('invite flags wrong');
  if (W.store.heads(g) !== 3) throw new Error('heads ' + W.store.heads(g));
  if (g.diet !== 'Jain') throw new Error('diet ' + g.diet);
});

check('CSV import rejects a file with no name column', function () {
  var res = W.store.importGuestsCSV('foo,bar\n1,2\n', 'append');
  if (!res.error) throw new Error('should have errored');
});

check('budget edits flow into totals and variance', function () {
  // Commit every line at plan, then overspend one by 10,000.
  W.store.update(function (s) {
    s.budget.forEach(function (b) { b.actual = b.amount; b.paid = 0; });
    s.budget[0].actual = s.budget[0].amount + 10000;
    s.budget[0].paid = 5000;
  });
  var t = W.store.budgetTotals();
  if (t.actual !== 2010000) throw new Error('actual ' + t.actual);
  if (t.variance !== 10000) throw new Error('variance ' + t.variance);
  if (t.paid !== 5000) throw new Error('paid ' + t.paid);
  if (t.outstanding !== t.actual - t.paid) throw new Error('outstanding mismatch');
  // Reset so later view tests see a clean slate.
  W.store.update(function (s) { s.budget.forEach(function (b) { b.actual = 0; b.paid = 0; }); });
});

check('category rollup covers every line item', function () {
  var cats = W.store.budgetByCategory();
  var n = cats.reduce(function (a, c) { return a + c.rows.length; }, 0);
  if (n !== W.data.budget.length) throw new Error('rollup has ' + n + ' of ' + W.data.budget.length);
});

check('rsvp inbox writes and reads back', function () {
  W.store.clearRsvps();
  W.store.submitRsvp({ name: 'Web Reply', attending: 'Yes, joyfully', adults: 2, kids: 0, functions: ['reception'] });
  var list = W.store.readRsvps();
  if (list.length !== 1 || list[0].name !== 'Web Reply') throw new Error('inbox broken');
});

check('backup export and restore preserve the guest list', function () {
  var before = W.store.get().guests.length;
  var captured = JSON.stringify({ state: W.store.get() });
  W.store.resetAll();
  var res = W.store.importAll(captured);
  if (!res.ok) throw new Error(res.error);
  if (W.store.get().guests.length !== before) throw new Error('guest count changed');
});

check('importAll rejects junk', function () {
  var res = W.store.importAll('{"nope":true}');
  if (res.ok) throw new Error('should have rejected');
});

/* ---------------- views ---------------- */

log('\nViews render');

Object.keys(W.views).forEach(function (name) {
  check('render ' + name, function () {
    var node = W.views[name]();
    if (!node || !node.tagName) throw new Error('did not return an element');
    if (!node.childNodes.length) throw new Error('rendered nothing');
  });
});

check('views survive an empty guest list', function () {
  W.store.update(function (s) { s.guests = []; });
  Object.keys(W.views).forEach(function (name) {
    var node = W.views[name]();
    if (!node || !node.childNodes.length) throw new Error(name + ' broke with zero guests');
  });
});

check('views survive a large guest list', function () {
  W.store.update(function (s) {
    s.guests = [];
    for (var i = 0; i < 400; i++) {
      s.guests.push(Object.assign(W.store.blankGuest(), {
        name: 'Family ' + i, adults: 2, kids: i % 3, city: i % 7 ? 'Delhi' : 'Udaipur',
        rsvp: ['Pending', 'Confirmed', 'Declined', 'Tentative'][i % 4],
        arrival: '2027-01-31', arrivalTime: '1' + (i % 10) + ':30', mode: 'Flight',
        hostPaid: i < 14
      }));
    }
  });
  Object.keys(W.views).forEach(function (name) {
    var node = W.views[name]();
    if (!node || !node.childNodes.length) throw new Error(name + ' broke with 400 guests');
  });
  var rec = W.store.functionStats('reception');
  if (rec.invitedHeads <= 0) throw new Error('stats broke at scale');
});

check('over-guarantee state surfaces the warning path', function () {
  W.store.update(function (s) {
    s.guests.forEach(function (g) { g.rsvp = 'Confirmed'; });
  });
  var node = W.views.dashboard();
  if (!node.childNodes.length) throw new Error('dashboard broke');
  var rooms = W.views.rooms();
  if (!rooms.childNodes.length) throw new Error('rooms broke');
});

/* ---------------- guest portal data layer ---------------- */

log('\nGuest portal');

check('phone numbers normalise from every common format', function () {
  var cases = {
    '9876543210': '9876543210',
    '+91 98765 43210': '9876543210',
    '098765-43210': '9876543210',
    '+91-9876543210': '9876543210',
    '(98765) 43210': '9876543210'
  };
  Object.keys(cases).forEach(function (raw) {
    var got = W.db.normPhone(raw);
    if (got !== cases[raw]) throw new Error(raw + ' -> ' + got);
  });
});

check('falls back to sample data when Supabase is not configured', function () {
  if (W.db.isConfigured()) throw new Error('config.js should ship empty');
});

check('every sample guest has a unique 10-digit number', function () {
  var seen = {};
  W.data.seedGuests.forEach(function (g) {
    var p = W.db.normPhone(g.phone);
    if (p.length !== 10) throw new Error(g.name + ' has phone "' + g.phone + '"');
    if (seen[p]) throw new Error('duplicate number ' + p);
    seen[p] = 1;
  });
});

/* Settles a promise so assertions can stay synchronous. */
function settle(promise) {
  var out = { ok: false, value: undefined, error: null };
  promise.then(function (v) { out.ok = true; out.value = v; },
               function (e) { out.error = e; });
  drainMicrotasks();
  if (!out.ok && !out.error) throw new Error('promise never settled');
  return out;
}

/* The planner's saved list takes precedence over the seed data, and earlier
   tests replaced it — put the sample guests back before testing lookups. */
check('store resets to the sample guest list', function () {
  W.store.update(function (st) {
    st.guests = JSON.parse(JSON.stringify(W.data.seedGuests));
  });
  if (W.store.get().guests.length !== W.data.seedGuests.length) throw new Error('reset failed');
});

check('lookup returns the right guest and hides private notes', function () {
  var g = settle(W.db.getGuest('9876500001')).value;
  if (!g) throw new Error('not found');
  if (g.name !== W.data.seedGuests[0].name) throw new Error('wrong guest: ' + g.name);
  if ('notes' in g) throw new Error('private notes leaked to the portal');
  if (typeof g.invited.phere !== 'boolean') throw new Error('invite flags missing');
});

check('an unknown number resolves to null, not an error', function () {
  var r = settle(W.db.getGuest('9000000000'));
  if (r.error) throw new Error('rejected instead of resolving: ' + r.error.message);
  if (r.value !== null) throw new Error('expected null, got ' + JSON.stringify(r.value));
});

check('a short number is rejected before any lookup', function () {
  var r = settle(W.db.getGuest('12345'));
  if (!r.error || !/10-digit/.test(r.error.message)) {
    throw new Error('got ' + (r.error ? r.error.message : 'no rejection'));
  }
});

check('reception-only guests are not shown family functions', function () {
  var recOnly = W.data.seedGuests.filter(function (g) {
    return g.inv.reception && !g.inv.phere && !g.inv.haldi;
  });
  if (!recOnly.length) throw new Error('sample data has no reception-only guest to test');
  var g = settle(W.db.getGuest(recOnly[0].phone)).value;
  if (!g) throw new Error('lookup failed');
  if (g.invited.phere || g.invited.haldi) throw new Error('invite flags wrong');
});

check('Supabase export uses the database column names', function () {
  // Earlier tests replace the guest list, so put a portal-ready guest back.
  W.store.addGuest({
    name: 'Export Test', phone: '9812345678', room: '204', table: 'T-9',
    hotel: 'Test Hotel', message: 'hello', notes: 'private'
  });
  var captured = null;
  var realDownload = W.util.download;
  W.util.download = function (name, body) { captured = { name: name, body: body }; };
  try { W.store.exportSupabaseCSV(); } finally { W.util.download = realDownload; }
  if (!captured) throw new Error('nothing was exported');
  var lines = captured.body.split('\n');
  var header = lines[0];
  ['phone', 'room_no', 'table_no', 'inv_reception', 'host_paid', 'message'].forEach(function (col) {
    if (header.indexOf(col) < 0) throw new Error('missing column ' + col);
  });
  if (header.indexOf('giftReceived') >= 0) throw new Error('planner-only column leaked into the export');
  if (captured.body.indexOf('9812345678') < 0) throw new Error('the guest with a number was not exported');
});

check('guests without a mobile number are left out of the Supabase export', function () {
  W.store.update(function (s) { s.guests = []; });
  W.store.addGuest({ name: 'No Phone', phone: '' });
  var called = false;
  var realDownload = W.util.download;
  W.util.download = function () { called = true; };
  try { W.store.exportSupabaseCSV(); } finally { W.util.download = realDownload; }
  if (called) throw new Error('exported a file with no usable rows');
});

check('the guide and albums have content for every section', function () {
  if (W.data.guide.length < 3) throw new Error('guide too thin');
  W.data.guide.forEach(function (g) {
    if (!g.title || !g.items.length) throw new Error('empty guide section');
    g.items.forEach(function (row) {
      if (!row[0] || !row[1]) throw new Error('empty guide row in ' + g.title);
    });
  });
  if (!W.data.albums.length) throw new Error('no albums');
});

/* ---------------- ornament geometry ---------------- */

log('\nOrnaments');

check('generated SVG contains no NaN or undefined', function () {
  var M = W.motifs;
  var svg = [
    M.doorPanel('l', 'L'), M.doorPanel('r', 'R'),
    M.mandalaSvg('', 18, '#c9a227'), M.peacockFeather('#0f5b56', '#c9a227'),
    M.kalash('#c9a227'), M.paisley('#d4614f'), M.corner('#c9a227'),
    M.garlandRow(12, 7), M.archFrame('#c9a227'),
    M.cuspArch(20, 150, 260, 120, 9, 280)
  ].join(' ');
  if (/NaN|undefined|Infinity/.test(svg)) throw new Error('bad number in generated SVG');
  if (svg.length < 5000) throw new Error('suspiciously little markup');
});

check('the garland renders one positioned strand per flower string', function () {
  var markup = W.motifs.garlandRow(9, 3);
  var strands = markup.match(/class="strand"/g) || [];
  if (strands.length !== 9) throw new Error('got ' + strands.length + ' strands');
  if (!/left:[\d.]+%/.test(markup)) throw new Error('strands are not positioned');
});

/* ---------------- summary ---------------- */

log('\n' + (fail ? 'FAILED' : 'PASSED') + ' — ' + pass + ' passed, ' + fail + ' failed, ' +
  listenersAttached + ' event listeners wired');
if (fail) throw new Error(fail + ' test(s) failed');
