#!/usr/bin/env node
/* check-prompt-provenance.mjs — every image declared in a paper JSON must
   carry an image_prompt (text describing what to draw). Without that, the
   provenance contract breaks (no record of why this image looks the way it
   does). Also checks that hero images declare a style_kind (or default
   applies). */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const SITE = resolve(__dirname, '../..');
const errors = [];

function check(paperPath, j) {
  /* hero image */
  if (j.hero_image && j.hero_image.src) {
    if (!j.hero_image.image_prompt) errors.push(paperPath + ': hero_image.image_prompt missing');
    if (!j.hero_image.style_kind) errors.push(paperPath + ': hero_image.style_kind missing');
  }
  /* figure block images */
  let figIdx = 0;
  for (const b of (j.blocks || [])) {
    if (b.type === 'figure' && b.image && b.image.src) {
      figIdx++;
      if (!b.image.image_prompt) errors.push(paperPath + ': fig-' + String(figIdx).padStart(2,'0') + ' image_prompt missing');
    }
  }
  /* slide images */
  const slides = [
    ...((j.tldr_presentation && j.tldr_presentation.slides) || []),
    ...((j.embedded_presentations || []).flatMap(p => p.slides || [])),
  ];
  let slideIdx = 0;
  for (const s of slides) {
    if (s.visual === 'image' && s.image && s.image.src) {
      slideIdx++;
      if (!s.image.image_prompt) errors.push(paperPath + ': slide ' + s.id + ' image_prompt missing');
    }
  }
}

const dir = resolve(SITE, 'data/papers');
for (const f of readdirSync(dir)) {
  if (!/\.json$/.test(f)) continue;
  const path = resolve(dir, f);
  try {
    const j = JSON.parse(readFileSync(path, 'utf8'));
    check(path, j);
  } catch (e) { errors.push(path + ': failed to parse — ' + e.message); }
}

if (errors.length) {
  console.error('FAIL: ' + errors.length + ' prompt-provenance issues:\n');
  for (const e of errors.slice(0, 50)) console.error('  ' + e);
  if (errors.length > 50) console.error('  …and ' + (errors.length - 50) + ' more.');
  process.exit(1);
}
console.log('OK: every declared image has an image_prompt and style_kind.');
