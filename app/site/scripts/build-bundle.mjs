/* build-bundle.mjs — concatenates JS and CSS into single bundled files so the
   browser fetches a handful of files instead of 40+. Also fingerprints the
   bundle filenames with a short content hash so deployed assets can be cached
   for a long time (the filename changes when the content changes).

   Outputs:
     app.bundle.[hash].js          — all components + pages + app bootstrap
     app.bundle.[hash].css         — tokens + base + components + player + visuals
     index.dist.html               — uses the bundled assets (review before replace)

   Usage:
     npm run build:bundle                # writes bundles + index.dist.html
     npm run build:bundle -- --replace   # also overwrites index.html
     npm run build:bundle -- --no-hash   # omit fingerprint (predictable names)
*/

import { readFileSync, writeFileSync, statSync, existsSync, readdirSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const SITE = resolve(__dirname, '..');

const args = process.argv.slice(2);
const REPLACE = args.includes('--replace');
const NO_HASH = args.includes('--no-hash');

/* --- JS bundle ---------------------------------------------------- */
const JS_FILES = [
  'components/_lib/a11y.js',
  'components/_lib/meta.js',
  'components/visuals/_lib/anim.js',
  'components/visuals/_lib/registry.js',
  'components/visuals/reusable/TileHeatmap.js',
  'components/AppNav.js',
  'components/AppFooter.js',
  'components/StatRail.js',
  'components/PaperCard.js',
  'components/LibraryGrid.js',
  'components/IndexTable.js',
  'components/PaperDetail.js',
  'components/ArchitectureDiagram.js',
  'components/MiniChart.js',
  'components/PullQuote.js',
  'components/KeyStat.js',
  'components/Figure.js',
  'components/Table.js',
  'components/SideNote.js',
  'components/RelatedPapers.js',
  'components/TagRow.js',
  'components/AudioPlayer.js',
  'components/ImageInspector.js',
  'components/PresentationStage.js',
  'components/PresentationPlayer.js',
  'components/BlockRenderer.js',
  'components/PaperDownloads.js',
  'components/KeyboardShortcuts.js',
  /* Editor components ship in prod but stay dormant: the toolbar only activates
     when /api/edit-status confirms a local edit-server, which never exists on
     the public host. They are in the bundle so the repo and prod match. */
  'components/EditMode.js',
  'components/EditableText.js',
  'components/EditPanels.js',
  'components/TldrEditor.js',
  'pages/LibraryPage.js',
  'pages/IndexPage.js',
  'pages/ArchitecturePage.js',
  'pages/PaperPage.js',
  'pages/AboutPage.js',
  'pages/ManualPage.js',
  'pages/GlossaryPage.js',
  'pages/ReposPage.js',
  'pages/UpdatesPage.js',
  'pages/CommunityPage.js',
  'pages/NotFoundPage.js',
  'app.js',
];

const CSS_FILES = [
  'styles/tokens.css',
  'styles/base.css',
  'styles/components.css',
  'styles/player.css',
  'styles/visuals.css',
  'styles/manual.css',
  'styles/edit.css',
];

function concat(files) {
  const buf = [];
  let total = 0;
  for (const f of files) {
    const p = resolve(SITE, f);
    if (!existsSync(p)) { console.warn('  missing ' + f); continue; }
    total += statSync(p).size;
    buf.push('/* ===== ' + f + ' ===== */');
    buf.push(readFileSync(p, 'utf8').trim());
    buf.push('');
  }
  return { src: buf.join('\n'), total };
}

function minifyJS(src) {
  src = src.replace(/\/\*[\s\S]*?\*\//g, '');
  src = src.replace(/(^|[^:])\/\/[^\n\r]*/g, '$1');
  src = src.replace(/\n{3,}/g, '\n\n');
  return src;
}

function minifyCSS(src) {
  src = src.replace(/\/\*[\s\S]*?\*\//g, '');
  /* Collapse runs of whitespace, but keep newlines so it's still diffable. */
  src = src.replace(/[ \t]+/g, ' ');
  src = src.replace(/\s*([{}:;,])\s*/g, '$1');
  src = src.replace(/;}/g, '}');
  src = src.replace(/\n{2,}/g, '\n');
  return src.trim();
}

function hash8(s) {
  return createHash('sha1').update(s).digest('hex').slice(0, 8);
}

/* Wipe any prior fingerprinted bundles. */
for (const f of readdirSync(SITE)) {
  if (/^app\.bundle(\.[a-f0-9]+)?\.(js|css)$/.test(f)) {
    try { unlinkSync(resolve(SITE, f)); } catch {}
  }
}

const js  = minifyJS(concat(JS_FILES).src);
const css = minifyCSS(concat(CSS_FILES).src);

const jsHash  = NO_HASH ? '' : '.' + hash8(js);
const cssHash = NO_HASH ? '' : '.' + hash8(css);
const jsName  = 'app.bundle' + jsHash + '.js';
const cssName = 'app.bundle' + cssHash + '.css';

writeFileSync(resolve(SITE, jsName), js);
writeFileSync(resolve(SITE, cssName), css);

console.log('Bundled ' + JS_FILES.length + ' JS files → ' + jsName + ' (' + (js.length/1024).toFixed(1) + ' KB)');
console.log('Bundled ' + CSS_FILES.length + ' CSS files → ' + cssName + ' (' + (css.length/1024).toFixed(1) + ' KB)');

/* Build the distilled index.html. Strip the individual <script defer src=...>
   tags and the individual <link rel="stylesheet">, replace with one of each. */
const indexSrc = readFileSync(resolve(SITE, 'index.html'), 'utf8');
let dist = indexSrc;

/* Remove individual stylesheet links to local styles/ files. */
dist = dist.replace(/  <link rel="stylesheet" href="styles\/[^"]+\.css" \/>\s*\n/g, '');
/* Inject the bundled stylesheet link just before the deferred Vue script tag.
   This works regardless of whether the index uses the async-font pattern or
   the older blocking <link rel="stylesheet" href="fonts.googleapis…"> form. */
const cssLinkTag = '\n  <link rel="stylesheet" href="' + cssName + '" />';
if (/<\/noscript>/.test(dist)) {
  dist = dist.replace(/(<\/noscript>)/, '$1' + cssLinkTag);
} else {
  dist = dist.replace(/(<script defer src="https:\/\/unpkg\.com)/, cssLinkTag + '\n  $1');
}

/* Remove individual JS script tags + their comments, replace with one. */
dist = dist.replace(
  /<!-- Vue and all our scripts use defer[\s\S]*?<script defer src="app\.js"><\/script>/m,
  '<script defer src="https://unpkg.com/vue@3.5.13/dist/vue.global.prod.js"></script>\n  <script defer src="' + jsName + '"></script>'
);
/* Drop any comment-only lines left over between scripts. */
dist = dist.replace(/\n  <!-- (Accessibility helpers|Meta tag|Visuals shared|Reusable visuals|Components|Pages|App bootstrap)[^\n]*-->\n/g, '\n');

const distPath = resolve(SITE, REPLACE ? 'index.html' : 'index.dist.html');
writeFileSync(distPath, dist);

console.log('  Wrote ' + (REPLACE ? 'index.html (REPLACED)' : 'index.dist.html'));
if (!REPLACE) console.log('  Review then re-run with --replace to apply.');
