/* AppFooter — three-column footer reading from localized site config. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['app-footer'] = {
    setup() { return { store: window.VWStore }; },
    computed: {
      /* Live count of numbered papers, so the footer text never drifts from the
         actual collection. The body string in site.json carries a {n} token. */
      papersCount() {
        return (this.store.papers || [])
          .filter(p => p.category !== 'architecture' && /^\d+$/.test(String(p.num))).length;
      },
      primaryBody() {
        const tpl = (this.store.t.footer && this.store.t.footer.primary && this.store.t.footer.primary.body) || '';
        return tpl.replace('{n}', this.papersCount);
      },
    },
    template: `
      <footer class="civic-footer" v-if="store.t && store.t.footer">
        <div>
          <div class="smallcaps">{{ store.t.footer.smallcaps }}</div>
          <h2>{{ store.t.footer.primary.heading }}</h2>
          <p>{{ primaryBody }}</p>
        </div>
        <div v-for="col in store.t.footer.columns" :key="col.heading">
          <h2>{{ col.heading }}</h2>
          <ul>
            <li v-for="it in col.items" :key="it.label">
              <a :href="it.href">{{ it.label }}</a>
            </li>
          </ul>
        </div>
      </footer>
    `,
  };
})();
