/* PullQuote — a large in-body quote with optional citation.

   When a block object is passed and dev edit mode is on, the quote text and the
   citation become editable in place. The em dash before the citation is chrome,
   so it stays outside the editable field. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['pull-quote'] = {
    props: {
      text: { type: String, default: '' },
      cite: { type: String, default: '' },
      block: { type: Object, default: null },
    },
    setup() { return { edit: window.VWEdit || null }; },
    computed: {
      editing() { return !!(this.edit && this.edit.enabled); },
    },
    template: `
      <blockquote class="pullquote">
        <template v-if="block">
          <editable-text tag="span" :obj="block" field="text" />
          <div class="cite" v-if="editing || block.cite">— <editable-text tag="span" :obj="block" field="cite" /></div>
        </template>
        <template v-else>
          {{ text }}
          <div class="cite" v-if="cite">— {{ cite }}</div>
        </template>
      </blockquote>
    `,
  };
})();
