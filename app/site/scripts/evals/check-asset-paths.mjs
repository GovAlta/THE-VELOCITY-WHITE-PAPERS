#!/usr/bin/env node
/* check-asset-paths.mjs — every paper's assets must be namespaced under that
   paper's id, and the file's id must match its filename. This is what keeps
   images and audio bound to their paper: ids are stable across reorder, so the
   assets stay put. A mismatch means an asset points at the wrong paper folder. */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '../..');
const dir = resolve(SITE, 'data/papers');
const issues = [];

for (const f of readdirSync(dir)) {
  const m = f.match(/^(.+)\.(en|fr)\.json$/);
  if (!m) continue;
  const fileId = m[1], loc = m[2];
  let p;
  try { p = JSON.parse(readFileSync(resolve(dir, f), 'utf8')); } catch { issues.push(f + ': unparseable'); continue; }

  if (p.id !== fileId) issues.push(f + ': id "' + p.id + '" does not match filename');
  const id = p.id;

  const imgOk = (src) => typeof src !== 'string' || !src || src.indexOf('/images/' + id + '/') !== -1;
  const audOk = (src) => typeof src !== 'string' || !src || src.indexOf('/' + id + '.mp3') !== -1 || src.indexOf('/' + id + '-tldr/') !== -1;

  if (p.hero_image && !imgOk(p.hero_image.src)) issues.push(f + ': hero image not under /images/' + id + '/ (' + p.hero_image.src + ')');
  if (p.audio && !audOk(p.audio.src)) issues.push(f + ': audio not namespaced to ' + id + ' (' + p.audio.src + ')');
  (p.blocks || []).forEach((b, i) => { if (b.image && !imgOk(b.image.src)) issues.push(f + ': block ' + i + ' image not under /images/' + id + '/ (' + b.image.src + ')'); });
  ((p.tldr_presentation && p.tldr_presentation.slides) || []).forEach((s) => {
    if (s.image && !imgOk(s.image.src)) issues.push(f + ': slide ' + s.id + ' image not under /images/' + id + '/');
    if (s.audio_file && !audOk(s.audio_file)) issues.push(f + ': slide ' + s.id + ' audio not namespaced to ' + id);
  });
  if (p.tldr_presentation && p.tldr_presentation.owner_id && p.tldr_presentation.owner_id !== id) issues.push(f + ': tldr owner_id mismatch');
}

if (issues.length) {
  console.error('FAIL: ' + issues.length + ' asset-path issue(s):');
  for (const i of issues.slice(0, 60)) console.error('  ' + i);
  process.exit(1);
}
console.log('OK: every paper\'s assets are namespaced to its id.');
