/* IndexPage — searchable / filterable table of all papers. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['index-page'] = {
    emits: ['navigate'],
    setup() {
      return { store: window.VWStore };
    },
    computed: {
      /* The index catalogs the paper collection. The architecture article is
         non-linear and lives at its own route, so the index and the home page
         count the same set. */
      papers() { return (this.store.papers || []).filter(p => p.category !== 'architecture'); },
    },
    methods: {
      open(id) { this.$emit('navigate', { page: 'paper', id }); },
    },
    template: `
      <div v-if="store.ready">
        <index-table :papers="papers" @open="open" />
        <app-footer />
      </div>
      <div v-else style="padding:80px 56px;color:var(--ink-50);font-family:var(--font-mono);font-size:12px;">
        Loading the index…
      </div>
    `,
  };
})();
