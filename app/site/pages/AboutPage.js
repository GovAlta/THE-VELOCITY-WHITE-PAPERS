/* AboutPage — open source, license, methodology, contact. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['about-page'] = {
    setup() { return { store: window.VWStore }; },
    template: `
      <div v-if="store.site">
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <span>About this collection</span>
          </div>
          <h1>Open source by <em>default</em>.</h1>
          <p class="lede">The site itself is open source, published via GitHub Pages. The entire site is cloneable and adaptable. MIT license with explicit disclaimers: not responsible for decisions or costs incurred by adopters; shared in the spirit of national collaboration; users must evaluate and assess these tools in their own context.</p>
        </section>

        <section class="civic-section">
          <div class="head">
            <h2>How to use this site</h2>
            <div class="meta">readme · methodology · feedback</div>
          </div>
          <div style="padding-bottom:24px;max-width:60ch;color:var(--ink-70);font-size:15px;line-height:1.7;">
            <p>Sequential reading is the recommended path. Each paper builds on what comes before. Lateral links between papers let readers jump sideways without losing context.</p>
            <p>Every paper is downloadable as Markdown and JSON so readers can feed them into their own AI tooling. The full site is cloneable from GitHub. The site uses a small cookie to track which papers a reader has visited and surface what is new since their last visit.</p>
            <p>No vendor or product is being advocated. For transparency, any vendors or models actually used in production will be disclosed.</p>
          </div>
        </section>

        <section class="civic-section">
          <div class="head">
            <h2>Public repositories</h2>
            <div class="meta">released alongside the papers</div>
          </div>
          <ul style="list-style:none;padding:0;margin:0;border-top:1px solid var(--rule);">
            <li v-for="p in store.papers.filter(p => p.repo)" :key="p.id"
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
            <h2>{{ store.locale === 'fr' ? 'Aussi sur ce site' : 'Also on this site' }}</h2>
            <div class="meta">{{ store.locale === 'fr' ? 'cinq raccourcis' : 'five shortcuts' }}</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding-bottom:24px;">
            <a href="#/glossary" class="civic-card" style="text-decoration:none;cursor:pointer;">
              <div class="head"><span class="num">→</span><span>{{ store.locale === 'fr' ? 'Glossaire' : 'Glossary' }}</span></div>
              <h3>{{ store.locale === 'fr' ? 'Vocabulaire de la collection' : 'Vocabulary of the collection' }}</h3>
            </a>
            <a href="#/repos" class="civic-card" style="text-decoration:none;cursor:pointer;">
              <div class="head"><span class="num">→</span><span>{{ store.locale === 'fr' ? 'Dépôts' : 'Repositories' }}</span></div>
              <h3>{{ store.locale === 'fr' ? 'Les dépôts publics' : 'Public companion repositories' }}</h3>
            </a>
            <a href="#/updates" class="civic-card" style="text-decoration:none;cursor:pointer;">
              <div class="head"><span class="num">→</span><span>{{ store.locale === 'fr' ? 'Mises à jour' : 'Updates' }}</span></div>
              <h3>{{ store.locale === 'fr' ? 'Ce qui a changé' : 'What has changed' }}</h3>
            </a>
            <a href="#/community" class="civic-card" style="text-decoration:none;cursor:pointer;">
              <div class="head"><span class="num">→</span><span>{{ store.locale === 'fr' ? 'Communauté' : 'Community' }}</span></div>
              <h3>{{ store.locale === 'fr' ? 'Où parler du travail' : 'Where to talk about the work' }}</h3>
            </a>
          </div>
        </section>

        <app-footer />
      </div>
    `,
  };
})();
