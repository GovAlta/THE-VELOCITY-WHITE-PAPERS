

(function () {
  const W = window;
  W.VWA11y = W.VWA11y || {};

  W.VWA11y.focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    'audio[controls]',
    'video[controls]',
    'iframe',
    'object',
    'embed',
    '[contenteditable]:not([contenteditable="false"])',
  ].join(',');

  
  W.VWA11y.announce = function (message, priority) {
    const el = document.getElementById('vw-announce');
    if (!el) return;
    el.setAttribute('aria-live', priority === 'assertive' ? 'assertive' : 'polite');
    
    el.textContent = '';
    requestAnimationFrame(() => { el.textContent = String(message || ''); });
  };

  
  W.VWA11y.trapFocus = function (rootEl, returnFocusEl) {
    if (!rootEl) return () => {};
    const previousActive = returnFocusEl || document.activeElement;

    function getFocusables() {
      return Array.from(rootEl.querySelectorAll(W.VWA11y.focusableSelector))
        .filter(el => el.offsetParent !== null || el === document.activeElement);
    }

    function onKeydown(e) {
      if (e.key !== 'Tab') return;
      const list = getFocusables();
      if (list.length === 0) { e.preventDefault(); return; }
      const first = list[0];
      const last  = list[list.length - 1];
      const cur   = document.activeElement;
      if (e.shiftKey) {
        if (cur === first || !rootEl.contains(cur)) { e.preventDefault(); last.focus(); }
      } else {
        if (cur === last  || !rootEl.contains(cur)) { e.preventDefault(); first.focus(); }
      }
    }

    document.addEventListener('keydown', onKeydown, true);

    
    requestAnimationFrame(() => {
      if (!rootEl.contains(document.activeElement)) {
        const list = getFocusables();
        if (list.length) list[0].focus();
      }
    });

    return function release() {
      document.removeEventListener('keydown', onKeydown, true);
      if (previousActive && typeof previousActive.focus === 'function') {
        try { previousActive.focus(); } catch {}
      }
    };
  };

  
  W.VWA11y.onEsc = function (handler) {
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); handler(); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  };
})();

(function () {
  const W = window;

  const SITE_URL_BASE = (function () {
    
    const a = document.createElement('a');
    a.href = '.';
    return a.href.replace(/\/$/, '');
  })();

  function setOrCreate(selector, attrs) {
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement(attrs.tag || 'meta');
      document.head.appendChild(el);
    }
    Object.keys(attrs).forEach(k => {
      if (k === 'tag' || k === 'text') return;
      if (attrs[k] == null) el.removeAttribute(k);
      else el.setAttribute(k, attrs[k]);
    });
    if ('text' in attrs) el.textContent = attrs.text;
    return el;
  }

  function setMeta(name, content) {
    if (content == null) {
      const el = document.head.querySelector('meta[name="' + name + '"]');
      if (el) el.remove();
      return;
    }
    setOrCreate('meta[name="' + name + '"]', { tag: 'meta', name, content });
  }
  function setProperty(prop, content) {
    if (content == null) {
      const el = document.head.querySelector('meta[property="' + prop + '"]');
      if (el) el.remove();
      return;
    }
    setOrCreate('meta[property="' + prop + '"]', { tag: 'meta', property: prop, content });
  }
  function setLink(rel, href, hreflang) {
    const sel = hreflang
      ? 'link[rel="' + rel + '"][hreflang="' + hreflang + '"]'
      : 'link[rel="' + rel + '"]';
    if (href == null) {
      const el = document.head.querySelector(sel);
      if (el) el.remove();
      return;
    }
    const attrs = { tag: 'link', rel, href };
    if (hreflang) attrs.hreflang = hreflang;
    setOrCreate(sel, attrs);
  }

  
  function clearHreflangs() {
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
  }

  
  function setJSONLD(obj) {
    document.head.querySelectorAll('script[type="application/ld+json"][data-vw]').forEach(el => el.remove());
    if (!obj) return;
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.dataset.vw = '1';
    s.textContent = JSON.stringify(obj);
    document.head.appendChild(s);
  }

  function siteDefaults() {
    const store = W.VWStore;
    return {
      title: (store && store.t && store.t.title) || 'The Velocity White Papers',
      description: (store && store.t && store.t.tagline) || '',
      locale: (store && store.locale) || 'en',
      publisher: (store && store.t && store.t.publisher) || 'Government of Alberta',
    };
  }

  const V = W.VWMeta = {};

  
  V.setSitePage = function (pageId, pageTitle, descriptionOverride) {
    const d = siteDefaults();
    const title = pageTitle ? (pageTitle + ' — ' + d.title) : d.title;
    const desc = descriptionOverride || d.description;
    const url  = SITE_URL_BASE + '/#/' + (pageId === 'library' ? '' : pageId);

    document.title = title;
    setMeta('description', desc);
    setProperty('og:title', title);
    setProperty('og:description', desc);
    setProperty('og:type', 'website');
    setProperty('og:url', url);
    setProperty('og:site_name', d.title);
    setProperty('og:locale', d.locale === 'fr' ? 'fr_CA' : 'en_CA');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', desc);

    setLink('canonical', url);
    clearHreflangs();
    setLink('alternate', SITE_URL_BASE + '/?lang=en#/' + (pageId === 'library' ? '' : pageId), 'en');
    setLink('alternate', SITE_URL_BASE + '/?lang=fr#/' + (pageId === 'library' ? '' : pageId), 'fr');
    setLink('alternate', SITE_URL_BASE + '/#/' + (pageId === 'library' ? '' : pageId), 'x-default');

    setJSONLD({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: d.title,
      description: desc,
      url: SITE_URL_BASE + '/',
      publisher: { '@type': 'Organization', name: d.publisher },
      inLanguage: d.locale === 'fr' ? 'fr-CA' : 'en-CA',
    });
  };

  
  V.setPaper = function (paper) {
    if (!paper) return V.clear();
    const d = siteDefaults();
    const url = SITE_URL_BASE + '/#/paper/' + paper.id;
    const title = paper.title + ' — ' + d.title;
    const desc  = paper.abstract || paper.subtitle || '';

    document.title = title;
    setMeta('description', desc);
    setProperty('og:title', paper.title);
    setProperty('og:description', desc);
    setProperty('og:type', 'article');
    setProperty('og:url', url);
    setProperty('og:site_name', d.title);
    setProperty('og:locale', d.locale === 'fr' ? 'fr_CA' : 'en_CA');
    setProperty('article:section', paper.tier || '');
    if (paper.published) setProperty('article:published_time', paper.published);
    (paper.tags || []).forEach((t, i) => {
      setOrCreate('meta[property="article:tag"][data-i="' + i + '"]', {
        tag: 'meta', property: 'article:tag', content: t, 'data-i': String(i),
      });
    });
    if (paper.hero_image && paper.hero_image.src) {
      setProperty('og:image', SITE_URL_BASE + '/' + paper.hero_image.src);
      setProperty('og:image:alt', paper.hero_image.alt || paper.title);
      setMeta('twitter:image', SITE_URL_BASE + '/' + paper.hero_image.src);
    }
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', paper.title);
    setMeta('twitter:description', desc);

    setLink('canonical', url);
    clearHreflangs();
    setLink('alternate', SITE_URL_BASE + '/?lang=en#/paper/' + paper.id, 'en');
    setLink('alternate', SITE_URL_BASE + '/?lang=fr#/paper/' + paper.id, 'fr');
    setLink('alternate', SITE_URL_BASE + '/#/paper/' + paper.id, 'x-default');

    const authors = (paper.authors || []).map(name => ({ '@type': 'Person', name }));
    setJSONLD({
      '@context': 'https://schema.org',
      '@type': paper.category === 'architecture' ? 'TechArticle' : 'ScholarlyArticle',
      headline: paper.title,
      description: desc,
      url,
      inLanguage: d.locale === 'fr' ? 'fr-CA' : 'en-CA',
      author: authors.length ? authors : undefined,
      publisher: { '@type': 'Organization', name: d.publisher },
      datePublished: paper.published || undefined,
      isPartOf: {
        '@type': 'PublicationVolume',
        name: d.title,
        url: SITE_URL_BASE + '/',
      },
      keywords: (paper.tags || []).join(', ') || undefined,
      image: paper.hero_image && paper.hero_image.src
        ? SITE_URL_BASE + '/' + paper.hero_image.src
        : undefined,
      about: paper.tier || undefined,
    });
  };

  V.clear = function () { V.setSitePage('library'); };
})();

(function () {
  const W = window;
  W.VWAnim = W.VWAnim || {};

  
  W.VWAnim.prefersReducedMotion = (typeof matchMedia === 'function')
    ? matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  
  W.VWAnim.spawnPing = function (rootEl, targetEl, color, scale) {
    if (W.VWAnim.prefersReducedMotion) return;
    if (!rootEl || !targetEl) return;
    const r = targetEl.getBoundingClientRect();
    const root = rootEl.getBoundingClientRect();
    const x = r.left - root.left + r.width / 2;
    const y = r.top  - root.top  + r.height / 2;
    const ping = document.createElement('div');
    ping.className = 'vw-ping';
    ping.style.cssText = [
      'position:absolute',
      'left:' + (x - 10) + 'px',
      'top:'  + (y - 10) + 'px',
      'width:20px',
      'height:20px',
      'border:2px solid ' + (color || 'var(--highlight)'),
      'border-radius:50%',
      'pointer-events:none',
      'transform:scale(0.4)',
      'opacity:1',
      'animation:vw-ping ' + (700) + 'ms ease-out forwards',
      '--vw-ping-scale:' + (scale || 4)
    ].join(';');
    rootEl.appendChild(ping);
    setTimeout(() => ping.remove(), 750);
  };

  
  W.VWAnim.flyTicket = function (rootEl, fromEl, toEl, text, color) {
    if (!rootEl || !fromEl || !toEl) return;
    const root = rootEl.getBoundingClientRect();
    const a = fromEl.getBoundingClientRect();
    const b = toEl.getBoundingClientRect();
    const ticket = document.createElement('div');
    ticket.className = 'vw-fly-ticket';
    ticket.textContent = text || '';
    ticket.style.cssText = [
      'position:absolute',
      'left:' + (a.left - root.left + a.width / 2 - 60) + 'px',
      'top:'  + (a.top  - root.top  + a.height / 2 - 12) + 'px',
      'width:120px',
      'padding:6px 8px',
      'font-family:var(--font-mono)',
      'font-size:10px',
      'background:' + (color || 'var(--paper)'),
      'border:1px solid var(--rule-strong)',
      'pointer-events:none',
      'z-index:50',
      'transition:transform 600ms cubic-bezier(.2,.7,.2,1), opacity 600ms ease-out'
    ].join(';');
    rootEl.appendChild(ticket);
    
    requestAnimationFrame(() => {
      const dx = (b.left - root.left + b.width / 2 - 60) - (a.left - root.left + a.width / 2 - 60);
      const dy = (b.top  - root.top  + b.height / 2 - 12) - (a.top - root.top + a.height / 2 - 12);
      ticket.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      ticket.style.opacity = '0.9';
    });
    setTimeout(() => ticket.remove(), 650);
  };

  
  W.VWAnim.heatColor = function (t) {
    t = Math.max(0, Math.min(1, t));
    const stops = [
      [0.00, [26, 20, 16]],
      [0.40, [70, 38, 30]],
      [0.70, [194, 73, 26]],
      [1.00, [255, 195, 80]],
    ];
    for (let i = 0; i < stops.length - 1; i++) {
      const [t0, c0] = stops[i], [t1, c1] = stops[i + 1];
      if (t <= t1) {
        const k = (t - t0) / (t1 - t0);
        const r = Math.round(c0[0] + k * (c1[0] - c0[0]));
        const g = Math.round(c0[1] + k * (c1[1] - c0[1]));
        const b = Math.round(c0[2] + k * (c1[2] - c0[2]));
        return 'rgb(' + r + ',' + g + ',' + b + ')';
      }
    }
    return 'rgb(255,195,80)';
  };

  
  W.VWAnim.afterFontsAndPaint = async function () {
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch {}
    }
    return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  };

  
  W.VWAnim.tween = function (opts) {
    const { from = 0, to = 1, duration = 600, ease = 'easeOutCubic', onUpdate, onComplete } = opts;
    const easings = {
      linear:        t => t,
      easeOutCubic:  t => 1 - Math.pow(1 - t, 3),
      easeInOutCubic:t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2,
    };
    const easeFn = easings[ease] || easings.easeOutCubic;
    if (W.VWAnim.prefersReducedMotion) {
      onUpdate && onUpdate(to);
      onComplete && onComplete();
      return () => {};
    }
    const start = performance.now();
    let cancelled = false;
    function step(now) {
      if (cancelled) return;
      const k = Math.min(1, (now - start) / duration);
      const v = from + (to - from) * easeFn(k);
      onUpdate && onUpdate(v);
      if (k < 1) requestAnimationFrame(step);
      else onComplete && onComplete();
    }
    requestAnimationFrame(step);
    return () => { cancelled = true; };
  };
})();

