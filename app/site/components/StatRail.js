/* StatRail — four-column statistic strip below the hero. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['stat-rail'] = {
    props: { stats: { type: Array, required: true } },
    template: `
      <div class="civic-rail">
        <div class="civic-rail-item" v-for="(s, i) in stats" :key="i">
          <div class="k">{{ s.k }}</div>
          <div class="v">{{ s.v }}</div>
          <div class="sub" v-if="s.sub">{{ s.sub }}</div>
        </div>
      </div>
    `,
  };
})();
