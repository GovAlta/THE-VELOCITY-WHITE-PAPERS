/* env.mjs — minimal .env loader (no external dep).
   Reads the .env file from the Whitepaper root (four parents up from this
   file at app/site/scripts/lib/) with an optional override at app/site/.env. */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

export function loadEnv() {
  const candidates = [
    resolve(__dirname, '../../../../.env'), // Whitepaper/.env (canonical)
    resolve(__dirname, '../../.env'),       // app/site/.env (optional override)
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const raw = readFileSync(path, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
      if (!m) continue;
      const key = m[1];
      let val = m[2];
      if (/^".*"$/.test(val) || /^'.*'$/.test(val)) val = val.slice(1, -1);
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}

export function need(name) {
  loadEnv();
  const v = process.env[name];
  if (!v) {
    console.error('Missing required env var: ' + name);
    process.exit(1);
  }
  return v;
}
