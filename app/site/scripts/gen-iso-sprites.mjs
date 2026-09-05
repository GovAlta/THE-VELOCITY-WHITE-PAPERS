#!/usr/bin/env node
/* gen-iso-sprites.mjs — generate the isometric game sprites for a simulation.

   Reads the sprite specs (shared style + per-sprite prompt) from
   data/sims/<id>.json, asks gpt-image-2 for each on a flat magenta key
   background, chroma-keys the background away (gpt-image-2 has no native
   transparency), feathers the edge, trims with sharp, and writes:
     public/images/sims/<id>/<key>.png        (trimmed, transparent)
     public/images/sims/<id>/manifest.json    ({ key: { w, h } } pixel dims)

   Existence-cached; pass --force or a sprite key list to regenerate.
     node scripts/gen-iso-sprites.mjs gov3-iso
     node scripts/gen-iso-sprites.mjs gov3-iso agent core --force */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { generatePNG } from './lib/images.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '..');
const args = process.argv.slice(2);
const force = args.includes('--force');
const pos = args.filter(a => !a.startsWith('--'));
const simId = pos.shift() || 'gov3-iso';
const only = pos;

let sharp;
try { sharp = (await import('sharp')).default; }
catch { console.error('sharp is required'); process.exit(1); }

const sim = JSON.parse(readFileSync(resolve(SITE, 'data/sims/' + simId + '.json'), 'utf8'));
const style = sim.sprite_style || '';
const outDir = resolve(SITE, 'public/images/sims/' + simId);
mkdirSync(outDir, { recursive: true });
const manifestPath = resolve(outDir, 'manifest.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};

let gen = 0, cached = 0;
for (const [key, spec] of Object.entries(sim.sprites || {})) {
  if (only.length && !only.includes(key)) continue;
  const out = resolve(outDir, key + '.png');
  if (existsSync(out) && manifest[key] && !force && !only.includes(key)) { cached++; console.log('[cached] ' + key); continue; }
  const prompt = style + '\n\nSubject: ' + spec.prompt;
  try {
    const buf = await generatePNG(prompt, { size: '1024x1024', model: 'gpt-image-2' });
    /* chroma-key the magenta background to alpha, with edge feather + despill */
    const img = sharp(buf).ensureAlpha();
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const mag = Math.min(r, b) - g;              // how magenta the pixel is
      if (mag > 96) { data[i + 3] = 0; }
      else if (mag > 40) {
        const k = (mag - 40) / 56;                 // 0..1 feather zone
        data[i + 3] = Math.round(data[i + 3] * (1 - k));
        const avg = Math.round((r + g + b) / 3);   // despill the purple fringe
        data[i] = Math.round(r * (1 - k * 0.7) + avg * k * 0.7);
        data[i + 2] = Math.round(b * (1 - k * 0.7) + avg * k * 0.7);
      }
    }
    const trimmed = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
      .trim({ threshold: 12 })
      .resize(480, 480, { fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 9, palette: true })
      .toBuffer();
    const meta = await sharp(trimmed).metadata();
    writeFileSync(out, trimmed);
    manifest[key] = { w: meta.width, h: meta.height };
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    gen++;
    console.log('[ok]  ' + key + '.png ' + meta.width + 'x' + meta.height + ' (' + (trimmed.length / 1024).toFixed(0) + 'KB)');
  } catch (e) {
    console.error('[err] ' + key + ': ' + e.message.slice(0, 200));
  }
}
console.log('sprites (' + simId + '): ' + gen + ' generated, ' + cached + ' cached');
