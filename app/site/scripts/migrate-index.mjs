/* migrate-index.mjs — one-time migration to the generated-index model.

   - Derives data/order.json (linear vs non-linear) from the current papers.json.
   - Lifts `related` into each paper's locale files (so the index is regenerable).
   - Sets _meta.num_override / _meta.sequence_override for non-linear entries.
   - Adds sequence_format to site.json.
   - Regenerates papers.json via buildIndex and reports what changed.

   Idempotent and reversible (data/ was backed up to .backups/). */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { buildIndex } from './lib/index-build.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '..');
const rd = (p) => JSON.parse(readFileSync(p, 'utf8'));
const wr = (p, o) => writeFileSync(p, JSON.stringify(o, null, 2) + '\n');
const paperPath = (id, loc) => resolve(SITE, 'data/papers/' + id + '.' + loc + '.json');

const cur = rd(resolve(SITE, 'data/papers.json'));
const isLinear = (e) => /^\d+$/.test(String(e.num));

const linear = cur.papers.filter(isLinear).sort((a, b) => parseInt(a.num, 10) - parseInt(b.num, 10)).map((e) => e.id);
const nonlinear = cur.papers.filter((e) => !isLinear(e)).map((e) => e.id);

wr(resolve(SITE, 'data/order.json'), { order: linear, nonlinear });
console.log('order.json: ' + linear.length + ' linear, ' + nonlinear.length + ' non-linear (' + nonlinear.join(', ') + ')');

let touched = 0;
for (const e of cur.papers) {
  for (const loc of ['en', 'fr']) {
    const p = paperPath(e.id, loc);
    if (!existsSync(p)) continue;
    const pf = rd(p);
    let changed = false;
    if (e.related !== undefined && pf.related === undefined) { pf.related = e.related; changed = true; }
    if (!isLinear(e)) {
      pf._meta = pf._meta || {};
      if (pf._meta.num_override === undefined) { pf._meta.num_override = e.num; changed = true; }
      if (pf._meta.sequence_override === undefined) { pf._meta.sequence_override = e.sequence; changed = true; }
    }
    if (changed) { wr(p, pf); touched++; }
  }
}
console.log('lifted related / overrides into ' + touched + ' locale files');

const site = rd(resolve(SITE, 'data/site.json'));
if (!site.sequence_format) {
  site.sequence_format = { en: '{i} of {N}', fr: '{i} sur {N}' };
  wr(resolve(SITE, 'data/site.json'), site);
  console.log('added sequence_format to site.json');
}

const inv = buildIndex();
console.log('papers.json regenerated: ' + inv.papers.length + ' entries');
console.log('--- sequence changes (published-only denominator) ---');
for (const e of inv.papers) {
  const old = cur.papers.find((x) => x.id === e.id);
  if (old && old.sequence !== e.sequence) console.log('  ' + e.id + ': ' + JSON.stringify(old.sequence) + ' -> ' + JSON.stringify(e.sequence));
}
console.log('done.');
