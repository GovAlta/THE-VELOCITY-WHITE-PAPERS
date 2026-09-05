/* locales.mjs — the single source of truth for which locales the site supports.
   Every build script imports this instead of hardcoding ['en','fr'], so adding
   a language is a data operation: add an entry to data/site.json `locales` and
   the whole pipeline (index, prerender, sitemap, gallery, audio measurement,
   image/audio generation) picks it up automatically.

   Reads data/site.json. Exports helpers keyed off its `locales` array and
   `default_locale`. Pure Node built-ins; safe to import from any script. */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

let _site = null;
function site() {
  if (!_site) _site = JSON.parse(readFileSync(resolve(SITE, 'data/site.json'), 'utf8'));
  return _site;
}

/** Full locale entry objects: [{ code, label, name, dir, lang_code, og_locale, ... }]. */
export function locales() {
  return (site().locales || []).slice();
}

/** Just the codes, in declared order: ['en','fr','es', …]. */
export function localeCodes() {
  return locales().map((l) => l.code);
}

/** The default/primary locale code (fallback 'en'). */
export function defaultLocale() {
  return site().default_locale || 'en';
}

/** The one locale entry for a code (or undefined). */
export function localeMeta(code) {
  return locales().find((l) => l.code === code);
}

/** Reading direction for a locale ('ltr' | 'rtl'), defaulting to 'ltr'. */
export function localeDir(code) {
  const m = localeMeta(code);
  return (m && m.dir) || 'ltr';
}

/** Every locale code except `code` (defaults to excluding the primary). */
export function otherLocales(code) {
  const primary = code || defaultLocale();
  return localeCodes().filter((c) => c !== primary);
}

/** The sequence-number template for a locale, e.g. "{i} of {N}" / "{i} sur {N}".
   Falls back to the default locale's template, then to a plain form. */
export function sequenceTemplate(code) {
  const sf = site().sequence_format || {};
  return sf[code] || sf[defaultLocale()] || '{i} / {N}';
}
