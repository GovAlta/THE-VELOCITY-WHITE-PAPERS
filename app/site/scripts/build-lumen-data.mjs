#!/usr/bin/env node
/* build-lumen-data.mjs — generate data/sims/gov3-lumen.json (sim:lumen).

   The sixth telling: Government 3.0 as a cathedral of light. The estate is a
   field of dark, opaque MONOLITHS on a black reflecting floor — sealed legacy
   systems. Augmentation does not "add a doorway"; it transmutes the stone
   itself: each monolith CRYSTALLISES, turning from opaque rock into a faceted,
   edge-lit gem that light can pass through. Opacity literally becoming
   observability. Agents are darting motes of green light; delegated identity
   is a golden ring; the audit ledger is a tall glass slab that inscribes
   glowing lines; the rules core is a brilliant gem that ignites at the centre
   and sends light up through the whole structure; friction shows as red veins
   that a golden healing wave resolves.

   Like every sibling engine, this declares a CAST of entities and per-chapter
   BEATS (choreography keyed to fractions of the narration) which the engine
   evaluates as a pure function of (chapter, progress) — scrub-exact. Narration,
   titles, durations and caption steps are copied verbatim from gov3.json, and
   audioSim:"gov3" shares the one set of MP3s across all six engines. */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '..');
const gov3 = JSON.parse(readFileSync(resolve(SITE, 'data/sims/gov3.json'), 'utf8'));

/* ---------------- the cast ---------------- */
/* Crystals (legacy systems). A loose double ring on the floor; heights vary so
   the skyline reads like a small city of monoliths. y is half-height (they sit
   on y=0). Seeded so the layout is stable. */
const cast = [
  { id: 'floor', kind: 'floor', visible: true },
];

