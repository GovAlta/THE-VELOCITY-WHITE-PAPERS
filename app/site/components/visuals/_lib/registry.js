/* Visuals registry — central dispatch for slide.visual and figure.chart.kind.

   Two classifications:

   REUSABLE  — parameterized components that work for any paper or article.
               Registered in window.VWVisuals.reusable. Examples:
                 tile-heatmap, eval-matrix, commit-timeline, stat, list, quote,
                 title, image, compare, chart, custom.
               These are loaded eagerly by index.html and always available.

   BESPOKE   — one-off visuals tied to a specific paper or architecture article.
               Registered in window.VWVisuals.bespoke[<owner_id>][<name>].
               Loaded lazily when that paper page is open (via paper.bespoke_scripts
               array in the content JSON). Naming convention:
                 components/visuals/bespoke/<owner_id>/<name>.js

   Slide author chooses by setting slide.visual to one of:
       - a reusable key, e.g. "tile-heatmap"
       - a bespoke key prefixed with the owner id, e.g. "arch-adhd-harness:walker-sim"

   PresentationStage and BlockRenderer both call VWVisuals.resolve(key, ownerId)
   which returns the component name to mount, or null for a fallback. */

(function () {
  const W = window;
  W.VWVisuals = W.VWVisuals || { reusable: {}, bespoke: {} };

  /* Track which window.VWComponents keys have been pushed into the Vue app.
     Lazy-loaded bespoke visual scripts add entries to VWComponents after app
     mount, so we need to register them onto the live app instance as they
     arrive. attachApp() captures the app and back-fills everything that is
     present at mount time; _syncToApp() picks up anything that lands later. */
  const _registered = new Set();
  let _vueApp = null;

  function _syncToApp() {
    if (!_vueApp) return;
    const reg = W.VWComponents || {};
    Object.keys(reg).forEach((k) => {
      if (_registered.has(k)) return;
      try { _vueApp.component(k, reg[k]); } catch (e) { /* swallow re-register warns */ }
      _registered.add(k);
    });
  }

  W.VWVisuals.attachApp = function (app) {
    _vueApp = app;
    _syncToApp();
  };

  /* Register a reusable visual component name. The component itself is
     registered on the Vue app via window.VWComponents. Calling this just
     marks the key as reusable for resolve() decisions and tooling. */
  W.VWVisuals.registerReusable = function (key, componentName) {
    W.VWVisuals.reusable[key] = componentName || key;
  };

  /* Register a bespoke visual for a specific owner (paper / article id). */
  W.VWVisuals.registerBespoke = function (ownerId, key, componentName) {
    W.VWVisuals.bespoke[ownerId] = W.VWVisuals.bespoke[ownerId] || {};
    W.VWVisuals.bespoke[ownerId][key] = componentName || (ownerId + '-' + key);
  };

  /* Resolve a slide.visual / chart.kind to a component name. Returns null
     if the key is unknown, so the stage can render the fallback. */
  W.VWVisuals.resolve = function (key, ownerId) {
    if (!key) return null;
    if (key.indexOf(':') !== -1) {
      const [owner, name] = key.split(':');
      const m = (W.VWVisuals.bespoke[owner] || {})[name];
      return m || null;
    }
    if (W.VWVisuals.reusable[key]) return W.VWVisuals.reusable[key];
    if (ownerId && W.VWVisuals.bespoke[ownerId] && W.VWVisuals.bespoke[ownerId][key]) {
      return W.VWVisuals.bespoke[ownerId][key];
    }
    return null;
  };

  /* Convenience: list everything for a debug panel. */
  W.VWVisuals.list = function () {
    return {
      reusable: { ...W.VWVisuals.reusable },
      bespoke:  Object.fromEntries(Object.entries(W.VWVisuals.bespoke).map(([k, v]) => [k, { ...v }])),
    };
  };

  /* Lazy-load a script tag for a bespoke visual file. Returns a promise.
     Used when a paper detail page opens and needs paper-specific visuals. */
  W.VWVisuals.loadScript = function (src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-vw-visual="' + src + '"]');
      if (existing) { existing.dataset.vwResolved === '1' ? resolve() : existing.addEventListener('load', () => resolve()); return; }
      const s = document.createElement('script');
      s.src = src;
      s.dataset.vwVisual = src;
      s.onload  = () => {
        s.dataset.vwResolved = '1';
        _syncToApp();
        resolve();
      };
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  };

  /* Convenience: load all bespoke_scripts declared on a paper. */
  W.VWVisuals.loadBespokeFor = async function (paper) {
    const arr = paper && paper.bespoke_scripts;
    if (!Array.isArray(arr) || !arr.length) return;
    for (const src of arr) {
      try { await W.VWVisuals.loadScript(src); }
      catch (e) { console.warn('[visuals] failed to load ' + src + ':', e.message); }
    }
  };
})();
