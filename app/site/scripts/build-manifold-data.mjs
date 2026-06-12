#!/usr/bin/env node
/* build-manifold-data.mjs — generate data/sims/gov3-manifold.json (sim:manifold v2).

   The fifth telling: the story drawn in light. The dataset declares a CAST of
   particle-formed pictograms (towers, people, agent comets, the wall, the
   ledger, the rules core) and per-chapter BEATS — choreography keyed to
   fractions of the narration — which the Manifold engine evaluates as a pure
   function of (chapter, progress). Narration, titles, durations, and caption
   steps are copied verbatim from gov3.json so all five engines share one
   script and one set of MP3s. */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '..');
const gov3 = JSON.parse(readFileSync(resolve(SITE, 'data/sims/gov3.json'), 'utf8'));

/* ---------------- the cast ---------------- */
const TX = [13, 22, 31], TZ = [-12, -1, 10];
const THT = [7, 9, 5.5, 6.5, 10, 6, 8, 5.5, 7];
const cast = [
  { id: 'floor', kind: 'floor', n: 620, color: 'dim', x: 0, y: 0, z: 0, visible: true, baseEnergy: 0.3 },
  { id: 'corp', kind: 'slab', n: 430, x: -26, y: 0, z: -1, w: 9, ht: 6.5, d: 8, color: 'corp',
    label: { en: 'Corporate tools', fr: 'Outils corporatifs' }, labelDy: 11.5 },
];
for (let i = 0; i < 9; i++) {
  const id = 'sys' + (i + 1);
  cast.push({ id, kind: 'tower', n: 215, x: TX[i % 3], y: 0, z: TZ[Math.floor(i / 3)],
    w: 4.2, ht: THT[i], d: 4.2, color: 'system' });
  cast.push({ id: 'pt' + (i + 1), kind: 'ring', n: 34, parent: id, offset: [-2.5, 2.2, 0],
    r: 1.15, color: 'gold' });
}
cast.push({ id: 'wall', kind: 'wall', n: 560, x: 8.2, y: 0, z: -1, len: 30, ht: 10.5, color: 'red' });
const PPOS = [[-7, 0, -7], [-5, 0, 4], [-1, 0, 11], [-11, 0, 0], [-9, 0, 8]];
for (let i = 0; i < 5; i++) {
  cast.push({ id: 'p' + (i + 1), kind: 'person', n: 140, x: PPOS[i][0], y: 0, z: PPOS[i][2], color: 'person' });
}
for (let i = 0; i < 3; i++) {
  cast.push({ id: 'spark' + (i + 1), kind: 'orb', n: 16, r: 0.3, parent: 'p' + (i + 1),
    offset: [0.9, 2.3, 0.4], color: 'white' });
}
cast.push({ id: 'a1', kind: 'orb', n: 110, r: 0.7, x: -20, y: 3, z: 4, color: 'agent' });
cast.push({ id: 'a2', kind: 'orb', n: 110, r: 0.7, x: -16, y: 2.5, z: -6, color: 'agent' });
for (let i = 0; i < 3; i++) {
  cast.push({ id: 'b' + (i + 1), kind: 'orb', n: 95, r: 0.62, x: -18, y: 3.5 + i * 1.5, z: -9 + i * 8, color: 'agent' });
}
cast.push({ id: 'a7', kind: 'orb', n: 130, r: 0.75, x: -0.8, y: 3.2, z: 2.4, color: 'agent' });
for (const aid of ['a1', 'a2', 'b1', 'b2', 'b3', 'a7']) {
  cast.push({ id: 'halo-' + aid, kind: 'halo', n: 28, r: 1.0, parent: aid, offset: [0, 1.5, 0], color: 'gold' });
}
cast.push({ id: 'ledger', kind: 'ledger', n: 460, x: 2, y: 0.8, z: 21, w: 9, ht: 6.5, ry: 1.26, color: 'gold',
  label: { en: 'Audit ledger', fr: 'Registre d’audit' }, labelDy: 8.4 });
cast.push({ id: 'core', kind: 'dome', n: 620, x: 0, y: 0, z: 0, r: 6.5, color: 'gold' });
cast.push({ id: 'panel1', kind: 'panel', n: 400, x: -1.2, y: 2.4, z: 5.6, w: 7, ht: 4.6, ry: 0.62, color: 'cream',
  label: { en: 'An interface for this moment', fr: 'Une interface pour ce moment' }, labelDy: 4.2 });
