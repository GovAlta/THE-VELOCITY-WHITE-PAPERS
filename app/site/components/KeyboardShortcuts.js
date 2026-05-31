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
      shortcuts() {
        const fr = this.store.locale === 'fr';
        return [
          { keys: ['?'],            label: fr ? 'Afficher les raccourcis clavier'      : 'Show keyboard shortcuts' },
          { keys: ['Esc'],          label: fr ? 'Fermer une boîte de dialogue ouverte' : 'Close any open dialog' },
          { keys: ['Tab'],          label: fr ? 'Aller au champ interactif suivant'    : 'Move to next interactive element' },
          { keys: ['Shift', 'Tab'], label: fr ? 'Aller au champ interactif précédent'  : 'Move to previous interactive element' },
          { divider: true,          label: fr ? 'Lecteur de présentation'              : 'Presentation player' },
          { keys: ['Space'],        label: fr ? 'Lecture / pause'                      : 'Play / pause narration' },
          { keys: ['←'],            label: fr ? 'Diapositive précédente'               : 'Previous slide' },
          { keys: ['→'],            label: fr ? 'Diapositive suivante'                 : 'Next slide' },
          { keys: ['Click'],        label: fr ? 'Cliquer la diapositive pour basculer la lecture' : 'Click the slide to toggle play' },
          { divider: true,          label: fr ? 'Barre de lecture (lorsque focalisée)' : 'Scrubber (when focused)' },
          { keys: ['←'],            label: fr ? 'Reculer de 5 secondes'                : 'Seek back 5 seconds' },
          { keys: ['→'],            label: fr ? 'Avancer de 5 secondes'                : 'Seek forward 5 seconds' },
          { keys: ['Home'],         label: fr ? 'Aller au début de la diapositive'     : 'Jump to start of slide' },
          { keys: ['End'],          label: fr ? 'Aller à la fin de la diapositive'     : 'Jump to end of slide' },
        ];
      },
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
              <h2 id="kbd-title">{{ store.locale === 'fr' ? 'Raccourcis clavier' : 'Keyboard shortcuts' }}</h2>
              <button class="kbd-close"
                      @click="open = false"
                      :aria-label="store.locale === 'fr' ? 'Fermer' : 'Close'">
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
              {{ store.locale === 'fr' ? 'Appuyez sur Échap pour fermer.' : 'Press Esc to close.' }}
            </p>
          </div>
        </div>
      </transition>
    `,
  };
})();
