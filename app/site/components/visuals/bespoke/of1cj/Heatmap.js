/* of1cj:heatmap — the Edit Fingerprint Heatmap. A purely observational layer:
   every file Claude touches brightens its tile on a thermal scale. New touches
   flash, then the harness pings the hottest cells as hotspots. Ported from the
   ADHD TileHeatmap demo. */

(function () {
  const C = window.VWof1cj;
  if (!C) return;
  const h = C.h;
  const P = C.PAL;

  window.VWComponents = window.VWComponents || {};
  window.VWComponents['of1cj-heatmap'] = {
    props: { kind: { type: String, default: '' } },
    data() { return { touches: 0, totalTouches: 87 }; },
    mounted() { C.onReady(() => this.animate()); },
    beforeUnmount() { if (this.tl) this.tl.kill(); },
    methods: {
      animate() {
        if (typeof gsap === 'undefined' || C.prefersReducedMotion) return;
        const root = this.$el;
        const cells = Array.from(root.querySelectorAll('[data-hm]'));
        if (!cells.length) return;
        const cellAt = (b, c) => cells.find(el => el.dataset.bucket == b && el.dataset.col == c);
        const base = {};
        cells.forEach((cell) => {
          const b = +cell.dataset.bucket;
          const c = +cell.dataset.col;
          let t = 0;
          if (b === 0) t = Math.max(0, 0.3 - Math.abs(c - 4) * 0.05);
          if (b === 1) t = Math.max(0, 0.95 - Math.abs(c - 8) * 0.1);
          if (b === 2) t = Math.max(0, 0.55 - Math.abs(c - 11) * 0.08);
          if (b === 3) t = Math.max(0, 0.85 - Math.abs(c - 4) * 0.09);
          if (b === 4) t = Math.max(0, 0.4 - Math.abs(c - 13) * 0.06);
          if (b === 5) t = Math.max(0, 0.25 - Math.abs(c - 1) * 0.04);
          if (b === 6) t = Math.max(0, 0.6 - Math.abs(c - 9) * 0.07);
          if (b === 7) t = Math.max(0, 0.2 - Math.abs(c - 7) * 0.03);
          base[b + '-' + c] = Math.max(t, 0.03);
        });
        const newTouches = [[1, 7], [1, 8], [1, 9], [3, 3], [3, 4], [3, 5], [0, 5], [2, 11], [2, 12], [6, 9], [6, 10], [4, 13]];
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.2 });
        tl.call(() => { this.touches = 0; });
        cells.forEach(cell => {
          const k = cell.dataset.bucket + '-' + cell.dataset.col;
          tl.set(cell, { backgroundColor: C.heatColor(base[k]) }, 0);
        });
        newTouches.forEach(([b, c], i) => {
          const cell = cellAt(b, c);
          if (!cell) return;
          const k = b + '-' + c;
          const newT = Math.min(base[k] + 0.35, 1);
          tl.to(cell, { backgroundColor: P.edit, duration: 0.14, ease: 'power2.out' }, i === 0 ? '+=0.3' : '+=0.12')
            .to(cell, { backgroundColor: C.heatColor(newT), duration: 0.3 }, '+=0.04')
            .call(() => { this.touches++; base[k] = newT; });
        });
        const hotspots = [cellAt(1, 8), cellAt(3, 4)];
        hotspots.forEach((hot, i) => {
          if (!hot) return;
          tl.call(() => C.spawnPing(root, hot, P.scan, 2.6), null, i === 0 ? '+=0.5' : '+=0.25');
        });
        tl.to({}, { duration: 2.2 });
        this.tl = tl;
      }
    },
    render() {
      const buckets = ['src/server', 'src/api', 'src/components', 'src/composables', 'docs', 'infra', 'tests', 'training'];
      return h('div', { class: 'adh-fig' }, [
        h('div', { class: 'adh-frame adh-frame--dark' }, [
          h('div', { style: 'display:flex;flex-direction:column;gap:4px;' },
            buckets.map((b, bi) => h('div', { class: 'adh-row' }, [
              h('div', { class: 'adh-rowlabel', style: 'color:rgba(255,255,255,0.5);', title: b }, b),
              h('div', { class: 'adh-grid', style: 'flex:1;grid-template-columns: repeat(16, minmax(0, 1fr));' },
                Array.from({ length: 16 }, (_, ci) => h('div', {
                  'data-hm': true, 'data-bucket': bi, 'data-col': ci,
                  class: 'adh-cell', style: 'aspect-ratio:1;background-color:rgba(255,255,255,0.05);',
                }))
              ),
            ]))
          ),
          h('div', { class: 'adh-legend adh-legend--dark' }, [
            h('span', { class: 'adh-leg' }, [
              h('span', { style: 'display:inline-block;width:46px;height:6px;border-radius:99px;background:linear-gradient(90deg, rgba(60,90,130,0.4), rgba(207,154,57,0.7), rgba(177,51,26,0.85), ' + P.edit + ');' }),
              h('span', { style: 'margin-left:6px;' }, 'cold → hot'),
            ]),
            C.legendDot(P.edit, 'new touch'),
            C.legendDot(P.scan, 'hotspot'),
            h('span', { class: 'adh-status adh-status--dark' }, '+' + this.touches + ' new · ' + this.totalTouches + ' total'),
          ]),
        ]),
      ]);
    },
  };
  if (window.VWVisuals) window.VWVisuals.registerBespoke('of1cj', 'heatmap', 'of1cj-heatmap');
})();