cast.push({ id: 'panel2', kind: 'panel', n: 240, x: 2.4, y: 2.2, z: 12.4, w: 5, ht: 3.4, ry: 0.65, color: 'cream' });
cast.push({ id: 'doc', kind: 'doc', n: 90, x: -3.2, y: 4.2, z: 3.2, ry: 0.8, color: 'cream' });
/* standalone labels (no particles) */
const L = (id, x, y, z, en, fr, dy, parent) =>
  cast.push({ id, kind: 'label', x, y, z, label: { en, fr }, labelDy: dy, parent });
L('Lmin', 22, 0, -1, 'Ministry systems', 'Systèmes ministériels', 13.5);
L('Lppl', -4, 0, 3, 'Public servants', 'Fonctionnaires', 7.8);
L('Lagent', 0, 0, 0, 'An agent', 'Un agent', 3.4, 'a1');
L('Lwall', 8.2, 0, -1, 'No interface a machine can use', 'Aucune interface utilisable par une machine', 12.5);
L('Lbuild', 0, 0, 0, 'Build agents', 'Agents de construction', 3.4, 'b2');
L('Lapi', 22, 0, -1, 'Governed APIs, role-aware locks', 'API gouvernées, verrous selon les rôles', 12.8);
L('Lid', 0, 0, 0, 'Delegated identity', 'Identité déléguée', 3.6, 'a1');
L('Lplain', 0, 0, 0, 'Instructed in plain language', 'Instruit en langage courant', 3.6, 'a7');
L('Lpeople', 0, 13, 0, 'People', 'Les personnes', 4.6);
L('Lplat', 12.5, 0, 13.5, 'The platform', 'La plateforme', 5);
L('Lrules', 0, 0, 0, 'Rules · policies · permissions', 'Règles · politiques · permissions', 9.6, 'core');
L('Lfric', 0, 0, 0, 'Friction', 'Friction', 5.4, 'sys7');
L('Lok', 0, 0, 0, 'Reviewed and approved', 'Examiné et approuvé', 3.2, 'doc');

/* ---------------- the choreography ---------------- */
/* Each beat: { t:[t0,t1], do, id|ids, ...params }. Latched by default (the end
   state persists); hold:false makes it transient (streams, flares, sparks). */
const B = [];
const ch = (i) => { const c = []; B[i] = c; return c; };
const SYS = Array.from({ length: 9 }, (_, i) => 'sys' + (i + 1));
const RING_IDS = [...SYS, 'corp', 'ledger'];

/* CH1 — the estate today */
{
  const c = ch(0);
  c.push({ t: [0, 0.05], do: 'appear', ids: ['floor'] });
  SYS.forEach((id, i) => c.push({ t: [0.06 + i * 0.018, 0.13 + i * 0.018], do: 'appear', ids: [id] }));
  c.push({ t: [0.08, 0.16], do: 'appear', ids: ['corp'] });
  c.push({ t: [0.16, 0.24], do: 'label', ids: ['Lmin'] });
  c.push({ t: [0.26, 0.36], do: 'appear', ids: ['p1', 'p2', 'p3'] });
  c.push({ t: [0.3, 0.38], do: 'label', ids: ['Lppl'] });
  c.push({ t: [0.34, 0.62], do: 'shuttle', id: 'p1', pts: [[-7, 0, -7], [-20, 0, -4], [10, 0, -10]], trips: 1 });
  c.push({ t: [0.34, 0.62], do: 'appear', ids: ['spark1'], hold: false });
  c.push({ t: [0.5, 0.58], do: 'label', ids: ['corp'] });
  c.push({ t: [0.55, 0.85], do: 'shuttle', id: 'p2', pts: [[-5, 0, 4], [10, 0, 1], [19, 0, 8]], trips: 1 });
  c.push({ t: [0.55, 0.85], do: 'appear', ids: ['spark2'], hold: false });
  c.push({ t: [0.62, 0.94], do: 'shuttle', id: 'p3', pts: [[-1, 0, 11], [-21, 0, 3], [10, 0, 9]], trips: 1 });
  c.push({ t: [0.62, 0.94], do: 'appear', ids: ['spark3'], hold: false });
}

