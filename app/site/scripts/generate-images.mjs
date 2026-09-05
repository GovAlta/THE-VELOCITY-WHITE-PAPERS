#!/usr/bin/env node
/* generate-images.mjs — bilingual image generation with metadata sidecars.

   For each paper:
     1. Read data/papers/<id>.en.json → collect image jobs
        (hero_image, figure block image prompts, slide image prompts).
     2. For each EN job: load shared style_prompt from data/image-style.json
        (or use the per-image style_prompt override), call OpenAI generations
        with EN style + image_prompt. Save as PNG buffer.
     3. For each FR sibling job: read the matching FR JSON entry, build the FR
        prompt (FR style + FR image_prompt), call OpenAI edits with the EN
        PNG as reference for composition consistency.
     4. Convert PNG → JPG (Sharp, configurable quality).
     5. Write a sidecar JSON next to each image with the full prompt history,
        timestamps, model used, and reference image (if any). Sidecars are
        viewable and editable.

   Output layout:
     public/images/<paper-id>/en/<slot>.jpg
     public/images/<paper-id>/en/<slot>.meta.json
     public/images/<paper-id>/fr/<slot>.jpg
     public/images/<paper-id>/fr/<slot>.meta.json

   Usage:
     node scripts/generate-images.mjs                       # all papers, EN + FR
     node scripts/generate-images.mjs wp-01                 # one paper
     node scripts/generate-images.mjs --locale en           # EN only
     node scripts/generate-images.mjs --force               # regenerate
     node scripts/generate-images.mjs --quality 78          # JPG quality
     node scripts/generate-images.mjs --max-width 1600      # downscale
     node scripts/generate-images.mjs --no-condition        # generate FR from text only
*/

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { generatePNG, generatePNGFromReference } from './lib/images.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const SITE_ROOT  = resolve(__dirname, '..');

const args = process.argv.slice(2);
const force        = args.includes('--force');
const noCondition  = args.includes('--no-condition');
const localeIdx    = args.indexOf('--locale');
const localesArg   = localeIdx !== -1 ? [args[localeIdx + 1]] : null;
const qualityIdx   = args.indexOf('--quality');
const quality      = qualityIdx !== -1 ? parseInt(args[qualityIdx + 1], 10) : 80;
const maxWidthIdx  = args.indexOf('--max-width');
const maxWidth     = maxWidthIdx !== -1 ? parseInt(args[maxWidthIdx + 1], 10) : 1600;
const passArgs     = new Set(['--force', '--no-condition', '--locale', localesArg?.[0], '--quality', String(quality), '--max-width', String(maxWidth)]);
const onlyIds      = args.filter(a => !a.startsWith('--') && !passArgs.has(a));

let sharp;
try { sharp = (await import('sharp')).default; }
catch {
  console.error('Sharp is not installed. Run: npm install sharp');
  process.exit(1);
}

const styleConfig = JSON.parse(readFileSync(resolve(SITE_ROOT, 'data/image-style.json'), 'utf8'));

function buildPrompt(styleKind, locale, imagePrompt, perImageStyle) {
  /* Per-image style_prompt overrides the shared style for that one image. */
  const stylePool = styleConfig[styleKind] || styleConfig.default;
  const style = perImageStyle || (stylePool && stylePool[locale]) || stylePool?.en || '';
  const trailer = styleConfig.trailer || '';
  return [style, 'Subject: ' + imagePrompt, trailer].filter(Boolean).join('\n\n');
}

