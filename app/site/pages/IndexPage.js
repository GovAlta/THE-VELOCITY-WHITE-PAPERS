/* IndexPage — searchable / filterable table of all papers. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['index-page'] = {
    emits: ['navigate'],
    setup() {
      return { store: window.VWStore };
    },
    methods: {
      open(id) { this.$emit('navigate', { page: 'paper', id }); },
    },
    template: `
      <div v-if="store.ready">
        <index-table :papers="store.papers" @open="open" />
        <app-footer />
      </div>
      <div v-else style="padding:80px 56px;color:var(--ink-50);font-family:var(--font-mono);font-size:12px;">
        Loading the index…
      </div>
    `,
  };
})();