/* CH2 — agents find closed doors */
{
  const c = ch(1);
  c.push({ t: [0.02, 0.1], do: 'appear', ids: ['a1'] });
  c.push({ t: [0.04, 0.12], do: 'label', ids: ['Lagent'] });
  c.push({ t: [0.12, 0.2], do: 'appear', ids: ['a2'] });
  c.push({ t: [0.14, 0.26], do: 'shuttle', id: 'a2', pts: [[-16, 2.5, -6], [-24, 4, -3]], trips: 2 });
  c.push({ t: [0.3, 0.42], do: 'path', id: 'a1', pts: [[-20, 3, 4], [-2, 3.2, 1], [7.4, 3, -1]] });
  c.push({ t: [0.3, 0.4], do: 'appear', ids: ['wall'] });
  c.push({ t: [0.4, 0.5], do: 'flare', ids: ['wall'], at: [8.2, 3, -1] });
  c.push({ t: [0.42, 0.52], do: 'path', id: 'a1', pts: [[7.4, 3, -1], [2.5, 4.6, 1.5], [-3, 3.2, 4]] });
  c.push({ t: [0.52, 0.62], do: 'path', id: 'a2', pts: [[-24, 4, -3], [-4, 3, -7], [7.4, 2.8, -9]] });
  c.push({ t: [0.6, 0.7], do: 'flare', ids: ['wall'], at: [8.2, 2.8, -9] });
  c.push({ t: [0.62, 0.72], do: 'path', id: 'a2', pts: [[7.4, 2.8, -9], [1.5, 4.2, -7.5], [-5, 3, -8]] });
  c.push({ t: [0.55, 0.72], do: 'recolor', ids: SYS, color: 'sealed' });
  c.push({ t: [0.62, 0.7], do: 'label', ids: ['Lwall'] });
}

/* CH3 — augmentation: the doors are stamped on, tower by tower */
{
  const c = ch(2);
  c.push({ t: [0.02, 0.1], do: 'appear', ids: ['b1', 'b2', 'b3'] });
  c.push({ t: [0.03, 0.11], do: 'label', ids: ['Lbuild'] });
  c.push({ t: [0.18, 0.74], do: 'fade', ids: ['wall'], amt: 1 });
  c.push({ t: [0.2, 0.4], do: 'fade', ids: ['Lwall'], amt: 1 });
  c.push({ t: [0.36, 0.44], do: 'label', ids: ['Lapi'] });
  /* three build agents, three towers each, interleaved */
  const BPOS = [[-18, 3.5, -9], [-18, 5, -1], [-18, 6.5, 7]];
  for (let k = 0; k < 9; k++) {
    const b = 'b' + ((k % 3) + 1);
    const i = k;
    const t0 = 0.13 + k * 0.062;
    const tx = TX[i % 3], tz = TZ[Math.floor(i / 3)];
    const from = k < 3 ? BPOS[k % 3] : [TX[(i - 3) % 3] - 5, 3, TZ[Math.floor((i - 3) / 3)]];
    c.push({ t: [t0, t0 + 0.05], do: 'path', id: b, pts: [from, [tx - 5, 3, tz]] });
    c.push({ t: [t0 + 0.04, t0 + 0.09], do: 'appear', ids: ['pt' + (i + 1)] });
    c.push({ t: [t0 + 0.04, t0 + 0.1], do: 'recolor', ids: ['sys' + (i + 1)], color: 'open' });
  }
  c.push({ t: [0.82, 0.95], do: 'energy', ids: SYS, to: 1.15 });
}

/* CH4 — identity & observability */
{
  const c = ch(3);
  ['a1', 'a2', 'b1', 'b2', 'b3'].forEach((aid, i) =>
    c.push({ t: [0.06 + i * 0.025, 0.16 + i * 0.025], do: 'appear', ids: ['halo-' + aid] }));
  c.push({ t: [0.08, 0.2], do: 'link', from: 'a1', to: 'p1', color: 'gold' });
  c.push({ t: [0.1, 0.22], do: 'link', from: 'a2', to: 'p2', color: 'gold' });
  c.push({ t: [0.12, 0.24], do: 'link', from: 'b2', to: 'p3', color: 'gold' });
  c.push({ t: [0.1, 0.18], do: 'label', ids: ['Lid'] });
  c.push({ t: [0.3, 0.42], do: 'appear', ids: ['ledger'] });
  c.push({ t: [0.34, 0.42], do: 'label', ids: ['ledger'] });
  c.push({ t: [0.34, 0.52], do: 'shuttle', id: 'a1', pts: [[-3, 3.2, 4], [10.8, 3, -1]], trips: 2 });
  c.push({ t: [0.44, 0.62], do: 'shuttle', id: 'a2', pts: [[-5, 3, -8], [10.8, 3, -12]], trips: 2 });
  c.push({ t: [0.38, 0.54], do: 'stream', from: 'a1', to: 'ledger', color: 'gold', dots: true, hold: false });
  c.push({ t: [0.52, 0.68], do: 'stream', from: 'a2', to: 'ledger', color: 'gold', dots: true, hold: false });
  c.push({ t: [0.66, 0.84], do: 'stream', from: 'b2', to: 'ledger', color: 'gold', dots: true, hold: false });
  c.push({ t: [0.36, 0.92], do: 'tick', id: 'ledger', amt: 1 });
}