function collectImageJobs(content) {
  /* Each job is identified by `slot` (e.g. 'hero', 'fig-01', 'slide-02').
     Returns { slot, image_prompt, style_prompt (per-image override), out_relpath, style_kind }. */
  const jobs = [];
  /* Hero images are intentionally NOT generated. They are never rendered on
     the site; the only consumer was the article JSON-LD `image`, which now
     reuses the per-paper social card (public/og/<id>.jpg). The hero_image
     block is kept in the paper JSON for metadata/back-compat but is skipped
     here so forced runs don't burn an API call on an unused image. */
  let figIdx = 0;
  for (const b of (content.blocks || [])) {
    if (b.type === 'figure' && b.image && (b.image.image_prompt || b.image.prompt)) {
      figIdx += 1;
      jobs.push({
        slot: 'fig-' + String(figIdx).padStart(2, '0'),
        image_prompt: b.image.image_prompt || b.image.prompt,
        style_prompt: b.image.style_prompt || null,
        out_relpath: b.image.src,
        style_kind: b.image.style_kind || 'diagram',
      });
    }
  }
  const allSlides = [
    ...((content.tldr_presentation && content.tldr_presentation.slides) || []),
    ...((content.embedded_presentations || []).flatMap(p => p.slides || [])),
  ];
  let slideImgIdx = 0;
  for (const s of allSlides) {
    if (s.visual === 'image' && s.image && (s.image.image_prompt || s.image.prompt)) {
      slideImgIdx += 1;
      jobs.push({
        slot: 'slide-' + String(slideImgIdx).padStart(2, '0'),
        image_prompt: s.image.image_prompt || s.image.prompt,
        style_prompt: s.image.style_prompt || null,
        out_relpath: s.image.src,
        style_kind: s.image.style_kind || 'diagram',
      });
    }
  }
  return jobs;
}

async function pngToJpg(buf) {
  return sharp(buf)
    .resize({ width: maxWidth, withoutEnlargement: true, fit: 'inside' })
    .jpeg({ quality, progressive: true, mozjpeg: true })
    .toBuffer();
}

function metaPathFor(jpgPath) {
  return jpgPath.replace(/\.jpg$/i, '.meta.json');
}

function pngCachePathFor(jpgPath) {
  /* We keep the source PNG alongside the JPG to allow FR conditioning later. */
  return jpgPath.replace(/\.jpg$/i, '.source.png');
}

async function generateAndStore({ paperId, locale, slot, prompt, refPngPath, model, jpgPath, sidecarFields }) {
  const pngBuf = refPngPath
    ? await generatePNGFromReference(prompt, refPngPath, { model })
    : await generatePNG(prompt, { model });
  const jpgBuf = await pngToJpg(pngBuf);
  mkdirSync(dirname(jpgPath), { recursive: true });
  writeFileSync(jpgPath, jpgBuf);
  writeFileSync(pngCachePathFor(jpgPath), pngBuf);
  const meta = {
    paper_id: paperId,
    locale,
    slot,
    out_path: jpgPath.replace(SITE_ROOT + '\\', '').replace(SITE_ROOT + '/', ''),
    bytes_jpg: jpgBuf.length,
    bytes_png_source: pngBuf.length,
    model: model || 'gpt-image-1',
    generated_at: new Date().toISOString(),
    jpg_quality: quality,
    jpg_max_width: maxWidth,
    ...sidecarFields,
  };
  writeFileSync(metaPathFor(jpgPath), JSON.stringify(meta, null, 2));
  return { jpgBytes: jpgBuf.length, pngBytes: pngBuf.length };
}

