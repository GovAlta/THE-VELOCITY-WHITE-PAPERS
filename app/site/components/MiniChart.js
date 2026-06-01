/* MiniChart — small inline SVG line chart driven by data series.
   Mirrors the civic.jsx CivicMiniChart pattern with multiple series. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['mini-chart'] = {
    props: {
      width:  { type: Number, default: 680 },
      height: { type: Number, default: 200 },
      pad:    { type: Number, default: 28 },
      series: { type: Array, default: () => [] },  // [{ label, color, dashed, points: [{ x, y }] }]
      x_label: { type: String, default: '' },
      y_label: { type: String, default: '' },
    },
    computed: {
      bounds() {
        const all = this.series.flatMap(s => s.points);
        if (!all.length) return null;
        const xs = all.map(p => p.x), ys = all.map(p => p.y);
        return { xmin: Math.min(...xs), xmax: Math.max(...xs), ymin: Math.min(...ys), ymax: Math.max(...ys) };
      },
      paths() {
        const b = this.bounds; if (!b) return [];
        const w = this.width - this.pad * 2, h = this.height - this.pad * 2;
        const xr = b.xmax - b.xmin || 1, yr = b.ymax - b.ymin || 1;
        return this.series.map(s => {
          const d = s.points.map((p, i) => {
            const x = this.pad + ((p.x - b.xmin) / xr) * w;
            const y = this.pad + h - ((p.y - b.ymin) / yr) * h;
            return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
          }).join(' ');
          return { ...s, d };
        });
      },
    },
    template: `
      <svg :viewBox="'0 0 ' + width + ' ' + height" :width="width" :height="height" role="img">
        <g>
          <path v-for="s in paths" :key="s.label"
                :d="s.d"
                :stroke="s.color"
                :stroke-dasharray="s.dashed ? '4,4' : '0'"
                stroke-width="2" fill="none" />
          <text :x="pad" :y="height - 6"
                font-family="var(--font-mono)" font-size="10" fill="var(--ink-50)">
            {{ x_label }}
          </text>
          <text :x="4" :y="pad - 4"
                font-family="var(--font-mono)" font-size="10" fill="var(--ink-50)">
            {{ y_label }}
          </text>
        </g>
        <g :transform="'translate(' + (width - 160) + ',' + (pad - 8) + ')'">
          <g v-for="(s, i) in series" :key="s.label"
             :transform="'translate(0,' + (i * 16) + ')'">
            <line x1="0" y1="6" x2="24" y2="6" :stroke="s.color"
                  :stroke-dasharray="s.dashed ? '4,4' : '0'" stroke-width="2" />
            <text x="30" y="10" font-family="var(--font-mono)" font-size="10" fill="var(--ink-70)">
              {{ s.label }}
            </text>
          </g>
        </g>
      </svg>
    `,
  };

  /* step-flow — a numbered process diagram driven by data, used by Figure with
     chart.kind === 'step-flow'. Renders accurate, legible labels (unlike a
     generated image). Each step: { title, desc }. Edit the steps in the paper
     JSON. Vertical by default; pass orientation:"row" for a horizontal chain. */
  window.VWComponents['step-flow'] = {
    props: {
      kind:        { type: String, default: 'step-flow' },
      steps:       { type: Array,  default: () => [] },
      orientation: { type: String, default: 'column' },
    },
    setup() { return { edit: window.VWEdit || null }; },
    computed: { editing() { return !!(this.edit && this.edit.enabled); } },
    methods: {
      md() { if (this.edit) this.edit.markDirty(); },
      addStep() { this.steps.push({ title: 'New step', desc: '' }); this.md(); },
      delStep(i) { this.steps.splice(i, 1); this.md(); },
    },
    template: `
      <div class="gi-flow-scroll">
      <ol class="gi-flow" :class="'gi-flow--' + orientation">
        <li v-for="(s, i) in steps" :key="i" class="gi-step">
          <div class="gi-step-n" aria-hidden="true">{{ i + 1 }}</div>
          <div class="gi-step-body">
            <template v-if="editing">
              <editable-text tag="div" cls="gi-step-title" :obj="s" field="title" />
              <editable-text tag="div" cls="gi-step-desc" :obj="s" field="desc" />
              <button type="button" class="vw-del gi-step-del" @click="delStep(i)" :aria-label="'Delete step ' + (i + 1)">✕ remove</button>
            </template>
            <template v-else>
              <div class="gi-step-title">{{ s.title }}</div>
              <div class="gi-step-desc" v-if="s.desc">{{ s.desc }}</div>
            </template>
          </div>
        </li>
        <li v-if="editing" class="gi-step gi-step-add">
          <div class="gi-step-n" aria-hidden="true">+</div>
          <div class="gi-step-body"><button type="button" class="vw-gen-btn" @click="addStep">+ step</button></div>
        </li>
      </ol>
      </div>
    `,
  };

  /* Convenience chart: drivers-map. Used by Figure with chart.kind === 'drivers-map' */
  window.VWComponents['drivers-map'] = {
    props: { kind: { type: String, default: 'drivers-map' } },
    template: `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:8px 0 4px;">
        <div style="border:1px solid var(--rule);padding:14px 16px;background:var(--paper);">
          <div style="font-family:var(--font-mono);font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:var(--accent);margin-bottom:6px;">Woven throughout</div>
          <div style="font-weight:600;font-size:15px;">Cost</div>
          <div style="font-weight:600;font-size:15px;margin-top:4px;">Service delivery</div>
        </div>
        <div style="border:1px solid var(--rule);padding:14px 16px;background:var(--paper);">
          <div style="font-family:var(--font-mono);font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:var(--highlight);margin-bottom:6px;">Dedicated paper</div>
          <div style="font-weight:600;font-size:15px;">Cybersecurity · Paper 2</div>
          <div style="font-weight:600;font-size:15px;margin-top:4px;">Red tape reduction · Paper 3</div>
        </div>
      </div>
    `,
  };
})();
