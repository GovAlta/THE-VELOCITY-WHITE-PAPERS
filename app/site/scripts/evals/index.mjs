#!/usr/bin/env node
/* index.mjs — runs every eval in this folder, in order. Returns non-zero
   on the first hard failure (style-guide is a warning, not a failure). */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readdirSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

/* Auto-discover check-*.mjs files, but exclude any that need a running
   server (check-pages.mjs spawns its own; opt in via `npm run eval:pages`). */
const SERVER_CHECKS = new Set(['check-pages.mjs']);
const checks = readdirSync(__dirname)
  .filter(f => /^check-.*\.mjs$/.test(f))
  .filter(f => !SERVER_CHECKS.has(f))
  .sort();

console.log('Running ' + checks.length + ' evals…\n');
let hardFailures = 0;
for (const c of checks) {
  console.log('==== ' + c + ' ====');
  const r = spawnSync('node', [resolve(__dirname, c)], { stdio: 'inherit' });
  if (r.status !== 0) {
    hardFailures++;
    console.log('');
  }
  console.log('');
}

if (hardFailures) {
  console.error(hardFailures + ' eval(s) failed.');
  process.exit(1);
}
console.log('All evals passed.');
