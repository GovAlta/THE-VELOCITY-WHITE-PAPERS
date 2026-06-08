/* of1cj:sweep — the Stop-Hook Drift Sweep, shown as per-link health pills. At
   each turn boundary the sweep recolours the fourteen link pills clean / warn /
   block-worthy and records the result in the history stack. A block-worthy link
   gets pinged. Ported from the ADHD PerLinkHealthPills demo. */

(function () {
  const C = window.VWof1cj;
  if (!C) return;
  const h = C.h;
  const P = C.PAL;

  window.VWComponents = window.VWComponents || {};
  window.VWComponents['of1cj-sweep'] = {
    props: { kind: { type: String, default: '' } },
    data() { return { turn: 0, blocked: 0 }; },
    mounted() { C.onReady(() => this.animate()); },
    beforeUnmount() { if (this.tl) this.tl.kill(); },
    methods: {
      animate() {
        if (typeof gsap === 'undefined' || C.prefersReducedMotion) return;
        const root = this.$el;
        const pills = Array.from(root.querySelectorAll('[data-pill]'));
        const histCells = Array.from(root.querySelectorAll('[data-hist]'));
        if (!pills.length) return;
        const histAt = (turn, link) => histCells.find(el => el.dataset.turn == turn && el.dataset.link == link);
        const turns = [
          { warn: [4], fail: [] },
          { warn: [2, 11], fail: [4] },
          { warn: [9], fail: [2, 4] },
          { warn: [3, 9], fail: [4, 12] },
          { warn: [], fail: [4, 12] },
        ];
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });
        tl.set(pills, { backgroundColor: P.synced }).set(histCells, { backgroundColor: P.empty })
          .call(() => { this.turn = 0; this.blocked = 0; });
        turns.forEach((tdef, ti) => {
          tl.call(() => { this.turn = ti + 1; });
          for (let li = 0; li < 14; li++) {
            const pill = pills[li];
            if (!pill) continue;
            let color = P.synced;
            if (tdef.fail.includes(li)) color = P.drift;
            else if (tdef.warn.includes(li)) color = P.hop;
            tl.to(pill, { backgroundColor: color, duration: 0.14 }, li === 0 ? '+=0.25' : '+=0.03');
            const hCell = histAt(ti, li);
            if (hCell) tl.to(hCell, { backgroundColor: color, duration: 0.14 }, '<');
          }
          tl.call(() => { this.blocked = tdef.fail.length; });
          tl.to({}, { duration: 0.4 });
        });
        turns[turns.length - 1].fail.forEach((li, i) => {
          tl.call(() => C.spawnPing(root, pills[li], P.scan, 2.4), null, i === 0 ? '+=0.4' : '+=0.18');
        });
        tl.to({}, { duration: 2.0 });
        this.tl = tl;
      }
    },
    render() {
      const chain = C.CHAIN;
      const turns = 5;
      return h('div', { class: 'adh-fig' }, [
        h('div', { class: 'adh-frame' }, [
          h('div', { class: 'adh-grid', style: 'grid-template-columns: repeat(14, minmax(0, 1fr));margin-bottom:12px;' },
            chain.map((c, i) => h('div', { style: 'display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;' }, [
              h('div', { 'data-pill': true, 'data-link': i, style: 'height:22px;width:100%;border-radius:99px;background-color:' + P.synced + ';will-change:background-color;' }),
              h('div', { class: 'adh-collabel', title: c.label }, c.label),
            ]))
          ),
          h('div', { style: 'font-size:9px;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-50);margin:14px 0 7px;' }, 'history (latest at top)'),
          h('div', { style: 'display:flex;flex-direction:column;gap:4px;' },
            Array.from({ length: turns }, (_, j) => h('div', { class: 'adh-grid', style: 'grid-template-columns: repeat(14, minmax(0, 1fr));' },
              Array.from({ length: 14 }, (_, i) => h('div', { 'data-hist': true, 'data-turn': j, 'data-link': i, style: 'height:14px;border-radius:99px;background-color:' + P.empty + ';will-change:background-color;' }))
            ))
          ),
          h('div', { class: 'adh-legend' }, [
            C.legendDot(P.synced, 'clean'),
            C.legendDot(P.hop, 'warnings'),
            C.legendDot(P.drift, 'block-worthy'),
            C.legendDot(P.scan, 'sweep'),
            h('span', { class: 'adh-status' }, 'turn ' + this.turn + '/5 · blocking ' + this.blocked),
          ]),
        ]),
      ]);
    },
  };
  if (window.VWVisuals) window.VWVisuals.registerBespoke('of1cj', 'sweep', 'of1cj-sweep');
})();