/* CH5 — instantiate & instruct: the agent condenses out of the words */
{
  const c = ch(4);
  c.push({ t: [0.02, 0.12], do: 'energy', ids: [...SYS, 'corp', 'ledger', 'p1', 'p3', 'floor'], to: 0.3 });
  c.push({ t: [0.02, 0.1], do: 'fade', ids: ['a1', 'a2', 'b1', 'b2', 'b3', 'halo-a1', 'halo-a2', 'halo-b1', 'halo-b2', 'halo-b3', 'Lagent', 'Lid', 'Lbuild', 'Lapi', 'Lmin', 'Lppl', 'ledger'], amt: 1 });
  c.push({ t: [0.1, 0.3], do: 'stream', from: 'p2', to: 'a7', color: 'person', hold: false });
  c.push({ t: [0.16, 0.32], do: 'appear', ids: ['a7'] });
  c.push({ t: [0.16, 0.24], do: 'label', ids: ['Lplain'] });
  c.push({ t: [0.36, 0.46], do: 'stream', from: 'a7', to: 'p2', color: 'agent', hold: false });
  c.push({ t: [0.44, 0.5], do: 'appear', ids: ['doc'] });
  c.push({ t: [0.46, 0.64], do: 'tick', id: 'doc', amt: 1 });
  c.push({ t: [0.48, 0.56], do: 'stream', from: 'p2', to: 'a7', color: 'person', hold: false });
  c.push({ t: [0.56, 0.64], do: 'stream', from: 'a7', to: 'p2', color: 'agent', hold: false });
  c.push({ t: [0.7, 0.78], do: 'appear', ids: ['halo-a7'] });
  c.push({ t: [0.72, 0.78], do: 'flare', ids: ['halo-a7'] });
  c.push({ t: [0.8, 0.84], do: 'fade', ids: ['doc'], amt: 1 });
  c.push({ t: [0.82, 0.97], do: 'path', id: 'a7', pts: [[-0.8, 3.2, 2.4], [10, 2.6, -1], [16, 2.6, -1]] });
}

/* CH6 — ephemeral interfaces */
{
  const c = ch(5);
  c.push({ t: [0.02, 0.1], do: 'energy', ids: [...SYS, 'corp', 'floor'], to: 1 });
  c.push({ t: [0.02, 0.3], do: 'shuttle', id: 'a7', pts: [[16, 2.6, -1], [-22, 3.2, -1]], trips: 2 });
  c.push({ t: [0.06, 0.28], do: 'stream', from: 'corp', to: 'sys5', color: 'agent', dots: true, hold: false });
  c.push({ t: [0.3, 0.42], do: 'path', id: 'a7', pts: [[16, 2.6, -1], [4, 3.4, 2], [-0.5, 3, 5]] });
  c.push({ t: [0.3, 0.42], do: 'energy', ids: [...SYS, 'corp'], to: 0.4 });
  c.push({ t: [0.78, 0.88], do: 'energy', ids: [...SYS, 'corp'], to: 0.9 });
  c.push({ t: [0.34, 0.46], do: 'appear', ids: ['panel1'] });
  c.push({ t: [0.38, 0.46], do: 'label', ids: ['panel1'] });
  c.push({ t: [0.56, 0.64], do: 'flare', ids: ['panel1'], part: 'button' });
  c.push({ t: [0.58, 0.66], do: 'stream', from: 'p2', to: 'a7', color: 'person', hold: false });
  c.push({ t: [0.66, 0.78], do: 'dissolve', ids: ['panel1'] });
  c.push({ t: [0.68, 0.76], do: 'label', ids: ['panel1'], off: true });
  c.push({ t: [0.78, 0.84], do: 'path', id: 'a7', pts: [[-0.5, 3, 5], [1.5, 3, 10.5]] });
  c.push({ t: [0.82, 0.88], do: 'appear', ids: ['panel2'] });
  c.push({ t: [0.92, 0.99], do: 'dissolve', ids: ['panel2'] });
}

