#!/usr/bin/env node
/* prerender.mjs — generates static HTML files for each paper and each static
   route, so crawlers and social-media preview bots see real content without
   running JavaScript.

   For each paper:
     paper/<id>/index.html       — EN landing
     paper/<id>/fr/index.html    — FR landing
   For each static route:
     <route>/index.html
     <route>/fr/index.html

   Each generated HTML:
     - has the right <title>, meta description, OG, Twitter, hreflang
     - embeds a ScholarlyArticle JSON-LD block
     - contains a <noscript>-equivalent body with the paper title, subtitle,
       abstract, sections, and a link to the JS-powered version
     - includes the Vue SPA bootstrap so JS-enabled clients hydrate on top

   Usage:
     node scripts/prerender.mjs --base https://alberta-velocity.github.io/velocity-whitepapers
*/

import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const SITE_ROOT  = resolve(__dirname, '..');

const args = process.argv.slice(2);
const baseIdx = args.indexOf('--base');
const BASE = baseIdx !== -1 ? args[baseIdx + 1] : 'https://alberta-velocity.github.io/velocity-whitepapers';
const CLEAN = args.includes('--clean');

function xmlEscape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const indexHTML = readFileSync(resolve(SITE_ROOT, 'index.html'), 'utf8');
const site = JSON.parse(readFileSync(resolve(SITE_ROOT, 'data/site.json'), 'utf8'));
const inventory = JSON.parse(readFileSync(resolve(SITE_ROOT, 'data/papers.json'), 'utf8')).papers;

function blocksToText(paper) {
  /* Strip HTML, concatenate paragraphs and headings into readable prose. */
  const lines = [];
  for (const b of (paper.blocks || [])) {
    if (b.type === 'section_heading') lines.push('\n## §' + (b.n || '') + ' ' + (b.title || ''));
    else if (b.type === 'paragraph' || b.type === 'dropcap_paragraph') {
      lines.push(String(b.text || '').replace(/<[^>]+>/g, ''));
    } else if (b.type === 'pullquote') lines.push('"' + (b.text || '') + '"' + (b.cite ? ' · ' + b.cite : ''));
    else if (b.type === 'keystat') lines.push((b.label || '') + ' ' + b.value + '. ' + (b.body || '').replace(/<[^>]+>/g, ''));
    else if (b.type === 'youtube') lines.push([b.title, b.caption, b.url ? 'Video: ' + b.url : ''].filter(Boolean).join('. '));
    else if (b.type === 'sidenote') lines.push((b.label || 'Note') + '. ' + (b.value || ''));
  }
  return lines.join('\n\n').trim();
}

