/* Motion engine. Everything degrades to "visible and static" if JS is slow,
   the API is missing, or the guest has asked for reduced motion. */
window.W = window.W || {};

(function (W) {
  'use strict';

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- scroll reveals ---------------- */

  /* Elements with [data-reveal] start hidden (only once .js-anim is set) and
     animate in when scrolled to. data-reveal="up|scale|arch|left|right",
     data-delay="120" in ms, data-stagger on a parent to cascade children. */
  function initReveal(root) {
    const scope = root || document;
    const items = Array.prototype.slice.call(scope.querySelectorAll('[data-reveal]'));
    if (!items.length) return;

    function show(el) { el.classList.add('is-revealed'); }

    if (reduced || !('IntersectionObserver' in window)) { items.forEach(show); return; }
    document.documentElement.classList.add('js-anim');

    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        const el = en.target;
        const d = Number(el.getAttribute('data-delay')) || 0;
        if (d) setTimeout(function () { show(el); }, d);
        else show(el);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

    items.forEach(function (el) { io.observe(el); });

    // Nothing may ever stay invisible, whatever the observer does.
    setTimeout(function () { items.forEach(show); }, 2600);
  }

  /* Give each child of [data-stagger] an increasing delay. */
  function applyStagger(root) {
    const scope = root || document;
    Array.prototype.slice.call(scope.querySelectorAll('[data-stagger]')).forEach(function (parent) {
      const step = Number(parent.getAttribute('data-stagger')) || 80;
      Array.prototype.slice.call(parent.children).forEach(function (child, i) {
        if (child.hasAttribute('data-reveal') && !child.hasAttribute('data-delay')) {
          child.setAttribute('data-delay', String(i * step));
        }
      });
    });
  }

  /* ---------------- split text into animatable words ---------------- */

  function splitWords(el) {
    if (!el || el.dataset.split === 'done') return;
    const text = el.textContent.trim();
    el.textContent = '';
    text.split(/\s+/).forEach(function (word, i) {
      const outer = document.createElement('span');
      outer.className = 'w-out';
      const inner = document.createElement('span');
      inner.className = 'w-in';
      inner.style.setProperty('--wi', String(i));
      inner.textContent = word;
      outer.appendChild(inner);
      el.appendChild(outer);
      el.appendChild(document.createTextNode(' '));
    });
    el.dataset.split = 'done';
  }

  /* Per-character splitting, for the display face only. Cinzel has separated
     letterforms so it survives being cut up; the script face does not, and gets
     an ink wipe instead (see .names__n in invite.css). */
  function splitChars(el) {
    if (!el || el.dataset.splitDone === 'chars') return;
    const text = el.textContent.trim();
    /* A row of one-character spans reads as gibberish aloud, so the real string
       goes on as a label and the pieces are taken out of the tree. */
    el.setAttribute('aria-label', text);
    el.textContent = '';
    let i = 0;
    text.split(/(\s+)/).forEach(function (chunk) {
      if (!chunk) return;
      if (/^\s+$/.test(chunk)) { el.appendChild(document.createTextNode(' ')); return; }
      const word = document.createElement('span');
      word.className = 'c-word';
      word.setAttribute('aria-hidden', 'true');
      chunk.split('').forEach(function (ch) {
        const outer = document.createElement('span');
        outer.className = 'c-out';
        const inner = document.createElement('span');
        inner.className = 'c-in';
        inner.style.setProperty('--ci', String(i++));
        inner.textContent = ch;
        outer.appendChild(inner);
        word.appendChild(outer);
      });
      el.appendChild(word);
    });
    el.dataset.splitDone = 'chars';
  }

  function initSplit(root) {
    Array.prototype.slice.call((root || document).querySelectorAll('[data-split]'))
      .forEach(function (el) {
        if (el.getAttribute('data-split') === 'chars') splitChars(el);
        else splitWords(el);
      });
  }

  /* ---------------- falling marigold petals ---------------- */

  function petals(canvas, opts) {
    if (!canvas || reduced) return { stop: function () {} };
    const o = Object.assign({ count: 26, speed: 1 }, opts || {});
    const ctx = canvas.getContext('2d');
    if (!ctx) return { stop: function () {} };

    const COLORS = ['#eda42b', '#e07a18', '#d4614f', '#ffc46b', '#c9a227'];
    let w = 0, h = 0, dpr = 1, raf = 0, running = true;
    const bits = [];

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function make(seedTop) {
      return {
        x: Math.random() * w,
        y: seedTop ? -20 - Math.random() * h : Math.random() * h,
        r: 4 + Math.random() * 6,
        vy: (0.28 + Math.random() * 0.55) * o.speed,
        drift: (Math.random() - 0.5) * 0.5,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.02,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.008 + Math.random() * 0.016,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        alpha: 0.35 + Math.random() * 0.45
      };
    }

    function reset() {
      bits.length = 0;
      const n = Math.round(o.count * Math.min(1.4, Math.max(0.5, w / 1100)));
      for (let i = 0; i < n; i++) bits.push(make(false));
    }

    function petalPath(r) {
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.bezierCurveTo(r * 0.9, -r * 0.5, r * 0.7, r * 0.7, 0, r);
      ctx.bezierCurveTo(-r * 0.7, r * 0.7, -r * 0.9, -r * 0.5, 0, -r);
      ctx.closePath();
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < bits.length; i++) {
        const p = bits[i];
        p.sway += p.swaySpeed;
        p.y += p.vy;
        p.x += p.drift + Math.sin(p.sway) * 0.6;
        p.rot += p.vr;
        if (p.y - p.r > h) { bits[i] = make(true); bits[i].y = -20; continue; }
        if (p.x < -30) p.x = w + 20;
        if (p.x > w + 30) p.x = -20;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        petalPath(p.r);
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }

    resize(); reset(); frame();

    const onResize = debounce(function () { resize(); reset(); }, 200);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { running = false; cancelAnimationFrame(raf); }
      else if (!running) { running = true; frame(); }
    });

    return {
      stop: function () {
        running = false; cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
      }
    };
  }

  /* ---------------- 3D tilt on hover ---------------- */

  function tilt(el, max) {
    if (reduced) return;
    const m = max || 8;
    let rect = null;
    function enter() { rect = el.getBoundingClientRect(); el.classList.add('is-tilting'); }
    function move(e) {
      if (!rect) rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = 'perspective(900px) rotateY(' + (px * m).toFixed(2) +
        'deg) rotateX(' + (-py * m).toFixed(2) + 'deg) translateZ(0)';
      el.style.setProperty('--gx', ((px + 0.5) * 100).toFixed(1) + '%');
      el.style.setProperty('--gy', ((py + 0.5) * 100).toFixed(1) + '%');
    }
    function leave() {
      el.classList.remove('is-tilting');
      el.style.transform = '';
      rect = null;
    }
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
  }

  function initTilt(root) {
    if (reduced) return;
    // Pointer-based tilt is meaningless on touch, and costs jank.
    if (window.matchMedia && !window.matchMedia('(hover: hover)').matches) return;
    (root || document).querySelectorAll('[data-tilt]').forEach(function (el) {
      tilt(el, Number(el.getAttribute('data-tilt')) || 8);
    });
  }

  /* ---------------- parallax layers ---------------- */

  function initParallax(root) {
    if (reduced) return;
    const items = Array.prototype.slice.call((root || document).querySelectorAll('[data-parallax]'));
    if (!items.length) return;
    let ticking = false;

    function update() {
      const vh = window.innerHeight;
      items.forEach(function (el) {
        const speed = Number(el.getAttribute('data-parallax')) || 0.2;
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const centre = r.top + r.height / 2 - vh / 2;
        el.style.setProperty('--py', (-centre * speed).toFixed(1) + 'px');
      });
      ticking = false;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---------------- scroll progress thread ---------------- */

  function initProgress(el) {
    if (!el) return;
    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.setProperty('--p', p.toFixed(4));
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------------- door opening ---------------- */

  /* Returns a promise that resolves once the doors have finished swinging. */
  function openDoors(gate) {
    return new Promise(function (resolve) {
      if (!gate) { resolve(); return; }
      gate.classList.add('is-open');
      document.documentElement.classList.add('gate-open');
      document.body.classList.remove('is-locked');
      const wait = reduced ? 60 : 2100;
      setTimeout(function () {
        gate.classList.add('is-done');
        resolve();
      }, wait);
    });
  }

  /* ---------------- number roll ---------------- */

  /* Animates a numeric element from its current value to `to`. */
  function rollTo(el, to, ms) {
    const from = Number(el.dataset.val || 0);
    if (from === to) { el.textContent = String(to); return; }
    el.dataset.val = String(to);
    if (reduced) { el.textContent = String(to); return; }
    const dur = ms || 500, t0 = performance.now();
    function step(now) {
      const t = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(from + (to - from) * eased));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------------- helpers ---------------- */

  function debounce(fn, ms) {
    let t;
    return function () {
      const a = arguments, s = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(s, a); }, ms || 200);
    };
  }

  /* Smooth in-page scrolling for hash links. */
  function initSmoothLinks(root) {
    (root || document).addEventListener('click', function (e) {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + id);
    });
  }

  /* Adds .is-stuck to a nav once the page has scrolled past the hero. */
  function initStickyNav(nav, after) {
    if (!nav) return;
    function update() {
      nav.classList.toggle('is-stuck', window.scrollY > (after || 120));
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function boot(root) {
    applyStagger(root);
    initSplit(root);
    initReveal(root);
    initTilt(root);
    initParallax(root);
  }

  W.motion = {
    reduced: reduced,
    boot: boot,
    initReveal: initReveal, applyStagger: applyStagger, initSplit: initSplit,
    splitWords: splitWords, splitChars: splitChars,
    petals: petals, tilt: tilt, initTilt: initTilt, initParallax: initParallax,
    initProgress: initProgress, openDoors: openDoors, rollTo: rollTo,
    initSmoothLinks: initSmoothLinks, initStickyNav: initStickyNav,
    debounce: debounce
  };
})(window.W);
