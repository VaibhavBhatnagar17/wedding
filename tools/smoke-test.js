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
  'js/i18n.js', 'js/util.js', 'js/data.js', 'js/content.js', 'js/flyin.js', 'js/store.js', 'js/ui.js',
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

/* Contingency was 4.1% when the core list was 300. Cutting it to 180 freed
   about ₹2L and the agreed call was to spend the first slice on a proper
   reserve, so hold that here — it is the line most likely to be quietly raided
   to cover something else. */
check('contingency is at least 8% of the budget', function () {
  var total = W.data.budget.reduce(function (n, b) { return n + b.amount; }, 0);
  var c = W.data.budget.reduce(function (n, b) {
    return b.cat === 'Contingency' ? n + b.amount : n;
  }, 0);
  var pct = c / total * 100;
  if (pct < 8) throw new Error('contingency down to ' + pct.toFixed(1) + '%');
});

check('the day-of coordinator is its own line, not taken from contingency', function () {
  var row = W.data.budget.find(function (b) { return /coordinator/i.test(b.head); });
  if (!row) throw new Error('no coordinator line in the budget');
  if (row.cat === 'Contingency') throw new Error('coordinator is inside contingency');
  if (row.amount < 35000) throw new Error('coordinator budgeted at only ' + row.amount);
});

