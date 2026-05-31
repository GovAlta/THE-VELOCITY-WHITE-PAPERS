/* CommunityPage — Discord, GitHub Issues, contribution path.
   Content is data-driven and bilingual: data/community.json carries the page
   chrome (page.en/fr), the channels (each with en/fr), and the contributing
   block (en/fr). */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['community-page'] = {
    setup() { return { store: window.VWStore }; },
    data() { return { channels: [], contributing: null, page: null, error: null }; },
    async mounted() {
      try {
        const res = await fetch('data/community.json', { cache: 'no-cache' });
        const j = await res.json();
        this.channels = j.channels || [];
        this.contributing = j.contributing || null;
        this.page = j.page || null;
      } catch (e) { this.error = e.message; }
    },
    computed: {
      pg() { return this.page ? (this.page[this.store.locale] || this.page.en) : {}; },
    },
    template: `
      <div>
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <span>{{ pg.eyebrow }}</span>
          </div>
          <h1>{{ pg.title_lead }} <em>{{ pg.title_em }}</em></h1>
          <p class="lede">{{ pg.lede }}</p>
        </section>

        <section class="civic-section">
          <ul class="channel-list">
            <li v-for="c in channels" :key="c.id" :class="{ 'is-unavailable': !c.available }">
              <div class="channel-kind">{{ c.kind }}</div>
              <h2 class="channel-name">{{ (c[store.locale] || c.en).label }}</h2>
              <p>{{ (c[store.locale] || c.en).blurb }}</p>
              <a v-if="c.available" :href="c.href" target="_blank" rel="noopener" class="channel-link">
                {{ pg.open }}
              </a>
              <span v-else class="channel-pending">
                {{ pg.soon }}
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
