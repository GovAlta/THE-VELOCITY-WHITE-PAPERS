/* Shared animation utilities for visual components.
   No external dependencies. Honors prefers-reduced-motion. */

(function () {
  const W = window;
  W.VWAnim = W.VWAnim || {};

  /* Honor user motion preferences. */
  W.VWAnim.prefersReducedMotion = (typeof matchMedia === 'function')
    ? matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  /* spawnPing — emit an absolutely-positioned ring on rootEl, centred on
     targetEl, that scales and fades. Pure CSS animation, no GSAP. */
  W.VWAnim.spawnPing = function (rootEl, targetEl, color, scale) {
    if (W.VWAnim.prefersReducedMotion) return;
    if (!rootEl || !targetEl) return;
    const r = targetEl.getBoundingClientRect();
    const root = rootEl.getBoundingClientRect();
    const x = r.left - root.left + r.width / 2;
    const y = r.top  - root.top  + r.height / 2;
    const ping = document.createElement('div');
    ping.className = 'vw-ping';
    ping.style.cssText = [
      'position:absolute',
      'left:' + (x - 10) + 'px',
      'top:'  + (y - 10) + 'px',
      'width:20px',
      'height:20px',
      'border:2px solid ' + (color || 'var(--highlight)'),
      'border-radius:50%',
      'pointer-events:none',
      'transform:scale(0.4)',
      'opacity:1',
      'animation:vw-ping ' + (700) + 'ms ease-out forwards',
      '--vw-ping-scale:' + (scale || 4)
    ].join(';');
    rootEl.appendChild(ping);
    setTimeout(() => ping.remove(), 750);
  };

  /* flyTicket — animate a transient ticket card from fromEl to toEl, both
     inside rootEl. Drops into the toEl when done. */
  W.VWAnim.flyTicket = function (rootEl, fromEl, toEl, text, color) {
    if (!rootEl || !fromEl || !toEl) return;
    const root = rootEl.getBoundingClientRect();
    const a = fromEl.getBoundingClientRect();
    const b = toEl.getBoundingClientRect();
    const ticket = document.createElement('div');
    ticket.className = 'vw-fly-ticket';
    ticket.textContent = text || '';
    ticket.style.cssText = [
      'position:absolute',
      'left:' + (a.left - root.left + a.width / 2 - 60) + 'px',
      'top:'  + (a.top  - root.top  + a.height / 2 - 12) + 'px',
      'width:120px',
      'padding:6px 8px',
      'font-family:var(--font-mono)',
      'font-size:10px',
      'background:' + (color || 'var(--paper)'),
      'border:1px solid var(--rule-strong)',
      'pointer-events:none',
      'z-index:50',
      'transition:transform 600ms cubic-bezier(.2,.7,.2,1), opacity 600ms ease-out'
    ].join(';');
    rootEl.appendChild(ticket);
    // Force layout, then animate to destination
    requestAnimationFrame(() => {
      const dx = (b.left - root.left + b.width / 2 - 60) - (a.left - root.left + a.width / 2 - 60);
      const dy = (b.top  - root.top  + b.height / 2 - 12) - (a.top - root.top + a.height / 2 - 12);
      ticket.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      ticket.style.opacity = '0.9';
    });
    setTimeout(() => ticket.remove(), 650);
  };

  /* heatColor — thermal gradient. t in [0,1]. Returns rgb(...) string. */
  W.VWAnim.heatColor = function (t) {
    t = Math.max(0, Math.min(1, t));
    const stops = [
      [0.00, [26, 20, 16]],
      [0.40, [70, 38, 30]],
      [0.70, [194, 73, 26]],
      [1.00, [255, 195, 80]],
    ];
    for (let i = 0; i < stops.length - 1; i++) {
      const [t0, c0] = stops[i], [t1, c1] = stops[i + 1];
      if (t <= t1) {
        const k = (t - t0) / (t1 - t0);
        const r = Math.round(c0[0] + k * (c1[0] - c0[0]));
        const g = Math.round(c0[1] + k * (c1[1] - c0[1]));
        const b = Math.round(c0[2] + k * (c1[2] - c0[2]));
        return 'rgb(' + r + ',' + g + ',' + b + ')';
      }
    }
    return 'rgb(255,195,80)';
  };

  /* afterFontsAndPaint — convenience to wait for fonts + two RAFs before
     measuring layout. Used by mount() hooks of every visual. */
  W.VWAnim.afterFontsAndPaint = async function () {
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch {}
    }
    return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  };

  /* tween — minimal value tweener. No external dep. Cancels via returned fn. */
  W.VWAnim.tween = function (opts) {
    const { from = 0, to = 1, duration = 600, ease = 'easeOutCubic', onUpdate, onComplete } = opts;
    const easings = {
      linear:        t => t,
      easeOutCubic:  t => 1 - Math.pow(1 - t, 3),
      easeInOutCubic:t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2,
    };
    const easeFn = easings[ease] || easings.easeOutCubic;
    if (W.VWAnim.prefersReducedMotion) {
      onUpdate && onUpdate(to);
      onComplete && onComplete();
      return () => {};
    }
    const start = performance.now();
    let cancelled = false;
    function step(now) {
      if (cancelled) return;
      const k = Math.min(1, (now - start) / duration);
      const v = from + (to - from) * easeFn(k);
      onUpdate && onUpdate(v);
      if (k < 1) requestAnimationFrame(step);
      else onComplete && onComplete();
    }
    requestAnimationFrame(step);
    return () => { cancelled = true; };
  };
})();
