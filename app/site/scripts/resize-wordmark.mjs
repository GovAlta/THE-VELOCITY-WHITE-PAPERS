/* One-shot: resize the Alberta wordmark to ~200px width for retina display
   at 95×27. The committed file was 750×211, 95KB; this brings it well
   under 10KB and eliminates the layout-shift caused by the unsized source. */

import sharp from 'sharp';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const src = resolve(__dirname, '..', 'assets/alberta-wordmark.png');

const before = statSync(src).size;
const buf = await sharp(src)
  .resize({ width: 200, withoutEnlargement: true })
  .png({ compressionLevel: 9, palette: true, quality: 90 })
  .toBuffer();

const meta = await sharp(buf).metadata();
writeFileSync(src, buf);
console.log('Before: ' + (before/1024).toFixed(1) + 'KB');
console.log('After:  ' + (buf.length/1024).toFixed(1) + 'KB (' + meta.width + '×' + meta.height + ')');
