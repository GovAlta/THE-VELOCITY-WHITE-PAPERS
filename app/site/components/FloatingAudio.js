/* FloatingAudio — a page-level quick control for the long-form narration.

   Fully decoupled from AudioPlayer: it never imports or wraps it. Media
   `play` / `pause` events do not bubble, but they DO fire during the capture
   phase, so a single document-level capture listener catches playback from the
   narration <audio> wherever it sits on the page. The control then drives that
   same element programmatically (el.play() / el.pause()), so the existing
   player's layout is untouched.

   Behaviour:
   - Hidden until the reader interacts with the narration player (play/pause).
   - Shows a small fixed control (bottom-right) with Play/Pause and Close.
   - Close hides it until the next interaction with the player re-shows it.
   - In edit mode it sits above the editor toolbar so the edit button stays
     fully visible.

   Only the long-form narration is targeted: that <audio> lives inside
   `.audio-block`. The TL;DR presentation player uses a detached `new Audio()`
   whose events never reach the document, so it is naturally excluded. */

(function () {
  window.VWComponents = window.VWComponents || {};

  function isNarration(el) {
    return el && el.tagName === 'AUDIO' && typeof el.closest === 'function' && el.closest('.audio-block');
  }

  window.VWComponents['floating-audio'] = {
    data() { return { audioEl: null, visible: false, playing: false }; },
    watch: {
      /* Let the editor toolbar lift out of the way only while we're shown. */
      visible(v) { document.body.classList.toggle('vw-narration-fab', !!v); },
    },
    mounted() {
      this._onPlay  = (e) => this.onActivity(e, true);
      this._onPause = (e) => this.onActivity(e, false);
      this._onEnded = (e) => { if (e.target === this.audioEl) this.playing = false; };
      this._onHash  = () => this.reset();
      /* Capture phase: media events don't bubble but do propagate down. */
      document.addEventListener('play',  this._onPlay,  true);
      document.addEventListener('pause', this._onPause, true);
      document.addEventListener('ended', this._onEnded, true);
      window.addEventListener('hashchange', this._onHash);
    },
    beforeUnmount() {
      document.removeEventListener('play',  this._onPlay,  true);
      document.removeEventListener('pause', this._onPause, true);
      document.removeEventListener('ended', this._onEnded, true);
      window.removeEventListener('hashchange', this._onHash);
      document.body.classList.remove('vw-narration-fab');
    },
    methods: {
      /* Any interaction with the narration player adopts that element, syncs
         the play state, and re-shows the control (clearing a prior Close). */
      onActivity(e, playing) {
        if (!isNarration(e.target)) return;
        this.audioEl = e.target;
        this.playing = playing;
        this.visible = true;
      },
      toggle() {
        const a = this.audioEl;
        if (!a || !a.isConnected) return;
        if (a.paused) { a.play().catch(() => {}); } else { a.pause(); }
      },
      close() { this.visible = false; },
      reset() { this.visible = false; this.playing = false; this.audioEl = null; },
    },
    template: `
      <div class="vw-fab-audio"
           v-if="visible && audioEl" role="group" aria-label="Narration controls">
        <button type="button" class="vw-fab-btn vw-fab-toggle" @click="toggle"
                :aria-label="playing ? 'Pause narration' : 'Play narration'"
                :aria-pressed="playing ? 'true' : 'false'">
          <svg v-if="playing" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
            <rect x="6" y="5" width="4" height="14" rx="1"></rect>
            <rect x="14" y="5" width="4" height="14" rx="1"></rect>
          </svg>
          <svg v-else viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
            <path d="M8 5.5v13l11-6.5z"></path>
          </svg>
        </button>
        <button type="button" class="vw-fab-btn vw-fab-close" @click="close" aria-label="Hide narration controls">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"></path>
          </svg>
        </button>
      </div>
    `,
  };
})();
