/* PullQuote — a large in-body quote with optional citation. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['pull-quote'] = {
    props: {
      text: { type: String, required: true },
      cite: { type: String, default: '' },
    },
    template: `
      <blockquote class="pullquote">
        {{ text }}
        <div class="cite" v-if="cite">— {{ cite }}</div>
      </blockquote>
    `,
  };
})();
