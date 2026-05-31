/* Figure — a labelled figure block. Optionally wraps a chart component
   identified by chart.kind (e.g. 'mini-chart', 'drivers-map').

   When a block object is passed and dev edit mode is on, the title, caption,
   and (for image figures) the image prompt, alt text, source path, and style
   become editable. Image generation itself stays out of band: write the prompt
   here, then run `npm run generate:images`. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['paper-figure'] = {
    props: {
      fno:     { type: String, default: 'FIG.' },
      title:   { type: String, default: '' },
      caption: { type: String, default: '' },
      chart:   { type: Object, default: null },
      image:   { type: Object, default: null },
      block:   { type: Object, default: null },
    },
    setup() { return { edit: window.VWEdit || null }; },
    data() { return { gen: false, bust: 0 }; },
    methods: {
      async doGenerate() {
        const img = this.imgObj;
        if (!this.edit || !img || this.gen) return;
        if (!img.image_prompt || !img.image_prompt.trim()) {
          this.edit.status = 'Write an image prompt first.';
          return;
        }
        const had = !!img.src;
        /* Decide the target path WITHOUT committing it yet, so a failed
           generation never leaves a broken (404) src in the JSON. */
        let target = img.src;
        if (!target) {
          const id = (this.edit.current && this.edit.current.id) || 'paper';
          const loc = (window.VWStore && window.VWStore.locale) || 'en';
          target = 'public/images/' + id + '/' + loc + '/fig-' + Date.now().toString(36) + '.jpg';
        }
        this.gen = true;
        const r = await this.edit.generateImage({ src: target, prompt: img.image_prompt, style_kind: img.style_kind, regenerate: had });
        this.gen = false;
        if (r.ok) {
          if (!had) { img.src = target; this.edit.markDirty(); }  // commit only on success
          this.bust += 1;                                         // remount <img> to show the new file
        }
      },
    },
    computed: {
      editing() { return !!(this.edit && this.edit.enabled); },
      imgObj() { return (this.block && this.block.image) || this.image || null; },
      chartComponent() {
        if (!this.chart) return null;
        const map = {
          'mini-chart':            'mini-chart',
          'drivers-map':           'drivers-map',
          'wp08-periodic':         'wp08-periodic',
          'wp08-agent-quartet':    'wp08-agent-quartet',
        };
        if (map[this.chart.kind]) return map[this.chart.kind];
        if (window.VWVisuals) {
          const reusable = window.VWVisuals.resolve(this.chart.kind);
          if (reusable) return reusable;
        }
        return null;
      },
    },
    template: `
      <figure class="cd-figure">
        <editable-text v-if="block && (editing || block.fno)" tag="div" cls="fno"
                       :obj="block" field="fno" />
        <div class="fno" v-else-if="!block && fno">{{ fno }}</div>

        <editable-text v-if="block && (editing || block.title)" tag="div" cls="ftitle"
                       :obj="block" field="title" />
        <div class="ftitle" v-else-if="!block && title">{{ title }}</div>

        <component v-if="chartComponent" :is="chartComponent" v-bind="chart" />
        <template v-else-if="imgObj">
          <image-inspector v-if="imgObj.src" :key="'img-' + bust" :src="imgObj.src" :alt="imgObj.alt || ''" />
          <div v-else class="vw-img-empty">No image yet. Write a prompt below and click Generate.</div>
        </template>

        <editable-text v-if="block && (editing || block.caption)" tag="div" cls="fcaption"
                       :obj="block" field="caption" />
        <div class="fcaption" v-else-if="!block && caption">{{ caption }}</div>

        <div v-if="editing && imgObj" class="vw-img-edit">
          <div class="vw-img-actions">
            <button type="button" class="vw-gen-btn" @click="doGenerate" :disabled="gen">
              {{ gen ? (imgObj.src ? 'Regenerating…' : 'Generating…') : (imgObj.src ? 'Regenerate image' : 'Generate image') }}
            </button>
            <span class="vw-gen-hint">runs via <code>npm run edit</code></span>
          </div>
          <label>Image prompt (what to generate)</label>
          <editable-text tag="div" cls="vw-img-field" :obj="imgObj" field="image_prompt" />
          <label>Alt text (accessibility)</label>
          <editable-text tag="div" cls="vw-img-field" :obj="imgObj" field="alt" />
          <label>Source path</label>
          <editable-text tag="div" cls="vw-img-field" :obj="imgObj" field="src" />
          <label>Style (cover, diagram, default)</label>
          <editable-text tag="div" cls="vw-img-field" :obj="imgObj" field="style_kind" />
        </div>
      </figure>
    `,
  };
})();
