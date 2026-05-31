/* CommunityPage — Discord, GitHub Issues, contribution path.
   Content is data-driven and bilingual: data/pages/community.<locale>.json,
   loaded per locale and reloaded when the locale changes. The file carries the
   page chrome, the channels, and the contributing block, all in one locale. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['community-page'] = {
    setup() { return { store: window.VWStore }; },
    data() { return { doc: null, error: null }; },
    computed: {
      loadKey() { return this.store.locale || 'en'; },
      pg() { return (this.doc && this.doc.page) || {}; },
      channels() { return (this.doc && this.doc.channels) || []; },
      contributing() { return this.doc && this.doc.contributing; },
    },
    watch: { loadKey: { handler: 'load', immediate: true } },
    methods: {
      async load() {
        try { this.doc = await window.VWLoadPageData('community', this.store.locale); }
        catch (e) { this.error = e.message; }
      },
    },
    template: `
      <div v-if="doc">
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
              <h2 class="channel-name">{{ c.label }}</h2>
              <p>{{ c.blurb }}</p>
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
            <h2>{{ contributing.title }}</h2>
            <div class="meta">MIT</div>
          </div>
          <p style="max-width:60ch;color:var(--ink-70);font-size:15px;line-height:1.7;">
            {{ contributing.body }}
          </p>
        </section>

        <app-footer />
      </div>
      <div v-else-if="error" style="padding:80px 56px;color:var(--highlight);font-family:var(--font-mono);font-size:12px;">{{ error }}</div>
    `,
  };
})();
