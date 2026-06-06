/* PaperDetail — two-column reader for a single paper.
   Renders the TOC on the left and the data-driven block list on the right. */

(function () {
  window.VWComponents = window.VWComponents || {};

  /* Stable per-block identity for v-for keys. Index keys break reorder/insert
     (Vue reuses the DOM node at each index instead of moving it with its data,
     which reads as "nothing moved", "added at the bottom", and "cloned"). A
     WeakMap keyed by the block object gives a stable key that survives reorder
     and stays out of the saved JSON. */
  const blockKeys = new WeakMap();
  let blockKeySeq = 0;
  function keyFor(b) {
    if (!b || typeof b !== 'object') return 'k' + b;
    if (!blockKeys.has(b)) blockKeys.set(b, 'blk-' + (++blockKeySeq));
    return blockKeys.get(b);
  }

  window.VWComponents['paper-detail'] = {
    props: {
      paper:   { type: Object, required: true },   // full content from data/papers/wp-NN.json
    },
    emits: ['open', 'back'],
    setup() { return { store: window.VWStore, edit: window.VWEdit || null }; },
    data() {
      return {
        active: 0,
        tocOpen: false,
        releaseTocTrap: null,
        releaseTocEsc: null,
        tocTriggerEl: null,
        dragFrom: null,
      };
    },
    watch: {
      paper: { handler(p) { if (window.VWEdit) { window.VWEdit.setCurrent(p); if (window.VWEdit.enabled) window.VWEdit.detectDrift(); } }, immediate: true },
      tocOpen(open) {
        /* Focus trap is only active on mobile where the TOC is a drawer.
           On desktop the col-toc is a static sidebar and the trap would be wrong. */
        if (open && window.matchMedia('(max-width: 900px)').matches) {
          this.$nextTick(() => {
            const drawer = this.$refs.tocDrawer;
            if (!drawer || !window.VWA11y) return;
            this.tocTriggerEl = document.activeElement;
            this.releaseTocTrap = window.VWA11y.trapFocus(drawer, this.tocTriggerEl);
            this.releaseTocEsc  = window.VWA11y.onEsc(() => { this.tocOpen = false; });
          });
        } else {
          if (this.releaseTocTrap) { this.releaseTocTrap(); this.releaseTocTrap = null; }
          if (this.releaseTocEsc)  { this.releaseTocEsc();  this.releaseTocEsc  = null; }
        }
      },
    },
    beforeUnmount() {
      if (this.releaseTocTrap) this.releaseTocTrap();
      if (this.releaseTocEsc)  this.releaseTocEsc();
    },
    computed: {
      translationLabel() {
        const s = this.paper && this.paper.translation_status;
        const labels = (this.store.t.ui && this.store.t.ui.translation_labels) || {};
        return labels[s] || (s || '').toUpperCase();
      },
      translationBody() {
        const s = this.paper && this.paper.translation_status;
        const bodies = (this.store.t.ui && this.store.t.ui.translation_bodies) || {};
        return bodies[s] || '';
      },
      tagsCsv: {
        get() { return (this.paper.tags || []).join(', '); },
        set(v) { this.paper.tags = v.split(',').map((s) => s.trim()).filter(Boolean); this.touch(); },
      },
      /* Authors edit as a single field, split on a middot or a comma, and join
         with the same middot the byline shows, so what you type matches what
         you see. */
      authorsCsv: {
        get() { return (this.paper.authors || []).join(' · '); },
        set(v) { this.paper.authors = v.split(/\s*[·,]\s*/).map((s) => s.trim()).filter(Boolean); this.touch(); },
      },
      /* The table of contents is derived from the section_heading blocks, which
         are the single source of truth. Editing a heading's title in the body
         updates the side menu immediately, and the two can never fall out of
         sync. Each entry's n and title come straight from its block, and the
         anchor it scrolls to (sec-<n>) is the same id the block renders. */
      tocSections() {
        return (this.paper.blocks || [])
          .filter((b) => b && b.type === 'section_heading')
          .map((b) => ({ n: b.n, title: b.title }));
      },
    },
    methods: {
      scrollToSection(n) {
        const el = document.getElementById('sec-' + n);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.tocOpen = false;
      },
      pickSection(i, n) {
        this.active = i;
        this.scrollToSection(n);
      },
      onSecDragStart(i, e) {
        this.dragFrom = i;
        if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(i)); } catch (_) {} }
      },
      onSecDrop(i) {
        if (this.edit && this.dragFrom != null && this.dragFrom !== i) this.edit.reorderSection(this.dragFrom, i);
        this.dragFrom = null;
      },
      blockKey(b) { return keyFor(b); },
      md(s) { return window.VWmd ? window.VWmd(s) : (s || ''); },
      touch() { if (this.edit) this.edit.markDirty(); },
      reviseSection(i) {
        const blocks = this.paper.blocks; const out = [];
        for (let j = i + 1; j < blocks.length; j++) { if (blocks[j].type === 'section_heading') break; out.push(blocks[j]); }
        if (this.edit) this.edit.openRevise('section', out);
      },
    },
    template: `
      <article class="civic-detail" :class="{ 'toc-open': tocOpen }"
               :aria-labelledby="'paper-title-' + paper.id">
        <!-- Mobile-only floating Contents button -->
        <button class="toc-fab"
                @click="tocOpen = !tocOpen"
                :aria-expanded="tocOpen ? 'true' : 'false'"
                :aria-controls="'toc-drawer-' + paper.id"
                :aria-label="(tocOpen ? (store.locale === 'fr' ? 'Fermer le sommaire' : 'Close contents') : ((store.t.ui && store.t.ui.contents) || 'Contents'))">
          <span aria-hidden="true">{{ tocOpen ? '×' : '☰' }}</span>
          <span class="sr-only-mobile">{{ (store.t.ui && store.t.ui.contents) || 'Contents' }}</span>
        </button>

        <!-- Backdrop for mobile TOC -->
        <div v-if="tocOpen" class="toc-backdrop" @click="tocOpen = false" aria-hidden="true"></div>

        <nav class="col-toc"
             :id="'toc-drawer-' + paper.id"
             :class="{ open: tocOpen }"
             ref="tocDrawer"
             :aria-label="(store.t.ui && store.t.ui.contents) || 'Contents'">
          <button class="back"
                  @click="$emit('back')"
                  :aria-label="(store.locale === 'fr' ? 'Retour à la bibliothèque' : 'Back to the library')">
            <span aria-hidden="true">←</span>
            <span>{{ (store.t.ui && store.t.ui.back_to_library) || 'Library' }}</span>
          </button>
          <div class="toc-head" id="toc-head" aria-hidden="true">{{ (store.t.ui && store.t.ui.contents) || 'Contents' }}</div>
          <ol class="toc-items" role="list" aria-labelledby="toc-head">
            <li v-for="(s, i) in tocSections" :key="'toc-' + i"
                :class="{ 'vw-toc-drag': edit && edit.enabled }"
                :draggable="edit && edit.enabled ? 'true' : 'false'"
                @dragstart="onSecDragStart(i, $event)"
                @dragover.prevent
                @drop="onSecDrop(i)">
              <span v-if="edit && edit.enabled" class="vw-drag-grip" aria-hidden="true">⠿</span>
              <button class="toc-item"
                      :class="{ active: active === i }"
                      :aria-current="active === i ? 'true' : null"
                      @click="pickSection(i, s.n)">
                <span class="n" aria-hidden="true">{{ s.n }}</span>
                <span>{{ s.title }}</span>
              </button>
              <button v-if="edit && edit.enabled" class="vw-sec-del"
                      @click.stop="edit.deleteSection(i)" aria-label="Delete section">✕</button>
            </li>
          </ol>
          <button v-if="edit && edit.enabled" class="vw-sec-add" @click="edit.addSection()">+ Add section</button>
        </nav>

        <section class="col-doc">
          <div class="doc-inner">
            <div class="doc-meta">
              <span class="num">№ {{ paper.num }}</span>
              <span>{{ paper.tier }}</span>
              <span>{{ paper.sequence }}</span>
            </div>
            <h1 class="doc-title" :id="'paper-title-' + paper.id"><editable-text tag="span" :obj="paper" field="title" /></h1>
            <div class="doc-sub"><editable-text tag="span" :obj="paper" field="subtitle" /></div>

            <div class="doc-byline">
              <div class="field">
                <div class="l">{{ (store.t.ui && store.t.ui.authors) || 'Authors' }}</div>
                <div class="v">{{ (paper.authors || []).join(' · ') }}</div>
              </div>
              <div class="field" v-if="paper.published">
                <div class="l">{{ (store.t.ui && store.t.ui.published) || 'Published' }}</div>
                <div class="v">{{ paper.published }}</div>
              </div>
              <div class="field" v-if="paper.reading_min">
                <div class="l">{{ (store.t.ui && store.t.ui.reading) || 'Reading' }}</div>
                <div class="v">{{ paper.reading_min }} {{ (store.t.ui && store.t.ui.min) || 'min' }}</div>
              </div>
              <div class="field">
                <div class="l">{{ (store.t.ui && store.t.ui.status) || 'Status' }}</div>
                <div class="v">{{ paper.status }}</div>
              </div>
              <div class="field" v-if="paper.repo">
                <div class="l">{{ (store.t.ui && store.t.ui.repository) || 'Repository' }}</div>
                <div class="v"><a :href="paper.repo">{{ paper.repo.replace('https://github.com/','') }}</a></div>
              </div>
            </div>

            <div v-if="edit && edit.enabled" class="vw-meta-edit">
              <div class="vw-meta-row">
                <label>Primary locale (canonical structure)
                  <select :value="paper.primary_locale || 'en'" @change="edit.setPrimaryLocale($event.target.value)">
                    <option value="en">EN</option><option value="fr">FR</option>
                  </select>
                </label>
                <label v-if="edit.drift">Language sync<span class="vw-meta-ro" :class="{ 'vw-stale': edit.drift.hasTranslation && !edit.drift.inSync }">{{ edit.drift.hasTranslation ? (edit.drift.inSync ? edit.drift.target.toUpperCase() + ' in sync' : edit.drift.target.toUpperCase() + ' out of date, re-translate') : edit.drift.target.toUpperCase() + ' not yet built' }}</span></label>
              </div>
              <div class="vw-meta-row">
                <label>No. (derived)<span class="vw-meta-ro">{{ paper.num || '—' }}</span></label>
                <label>Sequence (derived)<span class="vw-meta-ro">{{ paper.sequence || '—' }}</span></label>
                <label>Read (min)<input type="number" min="0" v-model.number="paper.reading_min" @input="touch()" /></label>
                <label>Published<input v-model="paper.published" @input="touch()" placeholder="2026-07-15" /></label>
              </div>
              <div class="vw-meta-row">
                <label>Tier<select v-model="paper.tier" @change="touch()"><option>Conceptual</option><option>Technical</option><option>Policy &amp; People</option></select></label>
                <label>Status<select v-model="paper.status" @change="touch()"><option>Draft</option><option>Forthcoming</option><option>Published</option><option>Placeholder</option></select></label>
                <label>Category<select v-model="paper.category" @change="touch()"><option>paper</option><option>architecture</option></select></label>
                <label>Repo<input v-model="paper.repo" @input="touch()" placeholder="https://github.com/…" /></label>
              </div>
              <label class="vw-meta-tags">Authors (separate with · or comma)<input v-model="authorsCsv" /></label>
              <label class="vw-meta-tags">Track<input v-model="paper.track" @input="touch()" placeholder="Defining the Problem / Engineering the Solution" /></label>
              <label class="vw-meta-tags">Tags (comma-separated)<input v-model="tagsCsv" /></label>
              <div class="vw-muted">Editing the paper metadata. Saving updates this paper and syncs the index (papers.json).</div>
            </div>

            <div v-if="store.locale === 'fr' && paper.translation_status && paper.translation_status !== 'final'"
                 class="translation-chip">
              <span class="tc-lbl">{{ translationLabel }}</span>
              <span class="tc-body">{{ translationBody }}</span>
            </div>

            <paper-downloads :paper="paper" />

            <div class="abstract">
              <div class="lbl">{{ (store.t.ui && store.t.ui.abstract) || 'Abstract' }}</div>
              <p><editable-text tag="span" :obj="paper" field="abstract" /></p>
            </div>

            <presentation-player v-if="paper.tldr_presentation"
                                 :presentation="paper.tldr_presentation" />
            <tldr-editor v-if="edit && edit.enabled && paper.tldr_presentation"
                         :presentation="paper.tldr_presentation" :paper-id="paper.id" />

            <audio-player v-if="paper.audio && paper.audio.src"
                          :src="paper.audio.src"
                          :paper="paper"
                          :label="(store.t.ui && store.t.ui.narration) || 'Narration'" />

            <div class="body">
              <template v-for="(b, i) in paper.blocks" :key="blockKey(b)">
                <div v-if="edit && edit.enabled" class="vw-block" :data-block-type="b.type">
                  <div class="vw-block-bar">
                    <span class="vw-block-type">{{ b.type }}</span>
                    <button v-if="b.type === 'paragraph' || b.type === 'dropcap_paragraph'"
                            class="vw-ai" @click="edit.openRevise('paragraph', [b])" aria-label="Revise this paragraph with AI">AI</button>
                    <button v-if="b.type === 'section_heading'"
                            class="vw-ai" @click="reviseSection(i)" aria-label="Revise this section with AI">Revise §</button>
                    <button @click="edit.moveBlock(i, -1)" aria-label="Move block up">↑</button>
                    <button @click="edit.moveBlock(i, 1)" aria-label="Move block down">↓</button>
                    <button class="vw-del" @click="edit.deleteBlock(i)" aria-label="Delete block">✕</button>
                  </div>
                  <block-renderer :block="b" :paper="paper" @open="$emit('open', $event)" />
                  <div v-if="b.__ai != null" class="vw-proposal">
                    <div class="vw-proposal-head">AI proposal. Review before it is saved.</div>
                    <div class="vw-proposal-text" v-html="md(b.__ai)"></div>
                    <div class="vw-proposal-actions">
                      <button class="vw-gen-btn" @click="edit.acceptProposal(b)">Accept</button>
                      <button class="vw-edit-btn" @click="edit.rejectProposal(b)">Reject</button>
                    </div>
                  </div>
                  <div class="vw-insert">
                    <span class="vw-insert-lbl">insert after</span>
                    <button @click="edit.insertBlockAfter(i, 'paragraph')">+ paragraph</button>
                    <button @click="edit.insertBlockAfter(i, 'keystat')">+ keystat</button>
                    <button @click="edit.insertBlockAfter(i, 'pullquote')">+ pullquote</button>
                    <button @click="edit.insertBlockAfter(i, 'image')">+ image</button>
                    <button @click="edit.insertBlockAfter(i, 'youtube')">+ youtube</button>
                    <button @click="edit.insertBlockAfter(i, 'section_heading')">+ section</button>
                  </div>
                </div>
                <block-renderer v-else :block="b" :paper="paper" @open="$emit('open', $event)" />
              </template>
            </div>
          </div>
        </section>
      </article>
    `,
  };
})();
