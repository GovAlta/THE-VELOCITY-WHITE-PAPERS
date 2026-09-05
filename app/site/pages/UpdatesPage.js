/* UpdatesPage — living changelog. New findings, new code releases, new
   evidence accumulated over the four-year cycle. Newest first. Content is
   data-driven and bilingual: data/pages/updates.<locale>.json, loaded per
   locale and reloaded when the locale changes. The file carries the page chrome
   (including the kind labels) and the entries, all in one locale. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['updates-page'] = {
    setup() { return { store: window.VWStore }; },
    data() { return { doc: null, error: null }; },
    computed: {
      loadKey() { return this.store.locale || 'en'; },
      pg() { return (this.doc && this.doc.page) || {}; },
      entries() {
        return ((this.doc && this.doc.entries) || []).slice().sort((a, b) => b.date.localeCompare(a.date));
      },
    },
    watch: { loadKey: { handler: 'load', immediate: true } },
    methods: {
      async load() {
        try { this.doc = await window.VWLoadPageData('updates', this.store.locale); }
        catch (e) { this.error = e.message; }
      },
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
              <h2 class="upd-title">{{ e.title }}</h2>
              <p>{{ e.body }}</p>
              <div class="upd-links" v-if="e.links && e.links.length">
                <a v-for="l in e.links" :key="l.href" :href="l.href">{{ l.label }}</a>
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
