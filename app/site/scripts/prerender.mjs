#!/usr/bin/env node
/* prerender.mjs — generate static HTML for each paper and static route so
   crawlers, social-preview bots, and AI fetchers see real content and Open
   Graph tags WITHOUT running JavaScript.

   The site uses always-prefixed locale URLs (/en/…, /fr/…, /es/…) as the single
   canonical form (see app.js localizedPath). Crawlers hit those prefixed URLs,
   so we MUST emit a static file at each one. We generate, for every locale:

     <locale>/index.html                 — localized home (library)
     <locale>/paper/<id>/index.html       — localized paper
     <locale>/<route>/index.html          — localized static route

   Plus a non-prefixed back-compat page for each paper and route
   (paper/<id>/index.html, <route>/index.html) whose canonical points at the
   default-locale prefixed URL, so older prefix-less links still resolve and
   consolidate.

   Each generated HTML:
     - correct <title>, description, canonical, per-locale OG + Twitter image
       (public/og/<id>.jpg for the default locale, <id>.<locale>.jpg otherwise)
       with width/height/secure_url/type, hreflang alternates for every locale,
     - a ScholarlyArticle JSON-LD block,
     - a crawler-readable body (title, subtitle, abstract, section prose),
     - a JS handoff that bounces JS-capable clients to the SPA.

   Usage:
     node scripts/prerender.mjs --base https://thevelocitywhitepapers.com [--clean]
*/

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const SITE_ROOT  = resolve(__dirname, '..');

const args = process.argv.slice(2);
const baseIdx = args.indexOf('--base');
let BASE = baseIdx !== -1 ? args[baseIdx + 1] : 'https://thevelocitywhitepapers.com';
BASE = BASE.replace(/\/+$/, '');
const CLEAN = args.includes('--clean');

function xmlEscape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const indexHTML = readFileSync(resolve(SITE_ROOT, 'index.html'), 'utf8'); // referenced for parity; SPA shell
const site = JSON.parse(readFileSync(resolve(SITE_ROOT, 'data/site.json'), 'utf8'));
const inventory = JSON.parse(readFileSync(resolve(SITE_ROOT, 'data/papers.json'), 'utf8')).papers;

const LOCALES = (site.locales || [{ code: 'en' }]).map((l) => l.code);
const DEF = site.default_locale || LOCALES[0] || 'en';

const LANG = { en: 'en-CA', fr: 'fr-CA', es: 'es' };
const OGLOCALE = { en: 'en_CA', fr: 'fr_CA', es: 'es_ES' };
const langFor = (loc) => LANG[loc] || loc;
const ogLocaleFor = (loc) => OGLOCALE[loc] || loc;
/* i18n bag for a locale, falling back to the default locale's bag per field. */
function i18nFor(loc) {
  const d = site.i18n[DEF] || {};
  const l = site.i18n[loc] || {};
  return {
    title: l.title || d.title,
    tagline: l.tagline || d.tagline,
    publisher: l.publisher || d.publisher,
  };
}
/* Per-locale social card: default locale keeps <id>.jpg; others <id>.<locale>.jpg. */
function paperCardURL(id, loc) {
  return BASE + '/public/og/' + id + (loc === DEF ? '' : '.' + loc) + '.jpg';
}

