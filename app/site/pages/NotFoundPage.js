/* NotFoundPage — fallback for unknown hash routes. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['not-found-page'] = {
    emits: ['navigate'],
    setup() { return { store: window.VWStore }; },
    computed: {
      paperCount() {
        return (this.store.papers || []).filter(p => p.category === 'paper').length;
      },
      paperCountLabel() {
        const n = this.paperCount;
        if (this.store.locale === 'fr') return n + ' livres blancs';
        return n + ' papers';
      },
    },
    template: `
      <div>
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot" aria-hidden="true"></span>
            <span>404</span>
          </div>
          <h1>{{ store.locale === 'fr' ? 'Cette page' : 'This page' }} <em>{{ store.locale === 'fr' ? "n'existe pas." : 'does not exist.' }}</em></h1>
          <p class="lede">{{ store.locale === 'fr'
            ? "Le chemin demandé n'est pas dans la collection. La bibliothèque et l'index sont les bons points de départ."
            : 'The requested path is not in this collection. The library and the index are good places to start.' }}</p>
        </section>

        <section class="civic-section">
          <div class="head">
            <h2>{{ store.locale === 'fr' ? 'Où aller' : 'Where to go' }}</h2>
            <div class="meta">{{ store.locale === 'fr' ? 'trois raccourcis' : 'three shortcuts' }}</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding-bottom:24px;">
            <a href="#/" class="civic-card" style="text-decoration:none;cursor:pointer;">
              <div class="head" aria-hidden="true"><span class="num">→</span><span>{{ store.locale === 'fr' ? 'Bibliothèque' : 'Library' }}</span></div>
              <h3>{{ paperCountLabel }}</h3>
            </a>
            <a href="#/index" class="civic-card" style="text-decoration:none;cursor:pointer;">
              <div class="head" aria-hidden="true"><span class="num">→</span><span>{{ store.locale === 'fr' ? 'Index' : 'Index' }}</span></div>
              <h3>{{ store.locale === 'fr' ? 'Recherche dans la collection' : 'Search the collection' }}</h3>
            </a>
            <a href="#/glossary" class="civic-card" style="text-decoration:none;cursor:pointer;">
              <div class="head" aria-hidden="true"><span class="num">→</span><span>{{ store.locale === 'fr' ? 'Glossaire' : 'Glossary' }}</span></div>
              <h3>{{ store.locale === 'fr' ? 'Vocabulaire de la collection' : 'Vocabulary of the collection' }}</h3>
            </a>
          </div>
        </section>

        <app-footer />
      </div>
    `,
  };
})();
