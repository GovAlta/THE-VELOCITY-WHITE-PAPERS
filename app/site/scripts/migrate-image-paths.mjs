/* migrate-image-paths.mjs — one-shot script to update every paper JSON to the
   new image path layout (public/images/<id>/<locale>/<slot>.jpg) and to
   rename hero_image.prompt → hero_image.image_prompt while preserving the
   original prompt text. Also adds default style_kind and ensures audio paths
   use the locale-suffixed layout (public/audio/<locale>/<id>/...).

   Idempotent: re-running on already-migrated files makes no changes. */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const SITE = resolve(__dirname, '..');
const dir = resolve(SITE, 'data/papers');

function migrate(path) {
  const j = JSON.parse(readFileSync(path, 'utf8'));
  const file = basename(path);                                    // wp-01.en.json
  const match = file.match(/^(.*)\.(en|fr)\.json$/);
  if (!match) return { path, changed: false };
  const id = match[1];
  const locale = match[2];

  let changed = false;

  /* hero_image: move src to per-locale path; rename prompt → image_prompt */
  if (j.hero_image) {
    const expectedSrc = 'public/images/' + id + '/' + locale + '/hero.jpg';
    if (j.hero_image.src !== expectedSrc) {
      j.hero_image.src = expectedSrc;
      changed = true;
    }
    if (j.hero_image.prompt && !j.hero_image.image_prompt) {
      j.hero_image.image_prompt = j.hero_image.prompt;
      delete j.hero_image.prompt;
      changed = true;
    }
    if (!j.hero_image.style_kind) {
      j.hero_image.style_kind = 'cover';
      changed = true;
    }
  }

  /* audio: ensure long-form path is locale-prefixed */
  if (j.audio && j.audio.src) {
    const expected = 'public/audio/' + locale + '/' + id + '.mp3';
    if (j.audio.src !== expected) { j.audio.src = expected; changed = true; }
  }

  /* tldr_presentation slide audio paths: should be public/audio/<locale>/<id>-tldr/<NN>.mp3 */
  if (j.tldr_presentation) {
    j.tldr_presentation.owner_id = j.tldr_presentation.owner_id || id;
    for (const s of (j.tldr_presentation.slides || [])) {
      if (s.audio_file) {
        const expected = 'public/audio/' + locale + '/' + id + '-tldr/' + s.id + '.mp3';
        if (s.audio_file !== expected) { s.audio_file = expected; changed = true; }
      }
      if (s.image && s.image.prompt && !s.image.image_prompt) {
        s.image.image_prompt = s.image.prompt;
        delete s.image.prompt;
        changed = true;
      }
      if (s.image && !s.image.style_kind) {
        s.image.style_kind = 'diagram';
        changed = true;
      }
    }
  }

  /* figure block images: rename prompt → image_prompt; set per-locale src */
  let figIdx = 0;
  for (const b of (j.blocks || [])) {
    if (b.type === 'figure' && b.image) {
      figIdx += 1;
      const slot = 'fig-' + String(figIdx).padStart(2, '0');
      const expectedSrc = 'public/images/' + id + '/' + locale + '/' + slot + '.jpg';
      if (b.image.src !== expectedSrc) { b.image.src = expectedSrc; changed = true; }
      if (b.image.prompt && !b.image.image_prompt) {
        b.image.image_prompt = b.image.prompt;
        delete b.image.prompt;
        changed = true;
      }
      if (!b.image.style_kind) { b.image.style_kind = 'diagram'; changed = true; }
    }
  }

  if (changed) writeFileSync(path, JSON.stringify(j, null, 2));
  return { path, changed };
}

let total = 0, updated = 0;
for (const file of readdirSync(dir)) {
  if (!/\.json$/.test(file)) continue;
  total += 1;
  const r = migrate(resolve(dir, file));
  if (r.changed) {
    updated += 1;
    console.log('updated ' + file);
  }
}
console.log('\n' + updated + ' / ' + total + ' files updated.');
