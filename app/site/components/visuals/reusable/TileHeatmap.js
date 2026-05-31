/* TileHeatmap — REUSABLE visual.

   A dark-background heatmap of `rows` buckets × `cols` columns. Base intensity
   is computed deterministically from a seed; optional "touches" flash and
   settle to hotter values. Optional pings sweep selected cells.

   Any paper can use it by setting slide.visual = "tile-heatmap" and
   supplying visual_config.

   visual_config shape:
   {
     rows:   8,                                  // number of bucket rows
     cols:   16,                                 // number of columns per row
     labels: ['bucket-1','bucket-2', ...],       // length === rows
     seed:   42,                                 // optional, deterministic base
     touches: [                                  // optional, animated highlights
       { row: 0, col: 3 },
       { row: 5, col: 12 }
     ],
     pings:  [ { row: 2, col: 7 } ],             // optional cyan rings
     counter: '+12 new · 87 total'               // optional bottom-right counter
   }
*/

(function () {
  window.VWComponents = window.VWComponents || {};
  if (window.VWVisuals) window.VWVisuals.registerReusable('tile-heatmap', 'tile-heatmap');

  function lcg(seed) {
    let s = seed | 0;
    return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  }

  window.VWComponents['tile-heatmap'] = {
    props: {
      slide:  { type: Object, default: () => ({}) },
      config: { type: Object, default: () => ({}) },
    },
    data() { return { revealedTouches: 0 }; },
    computed: {
      rows() { return this.config.rows || 8; },
      cols() { return this.config.cols || 16; },
      labels() { return this.config.labels || []; },
      seed() { return this.config.seed || 42; },
      touches() { return this.config.touches || []; },
      pings() { return this.config.pings || []; },
      baseGrid() {
        const rnd = lcg(this.seed);
        const grid = [];
        for (let r = 0; r < this.rows; r++) {
          const row = [];
          for (let c = 0; c < this.cols; c++) {
            const v = 0.1 + Math.pow(rnd(), 1.6) * 0.55;
            row.push(v);
          }
          grid.push(row);
        }
        return grid;
      },
      heatGrid() {
        const g = this.baseGrid.map(r => r.slice());
        for (let i = 0; i < this.revealedTouches; i++) {
          const t = this.touches[i];
          if (!t) continue;
          if (g[t.row] && g[t.row][t.col] != null) g[t.row][t.col] = 0.95;
        }
        return g;
      },
      ariaLabel() {
        return this.config.aria_label
          || ('Heatmap of activity across ' + this.rows + ' rows by ' + this.cols + ' columns');
      },
      ariaDescription() {
        if (this.config.aria_description) return this.config.aria_description;
        const labelList = this.labels.length ? this.labels.join(', ') : (this.rows + ' rows');
        const touchSummary = this.touches.length
          ? this.touches.length + ' active touches highlighted'
          : 'no active highlights';
        return 'Thermal heatmap. Rows: ' + labelList + '. ' + this.cols + ' columns. ' + touchSummary + '. '
             + (this.config.counter || '');
      },
    },
    mounted() {
      const heat = window.VWAnim;
      if (!heat) return;
      this.heatColor = heat.heatColor;
      const totalDuration = Math.max(800, this.touches.length * 220 + 400);
      heat.afterFontsAndPaint().then(() => {
        heat.tween({
          from: 0, to: this.touches.length, duration: totalDuration, ease: 'easeOutCubic',
          onUpdate: v => { this.revealedTouches = Math.floor(v); },
          onComplete: () => {
            this.revealedTouches = this.touches.length;
            this.firePings();
          }
        });
      });
    },
    methods: {
      cellStyle(v) {
        const color = (window.VWAnim && window.VWAnim.heatColor) ? window.VWAnim.heatColor(v) : 'rgb(40,30,24)';
        return { background: color };
      },
      firePings() {
        const root = this.$refs.root;
        if (!root || !this.pings.length) return;
        for (const p of this.pings) {
          const sel = '[data-r="' + p.row + '"][data-c="' + p.col + '"]';
          const el = root.querySelector(sel);
          if (el && window.VWAnim) window.VWAnim.spawnPing(root, el, 'rgb(110,200,220)', 5);
        }
      },
    },
    template: `
      <figure ref="root" class="vw-heatmap"
              role="img"
              :aria-label="ariaLabel">
        <div class="vw-heatmap-row" v-for="(row, r) in heatGrid" :key="r" aria-hidden="true">
          <div class="vw-heatmap-label" v-if="labels[r]">{{ labels[r] }}</div>
          <div class="vw-heatmap-cells">
            <div v-for="(v, c) in row" :key="c"
                 class="vw-heatmap-cell"
                 :style="cellStyle(v)"
                 :data-r="r" :data-c="c"></div>
          </div>
        </div>
        <div class="vw-heatmap-counter" v-if="config.counter" aria-hidden="true">{{ config.counter }}</div>
        <figcaption class="sr-only">{{ ariaDescription }}</figcaption>
      </figure>
    `,
  };
})();
