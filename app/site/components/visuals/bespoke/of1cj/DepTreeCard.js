/* of1cj:manifest — the Per-File Dependency Manifest tree card. The touched file
   sits in the middle; its upstream sources stack above and downstream consumers
   below. The harness checks each link and colours it consistent / stale /
   broken, then files a ticket on the broken one. Ported from the ADHD
   PerFileTreeCard demo. */

(function () {
  const C = window.VWof1cj;
  if (!C) return;
  const h = C.h;
  const P = C.PAL;

  window.VWComponents = window.VWComponents || {};
  window.VWComponents['of1cj-manifest'] = {
    props: { kind: { type: String, default: '' } },
    data() { return { phase: 'idle' }; },
    mounted() { C.onReady(() => this.animate()); },
    beforeUnmount() { if (this.tl) this.tl.kill(); },
    methods: {
      animate() {
        if (typeof gsap === 'undefined' || C.prefersReducedMotion) return;
        const root = this.$el;
        const focus = root.querySelector('[data-focus]');
        const ups = Array.from(root.querySelectorAll('[data-up] [data-dot]'));
        const downs = Array.from(root.querySelectorAll('[data-down] [data-dot]'));
        const downRows = Array.from(root.querySelectorAll('[data-down]'));
        if (!focus) return;
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });
        tl.set([...ups, ...downs], { backgroundColor: P.empty }).call(() => { this.phase = 'idle'; });
        tl.call(() => { this.phase = 'builder edits focus'; });
        tl.fromTo(focus, { boxShadow: '0 18px 45px rgba(0,0,0,0.16)' }, { boxShadow: '0 0 0 4px ' + P.edit + ', 0 18px 45px rgba(0,0,0,0.16)', duration: 0.3 }, '+=0.4')
          .call(() => C.spawnPing(root, focus, P.edit, 1.6))
          .to(focus, { boxShadow: '0 18px 45px rgba(0,0,0,0.16)', duration: 0.4 }, '+=0.5');
        tl.call(() => { this.phase = 'checking upstream'; });
        ups.forEach((dot, i) => {
          tl.to(dot, { backgroundColor: P.scan, duration: 0.2 }, '+=0.18')
            .to(dot, { backgroundColor: i === 2 ? P.hop : P.synced, duration: 0.25 }, '+=0.15');
        });
        tl.call(() => { this.phase = 'checking downstream'; });
        downs.forEach((dot, i) => {
          const final = (i === 2 || i === 3) ? P.drift : P.synced;
          tl.to(dot, { backgroundColor: P.scan, duration: 0.2 }, '+=0.18')
            .to(dot, { backgroundColor: final, duration: 0.25 }, '+=0.15');
        });
        tl.call(() => { this.phase = 'ticket filed'; });
        const failedRow = downRows[2];
        if (failedRow) tl.call(() => C.spawnPing(root, failedRow, P.drift, 1.4), null, '+=0.2');
        tl.to({}, { duration: 2.0 });
        this.tl = tl;
      }
    },
    render() {
      const upstream = ['requirements/reports.md', 'db/schema.sql', 'db/migrations/0042_reports.sql'];
      const downstream = ['src/routes/reports.ts', 'src/components/ReportsTable.vue', 'docs/reports.md', 'training/reports-launch.md'];
      const label = (txt, type) => h('div', { ['data-' + type]: true, class: 'adh-card', style: 'background:rgba(255,255,255,0.85);display:flex;align-items:center;gap:10px;padding:9px 12px;' }, [
        h('span', { 'data-dot': true, style: 'width:9px;height:9px;border-radius:99px;flex:none;background-color:' + P.empty + ';will-change:background-color;' }),
        h('span', { class: 'adh-mono', style: 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' }, txt),
      ]);
      const head = (txt) => h('div', { style: 'font-size:9px;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-50);margin-bottom:7px;' }, txt);
      return h('div', { class: 'adh-fig' }, [
        h('div', { class: 'adh-frame' }, [
          head('upstream'),
          h('div', { style: 'display:grid;gap:6px;' }, upstream.map(u => label(u, 'up'))),
          h('div', {
            'data-focus': true,
            style: 'margin:12px 0;border-radius:8px;background:#16120e;color:#fff;padding:12px;display:flex;align-items:center;gap:12px;box-shadow:0 18px 45px rgba(0,0,0,0.16);will-change:box-shadow;',
          }, [
            h('span', { style: 'font-family:var(--font-serif, Georgia, serif);font-style:italic;color:' + P.edit + ';font-size:15px;' }, 'focus'),
            h('span', { class: 'adh-mono', style: 'color:#fff;word-break:break-all;' }, 'src/controllers/reports.ts'),
          ]),
          head('downstream'),
          h('div', { style: 'display:grid;gap:6px;' }, downstream.map(d => label(d, 'down'))),
          h('div', { class: 'adh-legend' }, [
            C.legendDot(P.synced, 'consistent'),
            C.legendDot(P.hop, 'stale'),
            C.legendDot(P.drift, 'broken'),
            C.legendDot(P.scan, 'checking'),
            h('span', { class: 'adh-status' }, 'phase: ' + this.phase),
          ]),
        ]),
      ]);
    },
  };
  if (window.VWVisuals) window.VWVisuals.registerBespoke('of1cj', 'manifest', 'of1cj-manifest');
})();
