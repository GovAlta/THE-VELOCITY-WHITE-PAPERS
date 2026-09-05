/* ResourcesPage — a short, curated set of external context links.
   Data-driven and bilingual: data/pages/resources.<locale>.json. Items with an
   empty href render as "link to be added" so the page is safe to ship before
   every URL is finalized. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['resources-page'] = {
    setup() { return { store: window.VWStore }; },
    data() { return { doc: null, error: null }; },
    computed: { loadKey() { return this.store.locale || 'en'; } },
    watch: { loadKey: { handler: 'load', immediate: true } },
    methods: {
      async load() {
        try { this.doc = await window.VWLoadPageData('resources', this.store.locale); }
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

        <section class="civic-section" v-for="g in doc.groups" :key="g.heading">
          <div class="head"><h2>{{ g.heading }}</h2></div>
          <ul style="list-style:none;padding:0;margin:0;border-top:1px solid var(--rule);max-width:64ch;">
            <li v-for="it in g.items" :key="it.title"
                style="padding:14px 0;border-bottom:1px solid var(--rule);">
              <div style="font-weight:600;font-size:15px;">
                <a v-if="it.href" :href="it.href" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:none;">{{ it.title }} →</a>
                <span v-else>{{ it.title }}</span>
              </div>
              <div style="color:var(--ink-70);font-size:13px;line-height:1.6;">{{ it.desc }}</div>
              <div v-if="!it.href" style="font-family:var(--font-mono);font-size:10px;color:var(--ink-50);margin-top:2px;">link to be added</div>
            </li>
          </ul>
        </section>

        <section class="civic-section" v-if="doc.pending_note">
          <p style="font-family:var(--font-mono);font-size:11px;color:var(--ink-50);">{{ doc.pending_note }}</p>
        </section>

        <app-footer />
      </div>
      <div v-else-if="error" style="padding:80px 56px;color:var(--highlight);font-family:var(--font-mono);font-size:12px;">{{ error }}</div>
    `,
  };
})();
