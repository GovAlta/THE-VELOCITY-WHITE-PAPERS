/* PrivacyPage — the site's privacy statement, a faithful port of the Government
   of Alberta privacy statement (alberta.ca/privacystatement) with two changes:
   the personal-information section is reduced to a single line, and the
   third-party cookie list is reduced to Google Analytics. Data-driven and
   bilingual: data/pages/privacy.<locale>.json. Paragraphs and bullets render
   inline markdown (links) via the shared VWmd helper. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['privacy-page'] = {
    setup() { return { store: window.VWStore }; },
    data() { return { doc: null, error: null }; },
    computed: { loadKey() { return this.store.locale || 'en'; } },
    watch: { loadKey: { handler: 'load', immediate: true } },
    methods: {
      md(s) { return window.VWmd ? window.VWmd(s) : s; },
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
          <div class="vw-page-prose" style="padding-bottom:24px;max-width:64ch;color:var(--ink-70);font-size:15px;line-height:1.7;">
            <p v-for="(p, i) in (s.paras || [])" :key="i" v-html="md(p)"></p>
            <ul v-if="s.bullets && s.bullets.length" style="margin:0 0 14px;padding-left:20px;">
              <li v-for="(b, i) in s.bullets" :key="'b'+i" style="margin:2px 0;" v-html="md(b)"></li>
            </ul>
          </div>
        </section>

        <section class="civic-section" v-if="doc.lead_ministry || doc.governing">
          <p v-if="doc.lead_ministry" style="font-size:13px;color:var(--ink-70);"><strong>Lead ministry:</strong> {{ doc.lead_ministry }}</p>
          <p v-if="doc.governing" style="font-family:var(--font-mono);font-size:12px;">
            <a :href="doc.governing.href" target="_blank" rel="noopener" style="color:var(--accent);">{{ doc.governing.label }} →</a>
          </p>
        </section>

        <app-footer />
      </div>
      <div v-else-if="error" style="padding:80px 56px;color:var(--highlight);font-family:var(--font-mono);font-size:12px;">{{ error }}</div>
    `,
  };
})();
