/* Velocity Whitepapers — Vue 3 app bootstrap.
   Hash-based routing for GitHub Pages compatibility.
   Locale-aware: data/papers/wp-NN.<locale>.json, public/audio/<locale>/wp-NN.mp3.
*/

(function () {
  const { createApp, reactive, computed, onMounted, onUnmounted, ref } = Vue;

  // ---- Shared store ----
  /* Remembered language preference: cookie first (survives across the app and is
     what "no cookie set" refers to), then localStorage, then default 'en'. A URL
     locale still overrides this on load (see loadCore). */
  function storedLocale() {
    const m = document.cookie.match(/(?:^|;\s*)vw_locale=([a-z-]+)/);
    return (m && m[1]) || localStorage.getItem('vw_locale') || 'en';
  }
  const initialLocale = storedLocale();

  const store = reactive({
    site: null,
    papers: [],
    paperById: {},
    repos: [],            // canonical repo list from data/repos.json (drives /repos, the home count, and paper repo links)
    reposDoc: null,       // full repos.json doc: { page, categories, repos }
    paperCache: {},       // key: "<locale>:<id>" -> full content
    visited: new Set(JSON.parse(localStorage.getItem('vw_visited') || '[]')),
    ready: false,
    locale: initialLocale,
    t: {},                // active-locale string bag (alias to site.i18n[locale])
    assetBust: {},        // asset path -> cache-bust token; bumped when an image or audio file is regenerated in edit mode
    playbackRate: 1,      // shared narration speed: the main audio control sets it, per-block players inherit it
  });

  /* Deep-merge the active locale's i18n bag over the default locale's, so a
     partially-translated locale falls back to the default per key instead of
     rendering blanks. Objects merge key-by-key; arrays and primitives from the
     locale win wholesale when present (so a fully-translated nav/footer/stats
     array replaces the default, but a missing one falls back). This is what
     lets a new language ship incrementally and grow its coverage safely. */
  function mergeI18n(base, over) {
    if (Array.isArray(over)) return over;
    if (over && typeof over === 'object') {
      const b = (base && typeof base === 'object' && !Array.isArray(base)) ? base : {};
      const out = {};
      for (const k of new Set([...Object.keys(b), ...Object.keys(over)])) {
        out[k] = (k in over) ? ((k in b) ? mergeI18n(b[k], over[k]) : over[k]) : b[k];
      }
      return out;
    }
    return over !== undefined ? over : base;
  }

  function applyLocale(locale) {
    const site = store.site || {};
    const locales = site.locales || [];
    const codes = locales.map(l => l.code);
    const def = site.default_locale || 'en';
    // Normalize: an unknown/stale locale (e.g. a removed language in localStorage) → default.
    if (codes.length && !codes.includes(locale)) locale = def;
    const changed = store.locale !== locale;
    store.locale = locale;
    localStorage.setItem('vw_locale', locale);
    /* Persist as a cookie too (in addition to localStorage) so the choice is
       durable for permanent language links and available to any edge/CDN layer. */
    try { document.cookie = 'vw_locale=' + locale + '; path=/; max-age=31536000; samesite=lax'; } catch (e) {}
    if (site.i18n) {
      store.t = (locale === def)
        ? (site.i18n[def] || {})
        : mergeI18n(site.i18n[def] || {}, site.i18n[locale] || {});
    }
    const meta = locales.find(l => l.code === locale);
    // lang/dir drive the document element (dir enables RTL layout for e.g. Arabic).
    document.documentElement.lang = (meta && meta.lang_code) || locale;
    document.documentElement.dir = (meta && meta.dir) || 'ltr';
    if (changed && window.VWA11y) {
      const name = (meta && (meta.name || meta.label)) || locale;
      const tmpl = (store.t && store.t.ui && store.t.ui.language_changed) || 'Language changed to {name}';
      window.VWA11y.announce(tmpl.replace('{name}', name));
    }
  }

  async function loadJSON(path) {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error('Failed to load ' + path);
    return res.json();
  }

  async function loadCore() {
    const empties = { page: {}, categories: [], repos: [] };
    const [site, papers, reposDoc] = await Promise.all([
      loadJSON('data/site.json'),
      loadJSON('data/papers.json'),
      loadJSON('data/repos.json').catch(() => empties),
    ]);
    store.site = site;
    store.papers = papers.papers;
    store.paperById = Object.fromEntries(papers.papers.map(p => [p.id, p]));
    store.reposDoc = reposDoc;
    store.repos = reposDoc.repos || [];
    /* A locale in the entry URL (/es/…) wins over the stored preference, so a
       shared language link always opens in that language (and persists it). */
    const codes = (site.locales || []).map((l) => l.code);
    const initialLoc = (_localeHint && codes.includes(_localeHint)) ? _localeHint : store.locale;
    applyLocale(initialLoc);
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
  window.VWSetLocale = switchLocale;   // nav switcher: change language + rewrite URL to /<locale>/…

  /* ---- Clean-URL router (History API) ----
     Served from GitHub Pages: real routes have a prerendered index.html at the
     clean path; a direct hit there (or 404.html) redirects to /?redirect=<path>
     and the boot script in index.html restores the clean URL before this runs.
     The locale can be carried in the URL as a LEADING prefix (/es/, /es/paper/x
     — permanent, shareable language links) or a TRAILING suffix (/paper/x/fr —
     the crawler hreflang form). Either is detected here, stripped from the route,
     and remembered in `_localeHint` so it can be applied (see applyLocaleHint):
     visiting a locale URL switches the language and persists it. */
  const KNOWN_PAGES = ['index', 'about', 'press', 'resources', 'gallery', 'glossary', 'repos', 'updates', 'community', 'privacy', 'not-found'];
  let _localeHint = null;
  /* A path segment that looks like a locale code (e.g. en, fr, es, pt-br) and is
     not a route word. Validated against the real locale list once site.json is
     loaded; an unknown code harmlessly falls back to the default locale. */
  const looksLikeLocale = (seg) => /^[a-z]{2,3}(-[a-z]{2,4})?$/i.test(seg) && seg !== 'paper' && !KNOWN_PAGES.includes(seg);
  function parsePath() {
    const parts = (location.pathname || '/').split('/').filter(Boolean);
    _localeHint = null;
    if (parts.length && looksLikeLocale(parts[0])) {
      _localeHint = parts.shift().toLowerCase();                 // leading /es/…
    } else if (parts.length > 1 && looksLikeLocale(parts[parts.length - 1])) {
      _localeHint = parts.pop().toLowerCase();                   // trailing …/fr
    }
    if (parts.length === 0) return { page: 'library', paperId: null };
    if (parts[0] === 'paper' && parts[1]) return { page: 'paper', paperId: decodeURIComponent(parts[1]) };
    if (KNOWN_PAGES.includes(parts[0])) return { page: parts[0], paperId: null };
    return { page: 'not-found', paperId: null };
  }
  /* Apply a locale carried in the URL. Only acts on a code the site actually
     declares (so a stray /xx/ path renders in the default locale rather than
     switching to a non-existent language). applyLocale persists it. */
  function applyLocaleHint() {
    if (!_localeHint || !store.site) return;
    const codes = (store.site.locales || []).map((l) => l.code);
    if (codes.includes(_localeHint) && _localeHint !== store.locale) applyLocale(_localeHint);
  }
  function pathFor(target) {
    if (typeof target === 'string') return target === 'library' ? '/' : '/' + target;
    if (target && target.page === 'paper') return '/paper/' + target.id;
    return '/';
  }
  /* Prefix a clean route path with the active locale so the address bar always
     reflects the language: '/paper/x' → '/fr/paper/x', '/' → '/fr/'. Used by
     navigation, the language switcher, and the initial-load normalization, so a
     reader browsing in FR/ES keeps the language in every URL (and it stays
     shareable). */
  function localizedPath(cleanPath) {
    const loc = store.locale || (store.site && store.site.default_locale) || 'en';
    const base = (!cleanPath || cleanPath === '/') ? '/' : cleanPath;
    /* Every locale — including the default — carries a /<locale>/ prefix, so a
       page has ONE canonical URL form per language (/en/paper/x, /es/paper/x)
       and never a prefix-less twin. Bare URLs are normalized to this on load. */
    return '/' + loc + (base === '/' ? '/' : base);
  }
  /* Switch language and rewrite the URL to the current route in that language.
     applyLocale itself never touches the URL (initial load and the URL-hint path
     must not fight the address bar). */
  function switchLocale(code) {
    applyLocale(code);
    const r = parsePath();   // current route, locale segment stripped
    const target = r.page === 'paper' ? { page: 'paper', id: r.paperId } : r.page;
    const prefixed = localizedPath(pathFor(target));   // store.locale is now `code`
    if (location.pathname !== prefixed) history.replaceState(null, '', prefixed);
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
        applyLocaleHint();   // a locale-prefixed URL (/es/…) switches + persists the language
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
        /* Callers pass a clean path (/paper/x, /glossary); carry the active
           locale into the URL so navigation stays in-language and shareable. */
        const p = localizedPath(path);
        if (p !== location.pathname) history.pushState({}, '', p);
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
      function setLocale(code) { switchLocale(code); }   // module fn: change language + rewrite URL

      onMounted(async () => {
        try { await loadCore(); }
        catch (e) { console.error('Failed to load site data:', e); }
        /* Normalize the address bar to the active locale once it's resolved, so a
           reader whose language came from the cookie (landing on a clean URL)
           still sees /<locale>/… — the whole session then stays in-language. */
        const t = route.value.page === 'paper' ? { page: 'paper', id: route.value.paperId } : route.value.page;
        const norm = localizedPath(pathFor(t));
        if (location.pathname !== norm) history.replaceState(null, '', norm);
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
