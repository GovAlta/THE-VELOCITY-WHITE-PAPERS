#!/usr/bin/env node
/* gen-about-audio.mjs — produce the long-form narration MP3 for the About page,
   using the same ElevenLabs voice-clone pipeline as the papers (scripts/lib/tts.mjs).

   The narration is built from data/pages/about.<locale>.json in a fixed order:
   the eyebrow, the lede, then the prose sections (created, tools, platform, living).
   The "use", "repos", and "also" blocks are site navigation, not narration, so they
   are skipped, as are image captions.

   Usage:
     node scripts/gen-about-audio.mjs                 # en
     node scripts/gen-about-audio.mjs --locale fr      # fr
     node scripts/gen-about-audio.mjs --force          # regenerate
*/

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { synthesizeLong } from './lib/tts.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = resolve(__dirname, '..');

const args = process.argv.slice(2);
const force = args.includes('--force');
const li = args.indexOf('--locale');
const locale = li !== -1 ? args[li + 1] : 'en';

const doc = JSON.parse(readFileSync(resolve(SITE_ROOT, `data/pages/about.${locale}.json`), 'utf8'));

const parts = [];
if (doc.eyebrow) parts.push(doc.eyebrow + '. ');
if (doc.lede) parts.push(doc.lede);
if (doc.disclaimer) parts.push(doc.disclaimer);
for (const key of ['created', 'tools', 'platform', 'use', 'living']) {
  const s = doc[key];
  if (!s) continue;
  if (s.heading) parts.push(s.heading + '.');
  for (const p of (s.paras || [])) parts.push(p);
}
const text = parts.join('\n\n');

const outRel = `public/audio/${locale}/about.mp3`;
const outPath = resolve(SITE_ROOT, outRel);
if (existsSync(outPath) && !force) { console.log('[cached] ' + outRel); process.exit(0); }
mkdirSync(dirname(outPath), { recursive: true });

console.log(`[gen] about.${locale} (${text.length} chars) -> ${outRel}`);
const buf = await synthesizeLong(text, {
  onProgress: (i, n, chars) => { if (n > 1) console.log(`       part ${i}/${n} (${chars} chars)`); },
});
writeFileSync(outPath, buf);
console.log(`[ok] ${outRel} (${(buf.length / 1024).toFixed(0)} KB)`);
