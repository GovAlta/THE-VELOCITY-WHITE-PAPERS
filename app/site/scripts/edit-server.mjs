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
import { reviseItems } from './lib/llm.mjs';
import { buildIndex } from './lib/index-build.mjs';

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

    // FR conditions on the EN source PNG when present, to keep the bilingual pair consistent.
    let refAbs = null;
    if (loc === 'fr') {
      const enSrc = src.replace('/fr/', '/en/').replace(/\.jpg$/i, '.source.png');
      const enAbs = resolve(SITE, enSrc);
      if (existsSync(enAbs)) refAbs = enAbs;
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
    const { synthesize } = await import('./lib/tts.mjs');
    const buf = await synthesize(text);
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
  if (req.method === 'POST' && req.url === '/api/generate-image') { readBody(req, (b) => handleGenerate(b, res)); return; }
  if (req.method === 'POST' && req.url === '/api/generate-audio') { readBody(req, (b) => handleGenerateAudio(b, res)); return; }
  if (req.method === 'POST' && req.url === '/api/save-json')      { readBody(req, (b) => handleSaveJson(b, res)); return; }
  if (req.method === 'POST' && req.url === '/api/save-guide')     { readBody(req, (b) => handleSaveGuide(b, res)); return; }
  if (req.method === 'POST' && req.url === '/api/revise')         { readBody(req, (b) => handleRevise(b, res)); return; }
  if (req.method === 'POST' && req.url === '/api/delete-paper')   { readBody(req, (b) => handleDeletePaper(b, res)); return; }
  if (req.method === 'POST' && req.url === '/api/build-index')    { handleBuildIndex(res); return; }
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
