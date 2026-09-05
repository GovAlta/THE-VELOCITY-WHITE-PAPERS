/* SideNote — small floated aside, typically right-side. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['side-note'] = {
    props: {
      label: { type: String, default: 'Note' },
      value: { type: String, required: true },
    },
    template: `
      <aside class="cd-sidenote">
        <div class="l">{{ label }}</div>
        <div class="v">{{ value }}</div>
      </aside>
    `,
  };
})();
