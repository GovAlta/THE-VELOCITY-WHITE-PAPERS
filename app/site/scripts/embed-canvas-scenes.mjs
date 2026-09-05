#!/usr/bin/env node
/* embed-canvas-scenes.mjs — embed each Solution Landscape scene into its home
   paper, near the end, with its Listen audio.

   Single source of truth: data/canvas/landscape.json. Each scene names its home
   paper in scene.paper. For every such paper this script:
     1. ensures the canvas bespoke_scripts (GSAP, _common, Scene) are present;
     2. inserts, just before the closing tag_row/related blocks, a short lead
        paragraph (once per paper) plus one figure per scene that references
        canvas:scene with audio enabled.

   Idempotent: a paper that already carries a canvas:scene figure is skipped, so
   the script is safe to re-run after adding new scenes. EN papers only; FR
   mirrors later. Usage: node scripts/embed-canvas-scenes.mjs [--dry] */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');

const GSAP = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
const CANVAS_SCRIPTS = [GSAP, 'components/visuals/bespoke/canvas/_common.js', 'components/visuals/bespoke/canvas/Scene.js'];

const data = JSON.parse(readFileSync(resolve(SITE, 'data/canvas/landscape.json'), 'utf8'));

/* group scenes by home paper, in dataset order */
const byPaper = {};
for (const sc of data.scenes) {
  if (!sc.paper) continue;
  (byPaper[sc.paper] = byPaper[sc.paper] || []).push(sc);
}

let changed = 0, skipped = 0, missing = 0;

for (const [paperId, scenes] of Object.entries(byPaper)) {
  const path = resolve(SITE, 'data/papers/' + paperId + '.en.json');
  if (!existsSync(path)) { console.log('[skip] ' + paperId + ' — no .en.json'); missing++; continue; }
  const paper = JSON.parse(readFileSync(path, 'utf8'));
  paper.blocks = paper.blocks || [];

  const already = paper.blocks.some(b => b.type === 'figure' && b.chart && b.chart.kind === 'canvas:scene');
  if (already) { console.log('[skip] ' + paperId + ' — already has a canvas embed'); skipped++; continue; }

  /* ensure bespoke_scripts */
  paper.bespoke_scripts = paper.bespoke_scripts || [];
  for (const s of CANVAS_SCRIPTS) if (!paper.bespoke_scripts.includes(s)) paper.bespoke_scripts.push(s);

  /* link The Canvas in Related (a clickable path to the full map, without
     adding narrated prose to the body) */
  paper.related = paper.related || [];
  if (paperId !== 'xs7uh' && !paper.related.includes('xs7uh')) paper.related.push('xs7uh');

  /* build the embed blocks: one figure per scene. The pointer text lives in the
     caption, which is not narrated, so no longform audio needs regenerating. */
  const embed = [];
  for (const sc of scenes) {
    const blurb = (sc.blurb && sc.blurb.en) || '';
    embed.push({
      type: 'figure',
      title: 'Explore this as an interactive canvas',
      caption: blurb + ' Part of The Canvas (paper 18); drag the nodes, zoom, and press Listen for a spoken walkthrough.',
      chart: { kind: 'canvas:scene', scene: sc.id, audio: true },
    });
  }

  /* insert before the first tag_row/related at the end, else append */
  let idx = paper.blocks.findIndex(b => b.type === 'tag_row' || b.type === 'related');
  if (idx === -1) idx = paper.blocks.length;
  paper.blocks.splice(idx, 0, ...embed);

  console.log('[embed] ' + paperId + ' ← ' + scenes.map(s => s.id).join(', '));
  if (!DRY) writeFileSync(path, JSON.stringify(paper, null, 2) + '\n');
  changed++;
}

console.log('\n' + (DRY ? '[dry run] ' : '') + changed + ' papers updated, ' + skipped + ' already embedded, ' + missing + ' missing.');
