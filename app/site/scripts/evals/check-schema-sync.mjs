#!/usr/bin/env node
/* check-schema-sync.mjs — the paper schema (scripts/lib/paper-schema.mjs) must
   match what the renderer actually handles. If BlockRenderer gains or loses a
   block type, or the visual set drifts, the draft generator would emit blocks
   the site cannot render. This fails when they diverge. */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { BLOCK_TYPES, VISUALS } from '../lib/paper-schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '../..');
const issues = [];

const matchAll = (text, re) => { const out = new Set(); let m; while ((m = re.exec(text))) out.add(m[1]); return out; };

// Block types the renderer dispatches on (block.type === '...').
const br = readFileSync(resolve(SITE, 'components/BlockRenderer.js'), 'utf8');
const rendered = matchAll(br, /block\.type === '([^']+)'/g);
for (const t of rendered) if (!BLOCK_TYPES.includes(t)) issues.push('BlockRenderer handles "' + t + '" but the schema BLOCK_TYPES does not list it');
for (const t of BLOCK_TYPES) if (!rendered.has(t)) issues.push('schema BLOCK_TYPES lists "' + t + '" but BlockRenderer does not render it');

// Visual types the slide stage handles (visual === '...').
const ps = readFileSync(resolve(SITE, 'components/PresentationStage.js'), 'utf8');
const visuals = matchAll(ps, /visual === '([^']+)'/g);
if (visuals.size) {
  for (const v of visuals) if (!VISUALS.includes(v)) issues.push('PresentationStage handles visual "' + v + '" but the schema VISUALS does not list it');
}

if (issues.length) {
  console.error('FAIL: ' + issues.length + ' schema-sync issue(s):');
  for (const i of issues) console.error('  ' + i);
  process.exit(1);
}
console.log('OK: paper schema matches the renderer (' + BLOCK_TYPES.length + ' block types, ' + VISUALS.length + ' visuals).');