function buildPaperHTML(paper, locale, otherLocale, otherPaper) {
  const lang = locale === 'fr' ? 'fr-CA' : 'en-CA';
  const ogLocale = locale === 'fr' ? 'fr_CA' : 'en_CA';
  const url = BASE + '/paper/' + paper.id + (locale === 'fr' ? '/fr/' : '/');
  const altURL = otherPaper
    ? BASE + '/paper/' + otherPaper.id + (otherLocale === 'fr' ? '/fr/' : '/')
    : url;
  const title = paper.title + ' · ' + (site.i18n[locale].title);
  const desc = (paper.abstract || paper.subtitle || '').replace(/\s+/g, ' ').trim();
  const heroSrc = paper.hero_image && paper.hero_image.src
    ? BASE + '/' + paper.hero_image.src
    : null;
  const authors = (paper.authors || []).map(a => ({ '@type': 'Person', name: a }));
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': paper.category === 'architecture' ? 'TechArticle' : 'ScholarlyArticle',
    headline: paper.title,
    description: desc,
    url,
    inLanguage: lang,
    author: authors.length ? authors : undefined,
    publisher: { '@type': 'Organization', name: site.i18n[locale].publisher },
    datePublished: paper.published || undefined,
    isPartOf: {
      '@type': 'PublicationVolume',
      name: site.i18n[locale].title,
      url: BASE + '/',
    },
    keywords: (paper.tags || []).join(', ') || undefined,
    image: heroSrc || undefined,
    about: paper.tier || undefined,
  };
  Object.keys(jsonld).forEach(k => jsonld[k] === undefined && delete jsonld[k]);

  /* Compute depth so relative asset paths still work. paper/<id>/index.html
     is two folders deep; paper/<id>/fr/index.html is three. */
  const depth = locale === 'fr' ? 3 : 2;
  const upPrefix = '../'.repeat(depth);

  const bodyText = blocksToText(paper);

  const head =
    '  <meta charset="utf-8" />\n' +
    '  <title>' + xmlEscape(title) + '</title>\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />\n' +
    '  <meta name="theme-color" content="#F7F4ED" />\n' +
    '  <meta name="description" content="' + xmlEscape(desc) + '" />\n' +
    '  <link rel="canonical" href="' + xmlEscape(url) + '" />\n' +
    '  <link rel="alternate" hreflang="en" href="' + xmlEscape(locale === 'en' ? url : altURL) + '" />\n' +
    '  <link rel="alternate" hreflang="fr" href="' + xmlEscape(locale === 'fr' ? url : altURL) + '" />\n' +
    '  <link rel="alternate" hreflang="x-default" href="' + xmlEscape(BASE + '/paper/' + paper.id + '/') + '" />\n' +
    '  <meta property="og:type" content="article" />\n' +
    '  <meta property="og:title" content="' + xmlEscape(paper.title) + '" />\n' +
    '  <meta property="og:description" content="' + xmlEscape(desc) + '" />\n' +
    '  <meta property="og:url" content="' + xmlEscape(url) + '" />\n' +
    '  <meta property="og:site_name" content="' + xmlEscape(site.i18n[locale].title) + '" />\n' +
    '  <meta property="og:locale" content="' + ogLocale + '" />\n' +
    (heroSrc ? '  <meta property="og:image" content="' + xmlEscape(heroSrc) + '" />\n' : '') +
    (paper.published ? '  <meta property="article:published_time" content="' + xmlEscape(paper.published) + '" />\n' : '') +
    (paper.tier ? '  <meta property="article:section" content="' + xmlEscape(paper.tier) + '" />\n' : '') +
    '  <meta name="twitter:card" content="summary_large_image" />\n' +
    '  <meta name="twitter:title" content="' + xmlEscape(paper.title) + '" />\n' +
    '  <meta name="twitter:description" content="' + xmlEscape(desc) + '" />\n' +
    (heroSrc ? '  <meta name="twitter:image" content="' + xmlEscape(heroSrc) + '" />\n' : '') +
    '  <script type="application/ld+json">' + JSON.stringify(jsonld) + '</script>\n' +
    '  <link rel="preconnect" href="https://fonts.googleapis.com">\n' +
    '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
    '  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">\n' +
    '  <link rel="icon" type="image/webp" href="' + upPrefix + 'alberta-logo.webp" />\n' +
    '  <link rel="stylesheet" href="' + upPrefix + 'styles/tokens.css" />\n' +
    '  <link rel="stylesheet" href="' + upPrefix + 'styles/base.css" />\n' +
    '  <link rel="stylesheet" href="' + upPrefix + 'styles/components.css" />\n' +
    '  <link rel="stylesheet" href="' + upPrefix + 'styles/player.css" />\n' +
    '  <link rel="stylesheet" href="' + upPrefix + 'styles/visuals.css" />\n' +
    '  <style>.crawl-fallback { max-width: 760px; margin: 64px auto; padding: 0 24px; font-family: var(--font-sans); color: var(--ink-70); line-height: 1.65; }\n' +
    '  .crawl-fallback h1 { color: var(--ink); font-weight: 600; font-size: 36px; letter-spacing: -0.025em; margin: 0 0 16px; }\n' +
    '  .crawl-fallback .sub { font-weight: 400; color: var(--accent); font-size: 18px; margin-bottom: 24px; }\n' +
    '  .crawl-fallback h2 { color: var(--ink); font-weight: 600; font-size: 22px; margin: 32px 0 12px; }\n' +
    '  .crawl-fallback .abstract { padding: 16px 20px; background: var(--paper-alt); border-left: 3px solid var(--accent); margin: 24px 0; }\n' +
    '  </style>\n';

  const crawlerBody =
    '    <article class="crawl-fallback">\n' +
    '      <p style="font-family:var(--font-mono);font-size:12px;color:var(--ink-50);letter-spacing:0.12em;text-transform:uppercase;">No. ' + xmlEscape(paper.num) + ' · ' + xmlEscape(paper.tier) + '</p>\n' +
    '      <h1>' + xmlEscape(paper.title) + '</h1>\n' +
    '      <p class="sub">' + xmlEscape(paper.subtitle || '') + '</p>\n' +
    '      <div class="abstract"><strong>Abstract.</strong> ' + xmlEscape(paper.abstract || '') + '</div>\n' +
    (bodyText
      ? '      <pre style="white-space:pre-wrap;font-family:var(--font-sans);font-size:15px;color:var(--ink-70);">' + xmlEscape(bodyText) + '</pre>\n'
      : '') +
    (paper.tags && paper.tags.length
      ? '      <p style="font-family:var(--font-mono);font-size:11px;color:var(--ink-50);margin-top:24px;">Tags: ' + xmlEscape(paper.tags.join(', ')) + '</p>\n'
      : '') +
    '      <p><a href="' + xmlEscape(upPrefix) + 'index.html#/paper/' + xmlEscape(paper.id) + '">Open the interactive version</a></p>\n' +
    '    </article>\n';

  /* On JS-capable clients, hand off to the SPA at the right route. */
  const handoff =
    '  <script>\n' +
    '    (function () {\n' +
    '      try {\n' +
    '        if (window.localStorage) localStorage.setItem("vw_locale", "' + locale + '");\n' +
    '      } catch (e) {}\n' +
    '      window.location.replace("' + upPrefix + 'index.html#/paper/' + paper.id + '");\n' +
    '    })();\n' +
    '  </script>\n';

  return '<!doctype html>\n' +
         '<html lang="' + lang + '">\n' +
         '<head>\n' + head + '</head>\n' +
         '<body>\n' +
         crawlerBody +
         handoff +
         '</body>\n' +
         '</html>\n';
}

