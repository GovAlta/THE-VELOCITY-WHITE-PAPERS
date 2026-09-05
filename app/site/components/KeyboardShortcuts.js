/* KeyboardShortcuts — global "?" dialog listing all keyboard shortcuts.
   Mounts at the app root, listens on window for the "?" keydown, opens a
   focus-trapped modal with ESC-to-close. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['keyboard-shortcuts'] = {
    setup() { return { store: window.VWStore }; },
    data() {
      return {
        open: false,
        triggerEl: null,
        releaseTrap: null,
        releaseEsc: null,
      };
    },
    computed: {
      /* Shortcut list is data-driven from the active locale's ui.shortcuts bag
         (falls back to the English bag via the store merge). */
      shortcuts() { return (this.store.t.ui && this.store.t.ui.shortcuts) || []; },
    },
    mounted() { window.addEventListener('keydown', this.onGlobalKey); },
    beforeUnmount() {
      window.removeEventListener('keydown', this.onGlobalKey);
      if (this.releaseTrap) this.releaseTrap();
      if (this.releaseEsc)  this.releaseEsc();
    },
    watch: {
      open(val) {
        if (val) {
          this.$nextTick(() => {
            const dialog = this.$refs.dialog;
            if (!dialog || !window.VWA11y) return;
            this.releaseTrap = window.VWA11y.trapFocus(dialog, this.triggerEl);
            this.releaseEsc  = window.VWA11y.onEsc(() => { this.open = false; });
          });
        } else {
          if (this.releaseTrap) { this.releaseTrap(); this.releaseTrap = null; }
          if (this.releaseEsc)  { this.releaseEsc();  this.releaseEsc  = null; }
        }
      },
    },
    methods: {
      onGlobalKey(e) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (e.target && e.target.isContentEditable) return;
        /* "?" is Shift + / on most layouts; check both */
        if (e.key === '?') {
          e.preventDefault();
          this.triggerEl = document.activeElement;
          this.open = true;
        }
      },
    },
    template: `
      <transition name="vp-fade">
        <div v-if="open"
             class="kbd-overlay"
             @click.self="open = false"
             aria-hidden="false">
          <div class="kbd-dialog"
               role="dialog"
               aria-modal="true"
               aria-labelledby="kbd-title"
               ref="dialog">
            <div class="kbd-head">
              <h2 id="kbd-title">{{ (store.t.ui && store.t.ui.keyboard_shortcuts_title) || 'Keyboard shortcuts' }}</h2>
              <button class="kbd-close"
                      @click="open = false"
                      :aria-label="(store.t.ui && store.t.ui.close) || 'Close'">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <dl class="kbd-list">
              <template v-for="(row, i) in shortcuts" :key="i">
                <div v-if="row.divider" class="kbd-divider">{{ row.label }}</div>
                <div v-else class="kbd-row">
                  <dt class="kbd-keys">
                    <kbd v-for="(k, j) in row.keys" :key="j">{{ k }}</kbd>
                  </dt>
                  <dd class="kbd-label">{{ row.label }}</dd>
                </div>
              </template>
            </dl>
            <p class="kbd-hint">
              {{ (store.t.ui && store.t.ui.esc_to_close) || 'Press Esc to close.' }}
            </p>
          </div>
        </div>
      </transition>
    `,
  };
})();
