/* LibraryPage — home / library view. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['library-page'] = {
    emits: ['navigate'],
    setup() { return { store: window.VWStore }; },
    data() {
      return {
        /* Public PDF collection (Google shared drive, "anyone with the link").
           Account-agnostic /folders/<id> form — never the /u/N/ variant. */
        printDriveUrl: 'https://drive.google.com/drive/folders/1iMLVRX51UQDfjRRs2FnHPmH912MCj_7C?usp=sharing',
      };
    },
    computed: {
      papers() {
        return (this.store.papers || []).filter(p => p.category !== 'architecture');
      },
      published() { return this.papers.filter(p => p.status === 'Published'); },
      /* Featured is the "start here" on-ramp: the first three papers in reading
         order, regardless of publish status, so the row is always meaningful and
         stable rather than tracking whichever papers happen to be Published. */
      featured() {
        return this.papers.slice()
          .sort((a, b) => String(a.num || '').localeCompare(String(b.num || ''), undefined, { numeric: true }))
          .slice(0, 3);
      },
      /* The public home shows the live + forthcoming collection. Drafts and
         placeholders are work-in-progress and live only in the full Index
         catalog (/index), so the home and the index stay consistent. */
      rest() { return this.papers.filter(p => p.status === 'Published' || p.status === 'Forthcoming'); },
      seriesMeta() {
        const tpl = this.store.t.section_titles?.series_meta_tpl || '{n} entries';
        return tpl.replace('{n}', this.papers.length).replace('{r}', (this.store.repos || []).length);
      },
      /* Stats with the paper count computed live, so it never drifts from the
         data or the Index. The first stat is "Papers"; its value tracks the
         numbered papers and the sub keeps the locale wording from site.json. */
      stats() {
        const base = (this.store.t.stats || []).map(s => ({ ...s }));
        if (base.length) {
          const numbered = this.papers.filter(p => /^\d+$/.test(String(p.num))).length;
          base[0] = { ...base[0], v: String(numbered) };
        }
        /* Repository count, computed live from data/repos.json (store.repos) so
           it tracks the file and never drifts. The sub splits open vs on-request. */
        const repos = this.store.repos || [];
        if (base.length > 1 && repos.length) {
          const open = repos.filter(r => r.category === 'open').length;
          const onreq = repos.length - open;
          const ui = this.store.t.ui || {};
          const sub = onreq
            ? (ui.repos_split || '{open} open · {onreq} on request').replace('{open}', open).replace('{onreq}', onreq)
            : base[1].sub;
          base[1] = { ...base[1], v: String(repos.length), sub };
        }
        /* Listening-time cards, computed live from the measured narration
           durations and tied to the active locale: FR narration is a different
           runtime than EN, so toggling language re-totals against the FR audio. */
        const narrated = this.published.filter(p => this.listenSecFor(p) > 0);
        const totalSec = narrated.reduce((a, p) => a + this.listenSecFor(p), 0);
        if (totalSec) {
          const ui = this.store.t.ui || {};
          const hrs = Math.floor(totalSec / 3600), mins = Math.round((totalSec % 3600) / 60);
          const total = hrs ? (hrs + ' h ' + mins + ' min') : (mins + ' min');
          const avg = Math.max(1, Math.round(totalSec / 60 / narrated.length));
          base.push({ k: ui.listening_time || 'Listening time', v: total, sub: ui.of_narration || 'of narration' });
          base.push({ k: ui.per_paper || 'Per paper', v: avg + ' min', sub: ui.on_average || 'on average' });
        }
        return base;
      },
    },
    methods: {
      open(id) { this.$emit('navigate', { page: 'paper', id }); },
      /* Narration length (seconds) for the active locale. The non-primary locale
         (typically FR) carries its own measured duration in i18n[locale]; the
         primary locale (typically EN) uses the top-level listen_sec. Returns 0
         when that locale has no measured audio, so it drops out of the total. */
      listenSecFor(p) {
        const i = p.i18n && p.i18n[this.store.locale];
        if (i) return i.listen_sec || 0;
        return p.listen_sec || 0;
      },
      paperTitle(p) {
        const i18n = p.i18n && p.i18n[this.store.locale];
        return (i18n && i18n.title) || p.title;
      },
      paperSubtitle(p) {
        const i18n = p.i18n && p.i18n[this.store.locale];
        return (i18n && i18n.subtitle) || p.subtitle;
      },
    },
    template: `
      <div v-if="store.ready">
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <span>{{ store.t.publisher }}</span>
            <span>·</span>
            <a class="oss-link" href="https://github.com/GovAlta/the-velocity-white-papers"
               target="_blank" rel="noopener">Open source · MIT</a>
          </div>
          <h1 v-html="store.t.hero.title"></h1>
          <p class="lede">{{ store.t.hero.subtitle }}</p>
        </section>

        <stat-rail :stats="stats" />

        <section class="civic-section">
          <div class="head">
            <h2>{{ store.t.section_titles.about }}</h2>
          </div>
        </section>
        <div class="civic-about">
          <p v-for="(para, i) in (store.t.about_body || [])" :key="'about-' + i">{{ para }}</p>
        </div>

        <section class="civic-section">
          <div class="head">
            <h2>{{ store.t.section_titles.complete_series }}</h2>
            <div class="meta">{{ seriesMeta }}</div>
          </div>
        </section>
        <library-grid :papers="rest" @open="open" />

        <section class="civic-section" v-if="store.t.print_edition">
          <div class="head">
            <h2>{{ store.t.print_edition.title }}</h2>
            <div class="meta">{{ store.t.print_edition.volume }}</div>
          </div>
        </section>
        <section class="civic-print" v-if="store.t.print_edition">
          <a class="civic-print-fig" :href="printDriveUrl" target="_blank" rel="noopener">
            <img :src="'public/images/covers/render.jpg'" :alt="store.t.print_edition.image_alt" width="760" height="570" loading="lazy" decoding="async" />
          </a>
          <div class="civic-print-body">
            <p class="lead">{{ store.t.print_edition.body }}</p>
            <p class="note">{{ store.t.print_edition.print_note }}</p>
            <div class="civic-print-actions">
              <a class="civic-print-btn primary" :href="printDriveUrl" target="_blank" rel="noopener">{{ store.t.print_edition.download_cta }}</a>
            </div>
            <p class="forthcoming">{{ store.t.print_edition.forthcoming }}</p>
          </div>
        </section>

        <app-footer />
      </div>
      <div v-else style="padding:80px 56px;color:var(--ink-50);font-family:var(--font-mono);font-size:12px;">
        {{ (store.t.ui && store.t.ui.loading_library) || 'Loading…' }}
      </div>
    `,
  };
})();
