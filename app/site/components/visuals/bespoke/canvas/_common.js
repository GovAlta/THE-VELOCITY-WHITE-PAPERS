/* Shared engine for the Solution Landscape canvas (owner: canvas).

   A JSON-driven node-graph engine in the Vue Flow paradigm: each scene is a set
   of typed nodes, bezier edges, and group regions declared in
   data/canvas/landscape.json. One renderer draws real architecture diagrams;
   the Scene component makes them interactive (drag nodes, pan, zoom, fit,
   minimap, click-to-inspect) and the Tour wraps them in a full-screen modal.
   Bilingual, downloadable, mobile-responsive, and accessible (each scene's
   narrative is the SVG aria-label, sr-only caption, and audio script).

   GSAP loads only on pages that use the canvas; agents animate along edges when
   present, and everything is fully legible as a static diagram without it. */

(function () {
  const W = window;
  if (W.VWCanvas) return;
  const h = W.Vue && W.Vue.h;

  const PAL = {
    ink: '#1A3A6E', accent: '#1A3A6E', accentSoft: '#2E5A9E', rust: '#B23F15',
    paper: '#F7F4ED', paperAlt: '#EFEAD9', rule: '#D8D1C2', ruleStrong: '#B8AE99',
    ink50: '#5E5F66', ink70: '#3D3E45', white: '#ffffff',
  };

  /* Node type → header colour + readable label. */
  const TYPE = {
    system:  { c: '#1A3A6E', t: 'System' },
    legacy:  { c: '#8a6d3b', t: 'Legacy' },
    agent:   { c: '#B23F15', t: 'Agent' },
    review:  { c: '#b8860b', t: 'Review' },
    service: { c: '#2e6fa6', t: 'Service' },
    data:    { c: '#2f7a3f', t: 'Data' },
    gateway: { c: '#6b4fbf', t: 'Gateway' },
    module:  { c: '#2f7a3f', t: 'Module' },
    stage:   { c: '#1A3A6E', t: 'Stage' },
    infra:   { c: '#5E5F66', t: 'Infra' },
    human:   { c: '#9a3412', t: 'Human' },
    future:  { c: '#2f7a3f', t: 'Future' },
    approach:{ c: '#1A3A6E', t: 'Approach' },
  };
  const EDGE = {
    flow: { stroke: '#3D3E45', dash: 'none', w: 1.8 },
    dep:  { stroke: '#B8AE99', dash: '6 5', w: 1.5 },
    data: { stroke: '#2f7a3f', dash: 'none', w: 1.8 },
    ctrl: { stroke: '#B23F15', dash: '2 4', w: 1.6 },
  };

  const N_W = 184, N_H = 70, HEAD = 22;

  const prefersReducedMotion = (typeof matchMedia === 'function') && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gsapOK = () => typeof gsap !== 'undefined' && !prefersReducedMotion;
  function locale() { return (W.VWStore && W.VWStore.locale) === 'fr' ? 'fr' : 'en'; }
  function t(v, loc) { if (v == null) return ''; if (typeof v === 'string') return v; return v[loc || locale()] || v.en || ''; }
  function onReady(fn) { const go = () => requestAnimationFrame(() => requestAnimationFrame(fn)); if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go(); }

  let _data = null, _pending = null;
  function loadData() {
    if (_data) return Promise.resolve(_data);
    if (_pending) return _pending;
    _pending = fetch('data/canvas/landscape.json').then(r => r.json()).then(d => { _data = d; return d; });
    return _pending;
  }

  /* word-wrap for SVG text (no native wrap) */
  function wrap(s, n) {
    const words = String(s || '').split(/\s+/); const lines = []; let cur = '';
    words.forEach(w => { if ((cur + ' ' + w).trim().length > n) { if (cur) lines.push(cur); cur = w; } else { cur = (cur + ' ' + w).trim(); } });
    if (cur) lines.push(cur);
    return lines;
  }

  /* Resolve node geometry. Each node has x,y (top-left in a 1280x820 space). */
  const nw = (n) => n.w || N_W;
  const nh = (n) => n.h || N_H;
  function center(n) { return { x: n.x + nw(n) / 2, y: n.y + nh(n) / 2 }; }

  /* Choose exit/entry anchor points on node borders based on relative position. */
  /* Anchor points on node borders. forceDir ('h'|'v') overrides the heuristic.
     The entry point is clamped to the target's face and biased under/beside the
     source, so several edges converging on one node land cleanly across its
     edge rather than all at the centre or into a corner. */
  function anchors(a, b, forceDir) {
    const ca = center(a), cb = center(b);
    const dx = cb.x - ca.x, dy = cb.y - ca.y;
    const pad = 18;
    const horiz = forceDir ? forceDir === 'h' : Math.abs(dx) >= Math.abs(dy);
    let sx, sy, tx, ty;
    if (horiz) {
      if (dx >= 0) { sx = a.x + nw(a); tx = b.x; } else { sx = a.x; tx = b.x + nw(b); }
      sy = ca.y;
      ty = Math.max(b.y + pad, Math.min(b.y + nh(b) - pad, ca.y));
    } else {
      if (dy >= 0) { sy = a.y + nh(a); ty = b.y; } else { sy = a.y; ty = b.y + nh(b); }
      sx = ca.x;
      tx = Math.max(b.x + pad, Math.min(b.x + nw(b) - pad, ca.x));
    }
    return { sx, sy, tx, ty, dir: horiz ? 'h' : 'v' };
  }
  function edgePath(p) {
    const { sx, sy, tx, ty, dir } = p;
    if (dir === 'h') { const k = Math.max(40, Math.abs(tx - sx) * 0.5); return 'M' + sx + ',' + sy + ' C' + (sx + k) + ',' + sy + ' ' + (tx - k) + ',' + ty + ' ' + tx + ',' + ty; }
    const k = Math.max(30, Math.abs(ty - sy) * 0.5); return 'M' + sx + ',' + sy + ' C' + sx + ',' + (sy + k) + ' ' + tx + ',' + (ty - k) + ' ' + tx + ',' + ty;
  }
  function bezierPt(t, p) {
    const { sx, sy, tx, ty, dir } = p; let c1x, c1y, c2x, c2y;
    if (dir === 'h') { const k = Math.max(40, Math.abs(tx - sx) * 0.5); c1x = sx + k; c1y = sy; c2x = tx - k; c2y = ty; }
    else { const k = Math.max(30, Math.abs(ty - sy) * 0.5); c1x = sx; c1y = sy + k; c2x = tx; c2y = ty - k; }
    const u = 1 - t;
    const x = u * u * u * sx + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * tx;
    const y = u * u * u * sy + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * ty;
    return { x, y };
  }

  function roundedTop(w, hh, r) {
    return 'M0,' + r + ' A' + r + ',' + r + ' 0 0 1 ' + r + ',0 H' + (w - r) + ' A' + r + ',' + r + ' 0 0 1 ' + w + ',' + r + ' V' + hh + ' H0 Z';
  }

  /* ---- draw helpers (pure: positions already resolved) ---- */
  function drawGroup(g, loc) {
    return h('g', {}, [
      h('rect', { x: g.x, y: g.y, width: g.w, height: g.h, rx: 14, fill: g.fill || 'rgba(26,58,110,0.04)', stroke: g.stroke || PAL.rule, 'stroke-width': 1.2, 'stroke-dasharray': '2 5' }),
      h('text', { x: g.x + 16, y: g.y + 22, 'font-size': 12, 'font-weight': 700, 'letter-spacing': '0.06em', fill: g.color || PAL.ink50, 'font-family': 'var(--font-mono)' }, (t(g.label, loc) || '').toUpperCase()),
    ]);
  }
  function drawEdge(node, loc) {
    const { from, to, ap, label, kind } = node;
    const st = EDGE[kind] || EDGE.flow;
    const d = edgePath(ap);
    const kids = [h('path', { d, fill: 'none', stroke: st.stroke, 'stroke-width': st.w, 'stroke-dasharray': st.dash, 'marker-end': 'url(#cv-arrow-' + (kind || 'flow') + ')' })];
    if (label) {
      const mid = bezierPt(0.5, ap); const lw = Math.min(160, t(label, loc).length * 6.4 + 12);
      kids.push(h('rect', { x: mid.x - lw / 2, y: mid.y - 10, width: lw, height: 18, rx: 9, fill: PAL.paper, stroke: PAL.rule, 'stroke-width': 1 }));
      kids.push(h('text', { x: mid.x, y: mid.y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 10.5, fill: PAL.ink70, 'font-family': 'var(--font-mono)' }, t(label, loc)));
    }
    return h('g', {}, kids);
  }
  function drawNode(n, loc, selected) {
    const w = nw(n), hh = nh(n);
    const ty = TYPE[n.type] || TYPE.system;
    const col = n.color || ty.c;
    const titleLines = wrap(t(n.label, loc), 22).slice(0, 2);
    const ty0 = HEAD + (hh - HEAD) / 2 - (titleLines.length - 1) * 8 + (n.sub ? -5 : 0);
    const kids = [
      h('rect', { x: 0, y: 0, width: w, height: hh, rx: 11, fill: '#fff', stroke: selected ? PAL.rust : PAL.ruleStrong, 'stroke-width': selected ? 2.4 : 1.3 }),
      h('path', { d: roundedTop(w, HEAD, 11), fill: col }),
      h('text', { x: 10, y: HEAD / 2 + 1, 'dominant-baseline': 'central', 'font-size': 9.5, 'font-weight': 700, 'letter-spacing': '0.07em', fill: '#fff', 'font-family': 'var(--font-mono)' }, (t(n.typeLabel, loc) || ty.t).toUpperCase()),
    ];
    if (n.metric) {
      const mw = String(t(n.metric, loc)).length * 6.6 + 14;
      kids.push(h('rect', { x: w - mw - 8, y: 5, width: mw, height: 13, rx: 6.5, fill: 'rgba(255,255,255,0.22)' }));
      kids.push(h('text', { x: w - 8 - mw / 2, y: 12.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 9, 'font-weight': 700, fill: '#fff', 'font-family': 'var(--font-mono)' }, t(n.metric, loc)));
    }
    titleLines.forEach((ln, i) => kids.push(h('text', { x: w / 2, y: ty0 + i * 16, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 13.5, 'font-weight': 600, fill: PAL.ink }, ln)));
    if (n.sub) kids.push(h('text', { x: w / 2, y: hh - 13, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 10, fill: PAL.ink50, 'font-family': 'var(--font-mono)' }, wrap(t(n.sub, loc), 30)[0] || ''));
    return h('g', { class: 'cv-gnode', 'data-node': n.id, style: 'transform: translate(' + n.x + 'px,' + n.y + 'px); cursor:grab;' }, kids);
  }

  function defs() {
    return h('defs', {}, Object.keys(EDGE).map(k => h('marker', { id: 'cv-arrow-' + k, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, [h('path', { d: 'M0 0 L10 5 L0 10 z', fill: EDGE[k].stroke })])));
  }

  /* Animate a flow dot continuously along each resolved edge. Every animated
     edge gets its own looping tween (phase-offset so they are not in lockstep),
     so all flows move at once and the whole diagram reads as live. Returns a
     controller with kill(). */
  function animateAgents(svg, edgeAps) {
    if (!gsapOK() || !svg || !edgeAps.length) return null;
    const tweens = [];
    edgeAps.forEach((ap, i) => {
      const tok = svg.querySelector('[data-agent="' + i + '"]');
      if (!tok) return;
      tok.setAttribute('opacity', '1');
      const proxy = { t: 0 };
      const tw = gsap.to(proxy, {
        t: 1, duration: 1.9, ease: 'none', repeat: -1, delay: (i % 6) * 0.28,
        onUpdate: () => {
          const p = bezierPt(proxy.t, ap);
          tok.setAttribute('transform', 'translate(' + p.x + ',' + p.y + ')');
          tok.setAttribute('opacity', String(proxy.t < 0.08 ? proxy.t / 0.08 : proxy.t > 0.92 ? (1 - proxy.t) / 0.08 : 1));
        },
      });
      tweens.push(tw);
    });
    return { kill() { tweens.forEach(t => { try { t.kill(); } catch (e) {} }); } };
  }

  if (!document.getElementById('canvas-visual-styles')) {
    const css = `
      .cv-fig { width: 100%; margin: 0; font-family: var(--font-mono); }
      .cv-frame { border: 1px solid var(--rule-strong); background: var(--paper); border-radius: 10px; overflow: hidden; position: relative; display: flex; flex-direction: column; }
      .cv-frame.cv-fs { position: fixed; inset: 0; z-index: 9999; border-radius: 0; height: 100vh; height: 100dvh; }
      .cv-bar { display: flex; align-items: center; gap: 8px; padding: 9px 12px; border-bottom: 1px solid var(--rule); flex-wrap: wrap; background: var(--paper); }
      .cv-title { font-family: var(--font-serif, Georgia, serif); font-style: italic; font-size: 15px; color: var(--accent); margin: 0; }
      .cv-spacer { flex: 1 1 auto; }
      .cv-chips { display: flex; gap: 5px; flex-wrap: wrap; }
      .cv-chip { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.04em; padding: 4px 8px; border: 1px solid var(--rule-strong); border-radius: 99px; background: var(--paper); color: var(--ink-70); cursor: pointer; line-height: 1; }
      .cv-chip.active { background: var(--accent); color: #fff; border-color: var(--accent); }
      .cv-btn { font-size: 12px; border: 1px solid var(--rule-strong); background: var(--paper); color: var(--ink-70); border-radius: 6px; padding: 5px 10px; cursor: pointer; line-height: 1.1; }
      .cv-btn:hover { border-color: var(--accent); color: var(--accent); }
      .cv-btn.cv-primary { background: var(--accent); color: #fff; border-color: var(--accent); }
      .cv-stage { position: relative; overflow: hidden; background-color: var(--paper); background-image: radial-gradient(var(--rule) 1px, transparent 1px); background-size: 24px 24px; touch-action: none; cursor: grab; min-height: 300px; }
      .cv-body { display: flex; flex-direction: column; }
      .cv-frame.cv-fs .cv-body { flex: 1 1 auto; min-height: 0; }
      .cv-frame.cv-fs .cv-fig { flex: 1 1 auto; display: flex; flex-direction: column; min-height: 0; }
      .cv-frame.cv-fs .cv-stage { flex: 1 1 auto; }
      .cv-stage.cv-grab { cursor: grabbing; }
      .cv-svg { width: 100%; height: 100%; display: block; min-height: 300px; }
      .cv-gnode text { user-select: none; }
      .cv-ctrls { position: absolute; right: 10px; bottom: 10px; display: flex; flex-direction: column; gap: 5px; z-index: 4; }
      .cv-ctrls .cv-btn { width: 34px; height: 30px; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
      .cv-mini { position: absolute; left: 10px; bottom: 10px; width: 168px; height: 108px; border: 1px solid var(--rule-strong); border-radius: 6px; background: rgba(247,244,237,0.92); overflow: hidden; z-index: 4; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
      .cv-hint { position: absolute; left: 50%; top: 10px; transform: translateX(-50%); font-size: 10px; color: var(--ink-50); background: rgba(247,244,237,0.85); padding: 3px 10px; border-radius: 99px; z-index: 4; pointer-events: none; }
      .cv-inspect { position: absolute; right: 10px; top: 10px; width: 250px; max-width: 70%; background: #fff; border: 1px solid var(--rule-strong); border-radius: 8px; padding: 12px 14px; z-index: 5; box-shadow: 0 10px 30px rgba(0,0,0,0.16); }
      .cv-inspect h4 { margin: 0 0 2px; font-size: 14px; color: var(--accent); }
      .cv-inspect .cv-itype { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.07em; color: var(--ink-50); }
      .cv-inspect p { margin: 8px 0 0; font-size: 12px; line-height: 1.5; color: var(--ink-70); }
      .cv-inspect .cv-x { position: absolute; top: 8px; right: 10px; cursor: pointer; color: var(--ink-50); border: none; background: none; font-size: 15px; }
      .cv-meta { padding: 12px 14px; border-top: 1px solid var(--rule); background: var(--paper); }
      .cv-meta-head { display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; }
      .cv-meta-title { font-size: 14px; font-weight: 700; color: var(--ink); }
      .cv-meta-paper a { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; font-size: 11px; }
      .cv-meta-blurb { font-size: 13px; color: var(--ink-70); margin-top: 5px; line-height: 1.5; }
      .cv-narr { font-size: 12.5px; color: var(--ink-70); margin-top: 8px; line-height: 1.6; max-width: 74ch; }
      .cv-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
      .cv-zoom { display: inline-flex; gap: 4px; align-items: center; }
      @media (max-width: 680px) {
        .cv-title { width: 100%; }
        .cv-chips { order: 3; width: 100%; }
        .cv-stage { min-height: 340px; }
        .cv-inspect { width: 200px; }
        .cv-mini { display: none; }
      }
    `;
    const style = document.createElement('style');
    style.id = 'canvas-visual-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  W.VWCanvas = {
    h, PAL, TYPE, EDGE, N_W, N_H, prefersReducedMotion, gsapOK, locale, t, onReady, loadData,
    wrap, center, anchors, edgePath, bezierPt, nw, nh,
    drawGroup, drawEdge, drawNode, defs, animateAgents,
    VB_W: 1280, VB_H: 820,
  };
})();
