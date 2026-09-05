#!/usr/bin/env node
/* sweep-i18n.mjs — extend the FR lexicon + Canadian apostrophe normalization to
   the NON-paper French surfaces the reviewers never saw and the paper sweep
   didn't cover: the site pages, the bilingual sim datasets, the canvas, the
   glossary, and site.json.

   Bilingual-aware: in {en,fr} / en:{} / fr:{} structures it touches ONLY the
   French side (never the English). For *.fr.json (pure-French page files) it
   treats every string as French. Same surgical rules as sweep.mjs: only the
   unambiguous lexicon term errors + straight→curly apostrophes between letters,
   never asset paths / ids / image prompts / English.

   Usage: node scripts/fr-review/sweep-i18n.mjs [--write] */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '..', '..');
const write = process.argv.includes('--write');

/* only the lexicon term errors that are unambiguous in any context */
const TERM_FIXES = [
  [/contrôles cybernétiques/g, 'contrôles de cybersécurité'],
  [/contrôle cybernétique/g, 'contrôle de cybersécurité'],
  [/groupes criminels à motivation financière/g, 'groupes criminels motivés par des gains financiers'],
  [/pilotée par l[’']IA/g, 'appuyée par l’IA'],
  [/piloté par l[’']IA/g, 'appuyé par l’IA'],
];
const SKIP_KEYS = new Set(['src', 'image_prompt', 'style_kind', 'audio_file', 'url', 'id', 'repo', 'kind', 'visual', 'sim', 'owner_id', 'locale', 'href', 'audioSim', 'engine', 'category', 'primary_locale', 'icon', 'slug', 'scene', 'type', 'shape', 'color']);

function fixApostrophes(s) { return s.replace(/([A-Za-zÀ-ÿ0-9»])'([A-Za-zÀ-ÿ])/g, '$1’$2'); }
function sweepValue(s, stats) {
  let out = s;
  for (const [re, rep] of TERM_FIXES) { const b = out; out = out.replace(re, rep); if (out !== b) stats.terms += (s.match(re) || []).length; }
  const ap = fixApostrophes(out); if (ap !== out) { stats.apos += (out.match(/([A-Za-zÀ-ÿ0-9»])'([A-Za-zÀ-ÿ])/g) || []).length; out = ap; }
  return out;
}
/* inFr: are we inside French content? pure-FR files start true; bilingual start
   false and flip to true under an "fr" key. "en" keys are never swept. */
function walk(o, stats, key, inFr) {
  if (typeof o === 'string') return (inFr && !SKIP_KEYS.has(key)) ? sweepValue(o, stats) : o;
  if (Array.isArray(o)) return o.map(v => walk(v, stats, key, inFr));
  if (o && typeof o === 'object') { const r = {}; for (const k in o) r[k] = walk(o[k], stats, k, k === 'fr' ? true : k === 'en' ? false : inFr); return r; }
  return o;
}

const targets = [];
const pagesDir = resolve(SITE, 'data/pages');
for (const f of readdirSync(pagesDir)) if (/\.fr\.json$/.test(f)) targets.push([resolve(pagesDir, f), true]);   // pure-FR
const simsDir = resolve(SITE, 'data/sims');
for (const f of readdirSync(simsDir)) if (/\.json$/.test(f)) targets.push([resolve(simsDir, f), false]);          // bilingual
targets.push([resolve(SITE, 'data/canvas/landscape.json'), false]);
targets.push([resolve(SITE, 'data/glossary.json'), false]);
targets.push([resolve(SITE, 'data/site.json'), false]);

let totT = 0, totA = 0, files = 0;
for (const [path, pureFr] of targets) {
  const j = JSON.parse(readFileSync(path, 'utf8'));
  const stats = { terms: 0, apos: 0 };
  const out = walk(j, stats, '', pureFr);
  if (stats.terms || stats.apos) {
    files++; totT += stats.terms; totA += stats.apos;
    console.log(path.split(/[\\/]/).slice(-2).join('/').padEnd(30) + ' terms:' + stats.terms + '  apostrophes:' + stats.apos);
    if (write) writeFileSync(path, JSON.stringify(out, null, 2) + '\n');
  }
}
console.log('\n' + (write ? 'APPLIED' : 'DRY RUN') + ': ' + totT + ' term fixes, ' + totA + ' apostrophe fixes across ' + files + ' files.');
