#!/usr/bin/env node
/* translate-doc.mjs — batch machine-translation of the corpus into a target
   locale, using the Vertex/Claude helper (scripts/lib/llm.mjs) with a per-locale
   glossary. Structure-preserving: only text-bearing fields change; ids, paths
   (retargeted /src/ -> /tgt/), tags and grouping keys are kept.

   Modes:
     --kind paper   data/papers/<id>.<src>.json  -> .<tgt>.json   (uses collectTranslatable)
     --kind page    data/pages/<name>.<src>.json -> .<tgt>.json   (generic, denylist-protected)
     --kind sim     data/sims/<id>.json          -> add <tgt> to inline {en,..} maps in place

   Usage:
     node scripts/translate-doc.mjs --kind paper --all [--src en] [--tgt es] [--force] [--model sonnet|opus]
     node scripts/translate-doc.mjs --kind page --all
     node scripts/translate-doc.mjs --kind sim  --all
     node scripts/translate-doc.mjs --kind paper cux4h mwo98        # specific ids

   Never overwrites a target with translation_status "reviewed"/"final" unless --force.
   Prints token usage at the end (for the cost ledger). */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { collectTranslatable, retargetPaths, computeSignature } from './lib/translatable.mjs';
import { translateItems, getUsage } from './lib/llm.mjs';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i !== -1 ? args[i + 1] : d; };
const has = (n) => args.includes(n);
const KIND = flag('--kind', 'paper');
const SRC = flag('--src', 'en');
const TGT = flag('--tgt', 'es');
const FORCE = has('--force');
const TIER = flag('--model', 'sonnet') === 'opus' ? 'opus' : 'sonnet';
// positional capture: any bare token that isn't a flag value
const positional = [];
for (let i = 0; i < args.length; i++) { if (args[i].startsWith('--')) { i++; continue; } positional.push(args[i]); }

/* Build the Spanish (or any target) glossary string from data/<tgt>-lexicon.json. */
function glossaryFor(tgt) {
  const p = resolve(SITE, 'data/' + tgt + '-lexicon.json');
  if (!existsSync(p)) return '';
  const lex = JSON.parse(readFileSync(p, 'utf8'));
  const terms = (lex.terms || []).map((t) => '"' + t.en + '" -> "' + t.es + '"' + (t.avoid ? ' (NOT "' + t.avoid + '")' : '')).join('; ');
  const typo = Object.values(lex.typography || {}).join(' ');
  const tone = (lex.tone || []).join(' ');
  return 'Write neutral international Spanish for public administration. BINDING TERMS: ' + terms
    + ' TYPOGRAPHY: ' + typo + ' TONE: ' + tone;
}
const GLOSS = glossaryFor(TGT);

async function translateMap(items) {
  const map = {};
  for (let i = 0; i < items.length; i += 40) {
    const batch = items.slice(i, i + 40).map((it) => ({ key: it.key, text: it.text }));
    let out = null;
    for (let attempt = 0; attempt < 2 && !out; attempt++) {
      try { out = await translateItems({ items: batch, sourceLocale: SRC, targetLocale: TGT, glossary: GLOSS, tier: TIER }); }
      catch (e) { if (attempt === 1) throw e; }
    }
    for (const r of (out || [])) map[r.key] = r.revised;
  }
  return map;
}

