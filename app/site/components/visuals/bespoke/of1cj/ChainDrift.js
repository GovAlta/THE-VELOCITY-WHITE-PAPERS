/* of1cj:chain — the fourteen-link chain as a column-tile board. A builder edit
   lands, propagates one hop to its neighbours, then stops. Later, the
   un-propagated links are exposed as drift; the anti-drift harness sweeps them
   and files tickets. Ported from the ADHD ChainColumnTiles demo. */

(function () {
  const C = window.VWof1cj;
  if (!C) return;
  const h = C.h;
  const P = C.PAL;

  window.VWComponents = window.VWComponents || {};
  window.VWComponents['of1cj-chain'] = {
    props: { kind: { type: String, default: '' } },
    data() { return { phase: 'idle', drift: 0 }; },
    mounted() { C.onReady(() => this.animate()); },
    beforeUnmount() { if (this.tl) this.tl.kill(); },
    methods: {
      animate() {
        if (typeof gsap === 'undefined' || C.prefersReducedMotion) return;
        const root = this.$el;
        const cells = Array.from(root.querySelectorAll('[data-cell]'));
        if (!cells.length) return;
        const cellAt = (c, r) => cells.find(el => el.dataset.col == c && el.dataset.row == r);
        const edits = [[3, 2], [7, 4], [11, 1], [5, 3]];
        const driftAt = [[1, 0], [2, 5], [6, 1], [6, 4], [9, 3], [12, 2], [13, 0], [13, 5], [10, 4]];
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.8, defaults: { ease: 'power2.out' } });
        tl.set(cells, { backgroundColor: P.synced, scale: 1, rotation: 0 })
          .call(() => { this.phase = 'builder editing'; this.drift = 0; });
        edits.forEach(([c, r], i) => {
          const cell = cellAt(c, r);
          if (!cell) return;
          tl.to(cell, { backgroundColor: P.edit, scale: 1.4, duration: 0.25 }, i === 0 ? '+=0.3' : '+=0.45')
            .call(() => C.spawnPing(root, cell, P.edit, 2.2));
          const neighbors = [cellAt(c, r - 1), cellAt(c, r + 1), cellAt(c - 1, r), cellAt(c + 1, r)].filter(Boolean);
          tl.to(neighbors, { backgroundColor: P.hop, scale: 1.18, duration: 0.25 }, '+=0.15')
            .to(neighbors, { scale: 1, duration: 0.2 });
          tl.to(cell, { backgroundColor: P.synced, scale: 1, duration: 0.3 }, '+=0.1');
        });
        tl.call(() => { this.phase = 'drift exposed'; });
        const driftCells = driftAt.map(([c, r]) => cellAt(c, r)).filter(Boolean);
        tl.to(driftCells, { backgroundColor: P.drift, scale: 1.25, duration: 0.3, stagger: { each: 0.05, from: 'random' } }, '+=0.3');
        tl.to(driftCells, { rotation: -3, duration: 0.07, yoyo: true, repeat: 3, stagger: { each: 0.03, from: 'random' } }, '+=0.05');
        tl.to(driftCells, { rotation: 0, scale: 1, duration: 0.25 })
          .call(() => { this.drift = driftCells.length; this.phase = 'anti-drift sweep'; });
        driftCells.forEach((cell, i) => {
          tl.call(() => C.spawnPing(root, cell, P.scan, 2.0), null, i === 0 ? '+=0.4' : '+=0.05');
        });
        tl.call(() => { this.phase = 'tickets filed'; });
        tl.to({}, { duration: 2.0 });
        tl.to([...driftCells, ...edits.map(([c, r]) => cellAt(c, r)).filter(Boolean)], {
          backgroundColor: P.synced, scale: 1, rotation: 0, duration: 0.6,
          stagger: { each: 0.02, from: 'edges' }
        }, '+=0.3').call(() => { this.drift = 0; this.phase = 'idle'; });
        this.tl = tl;
      }
    },
    render() {
      const cols = C.CHAIN;
      const rowsPerCol = 6;
      return h('div', { class: 'adh-fig' }, [
        h('div', { class: 'adh-frame' }, [
          h('div', { class: 'adh-grid', style: 'grid-template-columns: repeat(14, minmax(0, 1fr));' },
            cols.map((c, ci) => h('div', { style: 'display:flex;flex-direction:column;gap:4px;min-width:0;' }, [
              h('div', { class: 'adh-collabel', style: 'margin-bottom:4px;', title: c.label }, c.label),
              ...Array.from({ length: rowsPerCol }, (_, ri) => h('div', {
                'data-cell': true, 'data-col': ci, 'data-row': ri,
                class: 'adh-cell', style: 'height:16px;background-color:' + P.synced + ';',
              })),
            ]))
          ),
          h('div', { class: 'adh-legend' }, [
            C.legendDot(P.synced, 'synced'),
            C.legendDot(P.edit, 'builder edit'),
            C.legendDot(P.hop, '1-hop propagation'),
            C.legendDot(P.drift, 'drift'),
            C.legendDot(P.scan, 'anti-drift scan'),
            h('span', { class: 'adh-status' }, 'phase: ' + this.phase + ' · drift: ' + this.drift),
          ]),
        ]),
      ]);
    },
  };
  if (window.VWVisuals) window.VWVisuals.registerBespoke('of1cj', 'chain', 'of1cj-chain');
})();
