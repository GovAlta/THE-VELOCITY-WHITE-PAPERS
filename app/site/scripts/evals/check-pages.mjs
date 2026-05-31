#!/usr/bin/env node
/* check-pages.mjs — universal page eval.

   Walks every reachable URL in the site (static routes, every paper in every
   locale, the pre-rendered HTML versions, sitemap, robots) and runs a battery
   of assertions on each:

   - HTTP 200
   - HTML parses (basic structural shape)
   - <html lang> set
   - exactly one <h1>
   - <title> non-empty
   - <meta name="description"> present
   - <main> landmark present
   - Pre-rendered paper pages: JSON-LD ScholarlyArticle / TechArticle block
   - Pre-rendered paper pages: hreflang en + fr alternates
   - sitemap.xml is valid XML
   - robots.txt references sitemap
   - No raw "{{ ... }}" Vue template placeholders leak through

   Runs against a local http-server started on a free port; tears down when
   done. Reports pass/fail per URL with line-level failure detail.

   Usage:
     npm run eval:pages                       # default port (auto)
     node scripts/evals/check-pages.mjs --port 5190
     node scripts/evals/check-pages.mjs --base http://localhost:5181   # use a running server
*/

import { readFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const SITE = resolve(__dirname, '../..');

const args = process.argv.slice(2);
const portIdx = args.indexOf('--port');
const port = portIdx !== -1 ? parseInt(args[portIdx + 1], 10) : 5199;
const baseIdx = args.indexOf('--base');
const externalBase = baseIdx !== -1 ? args[baseIdx + 1] : null;
/* Use 127.0.0.1 not "localhost" — on Windows localhost resolves to IPv6 first
   and most static-file servers bind IPv4 only. */
const BASE = externalBase || ('http://127.0.0.1:' + port);

let serverProc = null;
async function startServer() {
  if (externalBase) return;
  serverProc = spawn('npx', ['--yes', 'http-server', '-p', String(port), '-a', '127.0.0.1', '-c-1', '.'], {
    cwd: SITE,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });
  /* Wait for the server to be reachable (poll up to 8 seconds). */
  for (let i = 0; i < 16; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const r = await fetch(BASE + '/index.html');
      if (r.ok) return;
    } catch { /* not ready yet */ }
  }
  throw new Error('Could not reach http-server at ' + BASE);
}
async function stopServer() {
  if (serverProc) {
    try { serverProc.kill('SIGTERM'); } catch {}
  }
}

/* ------- assertions ------- */

const failures = [];
const warnings = [];

function fail(url, msg)  { failures.push({ url, msg }); }
function warn(url, msg)  { warnings.push({ url, msg }); }

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.text();
}

function present(html, re, label, url) {
  if (!re.test(html)) fail(url, label + ' — pattern not found: ' + re.source);
}

function notPresent(html, re, label, url) {
  if (re.test(html)) fail(url, label + ' — unexpected match: ' + re.source);
}

function countMatches(html, re) {
  const matches = html.match(re);
  return matches ? matches.length : 0;
}

/* Spa pages — those served by the bare index.html via hash routing. We can
   only assert the shell shape (real content is rendered by JS post-load). */
async function checkSpaPage(path, name) {
  const url = BASE + path;
  let html;
  try { html = await fetchText(url); }
  catch (e) { fail(url, name + ': ' + e.message); return; }

  present(html, /<html lang="/i,                       'html lang attribute',  url);
  present(html, /<title>[^<]+<\/title>/i,              'non-empty title',      url);
  present(html, /<meta name="description"/i,           'meta description',     url);
  present(html, /<main /i,                             '<main> landmark',      url);
  present(html, /<a href="#main-content"/i,            'skip-to-content link', url);
  present(html, /id="vw-announce"/i,                   'a11y live region',     url);
  present(html, /<script[^>]+vue\.global/i,            'Vue script loaded',    url);
  present(html, /app\.bundle\.[a-f0-9]+\.js|app\.js/i, 'bundle or app.js loaded', url);
  notPresent(html, /\{\{\s*[^}]+\s*\}\}/,              'unrendered Vue placeholder', url);
}

/* Pre-rendered paper pages — should have real <h1>, <noscript>-style body,
   JSON-LD, full OG/Twitter cards, hreflang alternates. */
