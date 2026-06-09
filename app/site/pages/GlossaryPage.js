/* GlossaryPage — bilingual glossary of terms introduced across the collection.
   Reads data/glossary.json. Each term has a short and long definition in EN
   and FR plus related-term links. Filterable by search. Terms display in
   alphabetical order (by the current locale's term).

   When edit mode is on (npm run edit), the page becomes a glossary editor: add,
   edit (term / short / long, in the current locale), and delete terms. Changes
   save back to data/glossary.json via the edit server. */

(function () {
  window.VWComponents = window.VWComponents || {};

  function randId(existing) {
    let id;
    do { id = 'g-' + Math.random().toString(36).slice(2, 7); } while (existing.has(id));
    return id;
  }

  window.VWComponents['glossary-page'] = {
    emits: ['navigate'],
    setup() { return { store: window.VWStore, edit: window.VWEdit || null }; },
    data() { return { terms: [], query: '', expanded: {}, error: null, status: '', saving: false, dirty: false }; },
    async mounted() {
      try {
        const res = await fetch('data/glossary.json', { cache: 'no-cache' });
        const j = await res.json();
        this.terms = (j.terms || []).map(t => ({
          id: t.id,
          en: t.en || { term: '', short: '', long: '' },
          fr: t.fr || { term: '', short: '', long: '' },
          related: t.related || [],
        }));
      } catch (e) { this.error = e.message; }
    },
    computed: {
      editing() { return !!(this.edit && this.edit.enabled); },
      loc() { return this.store.locale || 'en'; },
      /* Alphabetical by the current locale's term, so the list re-sorts itself
         as terms are added or renamed. */
      sorted() {
        const loc = this.loc;
        const key = (t) => ((t[loc] || t.en || {}).term || '').toLowerCase();
        return this.terms.slice().sort((a, b) => key(a).localeCompare(key(b), loc));
      },
      filtered() {
        const q = this.query.trim().toLowerCase();
        if (!q) return this.sorted;
        return this.sorted.filter(t => {
          const l = t[this.loc] || t.en || {};
          return [l.term, l.short, l.long].join(' ').toLowerCase().includes(q);
        });
      },
    },
    methods: {
      toggle(id) { this.expanded[id] = !this.expanded[id]; },
      jumpTo(id) {
        this.expanded[id] = true;
        this.$nextTick(() => {
          const el = document.getElementById('term-' + id);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      },
      termById(id) {
        const t = this.terms.find(x => x.id === id);
        if (!t) return null;
        return t[this.store.locale] || t.en;
      },
      cur(t) { return t[this.loc] || t.en; },           // current-locale fields
      markDirty() { this.dirty = true; },
      addTerm() {
        const id = randId(new Set(this.terms.map(t => t.id)));
        this.terms.push({ id, en: { term: '', short: '', long: '' }, fr: { term: '', short: '', long: '' }, related: [] });
        this.expanded[id] = true;
        this.query = '';
        this.dirty = true;
        this.$nextTick(() => {
          const el = document.getElementById('term-' + id);
          if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); const inp = el.querySelector('input'); if (inp) inp.focus(); }
        });
      },
      delTerm(t) {
        const name = (this.cur(t).term) || t.id;
        if (!window.confirm((this.loc === 'fr' ? 'Supprimer le terme « ' : 'Delete glossary term "') + name + (this.loc === 'fr' ? ' » ?' : '"?'))) return;
        const i = this.terms.findIndex(x => x.id === t.id);
        if (i >= 0) this.terms.splice(i, 1);
        this.dirty = true;
        this.save();
      },
      async save() {
        if (!this.edit || !this.edit._writeJson) { this.status = 'Edit server not available.'; return; }
        this.saving = true;
        this.status = this.loc === 'fr' ? 'Enregistrement…' : 'Saving…';
        /* Persist in a stable canonical order (by EN term) so the file diff is
           predictable regardless of the viewing locale. */
        const out = this.terms.slice().sort((a, b) =>
          ((a.en || {}).term || '').toLowerCase().localeCompare(((b.en || {}).term || '').toLowerCase(), 'en'));
        const r = await this.edit._writeJson('data/glossary.json', { terms: out });
        this.saving = false;
        if (r && r.ok) { this.dirty = false; this.status = this.loc === 'fr' ? 'Enregistré.' : 'Saved.'; }
        else { this.status = this.loc === 'fr' ? "Échec de l'enregistrement." : 'Save failed.'; }
      },
    },
    template: `
      <div>
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <span>{{ store.locale === 'fr' ? 'Glossaire' : 'Glossary' }}</span>
            <span>·</span>
            <span>{{ filtered.length }} {{ store.locale === 'fr' ? 'termes' : 'terms' }}</span>
          </div>
          <h1>{{ store.locale === 'fr' ? 'Le' : 'The' }} <em>{{ store.locale === 'fr' ? 'vocabulaire' : 'vocabulary' }}</em>.</h1>
          <p class="lede">{{ store.locale === 'fr'
            ? 'Les concepts introduits dans la collection, définis en deux niveaux : la phrase courte pour le rappel et la définition longue pour la première lecture.'
            : 'The concepts introduced across the collection, defined at two levels: a short sentence for recall and a longer definition for first reading.' }}</p>
        </section>

        <section class="civic-section">
          <div v-if="editing" class="gloss-editbar">
            <button class="gloss-add" @click="addTerm">+ {{ store.locale === 'fr' ? 'Ajouter un terme' : 'Add term' }}</button>
            <button class="gloss-save" :disabled="saving || !dirty" @click="save">{{ store.locale === 'fr' ? 'Enregistrer' : 'Save' }}</button>
            <span class="gloss-status">{{ dirty && !status ? (store.locale === 'fr' ? 'Modifications non enregistrées' : 'Unsaved changes') : status }}</span>
            <span class="gloss-hint">{{ store.locale === 'fr' ? 'Vous modifiez la version ' : 'Editing the ' }}<strong>{{ loc.toUpperCase() }}</strong>{{ store.locale === 'fr' ? '.' : ' version.' }}</span>
          </div>

          <div class="filters" role="search" style="display:flex;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);margin-bottom:24px;">
            <div class="search" style="flex:1;padding:14px 16px;">
              <label for="vw-glossary-search" class="sr-only">{{ store.locale === 'fr' ? 'Rechercher dans le glossaire' : 'Search the glossary' }}</label>
              <input id="vw-glossary-search"
                     v-model="query"
                     type="search"
                     :placeholder="(store.t.ui && store.t.ui.search_placeholder) || 'Search…'"
                     :aria-label="(store.locale === 'fr' ? 'Rechercher dans ' : 'Search ') + terms.length + (store.locale === 'fr' ? ' termes' : ' terms')"
                     style="width:100%;border:0;background:transparent;outline:none;font-family:var(--font-sans);font-size:15px;color:var(--ink);" />
            </div>
          </div>

          <div v-if="error" style="color:var(--highlight);font-family:var(--font-mono);font-size:12px;">{{ error }}</div>

          <!-- Read view -->
          <dl v-if="!editing" class="glossary-list">
            <div v-for="t in filtered" :key="t.id" :id="'term-' + t.id"
                 class="glossary-term" :class="{ open: expanded[t.id] }">
              <dt @click="toggle(t.id)">
                <span class="term-name">{{ cur(t).term }}</span>
                <span class="term-short">{{ cur(t).short }}</span>
                <span class="term-toggle">{{ expanded[t.id] ? '−' : '+' }}</span>
              </dt>
              <dd v-if="expanded[t.id]">
                <p>{{ cur(t).long }}</p>
                <div class="term-related" v-if="t.related && t.related.length">
                  <span class="rl-l">{{ store.locale === 'fr' ? 'Voir aussi' : 'See also' }}</span>
                  <button v-for="rid in t.related" :key="rid" class="rl-link" @click="jumpTo(rid)">
                    {{ termById(rid) ? termById(rid).term : rid }}
                  </button>
                </div>
              </dd>
            </div>
          </dl>

          <!-- Edit view -->
          <div v-else class="glossary-edit">
            <div v-for="t in filtered" :key="t.id" :id="'term-' + t.id" class="gloss-edit-card">
              <div class="gloss-edit-head">
                <input class="gloss-in gloss-term" v-model="cur(t).term" @input="markDirty"
                       :placeholder="store.locale === 'fr' ? 'Terme' : 'Term'" />
                <button class="gloss-del" @click="delTerm(t)" :aria-label="store.locale === 'fr' ? 'Supprimer' : 'Delete'">✕</button>
              </div>
              <input class="gloss-in gloss-short" v-model="cur(t).short" @input="markDirty"
                     :placeholder="store.locale === 'fr' ? 'Définition courte (une phrase)' : 'Short definition (one sentence)'" />
              <textarea class="gloss-in gloss-long" rows="4" v-model="cur(t).long" @input="markDirty"
                        :placeholder="store.locale === 'fr' ? 'Définition longue' : 'Long definition'"></textarea>
              <div class="gloss-edit-meta">{{ store.locale === 'fr' ? 'identifiant' : 'id' }}: {{ t.id }}<span v-if="t.related && t.related.length"> · {{ store.locale === 'fr' ? 'liés' : 'related' }}: {{ t.related.join(', ') }}</span></div>
            </div>
          </div>
        </section>

        <app-footer />
      </div>
    `,
  };
})();
