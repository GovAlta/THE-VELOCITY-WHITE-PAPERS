/* LibraryGrid — three-column card grid for the library page. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['library-grid'] = {
    props: { papers: { type: Array, required: true } },
    emits: ['open'],
    template: `
      <div class="civic-grid">
        <paper-card v-for="p in papers" :key="p.id" :paper="p" @open="$emit('open', $event)" />
      </div>
    `,
  };
})();
