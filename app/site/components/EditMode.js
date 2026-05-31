/* EditMode — a DEV-ONLY in-page editor for paper content.

   This never operates on the published site. It is hard-gated to localhost /
   127.0.0.1, so on GitHub Pages the toolbar does not render and nothing here
   activates. The public site stays read-only static, per CLAUDE.md.

   How it works:
     - VWEdit is a small reactive controller (available / enabled / dirty / current).
     - When enabled, <editable-text> regions become contenteditable (see
       EditableText.js). Edits write straight to the in-memory paper object,
       which is the same object the page renders, so the page updates live.
     - Save serializes that object back to data/papers/<id>.<locale>.json via the
       File System Access API. You grant access to the folder once per session.
     - Browsers without the File System Access API fall back to a JSON download.

   It edits the underlying JSON fields, not the rendered visuals. Charts and
   bespoke visuals are not WYSIWYG here; edit their config in the JSON. */

(function () {
  const { reactive } = Vue;

  const host = location.hostname;
  const onLocalhost =
    host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '';

  const VWEdit = reactive({
    available: false,   // set true only after the edit-server confirms editing is enabled
    enabled: false,
    dirty: false,          // unsaved changes for the CURRENTLY shown locale
    dirtyMap: {},          // per-locale unsaved state, keyed "<locale>:<id>"
    saving: false,
    status: '',
    current: null,         // the paper object for the active locale, on screen
    guides: [],            // style guides loaded from the edit-server, editable
    guidesOpen: false,     // style-guide library panel open
    guidesLoading: false,
    guidesError: '',
    revise: { open: false, scope: '', blocks: [], guideIds: [], instructions: '', running: false, model: 'sonnet' },

    /* The JSON is bilingual: data/papers/<id>.en.json and <id>.fr.json are two
       separate files. The page loads one locale at a time, so editing operates
       on whichever locale is shown and Save writes that locale's file. Switch
       locale (EN/FR in the toolbar, or the main nav) to edit the other. Unsaved
       state is tracked per locale so switching never silently drops edits. */
    _key(loc) {
      const l = loc || (window.VWStore && window.VWStore.locale) || 'en';
      return l + ':' + (this.current && this.current.id);
    },

    setCurrent(paper) {
      this.current = paper;
      this.dirty = !!this.dirtyMap[this._key()];   // restore this locale's unsaved state
      if (!this.enabled) this.status = '';
    },
    toggle() {
      if (!this.available) return;
      this.enabled = !this.enabled;
      this.status = this.enabled ? 'Editing. Click any paragraph, heading, title, or abstract.' : '';
    },
    markDirty() {
      this.dirtyMap[this._key()] = true;
      this.dirty = true;
    },
    /* Which locales for the current paper have unsaved edits (for the toolbar). */
    dirtyLocales() {
      const id = this.current && this.current.id;
      if (!id) return [];
      return Object.keys(this.dirtyMap)
        .filter(k => this.dirtyMap[k] && k.endsWith(':' + id))
        .map(k => k.split(':')[0]);
    },

    /* ---- Image generation (needs the dev edit-server) -------------------- */

    /* Generate or regenerate the image at opts.src from opts.prompt by calling
       the dev server's /api/generate-image. Returns { ok, src } or { ok:false,
       error }. Only works under `npm run edit`; under plain `npm run dev` the
       endpoint is absent and we report that. */
    async generateImage(opts) {
      this.status = (opts.regenerate ? 'Regenerating' : 'Generating') + ' image…';
      try {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            src: opts.src,
            prompt: opts.prompt,
            style_kind: opts.style_kind || 'diagram',
            locale: (window.VWStore && window.VWStore.locale) || 'en',
          }),
        });
        let data = {};
        try { data = await res.json(); } catch (_) {}
        if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status));
        this.status = 'Image saved to ' + (data.src || opts.src);
        return { ok: true, src: data.src || opts.src };
      } catch (e) {
        const msg = (e && e.message) || String(e);
        this.status = 'Image generation failed: ' + msg + '. Run "npm run edit" (not "npm run dev") to enable generation, and set OPENAI_API_KEY in .env.';
        return { ok: false, error: msg };
      }
    },

    /* Generate narration audio (ElevenLabs via the dev server) for a slide. */
    async generateAudio(opts) {
      this.status = 'Generating narration…';
      try {
        const res = await fetch('/api/generate-audio', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text: opts.text, out: opts.out }),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(d.error || ('HTTP ' + res.status));
        this.status = 'Narration saved to ' + (d.out || opts.out);
        return { ok: true };
      } catch (e) {
        const msg = (e && e.message) || String(e);
        this.status = 'Narration failed: ' + msg + ' (needs ELEVENLABS_API_KEY in .env, via npm run edit)';
        return { ok: false, error: msg };
      }
    },

    /* ---- Structural editing ---------------------------------------------- */

    /* Rebuild paper.sections from the section_heading blocks and renumber them,
       so the TOC, the anchors, and the numbering stay consistent after any
       structural change. The heading blocks are the source of truth. */
    rebuildSections() {
      const p = this.current; if (!p || !Array.isArray(p.blocks)) return;
      const secs = []; let n = 0;
      for (const b of p.blocks) {
        if (b.type === 'section_heading') {
          n += 1;
          b.n = String(n).padStart(2, '0');
          secs.push({ n: b.n, title: b.title });
        }
      }
      p.sections = secs;
    },

    _newBlock(type) {
      if (type === 'image') {
        return {
          type: 'figure', fno: 'FIG.', title: '',
          caption: 'New caption. Describe what the figure shows.',
          image: { src: '', alt: '', image_prompt: 'Describe the image to generate, the way you would brief an illustrator. Name every object and its position.', style_kind: 'diagram' },
        };
      }
      if (type === 'section_heading') return { type: 'section_heading', n: '00', title: 'New section' };
      return { type: 'paragraph', text: 'New paragraph.' };
    },

    insertBlockAfter(i, type) {
      const p = this.current; if (!p) return;
      p.blocks.splice(i + 1, 0, this._newBlock(type));
      if (type === 'section_heading') this.rebuildSections();
      this.markDirty();
    },
    deleteBlock(i) {
      const p = this.current; if (!p) return;
      const wasHeading = p.blocks[i] && p.blocks[i].type === 'section_heading';
      p.blocks.splice(i, 1);
      if (wasHeading) this.rebuildSections();
      this.markDirty();
    },
    moveBlock(i, dir) {
      const p = this.current; if (!p) return;
      const j = i + dir;
      if (j < 0 || j >= p.blocks.length) return;
      const a = p.blocks; const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
      if (a[i].type === 'section_heading' || a[j].type === 'section_heading') this.rebuildSections();
      this.markDirty();
    },

    /* Group the flat block list into the intro (blocks before the first
       heading) and one group per section (heading plus the blocks that follow
       it until the next heading). Figures and images inside a section live in
       its group, so they move with the section automatically. */
    _sectionGroups() {
      const p = this.current; const intro = []; const groups = []; let cur = null;
      for (const b of p.blocks) {
        if (b.type === 'section_heading') { cur = { heading: b, blocks: [] }; groups.push(cur); }
        else if (cur) cur.blocks.push(b);
        else intro.push(b);
      }
      return { intro, groups };
    },
    _rebuildFromGroups(intro, groups) {
      const p = this.current;
      const flat = intro.slice();
      for (const g of groups) { flat.push(g.heading); for (const b of g.blocks) flat.push(b); }
      p.blocks = flat;
      this.rebuildSections();
      this.markDirty();
    },
    reorderSection(from, to) {
      const { intro, groups } = this._sectionGroups();
      if (from < 0 || from >= groups.length || to < 0 || to >= groups.length || from === to) return;
      const [g] = groups.splice(from, 1);
      groups.splice(to, 0, g);
      this._rebuildFromGroups(intro, groups);
    },
    addSection() {
      const { intro, groups } = this._sectionGroups();
      groups.push({ heading: { type: 'section_heading', n: '00', title: 'New section' }, blocks: [{ type: 'paragraph', text: 'New paragraph.' }] });
      this._rebuildFromGroups(intro, groups);
    },
    deleteSection(index) {
      const { intro, groups } = this._sectionGroups();
      if (index < 0 || index >= groups.length) return;
      groups.splice(index, 1);
      this._rebuildFromGroups(intro, groups);
    },

    /* Save the active-locale paper back to its JSON through the edit-server.
       Editing requires the edit-server, so this is always reachable. Transient
       editor-only keys (anything starting with __, such as AI proposals) are
       stripped before writing, so they never land in the file. */
    _clean(o) {
      if (Array.isArray(o)) return o.map((x) => this._clean(x));
      if (o && typeof o === 'object') {
        const out = {};
        for (const k of Object.keys(o)) { if (k.indexOf('__') === 0) continue; out[k] = this._clean(o[k]); }
        return out;
      }
      return o;
    },
    async save() {
      if (!this.available || !this.current) return;
      const locale = (window.VWStore && window.VWStore.locale) || 'en';
      const path = 'data/papers/' + this.current.id + '.' + locale + '.json';
      this.saving = true;
      this.status = 'Saving ' + path + '…';
      try {
        const res = await fetch('/api/save-json', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ path, content: this._clean(this.current) }),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(d.error || ('HTTP ' + res.status));
        // Keep the index (papers.json) in sync with the paper's display metadata,
        // so edits to number, title, tier, status, read time, tags show up there too.
        let synced = false;
        const inv = (window.VWStore.papers || []).find((p) => p.id === this.current.id);
        if (inv) {
          ['num', 'title', 'subtitle', 'tier', 'status', 'reading_min', 'tags'].forEach((k) => { if (this.current[k] !== undefined) inv[k] = this.current[k]; });
          try {
            let cur = {};
            const rr = await fetch('data/papers.json', { cache: 'no-cache' }); if (rr.ok) cur = await rr.json();
            cur.papers = (window.VWStore.papers || []).map((p) => this._clean(p));
            const r2 = await this._writeJson('data/papers.json', cur);
            synced = r2.ok;
          } catch (_) {}
        }
        delete this.dirtyMap[this._key(locale)];
        this.dirty = !!this.dirtyMap[this._key()];
        this.status = 'Saved ' + path + (synced ? ' + index synced' : '');
      } catch (e) {
        this.status = 'Save failed: ' + ((e && e.message) || e);
      } finally { this.saving = false; }
    },

    /* ---- Style-guide library --------------------------------------------- */
    async loadGuides() {
      this.guidesLoading = true; this.guidesError = '';
      try {
        const r = await fetch('/api/style-guides');
        if (!r.ok) throw new Error('HTTP ' + r.status);
        this.guides = await r.json();
        if (!this.guides.length) this.guidesError = 'No guides were returned.';
      } catch (e) {
        this.guidesError = 'Could not load style guides. Restart the editor server with "npm run edit" — a server started before this feature will not have the guides endpoint.';
      } finally { this.guidesLoading = false; }
    },
    openGuides() { this.guidesOpen = true; if (!this.guides.length) this.loadGuides(); },
    async saveGuide(id, content) {
      this.status = 'Saving guide…';
      try {
        const r = await fetch('/api/save-guide', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, content }) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || ('HTTP ' + r.status));
        const g = this.guides.find((x) => x.id === id); if (g) g.content = content;
        this.status = 'Saved guide: ' + id;
        return { ok: true };
      } catch (e) { this.status = 'Guide save failed: ' + ((e && e.message) || e); return { ok: false }; }
    },

    /* ---- AI revise with accept / reject ---------------------------------- */
    /* scope: 'paragraph' (one block), 'section' (a section's prose), 'paper'. */
    openRevise(scope, blocks) {
      this.revise.scope = scope;
      this.revise.blocks = blocks || [];
      this.revise.open = true;
      this.revise.running = false;
      if (!this.guides.length) this.loadGuides();
    },
    closeRevise() { this.revise.open = false; this.revise.blocks = []; },
    _reviseTargets(blocks) {
      return (blocks || []).filter((b) => b && (b.type === 'paragraph' || b.type === 'dropcap_paragraph'));
    },
    async runRevise() {
      const targets = this._reviseTargets(this.revise.blocks);
      if (!targets.length) { this.status = 'No prose paragraphs in this scope to revise.'; return; }
      this.revise.running = true;
      this.status = 'Revising ' + targets.length + ' paragraph(s) with AI…';
      try {
        const items = targets.map((b, i) => ({ key: i, text: b.text || '' }));
        const res = await fetch('/api/revise', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ items, guideIds: this.revise.guideIds, instructions: this.revise.instructions, model: this.revise.model }),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(d.error || ('HTTP ' + res.status));
        const byKey = {};
        for (const r of (d.items || [])) byKey[r.key] = r.revised;
        let n = 0;
        targets.forEach((b, i) => { if (byKey[i] != null && byKey[i] !== b.text) { b.__ai = byKey[i]; n += 1; } });
        this.status = n + ' proposal(s) ready. Accept or reject each below.';
        this.revise.open = false;
      } catch (e) {
        this.status = 'AI revise failed: ' + ((e && e.message) || e) + ' (needs ANTHROPIC_API_KEY in .env)';
      } finally { this.revise.running = false; }
    },
    acceptProposal(b) { if (b && b.__ai != null) { b.text = b.__ai; delete b.__ai; this.markDirty(); } },
    rejectProposal(b) { if (b && b.__ai != null) delete b.__ai; },
    acceptAllProposals() { const p = this.current; if (!p) return; let n = 0; for (const b of p.blocks) if (b.__ai != null) { b.text = b.__ai; delete b.__ai; n++; } if (n) this.markDirty(); },
    rejectAllProposals() { const p = this.current; if (!p) return; for (const b of p.blocks) if (b.__ai != null) delete b.__ai; },
    hasProposals() { const p = this.current; return !!(p && p.blocks && p.blocks.some((b) => b.__ai != null)); },

    /* ---- The index: add and reorder papers ------------------------------- */
    async _writeJson(path, obj) {
      const res = await fetch('/api/save-json', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path, content: obj }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { this.status = 'Save failed (' + path + '): ' + (d.error || res.status); return { ok: false }; }
      return { ok: true };
    },
    /* Persist the inventory (data/papers.json), preserving any other top-level
       keys it already carries. */
    async saveIndex() {
      try {
        let cur = {};
        try { const r = await fetch('data/papers.json', { cache: 'no-cache' }); if (r.ok) cur = await r.json(); } catch (_) {}
        cur.papers = (window.VWStore.papers || []).map((p) => this._clean(p));
        return await this._writeJson('data/papers.json', cur).then((r) => {
          if (r.ok) this.status = 'Saved the index (papers.json).';
          return r;
        });
      } catch (e) { this.status = 'Index save failed: ' + ((e && e.message) || e); return { ok: false }; }
    },
    movePaper(i, dir) {
      const a = window.VWStore.papers; const j = i + dir;
      if (j < 0 || j >= a.length) return;
      const t = a[i]; a[i] = a[j]; a[j] = t;
      this.saveIndex();
    },
    async deletePaper(i) {
      const a = window.VWStore.papers; const p = a[i];
      if (!p) return;
      const id = p.id;
      a.splice(i, 1);
      if (window.VWStore.paperById) delete window.VWStore.paperById[id];
      try { await fetch('/api/delete-paper', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) }); } catch (_) {}
      await this.saveIndex();
      this.status = 'Deleted paper "' + id + '". Its JSON files are removed; any images/audio under public/ are left in place.';
    },
    _paperStub(id, num, title, tier, locale) {
      const fr = locale === 'fr';
      const stub = {
        id, num, sequence: '', tier,
        title: title || (fr ? 'Document sans titre' : 'Untitled paper'),
        subtitle: '',
        authors: [],
        published: '',
        reading_min: null,
        status: 'Draft',
        tags: [],
        repo: null,
        abstract: fr ? 'Résumé à venir.' : 'Abstract forthcoming.',
        hero_image: { src: 'public/images/' + id + '/' + locale + '/hero.jpg', alt: '', image_prompt: '', style_kind: 'cover' },
        audio: { src: 'public/audio/' + locale + '/' + id + '.mp3' },
        tldr_presentation: {
          id: id + '-tldr', title: title || '', locale, owner_id: id,
          slides: [{ id: '01', title: title || '', audio_file: 'public/audio/' + locale + '/' + id + '-tldr/01.mp3', visual: 'title', caption: '', text: fr ? 'Narration à venir.' : 'Narration forthcoming.' }],
        },
        embedded_presentations: [],
        sections: [{ n: '01', title: 'Introduction' }],
        blocks: [
          { type: 'section_heading', n: '01', title: 'Introduction' },
          { type: 'paragraph', text: fr ? '<strong>Contenu à venir.</strong>' : '<strong>Content forthcoming.</strong>' },
        ],
        _meta: { placeholder: true, written_by: '', notes: 'Created in the editor.' },
        category: 'paper',
      };
      if (fr) stub.translation_status = 'untranslated';
      return stub;
    },
    async createPaper(meta) {
      const id = (meta.id || '').trim();
      if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) { this.status = 'Invalid id. Use kebab-case, e.g. wp-17 or arch-foo.'; return { ok: false }; }
      if (window.VWStore.paperById && window.VWStore.paperById[id]) { this.status = 'A paper with id "' + id + '" already exists.'; return { ok: false }; }
      const num = (meta.num || '').trim() || id;
      const title = (meta.title || '').trim() || 'Untitled paper';
      const tier = meta.tier || 'Technical';
      this.status = 'Creating ' + id + '…';
      const r1 = await this._writeJson('data/papers/' + id + '.en.json', this._paperStub(id, num, title, tier, 'en'));
      if (!r1.ok) return r1;
      const r2 = await this._writeJson('data/papers/' + id + '.fr.json', this._paperStub(id, num, title, tier, 'fr'));
      if (!r2.ok) return r2;
      const entry = { id, num, title, subtitle: '', tier, status: 'Draft', tags: [], reading_min: null };
      window.VWStore.papers.push(entry);
      if (window.VWStore.paperById) window.VWStore.paperById[id] = entry;
      const r3 = await this.saveIndex();
      if (!r3.ok) return r3;
      this.status = 'Created paper "' + id + '". Open it from the index to write it.';
      return { ok: true, id };
    },
  });

  window.VWEdit = VWEdit;

  /* The editor turns on ONLY when (a) we are on localhost and (b) the dev
     edit-server reports editing is enabled in this environment. On the published
     static site there is no server, so the probe never succeeds and the toolbar
     never appears: content cannot be edited or defaced by visitors. Under plain
     `npm run dev` the endpoint is absent, so editing also stays off; use
     `npm run edit` (which enables it) to edit. */
  if (onLocalhost) {
    fetch('/api/edit-status', { method: 'GET' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && d.enabled) VWEdit.available = true; })
      .catch(() => { /* no edit-server: editing stays off */ });
  }

  window.VWComponents = window.VWComponents || {};
  window.VWComponents['edit-toolbar'] = {
    setup() { return { edit: VWEdit, store: window.VWStore }; },
    computed: {
      locale() { return (this.store && this.store.locale) || 'en'; },
      locales() {
        return (this.store && this.store.site && this.store.site.locales) ||
               [{ code: 'en', label: 'EN' }, { code: 'fr', label: 'FR' }];
      },
      dirtyLocales() { return this.edit.dirtyLocales(); },
    },
    methods: {
      setLoc(l) { if (l !== this.locale && window.VWSetLocale) window.VWSetLocale(l); },
      locDirty(l) { return this.dirtyLocales.indexOf(l) !== -1; },
    },
    template: `
      <div v-if="edit.available" class="vw-edit-toolbar" :class="{ on: edit.enabled }" role="region" aria-label="Editor (local only)">
        <button type="button" class="vw-edit-btn" @click="edit.toggle()" :aria-pressed="edit.enabled ? 'true' : 'false'">
          {{ edit.enabled ? 'Editing on' : 'Edit' }}
        </button>
        <template v-if="edit.enabled">
          <span class="vw-edit-loc" role="group" aria-label="Locale being edited">
            <button v-for="l in locales" :key="l.code" type="button"
                    :class="{ on: locale === l.code }" @click="setLoc(l.code)"
                    :aria-pressed="locale === l.code ? 'true' : 'false'">{{ l.label }}<i v-if="locDirty(l.code)" class="vw-edit-dot" aria-label="unsaved">●</i></button>
          </span>
          <button type="button" class="vw-edit-btn" @click="edit.openGuides()">Guides</button>
          <button type="button" class="vw-edit-btn" @click="edit.openRevise('paper', edit.current ? edit.current.blocks : [])" :disabled="!edit.current">Revise paper</button>
          <template v-if="edit.hasProposals()">
            <button type="button" class="vw-edit-btn vw-edit-accept" @click="edit.acceptAllProposals()">Accept all</button>
            <button type="button" class="vw-edit-btn" @click="edit.rejectAllProposals()">Reject all</button>
          </template>
          <button type="button" class="vw-edit-btn vw-edit-save"
                  @click="edit.save()" :disabled="!edit.dirty || edit.saving">
            {{ edit.saving ? 'Saving…' : 'Save ' + locale.toUpperCase() }}
          </button>
        </template>
        <span class="vw-edit-status" aria-live="polite">{{ edit.status }}</span>
      </div>
    `,
  };
})();
