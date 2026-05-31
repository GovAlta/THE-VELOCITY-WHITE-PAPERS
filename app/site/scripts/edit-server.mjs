#!/usr/bin/env node
/* edit-server.mjs — DEV-ONLY local server for the in-page editor.

   It serves the site (like `npm run dev`) AND exposes a small API the editor
   calls to actually generate images, which a static page cannot do because the
   call needs the OpenAI key from .env. Run it instead of `npm run dev` when you
   want image generation from the editor:

     npm run edit          # serves http://127.0.0.1:5173 with /api/generate-image

   It binds to 127.0.0.1 only and is never deployed. The public GitHub Pages
   site has no server and no generation; it stays read-only static.

   API:
     POST /api/generate-image  { src, prompt, style_kind, locale }
       Generates (or regenerates, overwriting) the JPG + source PNG + meta
       sidecar at <src> under public/images/, the same outputs as
       scripts/gen-image.mjs. For locale 'fr', conditions on the EN source PNG
       when one exists, matching the project's EN to FR convention.
*/

import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, extname } from 'node:path';
import { readFile as readFileP } from 'node:fs/promises';
import { generatePNG, generatePNGFromReference } from './lib/images.mjs';
import { reviseItems, translateItems, draftPaper } from './lib/llm.mjs';
import { buildIndex } from './lib/index-build.mjs';
import { collectTranslatable, retargetPaths, computeSignature } from './lib/translatable.mjs';
import { validatePaper } from './lib/paper-schema.mjs';

/* The style guides the editor can view, curate, and save. The .md files live
   one level above the site (style-guide/); image-style is inside the site. The
   whitelist is the only set of paths the save endpoint will write. */
const GUIDES = [
  { id: 'voice-exemplar',  title: 'Voice exemplar',            path: '../../style-guide/voice-exemplar.md',                 kind: 'md' },
  { id: 'writing-00',      title: '00 — Writing style',        path: '../../style-guide/00-writing-style-guide.md',         kind: 'md' },
  { id: 'author-voice-01', title: '01 — Author voice',         path: '../../style-guide/01-author-voice.md',                kind: 'md' },
  { id: 'substance-02',    title: '02 — Substance & structure', path: '../../style-guide/02-substance-and-structure-guide.md', kind: 'md' },
  { id: 'source-hierarchy', title: 'Source hierarchy',          path: '../../style-guide/source-hierarchy.md',               kind: 'md' },
  { id: 'image-style',     title: 'Image style (image-style.json)', path: 'data/image-style.json',                          kind: 'json' },
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '..');
const PORT = parseInt(process.env.PORT || '5173', 10);

/* Editing is OFF unless explicitly enabled in THIS environment, either with the
   --enable flag (which `npm run edit` passes) or VW_EDIT=1. The published static
   site has no server, so this endpoint never exists there and the editor can
   never activate. This is the gate that keeps content from being defaced. */
const EDIT_ENABLED = process.argv.includes('--enable') || /^(1|true|yes|on)$/i.test(process.env.VW_EDIT || '');
const sharp = (await import('sharp')).default;
const styleConfig = JSON.parse(readFileSync(resolve(SITE, 'data/image-style.json'), 'utf8'));

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
  '.txt': 'text/plain', '.xml': 'application/xml', '.map': 'application/json',
};

function buildPrompt(styleKind, loc, imagePrompt, perImageStyle) {
  const pool = styleConfig[styleKind] || styleConfig.default;
  const styleStr = perImageStyle || (pool && pool[loc]) || (pool && pool.en) || '';
  const trailer = styleConfig.trailer || '';
  return [styleStr, 'Subject: ' + imagePrompt, trailer].filter(Boolean).join('\n\n');
}

function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(body);
}

