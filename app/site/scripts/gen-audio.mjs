#!/usr/bin/env node
/* gen-audio.mjs — one-off narration generation.

   Use this to preview a narration script before committing it to a paper
   JSON. Cheaper than re-running the whole paper generator on every revision.

   Usage:
     node scripts/gen-audio.mjs --text "<narration text>" --out <path.mp3>
                                [--voice <ELEVENLABS_VOICE_ID>]   (override .env)
                                [--format mp3_44100_64|mp3_44100_128]
                                [--force]

     # Or read text from a file:
     node scripts/gen-audio.mjs --in path/to/script.txt --out scratch/take-1.mp3

   Examples:
     node scripts/gen-audio.mjs \
       --text "Paper one. The Two Billion Dollar Ship of Theseus." \
       --out scratch/intro-take-1.mp3
*/

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { synthesize } from './lib/tts.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const SITE_ROOT  = resolve(__dirname, '..');

function arg(name, fallback) {
  const i = process.argv.indexOf('--' + name);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  if (!v || v.startsWith('--')) return true;
  return v;
}
function flag(name) { return process.argv.includes('--' + name); }

const textArg = arg('text');
const inPath  = arg('in');
const out     = arg('out');
const voiceId = arg('voice', null);
const format  = arg('format', null);
const force   = flag('force');

if (!out || out === true) {
  console.error('Missing --out <path.mp3>');
  process.exit(2);
}

let text;
if (textArg && textArg !== true) {
  text = textArg;
} else if (inPath && inPath !== true) {
  text = readFileSync(resolve(SITE_ROOT, inPath), 'utf8');
} else {
  console.error('Missing --text "<script>" or --in <file>');
  process.exit(2);
}

text = text.trim();
if (!text) {
  console.error('Empty narration text.');
  process.exit(1);
}

const outPath = resolve(SITE_ROOT, out);
if (existsSync(outPath) && !force) {
  console.error('Output already exists: ' + outPath);
  console.error('Pass --force to overwrite.');
  process.exit(1);
}

console.log('Calling ElevenLabs (' + text.length + ' chars)…');
const buf = await synthesize(text, {
  voiceId: voiceId || undefined,
  outputFormat: format || undefined,
});

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, buf);

const metaPath = outPath.replace(/\.mp3$/i, '.meta.json');
writeFileSync(metaPath, JSON.stringify({
  slot: 'ad-hoc',
  voice_id: voiceId || process.env.ELEVENLABS_VOICE_ID || 'default',
  format: format || process.env.ELEVENLABS_OUTPUT_FORMAT || 'mp3_44100_64',
  text_length_chars: text.length,
  generated_at: new Date().toISOString(),
  bytes: buf.length,
  text,
  generated_by: 'gen-audio.mjs',
}, null, 2));

console.log('Wrote ' + out + ' (' + (buf.length / 1024).toFixed(1) + ' KB)');
console.log('Sidecar: ' + metaPath.replace(SITE_ROOT, '').replace(/^\\|^\//, ''));
