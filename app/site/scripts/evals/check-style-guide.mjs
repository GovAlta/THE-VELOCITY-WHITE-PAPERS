#!/usr/bin/env node
/* check-style-guide.mjs — lightweight style-guide compliance scan over EN
   reader-visible content. Flags banned words, em dashes, and common AI tells.

   This is a fast static scan, not a full lint. It catches the most reliable
   AI-prose signals listed in style-guide/00-writing-style-guide.md. */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const SITE = resolve(__dirname, '../..');
const warnings = [];

const BANNED_WORDS = [
  'leverage', 'leveraging', 'leveraged',
  'unlock', 'unlocks', 'unlocking',
  'seamless', 'seamlessly',
  'robust',
  'crucial', 'crucially',
  'essential',
  'vital',
  'holistic', 'holistically',
  'paradigm',
  'synergy', 'synergies',
  'tapestry',
  'realm',
  'ecosystem',                       // outside biology, hard to gate; flag and review
  'cutting-edge',
  'game-changing', 'game-changer',
  'world-class',
  'best-in-class',
  'state-of-the-art',
  'next-generation',
  'navigate',                        // when metaphorical, hard to detect; flag
  'delve', 'delves', 'delving',
];

const BANNED_PHRASES = [
  'not just',                        // "not just X, but Y"
  'not only',                        // "not only X, but also Y"
  'it is not a',                     // "it is not a X, it is a Y"
  'this is not a',
  'is the moment',
  'is where',
  'moreover',
  'furthermore',
  'in essence',
  'at its core',
  'fundamentally',
  'in today\'s world',
  'in a world where',
  'at the end of the day',
  'move the needle',
  'drive impact',
];

const VAGUE_INTENSIFIERS = ['very', 'really', 'truly', 'deeply', 'profoundly', 'incredibly', 'extremely'];

function scan(textRaw, where) {
  if (!textRaw) return;
  const text = String(textRaw).toLowerCase();
  const cleanForWords = text.replace(/<[^>]+>/g, ' ');
  for (const w of BANNED_WORDS) {
    const re = new RegExp('\\b' + w.replace(/-/g, '[\\s-]') + '\\b', 'i');
    if (re.test(cleanForWords)) warnings.push(where + ': banned word "' + w + '"');
  }
  for (const p of BANNED_PHRASES) {
    if (text.includes(p)) warnings.push(where + ': banned phrase "' + p + '"');
  }
  for (const i of VAGUE_INTENSIFIERS) {
    const re = new RegExp('\\b' + i + '\\s+(\\w+)', 'i');
    if (re.test(cleanForWords)) warnings.push(where + ': vague intensifier "' + i + '"');
  }
  if (/—|–/.test(textRaw)) warnings.push(where + ': em dash or en dash');
}

function check(paperPath, j) {
  if (!/\.en\.json$/.test(paperPath)) return;       // English content only
  const where0 = paperPath.replace(SITE + '\\', '').replace(SITE + '/', '');

  // Author-supplied prose is exempt from this scan. The 00-guide rules are a
  // filter on prose Claude GENERATES, not a license to "correct" the author's
  // own voice. When the author wrote the words, his words win — even where they
  // use a flagged word like "leverage" or an intensifier like "very". Bless
  // content three ways:
  //   _meta.author_verbatim: true              → exempt the whole paper
  //   _meta.author_verbatim: ["abstract", …]   → exempt named top-level fields
  //   "author_verbatim": true on a block/slide → exempt that block or slide
  const av = j._meta && j._meta.author_verbatim;
  if (av === true) return;
  const verbatimFields = new Set(Array.isArray(av) ? av : []);

  if (!verbatimFields.has('title'))    scan(j.title, where0 + ' [title]');
  if (!verbatimFields.has('subtitle')) scan(j.subtitle, where0 + ' [subtitle]');
  if (!verbatimFields.has('abstract')) scan(j.abstract, where0 + ' [abstract]');
  for (const b of (j.blocks || [])) {
    if (b.author_verbatim === true) continue;
    if (b.type === 'paragraph' || b.type === 'dropcap_paragraph') scan(b.text, where0 + ' [block]');
    if (b.type === 'pullquote') scan(b.text, where0 + ' [pullquote]');
    if (b.type === 'keystat') scan(b.body, where0 + ' [keystat.body]');
    if (b.type === 'sidenote') scan(b.value, where0 + ' [sidenote]');
  }
  for (const s of (j.tldr_presentation && j.tldr_presentation.slides) || []) {
    if (s.author_verbatim === true) continue;
    scan(s.subcaption, where0 + ' [slide ' + s.id + ' subcaption]');
    scan(s.text, where0 + ' [slide ' + s.id + ' text]');
  }
}

const dir = resolve(SITE, 'data/papers');
for (const f of readdirSync(dir)) {
  if (!/\.en\.json$/.test(f)) continue;
  try {
    const j = JSON.parse(readFileSync(resolve(dir, f), 'utf8'));
    check(resolve(dir, f), j);
  } catch {}
}

if (warnings.length) {
  console.warn('WARN: ' + warnings.length + ' style-guide warnings (not blocking):');
  const limit = 80;
  for (const w of warnings.slice(0, limit)) console.warn('  ' + w);
  if (warnings.length > limit) console.warn('  …and ' + (warnings.length - limit) + ' more.');
  process.exit(0);
}
console.log('OK: no style-guide warnings detected on EN content.');
