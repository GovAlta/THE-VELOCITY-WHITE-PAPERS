/* migrate-ids.mjs — one-time: rename every paper to a short, opaque, stable id
   (5 chars, [a-z][a-z0-9]{4}). The id is decoupled from the number, so reordering
   never changes a paper's id or its asset folder. Renames the locale JSON files,
   moves public/images/<id> and public/audio/.../<id>* to the new id, rewrites
   every internal reference (id, owner_id, tldr id, related[], and all asset
   paths), and updates data/order.json. Then rebuild the index.

   Reversible: data/ + assets were backed up to .backups/ first. */

import { readFileSync, writeFileSync, existsSync, renameSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { buildIndex } from './lib/index-build.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '..');
const rd = (p) => JSON.parse(readFileSync(p, 'utf8'));
const wr = (p, o) => writeFileSync(p, JSON.stringify(o, null, 2) + '\n');

const order = rd(resolve(SITE, 'data/order.json'));
const allIds = [...(order.order || []), ...(order.nonlinear || [])];

const ALPHA = 'abcdefghijklmnopqrstuvwxyz';
const ALNUM = ALPHA + '0123456789';
const isShortId = (s) => /^[a-z][a-z0-9]{4}$/.test(s);
const used = new Set(allIds.filter(isShortId));
function shortId() {
  for (;;) {
    let s = ALPHA[Math.floor(Math.random() * 26)];
    for (let i = 0; i < 4; i++) s += ALNUM[Math.floor(Math.random() * 36)];
    if (!used.has(s)) { used.add(s); return s; }
  }
}

// Map every current id that is not already a short id.
const map = {};
for (const id of allIds) map[id] = isShortId(id) ? id : shortId();

const swapAll = (s, oldId, newId) => {
  if (typeof s !== 'string') return s;
  return s
    .split('/' + oldId + '/').join('/' + newId + '/')          // public/images/<id>/...
    .split('/' + oldId + '-tldr/').join('/' + newId + '-tldr/')// .../<id>-tldr/NN.mp3
    .split('/' + oldId + '.mp3').join('/' + newId + '.mp3');   // .../<id>.mp3
};

function rewriteFile(path, oldId, newId) {
  const p = rd(path);
  p.id = newId;
  if (Array.isArray(p.related)) p.related = p.related.map((r) => map[r] || r);
  if (p.hero_image && p.hero_image.src) p.hero_image.src = swapAll(p.hero_image.src, oldId, newId);
  if (p.audio && p.audio.src) p.audio.src = swapAll(p.audio.src, oldId, newId);
  (p.blocks || []).forEach((b) => { if (b.image && b.image.src) b.image.src = swapAll(b.image.src, oldId, newId); });
  if (p.tldr_presentation) {
    const t = p.tldr_presentation;
    if (t.id) t.id = newId + '-tldr';
    if (t.owner_id) t.owner_id = newId;
    (t.slides || []).forEach((s) => {
      if (s.audio_file) s.audio_file = swapAll(s.audio_file, oldId, newId);
      if (s.image && s.image.src) s.image.src = swapAll(s.image.src, oldId, newId);
    });
  }
  wr(path, p);
}

function mvIfExists(from, to) { if (existsSync(resolve(SITE, from)) && !existsSync(resolve(SITE, to))) { renameSync(resolve(SITE, from), resolve(SITE, to)); return true; } return false; }

let renamed = 0, assetsMoved = 0;
for (const oldId of allIds) {
  const newId = map[oldId];
  if (newId === oldId) continue;
  // 1) rename + rewrite the locale files
  for (const loc of ['en', 'fr']) {
    const oldPath = resolve(SITE, 'data/papers/' + oldId + '.' + loc + '.json');
    if (!existsSync(oldPath)) continue;
    rewriteFile(oldPath, oldId, newId);
    renameSync(oldPath, resolve(SITE, 'data/papers/' + newId + '.' + loc + '.json'));
    renamed++;
  }
  // 2) move assets
  if (mvIfExists('public/images/' + oldId, 'public/images/' + newId)) assetsMoved++;
  for (const loc of ['en', 'fr']) {
    if (mvIfExists('public/audio/' + loc + '/' + oldId + '.mp3', 'public/audio/' + loc + '/' + newId + '.mp3')) assetsMoved++;
    if (mvIfExists('public/audio/' + loc + '/' + oldId + '-tldr', 'public/audio/' + loc + '/' + newId + '-tldr')) assetsMoved++;
  }
}

// 3) order.json
order.order = (order.order || []).map((id) => map[id] || id);
order.nonlinear = (order.nonlinear || []).map((id) => map[id] || id);
wr(resolve(SITE, 'data/order.json'), order);

// 4) write the id map for reference, then rebuild the index
wr(resolve(SITE, '.backups/id-map.json'), map);
const inv = buildIndex();

console.log('Renamed ' + renamed + ' locale files, moved ' + assetsMoved + ' asset paths.');
console.log('Index rebuilt: ' + inv.papers.length + ' entries.');
console.log('id map:');
for (const [o, n] of Object.entries(map)) if (o !== n) console.log('  ' + o + ' -> ' + n);
