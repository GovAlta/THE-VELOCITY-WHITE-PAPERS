#!/usr/bin/env node
/* generate-audio.mjs — produce MP3 narration files per paper and per slide.

   For each paper in data/papers.json, for each locale (en, fr):
     - Read data/papers/<id>.<locale>.json
     - Walk paper.tldr_presentation.slides + paper.embedded_presentations[].slides
       Each slide.audio_file becomes a generated MP3 (using slide.text).
     - If paper.audio is set with no per-slide narration provided, also produce
       a single long-form narration MP3 from the abstract + body paragraphs at
       paper.audio.src.

   Usage:
     node scripts/generate-audio.mjs                    # all papers, all locales
     node scripts/generate-audio.mjs wp-01              # one paper, all locales
     node scripts/generate-audio.mjs --locale fr        # all papers, FR only
     node scripts/generate-audio.mjs wp-01 --locale en  # one paper, EN only
     node scripts/generate-audio.mjs --force            # regenerate
     node scripts/generate-audio.mjs --no-longform      # skip full-paper narration
     node scripts/generate-audio.mjs --tldr-only        # only TL;DR + embedded
*/

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { synthesize } from './lib/tts.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const SITE_ROOT  = resolve(__dirname, '..');

const args = process.argv.slice(2);
const force      = args.includes('--force');
const noLongform = args.includes('--no-longform');
const tldrOnly   = args.includes('--tldr-only');
const localeIdx  = args.indexOf('--locale');
const locales    = localeIdx !== -1 ? [args[localeIdx + 1]] : ['en', 'fr'];
const onlyIds    = args.filter(a => !a.startsWith('--') && a !== (localeIdx !== -1 ? args[localeIdx + 1] : ''));

function extractLongform(content) {
  const out = [];
  if (content.title)    out.push(content.title + '. ');
  if (content.subtitle) out.push(content.subtitle);
  if (content.abstract) out.push(content.abstract);
  for (const b of (content.blocks || [])) {
    if (b.type === 'section_heading') out.push(b.title + '.');
    else if (b.type === 'paragraph' || b.type === 'dropcap_paragraph') {
      out.push((b.text || '').replace(/<[^>]+>/g, ''));
    }
    else if (b.type === 'pullquote') out.push('Quote. ' + b.text);
    else if (b.type === 'keystat')   out.push((b.label || '') + ' ' + b.value + '. ' + (b.body || ''));
    else if (b.type === 'sidenote')  out.push(b.value);
  }
  return out.join('\n\n');
}

function collectSlideJobs(content) {
  const jobs = [];
  if (content.tldr_presentation) {
    for (const s of (content.tldr_presentation.slides || [])) {
      if (s.audio_file && s.text) jobs.push({ src: s.audio_file, text: s.text, label: 'tldr/' + s.id });
    }
  }
  for (const pres of (content.embedded_presentations || [])) {
    for (const s of (pres.slides || [])) {
      if (s.audio_file && s.text) jobs.push({ src: s.audio_file, text: s.text, label: pres.id + '/' + s.id });
    }
  }
  return jobs;
}

/* ElevenLabs caps single-call narration at 10,000 chars. For longer content
   we chunk on paragraph boundaries (\n\n), pack greedily up to MAX_CHUNK_CHARS,
   synthesize each chunk, then concatenate the MP3 buffers. MP3 frames are
   independent so byte-concat produces a valid stream. Sentence-split fallback
   handles any single paragraph that is itself over the cap. */
const MAX_CHUNK_CHARS = 9000;

function chunkText(text) {
  if (text.length <= MAX_CHUNK_CHARS) return [text];
  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let buf = '';
  for (const para of paragraphs) {
    if (para.length > MAX_CHUNK_CHARS) {
      if (buf) { chunks.push(buf); buf = ''; }
      const sentences = para.split(/(?<=[.!?])\s+/);
      let sbuf = '';
      for (const s of sentences) {
        if ((sbuf + ' ' + s).length > MAX_CHUNK_CHARS && sbuf) {
          chunks.push(sbuf); sbuf = s;
        } else {
          sbuf = sbuf ? sbuf + ' ' + s : s;
        }
      }
      if (sbuf) chunks.push(sbuf);
      continue;
    }
    if ((buf + '\n\n' + para).length > MAX_CHUNK_CHARS && buf) {
      chunks.push(buf); buf = para;
    } else {
      buf = buf ? buf + '\n\n' + para : para;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

async function generateMP3(text, outRelPath) {
  const outPath = resolve(SITE_ROOT, outRelPath);
  if (existsSync(outPath) && !force) return { status: 'cached' };
  const chunks = chunkText(text);
  const buffers = [];
  for (let i = 0; i < chunks.length; i++) {
    const part = await synthesize(chunks[i]);
    buffers.push(part);
    if (chunks.length > 1) {
      console.log('       chunk ' + (i + 1) + '/' + chunks.length + ' (' + chunks[i].length + ' chars, ' + part.length + ' bytes)');
    }
  }
  const buf = Buffer.concat(buffers);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, buf);
  return { status: 'generated', bytes: buf.length, chunks: chunks.length };
}

async function processPaper(id, locale) {
  const contentPath = resolve(SITE_ROOT, 'data/papers/' + id + '.' + locale + '.json');
  if (!existsSync(contentPath)) {
    console.log('[skip] ' + id + '.' + locale + ' — no content JSON yet');
    return { id, locale, status: 'no-content' };
  }
  const content = JSON.parse(readFileSync(contentPath, 'utf8'));
  const tag = id + '.' + locale;

  // 1. Per-slide narration (TL;DR + embedded)
  const slideJobs = collectSlideJobs(content);
  let gen = 0, cached = 0;
  for (const job of slideJobs) {
    try {
      const r = await generateMP3(job.text, job.src);
      if (r.status === 'generated') { gen++; console.log('[ok]  ' + tag + ' ' + job.label + ' → ' + job.src); }
      else { cached++; console.log('[cached] ' + tag + ' ' + job.label); }
    } catch (e) {
      console.error('[err] ' + tag + ' ' + job.label + ': ' + e.message);
    }
  }

  // 2. Long-form (full paper narration), unless suppressed
  if (!tldrOnly && !noLongform && content.audio && content.audio.src) {
    const text = extractLongform(content);
    if (text.trim()) {
      try {
        const r = await generateMP3(text, content.audio.src);
        if (r.status === 'generated') { gen++; console.log('[ok]  ' + tag + ' longform → ' + content.audio.src); }
        else { cached++; console.log('[cached] ' + tag + ' longform'); }
      } catch (e) { console.error('[err] ' + tag + ' longform: ' + e.message); }
    }
  }

  return { id, locale, status: 'done', generated: gen, cached };
}

async function main() {
  const papers = JSON.parse(readFileSync(resolve(SITE_ROOT, 'data/papers.json'), 'utf8')).papers;
  const ids = onlyIds.length ? onlyIds : papers.map(p => p.id);
  for (const id of ids) {
    for (const loc of locales) {
      await processPaper(id, loc);
    }
  }
}

main();
