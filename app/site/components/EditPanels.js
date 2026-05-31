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
                <span class="vw-muted">{{ active.kind === 'json' ? 'JSON — must stay valid' : 'Markdown' }} · saves over the local file</span>
                <button class="vw-gen-btn" @click="save()" :disabled="saving">{{ saving ? 'Saving…' : 'Save guide' }}</button>
              </div>
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
            <strong>Revise with AI — {{ scope }}</strong>
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
