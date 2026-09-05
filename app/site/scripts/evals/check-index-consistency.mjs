#!/usr/bin/env node
/* check-index-consistency.mjs — data/papers.json is a GENERATED artifact.
   It must equal what computeIndex() produces from data/order.json + the paper
   files. If they differ, someone hand-edited the index or a paper's status/
   metadata without running `npm run build:index`. Fails the eval. */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { computeIndex } from '../lib/index-build.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '../..');

const committed = JSON.parse(readFileSync(resolve(SITE, 'data/papers.json'), 'utf8'));
const generated = computeIndex().inventory;

if (JSON.stringify(committed) === JSON.stringify(generated)) {
  console.log('OK: data/papers.json matches the generated index (' + generated.papers.length + ' entries).');
  process.exit(0);
}

console.error('FAIL: data/papers.json is out of sync with order.json + the paper files. Run `npm run build:index`.');
const byId = Object.fromEntries(generated.papers.map((p) => [p.id, p]));
for (const c of committed.papers) {
  const g = byId[c.id];
  if (!g) { console.error('  committed has extra entry: ' + c.id); continue; }
  for (const k of new Set([...Object.keys(c), ...Object.keys(g)])) {
    if (JSON.stringify(c[k]) !== JSON.stringify(g[k])) {
      console.error('  ' + c.id + '.' + k + ': committed ' + JSON.stringify(c[k]) + ' vs generated ' + JSON.stringify(g[k]));
    }
  }
}
for (const g of generated.papers) if (!committed.papers.find((c) => c.id === g.id)) console.error('  generated has entry missing from committed: ' + g.id);
process.exit(1);
