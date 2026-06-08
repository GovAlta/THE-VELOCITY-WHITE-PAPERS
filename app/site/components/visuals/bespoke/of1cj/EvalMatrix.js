/* of1cj:evals — the Symbiotic Chain Evals matrix. Rows are chain transitions,
   columns are recent runs. Each run colours its cells pass / warn / fail. When
   a run fails, the harness pings the cell and a ticket flies to the tray.
   Ported from the ADHD EvalStatusMatrix demo. */

(function () {
  const C = window.VWof1cj;
  if (!C) return;
  const h = C.h;
  const P = C.PAL;

  window.VWComponents = window.VWComponents || {};
  window.VWComponents['of1cj-evals'] = {
    props: { kind: { type: String, default: '' } },
    data() { return { run: 0, fails: 0 }; },
    mounted() { C.onReady(() => this.animate()); },
    beforeUnmount() { if (this.tl) this.tl.kill(); },
    methods: {
      animate() {
        if (typeof gsap === 'undefined' || C.prefersReducedMotion) return;
        const root = this.$el;
        const cells = Array.from(root.querySelectorAll('[data-eval]'));
        const glyphs = Array.from(root.querySelectorAll('[data-eval-glyph]'));
        const tray = root.querySelector('[data-eval-tray]');
        if (!cells.length) return;
        const cellAt = (t, r) => cells.find(el => el.dataset.t == t && el.dataset.r == r);
        const glyphAt = (t, r) => glyphs.find(el => el.dataset.t == t && el.dataset.r == r);
        const runs = [
          { fails: [], warns: [] },
          { fails: [3], warns: [1] },
          { fails: [3, 6], warns: [1, 4] },
          { fails: [3, 5, 6], warns: [1, 2, 7] },
          { fails: [5], warns: [3] },
        ];
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.8 });
        tl.set(cells, { backgroundColor: P.empty }).set(glyphs, { opacity: 0 })
          .call(() => { this.run = 0; this.fails = 0; });
        runs.forEach((rdef, ri) => {
          tl.call(() => { this.run = ri + 1; });
          for (let ti = 0; ti < 8; ti++) {
            const cell = cellAt(ti, ri);
            const glyph = glyphAt(ti, ri);
            if (!cell) continue;
            let color = P.synced, symbol = '✓', glyphColor = 'rgba(255,255,255,0.95)';
            if (rdef.fails.includes(ti)) { color = P.drift; symbol = '✗'; glyphColor = '#fff'; }
            else if (rdef.warns.includes(ti)) { color = P.hop; symbol = '~'; glyphColor = 'rgba(0,0,0,0.7)'; }
            tl.to(cell, { backgroundColor: color, duration: 0.15 }, ti === 0 ? '+=0.25' : '+=0.05');
            if (glyph) {
              tl.call(() => { glyph.textContent = symbol; glyph.style.color = glyphColor; }, null, '<');
              tl.to(glyph, { opacity: 1, duration: 0.15 }, '<');
            }
          }
          tl.call(() => { this.fails = rdef.fails.length; });
        });
        runs[3].fails.forEach((ti, i) => {
          const failCell = cellAt(ti, 3);
          if (failCell && tray) {
            tl.call(() => { C.spawnPing(root, failCell, P.scan, 2.4); C.flyTicket(root, failCell, tray, 'eval ' + ti + ' failed', P.drift); }, null, '+=' + (i === 0 ? 0.4 : 0.2));
          }
        });
        tl.to({}, { duration: 2.2 });
        this.tl = tl;
      }
    },
    render() {
      const transitions = [
        'requirements ↔ schema', 'schema ↔ migrations', 'controllers ↔ routers',
        'routers ↔ api_specs', 'components ↔ pages', 'pages ↔ docs',
        'controllers ↔ docs', 'schema ↔ training',
      ];
      const runs = 5;
      const th = (txt, extra) => h('th', { style: 'font-weight:400;padding-bottom:8px;font-size:9px;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-50);' + (extra || '') }, txt);
      const swatch = (color, glyph, glyphColor, label) => h('span', { class: 'adh-leg' }, [
        h('span', { style: 'width:13px;height:13px;border-radius:3px;display:inline-flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:' + glyphColor + ';background:' + color + ';' }, glyph),
        h('span', {}, label),
      ]);
      return h('div', { class: 'adh-fig' }, [
        h('div', { class: 'adh-frame' }, [
          h('div', { 'data-eval-tray': true, style: 'position:absolute;top:8px;right:8px;width:96px;pointer-events:none;' }),
          h('table', { style: 'width:100%;border-collapse:collapse;font-size:12px;' }, [
            h('thead', {}, [h('tr', {}, [
              th('Transition', 'text-align:left;padding-right:12px;'),
              ...Array.from({ length: runs }, (_, i) => th('run ' + (i + 1), 'padding:0 4px 8px;')),
            ])]),
            h('tbody', {}, transitions.map((t, ti) => h('tr', { style: 'border-top:1px solid var(--rule);' }, [
              h('td', { style: 'padding:8px 12px 8px 0;color:var(--ink);white-space:nowrap;' }, t),
              ...Array.from({ length: runs }, (_, ri) => h('td', { style: 'padding:6px 4px;' }, [
                h('div', {
                  'data-eval': true, 'data-t': ti, 'data-r': ri,
                  class: 'adh-cell',
                  style: 'height:24px;background-color:' + P.empty + ';display:flex;align-items:center;justify-content:center;',
                }, [
                  h('span', { 'data-eval-glyph': true, 'data-t': ti, 'data-r': ri, style: 'opacity:0;font-family:var(--font-mono);font-size:11px;font-weight:700;line-height:1;color:#fff;' }),
                ]),
              ])),
            ]))),
          ]),
          h('div', { class: 'adh-legend' }, [
            swatch(P.synced, '✓', '#fff', 'pass'),
            swatch(P.hop, '~', 'rgba(0,0,0,0.7)', 'warn'),
            swatch(P.drift, '✗', '#fff', 'fail'),
            C.legendDot(P.empty, 'no eval'),
            h('span', { class: 'adh-status' }, 'run ' + this.run + '/' + runs + ' · failures ' + this.fails),
          ]),
        ]),
      ]);
    },
  };
  if (window.VWVisuals) window.VWVisuals.registerBespoke('of1cj', 'evals', 'of1cj-evals');
})();
