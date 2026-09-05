/* AgentQuartet — BESPOKE visual for wp-08 (The Well-Built Harness).

   Four cards for the red, green, blue, yellow review agents that ship with
   every harness by default. The text is bilingual: each label and each check
   line carries an EN and an FR string. The component reads window.VWStore.locale
   (reactive, so locale switches in the nav rerender the visual).

   Registered as a figure chart via chart.kind = "wp08-agent-quartet".
*/

(function () {
  window.VWComponents = window.VWComponents || {};
  if (window.VWVisuals) {
    window.VWVisuals.registerReusable('wp08-agent-quartet', 'wp08-agent-quartet');
  }

  const AGENTS = [
    {
      id: 'red',
      slash: '/redteam',
      name: { en: 'Redteam',  fr: 'Équipe rouge' },
      tagline: {
        en: 'Adversarial recon + exploitation planner',
        fr: 'Reconnaissance adversariale et planification d’exploits',
      },
      mode: {
        en: '10 deterministic + 1 probabilistic',
        fr: '10 déterministes + 1 probabiliste',
      },
      checks: {
        en: [
          'Certificate transparency search',
          'DNS enumeration and subdomain discovery',
          'HTTP header and TLS audits',
          'A Claude-driven planner for chained exploits',
        ],
        fr: [
          'Recherche de transparence des certificats',
          'Énumération DNS et découverte de sous-domaines',
          'Audits des en-têtes HTTP et TLS',
          'Un planificateur Claude pour les exploits chaînés',
        ],
      },
      bg: '#fde8e4', accent: '#b3331a', border: '#fda4af',
    },
    {
      id: 'green',
      slash: '/greenteam',
      name: { en: 'Greenteam', fr: 'Équipe verte' },
      tagline: {
        en: 'Code hygiene and supply chain',
        fr: 'Hygiène du code et chaîne d’approvisionnement',
      },
      mode: {
        en: 'Deterministic',
        fr: 'Déterministe',
      },
      checks: {
        en: [
          'npm audit and OSV scanning',
          'Secret scan across the tree',
          'Dangerous-pattern scan (innerHTML, eval)',
          'Coverage and gitignore hygiene',
        ],
        fr: [
          'npm audit et balayage OSV',
          'Recherche de secrets dans toute l’arborescence',
          'Patrons dangereux (innerHTML, eval)',
          'Couverture de tests et propreté du gitignore',
        ],
      },
      bg: '#d8efdc', accent: '#14633a', border: '#86efac',
    },
    {
      id: 'blue',
      slash: '/blueteam',
      name: { en: 'Blueteam', fr: 'Équipe bleue' },
      tagline: {
        en: 'Defensive review with judgement',
        fr: 'Revue défensive avec jugement',
      },
      mode: {
        en: 'Probabilistic over deterministic evidence',
        fr: 'Probabiliste sur preuves déterministes',
      },
      checks: {
        en: [
          'Application map and trust boundaries',
          'STRIDE-style threat model',
          'OWASP ASVS Level 2 conformance walk',
          'Code-fix proposals as unified diffs',
        ],
        fr: [
          'Carte de l’application et frontières de confiance',
          'Modèle de menaces de style STRIDE',
          'Marche de conformité OWASP ASVS niveau 2',
          'Propositions de correctifs en diffs unifiés',
        ],
      },
      bg: '#dde9ff', accent: '#1e3a8a', border: '#93c5fd',
    },
    {
      id: 'yellow',
      slash: '/yellowteam',
      name: { en: 'Yellowteam', fr: 'Équipe jaune' },
      tagline: {
        en: 'Prose audit, catches AI smell',
        fr: 'Audit de la prose, détecte l’odeur d’IA',
      },
      mode: {
        en: 'Deterministic',
        fr: 'Déterministe',
      },
      checks: {
        en: [
          'Flags em dashes and banned vocabulary',
          'Flags "not X, but Y" constructions',
          'Flags sycophantic openings and hedge stacks',
          'Flags emojis and decorative noise',
        ],
        fr: [
          'Signale les tirets cadratins et le vocabulaire banni',
          'Signale les tournures « pas X mais Y »',
          'Signale les ouvertures flatteuses et les empilements de couvertures',
          'Signale les émojis et le bruit décoratif',
        ],
      },
      bg: '#fdf3cf', accent: '#92691e', border: '#fcd34d',
    },
  ];

  const I18N = {
    en: {
      sr_summary: 'Four review agents ship with every harness: red runs adversarial recon, green checks hygiene, blue writes the defensive review, yellow audits prose.',
      mode_label: 'Mode',
    },
    fr: {
      sr_summary: 'Quatre agents de revue accompagnent chaque harnais : le rouge fait de la reconnaissance adversariale, le vert vérifie l’hygiène, le bleu rédige la revue défensive, le jaune audite la prose.',
      mode_label: 'Mode',
    },
  };

  window.VWComponents['wp08-agent-quartet'] = {
    props: {
      slide:  { type: Object, default: () => ({}) },
      config: { type: Object, default: () => ({}) },
    },
    data() { return { agents: AGENTS }; },
    computed: {
      locale() {
        const l = (window.VWStore && window.VWStore.locale) || 'en';
        return l === 'fr' ? 'fr' : 'en';
      },
      t() { return I18N[this.locale]; },
    },
    template: `
      <figure class="wp08-quartet" role="img" :aria-label="t.sr_summary">
        <div class="wp08-quartet-grid">
          <article v-for="a in agents" :key="a.id"
                   class="wp08-quartet-card"
                   :style="{ background: a.bg, borderColor: a.border }">
            <div class="wp08-quartet-head">
              <span class="wp08-quartet-pill" :style="{ color: a.accent, background: '#fff', borderColor: a.border }">{{ a.id.toUpperCase() }}</span>
              <span class="wp08-quartet-slash">{{ a.slash }}</span>
            </div>
            <h4 class="wp08-quartet-name" :style="{ color: a.accent }">{{ a.name[locale] }}</h4>
            <p class="wp08-quartet-tag">{{ a.tagline[locale] }}</p>
            <div class="wp08-quartet-meta">
              <span class="lbl">{{ t.mode_label }}</span>
              <span>{{ a.mode[locale] }}</span>
            </div>
            <ul class="wp08-quartet-checks">
              <li v-for="(c, i) in a.checks[locale]" :key="i">{{ c }}</li>
            </ul>
          </article>
        </div>
        <figcaption class="sr-only">{{ t.sr_summary }}</figcaption>
      </figure>
    `,
  };
})();
