#!/usr/bin/env node
/* build-sitemap.mjs — generates sitemap.xml and robots.txt.

   Reads data/papers.json and data/site.json, emits one sitemap entry per
   reachable route per locale with proper hreflang alternates.

   Usage:
     node scripts/build-sitemap.mjs --base https://alberta-velocity.github.io/velocity-whitepapers
     node scripts/build-sitemap.mjs --base https://example.com/whitepapers
*/

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const SITE_ROOT  = resolve(__dirname, '..');

const args = process.argv.slice(2);
const baseIdx = args.indexOf('--base');
const baseURL = baseIdx !== -1 ? args[baseIdx + 1] : 'https://alberta-velocity.github.io/velocity-whitepapers';

if (!baseURL || !/^https?:\/\//.test(baseURL)) {
  console.error('Pass --base <site URL>, e.g. https://example.com');
  process.exit(1);
}

const papers = JSON.parse(readFileSync(resolve(SITE_ROOT, 'data/papers.json'), 'utf8')).papers;
const site = JSON.parse(readFileSync(resolve(SITE_ROOT, 'data/site.json'), 'utf8'));
const LOCALES = (site.locales || [{ code: 'en' }]).map((l) => l.code);
const DEF = site.default_locale || LOCALES[0] || 'en';

/* Static routes that are always present. */
const STATIC_ROUTES = ['', 'index', 'about', 'press', 'resources', 'gallery', 'glossary', 'repos', 'updates', 'community', 'privacy'];

/* URLs are always locale-prefixed (/en/…, /fr/…, /es/…) — the site's single
   canonical form. <loc> uses the default-locale prefix; alternates cover every
   locale, and x-default points at the prefix-less back-compat path. */
function prefixed(routeSegment, locale) {
  return baseURL + '/' + locale + (routeSegment ? '/' + routeSegment : '') + '/';
}
function xdefault(routeSegment) {
  return baseURL + (routeSegment ? '/' + routeSegment : '') + '/';
}

function urlEntry(routeSegment, lastmod) {
  const lines = [];
  lines.push('  <url>');
  lines.push('    <loc>' + xmlEscape(prefixed(routeSegment, DEF)) + '</loc>');
  if (lastmod) lines.push('    <lastmod>' + lastmod + '</lastmod>');
  for (const l of LOCALES) {
    lines.push('    <xhtml:link rel="alternate" hreflang="' + l + '" href="' + xmlEscape(prefixed(routeSegment, l)) + '"/>');
  }
  lines.push('    <xhtml:link rel="alternate" hreflang="x-default" href="' + xmlEscape(xdefault(routeSegment)) + '"/>');
  lines.push('  </url>');
  return lines.join('\n');
}

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const today = new Date().toISOString().slice(0, 10);
const entries = [];

for (const r of STATIC_ROUTES) entries.push(urlEntry(r, today));
for (const p of papers) {
  if (p.status === 'Placeholder') continue;
  entries.push(urlEntry('paper/' + p.id, p.published || today));
}

const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
  '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
  entries.join('\n') + '\n' +
  '</urlset>\n';

const sitemapPath = resolve(SITE_ROOT, 'sitemap.xml');
writeFileSync(sitemapPath, sitemap);

const robots =
  'User-agent: *\n' +
  'Allow: /\n' +
  '\n' +
  '# AI crawlers — opted in. Add per-bot disallow rules here if needed.\n' +
  'User-agent: GPTBot\n' +
  'Allow: /\n' +
  'User-agent: ClaudeBot\n' +
  'Allow: /\n' +
  'User-agent: PerplexityBot\n' +
  'Allow: /\n' +
  '\n' +
  'Sitemap: ' + baseURL + '/sitemap.xml\n';

const robotsPath = resolve(SITE_ROOT, 'robots.txt');
writeFileSync(robotsPath, robots);

console.log('Wrote sitemap.xml (' + entries.length + ' URLs) and robots.txt');
console.log('Base URL: ' + baseURL);