function blocksToText(paper) {
  const lines = [];
  for (const b of (paper.blocks || [])) {
    if (b.type === 'section_heading') lines.push('\n## §' + (b.n || '') + ' ' + (b.title || ''));
    else if (b.type === 'paragraph' || b.type === 'dropcap_paragraph') {
      lines.push(String(b.text || '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<[^>]+>/g, ''));
    } else if (b.type === 'pullquote') lines.push('"' + (b.text || '') + '"' + (b.cite ? ' · ' + b.cite : ''));
    else if (b.type === 'keystat') lines.push((b.label || '') + ' ' + b.value + '. ' + (b.body || '').replace(/<[^>]+>/g, ''));
    else if (b.type === 'youtube') lines.push([b.title, b.caption, b.url ? 'Video: ' + b.url : ''].filter(Boolean).join('. '));
    else if (b.type === 'sidenote') lines.push((b.label || 'Note') + '. ' + (b.value || ''));
  }
  return lines.join('\n\n').trim();
}

/* Shared OG image block (per-locale card, with the dimensions/secure_url/type
   pickier crawlers — iMessage, LinkedIn, WhatsApp — want). */
function ogImageTags(imgURL, alt) {
  return '' +
    '  <meta property="og:image" content="' + xmlEscape(imgURL) + '" />\n' +
    '  <meta property="og:image:secure_url" content="' + xmlEscape(imgURL) + '" />\n' +
    '  <meta property="og:image:type" content="image/jpeg" />\n' +
    '  <meta property="og:image:width" content="1200" />\n' +
    '  <meta property="og:image:height" content="630" />\n' +
    '  <meta property="og:image:alt" content="' + xmlEscape(alt) + '" />\n' +
    '  <meta name="twitter:image" content="' + xmlEscape(imgURL) + '" />\n';
}

function cssLinks(upPrefix) {
  return '' +
    '  <link rel="preconnect" href="https://fonts.googleapis.com">\n' +
    '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
    '  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">\n' +
    '  <link rel="icon" type="image/webp" href="' + upPrefix + 'alberta-logo.webp" />\n' +
    '  <link rel="stylesheet" href="' + upPrefix + 'styles/tokens.css" />\n' +
    '  <link rel="stylesheet" href="' + upPrefix + 'styles/base.css" />\n' +
    '  <link rel="stylesheet" href="' + upPrefix + 'styles/components.css" />\n';
}

function handoff(cleanPath, locale) {
  return '' +
    '  <script>\n' +
    '    (function () {\n' +
    '      try { if (window.localStorage) localStorage.setItem("vw_locale", "' + locale + '"); } catch (e) {}\n' +
    '      window.location.replace("/?redirect=" + encodeURIComponent("' + cleanPath + '"));\n' +
    '    })();\n' +
    '  </script>\n';
}

/* Build a paper page. `cleanPath` is the canonical route (e.g. /en/paper/x or
   /paper/x); `upPrefix` is the relative climb back to the site root. */
function buildPaperHTML(paper, locale, cleanPath, upPrefix) {
  const i = i18nFor(locale);
  const url = BASE + cleanPath + (cleanPath.endsWith('/') ? '' : '/');
  const title = paper.title + ' · ' + i.title;
  const desc = (paper.abstract || paper.subtitle || '').replace(/\s+/g, ' ').trim();
  const card = paperCardURL(paper.id, locale);
  const authors = (paper.authors || []).map((a) => ({ '@type': 'Person', name: a }));
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': paper.category === 'architecture' ? 'TechArticle' : 'ScholarlyArticle',
    headline: paper.title,
    description: desc,
    url,
    inLanguage: langFor(locale),
    author: authors.length ? authors : undefined,
    publisher: { '@type': 'Organization', name: i.publisher },
    datePublished: paper.published || undefined,
    isPartOf: { '@type': 'PublicationVolume', name: i.title, url: BASE + '/' },
    keywords: (paper.tags || []).join(', ') || undefined,
    image: card,
    about: paper.tier || undefined,
  };
  Object.keys(jsonld).forEach((k) => jsonld[k] === undefined && delete jsonld[k]);

  const hreflangs = LOCALES.map((l) =>
    '  <link rel="alternate" hreflang="' + l + '" href="' + xmlEscape(BASE + '/' + l + '/paper/' + paper.id + '/') + '" />\n'
  ).join('') +
    '  <link rel="alternate" hreflang="x-default" href="' + xmlEscape(BASE + '/paper/' + paper.id + '/') + '" />\n';

  const bodyText = blocksToText(paper);

  const head =
    '  <meta charset="utf-8" />\n' +
    '  <title>' + xmlEscape(title) + '</title>\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />\n' +
    '  <meta name="theme-color" content="#F7F4ED" />\n' +
    '  <meta name="description" content="' + xmlEscape(desc) + '" />\n' +
    '  <link rel="canonical" href="' + xmlEscape(url) + '" />\n' +
    hreflangs +
    '  <meta property="og:type" content="article" />\n' +
    '  <meta property="og:title" content="' + xmlEscape(paper.title) + '" />\n' +
    '  <meta property="og:description" content="' + xmlEscape(desc) + '" />\n' +
    '  <meta property="og:url" content="' + xmlEscape(url) + '" />\n' +
    '  <meta property="og:site_name" content="' + xmlEscape(i.title) + '" />\n' +
    '  <meta property="og:locale" content="' + ogLocaleFor(locale) + '" />\n' +
    ogImageTags(card, paper.title) +
    (paper.published ? '  <meta property="article:published_time" content="' + xmlEscape(paper.published) + '" />\n' : '') +
    (paper.tier ? '  <meta property="article:section" content="' + xmlEscape(paper.tier) + '" />\n' : '') +
    '  <meta name="twitter:card" content="summary_large_image" />\n' +
    '  <meta name="twitter:title" content="' + xmlEscape(paper.title) + '" />\n' +
    '  <meta name="twitter:description" content="' + xmlEscape(desc) + '" />\n' +
    '  <script type="application/ld+json">' + JSON.stringify(jsonld) + '</script>\n' +
    cssLinks(upPrefix) +
    '  <style>.crawl-fallback { max-width: 760px; margin: 64px auto; padding: 0 24px; font-family: var(--font-sans, sans-serif); color: var(--ink-70, #333); line-height: 1.65; }\n' +
    '  .crawl-fallback h1 { color: var(--ink, #111); font-weight: 600; font-size: 36px; letter-spacing: -0.025em; margin: 0 0 16px; }\n' +
    '  .crawl-fallback .sub { font-weight: 400; color: var(--accent, #C2491A); font-size: 18px; margin-bottom: 24px; }\n' +
    '  .crawl-fallback .abstract { padding: 16px 20px; background: var(--paper-alt, #efe9dd); border-left: 3px solid var(--accent, #C2491A); margin: 24px 0; }\n' +
    '  </style>\n';

  const cleanNoSlash = cleanPath.replace(/\/$/, '');
  const crawlerBody =
    '    <article class="crawl-fallback">\n' +
    '      <p style="font-family:var(--font-mono);font-size:12px;color:var(--ink-50);letter-spacing:0.12em;text-transform:uppercase;">No. ' + xmlEscape(paper.num) + ' · ' + xmlEscape(paper.tier) + '</p>\n' +
    '      <h1>' + xmlEscape(paper.title) + '</h1>\n' +
    '      <p class="sub">' + xmlEscape(paper.subtitle || '') + '</p>\n' +
    '      <div class="abstract"><strong>Abstract.</strong> ' + xmlEscape(paper.abstract || '') + '</div>\n' +
    (bodyText ? '      <pre style="white-space:pre-wrap;font-family:var(--font-sans);font-size:15px;color:var(--ink-70);">' + xmlEscape(bodyText) + '</pre>\n' : '') +
    (paper.tags && paper.tags.length ? '      <p style="font-family:var(--font-mono);font-size:11px;color:var(--ink-50);margin-top:24px;">Tags: ' + xmlEscape(paper.tags.join(', ')) + '</p>\n' : '') +
    '      <p><a href="' + xmlEscape(cleanNoSlash) + '">Open the interactive version</a></p>\n' +
    '    </article>\n';

  return '<!doctype html>\n<html lang="' + langFor(locale) + '">\n<head>\n' + head + '</head>\n<body>\n' +
    crawlerBody + handoff(cleanNoSlash, locale) + '</body>\n</html>\n';
}

const ROUTE_LABELS = {
  '': { en: 'The Velocity White Papers', fr: 'Les livres blancs Velocity', es: 'Los libros blancos Velocity' },
  index: { en: 'Index', fr: 'Index', es: 'Índice' },
  about: { en: 'About', fr: 'À propos', es: 'Acerca de' },
  press: { en: 'Press', fr: 'Presse', es: 'Prensa' },
  resources: { en: 'Resources', fr: 'Ressources', es: 'Recursos' },
  gallery: { en: 'Media', fr: 'Médias', es: 'Medios' },
  glossary: { en: 'Glossary', fr: 'Glossaire', es: 'Glosario' },
  repos: { en: 'Repositories', fr: 'Dépôts', es: 'Repositorios' },
  updates: { en: 'Updates', fr: 'Mises à jour', es: 'Actualizaciones' },
  community: { en: 'Community', fr: 'Communauté', es: 'Comunidad' },
  privacy: { en: 'Privacy', fr: 'Confidentialité', es: 'Privacidad' },
};

/* Build a static route (or the home when routeSeg === ''). */
function buildRouteHTML(routeSeg, locale, cleanPath, upPrefix) {
  const i = i18nFor(locale);
  const url = BASE + cleanPath + (cleanPath.endsWith('/') ? '' : '/');
  const lbl = (ROUTE_LABELS[routeSeg] && (ROUTE_LABELS[routeSeg][locale] || ROUTE_LABELS[routeSeg][DEF])) || routeSeg || i.title;
  const title = routeSeg ? (lbl + ' · ' + i.title) : i.title;
  const desc = i.tagline || '';
  const card = BASE + '/public/og-card.jpg';
  const hreflangs = LOCALES.map((l) =>
    '  <link rel="alternate" hreflang="' + l + '" href="' + xmlEscape(BASE + '/' + l + (routeSeg ? '/' + routeSeg : '') + '/') + '" />\n'
  ).join('') +
    '  <link rel="alternate" hreflang="x-default" href="' + xmlEscape(BASE + (routeSeg ? '/' + routeSeg : '') + '/') + '" />\n';
  const cleanNoSlash = cleanPath.replace(/\/$/, '') || '/';

  return '<!doctype html>\n<html lang="' + langFor(locale) + '">\n<head>\n' +
    '  <meta charset="utf-8" />\n' +
    '  <title>' + xmlEscape(title) + '</title>\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    '  <meta name="description" content="' + xmlEscape(desc) + '" />\n' +
    '  <link rel="canonical" href="' + xmlEscape(url) + '" />\n' +
    hreflangs +
    '  <meta property="og:type" content="website" />\n' +
    '  <meta property="og:title" content="' + xmlEscape(lbl) + '" />\n' +
    '  <meta property="og:description" content="' + xmlEscape(desc) + '" />\n' +
    '  <meta property="og:url" content="' + xmlEscape(url) + '" />\n' +
    '  <meta property="og:site_name" content="' + xmlEscape(i.title) + '" />\n' +
    '  <meta property="og:locale" content="' + ogLocaleFor(locale) + '" />\n' +
    ogImageTags(card, i.title) +
    '  <meta name="twitter:card" content="summary_large_image" />\n' +
    '  <meta name="twitter:title" content="' + xmlEscape(lbl) + '" />\n' +
    '  <meta name="twitter:description" content="' + xmlEscape(desc) + '" />\n' +
    cssLinks(upPrefix) +
    handoff(cleanNoSlash, locale) +
    '</head>\n<body>\n' +
    '  <h1>' + xmlEscape(lbl) + '</h1>\n  <p>' + xmlEscape(desc) + '</p>\n' +
    '  <p><a href="' + xmlEscape(cleanNoSlash === '/' ? '/' : cleanNoSlash) + '">Open the interactive version</a></p>\n' +
    '</body>\n</html>\n';
}

function writeFile(path, content) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content); }

