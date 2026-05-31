/* Velocity Whitepapers — Vue 3 app bootstrap.
   Hash-based routing for GitHub Pages compatibility.
   Locale-aware: data/papers/wp-NN.<locale>.json, public/audio/<locale>/wp-NN.mp3.
*/

(function () {
  const { createApp, reactive, computed, onMounted, onUnmounted, ref } = Vue;

  // ---- Shared store ----
  const initialLocale = localStorage.getItem('vw_locale') || 'en';

  const store = reactive({
    site: null,
    papers: [],
    paperById: {},
    paperCache: {},       // key: "<locale>:<id>" -> full content
    visited: new Set(JSON.parse(localStorage.getItem('vw_visited') || '[]')),
    ready: false,
    locale: initialLocale,
    t: {},                // active-locale string bag (alias to site.i18n[locale])
    assetBust: {},        // asset path -> cache-bust token; bumped when an image or audio file is regenerated in edit mode
  });

  function applyLocale(locale) {
    const changed = store.locale !== locale;
    store.locale = locale;
    localStorage.setItem('vw_locale', locale);
    if (store.site && store.site.i18n && store.site.i18n[locale]) {
      store.t = store.site.i18n[locale];
    }
    document.documentElement.lang = locale;
    if (changed && window.VWA11y) {
      const loc = (store.site && store.site.locales || []).find(l => l.code === locale);
      const name = loc ? (loc[locale === 'fr' ? 'name_fr' : 'name_en'] || loc.label) : locale;
      window.VWA11y.announce(
        (locale === 'fr' ? 'Langue changée pour ' : 'Language changed to ') + name
      );
    }
  }

  async function loadJSON(path) {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error('Failed to load ' + path);
    return res.json();
  }

  async function loadCore() {
    const [site, papers] = await Promise.all([
      loadJSON('data/site.json'),
      loadJSON('data/papers.json'),
    ]);
    store.site = site;
    store.papers = papers.papers;
    store.paperById = Object.fromEntries(papers.papers.map(p => [p.id, p]));
    applyLocale(store.locale);
    store.ready = true;
  }

  /* Load a paper's content JSON.
     Tries: data/papers/<id>.<locale>.json
     Falls back to: data/papers/<id>.<default_locale>.json
     Finally to:   data/papers/<id>.json (legacy / locale-neutral). */
  async function loadPaper(id, localeOverride) {
    const locale = localeOverride || store.locale;
    const cacheKey = locale + ':' + id;
    if (store.paperCache[cacheKey]) return store.paperCache[cacheKey];

    const fallback = (store.site && store.site.default_locale) || 'en';
    const candidates = [
      'data/papers/' + id + '.' + locale + '.json',
      'data/papers/' + id + '.' + fallback + '.json',
      'data/papers/' + id + '.json',
    ];
    let content = null, lastError = null;
    for (const url of candidates) {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (res.ok) { content = await res.json(); break; }
      } catch (e) { lastError = e; }
    }
    if (!content) throw (lastError || new Error('No content found for ' + id));
    store.paperCache[cacheKey] = content;
    return content;
  }

  /* Load a static page's content JSON, the same per-locale way papers load.
     Tries: data/pages/<name>.<locale>.json
     Falls back to: data/pages/<name>.<default_locale>.json */
  const pageCache = {};
  async function loadPageData(name, localeOverride) {
    const locale = localeOverride || store.locale;
    const cacheKey = locale + ':' + name;
    if (pageCache[cacheKey]) return pageCache[cacheKey];

    const fallback = (store.site && store.site.default_locale) || 'en';
    const candidates = [
      'data/pages/' + name + '.' + locale + '.json',
      'data/pages/' + name + '.' + fallback + '.json',
    ];
    let content = null, lastError = null;
    for (const url of candidates) {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (res.ok) { content = await res.json(); break; }
      } catch (e) { lastError = e; }
    }
    if (!content) throw (lastError || new Error('No content found for page ' + name));
    pageCache[cacheKey] = content;
    return content;
  }

  function markVisited(id) {
    store.visited.add(id);
    localStorage.setItem('vw_visited', JSON.stringify([...store.visited]));
  }

  // Expose for components
  window.VWStore = store;
  window.VWLoadPaper = loadPaper;
  window.VWLoadPageData = loadPageData;
  window.VWMarkVisited = markVisited;
  window.VWSetLocale = applyLocale;

  /* ---- Hash router ---- */
  function parseHash() {
    const h = (location.hash || '#/').replace(/^#/, '');
    const parts = h.split('/').filter(Boolean);
    if (parts.length === 0) return { page: 'library', paperId: null };
    if (parts[0] === 'index')        return { page: 'index',        paperId: null };
    if (parts[0] === 'architecture') return { page: 'architecture', paperId: null };
    if (parts[0] === 'about')        return { page: 'about',        paperId: null };
    if (parts[0] === 'manual')       return { page: 'manual',       paperId: null };
    if (parts[0] === 'glossary')     return { page: 'glossary',     paperId: null };
    if (parts[0] === 'repos')        return { page: 'repos',        paperId: null };
    if (parts[0] === 'updates')      return { page: 'updates',      paperId: null };
    if (parts[0] === 'community')    return { page: 'community',    paperId: null };
    if (parts[0] === 'not-found')    return { page: 'not-found',    paperId: null };
    if (parts[0] === 'paper' && parts[1]) return { page: 'paper', paperId: parts[1] };
    return { page: 'not-found', paperId: null };
  }

  /* ---- Root app ---- */
  const app = createApp({
    setup() {
      const route = ref(parseHash());

      const currentPage = computed(() => {
        switch (route.value.page) {
          case 'library':       return 'library-page';
          case 'index':         return 'index-page';
          case 'architecture':  return 'architecture-page';
          case 'about':         return 'about-page';
          case 'manual':        return 'manual-page';
          case 'glossary':      return 'glossary-page';
          case 'repos':         return 'repos-page';
          case 'updates':       return 'updates-page';
          case 'community':     return 'community-page';
          case 'not-found':     return 'not-found-page';
          case 'paper':         return 'paper-page';
          default:              return 'not-found-page';
        }
      });

      const paperId = computed(() => route.value.paperId);
      const page = computed(() => route.value.page);

      function onHashChange() {
        route.value = parseHash();
        window.scrollTo(0, 0);
        /* Move focus to <main> so screen readers re-announce the new page region. */
        const main = document.getElementById('main-content');
        if (main && typeof main.focus === 'function') {
          requestAnimationFrame(() => main.focus({ preventScroll: true }));
        }
        /* Update meta tags for non-paper pages. Paper pages set their own meta
           when the content JSON loads. */
        if (window.VWMeta && route.value.page !== 'paper') {
          const pageTitles = {
            library:      null,
            index:        'Index',
            architecture: 'Architecture',
            about:        'About',
            manual:       'Manual',
            glossary:     'Glossary',
            repos:        'Repositories',
            updates:      'Updates',
            community:    'Community',
            'not-found':  'Not found',
          };
          window.VWMeta.setSitePage(route.value.page, pageTitles[route.value.page]);
        }
      }
      function navigate(target) {
        if (typeof target === 'string') {
          if (target === 'library') location.hash = '#/';
          else location.hash = '#/' + target;
        } else if (target && target.page === 'paper') {
          location.hash = '#/paper/' + target.id;
          markVisited(target.id);
        }
      }
      function setLocale(code) { applyLocale(code); }

      onMounted(async () => {
        try { await loadCore(); }
        catch (e) { console.error('Failed to load site data:', e); }
        window.addEventListener('hashchange', onHashChange);
        /* Initial meta application — paper detail pages override on content load. */
        if (window.VWMeta && route.value.page !== 'paper') {
          window.VWMeta.setSitePage(route.value.page);
        }
      });
      onUnmounted(() => window.removeEventListener('hashchange', onHashChange));

      return { currentPage, paperId, page, navigate, setLocale, store };
    },
  });

  /* Register components from window.VWComponents. The visuals registry tracks
     which keys have been pushed onto the app instance so lazy-loaded bespoke
     visual scripts can register their components after mount. */
  if (window.VWVisuals && window.VWVisuals.attachApp) {
    window.VWVisuals.attachApp(app);
  } else {
    const reg = window.VWComponents || {};
    Object.keys(reg).forEach(k => app.component(k, reg[k]));
  }

  app.mount('#app');
})();
