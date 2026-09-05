#!/usr/bin/env node
/* check-image-metadata.mjs — every generated JPG must have a .meta.json
   sidecar with the prompts that produced it. This is the transparency
   contract.

   We do NOT require every image declared in JSON to exist on disk (asset
   generation is a separate step). We only require: where an image exists,
   its sidecar exists too. */

import { readdirSync, existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const SITE = resolve(__dirname, '../..');
const IMAGES = resolve(SITE, 'public/images');
const errors = [];

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const jpgs = walk(IMAGES).filter(p => /\.jpg$/i.test(p));
let ok = 0;
for (const jpg of jpgs) {
  const meta = jpg.replace(/\.jpg$/i, '.meta.json');
  if (!existsSync(meta)) {
    errors.push('missing sidecar: ' + meta);
    continue;
  }
  let m;
  try { m = JSON.parse(readFileSync(meta, 'utf8')); }
  catch (e) { errors.push('invalid JSON: ' + meta + ' (' + e.message + ')'); continue; }

  const required = ['paper_id', 'locale', 'slot', 'style_prompt', 'image_prompt', 'composed_prompt', 'model', 'generated_at'];
  for (const k of required) {
    if (!m[k]) { errors.push(meta + ': missing field "' + k + '"'); }
  }
  if (m.style_prompt && m.style_prompt.length < 40) errors.push(meta + ': style_prompt is suspiciously short (< 40 chars)');
  if (m.image_prompt && m.image_prompt.length < 30) errors.push(meta + ': image_prompt is suspiciously short (< 30 chars)');
  if (!errors.find(e => e.startsWith(meta))) ok++;
}

if (errors.length) {
  console.error('FAIL: ' + errors.length + ' image-metadata issues:\n');
  for (const e of errors.slice(0, 80)) console.error('  ' + e);
  if (errors.length > 80) console.error('  …and ' + (errors.length - 80) + ' more.');
  process.exit(1);
}
console.log('OK: ' + jpgs.length + ' JPGs, all have valid sidecars.');
