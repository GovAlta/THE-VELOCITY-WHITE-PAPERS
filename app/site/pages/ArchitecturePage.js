/* ArchitecturePage — two purposes:
   1. The agentic-architecture diagram (the layered seven-row visual).
   2. A library of category=architecture knowledge articles (technical specs
      that sit outside the linear 1..16 reading sequence). Read on demand. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['architecture-page'] = {
    emits: ['navigate'],
    data() { return { arch: null, error: null }; },
    setup() { return { store: window.VWStore }; },
    async mounted() {
      try {
        const res = await fetch('data/architecture.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error('Failed to load architecture.json');
        this.arch = await res.json();
      } catch (e) { this.error = e.message; }
    },
    computed: {
      architectureArticles() {
        return (this.store.papers || []).filter(p => p.category === 'architecture');
      },
    },
    methods: {
      open(id) { this.$emit('navigate', { page: 'paper', id }); },
    },
    template: `
      <div>
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <span>The agentic architecture</span>
            <span>·</span>
            <span>Reference topology + knowledge articles</span>
          </div>
          <h1>The work, in <em>seven layers</em>.</h1>
          <p class="lede">From discovery to deployment. Autonomous agents inside each layer. Verifiers and human-gated steps where the cost of mistakes is highest. Below the diagram, a small library of architecture articles — technical specs that sit outside the linear reading sequence and are read on demand.</p>
        </section>

        <div v-if="arch">
          <architecture-diagram :arch="arch" />
        </div>
        <div v-else-if="error" style="padding:60px 56px;color:var(--highlight);font-family:var(--font-mono);">
          {{ error }}
        </div>
        <div v-else style="padding:60px 56px;color:var(--ink-50);font-family:var(--font-mono);font-size:12px;">
          Loading the architecture…
        </div>

        <section class="civic-section" v-if="architectureArticles.length">
          <div class="head">
            <h2>Architecture articles</h2>
            <div class="meta">{{ architectureArticles.length }} entries · technical reference</div>
          </div>
        </section>
        <library-grid v-if="architectureArticles.length"
                      :papers="architectureArticles"
                      @open="open" />

        <app-footer />
      </div>
    `,
  };
})();
