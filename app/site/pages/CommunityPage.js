/* CommunityPage — Discord, GitHub Issues, contribution path. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['community-page'] = {
    setup() { return { store: window.VWStore }; },
    data() { return { channels: [], contributing: null, error: null }; },
    async mounted() {
      try {
        const res = await fetch('data/community.json', { cache: 'no-cache' });
        const j = await res.json();
        this.channels = j.channels || [];
        this.contributing = j.contributing || null;
      } catch (e) { this.error = e.message; }
    },
    template: `
      <div>
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <span>{{ store.locale === 'fr' ? 'Communauté' : 'Community' }}</span>
          </div>
          <h1>{{ store.locale === 'fr' ? 'Où parler de' : 'Where to talk about' }} <em>{{ store.locale === 'fr' ? 'tout ceci.' : 'this work.' }}</em></h1>
          <p class="lede">{{ store.locale === 'fr'
            ? 'Forum ouvert, tickets publics, discussions de fond. La conversation sur la modernisation ne se tient pas en privé.'
            : 'Open forum, public issues, longer-form discussions. The modernization conversation does not happen behind a closed door.' }}</p>
        </section>

        <section class="civic-section">
          <ul class="channel-list">
            <li v-for="c in channels" :key="c.id" :class="{ 'is-unavailable': !c.available }">
              <div class="channel-kind">{{ c.kind }}</div>
              <h2 class="channel-name">{{ (c[store.locale] || c.en).label }}</h2>
              <p>{{ (c[store.locale] || c.en).blurb }}</p>
              <a v-if="c.available" :href="c.href" target="_blank" rel="noopener" class="channel-link">
                {{ store.locale === 'fr' ? 'Ouvrir →' : 'Open →' }}
              </a>
              <span v-else class="channel-pending">
                {{ store.locale === 'fr' ? 'À venir' : 'Coming soon' }}
              </span>
            </li>
          </ul>
        </section>

        <section class="civic-section" v-if="contributing">
          <div class="head">
            <h2>{{ (contributing[store.locale] || contributing.en).title }}</h2>
            <div class="meta">MIT</div>
          </div>
          <p style="max-width:60ch;color:var(--ink-70);font-size:15px;line-height:1.7;">
            {{ (contributing[store.locale] || contributing.en).body }}
          </p>
        </section>

        <app-footer />
      </div>
    `,
  };
})();