async function handleGenerate(body, res) {
  try {
    if (!EDIT_ENABLED) return sendJSON(res, 403, { error: 'Editing is disabled in this environment. Start the server with --enable (npm run edit) or VW_EDIT=1.' });
    const prompt = (body.prompt || '').trim();
    const src = body.src || '';
    const loc = body.locale || 'en';
    const style = body.style_kind || 'diagram';

    if (!prompt) return sendJSON(res, 400, { error: 'Write an image prompt first.' });
    if (!/^public\/images\//.test(src) || src.includes('..')) {
      return sendJSON(res, 400, { error: 'Invalid src; must be under public/images/.' });
    }

    const composed = buildPrompt(style, loc, prompt);
    const outPath = resolve(SITE, src);

    // Condition on the source-locale PNG when present, to keep the bilingual
    // pair consistent. conditionFrom is the canonical locale; absent, the legacy
    // fr->en default is preserved so existing behavior is unchanged.
    let refAbs = null;
    const refLoc = body.conditionFrom || (loc === 'fr' ? 'en' : null);
    if (refLoc && refLoc !== loc) {
      const refSrc = src.replace('/' + loc + '/', '/' + refLoc + '/').replace(/\.jpg$/i, '.source.png');
      const cand = resolve(SITE, refSrc);
      if (existsSync(cand)) refAbs = cand;
    }

    const pngBuf = refAbs ? await generatePNGFromReference(composed, refAbs) : await generatePNG(composed);
    const jpgBuf = await sharp(pngBuf)
      .resize({ width: 1600, withoutEnlargement: true, fit: 'inside' })
      .jpeg({ quality: 80, progressive: true, mozjpeg: true })
      .toBuffer();

    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, jpgBuf);
    await writeFile(outPath.replace(/\.jpg$/i, '.source.png'), pngBuf);

    const parts = src.split('/');
    const meta = {
      paper_id: parts[2] || null,
      locale: loc,
      slot: (parts[parts.length - 1] || '').replace(/\.jpg$/i, ''),
      style_kind: style,
      style_prompt: (styleConfig[style] && styleConfig[style][loc]) || (styleConfig.default && styleConfig.default[loc]) || '',
      image_prompt: prompt,
      composed_prompt: composed,
      conditioned_on: refAbs ? refAbs.replace(SITE, '').replace(/^[\\/]/, '') : null,
      model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
      generated_at: new Date().toISOString(),
      jpg_quality: 80,
      jpg_max_width: 1600,
      bytes_jpg: jpgBuf.length,
      bytes_png_source: pngBuf.length,
      generated_by: 'edit-server.mjs',
    };
    await writeFile(outPath.replace(/\.jpg$/i, '.meta.json'), JSON.stringify(meta, null, 2));

    console.log('Generated ' + src + ' (' + (jpgBuf.length / 1024).toFixed(1) + ' KB)' + (refAbs ? ' [conditioned on EN]' : ''));
    return sendJSON(res, 200, { src, bytes: jpgBuf.length });
  } catch (e) {
    console.error('generate-image failed:', e && e.message);
    return sendJSON(res, 500, { error: (e && e.message) || String(e) });
  }
}

async function handleSaveJson(body, res) {
  if (!EDIT_ENABLED) return sendJSON(res, 403, { error: 'Editing is disabled in this environment.' });
  try {
    const rel = String(body.path || '');
    if (!/^data\//.test(rel) || rel.includes('..')) return sendJSON(res, 400, { error: 'path must be under data/' });
    const outPath = resolve(SITE, rel);
    if (!outPath.startsWith(SITE)) return sendJSON(res, 403, { error: 'Forbidden path' });
    let text;
    if (typeof body.content === 'string') { JSON.parse(body.content); text = body.content; }
    else { text = JSON.stringify(body.content, null, 2) + '\n'; }
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, text);
    console.log('Saved ' + rel + ' (' + (text.length / 1024).toFixed(1) + ' KB)');
    return sendJSON(res, 200, { path: rel });
  } catch (e) { return sendJSON(res, 500, { error: (e && e.message) || String(e) }); }
}

async function handleStyleGuides(res) {
  const out = [];
  for (const g of GUIDES) {
    try { out.push({ id: g.id, title: g.title, kind: g.kind, content: await readFileP(resolve(SITE, g.path), 'utf8') }); }
    catch (_) { /* missing guide file: skip */ }
  }
  return sendJSON(res, 200, out);
}

