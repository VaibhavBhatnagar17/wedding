/* Ornamental SVG, generated so it scales cleanly and stays editable.
   Everything returns an SVG markup string. */
window.W = window.W || {};

(function (W) {
  'use strict';

  /* ---------- jaali (lattice screen) ---------- */

  function jaaliPattern(id, stroke, size) {
    const s = size || 26;
    return '<defs><pattern id="' + id + '" width="' + s + '" height="' + s +
      '" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<rect width="' + s + '" height="' + s + '" fill="none"/>' +
      '<circle cx="' + (s / 2) + '" cy="' + (s / 2) + '" r="' + (s * .30) +
        '" fill="none" stroke="' + stroke + '" stroke-width="1"/>' +
      '<path d="M0 ' + (s / 2) + ' H' + s + ' M' + (s / 2) + ' 0 V' + s +
        '" stroke="' + stroke + '" stroke-width="1"/>' +
      '<circle cx="0" cy="0" r="' + (s * .16) + '" fill="none" stroke="' + stroke + '" stroke-width="1"/>' +
      '<circle cx="' + s + '" cy="0" r="' + (s * .16) + '" fill="none" stroke="' + stroke + '" stroke-width="1"/>' +
      '<circle cx="0" cy="' + s + '" r="' + (s * .16) + '" fill="none" stroke="' + stroke + '" stroke-width="1"/>' +
      '<circle cx="' + s + '" cy="' + s + '" r="' + (s * .16) + '" fill="none" stroke="' + stroke + '" stroke-width="1"/>' +
      '</pattern></defs>';
  }

  /* ---------- mandala / rangoli ---------- */

  function mandala(petals, r, stroke) {
    const p = petals || 16, R = r || 100;
    let out = '';
    for (let i = 0; i < p; i++) {
      const a = (360 / p) * i;
      out += '<g transform="rotate(' + a + ' 0 0)">' +
        '<path d="M0 ' + (-R * .34) + ' C ' + (R * .17) + ' ' + (-R * .55) + ', ' +
          (R * .17) + ' ' + (-R * .86) + ', 0 ' + (-R) + ' C ' + (-R * .17) + ' ' + (-R * .86) + ', ' +
          (-R * .17) + ' ' + (-R * .55) + ', 0 ' + (-R * .34) + ' Z" ' +
        'fill="none" stroke="' + stroke + '" stroke-width="1.1"/>' +
        '<circle cx="0" cy="' + (-R * .74) + '" r="' + (R * .045) + '" fill="' + stroke + '" opacity=".55"/>' +
        '</g>';
    }
    out += '<circle r="' + (R * .30) + '" fill="none" stroke="' + stroke + '" stroke-width="1.1"/>';
    out += '<circle r="' + (R * .21) + '" fill="none" stroke="' + stroke + '" stroke-width=".8"/>';
    for (let i = 0; i < p / 2; i++) {
      const a = (360 / (p / 2)) * i;
      out += '<g transform="rotate(' + a + ' 0 0)"><path d="M0 ' + (-R * .21) + ' L' + (R * .06) + ' ' +
        (-R * .05) + ' L' + (-R * .06) + ' ' + (-R * .05) + ' Z" fill="' + stroke + '" opacity=".4"/></g>';
    }
    return out;
  }

  function mandalaSvg(cls, petals, stroke) {
    return '<svg class="' + (cls || '') + '" viewBox="-110 -110 220 220" aria-hidden="true">' +
      '<g>' + mandala(petals || 18, 100, stroke || 'currentColor') + '</g></svg>';
  }

  /* ---------- peacock feather ---------- */

  function peacockFeather(stroke, fill) {
    const st = stroke || 'currentColor';
    let barbs = '';
    for (let i = 0; i < 22; i++) {
      const t = i / 21, y = 40 + t * 118;
      const w = 20 * Math.sin(Math.PI * (0.18 + t * 0.72));
      barbs += '<path d="M0 ' + y.toFixed(1) + ' L' + (-w).toFixed(1) + ' ' + (y + 11).toFixed(1) +
        '" stroke="' + st + '" stroke-width=".7" opacity=".5"/>' +
        '<path d="M0 ' + y.toFixed(1) + ' L' + w.toFixed(1) + ' ' + (y + 11).toFixed(1) +
        '" stroke="' + st + '" stroke-width=".7" opacity=".5"/>';
    }
    return '<svg viewBox="-34 0 68 176" aria-hidden="true" fill="none">' +
      '<path d="M0 40 V168" stroke="' + st + '" stroke-width="1.2"/>' + barbs +
      '<ellipse cx="0" cy="26" rx="24" ry="30" stroke="' + st + '" stroke-width="1.2"/>' +
      '<ellipse cx="0" cy="27" rx="15" ry="19" stroke="' + st + '" stroke-width="1"/>' +
      '<ellipse cx="0" cy="28" rx="8" ry="11" fill="' + (fill || st) + '" opacity=".8"/>' +
      '</svg>';
  }

  /* ---------- lotus / kalash finial ---------- */

  function kalash(stroke) {
    const st = stroke || 'currentColor';
    return '<svg viewBox="-30 -6 60 62" aria-hidden="true" fill="none" stroke="' + st + '">' +
      '<path d="M0 -4 L0 6" stroke-width="1.4"/>' +
      '<path d="M-9 6 Q0 -2 9 6" stroke-width="1.4"/>' +
      '<path d="M-13 10 Q0 4 13 10" stroke-width="1.2"/>' +
      '<path d="M-16 14 C-22 26 -18 44 0 52 C18 44 22 26 16 14 Z" stroke-width="1.4"/>' +
      '<path d="M-9 22 Q0 30 9 22" stroke-width="1"/>' +
      '<circle cx="0" cy="-8" r="3" fill="' + st + '" stroke="none"/>' +
      '</svg>';
  }

  /* ---------- paisley ---------- */

  function paisley(stroke) {
    const st = stroke || 'currentColor';
    return '<svg viewBox="0 0 100 130" aria-hidden="true" fill="none" stroke="' + st + '">' +
      '<path d="M50 6 C86 26 92 74 62 104 C44 122 20 118 12 100 C4 82 16 64 34 62 C50 60 58 72 54 84" stroke-width="1.4"/>' +
      '<path d="M50 20 C76 36 80 72 58 94 C46 106 30 104 24 92 C19 81 27 70 39 70" stroke-width="1"/>' +
      '<circle cx="47" cy="82" r="4" fill="' + st + '" stroke="none" opacity=".6"/>' +
      '<circle cx="58" cy="46" r="3" fill="' + st + '" stroke="none" opacity=".45"/>' +
      '<circle cx="66" cy="64" r="2.4" fill="' + st + '" stroke="none" opacity=".45"/>' +
      '</svg>';
  }

  /* ---------- marigold garland strand (phool ki latkan) ---------- */

  function garlandStrand(len, seed) {
    let out = '';
    let y = 0;
    const rnd = mulberry(seed || 1);
    for (let i = 0; i < len; i++) {
      const r = 5.4 + rnd() * 2.4;
      const warm = rnd();
      const fill = warm > .62 ? 'url(#mg-o)' : (warm > .3 ? 'url(#mg-y)' : 'url(#mg-r)');
      out += '<circle cx="0" cy="' + y.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="' + fill + '"/>';
      y += r * 1.68;
    }
    // a small leaf and a bead at the tip
    out += '<path d="M0 ' + y.toFixed(1) + ' q7 9 0 20 q-7 -11 0 -20z" fill="#2f6b3f" opacity=".85"/>';
    out += '<circle cx="0" cy="' + (y + 26).toFixed(1) + '" r="3" fill="#c9a227"/>';
    return { markup: out, height: y + 32 };
  }

  function marigoldDefs() {
    return '<defs>' +
      '<radialGradient id="mg-y" cx="35%" cy="30%"><stop offset="0" stop-color="#ffe08a"/>' +
        '<stop offset="60%" stop-color="#eda42b"/><stop offset="100%" stop-color="#b9740c"/></radialGradient>' +
      '<radialGradient id="mg-o" cx="35%" cy="30%"><stop offset="0" stop-color="#ffc46b"/>' +
        '<stop offset="60%" stop-color="#e07a18"/><stop offset="100%" stop-color="#a24f07"/></radialGradient>' +
      '<radialGradient id="mg-r" cx="35%" cy="30%"><stop offset="0" stop-color="#ffb0a0"/>' +
        '<stop offset="60%" stop-color="#d4614f"/><stop offset="100%" stop-color="#94301f"/></radialGradient>' +
      '</defs>';
  }

  /* Deterministic PRNG so the garland looks the same on every reload. */
  function mulberry(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* A row of hanging strands.
     Each strand is its own SVG positioned with CSS percentages — one stretched
     SVG would squash the flowers into ovals and overlap them. */
  function garlandRow(count, seed) {
    const rnd = mulberry(seed || 7);
    let out = '';
    for (let i = 0; i < count; i++) {
      const len = 3 + Math.floor(rnd() * 10);
      const st = garlandStrand(len, (seed || 7) + i * 13);
      const left = (100 / count) * (i + 0.5);
      // 22 user units wide keeps flowers round at any rendered width.
      out += '<span class="strand" style="left:' + left.toFixed(2) + '%;--i:' + i +
        ';--sway:' + (2.8 + rnd() * 2.4).toFixed(2) + 's">' +
        '<svg viewBox="-11 -2 22 ' + (st.height + 4).toFixed(0) + '" width="22" ' +
        'height="' + (st.height + 4).toFixed(0) + '" aria-hidden="true">' +
        marigoldDefs() + st.markup + '</svg></span>';
    }
    return out;
  }

  /* ---------- ornate door panel (jharokha) ---------- */

  /* side: 'l' | 'r' — the hinge is on the outer edge. */
  function doorPanel(side, idSuffix) {
    const pid = 'jaali-' + idSuffix;
    const g = '#d8b45a';
    // Cusped (multifoil) Mughal arch built from a series of small arcs.
    const archTop = cuspArch(20, 150, 260, 120, 9, 280);
    return '' +
      '<svg class="door__svg" viewBox="0 0 300 640" preserveAspectRatio="none" aria-hidden="true">' +
      jaaliPattern(pid, 'rgba(216,180,90,.5)', 24) +
      '<defs>' +
        '<linearGradient id="dg-' + idSuffix + '" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="#0e3d33"/><stop offset=".45" stop-color="#14523f"/>' +
          '<stop offset=".75" stop-color="#0b3129"/><stop offset="1" stop-color="#103f34"/>' +
        '</linearGradient>' +
        '<linearGradient id="eg-' + idSuffix + '" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="rgba(255,246,216,.0)"/>' +
          '<stop offset=".5" stop-color="rgba(255,246,216,.5)"/>' +
          '<stop offset="1" stop-color="rgba(255,246,216,.0)"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<rect width="300" height="640" fill="url(#dg-' + idSuffix + ')"/>' +
      /* outer gold border */
      '<rect x="8" y="8" width="284" height="624" fill="none" stroke="' + g + '" stroke-width="2" opacity=".9"/>' +
      '<rect x="15" y="15" width="270" height="610" fill="none" stroke="' + g + '" stroke-width=".8" opacity=".55"/>' +
      /* arched niche filled with jaali */
      '<path d="' + archTop + '" fill="url(#' + pid + ')" stroke="' + g + '" stroke-width="1.6"/>' +
      /* spandrel florals */
      '<g fill="none" stroke="' + g + '" stroke-width="1" opacity=".7">' +
        '<path d="M28 150 q16 -22 40 -12 M28 150 q4 -26 26 -34"/>' +
        '<path d="M272 150 q-16 -22 -40 -12 M272 150 q-4 -26 -26 -34"/>' +
      '</g>' +
      /* floret bands along the top and bottom rails */
      '<g fill="' + g + '" opacity=".75">' + floretBand(24, 276, 30, 7) + floretBand(24, 276, 616, 7) + '</g>' +
      /* lower panel with a mandala medallion */
      '<rect x="40" y="430" width="220" height="176" fill="none" stroke="' + g + '" stroke-width="1.2" opacity=".8"/>' +
      '<rect x="47" y="437" width="206" height="162" fill="none" stroke="' + g + '" stroke-width=".6" opacity=".45"/>' +
      '<g transform="translate(150 518) scale(.72)" opacity=".8">' + mandala(16, 100, g) + '</g>' +
      /* paisley pair flanking the medallion */
      '<g transform="translate(58 452) scale(.42)" opacity=".5">' + paisleyPath(g) + '</g>' +
      '<g transform="translate(242 452) scale(-.42 .42)" opacity=".5">' + paisleyPath(g) + '</g>' +
      /* vertical inner edge highlight where the two doors meet */
      (side === 'l'
        ? '<rect x="292" y="0" width="8" height="640" fill="url(#eg-' + idSuffix + ')"/>'
        : '<rect x="0" y="0" width="8" height="640" fill="url(#eg-' + idSuffix + ')"/>') +
      '</svg>';
  }

  /* A row of tiny four-petal florets, used along door rails. */
  function floretBand(x1, x2, y, n) {
    let out = '';
    for (let i = 0; i < n; i++) {
      const x = x1 + ((x2 - x1) / (n - 1)) * i;
      out += '<g transform="translate(' + x.toFixed(1) + ' ' + y + ')">' +
        '<circle r="1.7"/>' +
        '<circle cx="0" cy="-4" r="1.5" opacity=".8"/><circle cx="0" cy="4" r="1.5" opacity=".8"/>' +
        '<circle cx="-4" cy="0" r="1.5" opacity=".8"/><circle cx="4" cy="0" r="1.5" opacity=".8"/>' +
        '</g>';
    }
    return out;
  }

  function paisleyPath(stroke) {
    return '<g fill="none" stroke="' + stroke + '" stroke-width="1.3">' +
      '<path d="M50 6 C86 26 92 74 62 104 C44 122 20 118 12 100 C4 82 16 64 34 62 C50 60 58 72 54 84"/>' +
      '<path d="M50 20 C76 36 80 72 58 94 C46 106 30 104 24 92 C19 81 27 70 39 70"/>' +
      '<circle cx="47" cy="82" r="3.4" fill="' + stroke + '" stroke="none" opacity=".6"/>' +
      '<circle cx="58" cy="46" r="2.6" fill="' + stroke + '" stroke="none" opacity=".5"/>' +
      '</g>';
  }

  /* Pointed Mughal arch with a scalloped (multifoil) edge.
     Springs from (x, yTop), rises `h` to a point at the centre, and drops to
     `yTop + drop` so the shape can be filled as a niche. */
  function cuspArch(x, yTop, w, h, cusps, drop) {
    const left = x, right = x + w, midX = x + w / 2;
    const a = w / 2, b = h;
    const dy = drop === undefined ? 300 : drop;

    // Pointed profile: exponent < 1 leaves a non-zero slope at the apex, so the
    // two mirrored halves meet in a point rather than a dome.
    function pt(t) {
      return { x: left + a * t, y: yTop - b * Math.pow(t, 0.55) };
    }

    let d = 'M' + left + ' ' + (yTop + dy) + ' L' + left + ' ' + yTop + ' ';
    const n = Math.max(3, cusps || 9);

    // Left half, climbing to the apex. Each segment bulges outward into a cusp.
    for (let i = 0; i < n; i++) {
      const p0 = pt(i / n), p1 = pt((i + 1) / n);
      const mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2;
      const nx = -(p1.y - p0.y), ny = (p1.x - p0.x);
      const len = Math.hypot(nx, ny) || 1;
      const bulge = 4.5;
      d += 'Q' + (mx - nx / len * bulge).toFixed(1) + ' ' + (my - ny / len * bulge).toFixed(1) +
        ' ' + p1.x.toFixed(1) + ' ' + p1.y.toFixed(1) + ' ';
    }
    // Right half, mirrored about midX, descending back to the springer.
    for (let i = n; i > 0; i--) {
      const p0 = pt(i / n), p1 = pt((i - 1) / n);
      const m0 = { x: 2 * midX - p0.x, y: p0.y };
      const m1 = { x: 2 * midX - p1.x, y: p1.y };
      const mx = (m0.x + m1.x) / 2, my = (m0.y + m1.y) / 2;
      const nx = (m1.y - m0.y), ny = -(m1.x - m0.x);
      const len = Math.hypot(nx, ny) || 1;
      const bulge = 4.5;
      d += 'Q' + (mx - nx / len * bulge).toFixed(1) + ' ' + (my - ny / len * bulge).toFixed(1) +
        ' ' + m1.x.toFixed(1) + ' ' + m1.y.toFixed(1) + ' ';
    }
    d += 'L' + right + ' ' + (yTop + dy) + ' Z';
    return d;
  }

  /* ---------- decorative arch frame (for content blocks) ---------- */

  function archFrame(stroke) {
    const st = stroke || 'currentColor';
    return '<svg class="arch-frame" viewBox="0 0 400 520" preserveAspectRatio="none" aria-hidden="true" fill="none">' +
      '<path d="M14 516 V190 C14 90 100 14 200 14 C300 14 386 90 386 190 V516" stroke="' + st + '" stroke-width="1.6"/>' +
      '<path d="M26 516 V192 C26 98 106 26 200 26 C294 26 374 98 374 192 V516" stroke="' + st + '" stroke-width=".7" opacity=".6"/>' +
      '</svg>';
  }

  /* ---------- corner flourish ---------- */

  function corner(stroke) {
    const st = stroke || 'currentColor';
    return '<svg viewBox="0 0 90 90" aria-hidden="true" fill="none" stroke="' + st + '">' +
      '<path d="M2 2 H34 M2 2 V34" stroke-width="1.6"/>' +
      '<path d="M2 44 C22 44 44 22 44 2" stroke-width="1"/>' +
      '<path d="M10 62 C34 58 58 34 62 10" stroke-width=".8" opacity=".7"/>' +
      '<circle cx="52" cy="52" r="3" fill="' + st + '" stroke="none" opacity=".6"/>' +
      '<path d="M64 26 q14 6 12 22 q-2 16 -18 18" stroke-width=".8" opacity=".5"/>' +
      '</svg>';
  }

  W.motifs = {
    jaaliPattern: jaaliPattern,
    mandala: mandala, mandalaSvg: mandalaSvg,
    peacockFeather: peacockFeather,
    kalash: kalash,
    paisley: paisley,
    garlandRow: garlandRow, garlandStrand: garlandStrand, marigoldDefs: marigoldDefs,
    doorPanel: doorPanel, cuspArch: cuspArch,
    archFrame: archFrame,
    corner: corner
  };
})(window.W);
