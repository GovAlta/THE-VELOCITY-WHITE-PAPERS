/* of1cj:board — the Anti-Drift Harness watching a builder project. Rows are
   features, columns are the fourteen chain links. The builder takes turns,
   touching a cell and propagating one hop. After several turns the harness
   sweeps the board with a scan beam, the un-propagated cells light up as drift,
   and tickets accumulate in .tickets/open/. Ported from the ADHD AntiDriftBoard
   demo. Doubles as the chain-layered tile board surface. */

(function () {
  const C = window.VWof1cj;
  if (!C) return;
  const P = C.PAL;

  window.VWComponents = window.VWComponents || {};
  window.VWComponents['of1cj-board'] = {
    props: { kind: { type: String, default: '' } },
    data() {
      return {
        chain: C.CHAIN,
        features: [
          { id: 'auth', label: 'User Auth' },
          { id: 'reports', label: 'Reports' },
          { id: 'billing', label: 'Billing' },
          { id: 'onboarding', label: 'Onboarding' },
          { id: 'notifications', label: 'Notifications' },
          { id: 'admin', label: 'Admin' },
        ],
        cycle: 0,
        cycleMax: 5,
        tickets: [],
        phase: 'builder',
      };
    },
    mounted() { C.onReady(() => this.start()); },
    beforeUnmount() { if (this.tl) this.tl.kill(); },
    methods: {
      cellAt(r, c) { return this.$el.querySelector('.adh-bcell[data-r="' + r + '"][data-c="' + c + '"]'); },
      start() {
        if (typeof gsap === 'undefined') return;
        const builder = this.$el.querySelector('.adh-agent-builder');
        const antidrift = this.$el.querySelector('.adh-agent-antidrift');
        const beam = this.$el.querySelector('.adh-beam');
        const allCells = Array.from(this.$el.querySelectorAll('.adh-bcell'));
        const board = this.$el.querySelector('.adh-board');
        if (!builder || !antidrift || !beam || !board || !allCells.length) return;

        if (C.prefersReducedMotion) { gsap.set(allCells, { backgroundColor: P.empty }); this.phase = 'idle'; return; }

        const builderTurns = [
          { row: 1, link: 3 }, { row: 1, link: 4 }, { row: 2, link: 7 }, { row: 3, link: 1 }, { row: 0, link: 12 },
        ];
        const staleAfterBuilder = [
          { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 9 }, { r: 1, c: 12 }, { r: 1, c: 13 },
          { r: 2, c: 3 }, { r: 2, c: 9 }, { r: 2, c: 12 },
          { r: 3, c: 3 }, { r: 3, c: 9 }, { r: 3, c: 12 },
          { r: 0, c: 1 }, { r: 0, c: 3 }, { r: 0, c: 9 },
        ];
        const placeAgentOverCell = (agent, r, c) => {
          const cell = this.cellAt(r, c);
          if (!cell) return null;
          const cr = cell.getBoundingClientRect();
          const br = board.getBoundingClientRect();
          return { x: cr.left - br.left + cr.width / 2 - agent.offsetWidth / 2, y: cr.top - br.top + cr.height / 2 - agent.offsetHeight / 2 - 14 };
        };

        const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.8, defaults: { ease: 'power2.out' } });
        tl.set(allCells, { backgroundColor: P.empty, scale: 1 })
          .set(builder, { opacity: 0 }).set(antidrift, { opacity: 0 }).set(beam, { opacity: 0, x: 0 })
          .call(() => { this.cycle = 0; this.tickets = []; this.phase = 'builder'; });

        builderTurns.forEach((turn, turnIdx) => {
          const pos = placeAgentOverCell(builder, turn.row, turn.link);
          if (!pos) return;
          tl.call(() => { this.cycle = turnIdx + 1; this.phase = 'builder'; });
          tl.to(builder, { opacity: 1, x: pos.x, y: pos.y, duration: 0.45 }, '+=0.1');
          const targetCell = this.cellAt(turn.row, turn.link);
          tl.to(targetCell, { backgroundColor: P.edit, scale: 1.25, duration: 0.3 }, '+=0.1');
          const hops = [this.cellAt(turn.row, turn.link - 1), this.cellAt(turn.row, turn.link + 1)].filter(Boolean);
          if (hops.length) tl.to(hops, { backgroundColor: P.hop, duration: 0.3 }, '+=0.1');
          tl.to(targetCell, { scale: 1, duration: 0.2 }, '+=0.1');
        });

        tl.to(builder, { opacity: 0, duration: 0.3 }, '+=0.4');
        tl.call(() => { this.phase = 'anti-drift sweep'; });
        const staleCells = staleAfterBuilder.map(s => this.cellAt(s.r, s.c)).filter(Boolean);
        tl.to(staleCells, { backgroundColor: P.drift, scale: 1.1, duration: 0.35, stagger: { each: 0.04, from: 'start' } }, '+=0.2');
        tl.to(staleCells, { scale: 1, duration: 0.25 }, '+=0.05');
        tl.set(beam, { x: 0 }, '<');
        tl.to(beam, { opacity: 1, duration: 0.25 }, '<');
        tl.fromTo(beam, { x: 0 }, { x: board.offsetWidth - 28, duration: 1.6, ease: 'power1.inOut' }, '<+=0.1');
        tl.to(antidrift, { opacity: 1, duration: 0.3 }, '<');
        const ticketTexts = [
          { file: 'reports/openapi.yaml', detail: 'route /reports missing in spec' },
          { file: 'reports/migrations/0042.sql', detail: 'summary column not nullable' },
          { file: 'billing/training.md', detail: 'invoice fields out of date' },
          { file: 'onboarding/schema.sql', detail: 'role enum diverged' },
          { file: 'auth/cdn-config.tf', detail: 'token domain not whitelisted' },
        ];
        ticketTexts.forEach((t, i) => { tl.call(() => { this.tickets.push(t); }, null, '+=' + (i === 0 ? 0.3 : 0.15)); });
        tl.to(beam, { opacity: 0, duration: 0.4 }, '+=0.6');
        tl.call(() => { this.phase = 'tickets → .tickets/open/'; });
        tl.to({}, { duration: 2.5 });
        tl.to(antidrift, { opacity: 0, duration: 0.4 });
        this.tl = tl;
      }
    },
    template: `
      <div class="adh-fig">
        <div class="adh-frame" style="display:grid;grid-template-columns:1fr 180px;gap:18px;align-items:start;">
          <div style="position:relative;min-width:0;">
            <div class="adh-board">
              <div></div>
              <div v-for="(link, i) in chain" :key="'h'+link.id" class="adh-colnum">{{ String(i+1).padStart(2,'0') }}</div>
              <template v-for="(feat, r) in features" :key="feat.id">
                <div class="adh-flabel">{{ feat.label }}</div>
                <div v-for="(link, c) in chain" :key="feat.id+'-'+link.id" class="adh-bcell" :data-r="r" :data-c="c"></div>
              </template>
              <div class="adh-beam"></div>
              <div class="adh-agent adh-agent-builder">builder</div>
              <div class="adh-agent adh-agent-antidrift" style="width:64px;">anti-drift</div>
            </div>
            <div style="margin-top:14px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-50);">Builder turn</span>
              <span v-for="n in cycleMax" :key="n" class="adh-cyc" :class="[ n <= cycle ? 'active' : '', (phase.indexOf('sweep')>-1 || phase.indexOf('tickets')>-1) && n === cycleMax ? 'sweep' : '' ]"></span>
              <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-50);margin-left:10px;">phase</span>
              <span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-70);">{{ phase }}</span>
            </div>
          </div>
          <aside style="border:1px solid var(--rule);border-radius:8px;background:rgba(255,255,255,0.6);padding:12px;">
            <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-50);margin-bottom:8px;">Tickets · .tickets/open/</div>
            <transition-group name="adh-tk" tag="div" class="adh-tray">
              <div v-for="(t, i) in tickets" :key="i+t.file" class="adh-ticket">
                <div style="color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ t.file }}</div>
                <div style="color:var(--ink-50);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ t.detail }}</div>
              </div>
            </transition-group>
            <div v-if="!tickets.length" style="font-size:10.5px;color:var(--ink-50);font-style:italic;">empty</div>
          </aside>
        </div>
      </div>
    `,
  };
  if (window.VWVisuals) window.VWVisuals.registerBespoke('of1cj', 'board', 'of1cj-board');
})();