// ---- paper mode -------------------------------------------------------------
async function doPaper(id) {
  const srcPath = resolve(SITE, 'data/papers/' + id + '.' + SRC + '.json');
  if (!existsSync(srcPath)) return { id, skipped: 'no source' };
  const tgtPath = resolve(SITE, 'data/papers/' + id + '.' + TGT + '.json');
  if (!FORCE && existsSync(tgtPath)) {
    try { const ex = JSON.parse(readFileSync(tgtPath, 'utf8')); if (['reviewed', 'final'].includes(ex.translation_status)) return { id, skipped: ex.translation_status }; } catch (_) {}
  }
  const source = JSON.parse(readFileSync(srcPath, 'utf8'));
  const target = JSON.parse(JSON.stringify(source));
  const items = collectTranslatable(target);
  const map = await translateMap(items);
  let n = 0;
  for (const it of items) if (map[it.key] != null) { it.apply(map[it.key]); n++; }
  retargetPaths(target, SRC, TGT);
  if (Array.isArray(target.blocks)) {
    target.sections = target.blocks.filter((b) => b.type === 'section_heading').map((b) => ({ n: b.n, title: b.title }));
  }
  target.translation_status = 'draft';
  target._meta = target._meta || {};
  target._meta.translated_from = { source_locale: SRC, tier: TIER, translated_at: '2026-07-07' };
  target.source_signature = computeSignature(source);
  writeFileSync(tgtPath, JSON.stringify(target, null, 2) + '\n');
  return { id, translated: n };
}

// ---- page mode --------------------------------------------------------------
const PAGE_TKEYS = new Set(['title', 'subtitle', 'subhead', 'abstract', 'tagline', 'label', 'body', 'text',
  'caption', 'subcaption', 'heading', 'meta', 'lede', 'alt', 'cite', 'desc', 'stat_label',
  'eyebrow', 'disclaimer', 'role', 'sub', 'volume', 'print_note', 'download_cta', 'forthcoming',
  'image_alt', 'title_lead', 'title_em', 'blurb', 'coming_soon', 'summary', 'date']);
// Arrays of strings that are prose and should be translated element-by-element.
const PROSE_ARRAYS = new Set(['paras', 'about_body', 'closing', 'body']);
// Paths we must NOT translate: verbatim quotes, proper nouns, external article titles.
function pageBlocked(path, key) {
  if (/(^|\.)quote(\.|$)/.test(path) || /endorsements/.test(path)) return true;   // verbatim quotes + attributions
  if (/coverage/.test(path) && key === 'title') return true;                       // external (English) article titles
  if (/contacts/.test(path) && (key === 'name')) return true;                      // person names
  return false;
}
function collectPage(node, path, items) {
  if (Array.isArray(node)) { node.forEach((v, i) => collectPage(v, path + '.' + i, items)); return; }
  if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (typeof v === 'string') {
        if (v.trim() && PAGE_TKEYS.has(k) && !pageBlocked(path, k)) {
          items.push({ key: path + '.' + k, text: v, apply: (nv) => { if (nv != null) node[k] = nv; } });
        }
      } else if (Array.isArray(v) && v.every((x) => typeof x === 'string')) {
        if (PROSE_ARRAYS.has(k) && !pageBlocked(path, k)) {
          v.forEach((s, i) => { if (s.trim()) items.push({ key: path + '.' + k + '.' + i, text: s, apply: (nv) => { if (nv != null) v[i] = nv; } }); });
        }
      } else collectPage(v, path + '.' + k, items);
    }
  }
}
async function doPage(name) {
  const srcPath = resolve(SITE, 'data/pages/' + name + '.' + SRC + '.json');
  if (!existsSync(srcPath)) return { id: name, skipped: 'no source' };
  const tgtPath = resolve(SITE, 'data/pages/' + name + '.' + TGT + '.json');
  const source = JSON.parse(readFileSync(srcPath, 'utf8'));
  const target = JSON.parse(JSON.stringify(source));
  const items = [];
  collectPage(target, '', items);
  const map = await translateMap(items);
  let n = 0;
  for (const it of items) if (map[it.key] != null) { it.apply(map[it.key]); n++; }
  // Retarget page narration audio to the target locale (images are shared /en/).
  const swapAudio = (o) => { for (const k of Object.keys(o || {})) { const v = o[k]; if (typeof v === 'string' && v.includes('/audio/' + SRC + '/')) o[k] = v.replace('/audio/' + SRC + '/', '/audio/' + TGT + '/'); else if (v && typeof v === 'object') swapAudio(v); } };
  swapAudio(target);
  target._meta = target._meta || {};
  target._meta.translated_from = { source_locale: SRC, tier: TIER, translated_at: '2026-07-07' };
  writeFileSync(tgtPath, JSON.stringify(target, null, 2) + '\n');
  return { id: name, translated: n };
}

