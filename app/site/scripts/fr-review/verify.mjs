#!/usr/bin/env node
/* verify.mjs — round-trip proof that the francophone corrections were ported
   into the FR JSON faithfully and completely.

   Renders the CURRENT data/papers/<id>.fr.json back to Markdown through a port
   of the site's own exporter (VWExport.blocksToMarkdown), parses both that
   rendering AND the reviewers' corrected <id>.fr.md into ordered prose units,
   and compares them unit-by-unit. A clean match means every reviewer-authored
   prose unit now lives in the JSON verbatim — nothing dropped, nothing garbled.
   Divergences are either real bugs or the known EN-drift regions.

   Usage: node scripts/fr-review/verify.mjs [--all|<id>...] [--show] */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseMd, mdPath, DOC_MAP } from './transpose.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '..', '..');

/* faithful port of VWExport.blocksToMarkdown (components/_lib/export.js) */
function stripHtml(s) { return String(s == null ? '' : s).replace(/<[^>]+>/g, ''); }
function cell(s) { return stripHtml(s).replace(/\r?\n+/g, ' ').replace(/\|/g, '\\|').trim(); }
function blocksToMarkdown(paper) {
  const L = [];
  L.push('# ' + (paper.title || ''));
  if (paper.subtitle) L.push('\n_' + stripHtml(paper.subtitle) + '_');
  const meta = [];
  if (paper.num) meta.push('**No.** ' + paper.num);
  if (paper.authors && paper.authors.length) meta.push('**Authors:** ' + paper.authors.join(', '));
  if (paper.published) meta.push('**Published:** ' + paper.published);
  if (paper.tier) meta.push('**Tier:** ' + paper.tier);
  if (paper.track) meta.push('**Track:** ' + paper.track);
  if (paper.status) meta.push('**Status:** ' + paper.status);
  if (paper.reading_min) meta.push('**Reading:** ' + paper.reading_min + ' min');
  if (paper.repo) meta.push('**Repository:** ' + paper.repo);
  if (meta.length) L.push('\n' + meta.join('  \n'));
  if (paper.tags && paper.tags.length) L.push('\n**Tags:** ' + paper.tags.join(', '));
  if (paper.abstract) { L.push('\n## Abstract\n'); L.push(stripHtml(paper.abstract)); }
  for (const b of (paper.blocks || [])) {
    switch (b.type) {
      case 'section_heading': L.push('\n## §' + (b.n || '') + ' ' + (b.title || '')); break;
      case 'paragraph': case 'dropcap_paragraph': L.push('\n' + stripHtml(b.text)); break;
      case 'pullquote': L.push('\n> ' + stripHtml(b.text) + (b.cite ? '  \n> — ' + stripHtml(b.cite) : '')); break;
      case 'keystat': L.push('\n**' + (b.label || 'Key statistic') + ': ' + (b.value != null ? b.value : '') + '**'); if (b.body) L.push('\n' + stripHtml(b.body)); break;
      case 'sidenote': L.push('\n> **' + (b.label || 'Note') + '** — ' + stripHtml(b.value)); break;
      case 'figure': { const cap = b.caption ? stripHtml(b.caption) : ''; const alt = (b.image && b.image.alt) ? stripHtml(b.image.alt) : ''; L.push('\n_Figure ' + (b.fno || '') + (b.title ? ' — ' + b.title : '') + '_'); if (cap) L.push('\n' + cap); if (alt && alt !== cap) L.push('\n<!-- image: ' + alt + ' -->'); break; }
      case 'table': { if (b.title) L.push('\n### ' + b.title); const cols = b.columns || []; if (cols.length) { L.push('\n| ' + cols.map(cell).join(' | ') + ' |'); L.push('| ' + cols.map(() => '---').join(' | ') + ' |'); for (const row of (b.rows || [])) L.push('| ' + (row || []).map(cell).join(' | ') + ' |'); } break; }
      case 'youtube': { const label = b.caption ? stripHtml(b.caption) : (b.title || 'Video'); L.push('\n**Video:** ' + label + (b.url ? ' — ' + b.url : '')); break; }
      case 'tag_row': if ((b.tags || []).length) L.push('\n**Tags:** ' + b.tags.join(', ')); break;
      case 'related': if ((paper.related || []).length) L.push('\n**Related papers:** ' + paper.related.join(', ')); break;
      default: break;
    }
  }
  return L.join('\n') + '\n';
}