(function () {
  const W = window;
  W.VWVisuals = W.VWVisuals || { reusable: {}, bespoke: {} };

  
  W.VWVisuals.registerReusable = function (key, componentName) {
    W.VWVisuals.reusable[key] = componentName || key;
  };

  
  W.VWVisuals.registerBespoke = function (ownerId, key, componentName) {
    W.VWVisuals.bespoke[ownerId] = W.VWVisuals.bespoke[ownerId] || {};
    W.VWVisuals.bespoke[ownerId][key] = componentName || (ownerId + '-' + key);
  };

  
  W.VWVisuals.resolve = function (key, ownerId) {
    if (!key) return null;
    if (key.indexOf(':') !== -1) {
      const [owner, name] = key.split(':');
      const m = (W.VWVisuals.bespoke[owner] || {})[name];
      return m || null;
    }
    if (W.VWVisuals.reusable[key]) return W.VWVisuals.reusable[key];
    if (ownerId && W.VWVisuals.bespoke[ownerId] && W.VWVisuals.bespoke[ownerId][key]) {
      return W.VWVisuals.bespoke[ownerId][key];
    }
    return null;
  };

  
  W.VWVisuals.list = function () {
    return {
      reusable: { ...W.VWVisuals.reusable },
      bespoke:  Object.fromEntries(Object.entries(W.VWVisuals.bespoke).map(([k, v]) => [k, { ...v }])),
    };
  };

  
  W.VWVisuals.loadScript = function (src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-vw-visual="' + src + '"]');
      if (existing) { existing.dataset.vwResolved === '1' ? resolve() : existing.addEventListener('load', () => resolve()); return; }
      const s = document.createElement('script');
      s.src = src;
      s.dataset.vwVisual = src;
      s.onload  = () => { s.dataset.vwResolved = '1'; resolve(); };
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  };

  
  W.VWVisuals.loadBespokeFor = async function (paper) {
    const arr = paper && paper.bespoke_scripts;
    if (!Array.isArray(arr) || !arr.length) return;
    for (const src of arr) {
      try { await W.VWVisuals.loadScript(src); }
      catch (e) { console.warn('[visuals] failed to load ' + src + ':', e.message); }
    }
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};
  if (window.VWVisuals) window.VWVisuals.registerReusable('tile-heatmap', 'tile-heatmap');

  function lcg(seed) {
    let s = seed | 0;
    return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  }

  window.VWComponents['tile-heatmap'] = {
    props: {
      slide:  { type: Object, default: () => ({}) },
      config: { type: Object, default: () => ({}) },
    },
    data() { return { revealedTouches: 0 }; },
    computed: {
      rows() { return this.config.rows || 8; },
      cols() { return this.config.cols || 16; },
      labels() { return this.config.labels || []; },
      seed() { return this.config.seed || 42; },
      touches() { return this.config.touches || []; },
      pings() { return this.config.pings || []; },
      baseGrid() {
        const rnd = lcg(this.seed);
        const grid = [];
        for (let r = 0; r < this.rows; r++) {
          const row = [];
          for (let c = 0; c < this.cols; c++) {
            const v = 0.1 + Math.pow(rnd(), 1.6) * 0.55;
            row.push(v);
          }
          grid.push(row);
        }
        return grid;
      },
      heatGrid() {
        const g = this.baseGrid.map(r => r.slice());
        for (let i = 0; i < this.revealedTouches; i++) {
          const t = this.touches[i];
          if (!t) continue;
          if (g[t.row] && g[t.row][t.col] != null) g[t.row][t.col] = 0.95;
        }
        return g;
      },
      ariaLabel() {
        return this.config.aria_label
          || ('Heatmap of activity across ' + this.rows + ' rows by ' + this.cols + ' columns');
      },
      ariaDescription() {
        if (this.config.aria_description) return this.config.aria_description;
        const labelList = this.labels.length ? this.labels.join(', ') : (this.rows + ' rows');
        const touchSummary = this.touches.length
          ? this.touches.length + ' active touches highlighted'
          : 'no active highlights';
        return 'Thermal heatmap. Rows: ' + labelList + '. ' + this.cols + ' columns. ' + touchSummary + '. '
             + (this.config.counter || '');
      },
    },
    mounted() {
      const heat = window.VWAnim;
      if (!heat) return;
      this.heatColor = heat.heatColor;
      const totalDuration = Math.max(800, this.touches.length * 220 + 400);
      heat.afterFontsAndPaint().then(() => {
        heat.tween({
          from: 0, to: this.touches.length, duration: totalDuration, ease: 'easeOutCubic',
          onUpdate: v => { this.revealedTouches = Math.floor(v); },
          onComplete: () => {
            this.revealedTouches = this.touches.length;
            this.firePings();
          }
        });
      });
    },
    methods: {
      cellStyle(v) {
        const color = (window.VWAnim && window.VWAnim.heatColor) ? window.VWAnim.heatColor(v) : 'rgb(40,30,24)';
        return { background: color };
      },
      firePings() {
        const root = this.$refs.root;
        if (!root || !this.pings.length) return;
        for (const p of this.pings) {
          const sel = '[data-r="' + p.row + '"][data-c="' + p.col + '"]';
          const el = root.querySelector(sel);
          if (el && window.VWAnim) window.VWAnim.spawnPing(root, el, 'rgb(110,200,220)', 5);
        }
      },
    },
    template: `
      <figure ref="root" class="vw-heatmap"
              role="img"
              :aria-label="ariaLabel">
        <div class="vw-heatmap-row" v-for="(row, r) in heatGrid" :key="r" aria-hidden="true">
          <div class="vw-heatmap-label" v-if="labels[r]">{{ labels[r] }}</div>
          <div class="vw-heatmap-cells">
            <div v-for="(v, c) in row" :key="c"
                 class="vw-heatmap-cell"
                 :style="cellStyle(v)"
                 :data-r="r" :data-c="c"></div>
          </div>
        </div>
        <div class="vw-heatmap-counter" v-if="config.counter" aria-hidden="true">{{ config.counter }}</div>
        <figcaption class="sr-only">{{ ariaDescription }}</figcaption>
      </figure>
    `,
  };
})();

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
           :aria-label="(store.locale === 'fr' ? 'Accueil — ' : 'Home — ') + store.t.title">
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

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['stat-rail'] = {
    props: { stats: { type: Array, required: true } },
    template: `
      <div class="civic-rail">
        <div class="civic-rail-item" v-for="(s, i) in stats" :key="i">
          <div class="k">{{ s.k }}</div>
          <div class="v">{{ s.v }}</div>
          <div class="sub" v-if="s.sub">{{ s.sub }}</div>
        </div>
      </div>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['paper-card'] = {
    props: { paper: { type: Object, required: true } },
    emits: ['open'],
    computed: {
      statusClass() {
        const s = (this.paper.status || '').toLowerCase();
        if (s === 'published') return '';
        if (s === 'forthcoming') return 'forthcoming';
        if (s === 'draft' || s === 'placeholder') return 'draft';
        return '';
      },
      paperLabel() {
        const parts = [];
        if (this.paper.num) parts.push('Paper ' + this.paper.num);
        if (this.paper.tier) parts.push(this.paper.tier);
        parts.push(this.paper.title || '');
        if (this.paper.status) parts.push(this.paper.status);
        if (this.paper.reading_min) parts.push(this.paper.reading_min + ' minute read');
        return parts.join(', ');
      },
    },
    template: `
      <a :href="'#/paper/' + paper.id"
         class="civic-card"
         :class="{ 'is-architecture': paper.category === 'architecture' }"
         :aria-label="paperLabel"
         @click.prevent="$emit('open', paper.id)">
        <div class="head" aria-hidden="true">
          <span class="num">{{ paper.category === 'architecture' ? paper.num : '№ ' + paper.num }}</span>
          <span>{{ paper.tier }}</span>
        </div>
        <h3>{{ paper.title }}</h3>
        <div class="sub">{{ paper.subtitle }}</div>
        <div class="foot" aria-hidden="true">
          <span class="status" :class="statusClass">{{ paper.status }}</span>
          <span v-if="paper.reading_min">{{ paper.reading_min }} min</span>
          <span v-if="paper.repo">repo ✓</span>
        </div>
      </a>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['library-grid'] = {
    props: { papers: { type: Array, required: true } },
    emits: ['open'],
    template: `
      <div class="civic-grid">
        <paper-card v-for="p in papers" :key="p.id" :paper="p" @open="$emit('open', $event)" />
      </div>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['index-table'] = {
    props: { papers: { type: Array, required: true } },
    emits: ['open'],
    data() {
      return { query: '', tier: 'all' };
    },
    computed: {
      tiers() {
        const set = new Set(this.papers.map(p => p.tier).filter(Boolean));
        return ['all', ...set];
      },
      filtered() {
        const q = this.query.trim().toLowerCase();
        return this.papers.filter(p => {
          if (this.tier !== 'all' && p.tier !== this.tier) return false;
          if (!q) return true;
          const hay = [p.title, p.subtitle, p.abstract, (p.tags || []).join(' '), p.track].join(' ').toLowerCase();
          return hay.includes(q);
        });
      },
    },
    methods: {
      statusClass(p) {
        const s = (p.status || '').toLowerCase();
        if (s === 'published')   return 'status published';
        if (s === 'forthcoming') return 'status forthcoming';
        return 'status draft';
      },
    },
    template: `
      <section class="civic-index">
        <div class="index-head">
          <h1>The Index</h1>
          <div class="count">{{ filtered.length }} / {{ papers.length }} papers</div>
        </div>
        <div class="filters" role="search">
          <div class="search">
            <label for="vw-index-search" class="sr-only">Search papers by title, subtitle, or tag</label>
            <input id="vw-index-search"
                   v-model="query"
                   type="search"
                   placeholder="Search papers by title, subtitle, tag…"
                   :aria-label="'Search ' + papers.length + ' papers'" />
          </div>
          <div class="chips" role="group" aria-label="Filter by tier">
            <button v-for="t in tiers" :key="t"
                    class="chip" :class="{ on: tier === t }"
                    :aria-pressed="tier === t ? 'true' : 'false'"
                    @click="tier = t">{{ t === 'all' ? 'All' : t }}</button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Title</th>
              <th>Tier</th>
              <th>Read</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filtered" :key="p.id" @click="$emit('open', p.id)">
              <td class="num" data-label="No.">№ {{ p.num }}</td>
              <td class="title" data-label="Title">
                <h2 class="index-title">{{ p.title }}</h2>
                <div class="sub">{{ p.subtitle }}</div>
              </td>
              <td class="track" data-label="Tier">{{ p.tier }}</td>
              <td class="read"  data-label="Read">{{ p.reading_min ? p.reading_min + ' min' : '—' }}</td>
              <td :class="statusClass(p)" data-label="Status">{{ p.status }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['paper-detail'] = {
    props: {
      paper:   { type: Object, required: true },   
    },
    emits: ['open', 'back'],
    setup() { return { store: window.VWStore }; },
    data() {
      return {
        active: 0,
        tocOpen: false,
        releaseTocTrap: null,
        releaseTocEsc: null,
        tocTriggerEl: null,
      };
    },
    watch: {
      tocOpen(open) {
        
        if (open && window.matchMedia('(max-width: 900px)').matches) {
          this.$nextTick(() => {
            const drawer = this.$refs.tocDrawer;
            if (!drawer || !window.VWA11y) return;
            this.tocTriggerEl = document.activeElement;
            this.releaseTocTrap = window.VWA11y.trapFocus(drawer, this.tocTriggerEl);
            this.releaseTocEsc  = window.VWA11y.onEsc(() => { this.tocOpen = false; });
          });
        } else {
          if (this.releaseTocTrap) { this.releaseTocTrap(); this.releaseTocTrap = null; }
          if (this.releaseTocEsc)  { this.releaseTocEsc();  this.releaseTocEsc  = null; }
        }
      },
    },
    beforeUnmount() {
      if (this.releaseTocTrap) this.releaseTocTrap();
      if (this.releaseTocEsc)  this.releaseTocEsc();
    },
    computed: {
      translationLabel() {
        const s = this.paper && this.paper.translation_status;
        const labels = (this.store.t.ui && this.store.t.ui.translation_labels) || {};
        return labels[s] || (s || '').toUpperCase();
      },
      translationBody() {
        const s = this.paper && this.paper.translation_status;
        const bodies = (this.store.t.ui && this.store.t.ui.translation_bodies) || {};
        return bodies[s] || '';
      },
    },
    methods: {
      scrollToSection(n) {
        const el = document.getElementById('sec-' + n);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.tocOpen = false;
      },
      pickSection(i, n) {
        this.active = i;
        this.scrollToSection(n);
      },
    },
    template: `
      <article class="civic-detail" :class="{ 'toc-open': tocOpen }"
               :aria-labelledby="'paper-title-' + paper.id">
        <!-- Mobile-only floating Contents button -->
        <button class="toc-fab"
                @click="tocOpen = !tocOpen"
                :aria-expanded="tocOpen ? 'true' : 'false'"
                :aria-controls="'toc-drawer-' + paper.id"
                :aria-label="(tocOpen ? (store.locale === 'fr' ? 'Fermer le sommaire' : 'Close contents') : ((store.t.ui && store.t.ui.contents) || 'Contents'))">
          <span aria-hidden="true">{{ tocOpen ? '×' : '☰' }}</span>
          <span class="sr-only-mobile">{{ (store.t.ui && store.t.ui.contents) || 'Contents' }}</span>
        </button>

        <!-- Backdrop for mobile TOC -->
        <div v-if="tocOpen" class="toc-backdrop" @click="tocOpen = false" aria-hidden="true"></div>

        <nav class="col-toc"
             :id="'toc-drawer-' + paper.id"
             :class="{ open: tocOpen }"
             ref="tocDrawer"
             :aria-label="(store.t.ui && store.t.ui.contents) || 'Contents'">
          <button class="back"
                  @click="$emit('back')"
                  :aria-label="(store.locale === 'fr' ? 'Retour à la bibliothèque' : 'Back to the library')">
            <span aria-hidden="true">←</span>
            <span>{{ (store.t.ui && store.t.ui.back_to_library) || 'Library' }}</span>
          </button>
          <div class="toc-head" id="toc-head" aria-hidden="true">{{ (store.t.ui && store.t.ui.contents) || 'Contents' }}</div>
          <ol class="toc-items" role="list" aria-labelledby="toc-head">
            <li v-for="(s, i) in paper.sections" :key="s.n">
              <button class="toc-item"
                      :class="{ active: active === i }"
                      :aria-current="active === i ? 'true' : null"
                      @click="pickSection(i, s.n)">
                <span class="n" aria-hidden="true">{{ s.n }}</span>
                <span>{{ s.title }}</span>
              </button>
            </li>
          </ol>
        </nav>

        <section class="col-doc">
          <div class="doc-inner">
            <div class="doc-meta">
              <span class="num">№ {{ paper.num }}</span>
              <span>{{ paper.tier }}</span>
              <span>{{ paper.sequence }}</span>
            </div>
            <h1 class="doc-title" :id="'paper-title-' + paper.id">{{ paper.title }}</h1>
            <div class="doc-sub">{{ paper.subtitle }}</div>

            <div class="doc-byline">
              <div class="field">
                <div class="l">Authors</div>
                <div class="v">{{ (paper.authors || []).join(' · ') }}</div>
              </div>
              <div class="field" v-if="paper.published">
                <div class="l">Published</div>
                <div class="v">{{ paper.published }}</div>
              </div>
              <div class="field" v-if="paper.reading_min">
                <div class="l">Reading</div>
                <div class="v">{{ paper.reading_min }} min</div>
              </div>
              <div class="field">
                <div class="l">Status</div>
                <div class="v">{{ paper.status }}</div>
              </div>
              <div class="field" v-if="paper.repo">
                <div class="l">Repository</div>
                <div class="v"><a :href="paper.repo">{{ paper.repo.replace('https://github.com/','') }}</a></div>
              </div>
            </div>

            <div v-if="store.locale === 'fr' && paper.translation_status && paper.translation_status !== 'final'"
                 class="translation-chip">
              <span class="tc-lbl">{{ translationLabel }}</span>
              <span class="tc-body">{{ translationBody }}</span>
            </div>

            <paper-downloads :paper="paper" />

            <div class="abstract">
              <div class="lbl">{{ (store.t.ui && store.t.ui.abstract) || 'Abstract' }}</div>
              <p>{{ paper.abstract }}</p>
            </div>

            <presentation-player v-if="paper.tldr_presentation"
                                 :presentation="paper.tldr_presentation" />

            <audio-player v-if="paper.audio && paper.audio.src"
                          :src="paper.audio.src"
                          :label="(store.t.ui && store.t.ui.narration) || 'Narration'" />

            <div class="body">
              <template v-for="(b, i) in paper.blocks" :key="i">
                <block-renderer :block="b" :paper="paper" @open="$emit('open', $event)" />
              </template>
            </div>
          </div>
        </section>
      </article>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['architecture-diagram'] = {
    props: { arch: { type: Object, required: true } },
    methods: {
      agentsForLayer(layerId) {
        return (this.arch.agents || []).filter(a => a.layer === layerId);
      },
      classFor(a) {
        return 'arch-agent ' + (a.cls || 'autonomous');
      },
    },
    template: `
      <section role="region" aria-labelledby="arch-diagram-title">
        <h2 id="arch-diagram-title" class="sr-only">Seven-layer agentic architecture</h2>
        <ul class="arch-legend" role="list" aria-label="Agent class legend">
          <li class="item"><span class="stripe" aria-hidden="true" style="background:var(--accent)"></span> Autonomous</li>
          <li class="item"><span class="stripe" aria-hidden="true" style="background:var(--ok)"></span> Verifier</li>
          <li class="item"><span class="stripe" aria-hidden="true" style="background:var(--highlight)"></span> Human-gated · Ledger</li>
        </ul>
        <ol class="arch-rows" role="list">
          <li class="arch-row" v-for="(layer, i) in arch.layers" :key="layer.id"
              :aria-label="'Layer ' + (i + 1) + ': ' + layer.label">
            <div class="label-cell">
              <div class="l-num" aria-hidden="true">L{{ String(i + 1).padStart(2, '0') }}</div>
              <h3 class="l-name">{{ layer.label }}</h3>
              <div class="l-sub">{{ layer.sub }}</div>
            </div>
            <ul class="agents-cell" role="list" :aria-label="layer.label + ' agents'">
              <li v-for="a in agentsForLayer(layer.id)" :key="a.id"
                  :class="classFor(a)"
                  :aria-label="a.label + ', ' + (a.cls || 'autonomous') + ', ' + a.throughput">
                <div class="a-name">{{ a.label }}</div>
                <div class="a-throughput" aria-hidden="true">{{ a.throughput }}</div>
              </li>
            </ul>
          </li>
        </ol>
      </section>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['mini-chart'] = {
    props: {
      width:  { type: Number, default: 680 },
      height: { type: Number, default: 200 },
      pad:    { type: Number, default: 28 },
      series: { type: Array, default: () => [] },  
      x_label: { type: String, default: '' },
      y_label: { type: String, default: '' },
    },
    computed: {
      bounds() {
        const all = this.series.flatMap(s => s.points);
        if (!all.length) return null;
        const xs = all.map(p => p.x), ys = all.map(p => p.y);
        return { xmin: Math.min(...xs), xmax: Math.max(...xs), ymin: Math.min(...ys), ymax: Math.max(...ys) };
      },
      paths() {
        const b = this.bounds; if (!b) return [];
        const w = this.width - this.pad * 2, h = this.height - this.pad * 2;
        const xr = b.xmax - b.xmin || 1, yr = b.ymax - b.ymin || 1;
        return this.series.map(s => {
          const d = s.points.map((p, i) => {
            const x = this.pad + ((p.x - b.xmin) / xr) * w;
            const y = this.pad + h - ((p.y - b.ymin) / yr) * h;
            return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
          }).join(' ');
          return { ...s, d };
        });
      },
    },
    template: `
      <svg :viewBox="'0 0 ' + width + ' ' + height" :width="width" :height="height" role="img">
        <g>
          <path v-for="s in paths" :key="s.label"
                :d="s.d"
                :stroke="s.color"
                :stroke-dasharray="s.dashed ? '4,4' : '0'"
                stroke-width="2" fill="none" />
          <text :x="pad" :y="height - 6"
                font-family="var(--font-mono)" font-size="10" fill="var(--ink-50)">
            {{ x_label }}
          </text>
          <text :x="4" :y="pad - 4"
                font-family="var(--font-mono)" font-size="10" fill="var(--ink-50)">
            {{ y_label }}
          </text>
        </g>
        <g :transform="'translate(' + (width - 160) + ',' + (pad - 8) + ')'">
          <g v-for="(s, i) in series" :key="s.label"
             :transform="'translate(0,' + (i * 16) + ')'">
            <line x1="0" y1="6" x2="24" y2="6" :stroke="s.color"
                  :stroke-dasharray="s.dashed ? '4,4' : '0'" stroke-width="2" />
            <text x="30" y="10" font-family="var(--font-mono)" font-size="10" fill="var(--ink-70)">
              {{ s.label }}
            </text>
          </g>
        </g>
      </svg>
    `,
  };

  
  window.VWComponents['drivers-map'] = {
    props: { kind: { type: String, default: 'drivers-map' } },
    template: `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:8px 0 4px;">
        <div style="border:1px solid var(--rule);padding:14px 16px;background:var(--paper);">
          <div style="font-family:var(--font-mono);font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:var(--accent);margin-bottom:6px;">Woven throughout</div>
          <div style="font-weight:600;font-size:15px;">Cost</div>
          <div style="font-weight:600;font-size:15px;margin-top:4px;">Service delivery</div>
        </div>
        <div style="border:1px solid var(--rule);padding:14px 16px;background:var(--paper);">
          <div style="font-family:var(--font-mono);font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:var(--highlight);margin-bottom:6px;">Dedicated paper</div>
          <div style="font-weight:600;font-size:15px;">Cybersecurity · Paper 2</div>
          <div style="font-weight:600;font-size:15px;margin-top:4px;">Red tape reduction · Paper 3</div>
        </div>
      </div>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['pull-quote'] = {
    props: {
      text: { type: String, required: true },
      cite: { type: String, default: '' },
    },
    template: `
      <blockquote class="pullquote">
        {{ text }}
        <div class="cite" v-if="cite">— {{ cite }}</div>
      </blockquote>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['key-stat'] = {
    props: {
      label: { type: String, default: '' },
      value: { type: String, required: true },
      body:  { type: String, default: '' },
    },
    template: `
      <div class="cd-keystat">
        <div>
          <span class="lbl" v-if="label">{{ label }}</span>
          <div class="big">{{ value }}</div>
        </div>
        <div class="body-txt" v-if="body" v-html="body"></div>
      </div>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['paper-figure'] = {
    props: {
      fno:     { type: String, default: 'FIG.' },
      title:   { type: String, default: '' },
      caption: { type: String, default: '' },
      chart:   { type: Object, default: null },
      image:   { type: Object, default: null },
    },
    computed: {
      chartComponent() {
        if (!this.chart) return null;
        const map = {
          'mini-chart':   'mini-chart',
          'drivers-map':  'drivers-map',
        };
        return map[this.chart.kind] || null;
      },
    },
    template: `
      <figure class="cd-figure">
        <div class="fno">{{ fno }}</div>
        <div class="ftitle" v-if="title">{{ title }}</div>
        <component v-if="chartComponent" :is="chartComponent" v-bind="chart" />
        <image-inspector v-else-if="image" :src="image.src" :alt="image.alt || ''" />
        <div class="fcaption" v-if="caption">{{ caption }}</div>
      </figure>
    `,
  };
})();

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

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['related-papers'] = {
    props: {
      ids: { type: Array, default: () => [] },
    },
    emits: ['open'],
    setup() {
      return { store: window.VWStore };
    },
    computed: {
      papers() {
        return (this.ids || [])
          .map(id => this.store.paperById[id])
          .filter(Boolean);
      },
    },
    methods: {},
    template: `
      <section class="cd-related" v-if="papers.length"
               :aria-label="store.locale === 'fr' ? 'À lire ensuite' : 'Read next'">
        <div class="lbl" aria-hidden="true">{{ store.locale === 'fr' ? 'À lire ensuite' : 'Read next' }}</div>
        <div class="grid">
          <a v-for="p in papers" :key="p.id"
             :href="'#/paper/' + p.id"
             class="tile"
             :aria-label="(store.locale === 'fr' ? 'Livre ' : 'Paper ') + p.num + ' — ' + p.title + ', ' + p.tier"
             @click.prevent="$emit('open', p.id)">
            <div class="ref" aria-hidden="true">№ {{ p.num }} · {{ p.tier }}</div>
            <h4>{{ p.title }}</h4>
          </a>
        </div>
      </section>
    `,
  };
})();

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

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['audio-player'] = {
    props: {
      src:   { type: String, required: true },
      label: { type: String, default: 'Listen' },
    },
    data() { return { available: false }; },
    async mounted() {
      try {
        const res = await fetch(this.src, { method: 'HEAD' });
        this.available = res.ok;
      } catch { this.available = false; }
    },
    template: `
      <div class="audio-block" v-if="available">
        <span class="lbl">{{ label }}</span>
        <audio :src="src" controls preload="metadata"></audio>
      </div>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['image-inspector'] = {
    props: {
      src:   { type: String, required: true },
      alt:   { type: String, default: '' },
    },
    data() {
      return {
        meta: null, open: false, loading: false,
        uid: 'ii-' + Math.random().toString(36).slice(2, 9),
        releaseTrap: null,
        releaseEsc: null,
        triggerEl: null,
      };
    },
    watch: {
      open(val) {
        if (val) {
          this.$nextTick(() => {
            const panel = this.$refs.panel;
            if (panel && window.VWA11y) {
              this.releaseTrap = window.VWA11y.trapFocus(panel, this.triggerEl);
              this.releaseEsc  = window.VWA11y.onEsc(() => { this.open = false; });
            }
          });
        } else {
          if (this.releaseTrap) { this.releaseTrap(); this.releaseTrap = null; }
          if (this.releaseEsc)  { this.releaseEsc();  this.releaseEsc  = null; }
        }
      },
    },
    beforeUnmount() {
      if (this.releaseTrap) this.releaseTrap();
      if (this.releaseEsc)  this.releaseEsc();
    },
    methods: {
      metaPath() { return this.src.replace(/\.jpg$/i, '.meta.json'); },
      async toggle(e) {
        if (e && e.currentTarget) this.triggerEl = e.currentTarget;
        this.open = !this.open;
        if (this.open && !this.meta && !this.loading) {
          this.loading = true;
          try {
            const res = await fetch(this.metaPath(), { cache: 'no-cache' });
            if (res.ok) this.meta = await res.json();
          } catch {  }
          this.loading = false;
        }
      },
    },
    template: `
      <div class="img-inspector">
        <img :src="src" :alt="alt" />
        <button class="img-inspector-btn"
                @click="toggle"
                :aria-expanded="open ? 'true' : 'false'"
                :aria-controls="'ii-panel-' + uid"
                aria-label="Show image metadata and AI prompt"
                title="Image metadata">
          <span aria-hidden="true">i</span>
        </button>
        <div v-if="open"
             :id="'ii-panel-' + uid"
             class="img-inspector-panel"
             role="dialog"
             aria-modal="false"
             aria-label="Image metadata"
             ref="panel">
          <div class="ii-head">
            <span>Image metadata</span>
            <button class="ii-close" @click="open = false" aria-label="Close metadata panel">
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div v-if="loading" class="ii-loading">Loading…</div>
          <div v-else-if="!meta" class="ii-missing">
            No metadata sidecar at <code>{{ metaPath() }}</code>. Run
            <code>npm run generate:images</code> with the latest script to produce one.
          </div>
          <div v-else class="ii-body">
            <div class="ii-row"><span class="ii-l">Paper</span><span class="ii-v">{{ meta.paper_id }}</span></div>
            <div class="ii-row"><span class="ii-l">Locale</span><span class="ii-v">{{ meta.locale }}</span></div>
            <div class="ii-row"><span class="ii-l">Slot</span><span class="ii-v">{{ meta.slot }}</span></div>
            <div class="ii-row"><span class="ii-l">Model</span><span class="ii-v">{{ meta.model }}</span></div>
            <div class="ii-row"><span class="ii-l">Style kind</span><span class="ii-v">{{ meta.style_kind }}</span></div>
            <div class="ii-row" v-if="meta.conditioned_on">
              <span class="ii-l">Conditioned on</span>
              <span class="ii-v"><code>{{ meta.conditioned_on }}</code></span>
            </div>
            <div class="ii-row"><span class="ii-l">Generated</span><span class="ii-v">{{ meta.generated_at }}</span></div>
            <div class="ii-row"><span class="ii-l">JPG</span><span class="ii-v">{{ Math.round(meta.bytes_jpg/1024) }} KB · q{{ meta.jpg_quality }} · w{{ meta.jpg_max_width }}</span></div>
            <div class="ii-field">
              <div class="ii-l">Style prompt</div>
              <div class="ii-v ii-prompt">{{ meta.style_prompt }}</div>
            </div>
            <div class="ii-field">
              <div class="ii-l">Image prompt</div>
              <div class="ii-v ii-prompt">{{ meta.image_prompt }}</div>
            </div>
            <div class="ii-foot">
              <a :href="metaPath()" target="_blank">Open raw .meta.json</a>
            </div>
          </div>
        </div>
      </div>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['presentation-stage'] = {
    props: {
      slide:   { type: Object, required: true },
      compact: { type: Boolean, default: false },
      ownerId: { type: String, default: null },
    },
    computed: {
      cfg() { return this.slide.visual_config || {}; },
      registeredVisual() {
        if (!window.VWVisuals) return null;
        return window.VWVisuals.resolve(this.slide.visual, this.ownerId);
      },
    },
    template: `
      <div class="vp-slide" :class="['v-' + (slide.visual || 'title'), compact ? 'is-compact' : '']">

        <div v-if="slide.visual === 'title'" class="vs-title">
          <div class="vs-eyebrow" v-if="slide.caption">{{ slide.caption }}</div>
          <h3>{{ slide.title }}</h3>
          <p class="vs-sub" v-if="slide.subcaption">{{ slide.subcaption }}</p>
        </div>

        <div v-else-if="slide.visual === 'image'" class="vs-image">
          <image-inspector v-if="slide.image && slide.image.src"
                           :src="slide.image.src"
                           :alt="slide.image.alt || slide.title" />
          <div class="vs-caption" v-if="slide.caption">{{ slide.caption }}</div>
        </div>

        <div v-else-if="slide.visual === 'stat'" class="vs-stat">
          <div class="vs-eyebrow" v-if="slide.caption">{{ slide.caption }}</div>
          <div class="vs-stat-value">{{ cfg.stat_value }}</div>
          <div class="vs-stat-label" v-if="cfg.stat_label">{{ cfg.stat_label }}</div>
          <p class="vs-stat-body" v-if="slide.subcaption">{{ slide.subcaption }}</p>
        </div>

        <div v-else-if="slide.visual === 'list'" class="vs-list">
          <div class="vs-eyebrow" v-if="slide.caption">{{ slide.caption }}</div>
          <h3 v-if="slide.title">{{ slide.title }}</h3>
          <ul>
            <li v-for="(it, i) in (cfg.items || [])" :key="i">
              <span class="vl-label">{{ it.label }}</span>
              <span v-if="it.desc" class="vl-desc">{{ it.desc }}</span>
            </li>
          </ul>
        </div>

        <div v-else-if="slide.visual === 'quote'" class="vs-quote">
          <blockquote>{{ cfg.text || slide.subcaption }}</blockquote>
          <div class="vs-cite" v-if="cfg.cite">— {{ cfg.cite }}</div>
        </div>

        <div v-else-if="slide.visual === 'compare'" class="vs-compare">
          <div class="vs-eyebrow" v-if="slide.caption">{{ slide.caption }}</div>
          <h3 v-if="slide.title">{{ slide.title }}</h3>
          <div class="vs-compare-grid">
            <div class="vs-compare-col">
              <div class="vs-c-lbl">{{ cfg.left && cfg.left.label }}</div>
              <div class="vs-c-body">{{ cfg.left && cfg.left.body }}</div>
            </div>
            <div class="vs-compare-col">
              <div class="vs-c-lbl">{{ cfg.right && cfg.right.label }}</div>
              <div class="vs-c-body">{{ cfg.right && cfg.right.body }}</div>
            </div>
          </div>
        </div>

        <div v-else-if="slide.visual === 'chart'" class="vs-chart">
          <div class="vs-eyebrow" v-if="slide.caption">{{ slide.caption }}</div>
          <h3 v-if="slide.title">{{ slide.title }}</h3>
          <component v-if="cfg.kind" :is="cfg.kind" v-bind="cfg" />
        </div>

        <div v-else-if="slide.visual === 'custom' && slide.html" class="vs-custom" v-html="slide.html"></div>

        <component v-else-if="registeredVisual"
                   :is="registeredVisual"
                   :slide="slide"
                   :config="cfg" />

        <div v-else class="vs-fallback">
          <div class="vs-eyebrow">Slide</div>
          <h3>{{ slide.title }}</h3>
          <p v-if="slide.subcaption">{{ slide.subcaption }}</p>
        </div>
      </div>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  function fmtTime(s) {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ':' + String(r).padStart(2, '0');
  }

  window.VWComponents['presentation-player'] = {
    props: {
      presentation:     { type: Object, required: true },
      compact:          { type: Boolean, default: false },
      autoAdvance:      { type: Boolean, default: true },
      showToc:          { type: Boolean, default: true },
      showOverallBar:   { type: Boolean, default: true },
      showTextPanel:    { type: Boolean, default: true },
    },
    data() {
      return {
        index: 0,
        playing: false,
        currentTime: 0,
        duration: 0,
        autoOn: this.autoAdvance,
        error: null,
        tocOpen: false,
        audio: null,
        imageErrored: false,
        mediaReady: {},   
        uid: 'vp-' + Math.random().toString(36).slice(2, 9),
        releaseTocTrap: null,
        releaseTocEsc: null,
        tocTriggerEl: null,
      };
    },
    setup() { return { store: window.VWStore }; },
    computed: {
      slides() { return (this.presentation && this.presentation.slides) || []; },
      total()  { return this.slides.length; },
      slide()  { return this.slides[this.index] || null; },
      progressPercent() {
        if (!this.duration) return 0;
        return Math.min(100, (this.currentTime / this.duration) * 100);
      },
      overallPercent() {
        if (!this.total) return 0;
        const base = (this.index / this.total) * 100;
        const slice = this.duration ? (this.currentTime / this.duration) * (100 / this.total) : 0;
        return Math.min(100, base + slice);
      },
      currentTimeLabel() { return fmtTime(this.currentTime); },
      durationLabel()    { return fmtTime(this.duration); },
      slideNumber()      { return String(this.index + 1).padStart(2, '0'); },
      totalLabel()       { return String(this.total).padStart(2, '0'); },
      t() { return (this.store && this.store.t && this.store.t.ui) || {}; },
      regenHint() {
        const id = this.presentation && (this.presentation.owner_id || this.presentation.id) || 'wp-XX';
        return 'npm run generate:audio -- ' + id + ' --locale ' + (this.presentation.locale || 'en');
      },
    },
    watch: {
      
      'presentation.id'() {
        this.index = 0;
        this.imageErrored = false;
        this.error = null;
        this.currentTime = 0;
        this.duration = 0;
        this.$nextTick(() => this.loadCurrent(false));
      },
      
      index(newIdx) {
        if (window.VWA11y && this.slide) {
          const tpl = (this.t.aria_slide_announcement || 'Slide {n} of {total}, {title}');
          const msg = tpl
            .replace('{n}', newIdx + 1)
            .replace('{total}', this.total)
            .replace('{title}', this.slide.title || '');
          window.VWA11y.announce(msg);
        }
      },
      
      tocOpen(open) {
        if (open) {
          this.$nextTick(() => {
            const panel = this.$refs.tocPanel;
            if (!panel || !window.VWA11y) return;
            this.tocTriggerEl = document.activeElement;
            this.releaseTocTrap = window.VWA11y.trapFocus(panel, this.tocTriggerEl);
            this.releaseTocEsc  = window.VWA11y.onEsc(() => { this.tocOpen = false; });
          });
        } else {
          if (this.releaseTocTrap) { this.releaseTocTrap(); this.releaseTocTrap = null; }
          if (this.releaseTocEsc)  { this.releaseTocEsc();  this.releaseTocEsc  = null; }
        }
      },
      playing(now) {
        if (window.VWA11y && this.slide) {
          const lbl = now
            ? (this.t.aria_playing_announcement || 'Playing')
            : (this.t.aria_paused_announcement  || 'Paused');
          window.VWA11y.announce(lbl + ': ' + (this.slide.title || ''));
        }
      },
    },
    mounted() {
      const a = new Audio();
      a.preload = 'auto';
      a.addEventListener('timeupdate',     () => { this.currentTime = a.currentTime || 0; });
      a.addEventListener('loadedmetadata', () => { this.duration = a.duration || 0; });
      a.addEventListener('ended',          () => {
        if (this.autoOn && this.index < this.total - 1) {
          this.index += 1;
          this.$nextTick(() => this.loadCurrent(true));
        } else { this.playing = false; }
      });
      a.addEventListener('error', () => {
        this.error = (this.t.audio_missing || 'Audio not generated yet.') + ' ' + this.regenHint;
        this.playing = false;
      });
      this.audio = a;
      this.loadCurrent(false);
      this.probeMedia();
      window.addEventListener('keydown', this.onKeydown);
    },
    beforeUnmount() {
      window.removeEventListener('keydown', this.onKeydown);
      if (this.releaseTocTrap) this.releaseTocTrap();
      if (this.releaseTocEsc)  this.releaseTocEsc();
      if (this.audio) {
        this.audio.pause();
        this.audio.src = '';
        this.audio = null;
      }
    },
    methods: {
      loadCurrent(autoplay) {
        if (!this.audio || !this.slide) return;
        const src = this.slide.audio_file;
        this.error = null;
        this.currentTime = 0;
        this.duration = 0;
        if (!src) {
          this.audio.removeAttribute('src');
          this.playing = false;
          return;
        }
        this.audio.src = src;
        if (autoplay) {
          const p = this.audio.play();
          if (p && p.then) {
            p.then(() => { this.playing = true; })
             .catch(() => { this.playing = false; });
          }
        }
      },
      play() {
        if (!this.audio) return;
        if (!this.audio.src && this.slide && this.slide.audio_file) {
          this.audio.src = this.slide.audio_file;
        }
        if (!this.audio.src) return;
        const p = this.audio.play();
        if (p && p.then) {
          p.then(() => { this.playing = true; })
           .catch(() => { this.playing = false; });
        }
      },
      pause() {
        if (this.audio) this.audio.pause();
        this.playing = false;
      },
      togglePlay() { this.playing ? this.pause() : this.play(); },
      next() {
        if (this.index < this.total - 1) {
          this.index += 1;
          this.imageErrored = false;
          this.$nextTick(() => this.loadCurrent(this.playing));
        }
      },
      prev() {
        if (this.index > 0) {
          this.index -= 1;
          this.imageErrored = false;
          this.$nextTick(() => this.loadCurrent(this.playing));
        }
      },
      goTo(i) {
        if (i < 0 || i >= this.total) return;
        this.index = i;
        this.tocOpen = false;
        this.imageErrored = false;
        this.$nextTick(() => this.loadCurrent(this.playing));
      },
      restart() {
        this.index = 0;
        this.imageErrored = false;
        this.$nextTick(() => this.loadCurrent(true));
      },
      seek(e) {
        if (!this.duration || !this.audio) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        this.audio.currentTime = pct * this.duration;
      },
      
      seekRelative(deltaSeconds) {
        if (!this.audio || !this.duration) return;
        this.audio.currentTime = Math.max(0, Math.min(this.duration, this.audio.currentTime + deltaSeconds));
      },
      seekTo(absoluteSeconds) {
        if (!this.audio || !this.duration) return;
        this.audio.currentTime = Math.max(0, Math.min(this.duration, absoluteSeconds));
      },
      
      onStageClick(e) {
        const tag = (e.target && e.target.tagName) || '';
        if (['BUTTON', 'A', 'INPUT', 'LABEL'].includes(tag)) return;
        this.togglePlay();
      },
      
      async probeMedia() {
        const ready = {};
        await Promise.all(this.slides.map(async s => {
          if (!s.audio_file) return;
          try {
            const res = await fetch(s.audio_file, { method: 'HEAD' });
            if (res.ok) ready[s.id] = true;
          } catch {  }
        }));
        this.mediaReady = ready;
      },
      hasMedia(s) { return !!this.mediaReady[s.id]; },

      onKeydown(e) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (e.code === 'Space')      { e.preventDefault(); this.togglePlay(); }
        else if (e.code === 'ArrowRight') this.next();
        else if (e.code === 'ArrowLeft')  this.prev();
      },
      fmtTime,
    },
    template: `
      <section class="vp"
               :class="{ compact: compact, 'no-text-panel': !showTextPanel }"
               v-if="presentation && total > 0"
               role="region"
               :aria-roledescription="t.aria_role_player || 'presentation player'"
               :aria-label="presentation.title">
        <header class="vp-head" v-if="!compact">
          <div class="vp-title">
            <div class="vp-eyebrow">{{ t.tldr || 'TL;DR' }} · {{ presentation.title }}</div>
            <!-- Decorative repeat of the slide title; the real heading is the
                 h2 inside .vp-text-panel. Avoids a heading-order violation
                 (h3 here followed by h2 below would jump back up). -->
            <div class="vp-current-slide" v-if="slide" aria-hidden="true">{{ slide.title }}</div>
            <div class="vp-progress-text" aria-hidden="true">{{ slideNumber }} / {{ totalLabel }}</div>
          </div>
          <button v-if="showToc"
                  class="vp-toc-toggle"
                  :aria-expanded="tocOpen ? 'true' : 'false'"
                  :aria-controls="uid + '-toc'"
                  @click="tocOpen = !tocOpen">
            <span>{{ tocOpen ? (t.close || 'Close') : (t.all_slides || 'All slides') }}</span>
          </button>
        </header>

        <div class="vp-overall"
             v-if="showOverallBar"
             role="progressbar"
             :aria-label="t.aria_overall || 'Overall progress through this presentation'"
             :aria-valuenow="Math.round(overallPercent)"
             aria-valuemin="0"
             aria-valuemax="100">
          <div class="vp-overall-fill" :style="{ width: overallPercent + '%' }"></div>
        </div>

        <div class="vp-body two-panel" :class="{ 'text-panel': showTextPanel && !compact }">

          <!-- VISUAL STAGE — keyboard-accessible play/pause surface -->
          <div class="vp-stage-wrap"
               role="button"
               tabindex="0"
               :aria-label="(playing ? (t.aria_pause_stage || 'Pause narration') : (t.aria_play_stage || 'Play narration')) + ': ' + (slide ? slide.title : '')"
               :aria-pressed="playing ? 'true' : 'false'"
               @click="onStageClick"
               @keydown.enter.prevent="togglePlay"
               @keydown.space.prevent="togglePlay">
            <div class="vp-slide-index" v-if="slide" aria-hidden="true">
              {{ (t.slide || 'Slide') }} {{ slide.id }} / {{ totalLabel }}
            </div>

            <!-- Pre-loaded image layer for cross-dissolve transitions -->
            <template v-for="(s, i) in slides" :key="'img-' + s.id">
              <img v-if="s.visual === 'image' && s.image && s.image.src"
                   :src="s.image.src"
                   :alt="i === index ? (s.image.alt || s.title) : ''"
                   :aria-hidden="i === index ? null : 'true'"
                   class="vp-stage-img"
                   :class="{ 'is-active': i === index }"
                   draggable="false" />
            </template>

            <transition name="vp-fade" mode="out-in">
              <div class="vp-stage"
                   v-if="slide && slide.visual !== 'image'"
                   :key="slide && slide.id">
                <presentation-stage :slide="slide"
                                    :compact="compact"
                                    :owner-id="presentation && presentation.owner_id" />
              </div>
            </transition>

            <!-- Big play overlay (purely decorative; the button label is on .vp-stage-wrap) -->
            <div v-if="!playing && !error" class="vp-overlay" aria-hidden="true">
              <div class="vp-overlay-btn">▶</div>
            </div>

            <div v-if="error" class="vp-error-panel" role="alert">
              <div class="vp-error-l">{{ t.audio_missing_label || 'Audio not generated' }}</div>
              <div class="vp-error-body">{{ t.audio_missing_body || 'Run the generator to produce this narration MP3.' }}</div>
              <pre class="vp-error-cmd">{{ regenHint }}</pre>
            </div>
          </div>

          <!-- TEXT PANEL — narration text, also acts as a transcript for AT -->
          <aside v-if="showTextPanel && !compact && slide"
                 class="vp-text-panel"
                 :aria-label="t.aria_text_panel || 'Slide text and narration'">
            <transition name="vp-fade" mode="out-in">
              <div class="vp-text-inner" :key="slide.id">
                <div class="vp-text-caption" v-if="slide.caption">{{ slide.caption }}</div>
                <h2 class="vp-text-title">{{ slide.title }}</h2>
                <p class="vp-text-sub" v-if="slide.subcaption">{{ slide.subcaption }}</p>
                <p class="vp-text-body" v-if="slide.text">{{ slide.text }}</p>
              </div>
            </transition>
          </aside>
        </div>

        <!-- Player bar -->
        <div class="vp-controls" role="group" :aria-label="t.aria_controls || 'Playback controls'">
          <button class="vp-btn"
                  @click="prev"
                  :disabled="index === 0"
                  :aria-label="t.aria_prev || 'Previous slide'">
            <span aria-hidden="true">←</span> {{ t.prev || 'Prev' }}
          </button>
          <button class="vp-btn vp-play"
                  @click="togglePlay"
                  :aria-pressed="playing ? 'true' : 'false'"
                  :aria-label="playing ? (t.aria_pause || 'Pause narration') : (t.aria_play || 'Play narration')">
            <span v-if="playing"><span aria-hidden="true">❚❚</span> {{ t.pause || 'Pause' }}</span>
            <span v-else><span aria-hidden="true">▶</span> {{ t.play || 'Play' }}</span>
          </button>
          <button class="vp-btn"
                  @click="next"
                  :disabled="index >= total - 1"
                  :aria-label="t.aria_next || 'Next slide'">
            {{ t.next || 'Next' }} <span aria-hidden="true">→</span>
          </button>
          <button class="vp-btn"
                  @click="restart"
                  :aria-label="t.aria_restart || 'Restart from the first slide'">
            <span aria-hidden="true">↻</span>
            <span class="sr-only">{{ t.restart || 'Restart' }}</span>
          </button>

          <div class="vp-scrub">
            <span class="vp-time" aria-hidden="true">{{ currentTimeLabel }} / {{ durationLabel }}</span>
            <div class="vp-track"
                 role="slider"
                 tabindex="0"
                 :aria-label="t.aria_scrubber || 'Seek within current slide'"
                 :aria-valuemin="0"
                 :aria-valuemax="Math.round(duration) || 0"
                 :aria-valuenow="Math.round(currentTime) || 0"
                 :aria-valuetext="currentTimeLabel + ' of ' + durationLabel"
                 @click="seek"
                 @keydown.left.prevent="seekRelative(-5)"
                 @keydown.right.prevent="seekRelative(5)"
                 @keydown.home.prevent="seekTo(0)"
                 @keydown.end.prevent="seekTo(duration)">
              <div class="vp-fill" :style="{ width: progressPercent + '%' }"></div>
            </div>
          </div>

          <label class="vp-auto">
            <input type="checkbox" v-model="autoOn"
                   :aria-label="(t.auto_advance || 'auto-advance') + ' between slides'" />
            <span aria-hidden="true">{{ t.auto_advance || 'auto-advance' }}</span>
          </label>
        </div>

        <p class="vp-hint" v-if="!compact" aria-hidden="true">
          {{ t.kbd_hint || 'Space = play/pause · ← / → = prev / next · click the slide to toggle' }}
        </p>

        <!-- TOC overlay -->
        <transition name="vp-fade">
          <div v-if="tocOpen"
               :id="uid + '-toc'"
               class="vp-toc-overlay"
               role="dialog"
               aria-modal="true"
               :aria-label="t.contents || 'All slides'"
               ref="tocPanel"
               @click.self="tocOpen = false">
            <div class="vp-toc-panel">
              <div class="vp-toc-head">
                <span id="vp-toc-heading">{{ t.contents || 'All slides' }}</span>
                <button class="vp-toc-close"
                        @click="tocOpen = false"
                        :aria-label="t.close || 'Close'">
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <button v-for="(s, i) in slides" :key="s.id"
                      class="vp-toc-item"
                      :class="{ on: i === index, done: i < index, ready: hasMedia(s) }"
                      :aria-current="i === index ? 'true' : null"
                      :aria-label="(t.slide || 'Slide') + ' ' + s.id + ', ' + s.title + (hasMedia(s) ? ', ' + (t.audio_ready_aria || 'audio ready') : '')"
                      @click="goTo(i)">
                <span class="n" aria-hidden="true">{{ s.id }}</span>
                <span class="t">{{ s.title }}</span>
                <span v-if="hasMedia(s)" class="vp-toc-dot" aria-hidden="true"></span>
              </button>
            </div>
          </div>
        </transition>
      </section>

      <div v-else class="vp-empty">No slides in this presentation.</div>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['block-renderer'] = {
    props: {
      block: { type: Object, required: true },
      paper: { type: Object, required: true },
    },
    emits: ['open'],
    computed: {
      resolvedPresentation() {
        if (this.block.type !== 'presentation') return null;
        const ref = this.block.presentation_ref;
        const list = this.paper.embedded_presentations || [];
        return list.find(p => p.id === ref) || null;
      },
    },
    template: `
      <template v-if="block.type === 'section_heading'">
        <h2 :id="'sec-' + block.n" class="body-section-heading">
          <span class="n" aria-hidden="true">§{{ block.n }}</span>
          {{ block.title }}
        </h2>
      </template>

      <template v-else-if="block.type === 'paragraph'">
        <p v-html="block.text"></p>
      </template>

      <template v-else-if="block.type === 'dropcap_paragraph'">
        <p><span class="dropcap">{{ block.letter }}</span><span v-html="block.text"></span></p>
      </template>

      <pull-quote v-else-if="block.type === 'pullquote'"
                  :text="block.text" :cite="block.cite || ''" />

      <key-stat v-else-if="block.type === 'keystat'"
                :label="block.label || ''"
                :value="block.value"
                :body="block.body || ''" />

      <paper-figure v-else-if="block.type === 'figure'"
                    :fno="block.fno || 'FIG.'"
                    :title="block.title || ''"
                    :caption="block.caption || ''"
                    :chart="block.chart || null"
                    :image="block.image || null" />

      <side-note v-else-if="block.type === 'sidenote'"
                 :label="block.label || 'Note'"
                 :value="block.value" />

      <tag-row v-else-if="block.type === 'tag_row'"
               :label="block.label || 'Tags'"
               :tags="block.tags || []" />

      <related-papers v-else-if="block.type === 'related'"
                      :ids="paper.related || []"
                      @open="$emit('open', $event)" />

      <audio-player v-else-if="block.type === 'audio'"
                    :src="block.src"
                    :label="block.label || 'Listen'" />

      <presentation-player v-else-if="block.type === 'presentation' && resolvedPresentation"
                           :presentation="resolvedPresentation"
                           :compact="block.compact === true" />

      <pre v-else style="font-family:var(--font-mono);font-size:11px;color:var(--ink-50);">
{{ 'Unknown block: ' + block.type }}
      </pre>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  function blocksToMarkdown(paper) {
    const lines = [];
    lines.push('# ' + (paper.title || ''));
    if (paper.subtitle) lines.push('\n_' + paper.subtitle + '_\n');
    if (paper.authors && paper.authors.length) lines.push('\n**Authors:** ' + paper.authors.join(', '));
    if (paper.published) lines.push('\n**Published:** ' + paper.published);
    if (paper.tier)      lines.push('\n**Tier:** ' + paper.tier);
    if (paper.status)    lines.push('\n**Status:** ' + paper.status);
    if (paper.repo)      lines.push('\n**Repository:** ' + paper.repo);
    if (paper.abstract) {
      lines.push('\n## Abstract\n');
      lines.push(paper.abstract);
    }
    for (const b of (paper.blocks || [])) {
      if (b.type === 'section_heading') lines.push('\n## §' + (b.n || '') + ' ' + (b.title || ''));
      else if (b.type === 'paragraph' || b.type === 'dropcap_paragraph') {
        lines.push('\n' + String(b.text || '').replace(/<[^>]+>/g, ''));
      }
      else if (b.type === 'pullquote') lines.push('\n> ' + (b.text || '') + (b.cite ? '  \n> — ' + b.cite : ''));
      else if (b.type === 'keystat') {
        lines.push('\n**' + (b.label || 'Key statistic') + ': ' + b.value + '**  ');
        if (b.body) lines.push((b.body || '').replace(/<[^>]+>/g, ''));
      }
      else if (b.type === 'figure') {
        lines.push('\n_Figure ' + (b.fno || '') + (b.title ? ' — ' + b.title : '') + '_');
        if (b.caption) lines.push('\n' + b.caption);
      }
      else if (b.type === 'sidenote') lines.push('\n> **' + (b.label || 'Note') + '** — ' + (b.value || ''));
      else if (b.type === 'tag_row' && (b.tags || []).length) lines.push('\n**Tags:** ' + b.tags.join(', '));
    }
    return lines.join('\n');
  }

  function download(name, mime, content) {
    const blob = new Blob([content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  window.VWComponents['paper-downloads'] = {
    props: { paper: { type: Object, required: true } },
    setup() { return { store: window.VWStore }; },
    methods: {
      downloadJSON() {
        download(
          this.paper.id + '.' + (this.store.locale || 'en') + '.json',
          'application/json',
          JSON.stringify(this.paper, null, 2)
        );
      },
      downloadMD() {
        download(
          this.paper.id + '.' + (this.store.locale || 'en') + '.md',
          'text/markdown',
          blocksToMarkdown(this.paper)
        );
      },
    },
    template: `
      <div class="paper-downloads">
        <span class="pd-lbl">{{ store.locale === 'fr' ? 'Télécharger' : 'Download' }}</span>
        <button class="pd-btn" @click="downloadMD">Markdown</button>
        <button class="pd-btn" @click="downloadJSON">JSON</button>
      </div>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['keyboard-shortcuts'] = {
    setup() { return { store: window.VWStore }; },
    data() {
      return {
        open: false,
        triggerEl: null,
        releaseTrap: null,
        releaseEsc: null,
      };
    },
    computed: {
      shortcuts() {
        const fr = this.store.locale === 'fr';
        return [
          { keys: ['?'],            label: fr ? 'Afficher les raccourcis clavier'      : 'Show keyboard shortcuts' },
          { keys: ['Esc'],          label: fr ? 'Fermer une boîte de dialogue ouverte' : 'Close any open dialog' },
          { keys: ['Tab'],          label: fr ? 'Aller au champ interactif suivant'    : 'Move to next interactive element' },
          { keys: ['Shift', 'Tab'], label: fr ? 'Aller au champ interactif précédent'  : 'Move to previous interactive element' },
          { divider: true,          label: fr ? 'Lecteur de présentation'              : 'Presentation player' },
          { keys: ['Space'],        label: fr ? 'Lecture / pause'                      : 'Play / pause narration' },
          { keys: ['←'],            label: fr ? 'Diapositive précédente'               : 'Previous slide' },
          { keys: ['→'],            label: fr ? 'Diapositive suivante'                 : 'Next slide' },
          { keys: ['Click'],        label: fr ? 'Cliquer la diapositive pour basculer la lecture' : 'Click the slide to toggle play' },
          { divider: true,          label: fr ? 'Barre de lecture (lorsque focalisée)' : 'Scrubber (when focused)' },
          { keys: ['←'],            label: fr ? 'Reculer de 5 secondes'                : 'Seek back 5 seconds' },
          { keys: ['→'],            label: fr ? 'Avancer de 5 secondes'                : 'Seek forward 5 seconds' },
          { keys: ['Home'],         label: fr ? 'Aller au début de la diapositive'     : 'Jump to start of slide' },
          { keys: ['End'],          label: fr ? 'Aller à la fin de la diapositive'     : 'Jump to end of slide' },
        ];
      },
    },
    mounted() { window.addEventListener('keydown', this.onGlobalKey); },
    beforeUnmount() {
      window.removeEventListener('keydown', this.onGlobalKey);
      if (this.releaseTrap) this.releaseTrap();
      if (this.releaseEsc)  this.releaseEsc();
    },
    watch: {
      open(val) {
        if (val) {
          this.$nextTick(() => {
            const dialog = this.$refs.dialog;
            if (!dialog || !window.VWA11y) return;
            this.releaseTrap = window.VWA11y.trapFocus(dialog, this.triggerEl);
            this.releaseEsc  = window.VWA11y.onEsc(() => { this.open = false; });
          });
        } else {
          if (this.releaseTrap) { this.releaseTrap(); this.releaseTrap = null; }
          if (this.releaseEsc)  { this.releaseEsc();  this.releaseEsc  = null; }
        }
      },
    },
    methods: {
      onGlobalKey(e) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (e.target && e.target.isContentEditable) return;
        
        if (e.key === '?') {
          e.preventDefault();
          this.triggerEl = document.activeElement;
          this.open = true;
        }
      },
    },
    template: `
      <transition name="vp-fade">
        <div v-if="open"
             class="kbd-overlay"
             @click.self="open = false"
             aria-hidden="false">
          <div class="kbd-dialog"
               role="dialog"
               aria-modal="true"
               aria-labelledby="kbd-title"
               ref="dialog">
            <div class="kbd-head">
              <h2 id="kbd-title">{{ store.locale === 'fr' ? 'Raccourcis clavier' : 'Keyboard shortcuts' }}</h2>
              <button class="kbd-close"
                      @click="open = false"
                      :aria-label="store.locale === 'fr' ? 'Fermer' : 'Close'">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <dl class="kbd-list">
              <template v-for="(row, i) in shortcuts" :key="i">
                <div v-if="row.divider" class="kbd-divider">{{ row.label }}</div>
                <div v-else class="kbd-row">
                  <dt class="kbd-keys">
                    <kbd v-for="(k, j) in row.keys" :key="j">{{ k }}</kbd>
                  </dt>
                  <dd class="kbd-label">{{ row.label }}</dd>
                </div>
              </template>
            </dl>
            <p class="kbd-hint">
              {{ store.locale === 'fr' ? 'Appuyez sur Échap pour fermer.' : 'Press Esc to close.' }}
            </p>
          </div>
        </div>
      </transition>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['library-page'] = {
    emits: ['navigate'],
    setup() { return { store: window.VWStore }; },
    computed: {
      papers() {
        return (this.store.papers || []).filter(p => p.category !== 'architecture');
      },
      featured() { return this.papers.slice(0, 2); },
      rest() { return this.papers.filter(p => p.status !== 'Placeholder'); },
      seriesMeta() {
        const tpl = this.store.t.section_titles?.series_meta_tpl || '{n} entries';
        return tpl.replace('{n}', this.papers.length);
      },
    },
    methods: {
      open(id) { this.$emit('navigate', { page: 'paper', id }); },
      paperTitle(p) {
        const i18n = p.i18n && p.i18n[this.store.locale];
        return (i18n && i18n.title) || p.title;
      },
      paperSubtitle(p) {
        const i18n = p.i18n && p.i18n[this.store.locale];
        return (i18n && i18n.subtitle) || p.subtitle;
      },
    },
    template: `
      <div v-if="store.ready">
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <span>{{ store.t.publisher }}</span>
            <span>·</span>
            <span>Open source · MIT</span>
          </div>
          <h1>
            {{ store.t.hero.h1_pre }} <em>{{ store.t.hero.h1_em_1 }}</em>
            {{ store.t.hero.h1_mid }} <em>{{ store.t.hero.h1_em_2 }}</em>
          </h1>
          <p class="lede">{{ store.t.tagline }}</p>
        </section>

        <stat-rail :stats="store.t.stats" />

        <section class="civic-section">
          <div class="head">
            <h2>{{ store.t.section_titles.featured }}</h2>
            <div class="meta">{{ store.t.section_titles.featured_meta }}</div>
          </div>
        </section>
        <div class="civic-featured">
          <a v-for="p in featured" :key="p.id"
             :href="'#/paper/' + p.id"
             class="cell"
             :aria-label="'Paper ' + p.num + ', ' + paperTitle(p) + ', ' + p.tier"
             @click.prevent="open(p.id)">
            <div class="top" aria-hidden="true">
              <span class="num">№ {{ p.num }}</span>
              <span>{{ p.tier }}</span>
            </div>
            <h3>{{ paperTitle(p) }}</h3>
            <div class="sub">{{ paperSubtitle(p) }}</div>
            <div class="meta" aria-hidden="true">
              <span>{{ p.status }}</span>
              <span v-if="p.reading_min">{{ p.reading_min }} {{ store.t.ui.min }}</span>
              <span v-if="p.repo">repo ✓</span>
            </div>
          </a>
        </div>

        <section class="civic-section">
          <div class="head">
            <h2>{{ store.t.section_titles.complete_series }}</h2>
            <div class="meta">{{ seriesMeta }}</div>
          </div>
        </section>
        <library-grid :papers="rest" @open="open" />

        <app-footer />
      </div>
      <div v-else style="padding:80px 56px;color:var(--ink-50);font-family:var(--font-mono);font-size:12px;">
        {{ (store.t.ui && store.t.ui.loading_library) || 'Loading…' }}
      </div>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['index-page'] = {
    emits: ['navigate'],
    setup() {
      return { store: window.VWStore };
    },
    methods: {
      open(id) { this.$emit('navigate', { page: 'paper', id }); },
    },
    template: `
      <div v-if="store.ready">
        <index-table :papers="store.papers" @open="open" />
        <app-footer />
      </div>
      <div v-else style="padding:80px 56px;color:var(--ink-50);font-family:var(--font-mono);font-size:12px;">
        Loading the index…
      </div>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['architecture-page'] = {
    emits: ['navigate'],
    data() { return { arch: null, error: null }; },
    setup() { return { store: window.VWStore }; },
    async mounted() {
      try {
        const res = await fetch('data/architecture.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error('Failed to load architecture.json');
        this.arch = await res.json();
      } catch (e) { this.error = e.message; }
    },
    computed: {
      architectureArticles() {
        return (this.store.papers || []).filter(p => p.category === 'architecture');
      },
    },
    methods: {
      open(id) { this.$emit('navigate', { page: 'paper', id }); },
    },
    template: `
      <div>
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <span>The agentic architecture</span>
            <span>·</span>
            <span>Reference topology + knowledge articles</span>
          </div>
          <h1>The work, in <em>seven layers</em>.</h1>
          <p class="lede">From discovery to deployment. Autonomous agents inside each layer. Verifiers and human-gated steps where the cost of mistakes is highest. Below the diagram, a small library of architecture articles — technical specs that sit outside the linear reading sequence and are read on demand.</p>
        </section>

        <div v-if="arch">
          <architecture-diagram :arch="arch" />
        </div>
        <div v-else-if="error" style="padding:60px 56px;color:var(--highlight);font-family:var(--font-mono);">
          {{ error }}
        </div>
        <div v-else style="padding:60px 56px;color:var(--ink-50);font-family:var(--font-mono);font-size:12px;">
          Loading the architecture…
        </div>

        <section class="civic-section" v-if="architectureArticles.length">
          <div class="head">
            <h2>Architecture articles</h2>
            <div class="meta">{{ architectureArticles.length }} entries · technical reference</div>
          </div>
        </section>
        <library-grid v-if="architectureArticles.length"
                      :papers="architectureArticles"
                      @open="open" />

        <app-footer />
      </div>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['paper-page'] = {
    props: {
      paperId: { type: String, default: null },
    },
    emits: ['navigate'],
    setup() { return { store: window.VWStore }; },
    data() { return { content: null, error: null, loading: false }; },
    computed: {
      
      loadKey() {
        return (this.paperId || '') + ':' + (this.store.locale || 'en');
      },
    },
    watch: {
      loadKey: { handler: 'load', immediate: true },
    },
    methods: {
      async load() {
        if (!this.paperId) return;
        this.loading = true; this.error = null;
        try {
          this.content = await window.VWLoadPaper(this.paperId, this.store.locale);
          window.VWMarkVisited(this.paperId);
          if (window.VWVisuals && this.content) {
            await window.VWVisuals.loadBespokeFor(this.content);
          }
          if (window.VWA11y && this.content) {
            const prefix = this.store.locale === 'fr' ? 'Livre chargé : ' : 'Paper loaded: ';
            window.VWA11y.announce(prefix + this.content.title);
          }
          if (window.VWMeta && this.content) {
            window.VWMeta.setPaper(this.content);
          }
        } catch (e) {
          this.error = 'No content found for ' + this.paperId + '. JSON file may not exist yet.';
          this.content = null;
        } finally { this.loading = false; }
      },
      open(id) { this.$emit('navigate', { page: 'paper', id }); },
      back() { this.$emit('navigate', 'library'); },
    },
    template: `
      <div>
        <paper-detail v-if="content"
                      :paper="content"
                      @open="open"
                      @back="back" />
        <div v-else-if="loading" style="padding:80px 56px;color:var(--ink-50);font-family:var(--font-mono);font-size:12px;">
          {{ (store.t.ui && store.t.ui.loading_paper) || 'Loading' }} {{ paperId }}…
        </div>
        <div v-else-if="error" style="padding:80px 56px;">
          <div style="font-family:var(--font-mono);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--highlight);margin-bottom:14px;">{{ (store.t.ui && store.t.ui.no_content) || 'Not yet written' }}</div>
          <h1 style="font-size:32px;font-weight:600;letter-spacing:-0.02em;margin:0 0 18px;">{{ paperId }}</h1>
          <p style="color:var(--ink-70);max-width:60ch;">{{ (store.t.ui && store.t.ui.no_content_body) || error }}</p>
          <button @click="back"
                  :aria-label="(store.locale === 'fr' ? 'Retour à la bibliothèque' : 'Back to the library')"
                  style="margin-top:24px;font-family:var(--font-mono);font-size:11px;letter-spacing:0.08em;text-transform:uppercase;background:none;border:0;color:var(--ink-50);cursor:pointer;">
            <span aria-hidden="true">←</span> <span>{{ (store.t.ui && store.t.ui.back_to_library) || 'Library' }}</span>
          </button>
        </div>
      </div>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['about-page'] = {
    setup() { return { store: window.VWStore }; },
    template: `
      <div v-if="store.site">
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <span>About this collection</span>
          </div>
          <h1>Open source by <em>default</em>.</h1>
          <p class="lede">The site itself is open source, published via GitHub Pages. The entire site is cloneable and adaptable. MIT license with explicit disclaimers: not responsible for decisions or costs incurred by adopters; shared in the spirit of national collaboration; users must evaluate and assess these tools in their own context.</p>
        </section>

        <section class="civic-section">
          <div class="head">
            <h2>How to use this site</h2>
            <div class="meta">readme · methodology · feedback</div>
          </div>
          <div style="padding-bottom:24px;max-width:60ch;color:var(--ink-70);font-size:15px;line-height:1.7;">
            <p>Sequential reading is the recommended path. Each paper builds on what comes before. Lateral links between papers let readers jump sideways without losing context.</p>
            <p>Every paper is downloadable as Markdown and JSON so readers can feed them into their own AI tooling. The full site is cloneable from GitHub. The site uses a small cookie to track which papers a reader has visited and surface what is new since their last visit.</p>
            <p>No vendor or product is being advocated. For transparency, any vendors or models actually used in production will be disclosed.</p>
          </div>
        </section>

        <section class="civic-section">
          <div class="head">
            <h2>Public repositories</h2>
            <div class="meta">released alongside the papers</div>
          </div>
          <ul style="list-style:none;padding:0;margin:0;border-top:1px solid var(--rule);">
            <li v-for="p in store.papers.filter(p => p.repo)" :key="p.id"
                style="padding:14px 0;border-bottom:1px solid var(--rule);display:flex;justify-content:space-between;align-items:baseline;gap:24px;">
              <div>
                <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.14em;color:var(--highlight);text-transform:uppercase;">№ {{ p.num }}</div>
                <div style="font-weight:600;font-size:15px;">{{ p.title }}</div>
              </div>
              <a :href="p.repo" style="font-family:var(--font-mono);font-size:11px;color:var(--accent);">{{ p.repo.replace('https://github.com/','') }}</a>
            </li>
          </ul>
        </section>

        <section class="civic-section">
          <div class="head">
            <h2>{{ store.locale === 'fr' ? 'Aussi sur ce site' : 'Also on this site' }}</h2>
            <div class="meta">{{ store.locale === 'fr' ? 'cinq raccourcis' : 'five shortcuts' }}</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding-bottom:24px;">
            <a href="#/glossary" class="civic-card" style="text-decoration:none;cursor:pointer;">
              <div class="head"><span class="num">→</span><span>{{ store.locale === 'fr' ? 'Glossaire' : 'Glossary' }}</span></div>
              <h3>{{ store.locale === 'fr' ? 'Vocabulaire de la collection' : 'Vocabulary of the collection' }}</h3>
            </a>
            <a href="#/repos" class="civic-card" style="text-decoration:none;cursor:pointer;">
              <div class="head"><span class="num">→</span><span>{{ store.locale === 'fr' ? 'Dépôts' : 'Repositories' }}</span></div>
              <h3>{{ store.locale === 'fr' ? 'Les dépôts publics' : 'Public companion repositories' }}</h3>
            </a>
            <a href="#/updates" class="civic-card" style="text-decoration:none;cursor:pointer;">
              <div class="head"><span class="num">→</span><span>{{ store.locale === 'fr' ? 'Mises à jour' : 'Updates' }}</span></div>
              <h3>{{ store.locale === 'fr' ? 'Ce qui a changé' : 'What has changed' }}</h3>
            </a>
            <a href="#/community" class="civic-card" style="text-decoration:none;cursor:pointer;">
              <div class="head"><span class="num">→</span><span>{{ store.locale === 'fr' ? 'Communauté' : 'Community' }}</span></div>
              <h3>{{ store.locale === 'fr' ? 'Où parler du travail' : 'Where to talk about the work' }}</h3>
            </a>
          </div>
        </section>

        <app-footer />
      </div>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['glossary-page'] = {
    emits: ['navigate'],
    setup() { return { store: window.VWStore }; },
    data() { return { terms: [], query: '', expanded: {}, error: null }; },
    async mounted() {
      try {
        const res = await fetch('data/glossary.json', { cache: 'no-cache' });
        const j = await res.json();
        this.terms = j.terms;
      } catch (e) { this.error = e.message; }
    },
    computed: {
      filtered() {
        const q = this.query.trim().toLowerCase();
        if (!q) return this.terms;
        return this.terms.filter(t => {
          const loc = t[this.store.locale] || t.en;
          return [loc.term, loc.short, loc.long].join(' ').toLowerCase().includes(q);
        });
      },
    },
    methods: {
      toggle(id) { this.expanded[id] = !this.expanded[id]; },
      jumpTo(id) {
        this.expanded[id] = true;
        this.$nextTick(() => {
          const el = document.getElementById('term-' + id);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      },
      termById(id) {
        const t = this.terms.find(x => x.id === id);
        if (!t) return null;
        return t[this.store.locale] || t.en;
      },
    },
    template: `
      <div>
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <span>{{ store.locale === 'fr' ? 'Glossaire' : 'Glossary' }}</span>
            <span>·</span>
            <span>{{ filtered.length }} {{ store.locale === 'fr' ? 'termes' : 'terms' }}</span>
          </div>
          <h1>{{ store.locale === 'fr' ? 'Le' : 'The' }} <em>{{ store.locale === 'fr' ? 'vocabulaire' : 'vocabulary' }}</em>.</h1>
          <p class="lede">{{ store.locale === 'fr'
            ? 'Les concepts introduits dans la collection, définis en deux niveaux : la phrase courte pour le rappel et la définition longue pour la première lecture.'
            : 'The concepts introduced across the collection, defined at two levels: a short sentence for recall and a longer definition for first reading.' }}</p>
        </section>

        <section class="civic-section">
          <div class="filters" role="search" style="display:flex;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);margin-bottom:24px;">
            <div class="search" style="flex:1;padding:14px 16px;">
              <label for="vw-glossary-search" class="sr-only">{{ store.locale === 'fr' ? 'Rechercher dans le glossaire' : 'Search the glossary' }}</label>
              <input id="vw-glossary-search"
                     v-model="query"
                     type="search"
                     :placeholder="(store.t.ui && store.t.ui.search_placeholder) || 'Search…'"
                     :aria-label="(store.locale === 'fr' ? 'Rechercher dans ' : 'Search ') + terms.length + (store.locale === 'fr' ? ' termes' : ' terms')"
                     style="width:100%;border:0;background:transparent;outline:none;font-family:var(--font-sans);font-size:15px;color:var(--ink);" />
            </div>
          </div>

          <div v-if="error" style="color:var(--highlight);font-family:var(--font-mono);font-size:12px;">{{ error }}</div>

          <dl class="glossary-list">
            <div v-for="t in filtered" :key="t.id" :id="'term-' + t.id"
                 class="glossary-term" :class="{ open: expanded[t.id] }">
              <dt @click="toggle(t.id)">
                <span class="term-name">{{ (t[store.locale] || t.en).term }}</span>
                <span class="term-short">{{ (t[store.locale] || t.en).short }}</span>
                <span class="term-toggle">{{ expanded[t.id] ? '−' : '+' }}</span>
              </dt>
              <dd v-if="expanded[t.id]">
                <p>{{ (t[store.locale] || t.en).long }}</p>
                <div class="term-related" v-if="t.related && t.related.length">
                  <span class="rl-l">{{ store.locale === 'fr' ? 'Voir aussi' : 'See also' }}</span>
                  <button v-for="rid in t.related" :key="rid"
                          class="rl-link"
                          @click="jumpTo(rid)">
                    {{ termById(rid) ? termById(rid).term : rid }}
                  </button>
                </div>
              </dd>
            </div>
          </dl>
        </section>

        <app-footer />
      </div>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['repos-page'] = {
    emits: ['navigate'],
    setup() { return { store: window.VWStore }; },
    data() { return { enrichment: {}, error: null }; },
    async mounted() {
      try {
        const res = await fetch('data/repos.json', { cache: 'no-cache' });
        if (res.ok) {
          const j = await res.json();
          this.enrichment = j.repos || {};
        }
      } catch {  }
    },
    computed: {
      repos() {
        const out = [];
        for (const p of (this.store.papers || [])) {
          if (!p.repo) continue;
          const slug = p.repo.replace('https://github.com/', '');
          const ex = this.enrichment[p.id] || {};
          out.push({
            paper_id: p.id,
            num: p.num,
            paper_title: p.title,
            paper_tier: p.tier,
            url: p.repo,
            slug,
            license: ex.license || 'MIT',
            language: ex.language || null,
            status: ex.status || p.status || 'Forthcoming',
            description: ex[this.store.locale + '_description']
                      || ex.en_description
                      || p.subtitle,
          });
        }
        return out;
      },
    },
    methods: {
      openPaper(id) { this.$emit('navigate', { page: 'paper', id }); },
    },
    template: `
      <div>
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <span>{{ store.locale === 'fr' ? 'Dépôts publics' : 'Public repositories' }}</span>
            <span>·</span>
            <span>{{ repos.length }} {{ store.locale === 'fr' ? 'dépôts' : 'repositories' }}</span>
          </div>
          <h1>{{ store.locale === 'fr' ? 'Tout est' : 'Everything is' }} <em>{{ store.locale === 'fr' ? 'libre.' : 'open source.' }}</em></h1>
          <p class="lede">{{ store.locale === 'fr'
            ? "Chaque livre blanc qui s'accompagne d'un logiciel publie ce logiciel ici. Le site lui-même est dans cette liste. Aucun verrouillage propriétaire, aucune confiance aveugle."
            : 'Every paper that ships with software publishes that software here. The site itself is in the list. No proprietary lock-in, no blind trust required.' }}</p>
        </section>

        <section class="civic-section">
          <ul class="repo-list">
            <li v-for="r in repos" :key="r.paper_id">
              <div class="repo-num">№ {{ r.num }}</div>
              <div class="repo-body">
                <a class="repo-slug" :href="r.url" target="_blank" rel="noopener">
                  {{ r.slug }}
                </a>
                <div class="repo-title">{{ r.paper_title }}</div>
                <div class="repo-desc">{{ r.description }}</div>
                <div class="repo-meta">
                  <span>{{ r.license }}</span>
                  <span v-if="r.language">{{ r.language }}</span>
                  <span class="repo-status" :class="r.status.toLowerCase()">{{ r.status }}</span>
                </div>
              </div>
              <button class="repo-link" @click="openPaper(r.paper_id)">
                {{ store.locale === 'fr' ? 'Lire le livre →' : 'Read the paper →' }}
              </button>
            </li>
          </ul>
          <div v-if="!repos.length" style="color:var(--ink-50);font-family:var(--font-mono);padding:24px 0;">
            {{ store.locale === 'fr' ? 'Aucun dépôt publié pour le moment.' : 'No repositories published yet.' }}
          </div>
        </section>

        <app-footer />
      </div>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['updates-page'] = {
    setup() { return { store: window.VWStore }; },
    data() { return { entries: [], error: null }; },
    async mounted() {
      try {
        const res = await fetch('data/updates.json', { cache: 'no-cache' });
        const j = await res.json();
        this.entries = (j.entries || []).slice().sort((a, b) => b.date.localeCompare(a.date));
      } catch (e) { this.error = e.message; }
    },
    methods: {
      kindLabel(k) {
        const labels_en = { release: 'Release', finding: 'Finding', paper: 'Paper', note: 'Note' };
        const labels_fr = { release: 'Mise en service', finding: 'Constat', paper: 'Livre', note: 'Note' };
        const map = this.store.locale === 'fr' ? labels_fr : labels_en;
        return map[k] || k;
      },
    },
    template: `
      <div>
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <span>{{ store.locale === 'fr' ? 'Mises à jour vivantes' : 'Living updates' }}</span>
          </div>
          <h1>{{ store.locale === 'fr' ? 'Ce qui a' : 'What has' }} <em>{{ store.locale === 'fr' ? 'changé.' : 'changed.' }}</em></h1>
          <p class="lede">{{ store.locale === 'fr'
            ? "Nouveaux constats, nouvelles versions logicielles, nouvelles preuves. Quatre ans de cycle. Du plus récent au plus ancien."
            : 'New findings, new code releases, new evidence. A four-year cycle. Newest first.' }}</p>
        </section>

        <section class="civic-section">
          <ol class="updates-list">
            <li v-for="e in entries" :key="e.id">
              <div class="upd-meta">
                <span class="upd-date">{{ e.date }}</span>
                <span class="upd-kind" :class="'k-' + e.kind">{{ kindLabel(e.kind) }}</span>
              </div>
              <h2 class="upd-title">{{ (e[store.locale] || e.en).title }}</h2>
              <p>{{ (e[store.locale] || e.en).body }}</p>
              <div class="upd-links" v-if="e.links && e.links.length">
                <a v-for="l in e.links" :key="l.href"
                   :href="l.href">{{ store.locale === 'fr' ? l.label_fr : l.label_en }}</a>
              </div>
            </li>
          </ol>
          <div v-if="!entries.length && !error" style="color:var(--ink-50);font-family:var(--font-mono);padding:24px 0;">
            {{ store.locale === 'fr' ? 'Aucune mise à jour publiée pour le moment.' : 'No updates published yet.' }}
          </div>
          <div v-if="error" style="color:var(--highlight);font-family:var(--font-mono);">{{ error }}</div>
        </section>

        <app-footer />
      </div>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['community-page'] = {
    setup() { return { store: window.VWStore }; },
    data() { return { channels: [], contributing: null, error: null }; },
    async mounted() {
      try {
        const res = await fetch('data/community.json', { cache: 'no-cache' });
        const j = await res.json();
        this.channels = j.channels || [];
        this.contributing = j.contributing || null;
      } catch (e) { this.error = e.message; }
    },
    template: `
      <div>
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot"></span>
            <span>{{ store.locale === 'fr' ? 'Communauté' : 'Community' }}</span>
          </div>
          <h1>{{ store.locale === 'fr' ? 'Où parler de' : 'Where to talk about' }} <em>{{ store.locale === 'fr' ? 'tout ceci.' : 'this work.' }}</em></h1>
          <p class="lede">{{ store.locale === 'fr'
            ? 'Forum ouvert, tickets publics, discussions de fond. La conversation sur la modernisation ne se tient pas en privé.'
            : 'Open forum, public issues, longer-form discussions. The modernization conversation does not happen behind a closed door.' }}</p>
        </section>

        <section class="civic-section">
          <ul class="channel-list">
            <li v-for="c in channels" :key="c.id" :class="{ 'is-unavailable': !c.available }">
              <div class="channel-kind">{{ c.kind }}</div>
              <h2 class="channel-name">{{ (c[store.locale] || c.en).label }}</h2>
              <p>{{ (c[store.locale] || c.en).blurb }}</p>
              <a v-if="c.available" :href="c.href" target="_blank" rel="noopener" class="channel-link">
                {{ store.locale === 'fr' ? 'Ouvrir →' : 'Open →' }}
              </a>
              <span v-else class="channel-pending">
                {{ store.locale === 'fr' ? 'À venir' : 'Coming soon' }}
              </span>
            </li>
          </ul>
        </section>

        <section class="civic-section" v-if="contributing">
          <div class="head">
            <h2>{{ (contributing[store.locale] || contributing.en).title }}</h2>
            <div class="meta">MIT</div>
          </div>
          <p style="max-width:60ch;color:var(--ink-70);font-size:15px;line-height:1.7;">
            {{ (contributing[store.locale] || contributing.en).body }}
          </p>
        </section>

        <app-footer />
      </div>
    `,
  };
})();

(function () {
  window.VWComponents = window.VWComponents || {};

  window.VWComponents['not-found-page'] = {
    emits: ['navigate'],
    setup() { return { store: window.VWStore }; },
    computed: {
      paperCount() {
        return (this.store.papers || []).filter(p => p.category === 'paper').length;
      },
      paperCountLabel() {
        const n = this.paperCount;
        if (this.store.locale === 'fr') return n + ' livres blancs';
        return n + ' papers';
      },
    },
    template: `
      <div>
        <section class="civic-hero">
          <div class="civic-eyebrow">
            <span class="dot" aria-hidden="true"></span>
            <span>404</span>
          </div>
          <h1>{{ store.locale === 'fr' ? 'Cette page' : 'This page' }} <em>{{ store.locale === 'fr' ? "n'existe pas." : 'does not exist.' }}</em></h1>
          <p class="lede">{{ store.locale === 'fr'
            ? "Le chemin demandé n'est pas dans la collection. La bibliothèque, l'index et la page d'architecture sont les bons points de départ."
            : 'The requested path is not in this collection. The library, the index, and the architecture page are good places to start.' }}</p>
        </section>

        <section class="civic-section">
          <div class="head">
            <h2>{{ store.locale === 'fr' ? 'Où aller' : 'Where to go' }}</h2>
            <div class="meta">{{ store.locale === 'fr' ? 'quatre raccourcis' : 'four shortcuts' }}</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding-bottom:24px;">
            <a href="#/" class="civic-card" style="text-decoration:none;cursor:pointer;">
              <div class="head" aria-hidden="true"><span class="num">→</span><span>{{ store.locale === 'fr' ? 'Bibliothèque' : 'Library' }}</span></div>
              <h3>{{ paperCountLabel }}</h3>
            </a>
            <a href="#/index" class="civic-card" style="text-decoration:none;cursor:pointer;">
              <div class="head" aria-hidden="true"><span class="num">→</span><span>{{ store.locale === 'fr' ? 'Index' : 'Index' }}</span></div>
              <h3>{{ store.locale === 'fr' ? 'Recherche dans la collection' : 'Search the collection' }}</h3>
            </a>
            <a href="#/architecture" class="civic-card" style="text-decoration:none;cursor:pointer;">
              <div class="head" aria-hidden="true"><span class="num">→</span><span>Architecture</span></div>
              <h3>{{ store.locale === 'fr' ? 'Diagramme et articles techniques' : 'Diagram and technical articles' }}</h3>
            </a>
            <a href="#/glossary" class="civic-card" style="text-decoration:none;cursor:pointer;">
              <div class="head" aria-hidden="true"><span class="num">→</span><span>{{ store.locale === 'fr' ? 'Glossaire' : 'Glossary' }}</span></div>
              <h3>{{ store.locale === 'fr' ? 'Vocabulaire de la collection' : 'Vocabulary of the collection' }}</h3>
            </a>
          </div>
        </section>

        <app-footer />
      </div>
    `,
  };
})();

(function () {
  const { createApp, reactive, computed, onMounted, onUnmounted, ref } = Vue;

  
  const initialLocale = localStorage.getItem('vw_locale') || 'en';

  const store = reactive({
    site: null,
    papers: [],
    paperById: {},
    paperCache: {},       
    visited: new Set(JSON.parse(localStorage.getItem('vw_visited') || '[]')),
    ready: false,
    locale: initialLocale,
    t: {},                
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

  function markVisited(id) {
    store.visited.add(id);
    localStorage.setItem('vw_visited', JSON.stringify([...store.visited]));
  }

  
  window.VWStore = store;
  window.VWLoadPaper = loadPaper;
  window.VWMarkVisited = markVisited;
  window.VWSetLocale = applyLocale;

  
  function parseHash() {
    const h = (location.hash || '#/').replace(/^#/, '');
    const parts = h.split('/').filter(Boolean);
    if (parts.length === 0) return { page: 'library', paperId: null };
    if (parts[0] === 'index')        return { page: 'index',        paperId: null };
    if (parts[0] === 'architecture') return { page: 'architecture', paperId: null };
    if (parts[0] === 'about')        return { page: 'about',        paperId: null };
    if (parts[0] === 'glossary')     return { page: 'glossary',     paperId: null };
    if (parts[0] === 'repos')        return { page: 'repos',        paperId: null };
    if (parts[0] === 'updates')      return { page: 'updates',      paperId: null };
    if (parts[0] === 'community')    return { page: 'community',    paperId: null };
    if (parts[0] === 'not-found')    return { page: 'not-found',    paperId: null };
    if (parts[0] === 'paper' && parts[1]) return { page: 'paper', paperId: parts[1] };
    return { page: 'not-found', paperId: null };
  }

  
  const app = createApp({
    setup() {
      const route = ref(parseHash());

      const currentPage = computed(() => {
        switch (route.value.page) {
          case 'library':       return 'library-page';
          case 'index':         return 'index-page';
          case 'architecture':  return 'architecture-page';
          case 'about':         return 'about-page';
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
        
        const main = document.getElementById('main-content');
        if (main && typeof main.focus === 'function') {
          requestAnimationFrame(() => main.focus({ preventScroll: true }));
        }
        
        if (window.VWMeta && route.value.page !== 'paper') {
          const pageTitles = {
            library:      null,
            index:        'Index',
            architecture: 'Architecture',
            about:        'About',
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
        
        if (window.VWMeta && route.value.page !== 'paper') {
          window.VWMeta.setSitePage(route.value.page);
        }
      });
      onUnmounted(() => window.removeEventListener('hashchange', onHashChange));

      return { currentPage, paperId, page, navigate, setLocale, store };
    },
  });

  
  const reg = window.VWComponents || {};
  Object.keys(reg).forEach(k => app.component(k, reg[k]));

  app.mount('#app');
})();
