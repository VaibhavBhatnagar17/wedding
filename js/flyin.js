/* The drone flight over Udaipur to the venue.

   The flight is a film, rendered ahead of time by tools/render-flight.py: a
   real 3D map (Esri satellite imagery over Mapzen terrain) flown along
   cameraAt() one frame at a time, each frame captured only once every tile
   had arrived. A live map drew half-loaded ground on a slow phone; the film
   looks the same on every one, and weighs a few MB.

   The page lays its own landmark labels over the film, in either language,
   from the per-frame positions the renderer saved in assets/flight/flight.json.
   Anyone who has asked for reduced motion, or is saving data, gets the
   painting and the journey as a list: the flight is decoration, never the
   only way to find the venue. */
window.W = window.W || {};

(function (W) {
  'use strict';

  const DIR = 'assets/flight/';
  // Encoded frame sizes; tools/render-flight.py SHAPES must agree.
  const SIZE = { wide: [1600, 900], tall: [720, 1280] };

  function smooth(t) { return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t); }
  function cr(p0, p1, p2, p3, s) {
    const s2 = s * s, s3 = s2 * s;
    return 0.5 * ((2 * p1) + (-p0 + p2) * s + (2 * p0 - 5 * p1 + 4 * p2 - p3) * s2 + (-p0 + 3 * p1 - 3 * p2 + p3) * s3);
  }

  /* The camera t seconds into the film. A Catmull-Rom curve through the
     waypoints keeps the drone moving past each landmark rather than stopping
     dead at it, and the time warp eases out of the opening hover and into the
     closing circle. dz lifts the whole path (a portrait frame sees less to
     either side). `leg` is the caption to show, from just before each
     waypoint, so the words arrive with the landmark. */
  function cameraAt(flight, orbit, t, dz) {
    dz = dz || 0;
    const last = flight[flight.length - 1];
    const keys = flight.concat([{ t: orbit.t, center: last.center, zoom: orbit.zoom, pitch: orbit.pitch, bearing: orbit.bearing }]);
    const T = orbit.t;
    const u = Math.min(T, Math.max(0, 0.55 * t + 0.45 * T * smooth(t / T)));
    let i = 0;
    while (i < keys.length - 2 && u > keys[i + 1].t) i++;
    const vec = function (k) { return [k.center[0], k.center[1], k.zoom + dz, k.pitch, k.bearing]; };
    const P = [keys[Math.max(0, i - 1)], keys[i], keys[i + 1], keys[Math.min(keys.length - 1, i + 2)]].map(vec);
    // The drone glides to a stop over the hotel and circles it on the spot:
    // without this the curve's momentum carries it past and back again.
    const same = function (a, b) { return a.center[0] === b.center[0] && a.center[1] === b.center[1]; };
    if (same(keys[i], keys[i + 1])) { P[0][0] = P[3][0] = P[1][0]; P[0][1] = P[3][1] = P[1][1]; }
    else if (i + 2 < keys.length && same(keys[i + 1], keys[i + 2])) { P[3][0] = P[1][0]; P[3][1] = P[1][1]; }
    const s = (u - keys[i].t) / (keys[i + 1].t - keys[i].t);
    const o = [0, 1, 2, 3, 4].map(function (j) { return cr(P[0][j], P[1][j], P[2][j], P[3][j], s); });
    let leg = 0;
    flight.forEach(function (k, n) { if (u >= k.t - 0.9) leg = n; });
    return { center: [o[0], o[1]], zoom: o[2], pitch: Math.min(76, o[3]), bearing: o[4], leg: leg };
  }

  function canPlay(v) {
    return !!(v && v.canPlayType && v.canPlayType('video/mp4; codecs="avc1.640028"'));
  }

  /* opts: stage, video, pins (overlay element), landmarks, label(lm) -> text,
     avoid() -> rect the labels must keep clear of,
     onFrame(progress, leg), onLanded(bool), onBlocked(), onReady(), onStatic(reason) */
  function mount(o) {
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = navigator.connection && navigator.connection.saveData;
    const v = o.video;
    if (reduced || saveData || !canPlay(v) || !('IntersectionObserver' in window)) {
      o.onStatic(reduced ? 'reduced' : 'unsupported');
      return { relabel: function () {}, replay: function () {} };
    }

    let shape = null, meta = null, raf = 0, landed = false, visible = false, failed = false;
    const pins = [];

    function pick() {
      const r = o.stage.getBoundingClientRect();
      return r.width / Math.max(1, r.height) < 0.9 ? 'tall' : 'wide';
    }

    function source(at) {
      shape = pick();
      v.poster = DIR + 'flight-' + shape + '-poster.jpg';
      v.src = DIR + 'flight-' + shape + '.mp4';
      v.preload = 'auto';
      if (at) v.addEventListener('loadedmetadata', function once() { v.removeEventListener('loadedmetadata', once); v.currentTime = at; });
      v.load();
      // The stage may already be in view: that observer fires only once.
      if (visible) play();
    }

    function addPins() {
      (o.landmarks || []).forEach(function (lm) {
        const el = document.createElement('div');
        el.className = 'fly__pin is-off' + (lm.home ? ' fly__pin--home' : '');
        el.innerHTML = '<i></i><span></span>';
        el.querySelector('span').textContent = o.label(lm);
        o.pins.appendChild(el);
        pins.push({ lm: lm, el: el, col: meta.landmarks.indexOf(lm.id) });
      });
    }

    function frame() {
      const n = meta ? meta[shape].pins.length : 0;
      return n ? Math.min(n - 1, Math.max(0, Math.round(v.currentTime * meta.fps))) : 0;
    }

    /* The film is cropped to fill the stage (object-fit: cover), so a
       landmark's spot in the frame is scaled and offset the same way. */
    function placePins(i) {
      if (!meta || !pins.length) return;
      const S = SIZE[shape], w = o.stage.clientWidth, h = o.stage.clientHeight;
      const k = Math.max(w / S[0], h / S[1]), dx = (w - S[0] * k) / 2, dy = (h - S[1] * k) / 2;
      const row = meta[shape].pins[i] || [];
      const m = o.stage.getBoundingClientRect();
      const cap = o.avoid ? o.avoid() : null;
      pins.forEach(function (p) {
        const pt = row[p.col];
        if (!pt) { p.el.classList.add('is-off'); return; }
        const x = dx + pt[0] * S[0] * k, y = dy + pt[1] * S[1] * k;
        // A label that drifts into the caption shows through its line gaps, and
        // one near an edge is cut off or slides under the nav, so both give way.
        // The label sits about 40px above its dot and is up to 130px wide.
        const X = m.left + x, Y = m.top + y;
        const under = !!cap && X > cap.left - 70 && X < cap.right + 70 && Y > cap.top && Y < cap.bottom + 44;
        const on = !under && x > 66 && x < w - 66 && y > 112 && y < h - 60;
        p.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
        p.el.classList.toggle('is-off', !on);
      });
    }

    function setLanded(on) {
      if (on === landed) return;
      landed = on;
      o.onLanded(on);
    }

    function draw() {
      const d = v.duration || (meta && meta.seconds) || 1;
      const i = frame();
      o.onFrame(Math.min(1, v.currentTime / d), meta ? meta[shape].caps[i] : 0);
      placePins(i);
      if (v.currentTime >= d - 0.45) setLanded(true);
    }

    function loop() {
      cancelAnimationFrame(raf);
      (function tick() {
        draw();
        if (!v.paused && !v.ended) raf = requestAnimationFrame(tick);
      })();
    }

    function play() {
      if (failed || landed || !v.getAttribute('src')) return;
      const p = v.play();
      // Low-power mode can refuse even a muted film; then the guest taps to play.
      if (p && p.catch) p.catch(function (e) { if (e && e.name === 'NotAllowedError') o.onBlocked(); });
    }

    v.muted = true;
    v.playsInline = true;
    v.addEventListener('loadeddata', function () { o.onReady(); draw(); }, { once: true });
    v.addEventListener('play', loop);
    v.addEventListener('seeked', draw);
    v.addEventListener('ended', function () { setLanded(true); draw(); });
    v.addEventListener('error', function () {
      if (!v.getAttribute('src')) return;
      failed = true;
      o.onStatic('failed');
    });

    const near = new IntersectionObserver(function (entries) {
      if (!entries.some(function (e) { return e.isIntersecting; })) return;
      near.disconnect();
      source(0);
      fetch(DIR + 'flight.json')
        .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error(String(r.status))); })
        .then(function (m) { meta = m; addPins(); draw(); })
        .catch(function () { /* the film still plays, without labels */ });
    }, { rootMargin: '150% 0px 150% 0px' });
    near.observe(o.stage);

    // Rolls when most of it is on screen, pauses when scrolled away, and
    // carries on from there when the guest comes back.
    // Several changes can arrive at once; only the newest is true now.
    const seen = new IntersectionObserver(function (entries) {
      visible = entries[entries.length - 1].intersectionRatio >= 0.55;
      if (visible) play(); else v.pause();
    }, { threshold: [0, 0.55, 1] });
    seen.observe(o.stage);

    let resizing = 0;
    window.addEventListener('resize', function () {
      clearTimeout(resizing);
      resizing = setTimeout(function () {
        if (!shape) return;
        if (pick() !== shape) {
          source(v.currentTime);
        }
        draw();
      }, 200);
    });

    return {
      relabel: function () {
        pins.forEach(function (p) { p.el.querySelector('span').textContent = o.label(p.lm); });
      },
      replay: function () {
        setLanded(false);
        v.currentTime = 0;
        const p = v.play();
        if (p && p.catch) p.catch(function () {});
      }
    };
  }

  W.flyin = { mount: mount, cameraAt: cameraAt, SIZE: SIZE };
})(window.W);