/* CH7 — Government 3.0: the destination architecture */
{
  const c = ch(6);
  /* people rise to the top arc */
  c.push({ t: [0.08, 0.18], do: 'appear', ids: ['p4', 'p5'] });
  for (let i = 0; i < 5; i++) {
    const a = -0.7 + i * 0.35;
    c.push({ t: [0.1 + i * 0.03, 0.3 + i * 0.03], do: 'move', id: 'p' + (i + 1),
      to: [Math.cos(a + 1.2) * 9, 12.5, Math.sin(a + 1.2) * 9] });
  }
  c.push({ t: [0.24, 0.32], do: 'label', ids: ['Lpeople'] });
  /* the estate migrates into the platform ring */
  RING_IDS.forEach((id, i) => {
    const a = (i / RING_IDS.length) * Math.PI * 2 + 0.3;
    c.push({ t: [0.22 + i * 0.022, 0.42 + i * 0.022, ], do: 'move', id,
      to: [Math.cos(a) * 17.5, 0, Math.sin(a) * 17.5] });
    if (id !== 'ledger') c.push({ t: [0.26 + i * 0.022, 0.46 + i * 0.022], do: 'squash', id, sy: 0.34 });
  });
  c.push({ t: [0.3, 0.4], do: 'energy', ids: ['ledger'], to: 1 });
  c.push({ t: [0.46, 0.54], do: 'label', ids: ['Lplat'] });
  c.push({ t: [0.5, 0.7], do: 'appear', ids: ['core'] });
  c.push({ t: [0.62, 0.7], do: 'label', ids: ['Lrules'] });
  /* spokes: the platform applies the rules */
  ['sys2', 'sys5', 'sys8', 'corp'].forEach((id, i) =>
    c.push({ t: [0.7 + i * 0.03, 0.8 + i * 0.03], do: 'link', from: 'core', to: id, color: 'gold', signals: true }));
  /* agents orbit between people and platform */
  ['a1', 'a2', 'b1', 'b2', 'b3', 'a7'].forEach((id, i) => {
    c.push({ t: [0.55 + i * 0.02, 0.7 + i * 0.02], do: 'appear', ids: [id, 'halo-' + id] });
    c.push({ t: [0.55 + i * 0.02, 0.75 + i * 0.02], do: 'orbit', id, r: 12, y: 7, speed: 0.22, phase: i * 1.05 });
  });
}

/* CH8 — a system that heals */
{
  const c = ch(7);
  c.push({ t: [0.02, 0.2], do: 'stream', from: 'p2', to: 'core', color: 'gold', dots: true, hold: false });
  c.push({ t: [0.08, 0.26], do: 'stream', from: 'core', to: 'sys5', color: 'gold', dots: true, hold: false });
  c.push({ t: [0.16, 0.32], do: 'recolor', ids: ['sys3', 'sys7'], color: 'red' });
  c.push({ t: [0.18, 0.34], do: 'flare', ids: ['sys3', 'sys7'] });
  c.push({ t: [0.26, 0.34], do: 'label', ids: ['Lfric'] });
  c.push({ t: [0.38, 0.52], do: 'wave', from: 'core', r: 40, color: 'scan' });
  c.push({ t: [0.44, 0.54], do: 'flare', ids: ['sys3', 'sys7'] });
  c.push({ t: [0.5, 0.56], do: 'appear', ids: ['doc'] });
  c.push({ t: [0.5, 0.56], do: 'tick', id: 'doc', amt: 1 });
  c.push({ t: [0.52, 0.66], do: 'path', id: 'doc', pts: [[0, 7, 0], [0, 10.5, 4.5], [0.5, 12, 8]] });
  c.push({ t: [0.68, 0.76], do: 'flare', ids: ['doc'] });
  c.push({ t: [0.7, 0.78], do: 'label', ids: ['Lok'] });
  c.push({ t: [0.78, 0.92], do: 'wave', from: 'core', r: 42, color: 'gold', heal: true });
  c.push({ t: [0.8, 0.9], do: 'fade', ids: ['Lfric'], amt: 1 });
  c.push({ t: [0.9, 1], do: 'energy', ids: [...RING_IDS, 'core'], to: 1.2 });
}

