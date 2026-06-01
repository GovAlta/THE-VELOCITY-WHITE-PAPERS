#!/usr/bin/env node
/* reorder-collection.mjs — one-shot: rebuild the paper collection to the agreed
   16-paper structure. Keeps the two finished papers (cux4h #1, p7p2k #6),
   removes every other placeholder, and creates fresh stubs for the rest in
   three groups. Numbering derives from order.json. Re-run safe: it keys new
   stubs by title, reusing an existing id if a stub with that title already
   exists, so it will not duplicate on a second run.

   Run: node scripts/reorder-collection.mjs   (then: npm run build:index) */

import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { buildIndex } from './lib/index-build.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '..');
const P = (f) => resolve(SITE, f);
const rd = (f) => JSON.parse(readFileSync(f, 'utf8'));
const wr = (f, o) => writeFileSync(f, JSON.stringify(o, null, 2) + '\n');

const KEEP = new Set(['cux4h', 'p7p2k']);

/* The collection. Positions 1 and 6 are the finished papers, kept in place. */
const GROUPS = {
  defining: 'Defining the Problem',
  engineering: 'Engineering the Solution',
  people: 'Human and Change Management',
};
const PLAN = [
  { pos: 1,  id: 'cux4h', group: GROUPS.defining },
  { pos: 2,  group: GROUPS.defining, title: 'The Cyber Imperative', tier: 'Conceptual', subtitle: 'The cybersecurity driver, given its own treatment.' },
  { pos: 3,  group: GROUPS.defining, title: 'Git Insights', tier: 'Technical', subtitle: 'An AI read of the whole technical estate.' },
  { pos: 4,  group: GROUPS.defining, title: 'Git Insights Ministry', tier: 'Technical', subtitle: 'From estate-wide scan to a single ministry rebuild plan.' },
  { pos: 5,  group: GROUPS.defining, title: 'The Four Approaches to AI Modernization at Scale (Gov 3.0)', tier: 'Conceptual', subtitle: 'Four routes to modernization, from patching to full rebuild.' },
  { pos: 6,  id: 'p7p2k', group: GROUPS.engineering },
  { pos: 7,  group: GROUPS.engineering, title: 'Red, Blue, Green, and Yellow Agents', tier: 'Technical', subtitle: 'The agent roles that build, test, secure, and remediate.' },
  { pos: 8,  group: GROUPS.engineering, title: 'The AI Factory: Design and Ideation (Pronghorn)', tier: 'Technical', subtitle: 'Turning a requirement into a working design.' },
  { pos: 9,  group: GROUPS.engineering, title: 'The AI Factory: Orchestration and Observation (Nexus)', tier: 'Technical', subtitle: 'Running and watching a fleet of agents at scale.' },
  { pos: 10, group: GROUPS.engineering, title: 'The AI Factory: Measuring Project Delivery (The Velocity Game Engine)', tier: 'Technical', subtitle: 'Tracking delivery across people and agents.' },
  { pos: 11, group: GROUPS.engineering, title: 'The Agentic Technology Stack', tier: 'Technical', subtitle: 'The stack that runs the agent workforce.' },
  { pos: 12, group: GROUPS.people, title: 'The AI Academy: Investing in People', tier: 'Policy & People', subtitle: 'Training the public service to direct AI.' },
  { pos: 13, group: GROUPS.people, title: 'Establishing a Builder Culture', tier: 'Policy & People', subtitle: 'Shifting from buying systems to building them.' },
  { pos: 14, group: GROUPS.people, title: 'The Compression Problem', tier: 'Policy & People', subtitle: 'What happens to roles and work as delivery compresses.' },
  { pos: 15, group: GROUPS.people, title: 'Managing Change', tier: 'Policy & People', subtitle: 'Leading the organization through the shift.' },
  { pos: 16, group: GROUPS.people, title: 'Measuring Failure and Success', tier: 'Policy & People', subtitle: 'How we judge what works and what does not.' },
];

/* ---- back up everything we are about to touch ---- */
const stamp = (process.env.VW_STAMP || 'manual');
const backupDir = P('.backups/pre-reorder-' + stamp);
mkdirSync(backupDir, { recursive: true });
for (const f of readdirSync(P('data/papers'))) copyFileSync(P('data/papers/' + f), resolve(backupDir, f));
copyFileSync(P('data/order.json'), resolve(backupDir, 'order.json'));
console.log('Backed up data/papers + order.json to ' + backupDir);

/* ---- id generation (5-char [a-z][a-z0-9]{4}, unique) ---- */
const used = new Set(readdirSync(P('data/papers')).map((f) => f.split('.')[0]).filter(Boolean));
const A = 'abcdefghijklmnopqrstuvwxyz';
const AN = A + '0123456789';
function newId() {
  let id;
  do {
    id = A[Math.floor(Math.random() * 26)];
    while (id.length < 5) id += AN[Math.floor(Math.random() * 36)];
  } while (used.has(id));
  used.add(id);
  return id;
}
/* Reuse an id if a stub with this title already exists (re-run safe). */
const titleToId = {};
for (const f of readdirSync(P('data/papers'))) {
  if (!f.endsWith('.en.json')) continue;
  const pf = rd(P('data/papers/' + f));
  if (pf && pf.title) titleToId[pf.title] = pf.id;
}

