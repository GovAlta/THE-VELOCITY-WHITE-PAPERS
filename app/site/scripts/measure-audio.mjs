#!/usr/bin/env node
/* measure-audio.mjs — measure each paper's longform narration MP3 and write its
   duration into the JSON, then align reading_min to the listening time.

   For every paper in data/order.json:
     - read public/audio/en/<id>.mp3 (and fr/ if present), compute its duration,
     - write audio.duration_sec (per locale) into the locale file,
     - set reading_min (a shared display field) from the EN narration duration,
       rounded to whole minutes, so the "X min" badge matches the audio length.

   Pure MP3 parsing (no ffmpeg): skips an ID3v2 tag, reads the first frame
   header, honours a Xing/Info VBR frame count when present, else falls back to
   the CBR estimate (filesize * 8 / bitrate). Run after generating narration:
       npm run measure:audio            # all papers, write JSON
       node scripts/measure-audio.mjs --dry   # report only, no writes */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '..');
const dry = process.argv.includes('--dry');

const BR = {
  1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0],   // MPEG1 Layer III
  2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0],       // MPEG2/2.5 Layer III
};
const SR = {
  3: [44100, 48000, 32000, 0],   // MPEG1
  2: [22050, 24000, 16000, 0],   // MPEG2
  0: [11025, 12000, 8000, 0],    // MPEG2.5
};

/* Duration in seconds, or null if the file isn't a parseable MP3. */
function mp3Duration(buf) {
  let off = 0;
  if (buf.length > 10 && buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) { // 'ID3'
    const sz = (buf[6] & 0x7f) * 0x200000 + (buf[7] & 0x7f) * 0x4000 + (buf[8] & 0x7f) * 0x80 + (buf[9] & 0x7f);
    off = 10 + sz;
  }
  // find first frame sync
  let i = off;
  for (; i < buf.length - 4; i++) {
    if (buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0) break;
  }
  if (i >= buf.length - 4) return null;

  const b1 = buf[i + 1], b2 = buf[i + 2];
  const verBits = (b1 >> 3) & 3;           // 3=MPEG1, 2=MPEG2, 0=MPEG2.5
  const layerBits = (b1 >> 1) & 3;         // 1=Layer III
  if (layerBits !== 1) return null;
  const brTable = verBits === 3 ? BR[1] : BR[2];
  const bitrate = brTable[(b2 >> 4) & 0xf] * 1000;
  const sampleRate = (SR[verBits] || SR[3])[(b2 >> 2) & 3];
  if (!bitrate || !sampleRate) return null;
  const samplesPerFrame = verBits === 3 ? 1152 : 576;

  const channelMode = (buf[i + 3] >> 6) & 3;          // 3 = mono
  const sideInfo = verBits === 3 ? (channelMode === 3 ? 17 : 32) : (channelMode === 3 ? 9 : 17);
  const xo = i + 4 + sideInfo;
  const tag = buf.toString('ascii', xo, xo + 4);
  if (tag === 'Xing' || tag === 'Info') {
    const flags = buf.readUInt32BE(xo + 4);
    if (flags & 1) {
      const frames = buf.readUInt32BE(xo + 8);
      return (frames * samplesPerFrame) / sampleRate;
    }
  }
  // CBR fallback
  return ((buf.length - off) * 8) / bitrate;
}

function measure(id, loc) {
  const f = resolve(SITE, 'public/audio/' + loc + '/' + id + '.mp3');
  if (!existsSync(f)) return null;
  const d = mp3Duration(readFileSync(f));
  return d ? Math.round(d) : null;
}

const order = JSON.parse(readFileSync(resolve(SITE, 'data/order.json'), 'utf8'));
const ids = [...(order.order || []), ...(order.nonlinear || [])];

let wrote = 0;
const rows = [];
for (const id of ids) {
  const enSec = measure(id, 'en');
  const frSec = measure(id, 'fr');
  const readMin = enSec ? Math.max(1, Math.round(enSec / 60)) : null;
  rows.push({ id, enSec, frSec, readMin });

  for (const loc of ['en', 'fr']) {
    const p = resolve(SITE, 'data/papers/' + id + '.' + loc + '.json');
    if (!existsSync(p)) continue;
    const doc = JSON.parse(readFileSync(p, 'utf8'));
    let changed = false;
    /* Only record EN durations for now — FR narration is deferred and not final
       (re-run this after the FR audio pass to fill fr durations). */
    if (loc === 'en' && enSec != null) {
      if (!doc.audio) doc.audio = {};
      if (doc.audio.duration_sec !== enSec) { doc.audio.duration_sec = enSec; changed = true; }
    }
    // reading_min is a shared display field; align it to the EN narration length.
    if (readMin != null && doc.reading_min !== readMin) { doc.reading_min = readMin; changed = true; }
    if (changed && !dry) { writeFileSync(p, JSON.stringify(doc, null, 2) + '\n'); wrote++; }
  }
}

const fmt = (s) => s == null ? '—' : Math.floor(s / 60) + 'm' + String(s % 60).padStart(2, '0') + 's';
console.log('id'.padEnd(8) + 'EN'.padEnd(10) + 'FR'.padEnd(10) + 'read_min');
for (const r of rows) console.log(r.id.padEnd(8) + fmt(r.enSec).padEnd(10) + fmt(r.frSec).padEnd(10) + (r.readMin ?? '—'));
const totalEn = rows.reduce((a, r) => a + (r.enSec || 0), 0);
console.log('\nEN total narration: ' + Math.floor(totalEn / 3600) + 'h ' + Math.round((totalEn % 3600) / 60) + 'm across ' + rows.filter(r => r.enSec).length + ' papers.');
console.log(dry ? '(dry run — no files written)' : (wrote + ' locale file(s) updated.'));
