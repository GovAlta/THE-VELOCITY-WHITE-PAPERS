/* RelatedPapers — "Read next" 2x2 tile grid of cross-linked papers. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['related-papers'] = {
    props: {
      ids: { type: Array, default: () => [] },
    },
    emits: ['open'],
    setup() {
      return { store: window.VWStore };
    },
    computed: {
      papers() {
        return (this.ids || [])
          .map(id => this.store.paperById[id])
          .filter(Boolean);
      },
    },
    methods: {},
    template: `
      <section class="cd-related" v-if="papers.length"
               :aria-label="store.locale === 'fr' ? 'À lire ensuite' : 'Read next'">
        <div class="lbl" aria-hidden="true">{{ store.locale === 'fr' ? 'À lire ensuite' : 'Read next' }}</div>
        <div class="grid">
          <a v-for="p in papers" :key="p.id"
             :href="'#/paper/' + p.id"
             class="tile"
             :aria-label="(store.locale === 'fr' ? 'Livre ' : 'Paper ') + p.num + ' — ' + p.title + ', ' + p.tier"
             @click.prevent="$emit('open', p.id)">
            <div class="ref" aria-hidden="true">№ {{ p.num }} · {{ p.tier }}</div>
            <h4>{{ p.title }}</h4>
          </a>
        </div>
      </section>
    `,
  };
})();
