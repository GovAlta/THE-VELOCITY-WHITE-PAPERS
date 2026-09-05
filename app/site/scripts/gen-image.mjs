#!/usr/bin/env node
/* gen-image.mjs — one-off image generation.

   Use this when you want to produce a single image without first adding it to
   a paper JSON. Useful for iterating on a prompt, sketching a hero candidate,
   or creating ad-hoc figures.

   Usage:
     node scripts/gen-image.mjs --prompt "<image_prompt>" --out <path.jpg>
                                [--style cover|diagram|default]    (default: diagram)
                                [--locale en|fr]                    (default: en)
                                [--style-prompt "<override>"]       (per-image style override)
                                [--ref <path-to-reference.png>]     (image-to-image conditioning)
                                [--quality 80] [--max-width 1600]
                                [--force]

   Examples:
     # Quick experimentation — write to a scratch folder
     node scripts/gen-image.mjs \
       --prompt "A wooden ship at sea, planks being replaced mid-voyage" \
       --out scratch/ship-test.jpg \
       --style cover

     # Generate a French twin conditioned on the English version
     node scripts/gen-image.mjs \
       --prompt "Le harnais anti-dérive, étiquettes en français" \
       --out public/images/arch-adhd-harness/fr/hero.jpg \
       --ref  public/images/arch-adhd-harness/en/hero.source.png \
       --locale fr

   Every generated image gets a .meta.json sidecar next to it capturing
   the style prompt, image prompt, composed prompt, model, and reference.
*/

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { generatePNG, generatePNGFromReference } from './lib/images.mjs';

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

const prompt = arg('prompt');
const out    = arg('out');
const style  = arg('style', 'diagram');
const locale = arg('locale', 'en');
const styleOverride = arg('style-prompt', null);
const refPath = arg('ref', null);
const quality  = parseInt(arg('quality',   '80'),  10);
const maxWidth = parseInt(arg('max-width', '1600'), 10);
const force = flag('force');

if (!prompt || prompt === true) {
  console.error('Missing --prompt "<image_prompt>"');
  process.exit(2);
}
if (!out || out === true) {
  console.error('Missing --out <path.jpg>');
  process.exit(2);
}

const sharp = (await import('sharp')).default;
const styleConfig = JSON.parse(readFileSync(resolve(SITE_ROOT, 'data/image-style.json'), 'utf8'));

function buildPrompt(styleKind, loc, imagePrompt, perImageStyle) {
  const stylePool = styleConfig[styleKind] || styleConfig.default;
  const styleStr = perImageStyle || (stylePool && stylePool[loc]) || stylePool?.en || '';
  const trailer  = styleConfig.trailer || '';
  return [styleStr, 'Subject: ' + imagePrompt, trailer].filter(Boolean).join('\n\n');
}

const outPath = resolve(SITE_ROOT, out);
if (existsSync(outPath) && !force) {
  console.error('Output already exists: ' + outPath);
  console.error('Pass --force to overwrite.');
  process.exit(1);
}

const composed = buildPrompt(style, locale, prompt, styleOverride);
console.log('Composed prompt:');
console.log('---');
console.log(composed);
console.log('---');
console.log('');
console.log('Calling OpenAI…');

const refAbs = refPath ? resolve(SITE_ROOT, refPath) : null;
if (refAbs && !existsSync(refAbs)) {
  console.error('Reference image not found: ' + refAbs);
  process.exit(1);
}

const pngBuf = refAbs
  ? await generatePNGFromReference(composed, refAbs)
  : await generatePNG(composed);

const jpgBuf = await sharp(pngBuf)
  .resize({ width: maxWidth, withoutEnlargement: true, fit: 'inside' })
  .jpeg({ quality, progressive: true, mozjpeg: true })
  .toBuffer();

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, jpgBuf);

/* Keep the source PNG alongside the JPG so future runs can use it as a
   reference image (for the FR twin, for example). */
const pngPath = outPath.replace(/\.jpg$/i, '.source.png');
writeFileSync(pngPath, pngBuf);

const metaPath = outPath.replace(/\.jpg$/i, '.meta.json');
const meta = {
  paper_id: null,
  locale,
  slot: 'ad-hoc',
  style_kind: style,
  style_prompt: styleOverride || styleConfig[style]?.[locale] || styleConfig.default[locale],
  image_prompt: prompt,
  composed_prompt: composed,
  conditioned_on: refAbs ? refAbs.replace(SITE_ROOT + '\\', '').replace(SITE_ROOT + '/', '') : null,
  model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
  generated_at: new Date().toISOString(),
  jpg_quality: quality,
  jpg_max_width: maxWidth,
  bytes_jpg: jpgBuf.length,
  bytes_png_source: pngBuf.length,
  generated_by: 'gen-image.mjs',
};
writeFileSync(metaPath, JSON.stringify(meta, null, 2));

console.log('');
console.log('Wrote ' + out + ' (' + (jpgBuf.length / 1024).toFixed(1) + ' KB)');
console.log('Sidecar: ' + metaPath.replace(SITE_ROOT, '').replace(/^\\|^\//, ''));
console.log('Source:  ' + pngPath.replace(SITE_ROOT,  '').replace(/^\\|^\//, ''));
