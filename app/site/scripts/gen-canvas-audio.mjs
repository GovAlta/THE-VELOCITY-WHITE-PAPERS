#!/usr/bin/env node
/* gen-canvas-audio.mjs — synthesize the per-scene narration for the Solution
   Landscape canvas (the "Listen" button in canvas:tour) from the scene
   narratives in data/canvas/landscape.json.

   Output: public/audio/<locale>/canvas/<scene-id>.mp3
   Existence-cached; pass --force to regenerate. Usage:
     node scripts/gen-canvas-audio.mjs                 # EN, all scenes
     node scripts/gen-canvas-audio.mjs --locale en --force
*/

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

const data = JSON.parse(readFileSync(resolve(SITE, 'data/canvas/landscape.json'), 'utf8'));
const scenes = data.scenes || [];

function pick(v, loc) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  let s = v[loc] || v.en || '';
  if (s.indexOf('TODO-FR:') === 0) s = s.replace('TODO-FR:', '').trim();
  return s;
}

let gen = 0, cached = 0, skipped = 0;
for (const loc of locales) {
  for (const sc of scenes) {
    const text = pick(sc.narrative, loc).trim();
    if (!text) { skipped++; continue; }
    const out = resolve(SITE, 'public/audio/' + loc + '/canvas/' + sc.id + '.mp3');
    if (existsSync(out) && !force) { cached++; console.log('[cached] ' + loc + '/canvas/' + sc.id); continue; }
    try {
      const buf = await synthesizeLong(text, { onProgress: (i, n) => { if (n > 1) process.stdout.write('.'); } });
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, buf);
      gen++;
      console.log('[ok]  ' + loc + '/canvas/' + sc.id + '.mp3 (' + (buf.length / 1024).toFixed(0) + 'KB)');
    } catch (e) {
      console.error('[err] ' + loc + '/canvas/' + sc.id + ': ' + e.message);
    }
  }
}
console.log('canvas audio: ' + gen + ' generated, ' + cached + ' cached, ' + skipped + ' skipped');
