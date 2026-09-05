/* BlockAudio — a compact per-block narration player for edit mode.

   Plays a single block's narration segment (from paper.audio.segments) with
   play/pause, a scrub bar, and a time readout. It inherits the global narration
   speed set by the main audio control (store.playbackRate), and only one block
   plays at a time — starting one pauses any other. The segment's known duration
   (from the manifest) seeds the scrub range, so scrubbing works even though the
   concatenated MP3 header carries no total length.

   Usage (edit mode, per narratable block):
     <block-audio :src="segSrc(b.bid)" :dur="segDur(b.bid)" :bust="audioBust()" /> */

(function () {
  window.VWComponents = window.VWComponents || {};

  // Module-level: the block instance currently playing, so a new play() can stop it.
  let activeCmp = null;

  window.VWComponents['block-audio'] = {
    props: {
      src:  { type: String, default: '' },
      dur:  { type: Number, default: 0 },
      bust: { type: [Number, String], default: 0 },
    },
    setup() { return { store: window.VWStore }; },
    data() { return { playing: false, cur: 0, total: 0 }; },
    computed: {
      resolvedSrc() {
        if (!this.src) return '';
        return this.bust ? this.src + (this.src.includes('?') ? '&' : '?') + 'v=' + this.bust : this.src;
      },
      /* Prefer a duration the browser actually discovered; fall back to the
         manifest value so the scrub bar has a sane range immediately. */
      max() { return this.total || this.dur || 0; },
      rate() { return (this.store && this.store.playbackRate) || 1; },
    },
    watch: {
      rate(r) { const a = this.$refs.a; if (a) a.playbackRate = r; },
      // A regenerated segment (new src/bust) resets the transport.
      resolvedSrc() { this.cur = 0; this.total = 0; this.playing = false; },
    },
    methods: {
      fmt(s) {
        if (!s || !isFinite(s)) return '0:00';
        const m = Math.floor(s / 60), x = Math.floor(s % 60);
        return m + ':' + (x < 10 ? '0' : '') + x;
      },
      toggle() {
        if (!this.src) {
          if (window.VWEdit) window.VWEdit.status = 'No audio segment yet for this block — regenerate audio.';
          return;
        }
        const a = this.$refs.a;
        if (!a) return;
        if (this.playing) { a.pause(); return; }
        if (activeCmp && activeCmp !== this) activeCmp.stopExternal();
        activeCmp = this;
        a.playbackRate = this.rate;
        a.play().catch(() => {});
      },
      stopExternal() { const a = this.$refs.a; if (a) a.pause(); },
      onPlay() { this.playing = true; },
      onPause() { this.playing = false; },
      onTime() { const a = this.$refs.a; if (a) this.cur = a.currentTime || 0; },
      onMeta() { const a = this.$refs.a; if (a && isFinite(a.duration) && a.duration > 0) this.total = a.duration; },
      onEnded() { this.playing = false; this.cur = 0; },
      scrub(e) { const a = this.$refs.a; if (a) { a.currentTime = Number(e.target.value) || 0; this.cur = a.currentTime; } },
    },
    beforeUnmount() {
      if (activeCmp === this) activeCmp = null;
      const a = this.$refs.a; if (a) a.pause();
    },
    template: `
      <span class="vw-baudio" :class="{ 'vw-baudio-empty': !src, 'vw-baudio-on': playing }">
        <button class="vw-baudio-btn" @click="toggle"
                :aria-label="playing ? 'Pause this block' : 'Play this block'"
                :title="src ? '' : 'No segment yet — regenerate audio'">{{ playing ? '❚❚' : '▶' }}</button>
        <input class="vw-baudio-seek" type="range" min="0" :max="max || 0" step="0.1"
               :value="cur" @input="scrub" :disabled="!src" aria-label="Scrub block narration" />
        <span class="vw-baudio-time">{{ fmt(cur) }} / {{ fmt(max) }}</span>
        <audio ref="a" :src="resolvedSrc" preload="none"
               @play="onPlay" @pause="onPause" @timeupdate="onTime"
               @loadedmetadata="onMeta" @durationchange="onMeta" @ended="onEnded"></audio>
      </span>
    `,
  };
})();
