/* ManualPage — operator's manual: the steps a human and an AI take to populate
   and run this CMS. Content is data-driven and bilingual: data/manual.json
   carries en + fr. Paragraph and step strings may include inline <code> and
   <strong> markup, rendered with v-html (trusted static content only).

   Reader-visible prose follows style-guide/00: plain declarative sentences,
   no em dashes, no "not X" constructions, no banned vocabulary. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['manual-page'] = {
    emits: ['navigate'],
    setup() { return { store: window.VWStore }; },
    data() { return { doc: null, error: null }; },
    async mounted() {
      try {
        const res = await fetch('data/manual.json', { cache: 'no-cache' });
        this.doc = await res.json();
      } catch (e) { this.error = e.message; }
    },
    computed: {
      pg() { return this.doc ? (this.doc[this.store.locale] || this.doc.en) : null; },
    },
    template: `
      <div v-if="pg" class="civic-doc-page">
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <template v-for="(seg, i) in pg.eyebrow" :key="i">
              <span v-if="i > 0">·</span>
              <span>{{ seg }}</span>
            </template>
          </div>
          <h1>{{ pg.h1 }}</h1>
          <p class="lede">{{ pg.lede }}</p>
        </section>

        <template v-for="(s, i) in pg.sections" :key="i">
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
