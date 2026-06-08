/* canvas:tour — the Solution Landscape container. Sequences the interactive
   scene graphs with a chip selector and prev/next, opens them in a full-screen
   modal, lets a reader download any scene as JSON (take the architecture away),
   and plays or shows the per-scene narrative. Pan, zoom, node drag, minimap and
   inspector all live inside canvas:scene. Bilingual, mobile-responsive. Embed:
       chart: { kind: "canvas:tour" }   */

(function () {
  const C = window.VWCanvas;
  if (!C) return;

  window.VWComponents = window.VWComponents || {};
  window.VWComponents['canvas-tour'] = {
    props: { kind: { type: String, default: '' }, start: { type: Number, default: 0 } },
    data() { return { dataset: null, idx: this.start || 0, fs: false, playing: false, showNarr: false, _esc: null }; },
    computed: {
      loc() { return (window.VWStore && window.VWStore.locale) === 'fr' ? 'fr' : 'en'; },
      scenes() { return (this.dataset && this.dataset.scenes) || []; },
      scene() { return this.scenes[this.idx] || {}; },
      headTitle() { return this.dataset ? C.t(this.dataset.title, this.loc) : ''; },
      narrative() { return C.t(this.scene.narrative, this.loc); },
      audioSrc() { return 'public/audio/' + this.loc + '/canvas/' + this.scene.id + '.mp3'; },
      readLabel() { return this.loc === 'fr' ? 'Lire le livre →' : 'Read the source paper →'; },
    },
    watch: { idx() { this.pauseAudio(); } },
    created() { C.loadData().then(d => { this.dataset = d; }).catch(() => {}); },
    beforeUnmount() { this.pauseAudio(); if (this._esc) window.removeEventListener('keydown', this._esc); },
    methods: {
      tt(v) { return C.t(v, this.loc); },
      go(i) { this.idx = i; },
      next() { this.idx = (this.idx + 1) % (this.scenes.length || 1); },
      prev() { this.idx = (this.idx - 1 + (this.scenes.length || 1)) % (this.scenes.length || 1); },
      toggleFs() {
        this.fs = !this.fs;
        if (this.fs) { this._esc = (e) => { if (e.key === 'Escape') this.toggleFs(); }; window.addEventListener('keydown', this._esc); }
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
      toggleAudio() { const el = this.$refs.audio; if (!el) return; if (this.playing) { el.pause(); this.playing = false; } else { el.play().then(() => { this.playing = true; }).catch(() => { this.playing = false; }); } },
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
            <button class="cv-btn" @click="download" title="Download this architecture as JSON">Download</button>
            <button class="cv-btn" @click="toggleAudio">{{ playing ? 'Pause' : 'Listen' }}</button>
            <button class="cv-btn cv-primary" @click="toggleFs">{{ fs ? 'Close' : 'Expand' }}</button>
          </div>
          <div class="cv-body">
            <canvas-scene :scene="scene.id" :key="scene.id + ':' + (fs ? 'fs' : 'in')" />
          </div>
          <div class="cv-meta">
            <div class="cv-meta-head">
              <span class="cv-meta-title">{{ tt(scene.title) }}</span>
              <span class="cv-meta-paper" v-if="scene.paper">· <a :href="'/paper/' + scene.paper">{{ readLabel }}</a></span>
              <span class="cv-spacer"></span>
              <button class="cv-btn" @click="prev" aria-label="Previous scene">‹</button>
              <span style="font-size:11px;color:var(--ink-50);align-self:center;">{{ idx + 1 }} / {{ scenes.length }}</span>
              <button class="cv-btn" @click="next" aria-label="Next scene">›</button>
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
