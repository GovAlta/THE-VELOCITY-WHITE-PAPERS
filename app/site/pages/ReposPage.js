/* ReposPage — list of public companion repositories released alongside papers.
   Derived from papers.json (every paper with a `repo` field). Enriched and made
   bilingual by data/repos.json: the `page` block holds the hero and labels
   (en/fr), and each repo entry holds en_description / fr_description. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['repos-page'] = {
    emits: ['navigate'],
    setup() { return { store: window.VWStore }; },
    data() { return { enrichment: {}, page: null, error: null }; },
    async mounted() {
      try {
        const res = await fetch('data/repos.json', { cache: 'no-cache' });
        if (res.ok) {
          const j = await res.json();
          this.enrichment = j.repos || {};
          this.page = j.page || null;
        }
      } catch { /* enrichment is optional */ }
    },
    computed: {
      pg() { return this.page ? (this.page[this.store.locale] || this.page.en) : {}; },
      repos() {
        const out = [];
        for (const p of (this.store.papers || [])) {
          if (!p.repo) continue;
          const slug = p.repo.replace('https://github.com/', '');
          const ex = this.enrichment[p.id] || {};
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
            description: ex[this.store.locale + '_description']
                      || ex.en_description
                      || p.subtitle,
          });
        }
        return out;
      },
    },
    methods: {
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
