#!/usr/bin/env node
/* fill-gaps.mjs — translate only the fields a target locale still shares verbatim
   with the source (i.e. fields an earlier, shallower collector missed: figure
   charts, table cells, TL;DR visual_config, etc.). Surgical and cheap: it never
   re-translates a field that already differs from the source. Uses the now-deep
   collectTranslatable, so it also serves as a completeness backstop.

   Usage: node scripts/fill-gaps.mjs [--kind paper|page] [--src en] [--tgt es] [--all|ids…] */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { collectTranslatable } from './lib/translatable.mjs';
import { translateItems, getUsage } from './lib/llm.mjs';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i !== -1 ? args[i + 1] : d; };
const KIND = flag('--kind', 'paper');
const SRC = flag('--src', 'en');
const TGT = flag('--tgt', 'es');
const TIER = flag('--model', 'sonnet') === 'opus' ? 'opus' : 'sonnet';
const MIN_WORDS = parseInt(flag('--min-words', '1'), 10);   // only fill gaps with >= N words (skips proper nouns/values)
const positional = []; for (let i = 0; i < args.length; i++) { if (args[i].startsWith('--')) { i++; continue; } positional.push(args[i]); }
const DIR = KIND === 'page' ? 'data/pages' : 'data/papers';

function glossaryFor(tgt) {
  const p = resolve(SITE, 'data/' + tgt + '-lexicon.json');
  if (!existsSync(p)) return '';
  const lex = JSON.parse(readFileSync(p, 'utf8'));
  const terms = (lex.terms || []).map((t) => '"' + t.en + '" -> "' + t.es + '"' + (t.avoid ? ' (NOT "' + t.avoid + '")' : '')).join('; ');
  return 'Write neutral international Spanish for public administration. BINDING TERMS: ' + terms
    + ' TYPOGRAPHY: ' + Object.values(lex.typography || {}).join(' ') + ' TONE: ' + (lex.tone || []).join(' ');
}
const GLOSS = glossaryFor(TGT);
const hasLetters = (s) => /[A-Za-zÀ-ÿ]/.test(s);
/* Page fields that must stay verbatim: direct quotes, external article titles,
   proper names. (Same rule collectPage uses in translate-doc.) */
function blockedKey(key) {
  if (KIND !== 'page') return false;
  return /(^|\.)quote(\.|$)/.test(key) || /endorsements/.test(key)
    || (/coverage/.test(key) && /\.title$/.test(key))
    || (/contacts/.test(key) && /\.name$/.test(key));
}

async function translateMap(items) {
  const map = {};
  for (let i = 0; i < items.length; i += 40) {
    const batch = items.slice(i, i + 40).map((it) => ({ key: it.key, text: it.text }));
    let out = null;
    for (let a = 0; a < 2 && !out; a++) { try { out = await translateItems({ items: batch, sourceLocale: SRC, targetLocale: TGT, glossary: GLOSS, tier: TIER }); } catch (e) { if (a === 1) throw e; } }
    for (const r of (out || [])) map[r.key] = r.revised;
  }
  return map;
}

async function fill(id) {
  const srcPath = resolve(SITE, DIR + '/' + id + '.' + SRC + '.json');
  const tgtPath = resolve(SITE, DIR + '/' + id + '.' + TGT + '.json');
  if (!existsSync(srcPath) || !existsSync(tgtPath)) return { id, skipped: 'missing file' };
  const src = JSON.parse(readFileSync(srcPath, 'utf8'));
  const tgt = JSON.parse(readFileSync(tgtPath, 'utf8'));
  const srcByKey = Object.fromEntries(collectTranslatable(src).map((it) => [it.key, it.text]));
  const tgtItems = collectTranslatable(tgt);
  // A gap = a target field still verbatim-equal to source, with actual words.
  const gaps = tgtItems.filter((it) => {
    const s = srcByKey[it.key];
    return s != null && it.text === s && hasLetters(it.text) && !it.key.startsWith('imgprompt:') && !blockedKey(it.key) && it.text.trim().split(/\s+/).length >= MIN_WORDS;
  });
  if (!gaps.length) return { id, gaps: 0 };
  const map = await translateMap(gaps.map((g) => ({ key: g.key, text: srcByKey[g.key] })));
  let n = 0;
  for (const g of gaps) if (map[g.key] != null && map[g.key] !== g.text) { g.apply(map[g.key]); n++; }
  writeFileSync(tgtPath, JSON.stringify(tgt, null, 2) + '\n');
  return { id, gaps: gaps.length, filled: n };
}

const ids = args.includes('--all')
  ? [...new Set(readdirSync(resolve(SITE, DIR)).filter((f) => f.endsWith('.' + SRC + '.json')).map((f) => f.replace('.' + SRC + '.json', '')))]
  : positional;

console.log(`fill-gaps: kind=${KIND} ${SRC}->${TGT} · ${ids.length} item(s)`);
let totalGaps = 0, totalFilled = 0;
for (const id of ids) {
  try { const r = await fill(id); if (r.skipped) console.log('  · skip ' + id + ' (' + r.skipped + ')'); else { totalGaps += r.gaps; totalFilled += (r.filled || 0); if (r.gaps) console.log('  ✓ ' + id + ' — ' + r.filled + '/' + r.gaps + ' gap fields filled'); } }
  catch (e) { console.error('  ✗ ' + id + ': ' + e.message); }
}
const u = getUsage();
console.log(`\nDone: ${totalFilled} fields filled across ${ids.length} docs · tokens in=${u.input} out=${u.output} (${u.calls} calls)`);