async function processPaper(id) {
  const enPath = resolve(SITE_ROOT, 'data/papers/' + id + '.en.json');
  const frPath = resolve(SITE_ROOT, 'data/papers/' + id + '.fr.json');
  if (!existsSync(enPath)) {
    console.log('[skip] ' + id + ' — no EN content JSON yet');
    return;
  }
  const en = JSON.parse(readFileSync(enPath, 'utf8'));
  const enJobs = collectImageJobs(en);

  /* The primary locale (EN) is generated from text; every other requested
     locale reuses EN's composition (conditioned on the EN PNG) and only swaps
     the translated text labels. Per-locale jobs come from that locale's own
     paper JSON so the image_prompt is the translated one. */
  const locales = localesArg || ['en', 'fr'];
  const PRIMARY = 'en';
  const otherLocales = locales.filter((l) => l !== PRIMARY);
  const jobsByLoc = {};
  for (const loc of otherLocales) {
    const p = resolve(SITE_ROOT, 'data/papers/' + id + '.' + loc + '.json');
    jobsByLoc[loc] = existsSync(p)
      ? Object.fromEntries(collectImageJobs(JSON.parse(readFileSync(p, 'utf8'))).map((j) => [j.slot, j]))
      : null;
  }

  for (const job of enJobs) {
    const enJpg = resolve(SITE_ROOT, job.out_relpath);
    const enPng = pngCachePathFor(enJpg);

    /* Primary locale (EN) first — from text, no conditioning. */
    if (locales.includes(PRIMARY)) {
      if (existsSync(enJpg) && !force) {
        console.log('[cached] ' + id + '/en/' + job.slot);
      } else {
        const prompt = buildPrompt(job.style_kind, 'en', job.image_prompt, job.style_prompt);
        console.log('[gen-en] ' + id + '/' + job.slot + ' — "' + job.image_prompt.slice(0, 50) + '…"');
        try {
          const r = await generateAndStore({
            paperId: id, locale: 'en', slot: job.slot, prompt, refPngPath: null, jpgPath: enJpg,
            sidecarFields: {
              style_prompt: job.style_prompt || styleConfig[job.style_kind]?.en || styleConfig.default.en,
              image_prompt: job.image_prompt, style_kind: job.style_kind, composed_prompt: prompt, conditioned_on: null,
            },
          });
          console.log('[ok-en]  ' + id + '/' + job.slot + ' jpg=' + (r.jpgBytes / 1024).toFixed(1) + 'KB');
        } catch (e) { console.error('[err-en] ' + id + '/' + job.slot + ': ' + e.message); continue; }
      }
    }

    /* Every other locale — conditioned on the EN PNG when available. */
    for (const loc of otherLocales) {
      const bySlot = jobsByLoc[loc];
      if (!bySlot) { console.log('[skip-' + loc + '] ' + id + ' — no ' + loc + ' JSON'); continue; }
      const lJob = bySlot[job.slot];
      if (!lJob) { console.log('[skip-' + loc + '] ' + id + '/' + job.slot + ' — no ' + loc + ' entry'); continue; }
      const lJpg = resolve(SITE_ROOT, lJob.out_relpath);
      if (existsSync(lJpg) && !force) { console.log('[cached] ' + id + '/' + loc + '/' + lJob.slot); continue; }
      const lPrompt = buildPrompt(lJob.style_kind, loc, lJob.image_prompt, lJob.style_prompt);
      const canCondition = !noCondition && existsSync(enPng);
      console.log('[gen-' + loc + '] ' + id + '/' + lJob.slot + (canCondition ? ' (conditioned on EN)' : ' (from text)'));
      try {
        const r = await generateAndStore({
          paperId: id, locale: loc, slot: lJob.slot, prompt: lPrompt,
          refPngPath: canCondition ? enPng : null, jpgPath: lJpg,
          sidecarFields: {
            style_prompt: lJob.style_prompt || styleConfig[lJob.style_kind]?.[loc] || styleConfig.default[loc] || styleConfig.default.en,
            image_prompt: lJob.image_prompt, style_kind: lJob.style_kind, composed_prompt: lPrompt,
            conditioned_on: canCondition ? enPng.replace(SITE_ROOT + '\\', '').replace(SITE_ROOT + '/', '') : null,
          },
        });
        console.log('[ok-' + loc + ']  ' + id + '/' + lJob.slot + ' jpg=' + (r.jpgBytes / 1024).toFixed(1) + 'KB');
      } catch (e) { console.error('[err-' + loc + '] ' + id + '/' + lJob.slot + ': ' + e.message); }
    }
  }
}

async function main() {
  const papers = JSON.parse(readFileSync(resolve(SITE_ROOT, 'data/papers.json'), 'utf8')).papers;
  const ids = onlyIds.length ? onlyIds : papers.map(p => p.id);
  for (const id of ids) {
    await processPaper(id);
  }
}

main();
