#!/usr/bin/env node
/* check-audio-coverage.mjs — for every slide that declares an audio_file in
   the paper JSON, the MP3 exists on disk OR the paper is a placeholder.

   EN side: HARD failure when missing (release blocker).
   FR side: WARNING only — FR is generated downstream of EN polish.
*/

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const SITE = resolve(__dirname, '../..');
const errors = [];
const warnings = [];

function check(paperPath, j) {
  const file = basename(paperPath);
  const isEN = /\.en\.json$/.test(file);
  const isFR = /\.fr\.json$/.test(file);
  if (!isEN && !isFR) return;
  const isPlaceholder = j._meta && j._meta.placeholder === true;
  const tag = file + ': ';
  const expected = [];
  if (j.audio && j.audio.src) expected.push(j.audio.src);
  for (const s of (j.tldr_presentation && j.tldr_presentation.slides) || []) {
    if (s.audio_file) expected.push(s.audio_file);
  }
  for (const pres of (j.embedded_presentations || [])) {
    for (const s of (pres.slides || [])) if (s.audio_file) expected.push(s.audio_file);
  }
  for (const src of expected) {
    const abs = resolve(SITE, src);
    if (existsSync(abs)) {
      const size = statSync(abs).size;
      if (size < 4096) warnings.push(tag + src + ' is suspiciously small (' + size + ' bytes)');
    } else if (!isPlaceholder) {
      const msg = tag + 'declared ' + src + ' does not exist on disk';
      if (isEN) errors.push(msg);
      else warnings.push(msg);
    }
  }
}

const dir = resolve(SITE, 'data/papers');
for (const f of readdirSync(dir)) {
  if (!/\.json$/.test(f)) continue;
  const path = resolve(dir, f);
  try { check(path, JSON.parse(readFileSync(path, 'utf8'))); } catch {}
}

if (errors.length) {
  console.error('FAIL: ' + errors.length + ' EN audio gaps (release blockers):\n');
  for (const e of errors.slice(0, 50)) console.error('  ' + e);
  if (errors.length > 50) console.error('  …and ' + (errors.length - 50) + ' more.');
  if (warnings.length) {
    console.error('\nFR / size warnings (' + warnings.length + ', advisory):');
    for (const w of warnings.slice(0, 20)) console.error('  ' + w);
  }
  process.exit(1);
}
console.log('OK: EN audio coverage is complete (or papers are placeholders).');
if (warnings.length) {
  console.log('Advisory: ' + warnings.length + ' FR / size warnings.');
  for (const w of warnings.slice(0, 20)) console.log('  ' + w);
  if (warnings.length > 20) console.log('  …and ' + (warnings.length - 20) + ' more.');
}
