/* canvas:tour — the Solution Landscape container. Sequences the scenes with a
   chip selector and prev/next, a zoomable + pannable viewport, a full-screen
   toggle, a per-scene downloadable JSON (take the architecture away), and a
   narrative panel that doubles as the accessible description and the audio
   script. Bilingual and mobile-responsive. Embed with:
       chart: { kind: "canvas:tour" }   */

(function () {
  const C = window.VWCanvas;
  if (!C) return;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  window.VWComponents = window.VWComponents || {};
  window.VWComponents['canvas-tour'] = {
    props: { kind: { type: String, default: '' }, start: { type: Number, default: 0 } },
    data() {
      return { dataset: null, idx: this.start || 0, scale: 1, tx: 0, ty: 0, fs: false, dragging: false, showNarr: false, playing: false, _sx: 0, _sy: 0, _esc: null };
    },
    computed: {
      loc() { return (window.VWStore && window.VWStore.locale) === 'fr' ? 'fr' : 'en'; },
      scenes() { return (this.dataset && this.dataset.scenes) || []; },
      scene() { return this.scenes[this.idx] || {}; },
      headTitle() { return this.dataset ? C.t(this.dataset.title, this.loc) : ''; },
      narrative() { return C.t(this.scene.narrative, this.loc); },
      panStyle() { return 'transform: translate(' + this.tx + 'px,' + this.ty + 'px) scale(' + this.scale + ');'; },
      audioSrc() { return 'public/audio/' + this.loc + '/canvas/' + this.scene.id + '.mp3'; },
      readLabel() { return this.loc === 'fr' ? 'Lire le livre →' : 'Read the paper →'; },
    },
    watch: { idx() { this.pauseAudio(); this.resetView(); } },
    created() { C.loadData().then(d => { this.dataset = d; }).catch(() => {}); },
    beforeUnmount() { this.pauseAudio(); if (this._esc) window.removeEventListener('keydown', this._esc); },
    methods: {
      tt(v) { return C.t(v, this.loc); },
      go(i) { this.idx = i; },
      next() { this.idx = (this.idx + 1) % (this.scenes.length || 1); },
      prev() { this.idx = (this.idx - 1 + (this.scenes.length || 1)) % (this.scenes.length || 1); },
      zoom(d) { this.scale = clamp(this.scale * (d > 0 ? 1.15 : 0.87), 0.6, 3); },
      resetView() { this.scale = 1; this.tx = 0; this.ty = 0; },
      onWheel(e) { this.scale = clamp(this.scale * (e.deltaY < 0 ? 1.1 : 0.9), 0.6, 3); },
      onDown(e) { this.dragging = true; this._sx = e.clientX - this.tx; this._sy = e.clientY - this.ty; if (e.target.setPointerCapture) { try { e.target.setPointerCapture(e.pointerId); } catch (x) {} } },
      onMove(e) { if (!this.dragging) return; this.tx = e.clientX - this._sx; this.ty = e.clientY - this._sy; },
      onUp() { this.dragging = false; },
      toggleFs() {
        this.fs = !this.fs;
        this.resetView();
        if (this.fs) { this._esc = (e) => { if (e.key === 'Escape') { this.fs = false; window.removeEventListener('keydown', this._esc); this._esc = null; } }; window.addEventListener('keydown', this._esc); }
        else if (this._esc) { window.removeEventListener('keydown', this._esc); this._esc = null; }
      },
      download() {
        try {
          const blob = new Blob([JSON.stringify(this.scene, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = 'canvas-' + this.scene.id + '.json'; document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) {}
      },
      pauseAudio() { const el = this.$refs.audio; if (el) { try { el.pause(); } catch (x) {} } this.playing = false; },
      toggleAudio() {
        const el = this.$refs.audio; if (!el) return;
        if (this.playing) { el.pause(); this.playing = false; }
        else { el.play().then(() => { this.playing = true; }).catch(() => { this.playing = false; }); }
      },
    },
    template: `
      <div class="cv-fig">
        <div class="cv-frame" :class="{ 'cv-fs': fs }">
          <div class="cv-bar">
            <h3 class="cv-title">{{ headTitle }}</h3>
            <div class="cv-chips" role="tablist">
              <button v-for="(s, i) in scenes" :key="s.id" class="cv-chip" :class="{ active: i === idx }" @click="go(i)" :aria-selected="i === idx">{{ tt(s.title) }}</button>
            </div>
            <span class="cv-spacer"></span>
            <span class="cv-zoom">
              <button class="cv-btn" @click="zoom(-1)" aria-label="Zoom out">−</button>
              <button class="cv-btn" @click="resetView">Fit</button>
              <button class="cv-btn" @click="zoom(1)" aria-label="Zoom in">+</button>
            </span>
            <button class="cv-btn" @click="download" title="Download this architecture as JSON">Download</button>
            <button class="cv-btn" @click="toggleAudio">{{ playing ? 'Pause' : 'Listen' }}</button>
            <button class="cv-btn" @click="toggleFs">{{ fs ? 'Exit' : 'Expand' }}</button>
          </div>
          <div class="cv-viewport" :class="{ 'cv-grab': dragging }" ref="vp"
               @wheel.prevent="onWheel" @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointerleave="onUp" @dblclick="resetView">
            <div class="cv-pan" :style="panStyle">
              <canvas-scene :scene="scene.id" :key="scene.id" />
            </div>
          </div>
          <div class="cv-meta">
            <div class="cv-meta-head">
              <span class="cv-meta-title">{{ tt(scene.title) }}</span>
              <span class="cv-meta-paper" v-if="scene.paper">· <a :href="'/paper/' + scene.paper">{{ readLabel }}</a></span>
              <span class="cv-spacer"></span>
              <button class="cv-btn" @click="prev">‹</button>
              <span style="font-size:11px;color:var(--ink-50);align-self:center;">{{ idx + 1 }} / {{ scenes.length }}</span>
              <button class="cv-btn" @click="next">›</button>
            </div>
            <div class="cv-meta-blurb">{{ tt(scene.blurb) }}</div>
            <button class="cv-btn" style="margin-top:8px;" @click="showNarr = !showNarr">{{ showNarr ? 'Hide description' : 'Describe this canvas' }}</button>
            <p class="cv-narr" v-if="showNarr">{{ narrative }}</p>
            <audio ref="audio" :src="audioSrc" @ended="playing = false" preload="none"></audio>
          </div>
        </div>
      </div>
    `,
  };
  if (window.VWVisuals) window.VWVisuals.registerBespoke('canvas', 'tour', 'canvas-tour');
})();
