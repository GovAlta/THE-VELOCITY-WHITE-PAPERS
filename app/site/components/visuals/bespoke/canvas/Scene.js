/* canvas:scene — an interactive node-graph diagram for one Solution Landscape
   scene, drawn from the shared dataset. Nodes are draggable; the stage pans and
   zooms; a minimap and fit control orient the view; clicking a node opens an
   inspector. Bilingual, responsive, accessible (the narrative is the SVG
   aria-label + sr-only caption). Embed in any paper with:
       chart: { kind: "canvas:scene", scene: "factory" }   */

(function () {
  const C = window.VWCanvas;
  if (!C) return;
  const h = C.h;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  window.VWComponents = window.VWComponents || {};
  window.VWComponents['canvas-scene'] = {
    props: {
      kind: { type: String, default: '' },
      scene: { type: String, default: '' },
      config: { type: Object, default: null },
      audio: { type: [Boolean, String], default: false },
    },
    data() { return { dataset: null, nodes: [], tx: 0, ty: 0, z: 1, dragId: null, panning: false, selected: null, playing: false, _px: 0, _py: 0, _otx: 0, _oty: 0, _onx: 0, _ony: 0, _moved: false }; },
    computed: {
      loc() { return (window.VWStore && window.VWStore.locale) === 'fr' ? 'fr' : 'en'; },
      L() {
        return this.loc === 'fr'
          ? { zoomin: 'Zoom avant', zoomout: 'Zoom arrière', fit: 'Ajuster', close: 'Fermer', listen: 'Écouter', pause: 'Pause', hint: 'glissez les nœuds · molette pour zoomer · cliquez un nœud', loading: 'Chargement du canevas…' }
          : { zoomin: 'Zoom in', zoomout: 'Zoom out', fit: 'Fit', close: 'Close', listen: 'Listen', pause: 'Pause', hint: 'drag nodes · scroll to zoom · click a node', loading: 'Loading canvas…' };
      },
      sceneObj() {
        if (this.config && this.config.graph) return this.config;
        if (!this.dataset) return null;
        return (this.dataset.scenes || []).find(s => s.id === this.scene) || null;
      },
      graph() { return (this.sceneObj && this.sceneObj.graph) || { nodes: [], edges: [], groups: [] }; },
      nodeMap() { const m = {}; this.nodes.forEach(n => { m[n.id] = n; }); return m; },
      edgesR() {
        return (this.graph.edges || []).map(e => {
          const a = this.nodeMap[e.from], b = this.nodeMap[e.to];
          if (!a || !b) return null;
          return { from: e.from, to: e.to, label: e.label, kind: e.kind, animated: e.animated, ap: C.anchors(a, b, e.dir) };
        }).filter(Boolean);
      },
      animKey() { return (this.sceneObj ? this.sceneObj.id : '') + ':' + this.loc; },
      panStyle() { return 'transform: translate(' + this.tx + 'px,' + this.ty + 'px) scale(' + this.z + ');'; },
      sceneId() { return (this.sceneObj && this.sceneObj.id) || this.scene; },
      audioSrc() { return 'public/audio/' + this.loc + '/canvas/' + this.sceneId + '.mp3'; },
    },
    watch: { animKey() { this.rebuild(); } },
    created() { C.loadData().then(d => { this.dataset = d; this.rebuild(); }).catch(() => {}); },
    mounted() { this.rebuild(); },
    beforeUnmount() { this.kill(); this.pauseAudio(); },
    methods: {
      kill() { if (this.tl) { try { this.tl.kill(); } catch (e) {} this.tl = null; } },
      rebuild() {
        const g = this.graph;
        this.nodes = (g.nodes || []).map(n => Object.assign({}, n));
        this.selected = null;
        this.pauseAudio();
        this.$nextTick(() => { this.fit(); this.startAgents(); });
      },
      svgEl() { return this.$el && this.$el.querySelector ? this.$el.querySelector('svg') : null; },
      pxToSvg() { const s = this.svgEl(); const w = s ? s.getBoundingClientRect().width : 0; return w ? (C.VB_W / w) : 1; },
      fit() {
        if (!this.nodes.length) { this.tx = 0; this.ty = 0; this.z = 1; return; }
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        this.nodes.forEach(n => { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x + C.nw(n)); y1 = Math.max(y1, n.y + C.nh(n)); });
        (this.graph.groups || []).forEach(g => { x0 = Math.min(x0, g.x); y0 = Math.min(y0, g.y); x1 = Math.max(x1, g.x + g.w); y1 = Math.max(y1, g.y + g.h); });
        const w = x1 - x0, hh = y1 - y0, pad = 60;
        this.z = clamp(Math.min((C.VB_W - pad) / w, (C.VB_H - pad) / hh), 0.3, 1.6);
        this.tx = (C.VB_W - w * this.z) / 2 - x0 * this.z;
        this.ty = (C.VB_H - hh * this.z) / 2 - y0 * this.z;
      },
      zoom(f) { const z2 = clamp(this.z * f, 0.3, 3.5); const cx = C.VB_W / 2, cy = C.VB_H / 2; this.tx = cx - (cx - this.tx) * (z2 / this.z); this.ty = cy - (cy - this.ty) * (z2 / this.z); this.z = z2; },
      onWheel(e) {
        const s = this.svgEl(); if (!s) return; const r = s.getBoundingClientRect(); const k = this.pxToSvg();
        const ux = (e.clientX - r.left) * k, uy = (e.clientY - r.top) * k;
        const f = e.deltaY < 0 ? 1.12 : 0.89; const z2 = clamp(this.z * f, 0.3, 3.5);
        this.tx = ux - (ux - this.tx) * (z2 / this.z); this.ty = uy - (uy - this.ty) * (z2 / this.z); this.z = z2;
      },
      onDown(e) {
        const k = this.pxToSvg(); this._px = e.clientX; this._py = e.clientY; this._moved = false;
        const nodeEl = e.target.closest ? e.target.closest('[data-node]') : null;
        if (nodeEl) { this.dragId = nodeEl.getAttribute('data-node'); const n = this.nodeMap[this.dragId]; this._onx = n ? n.x : 0; this._ony = n ? n.y : 0; }
        else { this.panning = true; this._otx = this.tx; this._oty = this.ty; }
        if (e.target.setPointerCapture) { try { e.target.setPointerCapture(e.pointerId); } catch (x) {} }
      },
      onMove(e) {
        if (!this.dragId && !this.panning) return;
        const k = this.pxToSvg(); const dx = (e.clientX - this._px) * k, dy = (e.clientY - this._py) * k;
        if (Math.abs(e.clientX - this._px) + Math.abs(e.clientY - this._py) > 4) this._moved = true;
        if (this.dragId) { const n = this.nodeMap[this.dragId]; if (n) { n.x = this._onx + dx / this.z; n.y = this._ony + dy / this.z; } }
        else { this.tx = this._otx + dx; this.ty = this._oty + dy; }
      },
      onUp() {
        if (this.dragId && !this._moved) { const n = this.nodeMap[this.dragId]; if (n) this.selected = n; }
        else if (this.panning && !this._moved) { this.selected = null; }
        this.dragId = null; this.panning = false;
      },
      startAgents() {
        this.kill();
        const svg = this.svgEl(); if (!svg) return;
        const aps = this.edgesR.filter(e => e.animated).map(e => e.ap);
        if (aps.length) this.tl = C.animateAgents(svg, aps, C.PAL.rust);
      },
      tt(v) { return C.t(v, this.loc); },
      pauseAudio() { const el = this.$refs.audioEl; if (el) { try { el.pause(); } catch (e) {} } this.playing = false; },
      toggleAudio() { const el = this.$refs.audioEl; if (!el) return; if (this.playing) { el.pause(); this.playing = false; } else { el.play().then(() => { this.playing = true; }).catch(() => { this.playing = false; }); } },
    },
    render() {
      if (!this.dataset && !this.sceneObj) return h('div', { class: 'cv-fig' }, [h('div', { style: 'padding:28px;text-align:center;color:var(--ink-50);font-size:12px;font-family:var(--font-mono);' }, this.L.loading)]);
      const so = this.sceneObj;
      if (!so) return h('div', { class: 'cv-fig' }, [h('div', { style: 'padding:28px;color:var(--highlight);font-size:12px;' }, 'Scene not found: ' + this.scene)]);
      const loc = this.loc, narr = C.t(so.narrative, loc);

      const inner = [C.defs()];
      (this.graph.groups || []).forEach(g => inner.push(C.drawGroup(g, loc)));
      this.edgesR.forEach(e => inner.push(C.drawEdge(e, loc)));
      this.nodes.forEach(n => inner.push(C.drawNode(n, loc, this.selected && this.selected.id === n.id)));
      const animated = this.edgesR.filter(e => e.animated);
      animated.forEach((e, i) => inner.push(h('g', { 'data-agent': i, opacity: 0 }, [h('circle', { r: 8, fill: C.PAL.rust, stroke: '#fff', 'stroke-width': 2 })])));

      const svg = h('svg', { ref: 'svg', class: 'cv-svg', viewBox: '0 0 ' + C.VB_W + ' ' + C.VB_H, role: 'img', 'aria-label': narr, preserveAspectRatio: 'xMidYMid meet' }, [
        h('g', { style: this.panStyle }, inner),
      ]);

      /* minimap */
      const mmW = 168, mmH = 108, ms = Math.min(mmW / C.VB_W, mmH / C.VB_H);
      const mmNodes = this.nodes.map(n => h('rect', { x: n.x * ms, y: n.y * ms, width: C.nw(n) * ms, height: C.nh(n) * ms, rx: 1.5, fill: (C.TYPE[n.type] || C.TYPE.system).c, opacity: 0.7 }));
      const vx = (-this.tx / this.z) * ms, vy = (-this.ty / this.z) * ms, vw = (C.VB_W / this.z) * ms, vh = (C.VB_H / this.z) * ms;
      mmNodes.push(h('rect', { x: vx, y: vy, width: vw, height: vh, fill: 'none', stroke: C.PAL.rust, 'stroke-width': 1.5 }));
      const mini = h('div', { class: 'cv-mini' }, [h('svg', { width: mmW, height: mmH, viewBox: '0 0 ' + mmW + ' ' + mmH }, mmNodes)]);

      const ctrls = h('div', { class: 'cv-ctrls' }, [
        h('button', { class: 'cv-btn', onClick: () => this.zoom(1.2), 'aria-label': this.L.zoomin }, '+'),
        h('button', { class: 'cv-btn', onClick: () => this.zoom(0.83), 'aria-label': this.L.zoomout }, '−'),
        h('button', { class: 'cv-btn', onClick: () => this.fit(), 'aria-label': this.L.fit, title: this.L.fit }, '⤢'),
      ]);

      const overlays = [mini, ctrls, h('div', { class: 'cv-hint' }, this.L.hint)];
      if (this.selected) {
        const n = this.selected, ty = C.TYPE[n.type] || C.TYPE.system;
        overlays.push(h('div', { class: 'cv-inspect' }, [
          h('button', { class: 'cv-x', onClick: () => { this.selected = null; }, 'aria-label': this.L.close }, '×'),
          h('div', { class: 'cv-itype' }, (C.t(n.typeLabel, loc) || ty.t).toUpperCase()),
          h('h4', {}, C.t(n.label, loc)),
          h('p', {}, C.t(n.detail, loc) || C.t(n.sub, loc) || ''),
        ]));
      }

      const stage = h('div', {
        class: ['cv-stage', this.panning || this.dragId ? 'cv-grab' : ''],
        onWheel: (e) => { e.preventDefault(); this.onWheel(e); },
        onPointerdown: this.onDown, onPointermove: this.onMove, onPointerup: this.onUp, onPointerleave: this.onUp,
        onDblclick: () => this.fit(),
      }, [svg].concat(overlays));

      const children = [stage];
      if (this.audio) {
        children.push(h('div', { style: 'display:flex;align-items:center;gap:10px;padding:9px 12px;border-top:1px solid var(--rule);font-family:var(--font-mono);' }, [
          h('span', { style: 'font-family:var(--font-serif, Georgia, serif);font-style:italic;font-size:13px;color:var(--accent);' }, C.t(so.title, loc)),
          h('span', { style: 'flex:1 1 auto;' }),
          h('button', { class: 'cv-btn', onClick: () => this.toggleAudio() }, this.playing ? this.L.pause : this.L.listen),
          h('audio', { ref: 'audioEl', src: this.audioSrc, onEnded: () => { this.playing = false; }, preload: 'none' }),
        ]));
      }
      children.push(h('span', { class: 'cv-sr' }, narr));
      return h('div', { class: 'cv-fig' }, children);
    },
  };
  if (window.VWVisuals) window.VWVisuals.registerBespoke('canvas', 'scene', 'canvas-scene');
})();
