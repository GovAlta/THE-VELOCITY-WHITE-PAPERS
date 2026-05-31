/* UpdatesPage — living changelog. New findings, new code releases, new
   evidence accumulated over the four-year cycle. Newest first. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['updates-page'] = {
    setup() { return { store: window.VWStore }; },
    data() { return { entries: [], error: null }; },
    async mounted() {
      try {
        const res = await fetch('data/updates.json', { cache: 'no-cache' });
        const j = await res.json();
        this.entries = (j.entries || []).slice().sort((a, b) => b.date.localeCompare(a.date));
      } catch (e) { this.error = e.message; }
    },
    methods: {
      kindLabel(k) {
        const labels_en = { release: 'Release', finding: 'Finding', paper: 'Paper', note: 'Note' };
        const labels_fr = { release: 'Mise en service', finding: 'Constat', paper: 'Livre', note: 'Note' };
        const map = this.store.locale === 'fr' ? labels_fr : labels_en;
        return map[k] || k;
      },
    },
    template: `
      <div>
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <span>{{ store.locale === 'fr' ? 'Mises à jour vivantes' : 'Living updates' }}</span>
          </div>
          <h1>{{ store.locale === 'fr' ? 'Ce qui a' : 'What has' }} <em>{{ store.locale === 'fr' ? 'changé.' : 'changed.' }}</em></h1>
          <p class="lede">{{ store.locale === 'fr'
            ? "Nouveaux constats, nouvelles versions logicielles, nouvelles preuves. Quatre ans de cycle. Du plus récent au plus ancien."
            : 'New findings, new code releases, new evidence. A four-year cycle. Newest first.' }}</p>
        </section>

        <section class="civic-section">
          <ol class="updates-list">
            <li v-for="e in entries" :key="e.id">
              <div class="upd-meta">
                <span class="upd-date">{{ e.date }}</span>
                <span class="upd-kind" :class="'k-' + e.kind">{{ kindLabel(e.kind) }}</span>
              </div>
              <h2 class="upd-title">{{ (e[store.locale] || e.en).title }}</h2>
              <p>{{ (e[store.locale] || e.en).body }}</p>
              <div class="upd-links" v-if="e.links && e.links.length">
                <a v-for="l in e.links" :key="l.href"
                   :href="l.href">{{ store.locale === 'fr' ? l.label_fr : l.label_en }}</a>
              </div>
            </li>
          </ol>
          <div v-if="!entries.length && !error" style="color:var(--ink-50);font-family:var(--font-mono);padding:24px 0;">
            {{ store.locale === 'fr' ? 'Aucune mise à jour publiée pour le moment.' : 'No updates published yet.' }}
          </div>
          <div v-if="error" style="color:var(--highlight);font-family:var(--font-mono);">{{ error }}</div>
        </section>

        <app-footer />
      </div>
    `,
  };
})();
