#!/usr/bin/env node
/* gen-tapestry-art.mjs — generate the woven-chronicle artwork for a tapestry
   simulation (sim:tapestry).

   For each chapter in data/sims/<id>.json:
     1. panel-NN.jpg  — the embroidered tapestry panel (gpt-image-2, style +
        chapter prompt), 1536x1024.
     2. under-NN.jpg  — the engineering underdrawing, generated as an image
        EDIT conditioned on the panel so the composition matches exactly
        (this is the layer the in-engine lens reveals).

   Output: public/images/sims/<id>/{panel,under}-NN.jpg (+ .src.png kept for
   re-conditioning). Existence-cached; --force or chapter ids to regenerate.
     node scripts/gen-tapestry-art.mjs gov3-tap
     node scripts/gen-tapestry-art.mjs gov3-tap 03 07 --force */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { generatePNG, generatePNGFromReference } from './lib/images.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '..');
const args = process.argv.slice(2);
const force = args.includes('--force');
const pos = args.filter(a => !a.startsWith('--'));
const simId = pos.shift() || 'gov3-tap';
const only = pos;

let sharp;
try { sharp = (await import('sharp')).default; }
catch { console.error('sharp is required'); process.exit(1); }

const sim = JSON.parse(readFileSync(resolve(SITE, 'data/sims/' + simId + '.json'), 'utf8'));
const outDir = resolve(SITE, 'public/images/sims/' + simId);
mkdirSync(outDir, { recursive: true });

let gen = 0, cached = 0;
for (const ch of sim.chapters || []) {
  if (only.length && !only.includes(ch.id)) continue;
  const panelJpg = resolve(outDir, 'panel-' + ch.id + '.jpg');
  const panelSrc = resolve(outDir, 'panel-' + ch.id + '.src.png');
  const underJpg = resolve(outDir, 'under-' + ch.id + '.jpg');

  if (!existsSync(panelJpg) || force || only.includes(ch.id)) {
    try {
      const prompt = sim.style + '\n\nScene: ' + ch.prompt;
      const buf = await generatePNG(prompt, { size: '1536x1024', model: 'gpt-image-2' });
      writeFileSync(panelSrc, buf);
      writeFileSync(panelJpg, await sharp(buf).jpeg({ quality: 84 }).toBuffer());
      gen++;
      console.log('[ok] panel-' + ch.id);
    } catch (e) { console.error('[err] panel-' + ch.id + ': ' + e.message.slice(0, 160)); continue; }
  } else { cached++; console.log('[cached] panel-' + ch.id); }

  if ((!existsSync(underJpg) || force || only.includes(ch.id)) && existsSync(panelSrc)) {
    try {
      const buf = await generatePNGFromReference(sim.under_style, panelSrc, { size: '1536x1024', model: 'gpt-image-2' });
      writeFileSync(underJpg, await sharp(buf).jpeg({ quality: 82 }).toBuffer());
      gen++;
      console.log('[ok] under-' + ch.id);
    } catch (e) { console.error('[err] under-' + ch.id + ': ' + e.message.slice(0, 160)); }
  } else if (existsSync(underJpg)) { cached++; console.log('[cached] under-' + ch.id); }
}
console.log('tapestry art (' + simId + '): ' + gen + ' generated, ' + cached + ' cached');