async function handleSaveGuide(body, res) {
  if (!EDIT_ENABLED) return sendJSON(res, 403, { error: 'Editing is disabled in this environment.' });
  try {
    const g = GUIDES.find((x) => x.id === body.id);
    if (!g) return sendJSON(res, 400, { error: 'Unknown guide id' });
    const content = String(body.content == null ? '' : body.content);
    if (g.kind === 'json') JSON.parse(content);   // refuse to write invalid JSON
    await writeFile(resolve(SITE, g.path), content);
    console.log('Saved guide ' + g.id);
    return sendJSON(res, 200, { id: g.id });
  } catch (e) { return sendJSON(res, 500, { error: (e && e.message) || String(e) }); }
}

async function handleRevise(body, res) {
  if (!EDIT_ENABLED) return sendJSON(res, 403, { error: 'Editing is disabled in this environment.' });
  try {
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return sendJSON(res, 400, { error: 'No items to revise' });
    const ids = Array.isArray(body.guideIds) ? body.guideIds : [];
    const guideTexts = [];
    for (const id of ids) {
      const g = GUIDES.find((x) => x.id === id);
      if (g) { try { guideTexts.push({ title: g.title, content: await readFileP(resolve(SITE, g.path), 'utf8') }); } catch (_) {} }
    }
    const tier = body.model === 'opus' ? 'opus' : 'sonnet';
    const revised = await reviseItems({ items, instructions: body.instructions || '', guideTexts, tier });
    return sendJSON(res, 200, { items: revised });
  } catch (e) { return sendJSON(res, 500, { error: (e && e.message) || String(e) }); }
}

async function handleGenerateAudio(body, res) {
  if (!EDIT_ENABLED) return sendJSON(res, 403, { error: 'Editing is disabled in this environment.' });
  try {
    const text = (body.text || '').trim();
    const out = body.out || '';
    if (!text) return sendJSON(res, 400, { error: 'No narration text to synthesize.' });
    if (!/^public\/audio\//.test(out) || out.includes('..')) return sendJSON(res, 400, { error: 'Invalid out path; must be under public/audio/.' });
    const { synthesizeLong } = await import('./lib/tts.mjs');
    const buf = await synthesizeLong(text);
    const outPath = resolve(SITE, out);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, buf);
    console.log('Generated audio ' + out + ' (' + (buf.length / 1024).toFixed(1) + ' KB)');
    return sendJSON(res, 200, { out, bytes: buf.length });
  } catch (e) { return sendJSON(res, 500, { error: (e && e.message) || String(e) }); }
}

async function handleDeletePaper(body, res) {
  if (!EDIT_ENABLED) return sendJSON(res, 403, { error: 'Editing is disabled in this environment.' });
  try {
    const id = String(body.id || '');
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) return sendJSON(res, 400, { error: 'Invalid id' });
    const { unlink } = await import('node:fs/promises');
    const removed = [];
    for (const loc of ['en', 'fr']) {
      const p = resolve(SITE, 'data/papers/' + id + '.' + loc + '.json');
      try { await unlink(p); removed.push(loc); } catch (_) { /* already gone */ }
    }
    console.log('Deleted paper ' + id + ' (' + removed.join(', ') + ')');
    return sendJSON(res, 200, { id, removed });
  } catch (e) { return sendJSON(res, 500, { error: (e && e.message) || String(e) }); }
}

/* Draft a paper's parts from a rough Markdown draft (or a skeleton from scratch).
   Returns the generated parts for the editor to preview and apply as proposals. */
async function handleGeneratePaper(body, res) {
  if (!EDIT_ENABLED) return sendJSON(res, 403, { error: 'Editing is disabled in this environment.' });
  try {
    const title = body.title || 'Untitled paper';
    const tier = body.tier || 'Technical';
    const mode = body.mode === 'draft' ? 'draft' : 'scratch';
    const guideTexts = [];
    for (const gid of (body.guideIds || [])) {
      const g = GUIDES.find((x) => x.id === gid);
      if (g) { try { guideTexts.push({ title: g.title, content: await readFileP(resolve(SITE, g.path), 'utf8') }); } catch (_) {} }
    }
    const paper = await draftPaper({ mode, title, tier, draftMarkdown: body.draft_markdown, guideTexts, modelTier: body.model === 'opus' ? 'opus' : 'sonnet' });
    const warnings = validatePaper({ blocks: paper.blocks, sections: paper.sections, tldr_presentation: paper.tldr_presentation });
    console.log('Drafted paper parts: ' + (paper.sections || []).length + ' sections, ' + (paper.blocks || []).length + ' blocks');
    return sendJSON(res, 200, { paper, warnings });
  } catch (e) { return sendJSON(res, 500, { error: (e && e.message) || String(e) }); }
}

