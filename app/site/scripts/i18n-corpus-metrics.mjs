#!/usr/bin/env node
/* i18n-corpus-metrics.mjs — measure the translatable corpus so the cost of
   transforming the whole site into one more language can be estimated and
   tracked. Counts characters of TRANSLATABLE text only (by key allowlist, so
   ids/paths/prompts don't inflate it), plus the narration script length (what
   TTS bills on) and the image count (what image generation bills on).

   Reads the default-locale files. Prints a table; also `--json` for tooling.
   Token estimate uses ~4 chars/token (English/Spanish prose). */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(readFileSync(resolve(SITE, 'data/site.json'), 'utf8'));
const DEF = site.default_locale || 'en';
const CODES = new Set((site.locales || []).map((l) => l.code));

// Keys whose string values are human-facing prose to translate.
const TRANSLATABLE = new Set([
  'title', 'subtitle', 'abstract', 'track', 'tagline', 'publisher', 'publisher_short',
  'label', 'body', 'text', 'caption', 'subcaption', 'heading', 'meta', 'lede',
  'alt', 'cite', 'desc', 'stat_label', 'eyebrow', 'disclaimer', 'role', 'name',
  'sub', 'k', 'v', 'primary', 'smallcaps', 'volume', 'print_note', 'download_cta',
  'forthcoming', 'image_alt', 'title_lead', 'title_em', 'quote',
  'narration', 'blurb',   // simulations carry inline {en,fr} maps under these
]);
// Keys that are the spoken narration script (what TTS turns into audio).
const NARRATION = new Set(['text', 'narration']);

// Is this a locale-map like { en: "…", fr: "…" }? (simulations embed these inline)
function isLocaleMap(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
  const ks = Object.keys(o);
  return ks.length > 0 && ks.every((k) => CODES.has(k) && typeof o[k] === 'string');
}

function walk(node, key, acc) {
  if (typeof node === 'string') {
    if (key && TRANSLATABLE.has(key)) acc.textChars += node.length;
    if (key && NARRATION.has(key)) acc.narrChars += node.length;
    return;
  }
  if (Array.isArray(node)) { for (const v of node) walk(v, key, acc); return; }
  if (node && typeof node === 'object') {
    // A {en,fr,…} map under a translatable key counts once, at the default value.
    if (isLocaleMap(node)) { walk(node[DEF] != null ? node[DEF] : node.en, key, acc); return; }
    // count figures/heroes for the image-generation estimate
    if (node.image_prompt || (node.image && node.image.image_prompt)) acc.images += 1;
    for (const k of Object.keys(node)) walk(node[k], k, acc);
  }
}

const acc = { textChars: 0, narrChars: 0, images: 0, papers: 0, pages: 0, sims: 0 };

const papersDir = resolve(SITE, 'data/papers');
for (const f of readdirSync(papersDir).filter((f) => f.endsWith('.' + DEF + '.json'))) {
  walk(JSON.parse(readFileSync(resolve(papersDir, f), 'utf8')), null, acc);
  acc.papers += 1;
}
const pagesDir = resolve(SITE, 'data/pages');
if (existsSync(pagesDir)) {
  for (const f of readdirSync(pagesDir).filter((f) => f.endsWith('.' + DEF + '.json'))) {
    walk(JSON.parse(readFileSync(resolve(pagesDir, f), 'utf8')), null, acc);
    acc.pages += 1;
  }
}
// Simulations carry their own inline {en,fr} text + narration (not per-locale files).
const simsDir = resolve(SITE, 'data/sims');
if (existsSync(simsDir)) {
  for (const f of readdirSync(simsDir).filter((f) => f.endsWith('.json'))) {
    walk(JSON.parse(readFileSync(resolve(simsDir, f), 'utf8')), null, acc);
    acc.sims += 1;
  }
}
// The site-wide UI/chrome bag (nav, ui, hero, footer, stats, section_titles, about_body, print_edition).
walk(site.i18n[DEF], null, acc);

const CH_PER_TOK = 4;
const textTokens = Math.round(acc.textChars / CH_PER_TOK);
const metrics = {
  default_locale: DEF,
  papers: acc.papers,
  pages: acc.pages,
  sims: acc.sims,
  translatable_chars: acc.textChars,
  translatable_words: Math.round(acc.textChars / 6),
  translatable_tokens: textTokens,
  narration_chars: acc.narrChars,          // TTS billing unit
  images: acc.images,                      // heroes + figures = generations per locale
};

if (process.argv.includes('--json')) { console.log(JSON.stringify(metrics, null, 2)); process.exit(0); }

const fmt = (n) => n.toLocaleString('en-US');
console.log(`Translatable corpus (source = ${DEF}):`);
console.log(`  papers               ${metrics.papers}`);
console.log(`  pages                ${metrics.pages}`);
console.log(`  simulations          ${metrics.sims}  (inline {en,fr} text + narration; audio at public/audio/<loc>/sims/)`);
console.log(`  translatable text    ${fmt(metrics.translatable_chars)} chars  ≈ ${fmt(metrics.translatable_words)} words  ≈ ${fmt(metrics.translatable_tokens)} tokens`);
console.log(`  narration script     ${fmt(metrics.narration_chars)} chars  (TTS billing unit)`);
console.log(`  images to regenerate ${metrics.images}  (heroes + figures, per locale)`);
console.log('');
console.log('Per-language LLM translation estimate (~4 chars/token):');
const promptOverhead = 0.35; // style guide + lexicon + instructions re-sent per chunk
const inTok = Math.round(textTokens * (1 + promptOverhead));
const outTok = textTokens; // translation ≈ same length as source
console.log(`  input  ≈ ${fmt(inTok)} tokens  (source + ~35% prompt/lexicon overhead)`);
console.log(`  output ≈ ${fmt(outTok)} tokens`);
console.log(`  + review passes typically 1.5–2× the draft cost.`);
console.log('  × your model $/token → cost. Record actuals in docs/i18n-cost-ledger.md.');
