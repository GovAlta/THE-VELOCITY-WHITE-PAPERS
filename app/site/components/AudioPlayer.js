/* AudioPlayer — full-paper narration, served as a static MP3 produced by
   scripts/generate-audio.mjs. Native controls handle play / seek / keyboard;
   we add an explicit total-duration readout, a download link, a playback-speed
   multiplier, and (in edit mode) a Regenerate button.

   Hides gracefully if the file does not exist yet, except in edit mode where it
   still offers a Generate button. The displayed URL carries a cache-bust query
   when the file was regenerated this session (store.assetBust), so a freshly
   generated narration plays without a page refresh. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['audio-player'] = {
    props: {
      src:   { type: String, required: true },
      label: { type: String, default: 'Listen' },
      paper: { type: Object, default: null },
    },
    setup() { return { edit: window.VWEdit || null, store: window.VWStore }; },
    data() { return { available: false, duration: 0, rate: 1, regenerating: false, msg: '', fixing: false }; },
    async mounted() {
      try { this.available = (await fetch(this.src, { method: 'HEAD' })).ok; }
      catch { this.available = false; }
    },
    computed: {
      editing() { return !!(this.edit && this.edit.enabled); },
      displaySrc() {
        const token = this.store && this.store.assetBust && this.store.assetBust[this.src];
        return token ? this.src + (this.src.includes('?') ? '&' : '?') + 'v=' + token : this.src;
      },
      downloadName() {
        const base = (this.src.split('/').pop() || 'narration.mp3').split('?')[0];
        return base;
      },
      /* Regenerate-button label. For a segmented paper, surface how many blocks
         are dirty so the author knows the run only re-narrates those. */
      regenLabel() {
        const p = this.paper || (this.edit && this.edit.current);
        const segmented = p && p.audio && Array.isArray(p.audio.segments) && p.audio.segments.length;
        if (segmented && this.edit && this.edit.dirtyCount) {
          const n = this.edit.dirtyCount();
          return n ? ('Regenerate changed audio (' + n + ')') : 'Regenerate changed audio';
        }
        return this.available ? 'Regenerate narration' : 'Generate narration';
      },
    },
    methods: {
      fmt(s) {
        if (!s || !isFinite(s)) return '0:00';
        const m = Math.floor(s / 60), sec = Math.floor(s % 60);
        return m + ':' + (sec < 10 ? '0' : '') + sec;
      },
      onMeta(e) { this.resolveDuration(e.target); e.target.playbackRate = this.store.playbackRate; },
      /* The narration MP3 is several per-paragraph clips concatenated, so its
         header has no valid total length and the browser reports duration as
         Infinity. Seeking past the end forces a scan to the real end; once the
         browser knows it, we read the duration and reset to the start. */
      resolveDuration(a) {
        if (isFinite(a.duration) && a.duration > 0) { this.duration = a.duration; return; }
        if (this.fixing) return;
        this.fixing = true;
        const onChange = () => {
          if (isFinite(a.duration) && a.duration > 0) {
            this.duration = a.duration;
            a.removeEventListener('durationchange', onChange);
            a.removeEventListener('timeupdate', onChange);
            try { a.currentTime = 0; } catch (_) {}
            this.fixing = false;
          }
        };
        a.addEventListener('durationchange', onChange);
        a.addEventListener('timeupdate', onChange);
        try { a.currentTime = 1e101; } catch (_) {}
      },
      applyRate() { if (this.$refs.audio) this.$refs.audio.playbackRate = this.store.playbackRate; },
      async regen() {
        if (!this.edit || this.regenerating) return;
        const paper = this.paper || (this.edit && this.edit.current);
        if (!paper) { this.msg = 'No paper loaded to narrate.'; return; }
        this.regenerating = true; this.msg = '';
        // Segmented papers regenerate only the changed blocks and re-stitch;
        // older papers fall back to a full re-narration.
        const segmented = paper.audio && Array.isArray(paper.audio.segments) && paper.audio.segments.length;
        const r = segmented
          ? await this.edit.regenerateChangedAudio(paper)
          : await this.edit.generateNarration(paper);
        this.regenerating = false;
        if (r && r.ok) { this.available = true; this.msg = this.edit.status || 'Narration regenerated.'; }
        else { this.msg = (r && r.error) || 'Regeneration failed.'; }
      },
      async stitch() {
        if (!this.edit || this.regenerating) return;
        const paper = this.paper || (this.edit && this.edit.current);
        if (!paper) { this.msg = 'No paper loaded.'; return; }
        this.regenerating = true; this.msg = '';
        const r = await this.edit.stitchAudio(paper);
        this.regenerating = false;
        if (r && r.ok) { this.available = true; this.msg = this.edit.status || 'Stitched.'; }
        else { this.msg = (r && r.error) || 'Stitch failed.'; }
      },
    },
    template: `
      <div class="audio-block" v-if="available || editing">
        <span class="lbl">{{ label }}</span>
        <div class="vw-audio-row" v-if="available">
          <audio ref="audio" :src="displaySrc" controls preload="metadata" @loadedmetadata="onMeta" @durationchange="onMeta"></audio>
          <div class="vw-audio-tools">
            <label class="vw-audio-rate">
              <span class="sr-only">Playback speed</span>
              <select v-model.number="store.playbackRate" @change="applyRate" aria-label="Playback speed">
                <option :value="1">1×</option>
                <option :value="1.25">1.25×</option>
                <option :value="1.5">1.5×</option>
                <option :value="2">2×</option>
              </select>
            </label>
            <span class="vw-audio-dur" v-if="duration">{{ fmt(duration) }}</span>
            <a class="vw-audio-dl" :href="src" :download="downloadName">Download</a>
          </div>
        </div>
        <div v-if="editing" class="vw-audio-edit">
          <button class="vw-gen-btn" @click="regen" :disabled="regenerating">
            {{ regenerating ? 'Regenerating…' : regenLabel }}
          </button>
          <button v-if="paper && paper.audio && paper.audio.segments && paper.audio.segments.length"
                  class="vw-edit-btn vw-stitch-btn" @click="stitch" :disabled="regenerating"
                  title="Rejoin all block segments into the full narration and update its length (no new synthesis)">Stitch</button>
          <span class="vw-gen-hint">runs via <code>npm run edit</code></span>
          <span v-if="msg" class="vw-muted">{{ msg }}</span>
        </div>
      </div>
    `,
  };
})();
