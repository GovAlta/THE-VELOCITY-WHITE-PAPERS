#!/usr/bin/env node
/* build-gallery.mjs — extract media (videos and figures) from every paper into
   data/gallery.json, so the Media gallery page can show them and link back to
   the paper each came from. Videos come from `youtube` blocks; images from
   `figure` blocks with an image. Run after content changes:  npm run build:gallery

   Bilingual: each item carries EN fields plus _fr variants (paper_title_fr,
   title_fr, caption_fr, src_fr, alt_fr) read from the matching <id>.fr.json,
   matched by block index. GalleryPage picks the variant for the active locale. */

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

function load(id, loc) {
  const file = resolve(SITE, 'data/papers/' + id + '.' + loc + '.json');
  if (!existsSync(file)) return null;
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; }
}

const inv = JSON.parse(readFileSync(resolve(SITE, 'data/papers.json'), 'utf8'));
const papers = (inv.papers || inv).slice();

const videos = [];
const images = [];

for (const p of papers) {
  const doc = load(p.id, 'en');
  if (!doc) continue;
  if (doc._meta && doc._meta.placeholder) continue;   // skip unwritten stubs
  const fr = load(p.id, 'fr');
  const frDoc = (fr && fr._meta && fr._meta.placeholder) ? null : fr;
  const frBlocks = (frDoc && frDoc.blocks) || [];
  const paperTitleFr = (frDoc && frDoc.title) || p.title;

  (doc.blocks || []).forEach((b, i) => {
    const fb = frBlocks[i] && frBlocks[i].type === b.type ? frBlocks[i] : null;
    if (b.type === 'youtube' && b.url) {
      const id = youtubeId(b.url);
      videos.push({
        paper_id: p.id, num: p.num, paper_title: p.title, paper_title_fr: paperTitleFr,
        title: b.title || '', title_fr: (fb && fb.title) || b.title || '',
        caption: b.caption || '', caption_fr: (fb && fb.caption) || b.caption || '',
        url: b.url,
        video_id: id,
        thumb: id ? ('https://img.youtube.com/vi/' + id + '/hqdefault.jpg') : null,
      });
    } else if (b.type === 'figure' && b.image && b.image.src) {
      const frSrc = (fb && fb.image && fb.image.src) || b.image.src.replace('/en/', '/fr/');
      images.push({
        paper_id: p.id, num: p.num, paper_title: p.title, paper_title_fr: paperTitleFr,
        fno: b.fno || '',
        title: b.title || '', title_fr: (fb && fb.title) || b.title || '',
        caption: b.caption || '', caption_fr: (fb && fb.caption) || b.caption || '',
        src: b.image.src, src_fr: frSrc,
        alt: b.image.alt || '', alt_fr: (fb && fb.image && fb.image.alt) || b.image.alt || '',
      });
    }
  });
}

const out = { generated_from: 'data/papers/*.{en,fr}.json', videos, images };
writeFileSync(resolve(SITE, 'data/gallery.json'), JSON.stringify(out, null, 2) + '\n');
console.log('Built data/gallery.json: ' + videos.length + ' video(s), ' + images.length + ' figure(s).');
