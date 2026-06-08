/* meta.js — runtime meta-tag and JSON-LD manager.

   Updates document.title, meta description, Open Graph + Twitter card tags,
   canonical link, hreflang alternates, and a JSON-LD structured data block
   when the route or paper changes.

   Exposes:
     VWMeta.setSitePage(pageId, pageTitle, descriptionOverride)
     VWMeta.setPaper(paper)              — full paper object
     VWMeta.clear()                      — restore site defaults
*/

(function () {
  const W = window;

  const SITE_URL_BASE = (function () {
    /* Best-effort base URL detection. Works in dev and on GitHub Pages. */
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

  /* Clear all hreflang links before re-applying — they vary per route. */
  function clearHreflangs() {
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
  }

  /* Replace any existing JSON-LD block with a new one (or remove it). */
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

  /* Used by the index/library/architecture/about/glossary/etc. pages.
     They're indexable but generic. */
  V.setSitePage = function (pageId, pageTitle, descriptionOverride) {
    const d = siteDefaults();
    const title = pageTitle ? (pageTitle + ' · ' + d.title) : d.title;
    const desc = descriptionOverride || d.description;
    const url  = SITE_URL_BASE + '/' + (pageId === 'library' ? '' : pageId);

    document.title = title;
    setMeta('description', desc);
    setProperty('og:title', title);
    setProperty('og:description', desc);
    setProperty('og:type', 'website');
    setProperty('og:url', url);
    setProperty('og:site_name', d.title);
    setProperty('og:locale', d.locale === 'fr' ? 'fr_CA' : 'en_CA');
    /* Non-paper routes share the site card. Setting it here also resets the
       image after a reader navigates away from a paper (which set its hero). */
    setProperty('og:image', SITE_URL_BASE + '/public/og-card.jpg');
    setProperty('og:image:alt', d.title);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', desc);
    setMeta('twitter:image', SITE_URL_BASE + '/public/og-card.jpg');

    setLink('canonical', url);
    clearHreflangs();
    const seg = (pageId === 'library' ? '' : pageId);
    setLink('alternate', SITE_URL_BASE + '/' + seg, 'en');
    setLink('alternate', SITE_URL_BASE + '/' + (seg ? seg + '/fr' : 'fr'), 'fr');
    setLink('alternate', SITE_URL_BASE + '/' + seg, 'x-default');

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

  /* Used by the paper detail page. Emits ScholarlyArticle structured data. */
  V.setPaper = function (paper) {
    if (!paper) return V.clear();
    const d = siteDefaults();
    const url = SITE_URL_BASE + '/paper/' + paper.id;
    const title = paper.title + ' · ' + d.title;
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
    /* Each paper has a tailored social card (its title on the collection
       template) at public/og/<id>.jpg, used in place of the abstract hero. */
    const card = SITE_URL_BASE + '/public/og/' + paper.id + '.jpg';
    setProperty('og:image', card);
    setProperty('og:image:alt', paper.title);
    setMeta('twitter:image', card);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', paper.title);
    setMeta('twitter:description', desc);

    setLink('canonical', url);
    clearHreflangs();
    setLink('alternate', SITE_URL_BASE + '/paper/' + paper.id, 'en');
    setLink('alternate', SITE_URL_BASE + '/paper/' + paper.id + '/fr', 'fr');
    setLink('alternate', SITE_URL_BASE + '/paper/' + paper.id, 'x-default');

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
      /* The schema.org article image reuses the per-paper social card
         (public/og/<id>.jpg). The old abstract hero was never shown on the
         site, so we no longer generate it; the card is a better image anyway. */
      image: card,
      about: paper.tier || undefined,
    });
  };

  V.clear = function () { V.setSitePage('library'); };
})();
