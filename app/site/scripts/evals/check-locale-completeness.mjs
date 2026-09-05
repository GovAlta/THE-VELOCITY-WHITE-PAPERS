#!/usr/bin/env node
/* check-locale-completeness.mjs — validate the i18n config for N locales.

   HARD failures (exit 1) — things that would actually break rendering:
     - default_locale missing from the locales array
     - a locale entry missing a required field (code/label/name/dir)
     - a locale's tier_labels/status_labels omit a key the default defines
       (those maps are looked up by exact value, so a gap shows raw English)

   ADVISORY (exit 0, reported) — the runtime deep-merges each locale over the
   default, so missing UI keys fall back gracefully. We print per-locale coverage
   so translation progress is visible without blocking a partial language.

   Usage: node scripts/evals/check-locale-completeness.mjs [--strict]
   With --strict, advisory gaps also fail (use once a locale is declared "done"). */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const site = JSON.parse(readFileSync(resolve(SITE, 'data/site.json'), 'utf8'));
const strict = process.argv.includes('--strict');

const errors = [];
const advisories = [];

const def = site.default_locale || 'en';
const locales = site.locales || [];
const codes = locales.map((l) => l.code);

if (!codes.includes(def)) errors.push(`default_locale "${def}" is not in the locales array`);

// Required fields on every locale entry (name = autonym; dir enables RTL).
for (const l of locales) {
  for (const f of ['code', 'label', 'name', 'dir']) {
    if (!l[f]) errors.push(`locale "${l.code || '?'}" is missing required field "${f}"`);
  }
  if (l.dir && l.dir !== 'ltr' && l.dir !== 'rtl') errors.push(`locale "${l.code}" has invalid dir "${l.dir}"`);
}

// Collect the full set of leaf key-paths in an object (dotted).
function leafPaths(obj, prefix = '', out = []) {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const k of Object.keys(obj)) leafPaths(obj[k], prefix ? prefix + '.' + k : k, out);
  } else {
    out.push(prefix);
  }
  return out;
}

const defBag = (site.i18n && site.i18n[def]) || {};
const defPaths = new Set(leafPaths(defBag));
// Label maps are matched by exact value at runtime — a gap renders raw English.
const HARD_MAPS = ['ui.tier_labels', 'ui.status_labels'];

for (const code of codes) {
  if (code === def) continue;
  const bag = (site.i18n && site.i18n[code]) || {};
  const have = new Set(leafPaths(bag));
  const missing = [...defPaths].filter((p) => !have.has(p));
  const covered = defPaths.size - missing.length;
  const pct = Math.round((covered / defPaths.size) * 100);
  advisories.push(`  ${code}: ${covered}/${defPaths.size} UI strings (${pct}%)` + (missing.length ? ` — ${missing.length} fall back to ${def}` : ' — complete'));

  // Hard: the value-keyed label maps must be complete or grouping labels break.
  for (const mapPath of HARD_MAPS) {
    const missingInMap = missing.filter((p) => p.startsWith(mapPath + '.'));
    if (missingInMap.length) errors.push(`locale "${code}" ${mapPath} missing: ${missingInMap.map((p) => p.split('.').pop()).join(', ')}`);
  }
  // Sequence format is advisory (falls back), but note it.
  if (!(site.sequence_format && site.sequence_format[code])) advisories.push(`  ${code}: no sequence_format (falls back to ${def})`);
  if (strict && missing.length) errors.push(`locale "${code}" missing ${missing.length} UI strings (strict): ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? '…' : ''}`);
}

console.log(`Locales: ${codes.join(', ')} (default: ${def})`);
console.log('Coverage:');
advisories.forEach((a) => console.log(a));

if (errors.length) {
  console.error('\nFAIL — ' + errors.length + ' structural problem(s):');
  errors.forEach((e) => console.error('  ✗ ' + e));
  process.exit(1);
}
console.log('\nOK — locale config is structurally valid' + (strict ? ' (strict)' : '') + '.');
