/* Supabase client over plain fetch — no npm, no bundler.
   Every call goes through an RPC; the schema denies direct table access.

   If config.js has no credentials, everything falls back to the sample
   guests in data.js so the portal is still usable and testable. */
window.W = window.W || {};

(function (W) {
  'use strict';

  const cfg = W.config || {};
  const URL_BASE = (cfg.SUPABASE_URL || '').replace(/\/+$/, '');
  const KEY = cfg.SUPABASE_ANON_KEY || '';
  const ON = !!(URL_BASE && KEY);

  function isConfigured() { return ON; }

  /* 10 digits, tolerating +91, spaces, dashes and a leading 0. */
  function normPhone(raw) {
    const d = String(raw == null ? '' : raw).replace(/\D/g, '');
    return d.length > 10 ? d.slice(-10) : d;
  }

  function rpc(fn, args) {
    if (!ON) return Promise.reject(new Error('Supabase is not configured'));
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 12000) : null;

    return fetch(URL_BASE + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: {
        'apikey': KEY,
        'Authorization': 'Bearer ' + KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(args || {}),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      if (!res.ok) {
        return res.text().then(function (t) {
          throw new Error('Supabase ' + res.status + ': ' + t.slice(0, 300));
        });
      }
      return res.json();
    }, function (err) {
      if (timer) clearTimeout(timer);
      throw (err && err.name === 'AbortError')
        ? new Error('The connection timed out.')
        : err;
    });
  }

  /* ---------------- guest lookup ---------------- */

  /* Resolves to a guest object, or null when the number isn't on the list. */
  function getGuest(phone) {
    const p = normPhone(phone);
    if (p.length !== 10) return Promise.reject(new Error('Please enter a 10-digit mobile number.'));

    if (!ON) return Promise.resolve(localGuest(p));

    return rpc('get_my_details', { p_phone: p }).then(function (rows) {
      const row = Array.isArray(rows) ? rows[0] : rows;
      return row ? shape(row, p) : null;
    });
  }

  function pick(r, flatKey, invKey) {
    if (r[flatKey] !== undefined) return !!r[flatKey];
    if (r.inv && r.inv[invKey] !== undefined) return !!r.inv[invKey];
    return !!r[invKey];
  }

  /* Normalise a DB row (or a local sample) into what the portal renders. */
  function shape(r, phone) {
    return {
      phone: phone,
      name: r.name || 'Guest',
      salutation: r.salutation || '',
      side: r.side || '',
      group: r.grp || r.group || '',
      city: r.city || '',
      adults: Number(r.adults) || 0,
      kids: Number(r.kids) || 0,
      diet: r.diet || 'Veg',
      rsvp: r.rsvp || 'Pending',
      // Supabase sends flat inv_* columns; the local store nests them under inv.
      invited: {
        haldi: pick(r, 'inv_haldi', 'haldi'),
        sangeet: pick(r, 'inv_sangeet', 'sangeet'),
        phere: pick(r, 'inv_phere', 'phere'),
        reception: pick(r, 'inv_reception', 'reception')
      },
      arrival: r.arrival || '',
      arrivalTime: r.arrival_time || r.arrivalTime || '',
      departure: r.departure || '',
      mode: r.mode || '',
      travelDetail: r.travel_detail || r.travelDetail || '',
      pickup: r.pickup || '',
      needsRoom: !!(r.needs_room !== undefined ? r.needs_room : r.needsRoom),
      hotel: r.hotel || '',
      room: r.room_no || r.room || '',
      checkIn: r.check_in || r.checkIn || '',
      checkOut: r.check_out || r.checkOut || '',
      hostPaid: !!(r.host_paid !== undefined ? r.host_paid : r.hostPaid),
      table: r.table_no || r.table || '',
      message: r.message || ''
    };
  }

  /* ---------------- local fallback ---------------- */

  /* Looks in the planner's saved guest list first, then the seed data. */
  function localGuest(p) {
    let rows = [];
    try {
      if (W.store && W.store.get) rows = W.store.get().guests || [];
    } catch (e) { /* store may not be loaded on the portal page */ }
    if (!rows.length && W.data && W.data.seedGuests) rows = W.data.seedGuests;

    const hit = rows.filter(function (g) { return normPhone(g.phone) === p; })[0];
    return hit ? shape(hit, p) : null;
  }

  /* ---------------- guest updates their own reply ---------------- */

  function updateRsvp(phone, patch) {
    const p = normPhone(phone);
    if (!ON) {
      // Mirror it into the planner's local store so the change isn't lost.
      try {
        if (W.store && W.store.update) {
          W.store.update(function (s) {
            const g = (s.guests || []).filter(function (x) { return normPhone(x.phone) === p; })[0];
            if (g) {
              g.rsvp = patch.rsvp; g.adults = patch.adults;
              g.kids = patch.kids; g.diet = patch.diet;
            }
          });
        }
      } catch (e) { /* ignore */ }
      return Promise.resolve(true);
    }
    return rpc('update_my_rsvp', {
      p_phone: p,
      p_rsvp: patch.rsvp,
      p_adults: patch.adults,
      p_kids: patch.kids,
      p_diet: patch.diet,
      p_notes: patch.notes || null
    }).then(function (ok) { return ok === true || ok === 'true'; });
  }

  /* ---------------- albums & announcements ---------------- */

  function getAlbums() {
    if (!ON) return Promise.resolve((W.data && W.data.albums) || []);
    return rpc('get_albums', {}).then(function (rows) {
      return (rows || []).map(function (a) {
        return {
          title: a.title, functionId: a.function_id,
          url: a.url, cover: a.cover_url, count: a.photo_count
        };
      });
    }).catch(function () { return (W.data && W.data.albums) || []; });
  }

  function getAnnouncements() {
    if (!ON) return Promise.resolve((W.data && W.data.announcements) || []);
    return rpc('get_announcements', {})
      .then(function (rows) { return rows || []; })
      .catch(function () { return (W.data && W.data.announcements) || []; });
  }

  /* ---------------- public RSVP form ---------------- */

  function submitRsvp(r) {
    if (!ON) return Promise.reject(new Error('Supabase is not configured'));
    return rpc('submit_rsvp', {
      p_name: r.name, p_phone: normPhone(r.phone), p_city: r.city,
      p_side: r.side, p_attending: r.attending,
      p_adults: r.adults, p_kids: r.kids,
      p_functions: r.functions || [], p_diet: r.diet,
      p_arrival: r.arrival || null, p_mode: r.mode,
      p_travel_detail: r.travelDetail, p_notes: r.notes
    });
  }

  W.db = {
    isConfigured: isConfigured,
    normPhone: normPhone,
    getGuest: getGuest,
    updateRsvp: updateRsvp,
    getAlbums: getAlbums,
    getAnnouncements: getAnnouncements,
    submitRsvp: submitRsvp,
    shape: shape
  };
})(window.W);
