/* IndexTable — searchable / filterable table of all papers. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['index-table'] = {
    props: { papers: { type: Array, required: true } },
    emits: ['open'],
    setup() { return { edit: window.VWEdit || null, store: window.VWStore }; },
    data() {
      return { query: '', tier: 'all', adding: false, draft: { id: '', num: '', title: '', tier: 'Technical' }, dlBusy: false, dlErr: '' };
    },
    computed: {
      editing() { return !!(this.edit && this.edit.enabled); },
      canReorder() { return this.editing && !this.query.trim() && this.tier === 'all'; },
      tiers() {
        const set = new Set(this.papers.map(p => p.tier).filter(Boolean));
        return ['all', ...set];
      },
      filtered() {
        const q = this.query.trim().toLowerCase();
        return this.papers.filter(p => {
          if (this.tier !== 'all' && p.tier !== this.tier) return false;
          if (!q) return true;
          const i = (p.i18n && p.i18n[this.store.locale]) || {};
          const hay = [p.title, p.subtitle, p.abstract, i.title, i.subtitle, i.abstract, (p.tags || []).join(' '), p.track].join(' ').toLowerCase();
          return hay.includes(q);
        });
      },
    },
    methods: {
      titleOf(p) { const i = p.i18n && p.i18n[this.store.locale]; return (i && i.title) || p.title; },
      subtitleOf(p) { const i = p.i18n && p.i18n[this.store.locale]; return (i && i.subtitle) || p.subtitle; },
      tierLabel(t) { const m = this.store.t.ui && this.store.t.ui.tier_labels; return (m && m[t]) || t; },
      async downloadRow(p) {
        const loc = this.store.locale || 'en';
        try {
          const doc = await window.VWExport.fetchPaper(p.id, loc);
          window.VWExport.download(p.id + '.' + loc + '.md', 'text/markdown', window.VWExport.blocksToMarkdown(doc));
        } catch (e) { /* a single failed fetch is non-fatal */ }
      },
      async downloadAll() {
        if (this.dlBusy) return;
        this.dlBusy = true; this.dlErr = '';
        try { await window.VWExport.downloadAll(this.papers, this.store.locale || 'en'); }
        catch (e) { this.dlErr = this.store.locale === 'fr' ? 'Échec du téléchargement.' : 'Download failed.'; }
        finally { this.dlBusy = false; }
      },
      statusClass(p) {
        const s = (p.status || '').toLowerCase();
        if (s === 'published')   return 'status published';
        if (s === 'forthcoming') return 'status forthcoming';
        return 'status draft';
      },
      async createPaper() {
        if (!this.edit) return;
        const r = await this.edit.createPaper(this.draft);
        if (r && r.ok) { this.adding = false; this.draft = { id: '', num: '', title: '', tier: 'Technical' }; }
      },
      del(i, p) {
        if (!this.edit) return;
        if (window.confirm('Delete paper "' + p.id + '" (' + (p.title || '') + ')? This removes its JSON files. Images and audio under public/ are left in place.')) {
          this.edit.deletePaper(i);
        }
      },
    },
    template: `
      <section class="civic-index">
        <div class="index-head">
          <h1>{{ (store.t.ui && store.t.ui.index_title) || 'The Index' }}</h1>
          <div class="count">{{ filtered.length }} / {{ papers.length }} {{ (store.t.ui && store.t.ui.papers_word) || 'papers' }}</div>
          <button class="idx-dlall" :disabled="dlBusy" @click="downloadAll"
                  :title="store.locale === 'fr' ? 'Télécharger tous les livres en JSON + Markdown (sans média)' : 'Download every paper as JSON + Markdown (no media)'">
            <span aria-hidden="true">⤓</span>
            {{ dlBusy ? (store.locale === 'fr' ? 'Préparation…' : 'Preparing…') : (store.locale === 'fr' ? 'Tout télécharger (.zip)' : 'Download all (.zip)') }}
          </button>
        </div>
        <p v-if="dlErr" class="idx-dlerr">{{ dlErr }}</p>

        <div v-if="editing" class="vw-index-edit">
          <button v-if="!adding" class="vw-gen-btn" @click="adding = true">+ Add paper</button>
          <div v-else class="vw-addpaper">
            <input v-model="draft.title" placeholder="Title (a short id is assigned automatically)" aria-label="Paper title" class="vw-grow" />
            <select v-model="draft.tier" aria-label="Tier">
              <option>Conceptual</option><option>Technical</option><option>Policy &amp; People</option>
            </select>
            <button class="vw-gen-btn" @click="createPaper()">Create</button>
            <button class="vw-edit-btn vw-dark" @click="adding = false">Cancel</button>
          </div>
          <span class="vw-muted" v-if="!canReorder && !adding">Clear the search and tier filter to reorder papers.</span>
          <span class="vw-muted" v-else-if="!adding">Use the ↑ ↓ controls to reorder; changes save to papers.json.</span>
        </div>
        <div class="filters" role="search">
          <div class="search">
            <label for="vw-index-search" class="sr-only">Search papers by title, subtitle, or tag</label>
            <input id="vw-index-search"
                   v-model="query"
                   type="search"
                   :placeholder="(store.t.ui && store.t.ui.search_placeholder) || 'Search…'"
                   :aria-label="(store.t.ui && store.t.ui.search_placeholder) || 'Search papers'" />
          </div>
          <div class="chips" role="group" aria-label="Filter by tier">
            <button v-for="t in tiers" :key="t"
                    class="chip" :class="{ on: tier === t }"
                    :aria-pressed="tier === t ? 'true' : 'false'"
                    @click="tier = t">{{ t === 'all' ? ((store.t.ui && store.t.ui.all) || 'All') : tierLabel(t) }}</button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th v-if="editing">Order</th>
              <th>{{ (store.t.ui && store.t.ui.col_no) || 'No.' }}</th>
              <th>{{ (store.t.ui && store.t.ui.col_title) || 'Title' }}</th>
              <th>{{ (store.t.ui && store.t.ui.col_tier) || 'Tier' }}</th>
              <th>{{ (store.t.ui && store.t.ui.col_read) || 'Read' }}</th>
              <th>{{ (store.t.ui && store.t.ui.status) || 'Status' }}</th>
              <th>{{ store.locale === 'fr' ? 'Obtenir' : 'Get' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, i) in filtered" :key="p.id" @click="$emit('open', p.id)">
              <td v-if="editing" class="vw-order" data-label="Order" @click.stop>
                <template v-if="canReorder">
                  <button @click="edit.movePaper(i, -1)" :disabled="i === 0" aria-label="Move paper up">↑</button>
                  <button @click="edit.movePaper(i, 1)" :disabled="i === filtered.length - 1" aria-label="Move paper down">↓</button>
                  <button class="vw-del" @click="del(i, p)" aria-label="Delete paper">✕</button>
                </template>
                <span v-else class="vw-muted">—</span>
              </td>
              <td class="num" data-label="No.">№ {{ p.num }}</td>
              <td class="title" data-label="Title">
                <h2 class="index-title">{{ titleOf(p) }}</h2>
                <div class="sub">{{ subtitleOf(p) }}</div>
              </td>
              <td class="track" data-label="Tier">{{ tierLabel(p.tier) }}</td>
              <td class="read"  data-label="Read">{{ p.reading_min ? p.reading_min + ' min' : '—' }}</td>
              <td :class="statusClass(p)" data-label="Status">{{ p.status }}</td>
              <td class="idx-get" data-label="Get" @click.stop>
                <button class="idx-dl" @click="downloadRow(p)"
                        :title="store.locale === 'fr' ? 'Télécharger le Markdown' : 'Download Markdown'"
                        :aria-label="(store.locale === 'fr' ? 'Télécharger le Markdown : ' : 'Download Markdown: ') + titleOf(p)">
                  <span aria-hidden="true">⤓</span> MD
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    `,
  };
})();