/* ---------------- camera scripts ---------------- */
const CAMS = [
  [{ t: 0, th: 0.5, ph: 1.12, d: 78, tg: [0, 3, 0] }, { t: 0.5, th: 0.82, ph: 1.12, d: 70, tg: [0, 3, 0] }, { t: 1, th: 0.95, ph: 1.1, d: 72, tg: [0, 3, 0] }],
  [{ t: 0, th: 0.95, ph: 1.1, d: 62, tg: [0, 3, 0] }, { t: 0.35, th: 1.05, ph: 1.15, d: 44, tg: [4, 3, -1] }, { t: 0.75, th: 1.1, ph: 1.1, d: 56, tg: [2, 3, -2] }],
  [{ t: 0, th: 1.0, ph: 1.1, d: 58, tg: [10, 3, 0] }, { t: 0.5, th: 1.45, ph: 1.05, d: 52, tg: [20, 3, 0] }, { t: 1, th: 1.7, ph: 1.1, d: 60, tg: [16, 3, 0] }],
  [{ t: 0, th: 0.8, ph: 1.1, d: 56, tg: [4, 2, 4] }, { t: 0.4, th: 0.55, ph: 1.12, d: 48, tg: [3, 2.5, 10] }, { t: 1, th: 0.5, ph: 1.1, d: 52, tg: [3, 2.5, 8] }],
  [{ t: 0, th: 0.8, ph: 1.12, d: 40, tg: [-2, 2, 4] }, { t: 0.14, th: 0.85, ph: 1.2, d: 24, tg: [-2.6, 2.8, 4.4] }, { t: 0.8, th: 0.9, ph: 1.18, d: 30, tg: [-1, 2.8, 4] }, { t: 1, th: 1.0, ph: 1.12, d: 42, tg: [4, 2.6, 2] }],
  [{ t: 0, th: 0.9, ph: 1.12, d: 46, tg: [-6, 2.5, 2] }, { t: 0.34, th: 0.92, ph: 1.18, d: 34, tg: [-2.5, 2.8, 4.8] }, { t: 0.72, th: 0.95, ph: 1.15, d: 40, tg: [-1, 2.6, 6] }, { t: 0.86, th: 0.9, ph: 1.16, d: 36, tg: [1.5, 2.5, 11] }],
  [{ t: 0, th: 1.0, ph: 1.1, d: 50, tg: [0, 3, 0] }, { t: 0.38, th: 1.2, ph: 0.98, d: 70, tg: [0, 6, 0] }, { t: 0.8, th: 1.5, ph: 0.96, d: 74, tg: [0, 6, 0] }, { t: 1, th: 1.7, ph: 0.98, d: 72, tg: [0, 6, 0] }],
  [{ t: 0, th: 1.7, ph: 1.0, d: 72, tg: [0, 6, 0] }, { t: 0.45, th: 2.1, ph: 1.0, d: 66, tg: [0, 6, 0] }, { t: 0.8, th: 2.35, ph: 1.04, d: 58, tg: [0, 5, 0] }, { t: 1, th: 2.5, ph: 1.0, d: 68, tg: [0, 5, 0] }],
];

/* ---------------- assemble ---------------- */
const chapters = gov3.chapters.map((g, i) => ({
  id: g.id,
  title: g.title,
  dur: g.dur,
  narration: g.narration,
  steps: (g.steps || []).filter(s => s.do === 'caption'),
  cam: CAMS[i],
  beats: B[i],
}));

const out = {
  id: 'gov3-manifold',
  engine: 'manifold',
  audioSim: 'gov3',
  title: { en: 'Government 3.0, drawn in light', fr: 'Gouvernement 3.0, dessiné en lumière' },
  blurb: {
    en: 'The fifth telling: the estate, the people, and the agents condensed out of seven thousand particles. The wall flashes red where agents strike it, doors stamp gold onto the towers, the audit ledger writes itself line by line, and the finale heals the system’s own friction in a single golden wave. Drag to orbit, scroll to zoom.',
    fr: 'La cinquième manière : le parc, les personnes et les agents condensés en sept mille particules. Le mur rougeoie là où les agents le frappent, des portes dorées se gravent sur les tours, le registre d’audit s’écrit ligne par ligne, et le final guérit la friction du système en une seule onde dorée. Glissez pour orbiter, faites défiler pour zoomer.',
  },
  cast,
  chapters,
};

const total = cast.reduce((s, c) => s + (c.kind === 'label' ? 0 : c.n || 0), 0);
writeFileSync(resolve(SITE, 'data/sims/gov3-manifold.json'), JSON.stringify(out, null, 1) + String.fromCharCode(10));
console.log('gov3-manifold.json written: ' + chapters.length + ' chapters, ' + cast.length + ' cast entries, ' + total + ' cast particles');