async function checkPaperHTML(path, paperId, locale) {
  const url = BASE + path;
  let html;
  try { html = await fetchText(url); }
  catch (e) { fail(url, 'paper HTML: ' + e.message); return; }

  present(html, new RegExp('<html lang="' + (locale === 'fr' ? 'fr-CA' : 'en-CA') + '"', 'i'),
                                                       'html lang matches locale', url);
  present(html, /<title>[^<]+—[^<]+<\/title>/i,        'title includes site name', url);
  present(html, /<meta name="description" content="[^"]{40,}"/i, 'description ≥40 chars', url);
  present(html, /<link rel="canonical"/i,              'canonical link',       url);
  present(html, /hreflang="en"/i,                      'hreflang en alternate', url);
  present(html, /hreflang="fr"/i,                      'hreflang fr alternate', url);
  present(html, /property="og:title"/i,                'og:title',             url);
  present(html, /property="og:description"/i,          'og:description',       url);
  present(html, /property="og:type" content="article"/i, 'og:type=article',    url);
  present(html, /name="twitter:card"/i,                'twitter:card',         url);
  present(html, /application\/ld\+json/i,              'JSON-LD block',        url);
  present(html, /"@type":"(ScholarlyArticle|TechArticle)"/i, 'ScholarlyArticle schema', url);
  /* Body content visible without JS */
  present(html, /<h1>[^<]+<\/h1>/i,                    'visible <h1>',         url);
  present(html, /class="abstract"|class="crawl-fallback"/i, 'crawler-visible body', url);
  /* Exactly one h1 per page. */
  const h1count = countMatches(html, /<h1[^>]*>/gi);
  if (h1count !== 1) fail(url, 'expected exactly one <h1>, found ' + h1count);
}

async function checkSitemap() {
  const url = BASE + '/sitemap.xml';
  let xml;
  try { xml = await fetchText(url); }
  catch (e) { fail(url, 'sitemap: ' + e.message); return; }
  present(xml, /<urlset/i,                       'urlset element',       url);
  present(xml, /xmlns:xhtml/i,                   'xhtml namespace',      url);
  present(xml, /hreflang="en"/i,                 'hreflang en',          url);
  present(xml, /hreflang="fr"/i,                 'hreflang fr',          url);
  const urlCount = countMatches(xml, /<url>/g);
  if (urlCount < 5) fail(url, 'sitemap has too few <url> entries: ' + urlCount);
}

async function checkRobots() {
  const url = BASE + '/robots.txt';
  let txt;
  try { txt = await fetchText(url); }
  catch (e) { fail(url, 'robots: ' + e.message); return; }
  present(txt, /User-agent:/i,    'User-agent rule', url);
  present(txt, /Sitemap:/i,       'Sitemap reference', url);
}

async function check404() {
  const url = BASE + '/404.html';
  let html;
  try { html = await fetchText(url); }
  catch (e) { fail(url, '404.html: ' + e.message); return; }
  present(html, /not-found|redirect/i, '404 redirect mechanism', url);
}

/* ------- runner ------- */

async function main() {
  await startServer();
  try {
    /* SPA shell + every static route */
    const spa = [
      ['/index.html',          'library (root)'],
      ['/#/index',             'index'],
      ['/#/architecture',      'architecture'],
      ['/#/about',             'about'],
      ['/#/glossary',          'glossary'],
      ['/#/repos',             'repos'],
      ['/#/updates',           'updates'],
      ['/#/community',         'community'],
      ['/#/not-found',         '404 route'],
    ];
    for (const [p, name] of spa) await checkSpaPage(p, name);

    /* 404 fallback and sitemap/robots */
    await check404();
    await checkSitemap();
    await checkRobots();

    /* Pre-rendered paper HTML (skips if not built) */
    const papers = JSON.parse(readFileSync(resolve(SITE, 'data/papers.json'), 'utf8')).papers;
    for (const p of papers) {
      for (const locale of ['en', 'fr']) {
        const path = locale === 'fr'
          ? '/paper/' + p.id + '/fr/'
          : '/paper/' + p.id + '/';
        const file = resolve(SITE, 'paper', p.id, locale === 'fr' ? 'fr' : '', 'index.html');
        if (!existsSync(file)) {
          warn(BASE + path, 'pre-rendered HTML not generated yet (run npm run build:prerender)');
          continue;
        }
        await checkPaperHTML(path + 'index.html', p.id, locale);
      }
    }
  } finally {
    await stopServer();
  }

  /* ------- report ------- */
  if (warnings.length) {
    console.warn('Warnings (' + warnings.length + ', advisory):');
    for (const w of warnings.slice(0, 30)) console.warn('  ' + w.url + ': ' + w.msg);
    if (warnings.length > 30) console.warn('  …and ' + (warnings.length - 30) + ' more.');
    console.warn('');
  }
  if (failures.length) {
    console.error('FAIL: ' + failures.length + ' page checks failed.');
    const grouped = {};
    for (const f of failures) (grouped[f.url] = grouped[f.url] || []).push(f.msg);
    for (const url of Object.keys(grouped)) {
      console.error('  ' + url);
      for (const m of grouped[url]) console.error('    · ' + m);
    }
    process.exit(1);
  }
  console.log('OK: every reachable page passes structural checks.');
}

main().catch(e => {
  console.error('Unhandled error: ' + e.message);
  process.exit(2);
});
