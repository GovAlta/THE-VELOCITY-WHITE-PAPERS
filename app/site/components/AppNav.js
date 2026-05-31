/* AppNav — top navigation bar.
   Sticky. Brand mark, wordmark, primary links, ministry tag, language switcher.
   On screens below 900px the links + locale switch move into a slide-down drawer
   opened by a hamburger button. */

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['app-nav'] = {
    props: { page: { type: String, default: 'library' } },
    emits: ['navigate'],
    setup() { return { store: window.VWStore }; },
    data() { return { drawerOpen: false }; },
    watch: {
      page() { this.drawerOpen = false; },
    },
    methods: {
      isActive(id) {
        if (id === 'library') return this.page === 'library' || this.page === 'paper';
        return this.page === id;
      },
      setLocale(code) {
        window.VWSetLocale(code);
        this.drawerOpen = false;
      },
      onNavigate(id) {
        this.$emit('navigate', id);
        this.drawerOpen = false;
      },
      toggleDrawer() { this.drawerOpen = !this.drawerOpen; },
    },
    template: `
      <nav class="civic-nav" v-if="store.site" :class="{ 'drawer-open': drawerOpen }">
        <a class="brand" href="#/"
           @click="onNavigate('library')"
           :aria-label="(store.locale === 'fr' ? 'Accueil, ' : 'Home, ') + store.t.title">
          <img src="assets/alberta-wordmark.png"
               alt="Government of Alberta"
               width="100" height="28"
               decoding="async" />
          <span class="divider" aria-hidden="true"></span>
          <span class="wordmark">{{ store.t.title }}</span>
        </a>

        <ul class="links" role="list">
          <li v-for="item in store.t.nav" :key="item.id">
            <a :href="'#/' + (item.id === 'library' ? '' : item.id)"
               :class="{ active: isActive(item.id) }"
               :aria-current="isActive(item.id) ? 'page' : null"
               @click="onNavigate(item.id)">{{ item.label }}</a>
          </li>
        </ul>

        <div class="nav-trail">
          <div class="locale-switch" role="group"
               :aria-label="store.locale === 'fr' ? 'Choix de langue' : 'Language selection'">
            <button v-for="l in store.site.locales"
                    :key="l.code"
                    :class="{ on: store.locale === l.code }"
                    :aria-pressed="store.locale === l.code ? 'true' : 'false'"
                    :aria-label="(store.locale === 'fr' ? 'Passer en ' : 'Switch to ') + (l.name_en || l.label)"
                    :lang="l.code"
                    @click="setLocale(l.code)">{{ l.label }}</button>
          </div>
          <div class="cio" :title="store.t.publisher">
            <span class="cio-full">{{ store.t.publisher }}</span>
            <span class="cio-short">{{ store.t.publisher_short || 'Alberta · TI' }}</span>
          </div>
        </div>

        <button class="nav-hamburger"
                :aria-expanded="drawerOpen ? 'true' : 'false'"
                :aria-controls="'nav-drawer'"
                :aria-label="drawerOpen
                  ? (store.locale === 'fr' ? 'Fermer le menu' : 'Close menu')
                  : (store.locale === 'fr' ? 'Ouvrir le menu' : 'Open menu')"
                @click="toggleDrawer">
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </button>

        <!-- Mobile drawer: drops down below the nav bar on small screens -->
        <div id="nav-drawer" class="nav-drawer" v-show="drawerOpen" role="navigation"
             :aria-label="store.locale === 'fr' ? 'Menu principal' : 'Primary menu'">
          <a v-for="item in store.t.nav"
             :key="item.id"
             :href="'#/' + (item.id === 'library' ? '' : item.id)"
             :class="{ active: isActive(item.id) }"
             :aria-current="isActive(item.id) ? 'page' : null"
             @click="onNavigate(item.id)">{{ item.label }}</a>
          <div class="nav-drawer-locale" role="group"
               :aria-label="store.locale === 'fr' ? 'Choix de langue' : 'Language selection'">
            <button v-for="l in store.site.locales"
                    :key="l.code"
                    :class="{ on: store.locale === l.code }"
                    :aria-pressed="store.locale === l.code ? 'true' : 'false'"
                    :aria-label="(store.locale === 'fr' ? 'Passer en ' : 'Switch to ') + (l.name_en || l.label)"
                    :lang="l.code"
                    @click="setLocale(l.code)">{{ l.label }}</button>
          </div>
          <div class="nav-drawer-cio">{{ store.t.publisher }}</div>
        </div>
      </nav>

      <!-- Drawer backdrop -->
      <div v-if="drawerOpen" class="nav-backdrop" @click="drawerOpen = false"></div>
    `,
  };
})();
