/* UpdatesPage — living changelog. New findings, new code releases, new
   evidence accumulated over the four-year cycle. Newest first. Content is
   data-driven and bilingual: data/updates.json carries the page chrome
   (page.en/fr, including the kind labels) and the entries (each with en/fr). */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['updates-page'] = {
    setup() { return { store: window.VWStore }; },
    data() { return { entries: [], page: null, error: null }; },
    async mounted() {
      try {
        const res = await fetch('data/updates.json', { cache: 'no-cache' });
        const j = await res.json();
        this.entries = (j.entries || []).slice().sort((a, b) => b.date.localeCompare(a.date));
        this.page = j.page || null;
      } catch (e) { this.error = e.message; }
    },
    computed: {
      pg() { return this.page ? (this.page[this.store.locale] || this.page.en) : {}; },
    },
    methods: {
      kindLabel(k) {
        const kinds = (this.pg && this.pg.kinds) || {};
        return kinds[k] || k;
      },
    },
    template: `
      <div>
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <span>{{ pg.eyebrow }}</span>
          </div>
          <h1>{{ pg.title_lead }} <em>{{ pg.title_em }}</em></h1>
          <p class="lede">{{ pg.lede }}</p>
        </section>

        <section class="civic-section">
          <ol class="updates-list">
            <li v-for="e in entries" :key="e.id">
              <div class="upd-meta">
                <span class="upd-date">{{ e.date }}</span>
                <span class="upd-kind" :class="'k-' + e.kind">{{ kindLabel(e.kind) }}</span>
              </div>
              <h2 class="upd-title">{{ (e[store.locale] || e.en).title }}</h2>
              <p>{{ (e[store.locale] || e.en).body }}</p>
              <div class="upd-links" v-if="e.links && e.links.length">
                <a v-for="l in e.links" :key="l.href"
                   :href="l.href">{{ store.locale === 'fr' ? l.label_fr : l.label_en }}</a>
              </div>
            </li>
          </ol>
          <div v-if="!entries.length && !error" style="color:var(--ink-50);font-family:var(--font-mono);padding:24px 0;">
            {{ pg.empty }}
          </div>
          <div v-if="error" style="color:var(--highlight);font-family:var(--font-mono);">{{ error }}</div>
        </section>

        <app-footer />
      </div>
    `,
  };
})();
