/* AppFooter — three-column footer reading from localized site config. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['app-footer'] = {
    setup() { return { store: window.VWStore }; },
    template: `
      <footer class="civic-footer" v-if="store.t && store.t.footer">
        <div>
          <div class="smallcaps">{{ store.t.footer.smallcaps }}</div>
          <h5>{{ store.t.footer.primary.heading }}</h5>
          <p>{{ store.t.footer.primary.body }}</p>
        </div>
        <div v-for="col in store.t.footer.columns" :key="col.heading">
          <h5>{{ col.heading }}</h5>
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
