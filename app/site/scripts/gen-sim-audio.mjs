#!/usr/bin/env node
/* gen-sim-audio.mjs — synthesize the per-chapter narration for a simulation
   (the sim:player engine) from the chapter narrations in data/sims/<id>.json.
   The narration audio is the player's master clock: animation step times are
   fractions of the chapter and scale to whatever duration these files have.

   Output: public/audio/<locale>/sims/<sim-id>/<chapter-id>.mp3
   Existence-cached; pass --force to regenerate. Usage:
     node scripts/gen-sim-audio.mjs gov3                  # EN, all chapters
     node scripts/gen-sim-audio.mjs gov3 --locale fr --force */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { synthesizeLong } from './lib/tts.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '..');
const args = process.argv.slice(2);
const force = args.includes('--force');
const li = args.indexOf('--locale');
const locales = li !== -1 ? [args[li + 1]] : ['en'];
const simId = args.filter(a => !a.startsWith('--') && a !== (li !== -1 ? args[li + 1] : '')).shift() || 'gov3';

const data = JSON.parse(readFileSync(resolve(SITE, 'data/sims/' + simId + '.json'), 'utf8'));
const chapters = data.chapters || [];

function pick(v, loc) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return v[loc] || '';
}

let gen = 0, cached = 0, skipped = 0;
for (const loc of locales) {
  for (const ch of chapters) {
    const text = pick(ch.narration, loc).trim();
    if (!text) { skipped++; console.log('[skip] ' + loc + '/' + ch.id + ' — no ' + loc + ' narration'); continue; }
    const out = resolve(SITE, 'public/audio/' + loc + '/sims/' + simId + '/' + ch.id + '.mp3');
    if (existsSync(out) && !force) { cached++; console.log('[cached] ' + loc + '/sims/' + simId + '/' + ch.id); continue; }
    try {
      const buf = await synthesizeLong(text, { onProgress: (i, n) => { if (n > 1) process.stdout.write('.'); } });
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, buf);
      gen++;
      console.log('[ok]  ' + loc + '/sims/' + simId + '/' + ch.id + '.mp3 (' + (buf.length / 1024).toFixed(0) + 'KB)');
    } catch (e) {
      console.error('[err] ' + loc + '/sims/' + simId + '/' + ch.id + ': ' + e.message);
    }
  }
}
console.log('sim audio (' + simId + '): ' + gen + ' generated, ' + cached + ' cached, ' + skipped + ' skipped');