/* Clean prior prerender output so removed locales/paths don't linger. */
if (CLEAN) {
  for (const d of ['paper', ...LOCALES]) {
    const p = resolve(SITE_ROOT, d);
    if (existsSync(p) && statSync(p).isDirectory()) { rmSync(p, { recursive: true, force: true }); }
  }
  console.log('Cleaned prior prerender output.');
}

const STATIC = ['index', 'about', 'press', 'resources', 'gallery', 'glossary', 'repos', 'updates', 'community', 'privacy'];
let n = 0;

for (const p of inventory) {
  for (const locale of LOCALES) {
    const contentPath = resolve(SITE_ROOT, 'data/papers/' + p.id + '.' + locale + '.json');
    const usePath = existsSync(contentPath) ? contentPath : resolve(SITE_ROOT, 'data/papers/' + p.id + '.' + DEF + '.json');
    if (!existsSync(usePath)) continue;
    const content = JSON.parse(readFileSync(usePath, 'utf8'));
    // Prefixed canonical: /<locale>/paper/<id>/  (locale/paper/id = depth 3)
    writeFile(resolve(SITE_ROOT, locale, 'paper', p.id, 'index.html'),
      buildPaperHTML(content, locale, '/' + locale + '/paper/' + p.id + '/', '../../../'));
    n++;
  }
  // Non-prefixed back-compat page served at /paper/<id>/, but canonical + og:url
  // + redirect all point to the default-locale prefixed URL so it consolidates
  // to the single canonical form rather than creating a duplicate.
  const defPath = resolve(SITE_ROOT, 'data/papers/' + p.id + '.' + DEF + '.json');
  if (existsSync(defPath)) {
    const content = JSON.parse(readFileSync(defPath, 'utf8'));
    writeFile(resolve(SITE_ROOT, 'paper', p.id, 'index.html'),
      buildPaperHTML(content, DEF, '/' + DEF + '/paper/' + p.id + '/', '../../'));
    n++;
  }
}

for (const locale of LOCALES) {
  // Localized home: /<locale>/  (depth 1)
  writeFile(resolve(SITE_ROOT, locale, 'index.html'),
    buildRouteHTML('', locale, '/' + locale + '/', '../'));
  n++;
  for (const r of STATIC) {
    // Localized route: /<locale>/<route>/  (depth 2)
    writeFile(resolve(SITE_ROOT, locale, r, 'index.html'),
      buildRouteHTML(r, locale, '/' + locale + '/' + r + '/', '../../'));
    n++;
  }
}
// Non-prefixed back-compat routes served at /<route>/, canonical → default-prefixed.
for (const r of STATIC) {
  writeFile(resolve(SITE_ROOT, r, 'index.html'), buildRouteHTML(r, DEF, '/' + DEF + '/' + r + '/', '../'));
  n++;
}

console.log('Pre-rendered ' + n + ' HTML files (' + LOCALES.length + ' locales, prefixed + back-compat).');
console.log('Base URL: ' + BASE);