/* Hard translate-and-build: clone the source structure into the target, translate
   every string, retarget asset paths, stamp status + signature. Returns the asset
   slots for the client to regenerate (images conditioned on the source PNG). */
async function handleTranslatePaper(body, res) {
  if (!EDIT_ENABLED) return sendJSON(res, 403, { error: 'Editing is disabled in this environment.' });
  try {
    const id = String(body.id || '');
    const src = String(body.sourceLocale || '');
    const tgt = String(body.targetLocale || '');
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id) || !['en', 'fr'].includes(src) || !['en', 'fr'].includes(tgt) || src === tgt) {
      return sendJSON(res, 400, { error: 'Need id and distinct sourceLocale/targetLocale (en|fr).' });
    }
    const srcPath = resolve(SITE, 'data/papers/' + id + '.' + src + '.json');
    if (!existsSync(srcPath)) return sendJSON(res, 404, { error: 'Source file not found: ' + id + '.' + src });

    const source = JSON.parse(readFileSync(srcPath, 'utf8'));
    const target = JSON.parse(JSON.stringify(source));   // structural clone (hard overwrite, no merge)

    const items = collectTranslatable(target);
    const map = {};
    for (let i = 0; i < items.length; i += 40) {
      const batch = items.slice(i, i + 40).map((it) => ({ key: it.key, text: it.text }));
      const out = await translateItems({ items: batch, sourceLocale: src, targetLocale: tgt, tier: body.model === 'opus' ? 'opus' : 'sonnet' });
      for (const r of (out || [])) map[r.key] = r.revised;
    }
    let n = 0;
    for (const it of items) if (map[it.key] != null) { it.apply(map[it.key]); n++; }

    const modelId = (body.model === 'opus' ? process.env.VERTEX_CLAUDE_OPUS_MODEL : process.env.VERTEX_CLAUDE_SONNET_MODEL) || 'claude-sonnet-4-6';
    retargetPaths(target, src, tgt);
    target.translation_status = 'draft';
    target._meta = target._meta || {};
    target._meta.translated_from = { source_locale: src, model: modelId, translated_at: new Date().toISOString() };
    target.source_signature = computeSignature(source);

    await writeFile(resolve(SITE, 'data/papers/' + id + '.' + tgt + '.json'), JSON.stringify(target, null, 2) + '\n');

    const images = [];
    if (target.hero_image && target.hero_image.src) images.push({ src: target.hero_image.src, image_prompt: target.hero_image.image_prompt, style_kind: target.hero_image.style_kind });
    (target.blocks || []).forEach((b) => { if (b.image && b.image.src) images.push({ src: b.image.src, image_prompt: b.image.image_prompt, style_kind: b.image.style_kind }); });
    ((target.tldr_presentation && target.tldr_presentation.slides) || []).forEach((s) => { if (s.image && s.image.src) images.push({ src: s.image.src, image_prompt: s.image.image_prompt, style_kind: s.image.style_kind }); });
    const audio = [];
    ((target.tldr_presentation && target.tldr_presentation.slides) || []).forEach((s) => { if (s.audio_file && s.text) audio.push({ out: s.audio_file, text: s.text }); });

    console.log('Translated ' + id + ' ' + src + '->' + tgt + ' (' + n + ' strings, ' + images.length + ' images, ' + audio.length + ' audio)');
    return sendJSON(res, 200, { translated: n, images, audio, targetLocale: tgt });
  } catch (e) { return sendJSON(res, 500, { error: (e && e.message) || String(e) }); }
}