function buildStaticRouteHTML(routeSegment, locale) {
  const lang = locale === 'fr' ? 'fr-CA' : 'en-CA';
  const ogLocale = locale === 'fr' ? 'fr_CA' : 'en_CA';
  const i = site.i18n[locale];
  const url = BASE + '/' + routeSegment + (locale === 'fr' ? '/fr/' : '/');
  const depth = locale === 'fr' ? 2 : 1;
  const upPrefix = '../'.repeat(depth);
  const labels = {
    index: { title: locale === 'fr' ? 'Index' : 'Index' },
    about: { title: locale === 'fr' ? 'À propos' : 'About' },
    glossary: { title: locale === 'fr' ? 'Glossaire' : 'Glossary' },
    repos: { title: locale === 'fr' ? 'Dépôts' : 'Repositories' },
    updates: { title: locale === 'fr' ? 'Mises à jour' : 'Updates' },
    community: { title: locale === 'fr' ? 'Communauté' : 'Community' },
  };
  const lbl = labels[routeSegment] || { title: routeSegment };
  const title = lbl.title + ' · ' + i.title;
  const desc = i.tagline;

  return '<!doctype html>\n' +
         '<html lang="' + lang + '">\n' +
         '<head>\n' +
         '  <meta charset="utf-8" />\n' +
         '  <title>' + xmlEscape(title) + '</title>\n' +
         '  <meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
         '  <meta name="description" content="' + xmlEscape(desc) + '" />\n' +
         '  <link rel="canonical" href="' + xmlEscape(url) + '" />\n' +
         '  <link rel="alternate" hreflang="en" href="' + xmlEscape(BASE + '/' + routeSegment + '/') + '" />\n' +
         '  <link rel="alternate" hreflang="fr" href="' + xmlEscape(BASE + '/' + routeSegment + '/fr/') + '" />\n' +
         '  <meta property="og:type" content="website" />\n' +
         '  <meta property="og:title" content="' + xmlEscape(lbl.title) + '" />\n' +
         '  <meta property="og:description" content="' + xmlEscape(desc) + '" />\n' +
         '  <meta property="og:url" content="' + xmlEscape(url) + '" />\n' +
         '  <meta property="og:locale" content="' + ogLocale + '" />\n' +
         '  <meta name="twitter:card" content="summary_large_image" />\n' +
         '  <script>\n' +
         '    (function () {\n' +
         '      try { if (window.localStorage) localStorage.setItem("vw_locale", "' + locale + '"); } catch (e) {}\n' +
         '      window.location.replace("' + upPrefix + 'index.html#/' + routeSegment + '");\n' +
         '    })();\n' +
         '  </script>\n' +
         '</head>\n' +
         '<body>\n' +
         '  <h1>' + xmlEscape(lbl.title) + '</h1>\n' +
         '  <p>' + xmlEscape(desc) + '</p>\n' +
         '  <p><a href="' + xmlEscape(upPrefix) + 'index.html#/' + routeSegment + '">Open the interactive version</a></p>\n' +
         '</body>\n' +
         '</html>\n';
}

function safeMkdir(p) { mkdirSync(p, { recursive: true }); }

function writeFile(path, content) {
  safeMkdir(dirname(path));
  writeFileSync(path, content);
}

if (CLEAN) {
  const paperDir = resolve(SITE_ROOT, 'paper');
  if (existsSync(paperDir) && statSync(paperDir).isDirectory()) {
    rmSync(paperDir, { recursive: true, force: true });
    console.log('Cleaned paper/ directory');
  }
}

let n = 0;
const localeByID = Object.fromEntries(inventory.map(p => [p.id, p]));
for (const p of inventory) {
  for (const locale of ['en', 'fr']) {
    const dir = locale === 'fr'
      ? resolve(SITE_ROOT, 'paper', p.id, 'fr')
      : resolve(SITE_ROOT, 'paper', p.id);
    const contentPath = resolve(SITE_ROOT, 'data/papers/' + p.id + '.' + locale + '.json');
    if (!existsSync(contentPath)) continue;
    const content = JSON.parse(readFileSync(contentPath, 'utf8'));
    const html = buildPaperHTML(content, locale, locale === 'en' ? 'fr' : 'en', p);
    writeFile(resolve(dir, 'index.html'), html);
    n++;
  }
}

const STATIC = ['index', 'about', 'glossary', 'repos', 'updates', 'community'];
for (const r of STATIC) {
  for (const locale of ['en', 'fr']) {
    const dir = locale === 'fr'
      ? resolve(SITE_ROOT, r, 'fr')
      : resolve(SITE_ROOT, r);
    writeFile(resolve(dir, 'index.html'), buildStaticRouteHTML(r, locale));
    n++;
  }
}

console.log('Pre-rendered ' + n + ' HTML files under paper/ and route directories.');
console.log('Base URL: ' + BASE);
