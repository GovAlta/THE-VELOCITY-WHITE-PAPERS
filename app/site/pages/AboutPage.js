/* AboutPage — open source, license, methodology, contact.
   Content is data-driven and bilingual: data/pages/about.<locale>.json, loaded
   per locale and reloaded when the locale changes. The public repositories list
   is still derived from store.papers. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['about-page'] = {
    setup() { return { store: window.VWStore }; },
    data() { return { doc: null, error: null }; },
    computed: {
      loadKey() { return this.store.locale || 'en'; },
      repoPapers() { return (this.store.papers || []).filter(p => p.repo); },
    },
    watch: { loadKey: { handler: 'load', immediate: true } },
    methods: {
      async load() {
        try { this.doc = await window.VWLoadPageData('about', this.store.locale); }
        catch (e) { this.error = e.message; }
      },
    },
    template: `
      <div v-if="doc">
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <span>{{ doc.eyebrow }}</span>
          </div>
          <h1>{{ doc.title_lead }} <em>{{ doc.title_em }}</em></h1>
          <p class="lede">{{ doc.lede }}</p>
        </section>

        <section class="civic-section">
          <div class="head">
            <h2>{{ doc.use.heading }}</h2>
            <div class="meta">{{ doc.use.meta }}</div>
          </div>
          <div style="padding-bottom:24px;max-width:60ch;color:var(--ink-70);font-size:15px;line-height:1.7;">
            <p v-for="(p, i) in doc.use.paras" :key="i">{{ p }}</p>
          </div>
        </section>

        <section class="civic-section">
          <div class="head">
            <h2>{{ doc.repos.heading }}</h2>
            <div class="meta">{{ doc.repos.meta }}</div>
          </div>
          <ul style="list-style:none;padding:0;margin:0;border-top:1px solid var(--rule);">
            <li v-for="p in repoPapers" :key="p.id"
                style="padding:14px 0;border-bottom:1px solid var(--rule);display:flex;justify-content:space-between;align-items:baseline;gap:24px;">
              <div>
                <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.14em;color:var(--highlight);text-transform:uppercase;">№ {{ p.num }}</div>
                <div style="font-weight:600;font-size:15px;">{{ p.title }}</div>
              </div>
              <a :href="p.repo" style="font-family:var(--font-mono);font-size:11px;color:var(--accent);">{{ p.repo.replace('https://github.com/','') }}</a>
            </li>
          </ul>
        </section>

        <section class="civic-section">
          <div class="head">
            <h2>{{ doc.also.heading }}</h2>
            <div class="meta">{{ doc.also.meta }}</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding-bottom:24px;">
            <a v-for="c in doc.also.cards" :key="c.href" :href="c.href" class="civic-card" style="text-decoration:none;cursor:pointer;">
              <div class="head"><span class="num">→</span><span>{{ c.tag }}</span></div>
              <h3>{{ c.title }}</h3>
            </a>
          </div>
        </section>

        <app-footer />
      </div>
      <div v-else-if="error" style="padding:80px 56px;color:var(--highlight);font-family:var(--font-mono);font-size:12px;">{{ error }}</div>
    `,
  };
})();
