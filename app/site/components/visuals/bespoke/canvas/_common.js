/* Shared layer for the Solution Landscape canvas family (owner: canvas).

   The canvas is fully data-driven. data/canvas/landscape.json declares every
   scene with a `kind`; this file holds one generic SVG renderer per kind plus
   its GSAP animation. Scenes are bilingual (title/blurb/narrative carry
   {en,fr}) and downloadable (the JSON is the takeaway artifact).

   Two components consume this layer:
     - canvas:scene  renders one scene by id (embeddable in any paper)
     - canvas:tour   the full-screen, zoomable container that sequences scenes

   GSAP loads only on pages that use the canvas (declared first in the paper's
   bespoke_scripts). Everything degrades to a static, labelled diagram when GSAP
   is unavailable, so the scenes are meaningful without motion. */

(function () {
  const W = window;
  if (W.VWCanvas) return;
  const h = W.Vue && W.Vue.h;

  const PAL = {
    ink: '#1A3A6E', accent: '#1A3A6E', accentSoft: '#2E5A9E', rust: '#B23F15',
    paper: '#F7F4ED', paperAlt: '#EFEAD9', rule: '#D8D1C2', ruleStrong: '#B8AE99',
    ink50: '#5E5F66', ink70: '#3D3E45',
    green: '#2f7a3f', yellow: '#b8860b', red: '#b1331a', blue: '#1f4f8f',
    olive: '#7E8C3C', amber: '#cf9a39', scan: '#2e6fa6', module: '#2f7a3f', empty: '#e7e1d3',
  };

  const prefersReducedMotion = (typeof matchMedia === 'function') && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gsapOK = () => typeof gsap !== 'undefined' && !prefersReducedMotion;
  function locale() { return (W.VWStore && W.VWStore.locale) === 'fr' ? 'fr' : 'en'; }
  function t(v, loc) { if (v == null) return ''; if (typeof v === 'string') return v; return v[loc || locale()] || v.en || ''; }
  function onReady(fn) { const go = () => requestAnimationFrame(() => requestAnimationFrame(fn)); if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go(); }

  /* Load the dataset once, cached. Relative to the document base (<base href="/">). */
  let _data = null, _pending = null;
  function loadData() {
    if (_data) return Promise.resolve(_data);
    if (_pending) return _pending;
    _pending = fetch('data/canvas/landscape.json').then(r => r.json()).then(d => { _data = d; return d; });
    return _pending;
  }

  /* ---- SVG draw helpers (viewBox is 0 0 1000 600 for every scene) ---- */
  const VB_W = 1000, VB_H = 600;
  const E = (tag, attrs, kids) => h(tag, attrs, kids);
  const box = (x, y, w, hh, o) => E('rect', { x, y, width: w, height: hh, rx: (o && o.rx != null) ? o.rx : 8, fill: (o && o.fill) || '#fff', stroke: (o && o.stroke) || PAL.ruleStrong, 'stroke-width': (o && o.sw) || 1.2 });
  const txt = (x, y, s, o) => E('text', { x, y, 'text-anchor': (o && o.anchor) || 'middle', 'dominant-baseline': (o && o.baseline) || 'middle', 'font-size': (o && o.size) || 15, 'font-family': (o && o.mono) ? 'var(--font-mono)' : 'inherit', 'font-weight': (o && o.weight) || 400, fill: (o && o.fill) || PAL.ink, 'letter-spacing': (o && o.ls) || 0 }, s);
  const line = (x1, y1, x2, y2, o) => E('line', { x1, y1, x2, y2, stroke: (o && o.stroke) || PAL.ruleStrong, 'stroke-width': (o && o.sw) || 1.2, 'stroke-dasharray': (o && o.dash) || 'none' });
  const agent = (i, x, y, color) => E('g', { class: 'cv-agent', 'data-agent': i, style: 'transform: translate(' + x + 'px,' + y + 'px);' }, [
    E('circle', { r: 11, fill: color || PAL.rust, stroke: '#fff', 'stroke-width': 2 }),
    E('circle', { r: 3.5, cx: 0, cy: -1, fill: '#fff', opacity: 0.85 }),
  ]);
  const cap = (s, n) => (s && s.length > n) ? s.slice(0, n - 1) + '…' : s;

  /* ============================ RENDERERS ============================ */
  const RENDER = {
    /* Layered platform stack, top band first. */
    layers(spec, loc) {
      const bands = spec.bands || [];
      const n = bands.length, pad = 28, gap = 10;
      const bh = (VB_H - pad * 2 - gap * (n - 1)) / n;
      const kids = [];
      bands.forEach((b, i) => {
        const y = pad + i * (bh + gap);
        kids.push(box(60, y, 880, bh, { fill: i % 2 ? PAL.paperAlt : '#fff', rx: 6 }));
        kids.push(txt(80, y + bh / 2, t(b.label, loc), { anchor: 'start', size: 17, weight: 600, fill: PAL.accent }));
        kids.push(txt(470, y + bh / 2, cap(t(b.items, loc), 64), { anchor: 'start', size: 13, fill: PAL.ink70, mono: true }));
      });
      kids.push(agent('req', 80, pad - 2, PAL.rust));
      return kids;
    },

    /* Worker at centre, review agents on a ring, harness parts along the base. */
    ring(spec, loc) {
      const cx = 500, cy = 270, R = 175;
      const nodes = spec.nodes || [];
      const kids = [];
      nodes.forEach((nd, i) => {
        const a = (-90 + i * (360 / nodes.length)) * Math.PI / 180;
        const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
        kids.push(line(cx, cy, x, y, { stroke: PAL.rule, dash: '4 4' }));
      });
      kids.push(E('circle', { cx, cy, r: 58, fill: PAL.ink, stroke: '#fff', 'stroke-width': 3 }));
      kids.push(txt(cx, cy, t(spec.center, loc) || 'Worker', { fill: '#fff', size: 17, weight: 600 }));
      nodes.forEach((nd, i) => {
        const a = (-90 + i * (360 / nodes.length)) * Math.PI / 180;
        const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
        const col = PAL[nd.color] || PAL.accentSoft;
        kids.push(E('g', { class: 'cv-node', 'data-node': i }, [
          E('circle', { cx: x, cy: y, r: 40, fill: col, stroke: '#fff', 'stroke-width': 2.5 }),
          txt(x, y - 3, t(nd.label, loc), { fill: '#fff', size: 14, weight: 600 }),
          txt(x, y + 13, cap(t(nd.role, loc), 22), { fill: '#fff', size: 8.5, mono: true }),
        ]));
      });
      const ctx = spec.context || [];
      ctx.forEach((c, i) => {
        const w = 150, x = 60 + i * (w + 14), y = 520;
        kids.push(box(x, y, w, 44, { fill: PAL.paperAlt, rx: 6 }));
        kids.push(txt(x + w / 2, y + 22, t(c, loc), { size: 12, mono: true, fill: PAL.ink70 }));
      });
      return kids;
    },

    /* Three-stage factory pipeline, agents flow left to right. */
    pipeline(spec, loc) {
      const stages = spec.stages || [];
      const kids = [];
      const sw = 250, gap = (940 - 60 - sw * stages.length) / (stages.length - 1 || 1);
      stages.forEach((st, i) => {
        const x = 60 + i * (sw + gap), y = 120, hh = 320;
        kids.push(box(x, y, sw, hh, { fill: '#fff', rx: 10, sw: 1.6 }));
        kids.push(txt(x + sw / 2, y + 34, t(st.label, loc), { size: 20, weight: 700, fill: PAL.accent }));
        kids.push(txt(x + sw / 2, y + 58, t(st.sub, loc), { size: 12, mono: true, fill: PAL.rust, ls: '0.08em' }));
        (st.steps || []).forEach((s, j) => {
          const sy = y + 92 + j * 48;
          kids.push(box(x + 22, sy, sw - 44, 38, { fill: PAL.paperAlt, rx: 6 }));
          kids.push(txt(x + sw / 2, sy + 19, cap(t(s, loc), 26), { size: 12.5, fill: PAL.ink70 }));
        });
        if (i < stages.length - 1) {
          const ax = x + sw + gap / 2;
          kids.push(E('path', { d: 'M' + (x + sw + 6) + ' ' + (y + hh / 2) + ' L' + (x + sw + gap - 6) + ' ' + (y + hh / 2), stroke: PAL.ruleStrong, 'stroke-width': 2, 'marker-end': 'url(#cv-arrow)' }));
        }
      });
      kids.push(E('defs', {}, [E('marker', { id: 'cv-arrow', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, [E('path', { d: 'M0 0 L10 5 L0 10 z', fill: PAL.ruleStrong })])]));
      const na = spec.agents || 4;
      for (let i = 0; i < na; i++) kids.push(agent(i, 70, 470, [PAL.rust, PAL.scan, PAL.olive, PAL.amber, PAL.accentSoft, PAL.green][i % 6]));
      return kids;
    },

    /* Snakes-and-ladders delivery board, a token hops along eight stages. */
    board(spec, loc) {
      const stages = spec.stages || [];
      const kids = [];
      const cols = 4, cw = 200, chh = 96, x0 = 60, y0 = 60, gx = 14, gy = 40;
      const pos = [];
      stages.forEach((s, i) => {
        const row = Math.floor(i / cols);
        let col = i % cols;
        if (row % 2 === 1) col = cols - 1 - col;
        const x = x0 + col * (cw + gx), y = y0 + row * (chh + gy);
        pos.push({ x: x + cw / 2, y: y + chh / 2 });
        kids.push(box(x, y, cw, chh, { fill: '#fff', rx: 8 }));
        kids.push(txt(x + 14, y + 22, String(i + 1).padStart(2, '0'), { anchor: 'start', size: 12, mono: true, fill: PAL.rust }));
        kids.push(txt(x + cw / 2, y + chh / 2 + 6, cap(t(s, loc), 18), { size: 14, weight: 600, fill: PAL.ink }));
      });
      for (let i = 0; i < pos.length - 1; i++) kids.push(line(pos[i].x, pos[i].y, pos[i + 1].x, pos[i + 1].y, { stroke: PAL.rule, dash: '5 5' }));
      const sc = spec.scoring || [];
      sc.slice(0, 6).forEach((s, i) => {
        const y = 60 + i * 26;
        kids.push(txt(770, y, t(s.event, loc), { anchor: 'start', size: 11.5, fill: PAL.ink70 }));
        const up = String(s.pts).indexOf('+') === 0;
        kids.push(txt(935, y, s.pts, { anchor: 'end', size: 12, mono: true, weight: 700, fill: up ? PAL.green : PAL.red }));
      });
      kids.push(box(755, 232, 190, 70, { fill: PAL.ink, rx: 8 }));
      kids.push(txt(850, 258, 'SCORE', { fill: '#fff', size: 11, mono: true, ls: '0.1em' }));
      kids.push(E('text', { x: 850, y: 285, 'text-anchor': 'middle', 'font-size': 24, 'font-weight': 700, fill: '#fff', 'font-family': 'var(--font-mono)', 'data-score': '1' }, '0'));
      if (spec.target) kids.push(txt(850, 340, t(spec.target, loc), { size: 12, fill: PAL.rust, weight: 600 }));
      kids.push(agent('tok', pos[0] ? pos[0].x : 160, pos[0] ? pos[0].y : 108, PAL.rust));
      return kids;
    },

    /* The legacy estate as a tile grid, scanner agents sweep it. */
    'grid-scan'(spec, loc) {
      const cols = spec.cols || 20, rows = spec.rows || 10;
      const kids = [];
      const gx0 = 60, gy0 = 60, gw = 560, gh = 480;
      const cw = (gw - (cols - 1) * 4) / cols, chh = (gh - (rows - 1) * 4) / rows;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const x = gx0 + c * (cw + 4), y = gy0 + r * (chh + 4);
        const weak = ((r * 7 + c * 3) % 5 === 0);
        kids.push(E('rect', { x, y, width: cw, height: chh, rx: 2, fill: weak ? PAL.empty : PAL.olive, opacity: 0.5, 'data-tile': r * cols + c, class: 'cv-tile' }));
      }
      const stats = spec.stats || [];
      stats.forEach((s, i) => {
        const y = 80 + i * 110;
        kids.push(E('text', { x: 670, y, 'font-size': 40, 'font-weight': 700, fill: PAL.accent, 'font-family': 'var(--font-mono)' }, s.value));
        kids.push(txt(670, y + 26, t(s.label, loc), { anchor: 'start', size: 13, fill: PAL.ink70 }));
      });
      const ns = spec.scanners || 4;
      for (let i = 0; i < ns; i++) kids.push(agent(i, gx0 + 10, gy0 + 10 + i * (gh / ns), PAL.scan));
      return kids;
    },

    /* Four approaches as four panels; 3 and 4 highlighted. */
    quadrants(spec, loc) {
      const items = spec.items || [];
      const hl = spec.highlight || [];
      const kids = [];
      const pw = 420, ph = 230, x0 = 60, y0 = 40, gx = 40, gy = 30;
      items.slice(0, 4).forEach((it, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = x0 + col * (pw + gx), y = y0 + row * (ph + gy);
        const on = hl.indexOf(it.n) !== -1;
        kids.push(box(x, y, pw, ph, { fill: on ? '#fff' : PAL.paperAlt, stroke: on ? PAL.rust : PAL.ruleStrong, sw: on ? 2.4 : 1.2, rx: 10 }));
        kids.push(E('text', { x: x + 22, y: y + 44, 'font-size': 30, 'font-weight': 700, fill: on ? PAL.rust : PAL.ink50, 'font-family': 'var(--font-mono)' }, String(it.n)));
        kids.push(txt(x + 70, y + 40, t(it.name, loc), { anchor: 'start', size: 19, weight: 700, fill: PAL.accent }));
        wrap(t(it.desc, loc), 46).forEach((ln, j) => kids.push(txt(x + 24, y + 86 + j * 24, ln, { anchor: 'start', size: 13.5, fill: PAL.ink70 })));
        if (on) kids.push(agent('q' + it.n, x + pw - 26, y + 26, PAL.rust));
      });
      if (spec.footer) kids.push(txt(500, y0 + 2 * ph + gy + 6, t(spec.footer, loc), { size: 14, weight: 600, fill: PAL.rust }));
      return kids;
    },

    /* Inverted hierarchy: one worker, many supervisors fanned above. */
    hierarchy(spec, loc) {
      const sup = spec.supervisors || [];
      const kids = [];
      const cx = 500, wy = 520;
      kids.push(E('circle', { cx, cy: wy, r: 46, fill: PAL.ink, stroke: '#fff', 'stroke-width': 3 }));
      kids.push(txt(cx, wy, t(spec.worker, loc) || 'Worker', { fill: '#fff', size: 15, weight: 600 }));
      const n = sup.length, spanW = 880, x0 = 60, sy = 90, sw = (spanW - (n - 1) * 12) / n;
      sup.forEach((s, i) => {
        const x = x0 + i * (sw + 12);
        kids.push(line(x + sw / 2, sy + 70, cx, wy - 46, { stroke: PAL.rule, dash: '4 4' }));
        kids.push(box(x, sy, sw, 70, { fill: PAL.accentSoft, rx: 8, stroke: '#fff', sw: 2 }));
        wrap(t(s, loc), 12).forEach((ln, j) => kids.push(txt(x + sw / 2, sy + 28 + j * 16, ln, { fill: '#fff', size: 11, weight: 600 })));
        kids.push(E('g', { class: 'cv-node', 'data-node': i }, [E('circle', { cx: x + sw / 2, cy: sy + 70, r: 5, fill: PAL.scan })]));
      });
      kids.push(box(cx - 70, wy + 60, 140, 40, { fill: '#fff', rx: 20, stroke: PAL.rust, sw: 1.6 }));
      kids.push(txt(cx, wy + 80, t(spec.ratio, loc) || '1 : 8', { size: 18, weight: 700, fill: PAL.rust, mono: true }));
      return kids;
    },

    /* Many legacy nodes collapse into a few modern modules. */
    collapse(spec, loc) {
      const kids = [];
      const N = 40;
      const lx = 60, lw = 320, ly = 70, lh = 460;
      kids.push(txt(lx + lw / 2, 48, (spec.fromCount || 185) + ' systems', { size: 14, weight: 600, fill: PAL.ink70 }));
      for (let i = 0; i < N; i++) {
        const c = i % 5, r = Math.floor(i / 5);
        kids.push(E('rect', { x: lx + c * 62, y: ly + r * 56, width: 50, height: 44, rx: 3, fill: PAL.empty, stroke: PAL.ruleStrong, 'stroke-width': 0.8, 'data-leg': i, class: 'cv-leg' }));
      }
      const mods = spec.modules || [];
      const mx = 640, mw = 300, my = 80, mhTot = 440, mh = (mhTot - (mods.length - 1) * 12) / mods.length;
      kids.push(txt(mx + mw / 2, 48, (spec.toCount || 16) + ' shared modules', { size: 14, weight: 600, fill: PAL.module }));
      mods.forEach((m, i) => {
        const y = my + i * (mh + 12);
        kids.push(box(mx, y, mw, mh, { fill: PAL.module, rx: 8, stroke: '#fff', sw: 2, 'data-mod': i }));
        kids.push(txt(mx + mw / 2, y + mh / 2, cap(t(m, loc), 28), { fill: '#fff', size: 13.5, weight: 600 }));
      });
      kids.push(E('path', { d: 'M' + (lx + lw) + ' 300 C 500 300, 560 300, ' + mx + ' 300', stroke: PAL.ruleStrong, 'stroke-width': 1.5, fill: 'none', 'marker-end': 'url(#cv-arrow2)' }));
      kids.push(E('defs', {}, [E('marker', { id: 'cv-arrow2', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 8, markerHeight: 8, orient: 'auto' }, [E('path', { d: 'M0 0 L10 5 L0 10 z', fill: PAL.ruleStrong })])]));
      if (spec.drop) kids.push(txt(500, 560, t(spec.drop, loc), { size: 13, weight: 600, fill: PAL.rust }));
      return kids;
    },
  };

  /* word-wrap a string to lines of <= n chars (for SVG text, which does not wrap) */
  function wrap(s, n) {
    const words = String(s || '').split(/\s+/); const lines = []; let cur = '';
    words.forEach(w => { if ((cur + ' ' + w).trim().length > n) { if (cur) lines.push(cur); cur = w; } else { cur = (cur + ' ' + w).trim(); } });
    if (cur) lines.push(cur);
    return lines.slice(0, 4);
  }

  /* ============================ ANIMATIONS ============================ */
  const ANIM = {
    layers(root) {
      if (!gsapOK()) return null;
      const a = root.querySelector('[data-agent="req"]'); const bands = root.querySelectorAll('rect');
      if (!a) return null;
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });
      const n = 6; for (let i = 0; i < n; i++) tl.to(a, { y: 28 + i * (((600 - 56 - 50) / n) + 10) + (((600 - 56) / n) / 2), duration: 0.5, ease: 'power1.inOut' });
      return tl;
    },
    ring(root) {
      if (!gsapOK()) return null;
      const nodes = root.querySelectorAll('.cv-node');
      const tl = gsap.timeline({ repeat: -1 });
      nodes.forEach((nd) => { tl.to(nd, { scale: 1.12, transformOrigin: 'center', duration: 0.3, yoyo: true, repeat: 1, ease: 'sine.inOut' }, '+=0.25'); });
      return tl;
    },
    pipeline(root) {
      if (!gsapOK()) return null;
      const agents = root.querySelectorAll('[data-agent]');
      const xs = [70, 320, 560, 810, 930];
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4 });
      agents.forEach((a, i) => {
        tl.fromTo(a, { x: 70, y: 470, opacity: 0 }, { opacity: 1, duration: 0.2 }, i * 0.5);
        xs.forEach((x, k) => tl.to(a, { x, y: 470 - (k % 2 ? 12 : 0), duration: 0.45, ease: 'power1.inOut' }, i * 0.5 + 0.2 + k * 0.4));
        tl.to(a, { opacity: 0, duration: 0.2 }, i * 0.5 + 0.2 + xs.length * 0.4);
      });
      return tl;
    },
    board(root) {
      if (!gsapOK()) return null;
      const tok = root.querySelector('[data-agent="tok"]'); const score = root.querySelector('[data-score]');
      if (!tok) return null;
      const cols = 4, cw = 200, chh = 96, x0 = 60, y0 = 60, gx = 14, gy = 40, n = 8;
      const pos = []; for (let i = 0; i < n; i++) { const row = Math.floor(i / cols); let col = i % cols; if (row % 2 === 1) col = cols - 1 - col; pos.push({ x: x0 + col * (cw + gx) + cw / 2, y: y0 + row * (chh + gy) + chh / 2 }); }
      let s = 0; const setScore = (v) => { s = Math.max(0, v); if (score) score.textContent = String(s); };
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1, onRepeat: () => setScore(0) });
      for (let i = 1; i < n; i++) {
        tl.to(tok, { x: pos[i].x - pos[0].x, y: pos[i].y - pos[0].y, duration: 0.5, ease: 'power1.inOut', onComplete: () => setScore(s + 100) });
        if (i === 3) { tl.to(tok, { x: pos[2].x - pos[0].x, y: pos[2].y - pos[0].y, duration: 0.4, ease: 'power1.in', onComplete: () => setScore(s - 50) }); tl.to(tok, { x: pos[3].x - pos[0].x, y: pos[3].y - pos[0].y, duration: 0.4, onComplete: () => setScore(s + 100) }); }
      }
      return tl;
    },
    'grid-scan'(root) {
      if (!gsapOK()) return null;
      const agents = root.querySelectorAll('[data-agent]'); const tiles = root.querySelectorAll('.cv-tile');
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });
      agents.forEach((a, i) => { tl.to(a, { x: 560, duration: 2.4, ease: 'none', repeat: 1, yoyo: true }, i * 0.2); });
      tiles.forEach((tile, i) => { tl.to(tile, { opacity: 0.95, duration: 0.18, yoyo: true, repeat: 1 }, (i % 40) * 0.05); });
      return tl;
    },
    quadrants(root) {
      if (!gsapOK()) return null;
      const a = root.querySelectorAll('[data-agent]');
      const tl = gsap.timeline({ repeat: -1 });
      a.forEach(el => tl.to(el, { scale: 1.3, transformOrigin: 'center', duration: 0.5, yoyo: true, repeat: 1, ease: 'sine.inOut' }, '+=0.3'));
      return tl;
    },
    hierarchy(root) {
      if (!gsapOK()) return null;
      const nodes = root.querySelectorAll('.cv-node circle');
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4 });
      nodes.forEach((nd, i) => tl.to(nd, { attr: { r: 9 }, fill: PAL.rust, duration: 0.2, yoyo: true, repeat: 1 }, i * 0.12));
      return tl;
    },
    collapse(root) {
      if (!gsapOK()) return null;
      const legs = root.querySelectorAll('.cv-leg');
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.8 });
      tl.to(legs, { opacity: 0.15, x: 200, duration: 0.8, stagger: { each: 0.015, from: 'random' }, ease: 'power1.in' });
      tl.to(legs, { opacity: 1, x: 0, duration: 0.5, stagger: { each: 0.01, from: 'edges' } }, '+=1.2');
      return tl;
    },
  };

  /* Inject the shared stylesheet once. */
  if (!document.getElementById('canvas-visual-styles')) {
    const css = `
      .cv-fig { width: 100%; margin: 0; font-family: var(--font-mono); }
      .cv-frame { border: 1px solid var(--rule-strong); background: var(--paper); border-radius: 10px; overflow: hidden; position: relative; display: flex; flex-direction: column; }
      .cv-frame.cv-fs { position: fixed; inset: 0; z-index: 9999; border-radius: 0; height: 100vh; }
      .cv-bar { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-bottom: 1px solid var(--rule); flex-wrap: wrap; }
      .cv-title { font-family: var(--font-serif, Georgia, serif); font-style: italic; font-size: 15px; color: var(--accent); margin: 0; }
      .cv-spacer { flex: 1 1 auto; }
      .cv-chips { display: flex; gap: 5px; flex-wrap: wrap; }
      .cv-chip { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.04em; padding: 4px 8px; border: 1px solid var(--rule-strong); border-radius: 99px; background: var(--paper); color: var(--ink-70); cursor: pointer; line-height: 1; }
      .cv-chip.active { background: var(--accent); color: #fff; border-color: var(--accent); }
      .cv-btn { font-size: 12px; border: 1px solid var(--rule-strong); background: var(--paper); color: var(--ink-70); border-radius: 6px; padding: 4px 9px; cursor: pointer; line-height: 1.2; }
      .cv-btn:hover { border-color: var(--accent); color: var(--accent); }
      .cv-viewport { position: relative; overflow: hidden; background-color: var(--paper); background-image: radial-gradient(var(--rule) 1px, transparent 1px); background-size: 22px 22px; touch-action: none; cursor: grab; min-height: 280px; }
      .cv-frame.cv-fs .cv-viewport { flex: 1 1 auto; }
      .cv-viewport.cv-grab { cursor: grabbing; }
      .cv-pan { transform-origin: 0 0; will-change: transform; }
      .cv-svg { width: 100%; height: auto; display: block; }
      .cv-frame.cv-fs .cv-svg { max-height: 100vh; }
      .cv-agent { will-change: transform; }
      .cv-meta { padding: 12px 14px; border-top: 1px solid var(--rule); }
      .cv-meta-head { display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; }
      .cv-meta-title { font-size: 14px; font-weight: 700; color: var(--ink); }
      .cv-meta-paper { font-size: 11px; }
      .cv-meta-paper a { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
      .cv-meta-blurb { font-size: 13px; color: var(--ink-70); margin-top: 5px; line-height: 1.5; }
      .cv-narr { font-size: 12.5px; color: var(--ink-70); margin-top: 8px; line-height: 1.6; max-width: 70ch; }
      .cv-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
      .cv-zoom { display: inline-flex; gap: 4px; align-items: center; }
      @media (max-width: 640px) {
        .cv-title { width: 100%; }
        .cv-chips { order: 3; width: 100%; }
        .cv-viewport { min-height: 220px; }
        .cv-meta-blurb, .cv-narr { font-size: 13px; }
      }
    `;
    const style = document.createElement('style');
    style.id = 'canvas-visual-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  W.VWCanvas = { h, PAL, VB_W, VB_H, prefersReducedMotion, gsapOK, locale, t, onReady, loadData, RENDER, ANIM };
})();
