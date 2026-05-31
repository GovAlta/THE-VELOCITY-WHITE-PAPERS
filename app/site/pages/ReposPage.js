/* ReposPage — list of public companion repositories released alongside papers.
   Derived from store.papers (every paper with a `repo` field). Enriched and made
   bilingual by data/pages/repos.<locale>.json, loaded per locale and reloaded
   when the locale changes: the `page` block holds the hero and labels, and each
   repo entry (keyed by paper id) holds the locale-specific description. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['repos-page'] = {
    emits: ['navigate'],
    setup() { return { store: window.VWStore }; },
    data() { return { doc: null, error: null }; },
    computed: {
      loadKey() { return this.store.locale || 'en'; },
      pg() { return (this.doc && this.doc.page) || {}; },
      repos() {
        const enrichment = (this.doc && this.doc.repos) || {};
        const out = [];
        for (const p of (this.store.papers || [])) {
          if (!p.repo) continue;
          const slug = p.repo.replace('https://github.com/', '');
          const ex = enrichment[p.id] || {};
          out.push({
            paper_id: p.id,
            num: p.num,
            paper_title: p.title,
            paper_tier: p.tier,
            url: p.repo,
            slug,
            license: ex.license || 'MIT',
            language: ex.language || null,
            status: ex.status || p.status || 'Forthcoming',
            description: ex.description || p.subtitle,
          });
        }
        return out;
      },
    },
    watch: { loadKey: { handler: 'load', immediate: true } },
    methods: {
      async load() {
        try { this.doc = await window.VWLoadPageData('repos', this.store.locale); }
        catch (e) { this.error = e.message; }
      },
      openPaper(id) { this.$emit('navigate', { page: 'paper', id }); },
    },
    template: `
      <div>
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <span>{{ pg.eyebrow }}</span>
            <span>·</span>
            <span>{{ repos.length }} {{ pg.repos_word }}</span>
          </div>
          <h1>{{ pg.title_lead }} <em>{{ pg.title_em }}</em></h1>
          <p class="lede">{{ pg.lede }}</p>
        </section>

        <section class="civic-section">
          <ul class="repo-list">
            <li v-for="r in repos" :key="r.paper_id">
              <div class="repo-num">№ {{ r.num }}</div>
              <div class="repo-body">
                <a class="repo-slug" :href="r.url" target="_blank" rel="noopener">
                  {{ r.slug }}
                </a>
                <div class="repo-title">{{ r.paper_title }}</div>
                <div class="repo-desc">{{ r.description }}</div>
                <div class="repo-meta">
                  <span>{{ r.license }}</span>
                  <span v-if="r.language">{{ r.language }}</span>
                  <span class="repo-status" :class="r.status.toLowerCase()">{{ r.status }}</span>
                </div>
              </div>
              <button class="repo-link" @click="openPaper(r.paper_id)">
                {{ pg.read }}
              </button>
            </li>
          </ul>
          <div v-if="!repos.length" style="color:var(--ink-50);font-family:var(--font-mono);padding:24px 0;">
            {{ pg.empty }}
          </div>
        </section>

        <app-footer />
      </div>
    `,
  };
})();
