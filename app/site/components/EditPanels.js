/* EditPanels — dev-only modals for Phase 3 of the editor:
     vw-guides-panel : view, curate, and save the style guides (and image-style).
     vw-revise-panel : pick guides + write instructions, then run an AI revise
                       over the chosen scope (paragraph / section / paper).

   Both render only while edit mode is enabled. They read and drive window.VWEdit. */

(function () {
  window.VWComponents = window.VWComponents || {};

  /* ---- Style-guide library ---- */
  window.VWComponents['vw-guides-panel'] = {
    setup() { return { edit: window.VWEdit }; },
    data() { return { activeId: '', draft: '', saving: false }; },
    computed: {
      open() { return !!(this.edit && this.edit.enabled && this.edit.guidesOpen); },
      guides() { return (this.edit && this.edit.guides) || []; },
      active() { return this.guides.find((g) => g.id === this.activeId) || null; },
    },
    watch: {
      open(v) { if (v && !this.activeId && this.guides.length) this.select(this.guides[0].id); },
      guides(list) { if (this.open && !this.activeId && list.length) this.select(list[0].id); },
    },
    methods: {
      select(id) { this.activeId = id; const g = this.guides.find((x) => x.id === id); this.draft = g ? g.content : ''; },
      async save() {
        if (!this.active) return;
        this.saving = true;
        await this.edit.saveGuide(this.activeId, this.draft);
        this.saving = false;
      },
      close() { this.edit.guidesOpen = false; },
    },
    template: `
      <div v-if="open" class="vw-modal-backdrop" @click.self="close()">
        <div class="vw-modal vw-guides" role="dialog" aria-modal="true" aria-label="Style guide library">
          <div class="vw-modal-head">
            <strong>Style guides</strong>
            <button class="vw-x" @click="close()" aria-label="Close">×</button>
          </div>
          <div class="vw-guides-body">
            <ul class="vw-guides-list">
              <li v-for="g in guides" :key="g.id">
                <button :class="{ on: activeId === g.id }" @click="select(g.id)">{{ g.title }}</button>
              </li>
              <li v-if="edit.guidesLoading" class="vw-muted">Loading…</li>
              <li v-else-if="!guides.length" class="vw-muted">{{ edit.guidesError || 'No guides.' }}</li>
            </ul>
            <div class="vw-guides-editor">
              <textarea v-if="active" v-model="draft" spellcheck="false" :aria-label="active.title + ' content'"></textarea>
              <div class="vw-guides-foot" v-if="active">
                <span class="vw-muted">{{ active.kind === 'json' ? 'JSON, must stay valid' : 'Markdown' }} · saves over the local file</span>
                <button class="vw-gen-btn" @click="save()" :disabled="saving">{{ saving ? 'Saving…' : 'Save guide' }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  };

  /* ---- Draft a paper from Markdown / scratch ---- */
  window.VWComponents['vw-draft-panel'] = {
    setup() { return { edit: window.VWEdit }; },
    computed: {
      open() { return !!(this.edit && this.edit.enabled && this.edit.draft.open); },
      d() { return this.edit.draft; },
      result() { return this.edit.draft.result; },
    },
    methods: { gen() { this.edit.generateDraft(); }, apply() { this.edit.applyDraft(); }, close() { this.edit.closeDraft(); } },
    template: `
      <div v-if="open" class="vw-modal-backdrop" @click.self="close()">
        <div class="vw-modal vw-revise" role="dialog" aria-modal="true" aria-label="Draft from Markdown">
          <div class="vw-modal-head">
            <strong>Draft this paper</strong>
            <button class="vw-x" @click="close()" aria-label="Close">×</button>
          </div>
          <div class="vw-revise-body">
            <p class="vw-muted">Generates the abstract, sections, body blocks, and TL;DR from a rough Markdown draft (or a skeleton from scratch), grounded in your source. It lands as a preview you apply; nothing is written until you click Apply, and you can still refine afterward.</p>
            <label class="vw-revise-lbl">Mode</label>
            <div class="vw-model-toggle" role="group" aria-label="Mode">
              <button type="button" :class="{ on: d.mode === 'draft' }" @click="d.mode = 'draft'">From Markdown</button>
              <button type="button" :class="{ on: d.mode === 'scratch' }" @click="d.mode = 'scratch'">From scratch</button>
            </div>
            <label class="vw-revise-lbl">Model</label>
            <div class="vw-model-toggle" role="group" aria-label="Model">
              <button type="button" :class="{ on: d.model === 'sonnet' }" @click="d.model = 'sonnet'">Sonnet 4.6</button>
              <button type="button" :class="{ on: d.model === 'opus' }" @click="d.model = 'opus'">Opus 4.7</button>
            </div>
            <template v-if="d.mode === 'draft'">
              <label class="vw-revise-lbl">Rough draft (Markdown)</label>
              <textarea v-model="d.markdown" rows="10" placeholder="Paste your rough draft. Headings become sections; prose becomes paragraphs; the AI never invents facts and marks gaps." aria-label="Markdown draft"></textarea>
            </template>
            <div v-if="result" class="vw-proposal" style="margin-top:12px">
              <div class="vw-proposal-head">Draft preview: {{ (result.sections || []).length }} sections, {{ (result.blocks || []).length }} blocks, {{ ((result.tldr_presentation && result.tldr_presentation.slides) || []).length }} slides</div>
              <div class="vw-proposal-text"><strong>Abstract:</strong> {{ (result.abstract || '').slice(0, 240) }}{{ (result.abstract || '').length > 240 ? '…' : '' }}</div>
              <div v-if="(d.warnings || []).length" class="vw-muted" style="margin-top:6px">Warnings: {{ d.warnings.join('; ') }}</div>
            </div>
            <div class="vw-revise-foot">
              <button class="vw-edit-btn" @click="close()">Cancel</button>
              <button class="vw-gen-btn" @click="gen()" :disabled="d.running">{{ d.running ? 'Drafting…' : (result ? 'Re-draft' : 'Generate draft') }}</button>
              <button v-if="result" class="vw-gen-btn vw-edit-accept" @click="apply()">Apply to paper</button>
            </div>
          </div>
        </div>
      </div>
    `,
  };

  /* ---- Translate & build (hard overwrite) ---- */
  window.VWComponents['vw-translate-panel'] = {
    setup() { return { edit: window.VWEdit, store: window.VWStore }; },
    computed: {
      open() { return !!(this.edit && this.edit.enabled && this.edit.translate.open); },
      source() { return (this.store && this.store.locale) || 'en'; },
      t() { return this.edit.translate; },
    },
    methods: { run() { this.edit.translatePaper(); }, close() { this.edit.closeTranslate(); } },
    template: `
      <div v-if="open" class="vw-modal-backdrop" @click.self="close()">
        <div class="vw-modal vw-revise" role="dialog" aria-modal="true" aria-label="Translate and build">
          <div class="vw-modal-head">
            <strong>Translate &amp; build, from {{ source.toUpperCase() }} (canonical)</strong>
            <button class="vw-x" @click="close()" aria-label="Close">×</button>
          </div>
          <div class="vw-revise-body">
            <p class="vw-muted">Builds the target as a structural clone of the {{ source.toUpperCase() }} version, translates every string, and regenerates the target assets. <strong>This overwrites the target locale entirely</strong> (no merge).</p>
            <label class="vw-revise-lbl">Target locale</label>
            <div class="vw-model-toggle" role="group" aria-label="Target locale">
              <button type="button" :class="{ on: t.target === 'en' }" @click="t.target = 'en'" :disabled="source === 'en'">EN</button>
              <button type="button" :class="{ on: t.target === 'fr' }" @click="t.target = 'fr'" :disabled="source === 'fr'">FR</button>
            </div>
            <label class="vw-revise-lbl">Model</label>
            <div class="vw-model-toggle" role="group" aria-label="Model">
              <button type="button" :class="{ on: t.model === 'sonnet' }" @click="t.model = 'sonnet'">Sonnet 4.6</button>
              <button type="button" :class="{ on: t.model === 'opus' }" @click="t.model = 'opus'">Opus 4.7</button>
            </div>
            <label class="vw-check" style="margin-top:10px"><input type="checkbox" v-model="t.regenImages" /> <span>Regenerate images (conditioned on the {{ source.toUpperCase() }} source)</span></label>
            <label class="vw-check"><input type="checkbox" v-model="t.regenAudio" /> <span>Regenerate narration audio (slower; costs ElevenLabs)</span></label>
            <div class="vw-revise-foot">
              <button class="vw-edit-btn" @click="close()">Cancel</button>
              <button class="vw-gen-btn" @click="run()" :disabled="t.running || source === t.target">
                {{ t.running ? 'Building…' : 'Translate & build ' + t.target.toUpperCase() }}
              </button>
            </div>
          </div>
        </div>
      </div>
    `,
  };

  /* ---- AI revise dialog ---- */
  window.VWComponents['vw-revise-panel'] = {
    setup() { return { edit: window.VWEdit }; },
    computed: {
      open() { return !!(this.edit && this.edit.enabled && this.edit.revise.open); },
      guides() { return (this.edit && this.edit.guides) || []; },
      scope() { return this.edit ? this.edit.revise.scope : ''; },
      count() {
        if (!this.edit) return 0;
        return (this.edit.revise.blocks || []).filter((b) => b && (b.type === 'paragraph' || b.type === 'dropcap_paragraph')).length;
      },
    },
    methods: {
      toggleGuide(id) {
        const arr = this.edit.revise.guideIds;
        const i = arr.indexOf(id);
        if (i === -1) arr.push(id); else arr.splice(i, 1);
      },
      run() { this.edit.runRevise(); },
      close() { this.edit.closeRevise(); },
    },
    template: `
      <div v-if="open" class="vw-modal-backdrop" @click.self="close()">
        <div class="vw-modal vw-revise" role="dialog" aria-modal="true" aria-label="Revise with AI">
          <div class="vw-modal-head">
            <strong>Revise with AI: {{ scope }}</strong>
            <button class="vw-x" @click="close()" aria-label="Close">×</button>
          </div>
          <div class="vw-revise-body">
            <p class="vw-muted">{{ count }} paragraph(s) in scope. Pick any style guides to apply, add direction, then run. You review each change before it is saved.</p>
            <div class="vw-revise-guides">
              <label v-for="g in guides" :key="g.id" class="vw-check">
                <input type="checkbox" :checked="edit.revise.guideIds.indexOf(g.id) !== -1" @change="toggleGuide(g.id)" />
                <span>{{ g.title }}</span>
              </label>
              <span v-if="edit.guidesLoading" class="vw-muted">Loading guides…</span>
              <span v-else-if="!guides.length" class="vw-muted">{{ edit.guidesError || 'No guides available.' }}</span>
            </div>
            <label class="vw-revise-lbl">Model</label>
            <div class="vw-model-toggle" role="group" aria-label="Model">
              <button type="button" :class="{ on: edit.revise.model === 'sonnet' }" @click="edit.revise.model = 'sonnet'">Sonnet 4.6 · faster</button>
              <button type="button" :class="{ on: edit.revise.model === 'opus' }" @click="edit.revise.model = 'opus'">Opus 4.7 · stronger</button>
            </div>
            <label class="vw-revise-lbl">Your direction (optional)</label>
            <textarea v-model="edit.revise.instructions" rows="4"
                      placeholder="e.g. Tighten this, keep my voice, cut the throat-clearing, make the numbers concrete."
                      aria-label="Revision instructions"></textarea>
            <div class="vw-revise-foot">
              <button class="vw-edit-btn" @click="close()">Cancel</button>
              <button class="vw-gen-btn" @click="run()" :disabled="edit.revise.running || count === 0">
                {{ edit.revise.running ? 'Revising…' : 'Run AI revise' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    `,
  };
})();
