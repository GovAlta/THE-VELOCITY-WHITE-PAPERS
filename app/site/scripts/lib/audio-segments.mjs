/* audio-segments.mjs — shared helpers for segmented, incremental narration.

   The long-form narration is built from ordered "units": the title, subtitle,
   and abstract, then every narratable block in document order. Each unit owns a
   stable segment id (`seg`) — `title`/`subtitle`/`abstract` for the meta fields,
   and the block's `bid` for a block. Each segment is synthesized to its own MP3
   under <audioDir>/<paperBase>-seg/<seg>.mp3; the full narration is the ordered
   concatenation of those segment MP3s (CBR frames join into a valid stream, the
   same property synthesizeLong relies on).

   Incremental regeneration: a unit is re-synthesized only when its content hash
   changed, its block is flagged `dirty`, its segment file is missing, or a force
   run is requested. Everything else is reused, which is where the ElevenLabs
   token savings come from. */

import crypto from 'node:crypto';
import { basename, dirname, resolve as pathResolve } from 'node:path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { synthesizeLong } from './tts.mjs';

/* Blocks whose text is spoken in the long-form narration. Mirrors the set that
   extractLongform walks in generate-audio.mjs. */
export const NARRATABLE_BLOCKS = new Set([
  'section_heading', 'paragraph', 'dropcap_paragraph', 'pullquote', 'sidenote',
]);

/* Spoken section labels, per locale (kept in sync with generate-audio.mjs). */
export const NARRATION_LABELS = {
  en: { title: 'Title. ', abstract: 'Abstract. ', quote: 'Quote. ', quoteEnd: ' End quote.' },
  fr: { title: 'Titre. ', abstract: 'Résumé. ', quote: 'Citation. ', quoteEnd: ' Fin de citation.' },
  es: { title: 'Título. ', abstract: 'Resumen. ', quote: 'Cita. ', quoteEnd: ' Fin de la cita.' },
};

/* Make text speakable: collapse [label](href) to label and spoken ratios. Kept
   identical to generate-audio.mjs narrationNormalize so hashes and audio agree. */
export function narrationNormalize(text) {
  return String(text || '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(\d)\s*:\s*(\d)/g, '$1 to $2');
}

/* The spoken text for a single block, or null if the block is not narrated. */
export function blockNarration(b, L) {
  if (b.type === 'section_heading') return (b.title || '') + '.';
  if (b.type === 'paragraph' || b.type === 'dropcap_paragraph') return (b.text || '').replace(/<[^>]+>/g, '');
  if (b.type === 'pullquote') return L.quote + (b.text || '') + L.quoteEnd;
  if (b.type === 'sidenote') return b.value || '';
  return null;
}

/* Ordered narratable units for a paper: [{ seg, text, field, block }].
   `field` is 'title'|'subtitle'|'abstract' for meta units (block === null), or
   'text' for a block unit. Blocks must carry a stable `bid`. */
export function buildUnits(content, locale) {
  const L = NARRATION_LABELS[locale] || NARRATION_LABELS.en;
  const units = [];
  if (content.title)    units.push({ seg: 'title',    field: 'title',    block: null, text: L.title + content.title + '. ' });
  if (content.subtitle) units.push({ seg: 'subtitle', field: 'subtitle', block: null, text: content.subtitle });
  if (content.abstract) units.push({ seg: 'abstract', field: 'abstract', block: null, text: L.abstract + content.abstract });
  for (const b of (content.blocks || [])) {
    const text = blockNarration(b, L);
    if (text == null || !String(text).trim()) continue;
    if (!b.bid) continue; // only segment blocks that carry a stable id
    units.push({ seg: b.bid, field: 'text', block: b, text });
  }
  return units;
}

/* A paper is segment-capable once its blocks carry stable ids. */
export function isSegmented(content) {
  return (content.blocks || []).some((b) => b.bid);
}

/* Short stable content hash of a unit's spoken text (post-normalize). */
export function hashText(text) {
  return crypto.createHash('sha1').update(narrationNormalize(String(text || ''))).digest('hex').slice(0, 12);
}

/* Segment file path (repo-relative), derived from the long-form src.
   public/audio/en/m66qi.mp3 + 'b7' -> public/audio/en/m66qi-seg/b7.mp3 */
export function segPath(longformSrc, seg) {
  const dir = dirname(longformSrc);
  const base = basename(longformSrc).replace(/\.mp3$/i, '');
  return dir + '/' + base + '-seg/' + seg + '.mp3';
}

/* Is a unit dirty (editor-flagged)? Blocks carry `dirty`; meta fields carry it
   in content.field_edits[field]. */
export function unitDirty(unit, content) {
  if (unit.block) return !!unit.block.dirty;
  const fe = content.field_edits && content.field_edits[unit.field];
  return !!(fe && fe.dirty);
}

/* Clear a unit's dirty flag after a successful regeneration (keeps edit_count /
   last_edited history intact). */
export function clearDirty(unit, content) {
  if (unit.block) { if ('dirty' in unit.block) delete unit.block.dirty; return; }
  const fe = content.field_edits && content.field_edits[unit.field];
  if (fe && 'dirty' in fe) delete fe.dirty;
}

/* ---- Pure-JS MP3 duration (seconds), no ffmpeg. Mirrors measure-audio.mjs. ---- */
const BR = {
  1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0],
  2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0],
};
const SR = { 3: [44100, 48000, 32000, 0], 2: [22050, 24000, 16000, 0], 0: [11025, 12000, 8000, 0] };

