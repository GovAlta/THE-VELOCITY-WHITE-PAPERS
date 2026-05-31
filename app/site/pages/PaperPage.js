/* PaperPage — loads a single paper's content JSON and hands it to PaperDetail.
   Reloads when paperId changes OR when the active locale changes (so the
   player swaps its slides + audio paths to the active locale automatically). */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['paper-page'] = {
    props: {
      paperId: { type: String, default: null },
    },
    emits: ['navigate'],
    setup() { return { store: window.VWStore }; },
    data() { return { content: null, error: null, loading: false }; },
    computed: {
      /* Combined dependency: re-fires the watcher when either paperId or
         locale changes, so switching EN/FR mid-read reloads the right JSON. */
      loadKey() {
        return (this.paperId || '') + ':' + (this.store.locale || 'en');
      },
    },
    watch: {
      loadKey: { handler: 'load', immediate: true },
    },
    methods: {
      async load() {
        if (!this.paperId) return;
        this.loading = true; this.error = null;
        try {
          this.content = await window.VWLoadPaper(this.paperId, this.store.locale);
          window.VWMarkVisited(this.paperId);
          if (window.VWVisuals && this.content) {
            await window.VWVisuals.loadBespokeFor(this.content);
          }
          if (window.VWA11y && this.content) {
            const prefix = this.store.locale === 'fr' ? 'Livre chargé : ' : 'Paper loaded: ';
            window.VWA11y.announce(prefix + this.content.title);
          }
          if (window.VWMeta && this.content) {
            window.VWMeta.setPaper(this.content);
          }
        } catch (e) {
          this.error = 'No content found for ' + this.paperId + '. JSON file may not exist yet.';
          this.content = null;
        } finally { this.loading = false; }
      },
      open(id) { this.$emit('navigate', { page: 'paper', id }); },
      back() { this.$emit('navigate', 'library'); },
    },
    template: `
      <div>
        <paper-detail v-if="content"
                      :paper="content"
                      @open="open"
                      @back="back" />
        <div v-else-if="loading" style="padding:80px 56px;color:var(--ink-50);font-family:var(--font-mono);font-size:12px;">
          {{ (store.t.ui && store.t.ui.loading_paper) || 'Loading' }} {{ paperId }}…
        </div>
        <div v-else-if="error" style="padding:80px 56px;">
          <div style="font-family:var(--font-mono);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--highlight);margin-bottom:14px;">{{ (store.t.ui && store.t.ui.no_content) || 'Not yet written' }}</div>
          <h1 style="font-size:32px;font-weight:600;letter-spacing:-0.02em;margin:0 0 18px;">{{ paperId }}</h1>
          <p style="color:var(--ink-70);max-width:60ch;">{{ (store.t.ui && store.t.ui.no_content_body) || error }}</p>
          <button @click="back"
                  :aria-label="(store.locale === 'fr' ? 'Retour à la bibliothèque' : 'Back to the library')"
                  style="margin-top:24px;font-family:var(--font-mono);font-size:11px;letter-spacing:0.08em;text-transform:uppercase;background:none;border:0;color:var(--ink-50);cursor:pointer;">
            <span aria-hidden="true">←</span> <span>{{ (store.t.ui && store.t.ui.back_to_library) || 'Library' }}</span>
          </button>
        </div>
      </div>
    `,
  };
})();
