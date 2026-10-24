/* The drone flight over Udaipur to the venue.

   A real 3D map — satellite imagery draped over elevation data, so the
   Aravallis stand up — with the camera tied to scroll position. The library
   is only fetched when the section comes near, and anyone who has asked for
   reduced motion, is saving data, or has no WebGL gets the painting instead:
   the flight is decoration, never the only way to find the venue.

   Imagery is Esri World Imagery and terrain is the Mapzen/AWS Terrarium set;
   both are keyless, CORS-enabled and credited on screen. */
window.W = window.W || {};

(function (W) {
  'use strict';

  const VERSION = '5.24.0';
  const BASE = 'https://unpkg.com/maplibre-gl@' + VERSION + '/dist/';

  let loading = null;
  function load() {
    if (window.maplibregl) return Promise.resolve(window.maplibregl);
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = BASE + 'maplibre-gl.css';
      document.head.appendChild(css);
      const s = document.createElement('script');
      s.src = BASE + 'maplibre-gl.js';
      s.async = true;
      s.onload = function () { window.maplibregl ? resolve(window.maplibregl) : reject(new Error('no maplibregl')); };
      s.onerror = function () { reject(new Error('maplibre failed to load')); };
      document.head.appendChild(s);
    });
    return loading;
  }

  function webgl() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { return false; }
  }

  function smooth(t) { return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpAngle(a, b, t) { const d = ((b - a + 540) % 360) - 180; return a + d * t; }

  /* Camera at progress p (0..1) through the waypoints. Each leg eases in and
     out so the camera seems to hover over each landmark before moving on; past
     the last waypoint it keeps a slow orbit over the hotel. */
  function cameraAt(flight, p) {
    const last = flight[flight.length - 1];
    if (p >= last.at) {
      const t = (p - last.at) / Math.max(0.0001, 1 - last.at);
      return { center: last.center.slice(), zoom: last.zoom + t * 0.25, pitch: last.pitch,
        bearing: last.bearing + t * 26, leg: flight.length - 1 };
    }
    for (let i = 0; i < flight.length - 1; i++) {
      const A = flight[i], B = flight[i + 1];
      if (p <= B.at) {
        const t = smooth((p - A.at) / (B.at - A.at));
        return {
          center: [lerp(A.center[0], B.center[0], t), lerp(A.center[1], B.center[1], t)],
          zoom: lerp(A.zoom, B.zoom, t),
          pitch: lerp(A.pitch, B.pitch, t),
          bearing: lerpAngle(A.bearing, B.bearing, t),
          leg: t < 0.5 ? i : i + 1
        };
      }
    }
    return { center: last.center.slice(), zoom: last.zoom, pitch: last.pitch, bearing: last.bearing, leg: flight.length - 1 };
  }

  function style() {
    return {
      version: 8,
      sources: {
        sat: {
          type: 'raster', tileSize: 256, maxzoom: 18,
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
          attribution: 'Imagery © Esri, Maxar, Earthstar Geographics'
        },
        dem: {
          type: 'raster-dem', tileSize: 256, maxzoom: 14, encoding: 'terrarium',
          tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
          attribution: 'Terrain © Mapzen, AWS Open Data'
        }
      },
      layers: [
        { id: 'ground', type: 'background', paint: { 'background-color': '#2b0810' } },
        { id: 'sat', type: 'raster', source: 'sat', paint: {
          'raster-saturation': -0.06, 'raster-contrast': 0.06,
          'raster-brightness-max': 0.97, 'raster-fade-duration': 0 } }
      ],
      terrain: { source: 'dem', exaggeration: 1.6 },
      // A dusk sky with a marigold horizon, so the far hills dissolve into the
      // same palette as the rest of the page instead of a blank horizon.
      sky: {
        'sky-color': '#24102e', 'horizon-color': '#e9a04a', 'fog-color': '#d9a066',
        'sky-horizon-blend': 0.55, 'horizon-fog-blend': 0.7, 'fog-ground-blend': 0.35,
        'atmosphere-blend': 0.85
      }
    };
  }

  /* opts: track (tall scroll container), map (element), flight, landmarks,
     label(lm) -> text, avoid() -> rect pins must stay clear of,
     onProgress(p, cam), onStatic(reason), onReady() */
  function mount(opts) {
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = navigator.connection && navigator.connection.saveData;
    if (reduced || saveData || !webgl() || !('IntersectionObserver' in window)) {
      opts.onStatic(reduced ? 'reduced' : 'unsupported');
      return { relabel: function () {} };
    }

    let map = null, ready = false, raf = 0, lastP = -1;
    const pins = [];

    function progress() {
      const r = opts.track.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    }

    function update(force) {
      const p = progress();
      if (!force && Math.abs(p - lastP) < 0.0004) return;
      lastP = p;
      const cam = cameraAt(opts.flight, p);
      if (opts.onProgress) opts.onProgress(p, cam);
      if (ready) map.jumpTo({ center: cam.center, zoom: cam.zoom, pitch: cam.pitch, bearing: cam.bearing });
    }

    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; update(false); });
    }

    /* Pins are our own overlay, placed with map.project(), which accounts for
       the terrain. Library markers are projected at sea level and then marked
       "covered" by the hills, so on raised ground they float off their place. */
    function addPins() {
      const layer = document.createElement('div');
      layer.className = 'fly__pins';
      opts.map.appendChild(layer);
      (opts.landmarks || []).forEach(function (lm) {
        const elx = document.createElement('div');
        elx.className = 'fly__pin' + (lm.home ? ' fly__pin--home' : '');
        elx.innerHTML = '<i></i><span></span>';
        elx.querySelector('span').textContent = opts.label(lm);
        layer.appendChild(elx);
        pins.push({ lm: lm, el: elx });
      });
      map.on('render', placePins);
      placePins();
    }

    function placePins() {
      const w = opts.map.clientWidth, h = opts.map.clientHeight;
      const m = opts.map.getBoundingClientRect();
      const cap = opts.avoid ? opts.avoid() : null;
      pins.forEach(function (p) {
        const pt = map.project([p.lm.lon, p.lm.lat]);
        // A label that drifts into the caption shows through its line gaps, and
        // one near an edge is cut off or slides under the nav, so both give way.
        // The label sits about 40px above its dot and is up to 130px wide.
        const x = m.left + pt.x, y = m.top + pt.y;
        const under = !!cap && x > cap.left - 70 && x < cap.right + 70 && y > cap.top && y < cap.bottom + 44;
        const on = !under && pt.x > 66 && pt.x < w - 66 && pt.y > 112 && pt.y < h - 60;
        p.el.style.transform = 'translate(' + pt.x.toFixed(1) + 'px,' + pt.y.toFixed(1) + 'px)';
        p.el.classList.toggle('is-off', !on);
      });
    }

    function start() {
      load().then(function (ml) {
        const cam = cameraAt(opts.flight, progress());
        map = new ml.Map({
          container: opts.map,
          style: style(),
          center: cam.center, zoom: cam.zoom, pitch: cam.pitch, bearing: cam.bearing,
          maxPitch: 78,
          interactive: false,
          attributionControl: { compact: true },
          pixelRatio: Math.min(window.devicePixelRatio || 1, 1.75),
          fadeDuration: 0
        });
        map.on('load', function () {
          ready = true;
          addPins();
          update(true);
          if (opts.onReady) opts.onReady();
        });
        // A failed tile is a hole in the ground, not a reason to tear down.
        map.on('error', function () {});
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', function () { if (map) map.resize(); onScroll(); });
        update(true);
      }).catch(function () { opts.onStatic('failed'); });
    }

    const io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { io.disconnect(); start(); }
    }, { rootMargin: '120% 0px 120% 0px' });
    io.observe(opts.track);

    // Captions follow scroll even before the map arrives.
    window.addEventListener('scroll', function () { if (!ready) onScroll(); }, { passive: true });

    return {
      relabel: function () {
        pins.forEach(function (p) { p.el.querySelector('span').textContent = opts.label(p.lm); });
      }
    };
  }

  W.flyin = { mount: mount, cameraAt: cameraAt, VERSION: VERSION };
})(window.W);
