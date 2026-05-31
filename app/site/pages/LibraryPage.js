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
      featured() { return this.papers.slice(0, 2); },
      rest() { return this.papers.filter(p => p.status !== 'Placeholder'); },
      seriesMeta() {
        const tpl = this.store.t.section_titles?.series_meta_tpl || '{n} entries';
        return tpl.replace('{n}', this.papers.length);
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
            <span>Open source · MIT</span>
          </div>
          <h1>
            {{ store.t.hero.h1_pre }} <em>{{ store.t.hero.h1_em_1 }}</em>
            {{ store.t.hero.h1_mid }} <em>{{ store.t.hero.h1_em_2 }}</em>
          </h1>
          <p class="lede">{{ store.t.tagline }}</p>
        </section>

        <stat-rail :stats="store.t.stats" />

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