/* Regenerate a paper's long-form narration incrementally. For each narratable
   unit, reuse the existing segment MP3 unless its content hash changed, its
   block is dirty, its file is missing, or force is set; otherwise re-synthesize
   just that segment. Then stitch all segments (in document order) into the full
   narration MP3, write the segment manifest + per-segment durations back into
   content.audio, clear the regenerated units' dirty flags, and persist the JSON.
   Shared by the CLI (generate-audio.mjs) and the dev edit-server.
   Returns { regenerated, reused, duration_sec, segments }. */
export async function regenerateSegmentedNarration(content, contentPath, opts = {}) {
  const { locale = 'en', siteRoot = '.', force = false, only = null, stitchOnly = false, log = () => {} } = opts;
  const R = (rel) => pathResolve(siteRoot, rel);
  const src = content.audio.src;
  // Targeted run: regenerate exactly these segment ids and reuse everything else
  // (used by the per-item ↻ button). Otherwise regenerate what changed/dirty.
  // stitchOnly re-joins the existing segments in document order with no synthesis
  // at all (the Stitch button) — cheap, and the right tool after a reorder.
  const onlySet = Array.isArray(only) && only.length ? new Set(only) : null;
  const units = buildUnits(content, locale);
  const prevBySeg = Object.fromEntries((content.audio.segments || []).map((s) => [s.seg, s]));
  const manifest = [];
  let regenerated = 0, reused = 0;

  for (const u of units) {
    const h = hashText(u.text);
    const rel = segPath(src, u.seg);
    const abs = R(rel);
    const prev = prevBySeg[u.seg];
    const regen = stitchOnly
      ? false
      : onlySet
        ? onlySet.has(u.seg)
        : (force || unitDirty(u, content) || !(prev && prev.hash === h && existsSync(abs)));
    if (!regen) {
      if (prev && existsSync(abs)) {
        // Reuse as-is; keep the stored hash so a still-dirty (untargeted) unit
        // stays honestly dirty and countable.
        manifest.push({ seg: u.seg, src: rel, dur: prev.dur, hash: prev.hash, chars: prev.chars != null ? prev.chars : u.text.length });
        reused++;
      }
      // No existing file and not asked to build it (e.g. a new block during a
      // targeted run): omit from this run's stitch; it stays dirty for later.
      continue;
    }
    try {
      const buf = await synthesizeLong(narrationNormalize(u.text));
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, buf);
      const dur = Math.round(mp3Duration(buf) || 0);
      manifest.push({ seg: u.seg, src: rel, dur, hash: h, chars: u.text.length });
      clearDirty(u, content);
      regenerated++;
      log('regen ' + u.seg + ' → ' + rel);
    } catch (e) {
      log('ERR ' + u.seg + ': ' + ((e && e.message) || e));
      if (prev && existsSync(R(prev.src))) manifest.push(prev); // keep the stitch whole
    }
  }

  const buffers = manifest.map((m) => R(m.src)).filter((p) => existsSync(p)).map((p) => readFileSync(p));
  if (buffers.length) {
    mkdirSync(dirname(R(src)), { recursive: true });
    writeFileSync(R(src), Buffer.concat(buffers));
  }
  content.audio.segments = manifest;
  content.audio.duration_sec = manifest.reduce((a, m) => a + (m.dur || 0), 0);
  writeFileSync(contentPath, JSON.stringify(content, null, 2) + '\n');
  return { regenerated, reused, duration_sec: content.audio.duration_sec, segments: manifest.length };
}

export function mp3Duration(buf) {
  let off = 0;
  if (buf.length > 10 && buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) {
    off = 10 + (buf[6] & 0x7f) * 0x200000 + (buf[7] & 0x7f) * 0x4000 + (buf[8] & 0x7f) * 0x80 + (buf[9] & 0x7f);
  }
  let i = off;
  for (; i < buf.length - 4; i++) if (buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0) break;
  if (i >= buf.length - 4) return null;
  const b1 = buf[i + 1], b2 = buf[i + 2];
  const verBits = (b1 >> 3) & 3;
  if (((b1 >> 1) & 3) !== 1) return null;
  const bitrate = (verBits === 3 ? BR[1] : BR[2])[(b2 >> 4) & 0xf] * 1000;
  const sampleRate = (SR[verBits] || SR[3])[(b2 >> 2) & 3];
  if (!bitrate || !sampleRate) return null;
  const samplesPerFrame = verBits === 3 ? 1152 : 576;
  const channelMode = (buf[i + 3] >> 6) & 3;
  const sideInfo = verBits === 3 ? (channelMode === 3 ? 17 : 32) : (channelMode === 3 ? 9 : 17);
  const xo = i + 4 + sideInfo;
  const tag = buf.toString('ascii', xo, xo + 4);
  if (tag === 'Xing' || tag === 'Info') {
    const flags = buf.readUInt32BE(xo + 4);
    if (flags & 1) return (buf.readUInt32BE(xo + 8) * samplesPerFrame) / sampleRate;
  }
  return ((buf.length - off) * 8) / bitrate;
}
