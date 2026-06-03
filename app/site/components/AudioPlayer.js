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
    data() { return { available: false, duration: 0, rate: 1, regenerating: false, msg: '', fixing: false, durationKnown: false }; },
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
    },
    methods: {
      fmt(s) {
        if (!s || !isFinite(s)) return '0:00';
        const m = Math.floor(s / 60), sec = Math.floor(s % 60);
        return m + ':' + (sec < 10 ? '0' : '') + sec;
      },
      onMeta(e) { this.resolveDuration(e.target); e.target.playbackRate = this.rate; },
      /* The narration MP3 is several per-paragraph clips concatenated, so its
         header has no valid total length and the browser reports duration as
         Infinity. Seeking past the end forces a scan to the real end; once the
         browser knows it, we read the duration and reset to the start. */
      resolveDuration(a) {
        /* Run at most once. The browser can re-report duration as Infinity for
           this concatenated MP3 (notably when playback starts), and re-running
           the seek-to-end probe would reset the playhead and clobber a seek the
           user just made. Once we know the real duration, never touch it again. */
        if (this.durationKnown) return;
        if (isFinite(a.duration) && a.duration > 0) { this.duration = a.duration; this.durationKnown = true; return; }
        if (this.fixing) return;
        this.fixing = true;
        const onChange = () => {
          if (isFinite(a.duration) && a.duration > 0) {
            this.duration = a.duration;
            this.durationKnown = true;
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
      applyRate() { if (this.$refs.audio) this.$refs.audio.playbackRate = this.rate; },
      async regen() {
        if (!this.edit || this.regenerating) return;
        const paper = this.paper || (this.edit && this.edit.current);
        if (!paper) { this.msg = 'No paper loaded to narrate.'; return; }
        this.regenerating = true; this.msg = '';
        const r = await this.edit.generateNarration(paper);
        this.regenerating = false;
        if (r && r.ok) { this.available = true; this.msg = 'Narration regenerated.'; }
        else { this.msg = (r && r.error) || 'Regeneration failed.'; }
      },
    },
    template: `
      <div class="audio-block" v-if="available || editing">
        <span class="lbl">{{ label }}</span>
        <div class="vw-audio-row" v-if="available">
          <audio ref="audio" :src="displaySrc" controls preload="auto" @loadedmetadata="onMeta" @durationchange="onMeta"></audio>
          <div class="vw-audio-tools">
            <label class="vw-audio-rate">
              <span class="sr-only">Playback speed</span>
              <select v-model.number="rate" @change="applyRate" aria-label="Playback speed">
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
            {{ regenerating ? 'Regenerating…' : (available ? 'Regenerate narration' : 'Generate narration') }}
          </button>
          <span class="vw-gen-hint">runs via <code>npm run edit</code></span>
          <span v-if="msg" class="vw-muted">{{ msg }}</span>
        </div>
      </div>
    `,
  };
})();
