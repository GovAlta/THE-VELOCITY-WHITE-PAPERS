/* LibraryPage — home / library view. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['library-page'] = {
    emits: ['navigate'],
    setup() { return { store: window.VWStore }; },
    computed: {
      papers() {
        return (this.store.papers || []).filter(p => p.category !== 'architecture');
      },
      published() { return this.papers.filter(p => p.status === 'Published'); },
      /* Featured is the "start here" on-ramp: the first three papers in reading
         order, regardless of publish status, so the row is always meaningful and
         stable rather than tracking whichever papers happen to be Published. */
      featured() {
        return this.papers.slice()
          .sort((a, b) => String(a.num || '').localeCompare(String(b.num || ''), undefined, { numeric: true }))
          .slice(0, 3);
      },
      /* The public home shows the live + forthcoming collection. Drafts and
         placeholders are work-in-progress and live only in the full Index
         catalog (#/index), so the home and the index stay consistent. */
      rest() { return this.papers.filter(p => p.status === 'Published' || p.status === 'Forthcoming'); },
      seriesMeta() {
        const tpl = this.store.t.section_titles?.series_meta_tpl || '{n} entries';
        return tpl.replace('{n}', this.papers.length);
      },
      /* Stats with the paper count computed live, so it never drifts from the
         data or the Index. The first stat is "Papers"; its value tracks the
         numbered papers and the sub keeps the locale wording from site.json. */
      stats() {
        const base = (this.store.t.stats || []).map(s => ({ ...s }));
        if (base.length) {
          const numbered = this.papers.filter(p => /^\d+$/.test(String(p.num))).length;
          base[0] = { ...base[0], v: String(numbered) };
        }
        return base;
      },
    },
    methods: {
      open(id) { this.$emit('navigate', { page: 'paper', id }); },
      paperTitle(p) {
        const i18n = p.i18n && p.i18n[this.store.locale];
        return (i18n && i18n.title) || p.title;
      },
      paperSubtitle(p) {
        const i18n = p.i18n && p.i18n[this.store.locale];
        return (i18n && i18n.subtitle) || p.subtitle;
      },
    },
    template: `
      <div v-if="store.ready">
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <span>{{ store.t.publisher }}</span>
            <span>·</span>
            <a class="oss-link" href="https://github.com/GovAlta/the-velocity-white-papers"
               target="_blank" rel="noopener">Open source · MIT</a>
          </div>
          <h1 v-html="store.t.hero.title"></h1>
          <p class="lede">{{ store.t.hero.subtitle }}</p>
        </section>

        <stat-rail :stats="stats" />

        <section class="civic-section">
          <div class="head">
            <h2>{{ store.t.section_titles.featured }}</h2>
            <div class="meta">{{ store.t.section_titles.featured_meta }}</div>
          </div>
        </section>
        <div class="civic-featured">
          <a v-for="p in featured" :key="p.id"
             :href="'#/paper/' + p.id"
             class="cell"
             :aria-label="'Paper ' + p.num + ', ' + paperTitle(p) + ', ' + p.tier"
             @click.prevent="open(p.id)">
            <div class="top" aria-hidden="true">
              <span class="num">№ {{ p.num }}</span>
              <span>{{ p.tier }}</span>
            </div>
            <h3>{{ paperTitle(p) }}</h3>
            <div class="sub">{{ paperSubtitle(p) }}</div>
            <div class="meta" aria-hidden="true">
              <span>{{ p.status }}</span>
              <span v-if="p.reading_min">{{ p.reading_min }} {{ store.t.ui.min }}</span>
              <span v-if="p.repo">repo ✓</span>
            </div>
          </a>
        </div>

        <section class="civic-section">
          <div class="head">
            <h2>{{ store.t.section_titles.complete_series }}</h2>
            <div class="meta">{{ seriesMeta }}</div>
          </div>
        </section>
        <library-grid :papers="rest" @open="open" />

        <app-footer />
      </div>
      <div v-else style="padding:80px 56px;color:var(--ink-50);font-family:var(--font-mono);font-size:12px;">
        {{ (store.t.ui && store.t.ui.loading_library) || 'Loading…' }}
      </div>
    `,
  };
})();
