#!/usr/bin/env node
/* build-gallery.mjs — extract media (videos and figures) from every paper into
   data/gallery.json, so the Media gallery page can show them and link back to
   the paper each came from. Videos come from `youtube` blocks; images from
   `figure` blocks with an image. Run after content changes:  npm run build:gallery */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '..');

function youtubeId(url) {
  if (!url) return null;
  const s = String(url).trim();
  let m = s.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|v\/))([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  return null;
}

const inv = JSON.parse(readFileSync(resolve(SITE, 'data/papers.json'), 'utf8'));
const papers = (inv.papers || inv).slice();

const videos = [];
const images = [];

for (const p of papers) {
  const file = resolve(SITE, 'data/papers/' + p.id + '.en.json');
  if (!existsSync(file)) continue;
  let doc;
  try { doc = JSON.parse(readFileSync(file, 'utf8')); } catch { continue; }
  if (doc._meta && doc._meta.placeholder) continue;   // skip unwritten stubs
  for (const b of (doc.blocks || [])) {
    if (b.type === 'youtube' && b.url) {
      const id = youtubeId(b.url);
      videos.push({
        paper_id: p.id, num: p.num, paper_title: p.title,
        title: b.title || '', caption: b.caption || '',
        url: b.url,
        video_id: id,
        thumb: id ? ('https://img.youtube.com/vi/' + id + '/hqdefault.jpg') : null,
      });
    } else if (b.type === 'figure' && b.image && b.image.src) {
      images.push({
        paper_id: p.id, num: p.num, paper_title: p.title,
        fno: b.fno || '', title: b.title || '', caption: b.caption || '',
        src: b.image.src, alt: b.image.alt || '',
      });
    }
  }
}

const out = { generated_from: 'data/papers/*.en.json', videos, images };
writeFileSync(resolve(SITE, 'data/gallery.json'), JSON.stringify(out, null, 2) + '\n');
console.log('Built data/gallery.json: ' + videos.length + ' video(s), ' + images.length + ' figure(s).');