const NCRYS = 14;
const CH = [6.5, 9, 5, 7.5, 11, 6, 8.5, 5.5, 7, 10, 6, 8, 5.5, 9];     // heights
function mulberry(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry(7321);
const crys = [];
for (let i = 0; i < NCRYS; i++) {
  const ring = i < 8 ? 0 : 1;
  const inRing = ring === 0 ? 8 : 6;
  const idx = ring === 0 ? i : i - 8;
  const a = (idx / inRing) * Math.PI * 2 + (ring ? 0.4 : 0) + (rnd() - 0.5) * 0.18;
  const r = ring === 0 ? 15 : 27 + rnd() * 4;
  const ht = CH[i];
  const w = 2.4 + rnd() * 1.6;
  crys.push({
    id: 'c' + (i + 1), kind: 'crystal',
    x: +(Math.cos(a) * r).toFixed(2), z: +(Math.sin(a) * r).toFixed(2),
    y: +(ht / 2).toFixed(2), w: +w.toFixed(2), ht: +ht.toFixed(2),
    yaw: +(rnd() * Math.PI).toFixed(2), seed: i + 1,
  });
}
cast.push(...crys);

/* the rules core — centre, dormant until ch7 */
cast.push({ id: 'core', kind: 'core', x: 0, y: 7.5, z: 0, r: 4.2, visible: false });
/* audit ledger — a tall glass slab, rises ch4 */
cast.push({ id: 'ledger', kind: 'slab', x: 30, y: 6, z: -18, w: 7, ht: 11, d: 1.4, yaw: -0.8, visible: false,
  label: { en: 'Audit ledger', fr: 'Registre d’audit' }, labelDy: 8.5 });
/* the ephemeral interface pane — assembles ch6 */
cast.push({ id: 'pane', kind: 'pane', x: 6, y: 5.5, z: 6, w: 7, ht: 4.6, yaw: -0.6, visible: false,
  label: { en: 'An interface, for this one decision', fr: 'Une interface, pour cette seule décision' }, labelDy: 3.6 });

/* agents — darting motes of light */
cast.push({ id: 'a1', kind: 'orb', x: -34, y: 4, z: 8, r: 0.7, color: 'agent', visible: false });
cast.push({ id: 'a2', kind: 'orb', x: -32, y: 5, z: -10, r: 0.7, color: 'agent', visible: false });
for (let i = 0; i < 3; i++) cast.push({ id: 'b' + (i + 1), kind: 'orb', x: -30 + i * 3, y: 6 + i * 1.5, z: -6 + i * 7, r: 0.62, color: 'agent', visible: false });
cast.push({ id: 'a7', kind: 'orb', x: 4, y: 5, z: 8, r: 0.78, color: 'agent', visible: false });
/* delegated-identity ring around a1 (appears ch4) */
cast.push({ id: 'ring1', kind: 'ring', parent: 'a1', r: 1.5, color: 'gold', visible: false });
cast.push({ id: 'ring7', kind: 'ring', parent: 'a7', r: 1.6, color: 'gold', visible: false });

/* people — warm motes that carry information by hand, then rise to the gallery */
const PPOS = [[-9, 2, -9], [-6, 2, 5], [-2, 2, 12], [-13, 2, 2], [-10, 2, 9]];
for (let i = 0; i < 5; i++) cast.push({ id: 'p' + (i + 1), kind: 'mote', x: PPOS[i][0], y: PPOS[i][1], z: PPOS[i][2], r: 0.5, color: 'person', visible: false });

/* labels (billboards). Parented ones ride their entity. */
const L = (id, x, y, z, en, fr, dy, parent) => cast.push({ id, kind: 'label', x, y, z, label: { en, fr }, labelDy: dy, parent });
L('Lestate', 0, 0, 0, 'The estate: sealed legacy systems', 'Le parc : systèmes hérités scellés', 17);
L('Lclosed', 0, 0, 0, 'No door a machine can open', 'Aucune porte qu’une machine peut ouvrir', 4, 'c1');
L('Lglass', 0, 0, 0, 'Opacity becomes observability', 'L’opacité devient observabilité', 17);
L('Lid', 0, 0, 0, 'Delegated identity', 'Identité déléguée', 3.2, 'a1');
L('Lplain', 0, 0, 0, 'Instructed in plain language', 'Instruit en langage courant', 3.4, 'a7');
L('Lpeople', 0, 22, 0, 'People', 'Les personnes', 3);
L('Lcore', 0, 0, 0, 'Rules · policies · permissions', 'Règles · politiques · permissions', 7, 'core');
L('Lheal', 0, 0, 0, 'Friction, healed', 'La friction, guérie', 4, 'c10');

/* ---------------- learn hotspots (reuse glossary + papers) ---------------- */
const learn = {
  c3: { term: 'agent-gateway', papers: ['oxj36', 'qxlzo'],
        factoid: { en: 'Augmentation adds a governed API — a doorway a machine can use — with a role-aware lock, to systems sealed for decades.',
                   fr: 'L’augmentation ajoute une API gouvernée — une porte utilisable par une machine — avec un verrou selon les rôles, à des systèmes scellés depuis des décennies.' },
        cite: { en: 'Paper 5 · The Agent Gateway', fr: 'Livre 5 · La passerelle d’agents' } },
  ledger: { term: 'observability', papers: ['oxj36', 'l199t'],
        factoid: { en: 'Every read and write an agent makes through the gateways is recorded as it happens, so anyone with authority can replay exactly what was done, and why.',
                   fr: 'Chaque lecture et écriture qu’un agent effectue via les passerelles est consignée en temps réel, afin que toute personne autorisée puisse rejouer exactement ce qui a été fait, et pourquoi.' },
        cite: { en: 'Paper 11 · Observability', fr: 'Livre 11 · Observabilité' } },
  a1: { term: 'delegated-access', papers: ['oxj36', 'qxlzo'],
        factoid: { en: 'An agent carries a delegated identity tied to a person: it can only do what that person could do, and only what they allowed.',
                   fr: 'Un agent porte une identité déléguée liée à une personne : il ne peut faire que ce que cette personne pourrait faire, et seulement ce qu’elle a autorisé.' },
        cite: { en: 'Paper 13 · The Builder Culture', fr: 'Livre 13 · La culture du bâtisseur' } },
  core: { term: 'government-3-0', papers: ['zgym1', 'eujjc'],
        factoid: { en: 'Legislation stays the ground truth; the platform applies it as repeatable rules, so a decision comes out the same way for every person it touches.',
                   fr: 'La législation demeure la vérité de référence; la plateforme l’applique comme des règles reproductibles, de sorte qu’une décision est identique pour chaque personne concernée.' },
        cite: { en: 'Paper 2 · Government 3.0', fr: 'Livre 2 · Gouvernement 3.0' } },
};
for (const id in learn) { const e = cast.find(c => c.id === id); if (e) e.learn = learn[id]; }

/* ---------------- the choreography ---------------- */
const B = [];
const ch = (i) => { const c = []; B[i] = c; return c; };
const CRYS = crys.map(c => c.id);
const RING1 = CRYS.slice(0, 8), RING2 = CRYS.slice(8);

/* CH1 — the estate today: dark monoliths, people carrying light by hand */
{
  const c = ch(0);
  c.push({ t: [0, 0.04], do: 'appear', ids: ['floor'] });
  CRYS.forEach((id, i) => c.push({ t: [0.04 + i * 0.012, 0.12 + i * 0.012], do: 'appear', ids: [id] }));
  c.push({ t: [0.2, 0.3], do: 'label', ids: ['Lestate'] });
  c.push({ t: [0.34, 0.44], do: 'appear', ids: ['p1', 'p2', 'p3'] });
  c.push({ t: [0.36, 0.66], do: 'shuttle', id: 'p1', pts: [[-9, 2, -9], [-15, 2, 2], [10, 2, -4]], trips: 1, dots: true });
  c.push({ t: [0.58, 0.9], do: 'shuttle', id: 'p2', pts: [[-6, 2, 5], [13, 2, 6], [-4, 2, 12]], trips: 1, dots: true });
  c.push({ t: [0.64, 0.95], do: 'shuttle', id: 'p3', pts: [[-2, 2, 12], [-13, 2, 2], [11, 2, 9]], trips: 1, dots: true });
}

/* CH2 — agents find closed doors: a mote strikes a monolith, red shell flashes */
{
  const c = ch(1);
  c.push({ t: [0.02, 0.1], do: 'appear', ids: ['a1'] });
  c.push({ t: [0.04, 0.12], do: 'label', ids: ['Lid'], off: true });   // (no-op safety)
  c.push({ t: [0.1, 0.18], do: 'appear', ids: ['a2'] });
  c.push({ t: [0.28, 0.4], do: 'path', id: 'a1', pts: [[-34, 4, 8], [-12, 4, 4], [-3.5, 4, 1.5]] });
  c.push({ t: [0.4, 0.5], do: 'strike', ids: ['c1'], from: 'a1' });
  c.push({ t: [0.42, 0.52], do: 'path', id: 'a1', pts: [[-3.5, 4, 1.5], [-9, 6.5, 4], [-16, 5, 8]] });
  c.push({ t: [0.5, 0.6], do: 'path', id: 'a2', pts: [[-32, 5, -10], [-12, 5, -7], [-3, 5, -4]] });
  c.push({ t: [0.6, 0.7], do: 'strike', ids: ['c2'], from: 'a2' });
  c.push({ t: [0.62, 0.72], do: 'path', id: 'a2', pts: [[-3, 5, -4], [-10, 6, -9], [-20, 5, -10]] });
  c.push({ t: [0.56, 0.78], do: 'recolor', ids: CRYS, color: 'sealed' });
  c.push({ t: [0.64, 0.74], do: 'label', ids: ['Lclosed'] });
}

/* CH3 — augmentation: monoliths crystallise, stone -> glass, ring by ring */
{
  const c = ch(2);
  c.push({ t: [0.0, 0.08], do: 'recolor', ids: CRYS, color: 'stone' });   // clear the red
  c.push({ t: [0.02, 0.1], do: 'appear', ids: ['b1', 'b2', 'b3'] });
  /* build agents sweep; crystals turn one after another */
  const order = [...RING1, ...RING2];
  order.forEach((id, i) => {
    const t0 = 0.16 + i * 0.05;
    const b = 'b' + ((i % 3) + 1);
    const cr = crys.find(x => x.id === id);
    c.push({ t: [t0, t0 + 0.04], do: 'path', id: b, pts: [[cr.x - 6, cr.y + 2, cr.z], [cr.x - 2.5, cr.y + 1, cr.z]] });
    c.push({ t: [t0 + 0.02, t0 + 0.14], do: 'morph', ids: [id], to: 1 });
  });
  c.push({ t: [0.4, 0.5], do: 'label', ids: ['Lglass'] });
  c.push({ t: [0.86, 0.96], do: 'energy', ids: CRYS, to: 1.15 });
}

/* CH4 — identity & observability: golden rings, ledger rises and inscribes */
{
  const c = ch(3);
  c.push({ t: [0.0, 0.06], do: 'keep', ids: CRYS });           // hold crystallised state
  c.push({ t: [0.06, 0.18], do: 'appear', ids: ['ring1'] });
  c.push({ t: [0.1, 0.2], do: 'label', ids: ['Lid2'] });
  c.push({ t: [0.28, 0.4], do: 'appear', ids: ['ledger'] });
  c.push({ t: [0.32, 0.42], do: 'label', ids: ['ledger'] });
  c.push({ t: [0.34, 0.54], do: 'shuttle', id: 'a1', pts: [[-16, 5, 8], [-3, 4.5, 2]], trips: 2 });
  c.push({ t: [0.4, 0.62], do: 'stream', from: 'a1', to: 'ledger', color: 'gold', dots: true });
  c.push({ t: [0.5, 0.72], do: 'stream', from: 'c3', to: 'ledger', color: 'gold', dots: true });
  c.push({ t: [0.36, 0.94], do: 'inscribe', id: 'ledger', to: 1 });
  /* light now flows visibly through the glass: cross-links between crystals */
  c.push({ t: [0.66, 0.86], do: 'link', from: 'c3', to: 'c6', color: 'glass', signals: true });
  c.push({ t: [0.72, 0.9], do: 'link', from: 'c6', to: 'c11', color: 'glass', signals: true });
}

/* CH5 — instantiate & instruct: a person speaks, an agent crystallises from light */
{
  const c = ch(4);
  c.push({ t: [0.0, 0.06], do: 'keep', ids: [...CRYS, 'ledger', 'ring1'] });
  c.push({ t: [0.0, 0.08], do: 'energy', ids: [...CRYS, 'ledger'], to: 0.35 });   // dim the hall, spotlight the moment
  c.push({ t: [0.08, 0.16], do: 'appear', ids: ['p2'] });
  c.push({ t: [0.1, 0.34], do: 'pulse', id: 'p2', r: 9 });                          // concentric speech rings
  c.push({ t: [0.16, 0.3], do: 'stream', from: 'p2', to: 'a7', color: 'person', dots: false });
  c.push({ t: [0.2, 0.32], do: 'appear', ids: ['a7'] });
  c.push({ t: [0.22, 0.3], do: 'label', ids: ['Lplain'] });
  /* dialogue: corrections pass back and forth */
  c.push({ t: [0.4, 0.5], do: 'stream', from: 'a7', to: 'p2', color: 'agent' });
  c.push({ t: [0.52, 0.62], do: 'stream', from: 'p2', to: 'a7', color: 'person' });
  c.push({ t: [0.66, 0.78], do: 'appear', ids: ['ring7'] });
  c.push({ t: [0.7, 0.8], do: 'flare', ids: ['ring7'] });
  c.push({ t: [0.84, 0.98], do: 'energy', ids: [...CRYS, 'ledger'], to: 1 });
  c.push({ t: [0.84, 0.98], do: 'path', id: 'a7', pts: [[4, 5, 8], [-2, 5, 2], [-6, 5, -2]] });
}

/* CH6 — ephemeral interfaces: agent works the glass, builds a pane, dissolves it */
{
  const c = ch(5);
  c.push({ t: [0.0, 0.06], do: 'keep', ids: [...CRYS, 'ledger', 'ring1', 'ring7', 'a7'] });
  c.push({ t: [0.04, 0.28], do: 'shuttle', id: 'a7', pts: [[-6, 5, -2], [12, 5, -4]], trips: 2 });
  c.push({ t: [0.06, 0.26], do: 'stream', from: 'c5', to: 'c12', color: 'glass', dots: true });
  c.push({ t: [0.3, 0.4], do: 'path', id: 'a7', pts: [[12, 5, -4], [8, 5.5, 3], [6.4, 5.5, 6]] });
  c.push({ t: [0.34, 0.46], do: 'appear', ids: ['pane'] });
  c.push({ t: [0.38, 0.46], do: 'label', ids: ['pane'] });
  c.push({ t: [0.56, 0.64], do: 'flare', ids: ['pane'] });
  c.push({ t: [0.66, 0.8], do: 'dissolve', ids: ['pane'] });
  c.push({ t: [0.66, 0.78], do: 'label', ids: ['pane'], off: true });
  c.push({ t: [0.8, 0.92], do: 'shuttle', id: 'a7', pts: [[6.4, 5.5, 6], [16, 5, 4]], trips: 1 });
}

/* CH7 — Government 3.0: the cathedral assembles, the core ignites */
{
  const c = ch(6);
  c.push({ t: [0.0, 0.06], do: 'keep', ids: [...CRYS, 'ledger'] });
  c.push({ t: [0.06, 0.16], do: 'appear', ids: ['p1', 'p2', 'p3', 'p4', 'p5'] });
  /* people rise to a gallery ring above */
  for (let i = 0; i < 5; i++) {
    const a = -0.6 + i * 0.42;
    c.push({ t: [0.1 + i * 0.03, 0.32 + i * 0.03], do: 'move', id: 'p' + (i + 1), to: [Math.cos(a + 1.1) * 11, 21, Math.sin(a + 1.1) * 11] });
  }
  c.push({ t: [0.26, 0.34], do: 'label', ids: ['Lpeople'] });
  c.push({ t: [0.4, 0.6], do: 'ignite', ids: ['core'] });
  c.push({ t: [0.6, 0.68], do: 'label', ids: ['Lcore'] });
  /* spokes from the core to the ring of crystals */
  ['c2', 'c4', 'c6', 'c8', 'c11', 'c13'].forEach((id, i) =>
    c.push({ t: [0.62 + i * 0.03, 0.74 + i * 0.03], do: 'link', from: 'core', to: id, color: 'gold', signals: true }));
  /* agents orbit between the gallery and the platform */
  ['a1', 'a2', 'b1', 'b2', 'b3', 'a7'].forEach((id, i) => {
    c.push({ t: [0.5 + i * 0.02, 0.64 + i * 0.02], do: 'appear', ids: [id] });
    c.push({ t: [0.5 + i * 0.02, 0.78 + i * 0.02], do: 'orbit', id, r: 18, y: 9, speed: 0.16, phase: i * 1.05 });
  });
  c.push({ t: [0.8, 0.95], do: 'energy', ids: CRYS, to: 1.25 });
}

/* CH8 — a system that heals: red veins, a scanning wave, gold resolution */
{
  const c = ch(7);
  c.push({ t: [0.0, 0.06], do: 'keep', ids: [...CRYS, 'core', 'ledger'] });
  c.push({ t: [0.0, 0.06], do: 'ignite', ids: ['core'] });
  c.push({ t: [0.08, 0.22], do: 'stream', from: 'p1', to: 'core', color: 'gold', dots: true });
  c.push({ t: [0.16, 0.3], do: 'recolor', ids: ['c10', 'c4'], color: 'red' });    // friction veins
  c.push({ t: [0.18, 0.32], do: 'flare', ids: ['c10', 'c4'] });
  c.push({ t: [0.26, 0.34], do: 'label', ids: ['Lheal'] });
  c.push({ t: [0.4, 0.56], do: 'wave', from: 'core', r: 48, color: 'scan' });      // detection sweep
  c.push({ t: [0.5, 0.6], do: 'flare', ids: ['c10', 'c4'] });
  c.push({ t: [0.56, 0.72], do: 'stream', from: 'core', to: 'c10', color: 'gold', dots: true });
  c.push({ t: [0.78, 0.94], do: 'wave', from: 'core', r: 52, color: 'gold', heal: true });   // heals red->gold
  c.push({ t: [0.8, 0.9], do: 'label', ids: ['Lheal'], off: true });
  c.push({ t: [0.9, 1], do: 'energy', ids: [...CRYS, 'core'], to: 1.35 });
}

/* ---------------- camera scripts (spherical: th azimuth, ph polar, d dist, tg target) ---------------- */
const CAMS = [
  /* 1 estate */ [{ t: 0, th: 0.5, ph: 1.32, d: 70, tg: [0, 4, 0] }, { t: 0.5, th: 0.85, ph: 1.28, d: 62, tg: [0, 4, 0] }, { t: 1, th: 1.0, ph: 1.24, d: 64, tg: [0, 5, 0] }],
  /* 2 closed */ [{ t: 0, th: 1.0, ph: 1.24, d: 60, tg: [-4, 4, 0] }, { t: 0.4, th: 1.1, ph: 1.3, d: 36, tg: [-3, 4, 0] }, { t: 1, th: 1.2, ph: 1.26, d: 48, tg: [-4, 4, -2] }],
  /* 3 augment */ [{ t: 0, th: 1.1, ph: 1.22, d: 58, tg: [0, 5, 0] }, { t: 0.5, th: 1.7, ph: 1.12, d: 56, tg: [0, 5, 0] }, { t: 1, th: 2.2, ph: 1.16, d: 62, tg: [0, 5, 0] }],
  /* 4 identity */ [{ t: 0, th: 2.2, ph: 1.2, d: 56, tg: [6, 5, -6] }, { t: 0.4, th: 2.5, ph: 1.18, d: 50, tg: [16, 5, -10] }, { t: 1, th: 2.7, ph: 1.2, d: 56, tg: [12, 5, -8] }],
  /* 5 instruct */ [{ t: 0, th: 0.7, ph: 1.28, d: 40, tg: [-3, 4, 4] }, { t: 0.2, th: 0.8, ph: 1.32, d: 22, tg: [-1, 4, 4] }, { t: 0.85, th: 0.9, ph: 1.28, d: 30, tg: [-2, 4.5, 2] }, { t: 1, th: 1.1, ph: 1.24, d: 44, tg: [2, 5, 0] }],
  /* 6 ephemeral */ [{ t: 0, th: 1.0, ph: 1.26, d: 44, tg: [4, 5, 2] }, { t: 0.36, th: 0.7, ph: 1.3, d: 26, tg: [6.5, 5.5, 6] }, { t: 0.8, th: 0.6, ph: 1.26, d: 34, tg: [8, 5, 4] }],
  /* 7 gov3.0 */ [{ t: 0, th: 1.0, ph: 1.2, d: 56, tg: [0, 6, 0] }, { t: 0.4, th: 1.3, ph: 1.0, d: 78, tg: [0, 9, 0] }, { t: 0.7, th: 1.7, ph: 0.86, d: 80, tg: [0, 8, 0] }, { t: 1, th: 2.1, ph: 0.92, d: 76, tg: [0, 8, 0] }],
  /* 8 heals */ [{ t: 0, th: 2.1, ph: 0.96, d: 72, tg: [0, 7, 0] }, { t: 0.45, th: 2.5, ph: 1.04, d: 60, tg: [0, 6, 0] }, { t: 0.8, th: 2.9, ph: 1.0, d: 56, tg: [0, 6, 0] }, { t: 1, th: 3.2, ph: 0.96, d: 66, tg: [0, 7, 0] }],
];

/* ---------------- assemble ---------------- */
const chapters = gov3.chapters.map((g, i) => ({
  id: g.id, title: g.title, dur: g.dur, narration: g.narration,
  steps: (g.steps || []).filter(s => s.do === 'caption'),
  cam: CAMS[i], beats: B[i],
}));

const out = {
  id: 'gov3-lumen', engine: 'lumen', audioSim: 'gov3',
  title: { en: 'Government 3.0, a cathedral of light', fr: 'Gouvernement 3.0, une cathédrale de lumière' },
  blurb: {
    en: 'The sixth telling, in glass and light. The estate begins as dark, sealed monoliths on a black reflecting floor. Augmentation transmutes the stone itself: each system crystallises from opaque rock into a faceted gem that light can pass through — opacity becoming observability. Agents are motes of green light carrying golden rings of delegated identity; the audit ledger inscribes itself in a glass slab; and at the centre the rules core ignites, sending light up through the whole structure before a golden wave heals the system’s own friction. Drag to orbit, scroll to zoom, click a crystal to learn what it is.',
    fr: 'La sixième manière, en verre et en lumière. Le parc commence en monolithes sombres et scellés sur un sol noir réfléchissant. L’augmentation transmute la pierre elle-même : chaque système se cristallise, passant de roche opaque à gemme à facettes que la lumière traverse — l’opacité devenant observabilité. Les agents sont des lucioles de lumière verte portant des anneaux dorés d’identité déléguée; le registre d’audit s’inscrit dans une dalle de verre; et au centre, le noyau de règles s’embrase, envoyant la lumière à travers toute la structure avant qu’une onde dorée ne guérisse la friction du système. Glissez pour orbiter, faites défiler pour zoomer, cliquez sur un cristal pour découvrir ce qu’il est.',
  },
  cast, chapters,
};

writeFileSync(resolve(SITE, 'data/sims/gov3-lumen.json'), JSON.stringify(out, null, 1) + String.fromCharCode(10));
console.log('gov3-lumen.json written: ' + chapters.length + ' chapters, ' + cast.length + ' cast entries (' + NCRYS + ' crystals)');
