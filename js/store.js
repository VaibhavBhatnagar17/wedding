/* Persistent state. Everything lives in localStorage under one key, so the
   whole plan can be exported as a single JSON file and restored on another
   device (or handed to a family member). No backend required. */
window.W = window.W || {};

(function (W) {
  'use strict';

  const KEY = 'vm-wedding-v1';
  const U = W.util;

  const listeners = [];
  let state = null;

  function defaults() {
    return {
      version: 1,
      guests: JSON.parse(JSON.stringify(W.data.seedGuests)),
      // Vendor rows carry the plan's target plus whatever the couple negotiates.
      vendors: W.data.vendors.map(function (v) {
        return Object.assign({}, v, { quoted: 0, booked: 0, paid: 0 });
      }),
      // Budget rows track actuals against the planned amount.
      budget: W.data.budget.map(function (b) {
        return Object.assign({}, b, { actual: 0, paid: 0 });
      }),
      checklist: W.data.checklist.map(function (c) {
        return Object.assign({}, c, { done: false });
      }),
      venueChoice: { name: '', zone: '', contact: '', perPlate: 0, blockRate: 0, notes: '' },
      rsvpInbox: [],
      settings: { unlocked: false }
    };
  }

  function load() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { /* file:// or blocked */ }
    if (!raw) { state = defaults(); return; }
    try {
      const parsed = JSON.parse(raw);
      // Shallow-merge so newly added fields in data.js appear for existing users.
      state = Object.assign(defaults(), parsed);
      if (!Array.isArray(state.guests)) state.guests = defaults().guests;
      // Re-sync static plan text while keeping user-entered numbers.
      state.budget = W.data.budget.map(function (b) {
        const prev = (parsed.budget || []).find(function (p) { return p.id === b.id; }) || {};
        return Object.assign({}, b, { actual: prev.actual || 0, paid: prev.paid || 0 });
      });
      state.vendors = W.data.vendors.map(function (v) {
        const prev = (parsed.vendors || []).find(function (p) { return p.id === v.id; }) || {};
        return Object.assign({}, v, {
          name: prev.name || v.name, status: prev.status || v.status,
          quoted: prev.quoted || 0, booked: prev.booked || 0, paid: prev.paid || 0,
          contact: prev.contact || '', note: prev.note || v.note
        });
      });
      state.checklist = W.data.checklist.map(function (c) {
        const prev = (parsed.checklist || []).find(function (p) { return p.id === c.id; }) || {};
        return Object.assign({}, c, { done: !!prev.done });
      });
    } catch (e) {
      state = defaults();
    }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) {
      U.toast('Could not save locally. Export a backup instead.', 'warn');
    }
    listeners.forEach(function (fn) { fn(state); });
  }

  function get() { if (!state) load(); return state; }
  function subscribe(fn) { listeners.push(fn); return function () { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); }; }
  function update(mutator) { mutator(get()); save(); }

  /* ---------- guests ---------- */

  function blankGuest() {
    return {
      id: U.uid('g'), name: '', side: 'Bride', group: 'Extended family', city: '',
      adults: 1, kids: 0, phone: '', email: '', diet: 'Veg', rsvp: 'Pending',
      inv: { mehndi: false, haldi: true, sangeet: true, phere: true, reception: true },
      arrival: '', arrivalTime: '', departure: '', mode: '',
      travelDetail: '', pickup: '',
      // Portal fields — these are what the guest sees when they look themselves up.
      needsRoom: false, hotel: '', room: '', checkIn: '', checkOut: '',
      table: '', message: '',
      hostPaid: false, giftReceived: false, notes: ''
    };
  }

  function addGuest(g) {
    update(function (s) { s.guests.push(Object.assign(blankGuest(), g)); });
  }

  function updateGuest(id, patch) {
    update(function (s) {
      const g = s.guests.find(function (x) { return x.id === id; });
      if (g) Object.assign(g, patch);
    });
  }

  function removeGuest(id) {
    update(function (s) { s.guests = s.guests.filter(function (x) { return x.id !== id; }); });
  }

  /* ---------- derived stats ---------- */

  // A party's headcount only counts toward a function it is invited to.
  function heads(g) { return (Number(g.adults) || 0) + (Number(g.kids) || 0); }

  function functionStats(fnId) {
    const s = get();
    let invitedParties = 0, invitedHeads = 0, confirmedHeads = 0, declinedHeads = 0, pendingHeads = 0;
    s.guests.forEach(function (g) {
      if (!g.inv || !g.inv[fnId]) return;
      invitedParties++;
      const h = heads(g);
      invitedHeads += h;
      if (g.rsvp === 'Confirmed') confirmedHeads += h;
      else if (g.rsvp === 'Declined') declinedHeads += h;
      else pendingHeads += h;
    });
    return {
      invitedParties: invitedParties, invitedHeads: invitedHeads,
      confirmedHeads: confirmedHeads, declinedHeads: declinedHeads, pendingHeads: pendingHeads
    };
  }

  function dietCounts(fnId) {
    const s = get(), out = {};
    s.guests.forEach(function (g) {
      if (fnId && (!g.inv || !g.inv[fnId])) return;
      if (g.rsvp === 'Declined') return;
      out[g.diet || 'Veg'] = (out[g.diet || 'Veg'] || 0) + heads(g);
    });
    return out;
  }

  function budgetTotals() {
    const s = get();
    const planned = U.sum(s.budget, function (b) { return b.amount; });
    const actual = U.sum(s.budget, function (b) { return b.actual; });
    const paid = U.sum(s.budget, function (b) { return b.paid; });
    return { planned: planned, actual: actual, paid: paid, outstanding: actual - paid, variance: actual - planned };
  }

  function budgetByCategory() {
    const s = get();
    const groups = U.groupBy(s.budget, function (b) { return b.cat; });
    return Object.keys(groups).map(function (cat) {
      return {
        cat: cat,
        planned: U.sum(groups[cat], function (b) { return b.amount; }),
        actual: U.sum(groups[cat], function (b) { return b.actual; }),
        paid: U.sum(groups[cat], function (b) { return b.paid; }),
        rows: groups[cat]
      };
    }).sort(function (a, b) { return b.planned - a.planned; });
  }

  /* ---------- CSV import / export ---------- */

  const CSV_COLS = [
    'name', 'side', 'group', 'city', 'adults', 'kids', 'phone', 'email', 'diet', 'rsvp',
    'mehndi', 'haldi', 'sangeet', 'phere', 'reception',
    'arrival', 'arrivalTime', 'departure', 'mode', 'travelDetail', 'pickup',
    'needsRoom', 'hotel', 'room', 'checkIn', 'checkOut', 'table', 'message',
    'hostPaid', 'giftReceived', 'notes'
  ];

  function guestsToRows() {
    return get().guests.map(function (g) {
      return {
        name: g.name, side: g.side, group: g.group, city: g.city,
        adults: g.adults, kids: g.kids, phone: g.phone, email: g.email,
        diet: g.diet, rsvp: g.rsvp,
        mehndi: g.inv.mehndi ? 'yes' : 'no', haldi: g.inv.haldi ? 'yes' : 'no',
        sangeet: g.inv.sangeet ? 'yes' : 'no', phere: g.inv.phere ? 'yes' : 'no',
        reception: g.inv.reception ? 'yes' : 'no',
        arrival: g.arrival, arrivalTime: g.arrivalTime, departure: g.departure, mode: g.mode,
        travelDetail: g.travelDetail || '', pickup: g.pickup || '',
        needsRoom: g.needsRoom ? 'yes' : 'no', hotel: g.hotel || '', room: g.room,
        checkIn: g.checkIn || '', checkOut: g.checkOut || '',
        table: g.table || '', message: g.message || '',
        hostPaid: g.hostPaid ? 'yes' : 'no',
        giftReceived: g.giftReceived ? 'yes' : 'no', notes: g.notes
      };
    });
  }

  function exportGuestsCSV() {
    U.download('guest-list.csv', U.toCSV(guestsToRows(), CSV_COLS), 'text/csv');
  }

  /* Column names matching the Supabase `guests` table, so the file can be
     dropped straight into the Table Editor's CSV import. */
  const SUPA_COLS = [
    'phone', 'name', 'side', 'grp', 'city', 'adults', 'kids', 'diet', 'rsvp',
    'inv_mehndi', 'inv_haldi', 'inv_sangeet', 'inv_phere', 'inv_reception',
    'arrival', 'arrival_time', 'departure', 'mode', 'travel_detail', 'pickup',
    'needs_room', 'hotel', 'room_no', 'check_in', 'check_out', 'host_paid',
    'table_no', 'message', 'notes'
  ];

  function exportSupabaseCSV() {
    const rows = get().guests
      .filter(function (g) { return String(g.phone || '').replace(/\D/g, '').length >= 10; })
      .map(function (g) {
        function b(v) { return v ? 'true' : 'false'; }
        return {
          phone: String(g.phone).replace(/\D/g, '').slice(-10),
          name: g.name, side: g.side, grp: g.group, city: g.city,
          adults: g.adults, kids: g.kids, diet: g.diet,
          // The portal only understands these four values.
          rsvp: ({ Confirmed: 'Yes', Declined: 'No', Tentative: 'Maybe' })[g.rsvp] || 'Pending',
          inv_mehndi: b(g.inv.mehndi), inv_haldi: b(g.inv.haldi),
          inv_sangeet: b(g.inv.sangeet), inv_phere: b(g.inv.phere),
          inv_reception: b(g.inv.reception),
          arrival: g.arrival, arrival_time: g.arrivalTime, departure: g.departure,
          mode: g.mode, travel_detail: g.travelDetail || '', pickup: g.pickup || '',
          needs_room: b(g.needsRoom), hotel: g.hotel || '', room_no: g.room || '',
          check_in: g.checkIn || '', check_out: g.checkOut || '',
          host_paid: b(g.hostPaid), table_no: g.table || '',
          message: g.message || '', notes: g.notes || ''
        };
      });

    if (!rows.length) {
      U.toast('No guests have a 10-digit mobile number yet — the portal needs one to look them up.', 'warn');
      return 0;
    }
    U.download('guests-for-supabase.csv', U.toCSV(rows, SUPA_COLS), 'text/csv');
    return rows.length;
  }

  function csvTemplate() {
    const sample = {
      name: 'Sample Guest / Family', side: 'Bride', group: 'Extended family', city: 'Delhi',
      adults: '2', kids: '1', phone: '9876543210', email: '', diet: 'Veg', rsvp: 'Pending',
      mehndi: 'no', haldi: 'yes', sangeet: 'yes', phere: 'yes', reception: 'yes',
      arrival: '2027-01-31', arrivalTime: '14:30', departure: '2027-02-03', mode: 'Flight',
      travelDetail: '6E 6521', pickup: '',
      needsRoom: 'yes', hotel: '', room: '', checkIn: '2027-01-31', checkOut: '2027-02-03',
      table: '', message: 'A line they will see in their portal',
      hostPaid: 'no', giftReceived: 'no', notes: 'Needs ground-floor room'
    };
    U.download('guest-list-template.csv', U.toCSV([sample], CSV_COLS), 'text/csv');
  }

  function truthy(v) { return /^(y|yes|true|1)$/i.test(String(v || '').trim()); }

  function importGuestsCSV(text, mode) {
    const rows = U.parseCSV(text);
    if (!rows.length) return { added: 0, skipped: 0, error: 'No rows found in that file.' };
    if (!('name' in rows[0])) {
      return { added: 0, skipped: 0, error: 'Missing a "name" column. Download the template to see the expected headers.' };
    }
    let added = 0, skipped = 0;
    const mapped = [];
    rows.forEach(function (r) {
      if (!String(r.name || '').trim()) { skipped++; return; }
      mapped.push({
        id: U.uid('g'),
        name: r.name.trim(),
        side: /groom/i.test(r.side) ? 'Groom' : 'Bride',
        group: r.group || 'Extended family',
        city: r.city || '',
        adults: Math.max(1, Number(r.adults) || 1),
        kids: Number(r.kids) || 0,
        phone: r.phone || '', email: r.email || '',
        diet: r.diet || 'Veg',
        rsvp: /^(confirmed|declined|tentative)$/i.test(r.rsvp || '')
          ? r.rsvp.charAt(0).toUpperCase() + r.rsvp.slice(1).toLowerCase() : 'Pending',
        inv: {
          mehndi: truthy(r.mehndi), haldi: truthy(r.haldi), sangeet: truthy(r.sangeet),
          phere: truthy(r.phere), reception: truthy(r.reception)
        },
        arrival: r.arrival || '', arrivalTime: r.arrivalTime || '',
        departure: r.departure || '', mode: r.mode || '',
        travelDetail: r.travelDetail || '', pickup: r.pickup || '',
        needsRoom: truthy(r.needsRoom), hotel: r.hotel || '', room: r.room || '',
        checkIn: r.checkIn || '', checkOut: r.checkOut || '',
        table: r.table || '', message: r.message || '',
        hostPaid: truthy(r.hostPaid),
        giftReceived: truthy(r.giftReceived), notes: r.notes || ''
      });
      added++;
    });
    update(function (s) {
      s.guests = mode === 'replace' ? mapped : s.guests.concat(mapped);
    });
    return { added: added, skipped: skipped };
  }

  /* ---------- full backup ---------- */

  function exportAll() {
    const payload = { exportedAt: new Date().toISOString(), state: get() };
    U.download('wedding-backup-' + new Date().toISOString().slice(0, 10) + '.json',
      JSON.stringify(payload, null, 2), 'application/json');
  }

  function importAll(text) {
    try {
      const parsed = JSON.parse(text);
      const incoming = parsed.state || parsed;
      if (!incoming || !Array.isArray(incoming.guests)) throw new Error('bad shape');
      state = Object.assign(defaults(), incoming);
      save();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'That file is not a valid wedding backup.' };
    }
  }

  function resetAll() {
    state = defaults();
    save();
  }

  /* ---------- RSVP inbox (from the public invitation page) ---------- */

  const RSVP_KEY = 'vm-wedding-rsvp-v1';

  function submitRsvp(entry) {
    // Written to its own key so the guest-facing page never touches planner state.
    // Swap this one function for a fetch() to Google Sheets / Supabase to collect
    // responses centrally — everything else keeps working unchanged.
    let list = [];
    try { list = JSON.parse(localStorage.getItem(RSVP_KEY) || '[]'); } catch (e) { list = []; }
    list.push(Object.assign({ id: U.uid('r'), at: new Date().toISOString() }, entry));
    try { localStorage.setItem(RSVP_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
    return list.length;
  }

  function readRsvps() {
    try { return JSON.parse(localStorage.getItem(RSVP_KEY) || '[]'); } catch (e) { return []; }
  }

  function clearRsvps() {
    try { localStorage.removeItem(RSVP_KEY); } catch (e) { /* ignore */ }
  }

  W.store = {
    get: get, update: update, save: save, subscribe: subscribe,
    blankGuest: blankGuest, addGuest: addGuest, updateGuest: updateGuest, removeGuest: removeGuest,
    heads: heads, functionStats: functionStats, dietCounts: dietCounts,
    budgetTotals: budgetTotals, budgetByCategory: budgetByCategory,
    exportGuestsCSV: exportGuestsCSV, exportSupabaseCSV: exportSupabaseCSV,
    importGuestsCSV: importGuestsCSV, csvTemplate: csvTemplate,
    exportAll: exportAll, importAll: importAll, resetAll: resetAll,
    submitRsvp: submitRsvp, readRsvps: readRsvps, clearRsvps: clearRsvps,
    CSV_COLS: CSV_COLS
  };
})(window.W);
