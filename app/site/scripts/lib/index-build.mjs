/* index-build.mjs — single source of truth for the inventory and numbering.

   data/papers.json is a GENERATED artifact, built from data/order.json plus each
   paper's PRIMARY-locale file. `num` and `sequence` are DERIVED from order
   position (sequence counts only Published papers) and stamped back into both
   locale files. Non-linear entries (companion 'P', architecture 'A-01') use
   _meta.num_override / _meta.sequence_override.

   computeIndex() is pure (reads, no writes) — used by the consistency eval.
   buildIndex() stamps num/sequence into the locale files and writes papers.json. */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '../..');           // scripts/lib -> app/site

const rd = (p) => JSON.parse(readFileSync(p, 'utf8'));
const wr = (p, o) => writeFileSync(p, JSON.stringify(o, null, 2) + '\n');
const paperPath = (id, loc) => resolve(SITE, 'data/papers/' + id + '.' + loc + '.json');
const readPaper = (id, loc) => { const p = paperPath(id, loc); return existsSync(p) ? rd(p) : null; };
const primaryLocaleOf = (id) => { const en = readPaper(id, 'en'); return (en && en.primary_locale) || 'en'; };

function seqTemplate(site, loc) {
  const f = site && site.sequence_format;
  if (f && f[loc]) return f[loc];
  return loc === 'fr' ? '{i} sur {N}' : '{i} of {N}';
}
const fmtSeq = (tmpl, i, N) => tmpl.replace('{i}', String(i)).replace('{N}', String(N));

const INVENTORY_FIELDS = ['tier', 'title', 'subtitle', 'track', 'authors', 'published', 'reading_min', 'status', 'tags', 'repo', 'abstract', 'related', 'category'];

/* Compute numbering + the projected inventory from order.json and the files.
   Pure: no writes. Returns { inventory, numbering }. */
export function computeIndex() {
  const order = rd(resolve(SITE, 'data/order.json'));
  const site = existsSync(resolve(SITE, 'data/site.json')) ? rd(resolve(SITE, 'data/site.json')) : {};
  const linear = order.order || [];
  const nonlinear = order.nonlinear || [];

  const publishedLinear = linear.filter((id) => {
    const pf = readPaper(id, primaryLocaleOf(id));
    return pf && pf.status === 'Published';
  });
  const N = publishedLinear.length;

  // Locale universe from site.json — the whole pipeline keys off this, so adding
  // a language here (not in code) flows through numbering + inventory.
  const allLocales = (site.locales || []).map((l) => l.code);
  if (!allLocales.length) allLocales.push('en');
  const def = site.default_locale || allLocales[0] || 'en';

  const numbering = {};
  linear.forEach((id, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const seq = {};
    const pf = readPaper(id, primaryLocaleOf(id));
    if (pf && pf.status === 'Published') {
      const rank = publishedLinear.indexOf(id) + 1;       // position among Published only
      for (const c of allLocales) seq[c] = fmtSeq(seqTemplate(site, c), rank, N);
    } else {
      for (const c of allLocales) seq[c] = '';
    }
    numbering[id] = { num, seq };
  });
  nonlinear.forEach((id) => {
    const pf = readPaper(id, primaryLocaleOf(id)) || {};
    const numOv = (pf._meta && pf._meta.num_override) || '';
    const seqOv = (pf._meta && pf._meta.sequence_override) || '';
    const seq = {};
    for (const c of allLocales) seq[c] = seqOv;
    numbering[id] = { num: numOv, seq };
  });

  const papers = [...linear, ...nonlinear].map((id) => {
    const loc = primaryLocaleOf(id);
    const pf = readPaper(id, loc) || {};
    const entry = { id, num: numbering[id].num, sequence: numbering[id].seq[loc] || numbering[id].seq[def] };
    for (const f of INVENTORY_FIELDS) if (pf[f] !== undefined) entry[f] = pf[f];
    /* Localized display: carry EVERY non-primary locale's title/subtitle/abstract
       (and its own narration length) so the home grid and index table can localize
       without loading each paper. Iterates all declared locales, so a new language
       appears here automatically once its paper file exists.
       (tier/track/tags stay single — they're grouping keys, kept in English.) */
    for (const c of allLocales) {
      if (c === loc) continue;
      const of = readPaper(id, c);
      if (of && !(of._meta && of._meta.placeholder)) {
        const oEntry = { title: of.title || '', subtitle: of.subtitle || '', abstract: of.abstract || '' };
        const oDur = of.audio && of.audio.duration_sec;
        if (oDur) oEntry.listen_sec = oDur;   // FR/ES audio is a different runtime than EN
        entry.i18n = entry.i18n || {};
        entry.i18n[c] = oEntry;
      }
    }
    /* Narration length (seconds) from the primary-locale longform audio, so the
       home page can total the collection's listening time. */
    const dur = pf.audio && pf.audio.duration_sec;
    if (dur) entry.listen_sec = dur;
    return entry;
  });

  const inventory = { papers };
  if (existsSync(resolve(SITE, 'data/papers.json'))) {
    const cur = rd(resolve(SITE, 'data/papers.json'));
    if (cur.categories !== undefined) inventory.categories = cur.categories;   // passthrough
  }
  return { inventory, numbering };
}

/* Build: stamp num/sequence into every locale file that exists, write papers.json. */
export function buildIndex() {
  const site = existsSync(resolve(SITE, 'data/site.json')) ? rd(resolve(SITE, 'data/site.json')) : {};
  const allLocales = (site.locales || []).map((l) => l.code);
  if (!allLocales.length) allLocales.push('en');
  const def = site.default_locale || allLocales[0] || 'en';
  const { inventory, numbering } = computeIndex();
  for (const id of Object.keys(numbering)) {
    for (const loc of allLocales) {
      const p = paperPath(id, loc);
      if (!existsSync(p)) continue;
      const pf = rd(p);
      const num = numbering[id].num;
      const seq = numbering[id].seq[loc] || numbering[id].seq[def];
      if (pf.num === num && pf.sequence === seq) continue;   // no churn on unchanged files
      pf.num = num;
      pf.sequence = seq;
      wr(p, pf);
    }
  }
  const invPath = resolve(SITE, 'data/papers.json');
  const next = JSON.stringify(inventory, null, 2) + '\n';
  if (!existsSync(invPath) || readFileSync(invPath, 'utf8') !== next) writeFileSync(invPath, next);
  return inventory;
}

export { SITE };
