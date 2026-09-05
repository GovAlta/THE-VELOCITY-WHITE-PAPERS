/* KeyStat — a single oversized number with explanatory text.

   When a block object is passed and dev edit mode is on, the label
   (superscript), the big value, and the body text become editable in place. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['key-stat'] = {
    props: {
      label: { type: String, default: '' },
      value: { type: String, default: '' },
      body:  { type: String, default: '' },
      block: { type: Object, default: null },
    },
    setup() { return { edit: window.VWEdit || null }; },
    computed: {
      editing() { return !!(this.edit && this.edit.enabled); },
    },
    template: `
      <div class="cd-keystat">
        <div>
          <template v-if="block">
            <editable-text v-if="editing || block.label" tag="span" cls="lbl" :obj="block" field="label" />
            <editable-text tag="div" cls="big" :obj="block" field="value" />
          </template>
          <template v-else>
            <span class="lbl" v-if="label">{{ label }}</span>
            <div class="big">{{ value }}</div>
          </template>
        </div>
        <editable-text v-if="block && (editing || block.body)" tag="div" cls="body-txt" :obj="block" field="body" :html="true" />
        <div class="body-txt" v-else-if="!block && body" v-html="body"></div>
      </div>
    `,
  };
})();
