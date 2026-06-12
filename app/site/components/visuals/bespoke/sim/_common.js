/* Shared engine base for the Simulation player (owner: sim).

   A JSON-driven, narrated 2.5D simulation: data/sims/<id>.json declares the
   actors (simple geometric shapes), the chapters (bilingual narration + timed
   animation steps), and the camera moves. The Player renders the world as SVG,
   builds one GSAP timeline per chapter, and keeps it locked to the narration
   audio (the audio element is the master clock), so voice and motion never
   drift. Steps are declared at fractional times of the chapter (0..1) and the
   timeline is scaled to the real audio duration per locale.

   Different JSON = different simulation; the engine is content-free.
   Degrades without GSAP / with prefers-reduced-motion to a chapter-by-chapter
   static storyboard with the same narration audio and transcript. */

(function () {
  const W = window;
  if (W.VWSim) return;
  const h = W.Vue && W.Vue.h;

  const PAL = {
    ink: '#1A3A6E', accent: '#1A3A6E', accentSoft: '#2E5A9E', rust: '#B23F15',
    agent: '#D97A2B', agentDeep: '#B85C12',
    green: '#2f7a3f', gold: '#b8860b', purple: '#6b4fbf', teal: '#2e6fa6',
    paper: '#F7F4ED', paperAlt: '#EFEAD9', rule: '#D8D1C2', ruleStrong: '#B8AE99',
    ink50: '#5E5F66', ink70: '#3D3E45', white: '#ffffff', gray: '#9b958a',
  };

  const VB_W = 1920, VB_H = 1080;

  const prefersReducedMotion = (typeof matchMedia === 'function') && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gsapOK = () => typeof gsap !== 'undefined' && !prefersReducedMotion;
  function locale() { return (W.VWStore && W.VWStore.locale) === 'fr' ? 'fr' : 'en'; }
  function t(v, loc) { if (v == null) return ''; if (typeof v === 'string') return v; return v[loc || locale()] || v.en || ''; }

  const _cache = {};
  function loadData(simId) {
    if (_cache[simId]) return Promise.resolve(_cache[simId]);
    return fetch('data/sims/' + simId + '.json').then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' for sims/' + simId);
      return r.json();
    }).then(d => { _cache[simId] = d; return d; });
  }

  function wrap(s, n) {
    const words = String(s || '').split(/\s+/); const lines = []; let cur = '';
    words.forEach(w => { if ((cur + ' ' + w).trim().length > n) { if (cur) lines.push(cur); cur = w; } else { cur = (cur + ' ' + w).trim(); } });
    if (cur) lines.push(cur);
    return lines;
  }

  function fmtTime(s) {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ':' + String(r).padStart(2, '0');
  }

  if (!document.getElementById('sim-visual-styles')) {
    const css = `
      .sim-fig { width: 100%; margin: 0; font-family: var(--font-mono); }
      .sim-frame { border: 1px solid var(--rule-strong); background: var(--paper); border-radius: 10px; overflow: hidden; position: relative; display: flex; flex-direction: column; }
      .sim-frame.sim-fs { position: fixed; inset: 0; z-index: 9999; border-radius: 0; height: 100vh; height: 100dvh; }
      .sim-bar { display: flex; align-items: center; gap: 8px; padding: 9px 12px; border-bottom: 1px solid var(--rule); flex-wrap: wrap; background: var(--paper); }
      .sim-title { font-family: var(--font-serif, Georgia, serif); font-style: italic; font-size: 15px; color: var(--accent); margin: 0; }
      .sim-spacer { flex: 1 1 auto; }
      .sim-btn { font-size: 12px; border: 1px solid var(--rule-strong); background: var(--paper); color: var(--ink-70); border-radius: 6px; padding: 5px 10px; cursor: pointer; line-height: 1.1; }
      .sim-btn:hover { border-color: var(--accent); color: var(--accent); }
      .sim-btn.sim-primary { background: var(--accent); color: #fff; border-color: var(--accent); min-width: 74px; }
      .sim-btn:disabled { opacity: 0.45; cursor: default; }
      .sim-btn.on { background: var(--accent); color: #fff; border-color: var(--accent); }
      .sim-stage { position: relative; overflow: hidden; background: var(--paper); }
      .sim-svg { width: 100%; display: block; aspect-ratio: 16 / 9; background:
        radial-gradient(ellipse at 50% 42%, rgba(26,58,110,0.035), transparent 62%), var(--paper); }
      .sim-frame.sim-fs .sim-stage { flex: 1 1 auto; min-height: 0; display: flex; }
      .sim-frame.sim-fs .sim-svg { aspect-ratio: auto; height: 100%; width: 100%; }
      .sim-caption { position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%);
        max-width: min(720px, 86%); background: rgba(26,58,110,0.92); color: #fff; border-radius: 8px;
        padding: 9px 16px; font-family: var(--font-sans, system-ui); font-size: 14.5px; line-height: 1.45;
        text-align: center; pointer-events: none; box-shadow: 0 8px 26px rgba(0,0,0,0.18); }
      .sim-caption:empty { display: none; }
      .sim-chapters { display: flex; gap: 5px; flex-wrap: wrap; padding: 8px 12px; border-top: 1px solid var(--rule); background: var(--paper); }
      .sim-chip { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.04em; padding: 4px 9px; border: 1px solid var(--rule-strong); border-radius: 99px; background: var(--paper); color: var(--ink-70); cursor: pointer; line-height: 1.2; }
      .sim-chip.active { background: var(--accent); color: #fff; border-color: var(--accent); }
      .sim-chip.done { border-color: var(--accent); color: var(--accent); }
      .sim-transport { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-top: 1px solid var(--rule); background: var(--paper); }
      .sim-scrub { flex: 1 1 auto; accent-color: var(--accent); height: 4px; cursor: pointer; }
      .sim-time { font-size: 11px; color: var(--ink-50); min-width: 76px; text-align: right; }
      .sim-meta { padding: 12px 14px; border-top: 1px solid var(--rule); background: var(--paper); }
      .sim-meta-title { font-size: 14px; font-weight: 700; color: var(--ink); }
      .sim-meta-blurb { font-size: 13px; color: var(--ink-70); margin-top: 4px; line-height: 1.5; }
      .sim-narr { font-size: 12.5px; color: var(--ink-70); margin-top: 8px; line-height: 1.65; max-width: 78ch; }
      .sim-narr strong { color: var(--ink); }
      .sim-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
      .sim-static-note { position: absolute; left: 50%; top: 10px; transform: translateX(-50%); font-size: 10px; color: var(--ink-50); background: rgba(247,244,237,0.9); padding: 3px 10px; border-radius: 99px; pointer-events: none; }
      @media (max-width: 680px) {
        .sim-title { width: 100%; }
        .sim-time { display: none; }
        .sim-caption { font-size: 12.5px; bottom: 8px; }
      }
    `;
    const style = document.createElement('style');
    style.id = 'sim-visual-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  W.VWSim = { h, PAL, VB_W, VB_H, prefersReducedMotion, gsapOK, locale, t, loadData, wrap, fmtTime };
})();