check('per-plate x guarantee matches the F&B budget lines', function () {
  var f = W.data.functions;
  function fn(id) { return f.find(function (x) { return x.id === id; }); }
  // Derived from the function data, so re-cutting the budget cannot leave the
  // test asserting numbers that were only ever true last month.
  var expect = {
    b01: fn('haldi').perPlate * fn('haldi').guarantee,
    b02: fn('sangeet').perPlate * fn('sangeet').guarantee,
    b03: fn('phere').perPlate * fn('phere').guarantee,
    b04: fn('reception').perPlate * fn('reception').guarantee
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

/* tools/check-guests.py collapses the two-tab sheet into exactly this shape.
   If the importer stops understanding one of these columns, the bridge from the
   Google Sheet breaks silently, so pin the contract here. */
check('the flat file from check-guests.py imports with every column honoured', function () {
  var csv = 'name,side,group,city,adults,kids,phone,diet,rsvp,' +
            'haldi,sangeet,phere,reception,needsRoom,notes\n' +
            'Vikram & Neha Bhatnagar,Groom,Extended family,Kota,3,1,9876500009,Veg,Pending,' +
            'yes,yes,yes,yes,yes,"Chacha-chachi · Vikram (Adult); Neha (Adult); ' +
            'Aarav (Child); Ishita (Teen, Jain)"\n';
  var res = W.store.importGuestsCSV(csv, 'replace');
  if (res.error) throw new Error(res.error);
  if (res.added !== 1) throw new Error('added ' + res.added);
  var g = W.store.get().guests[0];
  if (g.city !== 'Kota') throw new Error('city ' + g.city);
  if (g.group !== 'Extended family') throw new Error('group ' + g.group);
  if (g.phone !== '9876500009') throw new Error('phone ' + g.phone);
  if (!g.needsRoom) throw new Error('needsRoom did not survive');
  if (W.store.heads(g) !== 4) throw new Error('heads ' + W.store.heads(g));
  // A teen counts toward adults for beds, so the named roster is the only place
  // the individual people survive today. It must come through intact.
  if (!/Ishita \(Teen, Jain\)/.test(g.notes)) throw new Error('roster lost: ' + g.notes);
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

check('the door carving never stretches', function () {
  var markup = W.motifs.doorPanel('l', 'L');
  if (/preserveAspectRatio="none"/.test(markup)) {
    throw new Error('a door SVG still stretches — circles will render as ovals');
  }
  var svgs = markup.match(/<svg[^>]*>/g) || [];
  if (!svgs.length) throw new Error('no SVG in the door');
  svgs.forEach(function (tag) {
    if (!/preserveAspectRatio="[a-zA-Z]+ meet"/.test(tag)) {
      throw new Error('door SVG is missing a "meet" aspect ratio: ' + tag);
    }
  });
  // The tiled lattice and the frame moved to CSS, so both must be referenced.
  if (!/door__jaali/.test(markup)) throw new Error('lattice layer missing');
});

/* ---------------- content the guests read ---------------- */

log('\nGuest-facing content');

check('Mehndi is no longer a venue function', function () {
  var ids = W.data.functions.map(function (f) { return f.id; });
  if (ids.indexOf('mehndi') !== -1) throw new Error('mehndi is still a function');
  if (ids.length !== 4) throw new Error('expected 4 functions, got ' + ids.length);
  var dates = {};
  W.data.functions.forEach(function (f) { dates[f.date] = 1; });
  var days = Object.keys(dates).sort();
  if (days.join(',') !== '2027-02-01,2027-02-02') {
    throw new Error('expected two days on 1 and 2 Feb, got ' + days.join(','));
  }
  // The invite flag has to go too, or CSV round-trips carry a dead column.
  if ('mehndi' in W.data.seedGuests[0].inv) throw new Error('inv.mehndi survives');
});

/* ---------------- the programme ---------------- */

log('\nProgramme');

var P = W.data.programme;
function ev(id) {
  var e = P.find(function (x) { return x.id === id; });
  if (!e) throw new Error('no programme event "' + id + '"');
  return e;
}
function mins(t) { var p = t.split(':'); return Number(p[0]) * 60 + Number(p[1]); }
/* Minutes from midnight on 1 Feb, so 01:00 after the after-party is 1500. */
function abs(date, t) {
  var day = Number(date.slice(8)) - 1;
  return day * 1440 + mins(t);
}
function endAbs(e) {
  var s = abs(e.date, e.start), f = abs(e.date, e.end || e.start);
  return f < s ? f + 1440 : f;
}
var DEVA = /[\u0900-\u097F]/;

check('every event has an id, a date on the wedding days, and a time', function () {
  var seen = {};
  P.forEach(function (e) {
    if (seen[e.id]) throw new Error('duplicate id ' + e.id);
    seen[e.id] = 1;
    if (['2027-02-01', '2027-02-02', '2027-02-03'].indexOf(e.date) < 0) throw new Error(e.id + ' has date ' + e.date);
    if (!/^\d{2}:\d{2}$/.test(e.start)) throw new Error(e.id + ' start ' + e.start);
    if (e.end && !/^\d{2}:\d{2}$/.test(e.end)) throw new Error(e.id + ' end ' + e.end);
    if (e.fn && !W.data.functions.some(function (f) { return f.id === e.fn; })) throw new Error(e.id + ' has unknown group ' + e.fn);
    if (!e.fn && !e.sheet) throw new Error(e.id + ' belongs to no run sheet');
  });
});

check('the programme is in time order', function () {
  for (var i = 1; i < P.length; i++) {
    if (abs(P[i].date, P[i].start) < abs(P[i - 1].date, P[i - 1].start)) {
      throw new Error(P[i].id + ' comes before ' + P[i - 1].id);
    }
  }
});

check('the hotel opens at 8 on 1 Feb, and the haldi starts at 11', function () {
  if (P[0].id !== 'rooms' || P[0].start !== '08:00') throw new Error('first beat is ' + P[0].id + ' at ' + P[0].start);
  if (W.data.venue.booked.opensForGuests !== '08:00') throw new Error('venue opening time disagrees');
  if (ev('haldi').start !== '11:00') throw new Error('haldi starts at ' + ev('haldi').start);
});

check('1 Feb evening runs folk, sagaai, sangeet, then the after-party indoors', function () {
  var order = ['folk', 'sagaai', 'sangeet', 'afterparty'].map(function (id) { return abs(ev(id).date, ev(id).start); });
  for (var i = 1; i < order.length; i++) if (!(order[i] > order[i - 1])) throw new Error('evening out of order');
  if (ev('sagaai').start !== '20:00' || ev('sangeet').start !== '21:00' || ev('afterparty').start !== '23:00') {
    throw new Error('evening times moved');
  }
  if (!/underground banquet/i.test(ev('afterparty').where[0])) throw new Error('the after-party must be indoors');
  if (ev('dinner1').start !== ev('sagaai').start) throw new Error('dinner should open with the sagaai');
});

check('published times never overlap the moments guests must attend', function () {
  // Meals and rest can run alongside; the moments themselves must not collide.
  var keys = P.filter(function (e) { return e.key; });
  for (var i = 1; i < keys.length; i++) {
    if (abs(keys[i].date, keys[i].start) < endAbs(keys[i - 1])) {
      throw new Error(keys[i - 1].id + ' runs into ' + keys[i].id);
    }
  }
});

check('every published breakfast closes before the next thing guests must be at', function () {
  [['bf1', 'haldi'], ['bf2', 'baraat']].forEach(function (pair) {
    var b = ev(pair[0]), next = ev(pair[1]);
    var nextAt = abs(next.date, next.seated || next.start);
    if (endAbs(b) > nextAt) throw new Error(pair[0] + ' is published past ' + pair[1]);
    if (!b.ops || !/quietly/i.test(b.ops)) throw new Error(pair[0] + ' should note the quiet extension for the planner');
  });
});

check('the bride has time between the tel ceremony and the varmala', function () {
  var gap = mins(ev('varmala').start) - mins(ev('tel').end);
  if (gap < 150) throw new Error('only ' + gap + ' minutes for hair wash, hair and makeup');
  if (!(mins(ev('ganesh').start) < mins(ev('tel').start))) throw new Error('Ganesh puja comes first');
});

check('baraat, milni, varmala and phere chain on 2 Feb', function () {
  var b = ev('baraat'), m = ev('milni'), v = ev('varmala'), p = ev('phere');
  if (b.seated !== '09:15' || b.start !== '09:30') throw new Error('baraat gathers 9:15 and leaves 9:30');
  if (b.end !== m.start || m.end !== v.start || v.end !== p.start) throw new Error('the morning has a gap or overlap');
  if (p.start !== W.data.couple.pheraStart || p.end !== W.data.couple.pheraEnd) throw new Error('phere disagrees with the couple record');
});

check('vidaai follows the wedding lunch and comes before the reception', function () {
  var v = ev('vidaai');
  if (!(mins(v.start) >= mins(ev('lunch2').end))) throw new Error('vidaai overlaps lunch');
  if (!(endAbs(v) <= abs(ev('reception').date, ev('reception').start))) throw new Error('vidaai runs into the reception');
});

check('the run sheets are built from the programme, with the vendor rows kept', function () {
  W.data.functions.forEach(function (f) {
    var mine = P.filter(function (e) { return (e.fn || e.sheet) === f.id; }).length;
    var guestRows = f.schedule.filter(function (r) { return r[1] !== null; }).length;
    if (guestRows !== mine) throw new Error(f.id + ' run sheet has ' + guestRows + ' guest rows, programme has ' + mine);
  });
  var sangeet = W.data.functions.find(function (f) { return f.id === 'sangeet'; }).schedule;
  if (!/after-party/i.test(sangeet[sangeet.length - 1][1] || '')) throw new Error('the after-party should close the evening run sheet');
});

check('planner-only notes never reach guest-facing programme text', function () {
  var noise = /legal cut-?off|quietly|do not announce|décor team|decor team|licen[cs]e|lighting test|budget|₹/i;
  P.forEach(function (e) {
    ['t', 'where', 'note', 'dress'].forEach(function (k) {
      (e[k] || []).forEach(function (s) { if (noise.test(s)) throw new Error(e.id + '.' + k + ' reads like a vendor note: ' + s); });
    });
  });
});

/* ---------------- English and Hindi ---------------- */

log('\nEnglish and Hindi');

function pairCheck(where, v) {
  if (!Array.isArray(v) || v.length !== 2 || !v[0] || !v[1]) throw new Error(where + ' is not an [english, hindi] pair');
  if (!DEVA.test(v[1])) throw new Error(where + ' Hindi has no Devanagari: ' + v[1]);
  if (DEVA.test(v[0])) throw new Error(where + ' English is in Devanagari: ' + v[0]);
}

check('every programme event is written in both languages', function () {
  P.forEach(function (e) {
    pairCheck(e.id + '.t', e.t);
    pairCheck(e.id + '.where', e.where);
    if (e.note) pairCheck(e.id + '.note', e.note);
    if (e.dress) pairCheck(e.id + '.dress', e.dress);
  });
});

check('every guide card, look, question and caption is in both languages', function () {
  var C = W.content;
  C.stay.concat(C.travel, C.whileHere).forEach(function (c, i) { pairCheck('card ' + i + ' title', c.t); pairCheck('card ' + i + ' body', c.b); });
  C.dress.forEach(function (d) { pairCheck(d.id + '.t', d.t); pairCheck(d.id + '.when', d.when); pairCheck(d.id + '.b', d.b); });
  C.faq.forEach(function (f, i) { pairCheck('faq ' + i + ' q', f.q); pairCheck('faq ' + i + ' a', f.a); });
  C.help.forEach(function (h) { pairCheck(h.kind + '.t', h.t); pairCheck(h.kind + '.b', h.b); });
  C.flight.forEach(function (w) { pairCheck(w.id + '.cap', w.cap); pairCheck(w.id + '.sub', w.sub); });
  C.spaces.forEach(function (s, i) { pairCheck('space ' + i, s.where); pairCheck('space ' + i + ' use', s.what); });
  C.landmarks.forEach(function (l) { pairCheck(l.id, l.name); });
  W.data.functions.forEach(function (f) {
    pairCheck(f.id + ' name', [f.name, f.nameHi]);
    pairCheck(f.id + ' tagline', [f.tagline, f.taglineHi]);
    pairCheck(f.id + ' blurb', [f.blurb, f.blurbHi]);
  });
});

check('the interface dictionary has the same keys in English and Hindi', function () {
  var en = W.i18n.DICT.en, hi = W.i18n.DICT.hi;
  var missing = Object.keys(en).filter(function (k) { return !hi[k]; });
  var extra = Object.keys(hi).filter(function (k) { return !en[k]; });
  if (missing.length) throw new Error('no Hindi for ' + missing.slice(0, 5).join(', '));
  if (extra.length) throw new Error('Hindi-only keys ' + extra.slice(0, 5).join(', '));
  // The language switch itself names the other language, so it is the one exception.
  var latin = Object.keys(hi).filter(function (k) { return !DEVA.test(hi[k]) && ['lang.switch', 'lang.label'].indexOf(k) < 0; });
  if (latin.length) throw new Error('Hindi strings with no Devanagari: ' + latin.slice(0, 5).join(', '));
  Object.keys(en).forEach(function (k) {
    var a = (en[k].match(/\{\w+\}/g) || []).sort().join(), b = (hi[k].match(/\{\w+\}/g) || []).sort().join();
    if (a !== b) throw new Error(k + ' placeholders differ: ' + a + ' vs ' + b);
  });
});

check('times read naturally in both languages', function () {
  var I = W.i18n;
  I.set('en');
  var got = [I.time('19:30'), I.span('23:00', '01:00'), I.span('21:00', '23:00'), I.span('11:00', '13:30'), I.time('08:00')];
  var want = ['7:30 pm', '11:00 pm – 1:00 am', '9:00 – 11:00 pm', '11:00 am – 1:30 pm', '8:00 am'];
  if (got.join('|') !== want.join('|')) throw new Error(got.join(' | '));
  I.set('hi');
  var hgot = [I.time('19:30'), I.span('20:00', '21:00'), I.time('07:00'), I.span('11:00', '13:00')];
  var hwant = ['शाम 7:30', 'रात 8:00 – 9:00', 'सुबह 7:00', 'सुबह 11:00 – दोपहर 1:00'];
  I.set('en');
  if (hgot.join('|') !== hwant.join('|')) throw new Error(hgot.join(' | '));
});

/* ---------------- everything a guest needs ---------------- */

log('\nCompleteness');

/* Every question a guest has asked at a wedding like this, and where the site
   answers it. A blank answer fails the build rather than reaching a guest. */
check('every question a guest will ask has an answer on the site', function () {
  var C = W.content, V = W.data.venue.booked, dict = W.i18n.DICT.en;
  function faq(re) { return C.faq.some(function (f) { return re.test(f.q[0]); }); }
  function card(list, re) { return list.some(function (c) { return re.test(c.t[0]); }); }
  var needs = [
    ['When do I arrive?', ev('rooms').start === '08:00' && faq(/arrive/i)],
    ['Can I come the night before?', card(C.stay, /31 January/) && V.earlyRooms > 0],
    ['When is checkout?', ev('bf3').date === '2027-02-03' && card(C.stay, /Checking out/)],
    ['Where exactly is the venue?', !!V.address && !!C.map.directions && !!C.map.query],
    ['How do I get from the airport or station?', card(C.travel, /air/i) && card(C.travel, /train/i) && faq(/pick me up/i)],
    ['How far is it by road?', card(C.travel, /road/i)],
    ['Do I need to book a room?', faq(/book a room/i)],
    ['What do I wear to each function?', C.dress.length === 5 && P.filter(function (e) { return e.dress; }).length >= 4],
    ['Which meals are included?', faq(/meals/i) && P.filter(function (e) { return e.meal; }).length >= 6],
    ['Is the food vegetarian?', faq(/vegetarian/i)],
    ['Will there be drinks?', faq(/drinks/i)],
    ['What is the weather like?', !!C.weather.dayHigh && !!C.weather.nightLow && faq(/weather/i)],
    ['What do I pack?', card(C.travel, /pack/i)],
    ['Can I bring children?', faq(/children/i)],
    ['What about elders?', faq(/elders/i)],
    ['What if I am late?', faq(/late/i)],
    ['When are the pheras?', /11:00 am – 1:00 pm/.test(dict['card.muhurat'])],
    ['Who do I call?', C.help.some(function (h) { return h.kind === 'hotel' && h.tel; }) && faq(/call/i)],
    ['Is there a hospital nearby?', C.help.some(function (h) { return h.kind === 'hospital' && h.tel; })],
    ['Emergency number', C.help.some(function (h) { return h.tel === '112'; })],
    ['Wi-Fi and parking', faq(/wi-fi/i)],
    ['Gifts', faq(/gift/i)],
    ['Photos', faq(/photos/i)],
    ['Is there a mehndi?', faq(/mehndi/i)],
    ['By when do I RSVP?', /20 January 2027/.test(dict['rsvp.lead'])],
    ['Can I put it in my calendar?', P.filter(function (e) { return e.alarm; }).length >= 8],
    ['Things to do in Udaipur', C.whileHere.length >= 3]
  ];
  var gaps = needs.filter(function (n) { return !n[1]; }).map(function (n) { return n[0]; });
  if (gaps.length) throw new Error('unanswered: ' + gaps.join('; '));
});

check('the things not yet confirmed are listed for the planner', function () {
  var list = W.data.toConfirm;
  if (!list || list.length < 5) throw new Error('to-confirm list is missing');
  list.forEach(function (x) { if (!x.what || !x.detail) throw new Error('empty to-confirm row'); });
  if (!list.some(function (x) { return /muhurat/i.test(x.what); })) throw new Error('the muhurat must stay on the list until the pandit confirms it');
});

check('content facts agree with the venue record', function () {
  var V = W.data.venue.booked, C = W.content;
  var last = C.flight[C.flight.length - 1];
  if (last.center[0] !== V.lon || last.center[1] !== V.lat) throw new Error('the flight does not land on the hotel');
  if (!C.stay.some(function (c) { return c.b[0].indexOf(String(V.rooms)) >= 0; })) throw new Error('room count missing from the stay cards');
  if (C.help[0].tel !== V.phones[0]) throw new Error('help desk number disagrees with the venue record');
  if (Math.round(V.distances.airport) !== 18 || !/18 km/.test(C.travel[0].b[0])) throw new Error('airport distance disagrees');
});

check('the flight path is ordered and lands where it ends', function () {
  var F = W.content.flight, cam = W.flyin.cameraAt;
  for (var i = 1; i < F.length; i++) if (!(F[i].at > F[i - 1].at)) throw new Error('waypoints out of order at ' + F[i].id);
  var a = cam(F, 0), z = cam(F, 1);
  if (Math.abs(a.center[0] - F[0].center[0]) > 1e-9) throw new Error('flight does not start at the first waypoint');
  var L = F[F.length - 1];
  if (Math.abs(z.center[0] - L.center[0]) > 1e-9 || Math.abs(z.center[1] - L.center[1]) > 1e-9) throw new Error('flight drifts off the hotel');
  var mid = cam(F, (F[1].at + F[2].at) / 2);
  if (!(mid.zoom > 10 && mid.zoom < 18 && mid.pitch >= 0 && mid.pitch <= 78)) throw new Error('camera out of range mid-flight');
});

check('the calendar reminds before key events and ends the after-party next day', function () {
  var a = ev('afterparty');
  var ics = W.util.buildICS([
    { uid: 'a', date: a.date, start: a.start, end: a.end, title: 'After-party', alarm: 15 },
    { uid: 'b', date: '2027-02-01', start: '11:00', end: '13:30', title: 'Haldi' }
  ], 'test');
  if (ics.indexOf('DTEND:20270202T010000') < 0) throw new Error('after-party end is not 1 am on 2 Feb');
  if ((ics.match(/BEGIN:VALARM/g) || []).length !== 1) throw new Error('alarm count wrong');
  if (ics.indexOf('TRIGGER:-PT15M') < 0) throw new Error('alarm trigger missing');
});

check('vendor-only beats are hidden from guests but kept for the planner', function () {
  var opsRows = 0, guestRows = 0;
  W.data.functions.forEach(function (f) {
    f.schedule.forEach(function (r) {
      if (r[1] === null) { opsRows++; if (!r[2]) throw new Error('hidden row has no planner note'); }
      else guestRows++;
    });
  });
  if (opsRows < 4) throw new Error('expected the décor build, makeup call and lighting test to be hidden');
  if (guestRows < 20) throw new Error('too little left for guests to read');

  // Nothing a guest reads should mention vendors, cut-offs or internal costs.
  var noise = /legal cut-?off|sound OFF|décor team|decor team|makeup begins|lighting test|negotiate|saves ₹|saves \d+ min/i;
  W.data.functions.forEach(function (f) {
    f.schedule.forEach(function (r) {
      if (r[1] && noise.test(r[1])) throw new Error('guest row reads like a vendor note: ' + r[1]);
    });
  });
});

check('the portal lists only the functions a guest is invited to', function () {
  // Earlier tests rewrite the guest list, so put the sample data back first.
  W.store.update(function (st) {
    st.guests = JSON.parse(JSON.stringify(W.data.seedGuests));
  });
  var recOnly = W.data.seedGuests.filter(function (g) {
    return g.inv.reception && !g.inv.phere && !g.inv.haldi && !g.inv.sangeet;
  })[0];
  if (!recOnly) throw new Error('sample data has no reception-only guest');
  var g = settle(W.db.getGuest(recOnly.phone)).value;
  var mine = W.data.functions.filter(function (f) { return f.publicInvite && g.invited[f.id]; });
  if (mine.length !== 1 || mine[0].id !== 'reception') {
    throw new Error('reception-only guest resolves to ' + mine.length + ' functions');
  }
});

check('both sets of parents are on the invitation', function () {
  var c = W.data.couple;
  if (c.bride.parents !== 'Riya Kalra & Kishore Kalra') throw new Error('bride parents wrong');
  if (c.groom.parents !== 'Kamla Srivastava & Ved Prakash Bhatnagar') throw new Error('groom parents wrong');
  var names = W.data.seedGuests.map(function (g) { return g.name; });
  ['Riya Kalra', 'Kishore Kalra', 'Kamla Srivastava', 'Ved Prakash Bhatnagar'].forEach(function (n) {
    if (names.indexOf(n) === -1) throw new Error('guest list is missing ' + n);
  });
});

check('driving guests get the routes they actually use', function () {
  var road = W.data.venue.travel.road;
  ['Kota', 'Indore', 'Neemuch', 'Ahmedabad', 'Jaipur'].forEach(function (city) {
    if (road.indexOf(city) === -1) throw new Error('By road is missing ' + city);
  });
});

/* ---------------- summary ---------------- */

log('\n' + (fail ? 'FAILED' : 'PASSED') + ' — ' + pass + ' passed, ' + fail + ' failed, ' +
  listenersAttached + ' event listeners wired');
if (fail) throw new Error(fail + ' test(s) failed');
