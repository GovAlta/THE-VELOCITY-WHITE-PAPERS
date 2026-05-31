/* ManualPage — operator's manual: the steps a human and an AI take to populate
   and run this CMS. Content is data-driven and bilingual:
   data/pages/manual.<locale>.json, loaded per locale and reloaded when the
   locale changes. Paragraph and step strings may include inline <code> and
   <strong> markup, rendered with v-html (trusted static content only).

   Reader-visible prose follows style-guide/00: plain declarative sentences,
   no em dashes, no "not X" constructions, no banned vocabulary. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['manual-page'] = {
    emits: ['navigate'],
    setup() { return { store: window.VWStore }; },
    data() { return { doc: null, error: null }; },
    computed: {
      loadKey() { return this.store.locale || 'en'; },
    },
    watch: { loadKey: { handler: 'load', immediate: true } },
    methods: {
      async load() {
        try { this.doc = await window.VWLoadPageData('manual', this.store.locale); }
        catch (e) { this.error = e.message; }
      },
    },
    template: `
      <div v-if="doc" class="civic-doc-page">
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <template v-for="(seg, i) in doc.eyebrow" :key="i">
              <span v-if="i > 0">·</span>
              <span>{{ seg }}</span>
            </template>
          </div>
          <h1>{{ doc.h1 }}</h1>
          <p class="lede">{{ doc.lede }}</p>
        </section>

        <template v-for="(s, i) in doc.sections" :key="i">
          <section class="civic-section">
            <div class="head">
              <h2>{{ s.heading }}</h2>
              <div class="meta" v-if="s.meta">{{ s.meta }}</div>
            </div>
          </section>
          <div class="manual-body">
            <p v-for="(p, j) in (s.paras || [])" :key="'p'+j" v-html="p"></p>
            <ol class="manual-steps" v-if="s.steps">
              <li v-for="(st, k) in s.steps" :key="'s'+k" v-html="st"></li>
            </ol>
          </div>
        </template>

        <app-footer />
      </div>
      <div v-else-if="error" style="padding:80px 56px;color:var(--highlight);font-family:var(--font-mono);font-size:12px;">{{ error }}</div>
      <div v-else style="padding:80px 56px;color:var(--ink-50);font-family:var(--font-mono);font-size:12px;">Loading…</div>
    `,
  };
})();
