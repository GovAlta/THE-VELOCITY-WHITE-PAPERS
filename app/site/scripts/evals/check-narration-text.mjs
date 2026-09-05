#!/usr/bin/env node
/* check-narration-text.mjs — every slide that declares an audio_file must
   also have a non-trivial `text` field (the script the TTS provider reads).
   Catches situations where a developer adds an audio path but forgets the
   narration. */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const SITE = resolve(__dirname, '../..');
const errors = [];

function check(paperPath, j) {
  const allSlides = [
    ...((j.tldr_presentation && j.tldr_presentation.slides) || []),
    ...((j.embedded_presentations || []).flatMap(p => p.slides || [])),
  ];
  for (const s of allSlides) {
    if (s.audio_file && (!s.text || String(s.text).trim().length < 20)) {
      errors.push(paperPath + ': slide ' + s.id + ' has audio_file but missing or too-short text (< 20 chars)');
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
  console.error('FAIL: ' + errors.length + ' narration-text issues:\n');
  for (const e of errors.slice(0, 50)) console.error('  ' + e);
  if (errors.length > 50) console.error('  …and ' + (errors.length - 50) + ' more.');
  process.exit(1);
}
console.log('OK: every audio-declaring slide has a narration text.');
