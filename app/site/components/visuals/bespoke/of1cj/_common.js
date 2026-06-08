/* Shared layer for the of1cj (Anti-Drift Harness) bespoke visuals.

   These visuals are ported from the ADHD research repository's animated
   approach demos. The GSAP timelines are kept close to their originals; the
   only substantive change is that the Tailwind utility markup is rewritten as
   inline styles + a small injected stylesheet so the visuals carry their own
   look without pulling Tailwind into the site.

   Load order (declared in of1cj.bespoke_scripts): GSAP CDN, then this file,
   then each visual. Everything hangs off window.VWof1cj so the visuals stay
   small and share one copy of the helpers, the palette, and the chain.

   GSAP loads only on this paper, so the rest of the site never pays for it. */

(function () {
  const W = window;
  if (W.VWof1cj) return;

  const h = W.Vue && W.Vue.h;

  /* Status palette, shared by every visual so the legends line up. */
  const PAL = {
    synced: '#8a9a3f',   // in sync along the chain
    edit:   '#d8541f',   // a builder edit just landed
    hop:    '#cf9a39',   // one-hop propagation (the neighbours the model touched)
    drift:  '#b1331a',   // drift: a link left stale
    scan:   '#2e6fa6',   // the anti-drift harness scanning
    empty:  '#d8d1c2',   // no signal / off-chain
    commit: '#6b4fbf',   // a git commit
  };

  /* The fourteen-link chain, from requirements to training. Shared so the
     chain, board, and pill visuals all read from one source. */
  const CHAIN = [
    { id: 'requirements', label: 'Requirements' },
    { id: 'schema',       label: 'DB Schema' },
    { id: 'migrations',   label: 'Migrations' },
    { id: 'controllers',  label: 'Controllers' },
    { id: 'routers',      label: 'Routers' },
    { id: 'middleware',   label: 'Middleware' },
    { id: 'composables',  label: 'Composables' },
    { id: 'components',   label: 'Components' },
    { id: 'pages',        label: 'Pages' },
    { id: 'docs',         label: 'Docs' },
    { id: 'terraform',    label: 'Infra' },
    { id: 'externals',    label: 'External' },
    { id: 'api_specs',    label: 'API Specs' },
    { id: 'training',     label: 'Training' },
  ];

  const prefersReducedMotion = (typeof matchMedia === 'function')
    && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* A small ring that scales and fades over a target element. Uses GSAP when
     present; a no-op under reduced motion. */
  function spawnPing(rootEl, targetEl, color, scale) {
    if (prefersReducedMotion || !rootEl || !targetEl || typeof gsap === 'undefined') return;
    const r = targetEl.getBoundingClientRect();
    const root = rootEl.getBoundingClientRect();
    const ping = document.createElement('div');
    ping.style.cssText = [
      'position:absolute',
      'left:' + (r.left - root.left) + 'px',
      'top:' + (r.top - root.top) + 'px',
      'width:' + r.width + 'px',
      'height:' + r.height + 'px',
      'border-radius:6px',
      'border:2px solid ' + color,
      'pointer-events:none',
      'opacity:0.85',
      'z-index:5',
      'transform-origin:center',
    ].join(';');
    rootEl.appendChild(ping);
    gsap.to(ping, { scale: scale || 2.6, opacity: 0, duration: 0.85, ease: 'power2.out', onComplete: () => ping.remove() });
  }

  /* A transient ticket card that flies from a source element to a target. */
  function flyTicket(rootEl, fromEl, toEl, text, color) {
    if (prefersReducedMotion || !rootEl || !fromEl || !toEl || typeof gsap === 'undefined') return;
    const fr = fromEl.getBoundingClientRect();
    const tr = toEl.getBoundingClientRect();
    const root = rootEl.getBoundingClientRect();
    const ticket = document.createElement('div');
    ticket.style.cssText = [
      'position:absolute',
      'left:' + (fr.left - root.left + fr.width / 2 - 60) + 'px',
      'top:' + (fr.top - root.top + fr.height / 2 - 12) + 'px',
      'width:120px',
      'padding:5px 7px',
      'background:var(--paper)',
      'border:1px solid var(--rule-strong)',
      'border-left:3px solid ' + (color || PAL.drift),
      'border-radius:4px',
      'font-family:var(--font-mono)',
      'font-size:9.5px',
      'color:var(--ink)',
      'pointer-events:none',
      'opacity:0',
      'z-index:9',
      'box-shadow:0 8px 22px rgba(0,0,0,0.18)',
      'white-space:nowrap',
      'overflow:hidden',
      'text-overflow:ellipsis',
    ].join(';');
    ticket.textContent = text;
    rootEl.appendChild(ticket);
    const targetX = tr.left - root.left + tr.width / 2 - 60;
    const targetY = tr.top - root.top - 4;
    gsap.timeline({ onComplete: () => ticket.remove() })
      .to(ticket, { opacity: 1, duration: 0.2 })
      .to(ticket, { x: targetX - (fr.left - root.left + fr.width / 2 - 60), y: targetY - (fr.top - root.top + fr.height / 2 - 12), duration: 0.8, ease: 'power2.inOut' }, '<+=0.05')
      .to(ticket, { opacity: 0, duration: 0.3 }, '-=0.2');
  }

  /* Thermal gradient, cold to hot. t in [0,1]. */
  function heatColor(t) {
    if (t <= 0.05) return 'rgba(255,255,255,0.05)';
    if (t <= 0.25) return 'rgba(60, 90, 130, ' + (0.25 + t * 0.6) + ')';
    if (t <= 0.45) return 'rgba(140, 110, 70, ' + (0.4 + t * 0.5) + ')';
    if (t <= 0.65) return 'rgba(207, 154, 57, ' + (0.55 + t * 0.4) + ')';
    if (t <= 0.85) return 'rgba(177, 51, 26, ' + (0.65 + t * 0.3) + ')';
    return 'rgba(216, 84, 31, ' + (0.85 + t * 0.15) + ')';
  }

  /* Legend dot + label, used in every visual's footer. */
  function legendDot(color, label) {
    return h('span', { class: 'adh-leg' }, [
      h('span', { class: 'adh-leg-dot', style: 'background:' + color }),
      h('span', {}, label),
    ]);
  }

  function locale() {
    return (W.VWStore && W.VWStore.locale) === 'fr' ? 'fr' : 'en';
  }

  /* Run an animation start callback once fonts are ready and two frames have
     painted, so getBoundingClientRect measurements are stable. */
  function onReady(fn) {
    const go = () => requestAnimationFrame(() => requestAnimationFrame(fn));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
  }

  /* Inject the shared stylesheet once. Scoped under .adh-fig so nothing leaks. */
  if (!document.getElementById('of1cj-visual-styles')) {
    const css = `
      .adh-fig { width: 100%; font-family: var(--font-mono); position: relative; overflow: hidden; }
      .adh-frame { border: 1px solid var(--rule); background: var(--paper); border-radius: 8px; padding: 14px; position: relative; overflow: hidden; }
      .adh-frame--dark { background: #1c1712; border-color: #3a332a; }
      .adh-grid { display: grid; gap: 4px; }
      .adh-cell { border-radius: 3px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.35); will-change: transform, background-color; }
      .adh-collabel { font-size: 9px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-50); text-align: center; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .adh-legend { margin-top: 14px; display: flex; gap: 14px; flex-wrap: wrap; align-items: center; font-size: 10px; text-transform: uppercase; letter-spacing: 0.07em; color: var(--ink-50); }
      .adh-legend--dark { color: rgba(255,255,255,0.7); }
      .adh-leg { display: inline-flex; align-items: center; gap: 5px; }
      .adh-leg-dot { width: 9px; height: 9px; border-radius: 2px; display: inline-block; }
      .adh-status { margin-left: auto; text-transform: none; letter-spacing: 0; color: var(--ink-70); }
      .adh-status--dark { color: #fff; }
      .adh-row { display: flex; align-items: center; gap: 10px; }
      .adh-rowlabel { width: 92px; flex: none; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-50); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .adh-card { border: 1px solid var(--rule); background: #fff; border-radius: 6px; padding: 10px 12px; }
      .adh-mono { font-family: var(--font-mono); font-size: 12px; color: var(--ink); }
      @media (max-width: 640px) { .adh-rowlabel { width: 64px; } }

      .adh-board { display: grid; gap: 3px; grid-template-columns: 96px repeat(14, minmax(0, 1fr)); position: relative; }
      @media (max-width: 639px) { .adh-board { grid-template-columns: 52px repeat(14, minmax(0, 1fr)); gap: 2px; } }
      .adh-colnum { font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-50); text-align: center; line-height: 1; padding-bottom: 4px; }
      .adh-flabel { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-70); display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; text-align: right; line-height: 1.1; }
      @media (max-width: 639px) { .adh-flabel { font-size: 8px; padding-right: 4px; } }
      .adh-bcell { aspect-ratio: 1 / 1; border-radius: 3px; background: ${PAL.empty}; box-shadow: inset 0 1px 0 rgba(255,255,255,0.4); will-change: transform, background-color; }
      .adh-agent { position: absolute; top: 0; left: 0; width: 56px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-family: var(--font-serif, Georgia, serif); font-style: italic; font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase; opacity: 0; pointer-events: none; will-change: transform, opacity; z-index: 6; }
      .adh-agent-builder { background: ${PAL.edit}; color: #fff; box-shadow: 0 8px 24px rgba(216,84,31,0.35); }
      .adh-agent-antidrift { background: #16120e; color: #7fb5dd; box-shadow: 0 8px 24px rgba(46,111,166,0.25); border: 1px solid rgba(46,111,166,0.5); }
      .adh-beam { position: absolute; top: 0; bottom: 0; width: 28px; background: linear-gradient(90deg, transparent, rgba(46,111,166,0.35), transparent); pointer-events: none; opacity: 0; will-change: transform, opacity; z-index: 4; }
      .adh-tray { display: flex; flex-direction: column; gap: 6px; }
      .adh-ticket { border: 1px solid var(--rule); border-left: 3px solid ${PAL.drift}; background: #fff; padding: 6px 8px; border-radius: 4px; font-size: 10.5px; font-family: var(--font-mono); will-change: transform, opacity; }
      .adh-cyc { width: 8px; height: 8px; border-radius: 50%; background: ${PAL.empty}; display: inline-block; }
      .adh-cyc.active { background: ${PAL.edit}; }
      .adh-cyc.sweep { background: ${PAL.scan}; box-shadow: 0 0 0 3px rgba(46,111,166,0.2); }
      .adh-tk-enter-active, .adh-tk-leave-active { transition: opacity 280ms ease-out, transform 280ms ease-out; }
      .adh-tk-enter-from { opacity: 0; transform: translateY(-8px); }
      .adh-tk-leave-to { opacity: 0; transform: translateY(8px); }
      @media (prefers-reduced-motion: reduce) { .adh-cell, .adh-bcell, .adh-agent, .adh-beam, .adh-ticket { transition: none !important; animation: none !important; } }
    `;
    const style = document.createElement('style');
    style.id = 'of1cj-visual-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  W.VWof1cj = { h, PAL, CHAIN, prefersReducedMotion, spawnPing, flyTicket, heatColor, legendDot, locale, onReady };
})();