// ---- sim / canvas mode (inline {en,fr,…} locale-maps, mutate the shared file) -
/* A translatable locale-map is any {en,fr,…} object whose source value is PROSE
   (has letters, not an asset path / url / filename) — this covers sims and
   canvas scenes regardless of the surrounding key name, while never touching
   per-locale asset paths like { en: "…/en/x.jpg", fr: "…/fr/x.jpg" }. */
const isProse = (s) => typeof s === 'string' && /[A-Za-zÀ-ÿ]/.test(s) && !/^https?:|^\/|^public\/|\.(jpe?g|png|webp|gif|svg|mp3|json)$/i.test(s.trim());
function collectSim(node, path, items) {
  if (Array.isArray(node)) { node.forEach((v, i) => collectSim(v, path + '.' + i, items)); return; }
  if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) {
      const v = node[k];
      const isMap = v && typeof v === 'object' && !Array.isArray(v) && typeof v[SRC] === 'string';
      if (isMap && isProse(v[SRC])) {
        if (FORCE || typeof v[TGT] !== 'string') items.push({ key: path + '.' + k, text: v[SRC], apply: (nv) => { if (nv != null) v[TGT] = nv; } });
      } else if (v && typeof v === 'object') collectSim(v, path + '.' + k, items);
    }
  }
}
async function doSim(name) {
  const dir = KIND === 'canvas' ? 'data/canvas/' : 'data/sims/';
  const p = resolve(SITE, dir + name + '.json');
  if (!existsSync(p)) return { id: name, skipped: 'no file' };
  const doc = JSON.parse(readFileSync(p, 'utf8'));
  const items = [];
  collectSim(doc, '', items);
  if (!items.length) return { id: name, translated: 0, note: 'already has ' + TGT };
  const map = await translateMap(items);
  let n = 0;
  for (const it of items) if (map[it.key] != null) { it.apply(map[it.key]); n++; }
  writeFileSync(p, JSON.stringify(doc, null, 2) + '\n');
  return { id: name, translated: n };
}

// ---- driver -----------------------------------------------------------------
function listAll() {
  if (KIND === 'paper') return [...new Set(readdirSync(resolve(SITE, 'data/papers')).filter((f) => f.endsWith('.' + SRC + '.json')).map((f) => f.replace('.' + SRC + '.json', '')))];
  if (KIND === 'page') return [...new Set(readdirSync(resolve(SITE, 'data/pages')).filter((f) => f.endsWith('.' + SRC + '.json')).map((f) => f.replace('.' + SRC + '.json', '')))];
  if (KIND === 'sim') return readdirSync(resolve(SITE, 'data/sims')).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
  if (KIND === 'canvas') return readdirSync(resolve(SITE, 'data/canvas')).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
  return [];
}

const targets = has('--all') ? listAll() : positional;
if (!targets.length) { console.error('Nothing to do. Pass --all or specific ids. --kind=' + KIND); process.exit(1); }

const fn = KIND === 'page' ? doPage : (KIND === 'sim' || KIND === 'canvas') ? doSim : doPaper;
console.log(`translate-doc: kind=${KIND} ${SRC}->${TGT} tier=${TIER} · ${targets.length} item(s)`);
const results = [];
for (const t of targets) {
  try { const r = await fn(t); results.push(r); console.log('  ' + (r.skipped ? '· skip ' + t + ' (' + r.skipped + ')' : '✓ ' + t + ' (' + r.translated + ' strings)') + (r.note ? ' ' + r.note : '')); }
  catch (e) { results.push({ id: t, error: e.message }); console.error('  ✗ ' + t + ': ' + e.message); }
}
const u = getUsage();
const done = results.filter((r) => r.translated != null).length;
const strings = results.reduce((a, r) => a + (r.translated || 0), 0);
console.log(`\nDone: ${done}/${targets.length} · ${strings} strings · tokens in=${u.input} out=${u.output} (${u.calls} calls)`);
