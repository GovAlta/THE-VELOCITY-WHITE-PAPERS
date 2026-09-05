#!/usr/bin/env node
/* mark-reviewed.mjs — lock the 18 francophone-reviewed FR papers.

   After the corrections were transposed and round-trip verified, this stamps
   each FR paper as authoritative so future EN→FR work won't overwrite it:
     - translation_status: "reviewed"
     - _meta.fr_review: provenance (who/when/how)
     - source_signature: refreshed to the CURRENT EN (the FR is structurally in
       sync with EN — every anchor aligns 1:1 — so "in sync" is true now)
     - _meta.section_sigs: per-section hashes of the EN text, so a future EN
       change can be localized to the section that drifted and only that
       section's French re-translated, leaving the rest of the reviewed French
       untouched (the edit-server hard-overwrite path is already blocked for
       reviewed papers).

   Usage: node scripts/fr-review/mark-reviewed.mjs [--write] */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { computeSignature } from '../lib/translatable.mjs';
import { DOC_MAP } from './transpose.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '..', '..');
const write = process.argv.includes('--write');

function hash(str) { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0; return String(h); }

/* hash EN text grouped by section heading, so drift can be localized */
function sectionSigs(en) {
  const secs = {}; let cur = '00';
  for (const b of (en.blocks || [])) {
    if (b.type === 'section_heading') { cur = b.n || cur; secs[cur] = (secs[cur] || '') + '#' + (b.title || ''); }
    else { const t = b.text || b.caption || b.title || b.value || (b.image && b.image.alt) || ''; if (t) secs[cur] = (secs[cur] || '') + '|' + t; }
  }
  const out = {}; for (const k in secs) out[k] = hash(secs[k]); return out;
}

let n = 0;
for (const id of Object.values(DOC_MAP)) {
  const enPath = resolve(SITE, 'data/papers/' + id + '.en.json');
  const frPath = resolve(SITE, 'data/papers/' + id + '.fr.json');
  if (!existsSync(enPath) || !existsSync(frPath)) { console.log(id + ' — missing'); continue; }
  const en = JSON.parse(readFileSync(enPath, 'utf8'));
  const fr = JSON.parse(readFileSync(frPath, 'utf8'));
  fr.translation_status = 'reviewed';
  fr._meta = fr._meta || {};
  fr._meta.fr_review = {
    by: 'Government of Alberta francophone reviewers',
    received: '2026-06-12',
    applied: '2026-06-15',
    method: 'transpose .fr.md → JSON (scripts/fr-review/transpose.mjs), round-trip verified (verify.mjs), lexicon sweep (sweep.mjs)',
    standard: 'docs/fr-style-guide.md + data/fr-lexicon.json',
  };
  fr.source_signature = computeSignature(en);
  fr._meta.section_sigs = sectionSigs(en);
  if (write) writeFileSync(frPath, JSON.stringify(fr, null, 2) + '\n');
  n++;
  console.log(id + ' → reviewed  (sig ' + fr.source_signature + ', ' + Object.keys(fr._meta.section_sigs).length + ' sections)');
}
console.log('\n' + (write ? 'APPLIED' : 'DRY RUN') + ': ' + n + ' papers marked reviewed.');