function stub(id, title, tier, group, locale, subtitle) {
  const loc = locale;
  return {
    id, num: '00', sequence: '', tier, category: 'paper',
    title, subtitle: subtitle || '', track: group,
    authors: ['Ministry of Technology and Innovation'],
    published: null, reading_min: null, status: 'Draft', tags: [], repo: null,
    abstract: 'Forthcoming. This paper sits in the ' + group + ' group of the collection. The body will be written from source materials.',
    ...(loc === 'fr' ? { translation_status: 'untranslated' } : {}),
    hero_image: {
      src: 'public/images/' + id + '/' + loc + '/hero.jpg',
      alt: 'Editorial image for: ' + title,
      image_prompt: 'An editorial cover image for the whitepaper titled "' + title + '". Muted Alberta cream palette with navy and rust accents. Archival print quality, no text, no logos.',
      style_kind: 'cover',
    },
    audio: { src: 'public/audio/' + loc + '/' + id + '.mp3' },
    tldr_presentation: {
      id: id + '-tldr', title: 'The paper, in brief', locale: loc, owner_id: id,
      slides: [{
        id: '01', title, audio_file: 'public/audio/' + loc + '/' + id + '-tldr/01.mp3',
        visual: 'title', caption: group, subcaption: '',
        text: title + '. Content forthcoming.',
      }],
    },
    embedded_presentations: [],
    sections: [{ n: '01', title: 'Overview' }],
    blocks: [
      { type: 'section_heading', n: '01', title: 'Overview' },
      { type: 'paragraph', text: '<strong>Content forthcoming.</strong> The structure is in place. The body will be written from source materials, not auto-generated.' },
    ],
    _meta: { placeholder: true, written_by: 'structural-stub', notes: 'Structural stub created during the collection reorder. Body to be written from human sources.' },
    related: [],
  };
}

/* ---- assign ids and write the new linear order ---- */
const order = [];
for (const item of PLAN) {
  if (item.id) { order.push(item.id); continue; }      // kept paper
  const id = titleToId[item.title] || newId();
  item.id = id;
  order.push(id);
  if (!titleToId[item.title]) {
    wr(P('data/papers/' + id + '.en.json'), stub(id, item.title, item.tier, item.group, 'en', item.subtitle));
    wr(P('data/papers/' + id + '.fr.json'), stub(id, item.title, item.tier, item.group, 'fr', item.subtitle));
    console.log('  + created ' + id + '  ' + item.title);
  }
}

/* ---- delete every placeholder that is not in the new order ---- */
const newIds = new Set(order);
for (const f of readdirSync(P('data/papers'))) {
  const id = f.split('.')[0];
  if (newIds.has(id) || KEEP.has(id)) continue;
  unlinkSync(P('data/papers/' + f));
  console.log('  - removed ' + f);
}

/* ---- fix the kept papers: group label + related (old refs are now gone) ---- */
const byPos = (p) => order[p - 1];
function patchKept(id, group, related) {
  for (const loc of ['en', 'fr']) {
    const fp = P('data/papers/' + id + '.' + loc + '.json');
    if (!existsSync(fp)) continue;
    const pf = rd(fp);
    pf.track = group;
    pf.related = related.filter(Boolean);
    wr(fp, pf);
  }
}
patchKept('cux4h', GROUPS.defining, [byPos(2), byPos(3), byPos(5)]);
patchKept('p7p2k', GROUPS.engineering, [byPos(7), byPos(8), byPos(11)]);

/* Normalize every stub (newly created or reused-by-title) to its planned group
   and tier, and drop any related ids that no longer exist. */
for (const item of PLAN) {
  if (item.id === 'cux4h' || item.id === 'p7p2k') continue;
  for (const loc of ['en', 'fr']) {
    const fp = P('data/papers/' + item.id + '.' + loc + '.json');
    if (!existsSync(fp)) continue;
    const pf = rd(fp);
    pf.track = item.group;
    if (item.tier) pf.tier = item.tier;
    if (!pf.subtitle && item.subtitle) pf.subtitle = item.subtitle;
    pf.related = (pf.related || []).filter((r) => newIds.has(r));
    wr(fp, pf);
  }
}

/* ---- write order.json (nonlinear cleared) and rebuild the index ---- */
wr(P('data/order.json'), { order, nonlinear: [] });
buildIndex();
console.log('\nNew order (' + order.length + ' papers):');
order.forEach((id, i) => console.log('  ' + String(i + 1).padStart(2, '0') + '  ' + id));
console.log('\nWrote data/order.json and rebuilt data/papers.json.');
