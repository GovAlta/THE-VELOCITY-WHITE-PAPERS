/* KeyStat — a single oversized number with explanatory text. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['key-stat'] = {
    props: {
      label: { type: String, default: '' },
      value: { type: String, required: true },
      body:  { type: String, default: '' },
    },
    template: `
      <div class="cd-keystat">
        <div>
          <span class="lbl" v-if="label">{{ label }}</span>
          <div class="big">{{ value }}</div>
        </div>
        <div class="body-txt" v-if="body" v-html="body"></div>
      </div>
    `,
  };
})();
