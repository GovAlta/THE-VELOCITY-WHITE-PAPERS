#!/usr/bin/env node
/* dev-server.mjs — minimal static dev server with HTTP Range support.

   The default `http-server` returns 200 + chunked for media (no Range), which
   makes the browser treat audio as non-seekable. GitHub Pages supports Range, so
   this server matches production behaviour locally: it answers Range requests
   with 206 + Content-Range so the native audio scrubber works. It also sends
   Cache-Control: no-store so a stale cached asset never masks a change. */

import { createServer } from 'node:http';
import { stat, open } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, extname, normalize } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'); // app/site
const PORT = Number(process.env.PORT) || 5173;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.mp3': 'audio/mpeg',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
};

function safePath(urlPath) {
  const clean = decodeURIComponent((urlPath.split('?')[0] || '/'));
  let p = normalize(join(ROOT, clean));
  if (!p.startsWith(ROOT)) return null;          // no path traversal
  return p;
}

const server = createServer(async (req, res) => {
  try {
    let path = safePath(req.url);
    if (!path) { res.writeHead(403).end('Forbidden'); return; }
    const urlPath = (req.url.split('?')[0] || '/');
    const isAsset = /\.[a-z0-9]+$/i.test(urlPath);   // a request for a file (has an extension)
    let info = null;
    if (isAsset) {
      // Real asset: serve it, or 404 if missing. (Never hand HTML back for a
      // missing .js/.json/.mp3 — that only hides the real error.)
      try { info = await stat(path); } catch { info = null; }
      if (!info || info.isDirectory()) { res.writeHead(404).end('Not found'); return; }
    } else {
      // Clean app route (e.g. /paper/<id>, /about): serve the SPA shell directly
      // so the History-API router renders it. This matches production, where a
      // deep link resolves to the app, without the prerender redirect hop.
      path = join(ROOT, 'index.html');
      info = await stat(path).catch(() => null);
      if (!info) { res.writeHead(404).end('Not found'); return; }
    }

    const type = TYPES[extname(path).toLowerCase()] || 'application/octet-stream';
    const total = info.size;
    const baseHeaders = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };

    const range = req.headers.range;
    const fh = await open(path, 'r');
    try {
      if (range) {
        const m = /bytes=(\d*)-(\d*)/.exec(range);
        let start = m && m[1] ? parseInt(m[1], 10) : 0;
        let end = m && m[2] ? parseInt(m[2], 10) : total - 1;
        if (isNaN(start) || isNaN(end) || start > end || end >= total) {
          res.writeHead(416, { 'Content-Range': `bytes */${total}` }).end();
          return;
        }
        res.writeHead(206, { ...baseHeaders, 'Content-Range': `bytes ${start}-${end}/${total}`, 'Content-Length': end - start + 1 });
        if (req.method === 'HEAD') { res.end(); return; }
        fh.createReadStream({ start, end }).pipe(res);
      } else {
        res.writeHead(200, { ...baseHeaders, 'Content-Length': total });
        if (req.method === 'HEAD') { res.end(); return; }
        fh.createReadStream().pipe(res);
      }
      await new Promise((r) => res.on('close', r));
    } finally {
      await fh.close();
    }
  } catch (e) {
    if (!res.headersSent) res.writeHead(500);
    res.end('Server error');
  }
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use. Stop the other dev server (an old "npm run dev" / http-server) and try again, or run with PORT=5174 npm run dev.\n`);
    process.exit(1);
  }
  throw e;
});

server.listen(PORT, () => {
  console.log(`Velocity dev server (Range-enabled) on http://localhost:${PORT}  serving ${ROOT}`);
});
