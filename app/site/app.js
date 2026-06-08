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

  /* ---- Clean-URL router (History API) ----
     Served from GitHub Pages: real routes have a prerendered index.html at the
     clean path; a direct hit there (or 404.html) redirects to /?redirect=<path>
     and the boot script in index.html restores the clean URL before this runs.
     A trailing /fr (or /en) segment is a crawler hreflang variant; the locale
     itself is carried in localStorage, so routing ignores it. */
  const KNOWN_PAGES = ['index', 'about', 'press', 'resources', 'gallery', 'glossary', 'repos', 'updates', 'community', 'privacy', 'not-found'];
  function parsePath() {
    const parts = (location.pathname || '/').split('/').filter(Boolean);
    if (parts.length && (parts[parts.length - 1] === 'fr' || parts[parts.length - 1] === 'en')) parts.pop();
    if (parts.length === 0) return { page: 'library', paperId: null };
    if (parts[0] === 'paper' && parts[1]) return { page: 'paper', paperId: decodeURIComponent(parts[1]) };
    if (KNOWN_PAGES.includes(parts[0])) return { page: parts[0], paperId: null };
    return { page: 'not-found', paperId: null };
  }
  function pathFor(target) {
    if (typeof target === 'string') return target === 'library' ? '/' : '/' + target;
    if (target && target.page === 'paper') return '/paper/' + target.id;
    return '/';
  }

  /* ---- Root app ---- */
  const app = createApp({
    setup() {
      const route = ref(parsePath());

      const currentPage = computed(() => {
        switch (route.value.page) {
          case 'library':       return 'library-page';
          case 'index':         return 'index-page';
          case 'about':         return 'about-page';
          case 'press':         return 'press-page';
          case 'resources':     return 'resources-page';
          case 'gallery':       return 'gallery-page';
          case 'glossary':      return 'glossary-page';
          case 'repos':         return 'repos-page';
          case 'updates':       return 'updates-page';
          case 'community':     return 'community-page';
          case 'privacy':       return 'privacy-page';
          case 'not-found':     return 'not-found-page';
          case 'paper':         return 'paper-page';
          default:              return 'not-found-page';
        }
      });

      const paperId = computed(() => route.value.paperId);
      const page = computed(() => route.value.page);

      function applyRoute() {
        route.value = parsePath();
        if (route.value.page === 'paper' && route.value.paperId) markVisited(route.value.paperId);
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
            about:        'About',
            press:        'Press',
            resources:    'Resources',
            gallery:      'Media',
            glossary:     'Glossary',
            repos:        'Repositories',
            updates:      'Updates',
            community:    'Community',
            privacy:      'Privacy',
            'not-found':  'Not found',
          };
          window.VWMeta.setSitePage(route.value.page, pageTitles[route.value.page]);
        }
        /* SPA page view. The initial load is counted by gtag('config'); every
           in-app navigation reports here with the new clean path. */
        if (window.gtag && window.__GA_ID__) {
          window.gtag('event', 'page_view', {
            page_path: location.pathname,
            page_location: location.href,
            page_title: document.title,
          });
        }
      }
      function go(path) {
        if (path !== location.pathname) history.pushState({}, '', path);
        applyRoute();
      }
      function navigate(target) { go(pathFor(target)); }
      /* Intercept clicks on internal links so they route in-app (no reload)
         and the address bar shows the clean, shareable URL. External links,
         new-tab/modified clicks, downloads, and #fragment links pass through. */
      function onLinkClick(e) {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const a = e.target.closest && e.target.closest('a[href]');
        if (!a) return;
        if (a.target === '_blank' || a.hasAttribute('download') || a.getAttribute('rel') === 'external') return;
        const href = a.getAttribute('href');
        if (!href || href[0] !== '/' || href[1] === '/') return;   // only same-origin absolute paths
        e.preventDefault();
        go(href);
      }
      function setLocale(code) { applyLocale(code); }

      onMounted(async () => {
        try { await loadCore(); }
        catch (e) { console.error('Failed to load site data:', e); }
        window.addEventListener('popstate', applyRoute);
        document.addEventListener('click', onLinkClick);
        /* Initial meta application — paper detail pages override on content load. */
        if (window.VWMeta && route.value.page !== 'paper') {
          window.VWMeta.setSitePage(route.value.page);
        }
      });
      onUnmounted(() => {
        window.removeEventListener('popstate', applyRoute);
        document.removeEventListener('click', onLinkClick);
      });

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
