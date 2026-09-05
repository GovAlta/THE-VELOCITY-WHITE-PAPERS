/* PresentationStage — renders one slide's visual based on `slide.visual`.

   Built-in visual types:
     title      — large title + subtitle on quiet background
     image      — full-bleed image (slide.image.src), with optional caption
     stat       — oversized number (visual_config.stat_value + stat_label)
     list       — bullet list of items (visual_config.items: [{label, desc}])
     quote      — pullquote-style large quote (visual_config.text + cite)
     compare    — two-column compare (visual_config.left, visual_config.right)
     chart      — delegates to a registered chart component
     custom     — render slide.html if provided (inline HTML, trust the JSON)

   Add a new visual type by adding a v-else-if branch. Or extend by registering
   a chart component in MiniChart.js and using visual: 'chart' with
   visual_config: { kind: 'mini-chart', ...props }.
*/

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['presentation-stage'] = {
    props: {
      slide:   { type: Object, required: true },
      compact: { type: Boolean, default: false },
      ownerId: { type: String, default: null },
    },
    computed: {
      cfg() { return this.slide.visual_config || {}; },
      registeredVisual() {
        if (!window.VWVisuals) return null;
        return window.VWVisuals.resolve(this.slide.visual, this.ownerId);
      },
    },
    template: `
      <div class="vp-slide" :class="['v-' + (slide.visual || 'title'), compact ? 'is-compact' : '']">

        <div v-if="slide.visual === 'title'" class="vs-title">
          <div class="vs-eyebrow" v-if="slide.caption">{{ slide.caption }}</div>
          <h3>{{ slide.title }}</h3>
          <p class="vs-sub" v-if="slide.subcaption">{{ slide.subcaption }}</p>
        </div>

        <div v-else-if="slide.visual === 'image'" class="vs-image">
          <image-inspector v-if="slide.image && slide.image.src"
                           :src="slide.image.src"
                           :alt="slide.image.alt || slide.title" />
          <div class="vs-caption" v-if="slide.caption">{{ slide.caption }}</div>
        </div>

        <div v-else-if="slide.visual === 'stat'" class="vs-stat">
          <div class="vs-eyebrow" v-if="slide.caption">{{ slide.caption }}</div>
          <div class="vs-stat-value">{{ cfg.stat_value }}</div>
          <div class="vs-stat-label" v-if="cfg.stat_label">{{ cfg.stat_label }}</div>
          <p class="vs-stat-body" v-if="slide.subcaption">{{ slide.subcaption }}</p>
        </div>

        <div v-else-if="slide.visual === 'list'" class="vs-list">
          <div class="vs-eyebrow" v-if="slide.caption">{{ slide.caption }}</div>
          <h3 v-if="slide.title">{{ slide.title }}</h3>
          <ul>
            <li v-for="(it, i) in (cfg.items || [])" :key="i">
              <span class="vl-label">{{ it.label }}</span>
              <span v-if="it.desc" class="vl-desc">{{ it.desc }}</span>
            </li>
          </ul>
        </div>

        <div v-else-if="slide.visual === 'quote'" class="vs-quote">
          <blockquote>{{ cfg.text || slide.subcaption }}</blockquote>
          <div class="vs-cite" v-if="cfg.cite">— {{ cfg.cite }}</div>
        </div>

        <div v-else-if="slide.visual === 'compare'" class="vs-compare">
          <div class="vs-eyebrow" v-if="slide.caption">{{ slide.caption }}</div>
          <h3 v-if="slide.title">{{ slide.title }}</h3>
          <div class="vs-compare-grid">
            <div class="vs-compare-col">
              <div class="vs-c-lbl">{{ cfg.left && cfg.left.label }}</div>
              <div class="vs-c-body">{{ cfg.left && cfg.left.body }}</div>
            </div>
            <div class="vs-compare-col">
              <div class="vs-c-lbl">{{ cfg.right && cfg.right.label }}</div>
              <div class="vs-c-body">{{ cfg.right && cfg.right.body }}</div>
            </div>
          </div>
        </div>

        <div v-else-if="slide.visual === 'chart'" class="vs-chart">
          <div class="vs-eyebrow" v-if="slide.caption">{{ slide.caption }}</div>
          <h3 v-if="slide.title">{{ slide.title }}</h3>
          <component v-if="cfg.kind" :is="cfg.kind" v-bind="cfg" />
        </div>

        <div v-else-if="slide.visual === 'custom' && slide.html" class="vs-custom" v-html="slide.html"></div>

        <component v-else-if="registeredVisual"
                   :is="registeredVisual"
                   :slide="slide"
                   :config="cfg" />

        <div v-else class="vs-fallback">
          <div class="vs-eyebrow">Slide</div>
          <h3>{{ slide.title }}</h3>
          <p v-if="slide.subcaption">{{ slide.subcaption }}</p>
        </div>
      </div>
    `,
  };
})();
