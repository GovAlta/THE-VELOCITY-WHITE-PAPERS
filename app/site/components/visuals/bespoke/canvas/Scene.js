/* canvas:scene — render a single Solution Landscape scene by id, from the
   shared dataset. Bilingual (reads VWStore.locale), responsive (fluid SVG
   viewBox), and accessible (the scene's narrative is the SVG aria-label and an
   sr-only caption). Embed in any paper with:
       chart: { kind: "canvas:scene", scene: "factory" }
   Requires the canvas bespoke_scripts (GSAP, _common, this file) on the page. */

(function () {
  const C = window.VWCanvas;
  if (!C) return;
  const h = C.h;

  window.VWComponents = window.VWComponents || {};
  window.VWComponents['canvas-scene'] = {
    props: {
      kind: { type: String, default: '' },
      scene: { type: String, default: '' },
      config: { type: Object, default: null },
    },
    data() { return { dataset: null }; },
    computed: {
      loc() { return (window.VWStore && window.VWStore.locale) === 'fr' ? 'fr' : 'en'; },
      sceneObj() {
        if (this.config && this.config.kind) return this.config;
        if (!this.dataset) return null;
        return (this.dataset.scenes || []).find(s => s.id === this.scene) || null;
      },
      animKey() { return (this.sceneObj ? this.sceneObj.id : '') + ':' + this.loc; },
    },
    watch: { animKey() { this.$nextTick(() => this.animate()); } },
    created() { C.loadData().then(d => { this.dataset = d; }).catch(() => {}); },
    mounted() { this.$nextTick(() => this.animate()); },
    beforeUnmount() { this.kill(); },
    methods: {
      kill() { if (this.tl) { try { this.tl.kill(); } catch (e) {} this.tl = null; } },
      animate() {
        this.kill();
        const so = this.sceneObj;
        if (!so) return;
        const svg = this.$el && this.$el.querySelector ? this.$el.querySelector('svg') : null;
        if (!svg) return;
        const fn = C.ANIM[so.kind];
        if (fn) this.tl = fn(svg, so.spec || {});
      },
    },
    render() {
      const so = this.sceneObj;
      if (!this.dataset && !so) {
        return h('div', { class: 'cv-fig' }, [h('div', { style: 'padding:28px;text-align:center;color:var(--ink-50);font-size:12px;font-family:var(--font-mono);' }, 'Loading canvas…')]);
      }
      if (!so) {
        return h('div', { class: 'cv-fig' }, [h('div', { style: 'padding:28px;color:var(--highlight);font-size:12px;font-family:var(--font-mono);' }, 'Scene not found: ' + this.scene)]);
      }
      const loc = this.loc;
      const kids = (C.RENDER[so.kind] || (() => []))(so.spec || {}, loc);
      const narr = C.t(so.narrative, loc);
      return h('div', { class: 'cv-fig' }, [
        h('svg', { class: 'cv-svg', viewBox: '0 0 ' + C.VB_W + ' ' + C.VB_H, role: 'img', 'aria-label': narr, preserveAspectRatio: 'xMidYMid meet' }, kids),
        h('span', { class: 'cv-sr' }, narr),
      ]);
    },
  };
  if (window.VWVisuals) window.VWVisuals.registerBespoke('canvas', 'scene', 'canvas-scene');
})();
