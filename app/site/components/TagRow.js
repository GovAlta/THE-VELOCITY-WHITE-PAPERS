/* TagRow — horizontal row of mono pill tags. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['tag-row'] = {
    props: {
      label: { type: String, default: 'Tags' },
      tags:  { type: Array, default: () => [] },
    },
    setup() { return { store: window.VWStore }; },
    methods: {
      /* Display the tag in the active locale. Tags are stored as English slugs
         (so search/keys stay stable); the FR display label comes from the
         locale's ui.tag_labels map. Falls back to the slug when unmapped. */
      tagLabel(t) {
        const m = this.store && this.store.t && this.store.t.ui && this.store.t.ui.tag_labels;
        return (m && m[t]) || t;
      },
    },
    template: `
      <div class="cd-tagrow" v-if="tags.length">
        <span class="l">{{ label }}</span>
        <span class="tag" v-for="t in tags" :key="t">{{ tagLabel(t) }}</span>
      </div>
    `,
  };
})();
