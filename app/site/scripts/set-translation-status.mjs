/* set-translation-status.mjs — one-shot script to mark every FR placeholder
   paper with `translation_status: "untranslated"` (or "draft" / "final"
   depending on _meta.placeholder). This makes the bilingual parity eval
   produce a clean status table. */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const SITE = resolve(__dirname, '..');
const dir = resolve(SITE, 'data/papers');

let updated = 0;
for (const f of readdirSync(dir)) {
  if (!/\.fr\.json$/.test(f)) continue;
  const path = resolve(dir, f);
  const j = JSON.parse(readFileSync(path, 'utf8'));
  let target = 'untranslated';
  if (j._meta && j._meta.placeholder === false) target = 'final';
  if (j._meta && j._meta.placeholder === true && j._meta.written_by === 'structural-stub') target = 'untranslated';
  if (j.translation_status === target) continue;
  j.translation_status = target;
  writeFileSync(path, JSON.stringify(j, null, 2));
  console.log('set ' + f + ' → ' + target);
  updated++;
}
console.log('\n' + updated + ' FR files updated.');
