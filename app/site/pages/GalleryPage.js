/* GalleryPage — a browsable view of the media embedded across the papers.
   Reads data/gallery.json (built by scripts/build-gallery.mjs from every
   paper's youtube and figure blocks). Videos lead; figures follow in a grid.
   Every item links back to the paper it came from. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['gallery-page'] = {
    setup() { return { store: window.VWStore }; },
    data() { return { data: null, error: null }; },
    async mounted() {
      try {
        const r = await fetch('data/gallery.json', { cache: 'no-cache' });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        this.data = await r.json();
      } catch (e) { this.error = 'Gallery is not built yet. Run npm run build:gallery. (' + e.message + ')'; }
    },
    computed: {
      t() {
        const fr = (this.store.locale === 'fr');
        return fr
          ? { eyebrow: 'Médias', lead: 'Vidéos et', em: 'figures.', lede: "Les vidéos et figures intégrées dans les livres, rassemblées en un seul endroit. Chaque élément renvoie au livre dont il provient.", videos: 'Vidéos', figures: 'Figures', from: 'Tiré de', watch: 'Regarder sur YouTube' }
          : { eyebrow: 'Media', lead: 'Videos and', em: 'figures.', lede: 'The videos and figures embedded across the papers, gathered in one place. Every item links back to the paper it came from.', videos: 'Videos', figures: 'Figures', from: 'From', watch: 'Watch on YouTube' };
      },
    },
    template: `
      <div>
        <section class="civic-hero">
          <div class="civic-eyebrow"><span class="dot"></span><span>{{ t.eyebrow }}</span></div>
          <h1>{{ t.lead }} <em>{{ t.em }}</em></h1>
          <p class="lede">{{ t.lede }}</p>
        </section>

        <div v-if="data">
          <section class="civic-section" v-if="data.videos && data.videos.length">
            <div class="head"><h2>{{ t.videos }}</h2><div class="meta">{{ data.videos.length }}</div></div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px;padding-bottom:24px;">
              <div v-for="(v,i) in data.videos" :key="'v'+i" style="border:1px solid var(--rule);border-radius:10px;overflow:hidden;">
                <a :href="v.url" target="_blank" rel="noopener" style="display:block;position:relative;">
                  <img v-if="v.thumb" :src="v.thumb" :alt="v.title || v.paper_title" loading="lazy" style="width:100%;display:block;aspect-ratio:16/9;object-fit:cover;" />
                </a>
                <div style="padding:12px 14px;">
                  <div style="font-weight:600;font-size:14px;">{{ v.title || v.caption || t.videos }}</div>
                  <a :href="'/paper/' + v.paper_id" style="font-family:var(--font-mono);font-size:11px;color:var(--accent);text-decoration:none;">{{ t.from }} № {{ v.num }} · {{ v.paper_title }} →</a>
                </div>
              </div>
            </div>
          </section>

          <section class="civic-section" v-if="data.images && data.images.length">
            <div class="head"><h2>{{ t.figures }}</h2><div class="meta">{{ data.images.length }}</div></div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;padding-bottom:24px;">
              <a v-for="(img,i) in data.images" :key="'i'+i" :href="'/paper/' + img.paper_id"
                 style="text-decoration:none;border:1px solid var(--rule);border-radius:8px;overflow:hidden;display:block;">
                <img :src="img.src" :alt="img.alt" loading="lazy" style="width:100%;display:block;aspect-ratio:3/2;object-fit:cover;" />
                <div style="padding:8px 10px;">
                  <div style="font-family:var(--font-mono);font-size:10px;color:var(--highlight);text-transform:uppercase;">{{ img.fno }}</div>
                  <div style="font-size:12px;color:var(--ink-70);line-height:1.4;">{{ img.title }}</div>
                  <div style="font-family:var(--font-mono);font-size:10px;color:var(--ink-50);margin-top:2px;">{{ t.from }} № {{ img.num }}</div>
                </div>
              </a>
            </div>
          </section>
        </div>
        <div v-else-if="error" style="padding:60px 56px;color:var(--ink-50);font-family:var(--font-mono);font-size:12px;">{{ error }}</div>

        <app-footer />
      </div>
    `,
  };
})();