/* Is the target locale in sync with the canonical it was translated from? */
function handleDrift(reqUrl, res) {
  try {
    const id = new URL('http://x' + reqUrl).searchParams.get('id') || '';
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) return sendJSON(res, 400, { error: 'bad id' });
    const read = (loc) => { const p = resolve(SITE, 'data/papers/' + id + '.' + loc + '.json'); return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null; };
    const en = read('en'); const fr = read('fr');
    if (!en && !fr) return sendJSON(res, 404, { error: 'not found' });
    const primary = (en && en.primary_locale) || (fr && fr.primary_locale) || 'en';
    const source = primary === 'fr' ? fr : en;
    const target = primary === 'fr' ? en : fr;
    if (!source) return sendJSON(res, 200, { primary, target: primary === 'fr' ? 'en' : 'fr', hasTranslation: false, inSync: false });
    const tgtSig = target && target.source_signature;
    return sendJSON(res, 200, {
      primary,
      target: primary === 'fr' ? 'en' : 'fr',
      hasTranslation: !!(target && tgtSig),
      inSync: !!(tgtSig && tgtSig === computeSignature(source)),
      translatedAt: (target && target._meta && target._meta.translated_from && target._meta.translated_from.translated_at) || null,
    });
  } catch (e) { return sendJSON(res, 500, { error: (e && e.message) || String(e) }); }
}

function handleBuildIndex(res) {
  if (!EDIT_ENABLED) return sendJSON(res, 403, { error: 'Editing is disabled in this environment.' });
  try {
    const inv = buildIndex();
    console.log('Rebuilt index: ' + inv.papers.length + ' entries');
    return sendJSON(res, 200, { ok: true, papers: inv.papers });
  } catch (e) { return sendJSON(res, 500, { error: (e && e.message) || String(e) }); }
}

function readBody(req, cb) {
  let data = '';
  req.on('data', (c) => { data += c; if (data.length > 4e6) req.destroy(); });
  req.on('end', () => { let body = {}; try { body = JSON.parse(data || '{}'); } catch (_) {} cb(body); });
}

const server = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/edit-status') {
    return sendJSON(res, 200, { enabled: EDIT_ENABLED });
  }
  if (req.method === 'GET' && req.url === '/api/style-guides') {
    handleStyleGuides(res); return;
  }
  if (req.method === 'GET' && req.url.indexOf('/api/structure-drift') === 0) {
    handleDrift(req.url, res); return;
  }
  if (req.method === 'POST' && req.url === '/api/generate-image') { readBody(req, (b) => handleGenerate(b, res)); return; }
  if (req.method === 'POST' && req.url === '/api/generate-audio') { readBody(req, (b) => handleGenerateAudio(b, res)); return; }
  if (req.method === 'POST' && req.url === '/api/save-json')      { readBody(req, (b) => handleSaveJson(b, res)); return; }
  if (req.method === 'POST' && req.url === '/api/save-guide')     { readBody(req, (b) => handleSaveGuide(b, res)); return; }
  if (req.method === 'POST' && req.url === '/api/revise')         { readBody(req, (b) => handleRevise(b, res)); return; }
  if (req.method === 'POST' && req.url === '/api/delete-paper')   { readBody(req, (b) => handleDeletePaper(b, res)); return; }
  if (req.method === 'POST' && req.url === '/api/build-index')    { handleBuildIndex(res); return; }
  if (req.method === 'POST' && req.url === '/api/translate-paper'){ readBody(req, (b) => handleTranslatePaper(b, res)); return; }
  if (req.method === 'POST' && req.url === '/api/generate-paper') { readBody(req, (b) => handleGeneratePaper(b, res)); return; }
  // Static files.
  (async () => {
    try {
      let pathname = decodeURIComponent((req.url || '/').split('?')[0]);
      if (pathname === '/') pathname = '/index.html';
      const filePath = resolve(SITE, '.' + pathname);
      if (!filePath.startsWith(SITE)) { res.writeHead(403); res.end('Forbidden'); return; }
      const buf = await readFile(filePath);
      res.writeHead(200, { 'content-type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(buf);
    } catch (_) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('Not found');
    }
  })();
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('Edit server on http://127.0.0.1:' + PORT + '  (editing ' + (EDIT_ENABLED ? 'ENABLED' : 'disabled') + ')');
  if (EDIT_ENABLED) console.log('Turn on Edit in the toolbar; use Generate / Regenerate on an image block.');
  else console.log('Editing is disabled. Run "npm run edit" (passes --enable) or set VW_EDIT=1 to enable.');
});
