/* ArchitectureDiagram — layered grid: row per layer, agents in each row.
   Reads from data/architecture.json (loaded by ArchitecturePage). */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['architecture-diagram'] = {
    props: { arch: { type: Object, required: true } },
    methods: {
      agentsForLayer(layerId) {
        return (this.arch.agents || []).filter(a => a.layer === layerId);
      },
      classFor(a) {
        return 'arch-agent ' + (a.cls || 'autonomous');
      },
    },
    template: `
      <section role="region" aria-labelledby="arch-diagram-title">
        <h2 id="arch-diagram-title" class="sr-only">Seven-layer agentic architecture</h2>
        <ul class="arch-legend" role="list" aria-label="Agent class legend">
          <li class="item"><span class="stripe" aria-hidden="true" style="background:var(--accent)"></span> Autonomous</li>
          <li class="item"><span class="stripe" aria-hidden="true" style="background:var(--ok)"></span> Verifier</li>
          <li class="item"><span class="stripe" aria-hidden="true" style="background:var(--highlight)"></span> Human-gated · Ledger</li>
        </ul>
        <ol class="arch-rows" role="list">
          <li class="arch-row" v-for="(layer, i) in arch.layers" :key="layer.id"
              :aria-label="'Layer ' + (i + 1) + ': ' + layer.label">
            <div class="label-cell">
              <div class="l-num" aria-hidden="true">L{{ String(i + 1).padStart(2, '0') }}</div>
              <h3 class="l-name">{{ layer.label }}</h3>
              <div class="l-sub">{{ layer.sub }}</div>
            </div>
            <ul class="agents-cell" role="list" :aria-label="layer.label + ' agents'">
              <li v-for="a in agentsForLayer(layer.id)" :key="a.id"
                  :class="classFor(a)"
                  :aria-label="a.label + ', ' + (a.cls || 'autonomous') + ', ' + a.throughput">
                <div class="a-name">{{ a.label }}</div>
                <div class="a-throughput" aria-hidden="true">{{ a.throughput }}</div>
              </li>
            </ul>
          </li>
        </ol>
      </section>
    `,
  };
})();
