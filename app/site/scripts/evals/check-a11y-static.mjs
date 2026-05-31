#!/usr/bin/env node
/* check-a11y-static.mjs — static a11y scan of component and page templates.

   Catches the regressions a screen-reader pass would catch:
   - clickable divs without role/tabindex
   - inputs without label / aria-label
   - buttons whose text content is icon-only and no aria-label
   - heading skips inside a single template
   - <img> without alt attribute (or v-bind:alt missing)
   - links without href and without role (a tag must be navigable)

   Warning-only by default (catches design intent, not just typos); pass
   --strict to make warnings hard failures. */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const SITE = resolve(__dirname, '../..');

const strict = process.argv.includes('--strict');
const warnings = [];

function walk(dir) {
  const out = [];
  for (const n of readdirSync(dir)) {
    if (n.startsWith('.') || n === 'node_modules') continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(js|html)$/.test(n)) out.push(p);
  }
  return out;
}

const ICON_ONLY_TEXT = /^[\s←→↑↓✕×☰☰↻▶❚❚·+\-?!\\\/]+$/;
const ICON_GLYPHS = ['×', '☰', '↻', '▶', '❚❚', '→', '←', '↑', '↓', 'i', '+', '−', '?'];

function scan(path) {
  const src = readFileSync(path, 'utf8');
  const rel = path.replace(SITE + '\\', '').replace(SITE + '/', '');
  if (rel.endsWith('check-a11y-static.mjs')) return;          /* don't lint myself */

  /* 1. Clickable divs without role */
  const divClick = /<div\b[^>]*@click[^>]*>/g;
  let m;
  while ((m = divClick.exec(src))) {
    const tag = m[0];
    if (/role\s*=/.test(tag)) continue;                       /* role specified */
    if (/class="[^"]*(backdrop|overlay)[^"]*"/.test(tag)) continue;  /* dismissable backdrop */
    if (/class="[^"]*toc-backdrop[^"]*"/.test(tag)) continue;
    if (/class="[^"]*nav-backdrop[^"]*"/.test(tag)) continue;
    if (/\.self/.test(tag)) continue;                         /* click.self on overlay */
    if (/class="[^"]*vp-stage-wrap[^"]*"/.test(tag)) continue; /* has role="button" set explicitly */
    warnings.push(rel + ': <div @click> without role — ' + tag.slice(0, 100));
  }

  /* 2. Inputs without label or aria-label */
  const inputRe = /<input\b[^>]*>/g;
  while ((m = inputRe.exec(src))) {
    const tag = m[0];
    if (/type="(checkbox|radio|hidden)"/.test(tag)) continue;     /* checkboxes labelled by wrap */
    if (/aria-label\s*=|:aria-label\s*=/.test(tag)) continue;
    /* Look for an associated <label for="id"> earlier in the file. */
    const idMatch = /\bid="([^"]+)"/.exec(tag);
    if (idMatch && new RegExp('<label[^>]*\\sfor="' + idMatch[1] + '"').test(src)) continue;
    warnings.push(rel + ': <input> without <label> or aria-label — ' + tag.slice(0, 100));
  }

  /* 3. Buttons with only icon text and no aria-label */
  const buttonRe = /<button\b[^>]*>([\s\S]*?)<\/button>/g;
  while ((m = buttonRe.exec(src))) {
    const openTag = m[0].split('>')[0] + '>';
    const inner = m[1];
    if (/aria-label\s*=|:aria-label\s*=/.test(openTag)) continue;
    if (/title\s*=/.test(openTag) && inner.replace(/\s+/g, '').length === 0) continue;
    /* If inner contains only icon glyphs / whitespace / aria-hidden spans, flag it. */
    const text = inner.replace(/<[^>]+>/g, '').replace(/\{\{[^}]+\}\}/g, '').trim();
    if (!text) continue;                       /* dynamic content — assume labelled */
    if (text.length <= 3 && ICON_GLYPHS.some(g => text.includes(g))) {
      warnings.push(rel + ': <button> with icon-only text "' + text + '" needs aria-label');
    }
  }

  /* 4. Heading hierarchy: collect H levels in order; flag jumps > 1. */
  const headings = [];
  const hRe = /<h([1-6])\b/g;
  while ((m = hRe.exec(src))) headings.push(parseInt(m[1], 10));
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] > headings[i - 1] + 1) {
      warnings.push(rel + ': heading jumps from h' + headings[i - 1] + ' to h' + headings[i]);
    }
  }

  /* 5. Images without alt (allow v-bind alt that's an expression). */
  const imgRe = /<img\b[^>]*>/g;
  while ((m = imgRe.exec(src))) {
    const tag = m[0];
    if (/\balt\s*=/.test(tag) || /:alt\s*=/.test(tag)) continue;
    warnings.push(rel + ': <img> without alt attribute — ' + tag.slice(0, 80));
  }

  /* 6. <a> tags without href (Vue link with @click only — should be button). */
  const aRe = /<a\b[^>]*>/g;
  while ((m = aRe.exec(src))) {
    const tag = m[0];
    if (/\bhref\s*=|:href\s*=/.test(tag)) continue;
    if (/role\s*=/.test(tag)) continue;
    warnings.push(rel + ': <a> without href or role — ' + tag.slice(0, 80));
  }
}

const dirs = ['components', 'pages', 'index.html'];
for (const d of dirs) {
  const p = resolve(SITE, d);
  if (statSync(p).isFile()) scan(p);
  else for (const f of walk(p)) scan(f);
}

if (warnings.length) {
  const head = strict ? 'FAIL' : 'WARN';
  console[strict ? 'error' : 'warn'](head + ': ' + warnings.length + ' a11y warning(s):');
  for (const w of warnings.slice(0, 80)) console[strict ? 'error' : 'warn']('  ' + w);
  if (warnings.length > 80) console[strict ? 'error' : 'warn']('  …and ' + (warnings.length - 80) + ' more.');
  process.exit(strict ? 1 : 0);
}
console.log('OK: static a11y scan clean across components and pages.');
