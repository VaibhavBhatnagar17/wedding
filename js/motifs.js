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
    out += '<path d="M0 ' + y.toFixed(1) + ' q7 9 0 20 q-7 -11 0 -20z" fill="#2f6b3f" opacity=".8"/>';
    out += '<circle cx="0" cy="' + (y + 26).toFixed(1) + '" r="3" fill="#c9a227"/>';
    return { markup: out, height: y + 32 };
  }

  function marigoldDefs() {
    return '<defs>' +
      '<radialGradient id="mg-y" cx="35%" cy="30%"><stop offset="0" stop-color="#ffe08a"/>' +
        '<stop offset="60%" stop-color="#eda42b"/><stop offset="100%" stop-color="#b9740c"/></radialGradient>' +
      '<radialGradient id="mg-o" cx="35%" cy="30%"><stop offset="0" stop-color="#ffc46b"/>' +
        '<stop offset="60%" stop-color="#e07a18"/><stop offset="100%" stop-color="#a24f07"/></radialGradient>' +
      '<radialGradient id="mg-r" cx="35%" cy="30%"><stop offset="0" stop-color="#ffa8a0"/>' +
        '<stop offset="60%" stop-color="#c62f34"/><stop offset="100%" stop-color="#8a1519"/></radialGradient>' +
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

  /* side: 'l' | 'r' — the hinge is on the outer edge.

     The carving is split into two square-ish SVGs that each keep their aspect
     ratio (`meet`): the arch anchors to the top of the door, the medallion to
     the bottom. Everything that has to follow the door's edges instead — the
     wood gradient, the tiled jaali, the gold frame — is drawn in CSS. One
     full-door SVG with preserveAspectRatio="none" was the old approach, and it
     squashed the arch and turned every lattice circle into an oval whenever the
     window was wider or shorter than the artwork. */
  function doorPanel(side, idSuffix) {
    const pid = 'jaali-' + idSuffix;
    const g = '#d8b45a';
    // Springs at y=252, rises 158 to an apex at y=94, niche floor at y=282.
    const archTop = cuspArch(28, 252, 244, 158, 9, 30);
    const archInner = cuspArch(40, 244, 220, 138, 9, 22);

    const arch =
      '<svg class="door__arch" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
      jaaliPattern(pid, 'rgba(216,180,90,.6)', 20) +
      '<path d="' + archTop + '" fill="url(#' + pid + ')" stroke="' + g + '" stroke-width="2"/>' +
      '<path d="' + archInner + '" fill="none" stroke="' + g + '" stroke-width=".7" opacity=".5"/>' +
      /* kalash finial resting on the apex */
      '<g transform="translate(150 34) scale(.85)" opacity=".85">' +
        '<path d="M0 -6 V4 M-8 4 Q0 -3 8 4 M-12 8 Q0 2 12 8 M-14 12 C-19 23 -16 39 0 46 C16 39 19 23 14 12 Z" ' +
        'fill="none" stroke="' + g + '" stroke-width="1.4"/>' +
        '<circle cx="0" cy="-10" r="2.6" fill="' + g + '"/>' +
      '</g>' +
      /* spandrel florals tucked into the corners above the springers */
      '<g fill="none" stroke="' + g + '" stroke-width="1" opacity=".65">' +
        '<path d="M34 248 q18 -24 44 -13 M34 248 q4 -28 28 -37"/>' +
        '<path d="M266 248 q-18 -24 -44 -13 M266 248 q-4 -28 -28 -37"/>' +
      '</g>' +
      /* rail of florets under the arch */
      '<g fill="' + g + '" opacity=".7">' + floretBand(34, 266, 292, 9) + '</g>' +
      '</svg>';

    const medal =
      '<svg class="door__medal" viewBox="0 0 300 200" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' +
      '<rect x="42" y="10" width="216" height="180" rx="6" fill="none" stroke="' + g + '" stroke-width="1.3" opacity=".8"/>' +
      '<rect x="49" y="17" width="202" height="166" rx="4" fill="none" stroke="' + g + '" stroke-width=".6" opacity=".45"/>' +
      '<g transform="translate(150 100) scale(.78)" opacity=".85">' + mandala(16, 100, g) + '</g>' +
      /* paisley pair flanking the medallion */
      '<g transform="translate(6 66) scale(.3)" opacity=".45">' + paisleyPath(g) + '</g>' +
      '<g transform="translate(294 66) scale(-.3 .3)" opacity=".45">' + paisleyPath(g) + '</g>' +
      '</svg>';

    return '<span class="door__jaali" aria-hidden="true"></span>' + arch + medal +
      '<span class="door__edge door__edge--' + side + '" aria-hidden="true"></span>';
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

  /* Cusped (multifoil) arch with the real two-centred geometry, so it looks
     built rather than folded: each half is a circular arc whose centre sits on
     the springing line past the middle, which is what gives a Rajput arch its
     round shoulders and gentle point. Scalloped lobes are then hung along that
     arc, bulging into the opening.

     Springs from (x, yTop), rises `h` to the apex, and drops to `yTop + drop`
     so the whole shape can be filled as a niche. Keep h between about 1.0 and
     1.3 × half-width — go higher and it turns into a sharp lancet. */
  function cuspArch(x, yTop, w, h, cusps, drop) {
    const left = x, right = x + w, midX = x + w / 2;
    const a = w / 2;
    const dy = drop === undefined ? 300 : drop;

    // Centre offset for an arc through both the springer and the apex.
    const u = (a * a + h * h) / (2 * a);
    const cx = left + u, R = u;

    // Sweep from the left springer (180°) up to the apex, in SVG coords.
    const phi0 = Math.PI;
    const phi1 = Math.atan2(-h, a - u) + 2 * Math.PI;

    function at(phi) {
      return { x: cx + R * Math.cos(phi), y: yTop + R * Math.sin(phi) };
    }

    const n = Math.max(3, cusps || 9);
    // Lobes dip toward the centre of the arc. Half the dip, since a quadratic
    // reaches half its control offset.
    const lobe = Math.max(4, R * 0.05);

    function half(fromApex) {
      let out = '';
      for (let i = 0; i < n; i++) {
        const t0 = fromApex ? 1 - i / n : i / n;
        const t1 = fromApex ? 1 - (i + 1) / n : (i + 1) / n;
        const phiA = phi0 + (phi1 - phi0) * t0;
        const phiB = phi0 + (phi1 - phi0) * t1;
        const phiM = (phiA + phiB) / 2;
        const p1 = at(phiB);
        const ctrl = {
          x: cx + (R - 2 * lobe) * Math.cos(phiM),
          y: yTop + (R - 2 * lobe) * Math.sin(phiM)
        };
        const flip = function (p) { return fromApex ? { x: 2 * midX - p.x, y: p.y } : p; };
        const c = flip(ctrl), e = flip(p1);
        out += 'Q' + c.x.toFixed(1) + ' ' + c.y.toFixed(1) + ' ' +
          e.x.toFixed(1) + ' ' + e.y.toFixed(1) + ' ';
      }
      return out;
    }

    return 'M' + left + ' ' + (yTop + dy) + ' L' + left + ' ' + yTop + ' ' +
      half(false) + half(true) +
      'L' + right + ' ' + (yTop + dy) + ' Z';
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