/* normalize for language-faithful comparison: typographic apostrophes, dash
   variants, NBSP/thin spaces, and collapsed whitespace are all equivalent. */
function norm(s) {
  return String(s == null ? '' : s)
    .normalize('NFC')
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/[­​‌‍﻿]/g, '') /*INVIS_STRIP*/
    .replace(/[    ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function units(parsed) {
  const u = [];
  if (parsed.title) u.push(['title', parsed.title]);
  if (parsed.subtitle) u.push(['subtitle', parsed.subtitle]);
  if (parsed.abstract) u.push(['abstract', parsed.abstract]);
  for (const t of parsed.tokens) {
    if (t.kind === 'IMAGE') continue;
    if (t.kind === 'HEADING') u.push(['H', t.title]);
    else if (t.kind === 'PARA') u.push(['P', t.text]);
    else if (t.kind === 'QUOTE') u.push(['Q', t.text + ' || ' + (t.cite || '')]);
    else if (t.kind === 'KEYSTAT') u.push(['K', t.label + ': ' + t.value]);
    else if (t.kind === 'SIDENOTE') u.push(['S', t.label + ' — ' + t.value]);
    else if (t.kind === 'FIGURE') { if (t.title) u.push(['Ft', t.title]); if (t.caption) u.push(['Fc', t.caption]); if (t.alt) u.push(['Fa', t.alt]); }
    else if (t.kind === 'TABLE') u.push(['T', t.cols.join(' ¦ ') + ' :: ' + t.rows.map(r => r.join(' ¦ ')).join(' / ')]);
  }
  return u;
}

const args = process.argv.slice(2);
const show = args.includes('--show');
const ids = args.includes('--all') ? Object.values(DOC_MAP) : args.filter(a => !a.startsWith('--'));
let totMatch = 0, totUnits = 0, totDiff = 0;
for (const id of ids) {
  const frPath = resolve(SITE, 'data/papers/' + id + '.fr.json');
  const p = mdPath(id);
  if (!existsSync(frPath) || !p || !existsSync(p)) { console.log('### ' + id + ' — missing'); continue; }
  const fr = JSON.parse(readFileSync(frPath, 'utf8'));
  const rendered = parseMd(blocksToMarkdown(fr));
  const corrected = parseMd(readFileSync(p, 'utf8'));
  const A = units(rendered), B = units(corrected);
  // align B (corrected, the source of truth) against A (what's in the JSON now)
  let i = 0, j = 0, match = 0, diffs = [];
  while (j < B.length) {
    const b = B[j];
    // find b in A at or after i (exact normalized match), within a small window
    let found = -1;
    for (let k = i; k < Math.min(A.length, i + 10); k++) { if (A[k][0] === b[0] && norm(A[k][1]) === norm(b[1])) { found = k; break; } }
    if (found >= 0) { match++; i = found + 1; j++; }
    else { diffs.push(b); j++; }
  }
  totMatch += match; totUnits += B.length; totDiff += diffs.length;
  const pct = B.length ? Math.round(match / B.length * 100) : 100;
  console.log('### ' + id + '  ' + match + '/' + B.length + ' corrected units present (' + pct + '%)' + (diffs.length ? '  ⚠ ' + diffs.length + ' not found verbatim' : '  ✓ FAITHFUL'));
  if (show) for (const d of diffs.slice(0, 12)) console.log('   ⚠ [' + d[0] + '] ' + d[1].slice(0, 110));
}
console.log('\nTOTAL: ' + totMatch + '/' + totUnits + ' corrected prose units present verbatim in the FR JSON (' + Math.round(totMatch / totUnits * 100) + '%), ' + totDiff + ' not matched.');
