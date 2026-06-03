/* PresentationPlayer — reusable audio + visual slide player.

   Used for every paper's TL;DR presentation and any embedded in-body
   presentations. Self-contained: single Audio element, click-to-play stage,
   keyboard shortcuts, scrubber, TOC with has-media dots, cross-dissolve
   image transitions, friendly error states.

   Props:
     presentation       (Object, required) — full presentation JSON
     compact            (Boolean) — inline / hero card form
     auto_advance       (Boolean, default true)
     show_toc           (Boolean, default true) — top-right "All slides" button
     show_overall_bar   (Boolean, default true)
     show_text_panel    (Boolean, default true) — right-side title + text panel
*/

(function () {
  window.VWComponents = window.VWComponents || {};

  function fmtTime(s) {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ':' + String(r).padStart(2, '0');
  }

  window.VWComponents['presentation-player'] = {
    props: {
      presentation:     { type: Object, required: true },
      compact:          { type: Boolean, default: false },
      autoAdvance:      { type: Boolean, default: true },
      showToc:          { type: Boolean, default: true },
      showOverallBar:   { type: Boolean, default: true },
      showTextPanel:    { type: Boolean, default: true },
    },
    data() {
      return {
        index: 0,
        playing: false,
        currentTime: 0,
        duration: 0,
        scrubbing: false,
        autoOn: this.autoAdvance,
        error: null,
        tocOpen: false,
        audio: null,
        imageErrored: false,
        mediaReady: {},   // slide.id → true/false; populated by HEAD probes on mount
        uid: 'vp-' + Math.random().toString(36).slice(2, 9),
        releaseTocTrap: null,
        releaseTocEsc: null,
        tocTriggerEl: null,
      };
    },
    setup() { return { store: window.VWStore }; },
    computed: {
      slides() { return (this.presentation && this.presentation.slides) || []; },
      total()  { return this.slides.length; },
      slide()  { return this.slides[this.index] || null; },
      progressPercent() {
        if (!this.duration) return 0;
        return Math.min(100, (this.currentTime / this.duration) * 100);
      },
      overallPercent() {
        if (!this.total) return 0;
        const base = (this.index / this.total) * 100;
        const slice = this.duration ? (this.currentTime / this.duration) * (100 / this.total) : 0;
        return Math.min(100, base + slice);
      },
      currentTimeLabel() { return fmtTime(this.currentTime); },
      durationLabel()    { return fmtTime(this.duration); },
      slideNumber()      { return String(this.index + 1).padStart(2, '0'); },
      totalLabel()       { return String(this.total).padStart(2, '0'); },
      t() { return (this.store && this.store.t && this.store.t.ui) || {}; },
      regenHint() {
        const id = this.presentation && (this.presentation.owner_id || this.presentation.id) || 'wp-XX';
        return 'npm run generate:audio -- ' + id + ' --locale ' + (this.presentation.locale || 'en');
      },
    },
    watch: {
      /* When the parent swaps the presentation (locale switch), reset state. */
      'presentation.id'() {
        this.index = 0;
        this.imageErrored = false;
        this.error = null;
        this.currentTime = 0;
        this.duration = 0;
        this.$nextTick(() => this.loadCurrent(false));
      },
      /* Announce slide changes to screen reader users via the global live region. */
      index(newIdx) {
        if (window.VWA11y && this.slide) {
          const tpl = (this.t.aria_slide_announcement || 'Slide {n} of {total}, {title}');
          const msg = tpl
            .replace('{n}', newIdx + 1)
            .replace('{total}', this.total)
            .replace('{title}', this.slide.title || '');
          window.VWA11y.announce(msg);
        }
      },
      /* Focus-trap the TOC overlay when it opens. */
      tocOpen(open) {
        if (open) {
          this.$nextTick(() => {
            const panel = this.$refs.tocPanel;
            if (!panel || !window.VWA11y) return;
            this.tocTriggerEl = document.activeElement;
            this.releaseTocTrap = window.VWA11y.trapFocus(panel, this.tocTriggerEl);
            this.releaseTocEsc  = window.VWA11y.onEsc(() => { this.tocOpen = false; });
          });
        } else {
          if (this.releaseTocTrap) { this.releaseTocTrap(); this.releaseTocTrap = null; }
          if (this.releaseTocEsc)  { this.releaseTocEsc();  this.releaseTocEsc  = null; }
        }
      },
      playing(now) {
        if (window.VWA11y && this.slide) {
          const lbl = now
            ? (this.t.aria_playing_announcement || 'Playing')
            : (this.t.aria_paused_announcement  || 'Paused');
          window.VWA11y.announce(lbl + ': ' + (this.slide.title || ''));
        }
      },
    },
    mounted() {
      const a = new Audio();
      a.preload = 'auto';
      a.addEventListener('timeupdate',     () => { this.currentTime = a.currentTime || 0; });
      a.addEventListener('loadedmetadata', () => { this.duration = a.duration || 0; });
      a.addEventListener('ended',          () => {
        if (this.autoOn && this.index < this.total - 1) {
          this.index += 1;
          this.$nextTick(() => this.loadCurrent(true));
        } else { this.playing = false; }
      });
      a.addEventListener('error', () => {
        this.error = (this.t.audio_missing || 'Audio not generated yet.') + ' ' + this.regenHint;
        this.playing = false;
      });
      this.audio = a;
      this.loadCurrent(false);
      this.probeMedia();
      window.addEventListener('keydown', this.onKeydown);
    },
    beforeUnmount() {
      window.removeEventListener('keydown', this.onKeydown);
      if (this.releaseTocTrap) this.releaseTocTrap();
      if (this.releaseTocEsc)  this.releaseTocEsc();
      if (this.audio) {
        this.audio.pause();
        this.audio.src = '';
        this.audio = null;
      }
    },
    methods: {
      loadCurrent(autoplay) {
        if (!this.audio || !this.slide) return;
        const src = this.slide.audio_file;
        this.error = null;
        this.currentTime = 0;
        this.duration = 0;
        if (!src) {
          this.audio.removeAttribute('src');
          this.playing = false;
          return;
        }
        this.audio.src = src;
        if (autoplay) {
          const p = this.audio.play();
          if (p && p.then) {
            p.then(() => { this.playing = true; })
             .catch(() => { this.playing = false; });
          }
        }
      },
      play() {
        if (!this.audio) return;
        if (!this.audio.src && this.slide && this.slide.audio_file) {
          this.audio.src = this.slide.audio_file;
        }
        if (!this.audio.src) return;
        const p = this.audio.play();
        if (p && p.then) {
          p.then(() => { this.playing = true; })
           .catch(() => { this.playing = false; });
        }
      },
      pause() {
        if (this.audio) this.audio.pause();
        this.playing = false;
      },
      togglePlay() { this.playing ? this.pause() : this.play(); },
      next() {
        if (this.index < this.total - 1) {
          this.index += 1;
          this.imageErrored = false;
          this.$nextTick(() => this.loadCurrent(this.playing));
        }
      },
      prev() {
        if (this.index > 0) {
          this.index -= 1;
          this.imageErrored = false;
          this.$nextTick(() => this.loadCurrent(this.playing));
        }
      },
      goTo(i) {
        if (i < 0 || i >= this.total) return;
        this.index = i;
        this.tocOpen = false;
        this.imageErrored = false;
        this.$nextTick(() => this.loadCurrent(this.playing));
      },
      restart() {
        this.index = 0;
        this.imageErrored = false;
        this.$nextTick(() => this.loadCurrent(true));
      },
      /* Apply a seek and reflect it in the reactive state immediately, so the
         fill and the actual audio position stay in sync even while paused (a
         programmatic currentTime set does not always fire 'timeupdate'). */
      applySeek(seconds) {
        if (!this.audio || !this.duration) return;
        const t = Math.max(0, Math.min(this.duration, seconds));
        this.audio.currentTime = t;
        this.currentTime = t;
      },
      seekFromEvent(e) {
        if (!this.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        if (!rect.width) return;
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        this.applySeek(pct * this.duration);
      },
      /* Pointer drag scrubbing: a single click and a press-drag-release both
         work, on mouse and touch. Pointer capture keeps move events flowing even
         if the cursor leaves the track mid-drag. */
      onScrubDown(e) {
        if (!this.duration) return;
        this.scrubbing = true;
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
        this.seekFromEvent(e);
      },
      onScrubMove(e) {
        if (this.scrubbing) this.seekFromEvent(e);
      },
      onScrubUp(e) {
        if (!this.scrubbing) return;
        this.scrubbing = false;
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
      },
      /* Keyboard seek for the role="slider" scrubber. */
      seekRelative(deltaSeconds) {
        if (!this.audio || !this.duration) return;
        this.applySeek(this.audio.currentTime + deltaSeconds);
      },
      seekTo(absoluteSeconds) {
        this.applySeek(absoluteSeconds);
      },
      /* Click-to-toggle-play on the stage. The YouTube-style interaction.
         Ignored if the user clicks an interactive child (button, link, input). */
      onStageClick(e) {
        const tag = (e.target && e.target.tagName) || '';
        if (['BUTTON', 'A', 'INPUT', 'LABEL'].includes(tag)) return;
        this.togglePlay();
      },
      /* HEAD-probe every slide's audio_file so the TOC can show a "has-media"
         dot next to slides that are ready. Cheap, parallel, no error spam. */
      async probeMedia() {
        const ready = {};
        await Promise.all(this.slides.map(async s => {
          if (!s.audio_file) return;
          try {
            const res = await fetch(s.audio_file, { method: 'HEAD' });
            if (res.ok) ready[s.id] = true;
          } catch { /* unreachable assets — not ready */ }
        }));
        this.mediaReady = ready;
      },
      hasMedia(s) { return !!this.mediaReady[s.id]; },

      onKeydown(e) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        /* Do not hijack Space / arrows while the author is editing text in place. */
        if (e.target && e.target.isContentEditable) return;
        if (window.VWEdit && window.VWEdit.enabled) return;
        if (e.code === 'Space')      { e.preventDefault(); this.togglePlay(); }
        else if (e.code === 'ArrowRight') this.next();
        else if (e.code === 'ArrowLeft')  this.prev();
      },
      fmtTime,
    },
    template: `
      <section class="vp"
               :class="{ compact: compact, 'no-text-panel': !showTextPanel }"
               v-if="presentation && total > 0"
               role="region"
               :aria-roledescription="t.aria_role_player || 'presentation player'"
               :aria-label="presentation.title">
        <header class="vp-head" v-if="!compact">
          <div class="vp-title">
            <div class="vp-eyebrow">{{ t.tldr || 'TL;DR' }} · {{ presentation.title }}</div>
            <!-- Decorative repeat of the slide title; the real heading is the
                 h2 inside .vp-text-panel. Avoids a heading-order violation
                 (h3 here followed by h2 below would jump back up). -->
            <div class="vp-current-slide" v-if="slide" aria-hidden="true">{{ slide.title }}</div>
            <div class="vp-progress-text" aria-hidden="true">{{ slideNumber }} / {{ totalLabel }}</div>
          </div>
          <button v-if="showToc"
                  class="vp-toc-toggle"
                  :aria-expanded="tocOpen ? 'true' : 'false'"
                  :aria-controls="uid + '-toc'"
                  @click="tocOpen = !tocOpen">
            <span>{{ tocOpen ? (t.close || 'Close') : (t.all_slides || 'All slides') }}</span>
          </button>
        </header>

        <div class="vp-overall"
             v-if="showOverallBar"
             role="progressbar"
             :aria-label="t.aria_overall || 'Overall progress through this presentation'"
             :aria-valuenow="Math.round(overallPercent)"
             aria-valuemin="0"
             aria-valuemax="100">
          <div class="vp-overall-fill" :style="{ width: overallPercent + '%' }"></div>
        </div>

        <div class="vp-body two-panel" :class="{ 'text-panel': showTextPanel && !compact }">

          <!-- VISUAL STAGE — keyboard-accessible play/pause surface -->
          <div class="vp-stage-wrap"
               role="button"
               tabindex="0"
               :aria-label="(playing ? (t.aria_pause_stage || 'Pause narration') : (t.aria_play_stage || 'Play narration')) + ': ' + (slide ? slide.title : '')"
               :aria-pressed="playing ? 'true' : 'false'"
               @click="onStageClick"
               @keydown.enter.prevent="togglePlay"
               @keydown.space.prevent="togglePlay">
            <div class="vp-slide-index" v-if="slide" aria-hidden="true">
              {{ (t.slide || 'Slide') }} {{ slide.id }} / {{ totalLabel }}
            </div>

            <!-- Pre-loaded image layer for cross-dissolve transitions -->
            <template v-for="(s, i) in slides" :key="'img-' + s.id">
              <img v-if="s.visual === 'image' && s.image && s.image.src"
                   :src="s.image.src"
                   :alt="i === index ? (s.image.alt || s.title) : ''"
                   :aria-hidden="i === index ? null : 'true'"
                   class="vp-stage-img"
                   :class="{ 'is-active': i === index }"
                   draggable="false" />
            </template>

            <transition name="vp-fade" mode="out-in">
              <div class="vp-stage"
                   v-if="slide && slide.visual !== 'image'"
                   :key="slide && slide.id">
                <presentation-stage :slide="slide"
                                    :compact="compact"
                                    :owner-id="presentation && presentation.owner_id" />
              </div>
            </transition>

            <!-- Big play overlay (purely decorative; the button label is on .vp-stage-wrap) -->
            <div v-if="!playing && !error" class="vp-overlay" aria-hidden="true">
              <div class="vp-overlay-btn">▶</div>
            </div>

            <div v-if="error" class="vp-error-panel" role="alert">
              <div class="vp-error-l">{{ t.audio_missing_label || 'Audio not generated' }}</div>
              <div class="vp-error-body">{{ t.audio_missing_body || 'Run the generator to produce this narration MP3.' }}</div>
              <pre class="vp-error-cmd">{{ regenHint }}</pre>
            </div>
          </div>

          <!-- TEXT PANEL — narration text, also acts as a transcript for AT -->
          <aside v-if="showTextPanel && !compact && slide"
                 class="vp-text-panel"
                 :aria-label="t.aria_text_panel || 'Slide text and narration'">
            <transition name="vp-fade" mode="out-in">
              <div class="vp-text-inner" :key="slide.id">
                <div class="vp-text-caption" v-if="slide.caption">{{ slide.caption }}</div>
                <h2 class="vp-text-title">{{ slide.title }}</h2>
                <p class="vp-text-sub" v-if="slide.subcaption">{{ slide.subcaption }}</p>
                <p class="vp-text-body" v-if="slide.text">{{ slide.text }}</p>
              </div>
            </transition>
          </aside>
        </div>

        <!-- Player bar -->
        <div class="vp-controls" role="group" :aria-label="t.aria_controls || 'Playback controls'">
          <button class="vp-btn"
                  @click="prev"
                  :disabled="index === 0"
                  :aria-label="t.aria_prev || 'Previous slide'">
            <span aria-hidden="true">←</span> {{ t.prev || 'Prev' }}
          </button>
          <button class="vp-btn vp-play"
                  @click="togglePlay"
                  :aria-pressed="playing ? 'true' : 'false'"
                  :aria-label="playing ? (t.aria_pause || 'Pause narration') : (t.aria_play || 'Play narration')">
            <span v-if="playing"><span aria-hidden="true">❚❚</span> {{ t.pause || 'Pause' }}</span>
            <span v-else><span aria-hidden="true">▶</span> {{ t.play || 'Play' }}</span>
          </button>
          <button class="vp-btn"
                  @click="next"
                  :disabled="index >= total - 1"
                  :aria-label="t.aria_next || 'Next slide'">
            {{ t.next || 'Next' }} <span aria-hidden="true">→</span>
          </button>
          <button class="vp-btn"
                  @click="restart"
                  :aria-label="t.aria_restart || 'Restart from the first slide'">
            <span aria-hidden="true">↻</span>
            <span class="sr-only">{{ t.restart || 'Restart' }}</span>
          </button>

          <div class="vp-scrub">
            <span class="vp-time" aria-hidden="true">{{ currentTimeLabel }} / {{ durationLabel }}</span>
            <div class="vp-track"
                 style="touch-action:none;"
                 role="slider"
                 tabindex="0"
                 :aria-label="t.aria_scrubber || 'Seek within current slide'"
                 :aria-valuemin="0"
                 :aria-valuemax="Math.round(duration) || 0"
                 :aria-valuenow="Math.round(currentTime) || 0"
                 :aria-valuetext="currentTimeLabel + ' of ' + durationLabel"
                 @pointerdown="onScrubDown"
                 @pointermove="onScrubMove"
                 @pointerup="onScrubUp"
                 @pointercancel="onScrubUp"
                 @keydown.left.prevent="seekRelative(-5)"
                 @keydown.right.prevent="seekRelative(5)"
                 @keydown.home.prevent="seekTo(0)"
                 @keydown.end.prevent="seekTo(duration)">
              <div class="vp-fill" :style="{ width: progressPercent + '%' }"></div>
            </div>
          </div>

          <label class="vp-auto">
            <input type="checkbox" v-model="autoOn"
                   :aria-label="(t.auto_advance || 'auto-advance') + ' between slides'" />
            <span aria-hidden="true">{{ t.auto_advance || 'auto-advance' }}</span>
          </label>
        </div>

        <p class="vp-hint" v-if="!compact" aria-hidden="true">
          {{ t.kbd_hint || 'Space = play/pause · ← / → = prev / next · click the slide to toggle' }}
        </p>

        <!-- TOC overlay -->
        <transition name="vp-fade">
          <div v-if="tocOpen"
               :id="uid + '-toc'"
               class="vp-toc-overlay"
               role="dialog"
               aria-modal="true"
               :aria-label="t.contents || 'All slides'"
               ref="tocPanel"
               @click.self="tocOpen = false">
            <div class="vp-toc-panel">
              <div class="vp-toc-head">
                <span id="vp-toc-heading">{{ t.contents || 'All slides' }}</span>
                <button class="vp-toc-close"
                        @click="tocOpen = false"
                        :aria-label="t.close || 'Close'">
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <button v-for="(s, i) in slides" :key="s.id"
                      class="vp-toc-item"
                      :class="{ on: i === index, done: i < index, ready: hasMedia(s) }"
                      :aria-current="i === index ? 'true' : null"
                      :aria-label="(t.slide || 'Slide') + ' ' + s.id + ', ' + s.title + (hasMedia(s) ? ', ' + (t.audio_ready_aria || 'audio ready') : '')"
                      @click="goTo(i)">
                <span class="n" aria-hidden="true">{{ s.id }}</span>
                <span class="t">{{ s.title }}</span>
                <span v-if="hasMedia(s)" class="vp-toc-dot" aria-hidden="true"></span>
              </button>
            </div>
          </div>
        </transition>
      </section>

      <div v-else class="vp-empty">No slides in this presentation.</div>
    `,
  };
})();
