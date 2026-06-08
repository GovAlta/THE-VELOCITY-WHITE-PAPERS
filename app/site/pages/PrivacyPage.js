/* PrivacyPage — the site's privacy statement, adapted from the Government of
   Alberta privacy statement. Data-driven and bilingual:
   data/pages/privacy.<locale>.json. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['privacy-page'] = {
    setup() { return { store: window.VWStore }; },
    data() { return { doc: null, error: null }; },
    computed: { loadKey() { return this.store.locale || 'en'; } },
    watch: { loadKey: { handler: 'load', immediate: true } },
    methods: {
      async load() {
        try { this.doc = await window.VWLoadPageData('privacy', this.store.locale); }
        catch (e) { this.error = e.message; }
      },
    },
    template: `
      <div v-if="doc">
        <section class="civic-hero">
          <div class="civic-eyebrow"><span class="dot"></span><span>{{ doc.page.eyebrow }}</span></div>
          <h1>{{ doc.page.title_lead }} <em>{{ doc.page.title_em }}</em></h1>
          <p class="lede">{{ doc.page.lede }}</p>
        </section>

        <section class="civic-section" v-for="s in doc.sections" :key="s.heading">
          <div class="head"><h2>{{ s.heading }}</h2></div>
          <div style="padding-bottom:24px;max-width:64ch;color:var(--ink-70);font-size:15px;line-height:1.7;">
            <p v-for="(p, i) in s.paras" :key="i">{{ p }}</p>
          </div>
        </section>

        <section class="civic-section" v-if="doc.governing">
          <p style="font-family:var(--font-mono);font-size:12px;">
            <a :href="doc.governing.href" target="_blank" rel="noopener" style="color:var(--accent);">{{ doc.governing.label }} →</a>
          </p>
        </section>

        <app-footer />
      </div>
      <div v-else-if="error" style="padding:80px 56px;color:var(--highlight);font-family:var(--font-mono);font-size:12px;">{{ error }}</div>
    `,
  };
})();
