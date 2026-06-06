#!/usr/bin/env node
/* style-tells.mjs — PostToolUse hook.

   Fires after an Edit/Write. Reads the Claude Code hook payload from stdin,
   pulls the edited file path, and if it is an English paper (data/papers/*.en.json)
   runs the style-guide scanner on just that file. If the scanner flags AI tells
   or banned constructions, the hook prints them to stderr and exits 2, which
   feeds the message back to Claude so the prose gets fixed in the same turn,
   instead of slipping through to review.

   The scanner honours author_verbatim, so the author's own words never trip it.
   A clean file, a non-paper edit, or any error all exit 0 (silent, non-blocking). */

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scanner = resolve(__dirname, '../evals/check-style-guide.mjs');

let raw = '';
try { raw = readFileSync(0, 'utf8'); } catch { process.exit(0); }

let payload = {};
try { payload = JSON.parse(raw || '{}'); } catch { process.exit(0); }

const ti = payload.tool_input || {};
const fp = ti.file_path || ti.path || '';
if (!/data[\\/]papers[\\/][^\\/]+\.en\.json$/.test(fp)) process.exit(0);

const r = spawnSync(process.execPath, [scanner, fp], { encoding: 'utf8' });
if (r.status === 1) {
  process.stderr.write(
    'Style check flagged possible AI tells in this paper edit:\n' +
    String(r.stdout || '').trim() + '\n\n' +
    "Revise the flagged prose into the author's voice (see style-guide/voice-exemplar.md " +
    'and the voice notes in memory). If the flagged text is the author\'s verbatim words, ' +
    'mark it author_verbatim rather than editing it.\n'
  );
  process.exit(2);
}
process.exit(0);
