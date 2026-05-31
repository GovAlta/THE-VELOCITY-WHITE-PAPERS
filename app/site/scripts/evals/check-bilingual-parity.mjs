#!/usr/bin/env node
/* check-bilingual-parity.mjs — bilingual workflow check.

   The site is bilingual but EN is polished FIRST. FR is generated and
   reviewed downstream. This eval reflects that:

   HARD CHECK (blocking): every paper has a valid EN file that parses,
   has the required fields, and is structurally self-consistent.

   ADVISORY (warns, does not fail): per-paper FR translation status.
   Reports for each paper whether FR exists, whether it's marked as
   placeholder, and whether its structure agrees with EN.

   This is a release-readiness report, not a "FR must be ready" gate.
*/

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const SITE = resolve(__dirname, '../..');
const hardErrors = [];
const warnings = [];
const statusReport = [];

function hard(msg) { hardErrors.push(msg); }
function warn(msg) { warnings.push(msg); }

function deriveTranslationStatus(en, fr) {
  if (!fr) return 'missing';
  if (fr._meta && fr._meta.placeholder) return 'placeholder';
  const enSec = (en.sections || []).map(s => s.n).sort().join(',');
  const frSec = (fr.sections || []).map(s => s.n).sort().join(',');
  const enSlides = ((en.tldr_presentation && en.tldr_presentation.slides) || []).map(s => s.id).sort().join(',');
  const frSlides = ((fr.tldr_presentation && fr.tldr_presentation.slides) || []).map(s => s.id).sort().join(',');
  if (enSec !== frSec || enSlides !== frSlides) return 'structure-drift';
  if (fr.translation_status) return fr.translation_status;
  return 'final';
}

function checkEN(id) {
  const en = resolve(SITE, 'data/papers/' + id + '.en.json');
  if (!existsSync(en)) { hard(id + ': missing EN file ' + en); return null; }
  let E;
  try { E = JSON.parse(readFileSync(en, 'utf8')); }
  catch (e) { hard(id + ': EN file does not parse — ' + e.message); return null; }

  const required = ['id', 'num', 'tier', 'category', 'title', 'subtitle', 'abstract', 'status'];
  for (const k of required) {
    if (!E[k]) hard(id + ': EN missing required field "' + k + '"');
  }
  if (E.id !== id) hard(id + ': EN id field mismatch (' + E.id + ')');

  /* EN structural self-consistency */
  if (E.tldr_presentation) {
    const slides = E.tldr_presentation.slides || [];
    if (slides.length === 0) warn(id + ': EN tldr_presentation has no slides');
    for (const s of slides) {
      if (!s.id) hard(id + ': EN slide missing id');
      if (s.audio_file && !/\/en\//.test(s.audio_file)) hard(id + ': EN slide ' + s.id + ' audio_file does not include /en/');
    }
  }
  if (E.hero_image && E.hero_image.src && !/\/en\//.test(E.hero_image.src)) hard(id + ': EN hero_image.src does not include /en/');
  if (E.audio && E.audio.src && !/\/en\//.test(E.audio.src)) hard(id + ': EN audio.src does not include /en/');
  return E;
}

function checkFR(id, E) {
  const fr = resolve(SITE, 'data/papers/' + id + '.fr.json');
  if (!existsSync(fr)) return { status: 'missing' };
  let F;
  try { F = JSON.parse(readFileSync(fr, 'utf8')); }
  catch (e) { warn(id + ': FR file does not parse — ' + e.message); return { status: 'broken' }; }

  /* FR is allowed to be a placeholder. We only emit warnings, never errors. */
  if (F.id !== id) warn(id + ': FR id mismatch');
  if (F.hero_image && F.hero_image.src && !/\/fr\//.test(F.hero_image.src)) warn(id + ': FR hero_image.src does not include /fr/');
  if (F.audio && F.audio.src && !/\/fr\//.test(F.audio.src)) warn(id + ': FR audio.src does not include /fr/');
  for (const s of ((F.tldr_presentation && F.tldr_presentation.slides) || [])) {
    if (s.audio_file && !/\/fr\//.test(s.audio_file)) warn(id + ': FR slide ' + s.id + ' audio_file does not include /fr/');
  }
  const status = deriveTranslationStatus(E, F);
  return { status, F };
}

const papers = JSON.parse(readFileSync(resolve(SITE, 'data/papers.json'), 'utf8')).papers;
for (const p of papers) {
  const E = checkEN(p.id);
  if (!E) { statusReport.push({ id: p.id, en: 'broken', fr: 'unknown' }); continue; }
  const { status } = checkFR(p.id, E);
  statusReport.push({ id: p.id, en: E._meta && E._meta.placeholder ? 'placeholder' : 'final', fr: status });
}

console.log('=== Translation status ===');
console.log('id'.padEnd(28) + 'EN'.padEnd(14) + 'FR');
console.log('-'.repeat(56));
for (const r of statusReport) {
  console.log(r.id.padEnd(28) + r.en.padEnd(14) + r.fr);
}
console.log('');

if (warnings.length) {
  console.log('Warnings (' + warnings.length + ', advisory):');
  for (const w of warnings.slice(0, 50)) console.log('  ' + w);
  if (warnings.length > 50) console.log('  …and ' + (warnings.length - 50) + ' more.');
  console.log('');
}

if (hardErrors.length) {
  console.error('FAIL: ' + hardErrors.length + ' EN-side hard errors:');
  for (const e of hardErrors) console.error('  ' + e);
  process.exit(1);
}
console.log('OK: EN side is self-consistent across all papers. FR status is advisory; see report above.');
