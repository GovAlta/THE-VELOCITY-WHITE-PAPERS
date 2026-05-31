/* TagRow — horizontal row of mono pill tags. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['tag-row'] = {
    props: {
      label: { type: String, default: 'Tags' },
      tags:  { type: Array, default: () => [] },
    },
    template: `
      <div class="cd-tagrow" v-if="tags.length">
        <span class="l">{{ label }}</span>
        <span class="tag" v-for="t in tags" :key="t">{{ t }}</span>
      </div>
    `,
  };
})();
