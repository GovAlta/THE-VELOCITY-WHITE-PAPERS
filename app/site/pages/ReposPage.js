/* ReposPage — list of public companion repositories released alongside papers.
   Derived from papers.json (every paper with a `repo` field). Optionally
   enriched by data/repos.json for descriptions, license, status. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['repos-page'] = {
    emits: ['navigate'],
    setup() { return { store: window.VWStore }; },
    data() { return { enrichment: {}, error: null }; },
    async mounted() {
      try {
        const res = await fetch('data/repos.json', { cache: 'no-cache' });
        if (res.ok) {
          const j = await res.json();
          this.enrichment = j.repos || {};
        }
      } catch { /* enrichment is optional */ }
    },
    computed: {
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
            <span>{{ store.locale === 'fr' ? 'Dépôts publics' : 'Public repositories' }}</span>
            <span>·</span>
            <span>{{ repos.length }} {{ store.locale === 'fr' ? 'dépôts' : 'repositories' }}</span>
          </div>
          <h1>{{ store.locale === 'fr' ? 'Tout est' : 'Everything is' }} <em>{{ store.locale === 'fr' ? 'libre.' : 'open source.' }}</em></h1>
          <p class="lede">{{ store.locale === 'fr'
            ? "Chaque livre blanc qui s'accompagne d'un logiciel publie ce logiciel ici. Le site lui-même est dans cette liste. Aucun verrouillage propriétaire, aucune confiance aveugle."
            : 'Every paper that ships with software publishes that software here. The site itself is in the list. No proprietary lock-in, no blind trust required.' }}</p>
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
                {{ store.locale === 'fr' ? 'Lire le livre →' : 'Read the paper →' }}
              </button>
            </li>
          </ul>
          <div v-if="!repos.length" style="color:var(--ink-50);font-family:var(--font-mono);padding:24px 0;">
            {{ store.locale === 'fr' ? 'Aucun dépôt publié pour le moment.' : 'No repositories published yet.' }}
          </div>
        </section>

        <app-footer />
      </div>
    `,
  };
})();
