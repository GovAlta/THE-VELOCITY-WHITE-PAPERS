/* of1cj:commits — the Commit-Narrative Spine. Each commit names the chain links
   it touched; the fourteen indicators under each commit light up as the commit
   lands, and a running tally shows cumulative chain coverage. Ported from the
   ADHD CommitTimelineTiles demo. */

(function () {
  const C = window.VWof1cj;
  if (!C) return;
  const h = C.h;
  const P = C.PAL;

  window.VWComponents = window.VWComponents || {};
  window.VWComponents['of1cj-commits'] = {
    props: { kind: { type: String, default: '' } },
    data() { return { commits: 0, coverage: 0 }; },
    mounted() { C.onReady(() => this.animate()); },
    beforeUnmount() { if (this.tl) this.tl.kill(); },
    methods: {
      animate() {
        if (typeof gsap === 'undefined' || C.prefersReducedMotion) return;
        const root = this.$el;
        const commitCards = Array.from(root.querySelectorAll('[data-commit]'));
        if (!commitCards.length) return;
        const covered = [[3, 4, 12], [1, 2, 3], [5, 3], [13, 1, 9], [10, 11], [3, 12]];
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.4 });
        const cumulative = new Set();
        tl.set(commitCards, { opacity: 0, y: -16, scale: 0.98 })
          .call(() => { this.commits = 0; this.coverage = 0; cumulative.clear(); });
        commitCards.forEach((card, i) => {
          tl.to(card, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.6)' }, i === 0 ? '+=0.2' : '+=0.35')
            .call(() => { this.commits = i + 1; });
          const indicators = Array.from(card.querySelectorAll('[data-ind]'));
          covered[i].forEach((linkIdx) => {
            const ind = indicators[linkIdx];
            if (ind) {
              tl.to(ind, { backgroundColor: P.synced, scale: 1.4, duration: 0.18 }, '<+=0.15')
                .to(ind, { scale: 1, duration: 0.18 });
            }
            cumulative.add(linkIdx);
          });
          tl.call(() => { this.coverage = cumulative.size; });
        });
        tl.to({}, { duration: 2.5 });
        this.tl = tl;
      }
    },
    render() {
      const commits = [
        { hash: 'a3f9c2', author: 'janak', msg: 'wire openapi to new /reports route' },
        { hash: 'e7b401', author: 'maya', msg: 'add reports_summary column + migration' },
        { hash: '4c1d88', author: 'janak', msg: 'fix middleware regression for trial users' },
        { hash: 'f0a23b', author: 'sam', msg: 'update onboarding training for new fields' },
        { hash: '9d8e55', author: 'maya', msg: 'pin cdn version for support assets' },
        { hash: '2bf7a0', author: 'janak', msg: 'add eval scaffolding for route ↔ openapi' },
      ];
      const authorColor = (a) => ({ janak: P.commit, maya: P.scan, sam: P.hop }[a] || 'var(--ink-50)');
      return h('div', { class: 'adh-fig' }, [
        h('div', { class: 'adh-frame', style: 'display:flex;flex-direction:column;gap:8px;' }, [
          ...commits.map((c, i) => h('div', {
            'data-commit': true, class: 'adh-card',
            style: 'border-left:3px solid ' + P.commit + ';display:flex;gap:12px;align-items:flex-start;will-change:transform,opacity;',
          }, [
            h('div', { style: 'display:flex;flex-direction:column;align-items:center;gap:3px;padding-top:2px;' }, [
              h('span', { style: 'width:10px;height:10px;border-radius:99px;background:' + authorColor(c.author) + ';' }),
              h('span', { style: 'font-size:8px;text-transform:uppercase;color:var(--ink-50);' }, c.author),
            ]),
            h('div', { style: 'flex:1;min-width:0;' }, [
              h('div', { style: 'display:flex;justify-content:space-between;gap:12px;align-items:baseline;' }, [
                h('span', { style: 'font-size:10px;letter-spacing:0.08em;color:' + P.commit + ';' }, c.hash),
                h('span', { style: 'font-size:8px;text-transform:uppercase;color:var(--ink-50);' }, '#' + (i + 1)),
              ]),
              h('div', { style: 'font-size:12.5px;color:var(--ink);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--font-sans, inherit);' }, c.msg),
              h('div', { class: 'adh-grid', style: 'grid-template-columns: repeat(14, minmax(0, 1fr));margin-top:8px;' },
                Array.from({ length: 14 }, () => h('div', { 'data-ind': true, class: 'adh-cell', style: 'height:8px;background-color:' + P.empty + ';' }))
              ),
            ]),
          ])),
          h('div', { class: 'adh-legend' }, [
            C.legendDot(P.synced, 'link named'),
            C.legendDot(P.empty, 'not named'),
            C.legendDot(P.commit, 'commit'),
            h('span', { class: 'adh-status' }, 'commits ' + this.commits + '/6 · coverage ' + this.coverage + '/14'),
          ]),
        ]),
      ]);
    },
  };
  if (window.VWVisuals) window.VWVisuals.registerBespoke('of1cj', 'commits', 'of1cj-commits');
})();
