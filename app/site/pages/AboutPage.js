/* AboutPage — open source, license, methodology, contact.
   Content is data-driven and bilingual: data/about.json carries en + fr.
   The public repositories list is still derived from store.papers. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['about-page'] = {
    setup() { return { store: window.VWStore }; },
    data() { return { doc: null, error: null }; },
    async mounted() {
      try {
        const res = await fetch('data/about.json', { cache: 'no-cache' });
        this.doc = await res.json();
      } catch (e) { this.error = e.message; }
    },
    computed: {
      pg() { return this.doc ? (this.doc[this.store.locale] || this.doc.en) : null; },
      repoPapers() { return (this.store.papers || []).filter(p => p.repo); },
    },
    template: `
      <div v-if="pg">
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <span>{{ pg.eyebrow }}</span>
          </div>
          <h1>{{ pg.title_lead }} <em>{{ pg.title_em }}</em></h1>
          <p class="lede">{{ pg.lede }}</p>
        </section>

        <section class="civic-section">
          <div class="head">
            <h2>{{ pg.use.heading }}</h2>
            <div class="meta">{{ pg.use.meta }}</div>
          </div>
          <div style="padding-bottom:24px;max-width:60ch;color:var(--ink-70);font-size:15px;line-height:1.7;">
            <p v-for="(p, i) in pg.use.paras" :key="i">{{ p }}</p>
          </div>
        </section>

        <section class="civic-section">
          <div class="head">
            <h2>{{ pg.repos.heading }}</h2>
            <div class="meta">{{ pg.repos.meta }}</div>
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
            <h2>{{ pg.also.heading }}</h2>
            <div class="meta">{{ pg.also.meta }}</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding-bottom:24px;">
            <a v-for="c in pg.also.cards" :key="c.href" :href="c.href" class="civic-card" style="text-decoration:none;cursor:pointer;">
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
