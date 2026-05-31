/* AudioPlayer — narration of a paper, served as a static MP3
   produced by scripts/generate-audio.mjs. Gracefully hides if the
   file does not yet exist (HEAD request on mount). */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['audio-player'] = {
    props: {
      src:   { type: String, required: true },
      label: { type: String, default: 'Listen' },
    },
    data() { return { available: false }; },
    async mounted() {
      try {
        const res = await fetch(this.src, { method: 'HEAD' });
        this.available = res.ok;
      } catch { this.available = false; }
    },
    template: `
      <div class="audio-block" v-if="available">
        <span class="lbl">{{ label }}</span>
        <audio :src="src" controls preload="metadata"></audio>
      </div>
    `,
  };
})();
