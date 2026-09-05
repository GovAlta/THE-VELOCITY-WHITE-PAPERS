/* TldrEditor — dev-only editor for a paper's TL;DR presentation. Renders under
   the player when edit mode is on. Edits the slide caption, title, subcaption,
   and narration (text); the visual type; and the slide image (prompt + Generate
   / Regenerate, reusing VWEdit.generateImage). Add, remove, and reorder slides.

   Narration text edits change what the audio SHOULD say; regenerating the audio
   itself is out of band (npm run generate:audio), as the note in the panel says. */

(function () {
  window.VWComponents = window.VWComponents || {};

  const VISUALS = ['title', 'stat', 'list', 'quote', 'compare', 'image', 'chart', 'custom'];

  window.VWComponents['tldr-editor'] = {
    props: {
      presentation: { type: Object, required: true },
      paperId: { type: String, default: 'paper' },
    },
    setup() { return { edit: window.VWEdit || null }; },
    data() { return { genning: '', genningAudio: '', visuals: VISUALS }; },
    computed: {
      slides() { return this.presentation.slides || (this.presentation.slides = []); },
      locale() { return (window.VWStore && window.VWStore.locale) || 'en'; },
    },
    methods: {
      dirty() { if (this.edit) this.edit.markDirty(); },
      _nextId() {
        let max = 0;
        for (const s of this.slides) { const n = parseInt(s.id, 10); if (!isNaN(n) && n > max) max = n; }
        return String(max + 1).padStart(2, '0');
      },
      add() {
        const id = this._nextId();
        this.slides.push({
          id, title: '', caption: '', subcaption: '', visual: 'title', text: '',
          audio_file: 'public/audio/' + this.locale + '/' + this.presentation.id + '/' + id + '.mp3',
        });
        this.dirty();
      },
      remove(i) {
        if (window.confirm('Remove slide ' + this.slides[i].id + '?')) { this.slides.splice(i, 1); this.dirty(); }
      },
      move(i, dir) {
        const j = i + dir; if (j < 0 || j >= this.slides.length) return;
        const t = this.slides[i]; this.slides[i] = this.slides[j]; this.slides[j] = t; this.dirty();
      },
      async genAudio(s) {
        if (!this.edit) return;
        if (!s.text || !s.text.trim()) { this.edit.status = 'Write narration text for the slide first.'; return; }
        if (!s.audio_file) s.audio_file = 'public/audio/' + this.locale + '/' + this.presentation.id + '/' + s.id + '.mp3';
        this.genningAudio = s.id;
        const r = await this.edit.generateAudio({ text: s.text, out: s.audio_file });
        this.genningAudio = '';
        if (r.ok) this.dirty();
      },
      addImage(s) { s.image = { src: '', alt: '', image_prompt: '', style_kind: 'diagram' }; this.dirty(); },
      async genImage(s) {
        if (!this.edit || !s.image) return;
        const img = s.image;
        if (!img.image_prompt || !img.image_prompt.trim()) { this.edit.status = 'Write an image prompt for the slide first.'; return; }
        const had = !!img.src;
        const target = had ? img.src : 'public/images/' + this.paperId + '/' + this.locale + '/slide-' + s.id + '.jpg';
        this.genning = s.id;
        const r = await this.edit.generateImage({ src: target, prompt: img.image_prompt, style_kind: img.style_kind || 'diagram', regenerate: had });
        this.genning = '';
        if (r.ok) { if (!had) { img.src = target; } this.dirty(); }
      },
    },
    template: `
      <div class="vw-tldr-editor">
        <div class="vw-tldr-head">TL;DR slides: {{ slides.length }}<span class="vw-muted"> · narration edits need <code>npm run generate:audio</code> to refresh the MP3</span></div>
        <div v-for="(s, i) in slides" :key="s.id" class="vw-slide">
          <div class="vw-slide-bar">
            <span class="vw-slide-id">Slide {{ s.id }}</span>
            <select v-model="s.visual" @change="dirty()" aria-label="Visual type">
              <option v-for="v in visuals" :key="v" :value="v">{{ v }}</option>
            </select>
            <span class="vw-spacer"></span>
            <button @click="move(i, -1)" :disabled="i === 0" aria-label="Move slide up">↑</button>
            <button @click="move(i, 1)" :disabled="i === slides.length - 1" aria-label="Move slide down">↓</button>
            <button class="vw-del" @click="remove(i)" aria-label="Remove slide">✕</button>
          </div>
          <div class="vw-slide-grid">
            <label>Caption</label><editable-text tag="div" cls="vw-img-field" :obj="s" field="caption" />
            <label>Title</label><editable-text tag="div" cls="vw-img-field" :obj="s" field="title" />
            <label>Subcaption</label><editable-text tag="div" cls="vw-img-field" :obj="s" field="subcaption" />
            <label>Narration</label><editable-text tag="div" cls="vw-img-field" :obj="s" field="text" />
          </div>
          <div class="vw-slide-audio">
            <button class="vw-gen-btn" @click="genAudio(s)" :disabled="genningAudio === s.id">
              {{ genningAudio === s.id ? 'Synthesizing…' : 'Generate narration' }}
            </button>
            <span class="vw-muted">{{ s.audio_file || '(audio path will be set on first generate)' }}</span>
          </div>
          <div v-if="s.image" class="vw-slide-img">
            <label>Image prompt</label>
            <editable-text tag="div" cls="vw-img-field" :obj="s.image" field="image_prompt" />
            <label>Alt text</label>
            <editable-text tag="div" cls="vw-img-field" :obj="s.image" field="alt" />
            <button class="vw-gen-btn" @click="genImage(s)" :disabled="genning === s.id">
              {{ genning === s.id ? 'Working…' : (s.image.src ? 'Regenerate image' : 'Generate image') }}
            </button>
          </div>
          <button v-else class="vw-edit-btn vw-dark" @click="addImage(s)">+ Add image to slide</button>
        </div>
        <button class="vw-gen-btn" @click="add()">+ Add slide</button>
      </div>
    `,
  };
})();
