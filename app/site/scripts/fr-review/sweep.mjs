#!/usr/bin/env node
/* sweep.mjs — apply the FR lexicon consistently to content the reviewers never
   saw (TLDR slides, sims, post-review additions) and to a few reviewer
   inconsistencies, plus normalize Canadian apostrophes in reader-facing French.

   It is deliberately SURGICAL: it only changes the unambiguous lexicon "avoid"
   terms (with correct agreement) and the straight→curly apostrophe, and only in
   reader-facing French string fields — never image_prompt (English), asset
   paths, ids, urls, or keys. Reviewer-approved register the lexicon does NOT
   list (e.g. "impératif cybernétique", "hiver cybernétique") is left untouched.

   Usage: node scripts/fr-review/sweep.mjs [--write] */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '..', '..');
const write = process.argv.includes('--write');

/* unambiguous term fixes (ordered; agreement-correct). [regex, replacement] */
const TERM_FIXES = [
  [/contrôles cybernétiques/g, 'contrôles de cybersécurité'],
  [/contrôle cybernétique/g, 'contrôle de cybersécurité'],
  [/groupes criminels à motivation financière/g, 'groupes criminels motivés par des gains financiers'],
  [/à motivation financière/g, 'motivés par des gains financiers'],
  [/pilotée par l[’']IA/g, 'appuyée par l’IA'],
  [/piloté par l[’']IA/g, 'appuyé par l’IA'],
  [/pilotées par l[’']IA/g, 'appuyées par l’IA'],
  [/pilotés par l[’']IA/g, 'appuyés par l’IA'],
];

/* keys whose string values are NOT reader-facing French — never touch */
const SKIP_KEYS = new Set(['src', 'image_prompt', 'style_kind', 'audio_file', 'url', 'id', 'repo', 'kind', 'visual', 'sim', 'owner_id', 'locale', 'href', 'audioSim', 'engine', 'category', 'primary_locale', 'translation_status', 'source_signature', 'composed_prompt']);

function fixApostrophes(s) {
  // straight ' used as an apostrophe between/after letters → curly ’
  return s.replace(/([A-Za-zÀ-ÿ0-9»])'([A-Za-zÀ-ÿ])/g, '$1’$2');
}

function sweepValue(s, stats) {
  let out = s;
  for (const [re, rep] of TERM_FIXES) { const before = out; out = out.replace(re, rep); if (out !== before) stats.terms += (s.match(re) || []).length; }
  const ap = fixApostrophes(out); if (ap !== out) { stats.apos += (out.match(/([A-Za-zÀ-ÿ0-9»])'([A-Za-zÀ-ÿ])/g) || []).length; out = ap; }
  return out;
}

function walk(o, stats, key) {
  if (typeof o === 'string') return SKIP_KEYS.has(key) ? o : sweepValue(o, stats);
  if (Array.isArray(o)) return o.map(v => walk(v, stats, key));
  if (o && typeof o === 'object') { const r = {}; for (const k in o) r[k] = walk(o[k], stats, k); return r; }
  return o;
}

const dir = resolve(SITE, 'data/papers');
let totT = 0, totA = 0, files = 0;
const targets = [];
for (const f of readdirSync(dir)) if (/\.fr\.json$/.test(f)) targets.push(resolve(dir, f));
// Sims are bilingual ({en,fr}) single files and were already confirmed free of
// the avoid-terms; we exclude them here to avoid touching English apostrophes.

for (const path of targets) {
  const raw = readFileSync(path, 'utf8');
  const j = JSON.parse(raw);
  const stats = { terms: 0, apos: 0 };
  const out = walk(j, stats, '');
  if (stats.terms || stats.apos) {
    files++; totT += stats.terms; totA += stats.apos;
    console.log(path.split(/[\\/]/).slice(-2).join('/').padEnd(34) + ' terms:' + stats.terms + '  apostrophes:' + stats.apos);
    if (write) writeFileSync(path, JSON.stringify(out, null, 2) + '\n');
  }
}
console.log('\n' + (write ? 'APPLIED' : 'DRY RUN') + ': ' + totT + ' term fixes, ' + totA + ' apostrophe fixes across ' + files + ' files.');
