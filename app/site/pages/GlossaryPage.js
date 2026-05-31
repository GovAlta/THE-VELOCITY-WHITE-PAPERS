/* GlossaryPage — bilingual glossary of terms introduced across the collection.
   Reads data/glossary.json. Each term has a short and long definition in EN
   and FR plus related-term links. Filterable by search. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['glossary-page'] = {
    emits: ['navigate'],
    setup() { return { store: window.VWStore }; },
    data() { return { terms: [], query: '', expanded: {}, error: null }; },
    async mounted() {
      try {
        const res = await fetch('data/glossary.json', { cache: 'no-cache' });
        const j = await res.json();
        this.terms = j.terms;
      } catch (e) { this.error = e.message; }
    },
    computed: {
      filtered() {
        const q = this.query.trim().toLowerCase();
        if (!q) return this.terms;
        return this.terms.filter(t => {
          const loc = t[this.store.locale] || t.en;
          return [loc.term, loc.short, loc.long].join(' ').toLowerCase().includes(q);
        });
      },
    },
    methods: {
      toggle(id) { this.expanded[id] = !this.expanded[id]; },
      jumpTo(id) {
        this.expanded[id] = true;
        this.$nextTick(() => {
          const el = document.getElementById('term-' + id);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      },
      termById(id) {
        const t = this.terms.find(x => x.id === id);
        if (!t) return null;
        return t[this.store.locale] || t.en;
      },
    },
    template: `
      <div>
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <span>{{ store.locale === 'fr' ? 'Glossaire' : 'Glossary' }}</span>
            <span>·</span>
            <span>{{ filtered.length }} {{ store.locale === 'fr' ? 'termes' : 'terms' }}</span>
          </div>
          <h1>{{ store.locale === 'fr' ? 'Le' : 'The' }} <em>{{ store.locale === 'fr' ? 'vocabulaire' : 'vocabulary' }}</em>.</h1>
          <p class="lede">{{ store.locale === 'fr'
            ? 'Les concepts introduits dans la collection, définis en deux niveaux : la phrase courte pour le rappel et la définition longue pour la première lecture.'
            : 'The concepts introduced across the collection, defined at two levels: a short sentence for recall and a longer definition for first reading.' }}</p>
        </section>

        <section class="civic-section">
          <div class="filters" role="search" style="display:flex;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);margin-bottom:24px;">
            <div class="search" style="flex:1;padding:14px 16px;">
              <label for="vw-glossary-search" class="sr-only">{{ store.locale === 'fr' ? 'Rechercher dans le glossaire' : 'Search the glossary' }}</label>
              <input id="vw-glossary-search"
                     v-model="query"
                     type="search"
                     :placeholder="(store.t.ui && store.t.ui.search_placeholder) || 'Search…'"
                     :aria-label="(store.locale === 'fr' ? 'Rechercher dans ' : 'Search ') + terms.length + (store.locale === 'fr' ? ' termes' : ' terms')"
                     style="width:100%;border:0;background:transparent;outline:none;font-family:var(--font-sans);font-size:15px;color:var(--ink);" />
            </div>
          </div>

          <div v-if="error" style="color:var(--highlight);font-family:var(--font-mono);font-size:12px;">{{ error }}</div>

          <dl class="glossary-list">
            <div v-for="t in filtered" :key="t.id" :id="'term-' + t.id"
                 class="glossary-term" :class="{ open: expanded[t.id] }">
              <dt @click="toggle(t.id)">
                <span class="term-name">{{ (t[store.locale] || t.en).term }}</span>
                <span class="term-short">{{ (t[store.locale] || t.en).short }}</span>
                <span class="term-toggle">{{ expanded[t.id] ? '−' : '+' }}</span>
              </dt>
              <dd v-if="expanded[t.id]">
                <p>{{ (t[store.locale] || t.en).long }}</p>
                <div class="term-related" v-if="t.related && t.related.length">
                  <span class="rl-l">{{ store.locale === 'fr' ? 'Voir aussi' : 'See also' }}</span>
                  <button v-for="rid in t.related" :key="rid"
                          class="rl-link"
                          @click="jumpTo(rid)">
                    {{ termById(rid) ? termById(rid).term : rid }}
                  </button>
                </div>
              </dd>
            </div>
          </dl>
        </section>

        <app-footer />
      </div>
    `,
  };
})();
