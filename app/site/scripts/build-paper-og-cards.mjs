#!/usr/bin/env node
/* build-paper-og-cards.mjs — render a per-paper 1200x630 social card for every
   paper in the collection, on the same cream/navy/rust template as the site
   card. The paper's title carries the card (auto-wrapped and auto-sized), with
   the collection name, number, tier, and domain. Output: public/og/<id>.jpg.
   Stored outside public/images so the image-metadata eval does not require a
   generation sidecar (these are composed, not model-generated).
   Run: npm run build:og  */

import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '..');

const CREAM = '#F7F4ED', NAVY = '#1A3A6E', RUST = '#C2491A', MUTED = '#4A5A73';
const SANS = "Inter, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'JetBrains Mono', 'Courier New', monospace";

function xml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/* Greedy word-wrap. Returns lines whose estimated width fits maxW at fontSize,
   using an average glyph-width factor for the bold sans face. */
function wrap(text, fontSize, maxW, factor = 0.56) {
  const maxChars = Math.max(6, Math.floor(maxW / (fontSize * factor)));
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? line + ' ' + w : w;
    if (next.length > maxChars && line) { lines.push(line); line = w; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/* Choose the largest title size (within range) that wraps to <= maxLines. */
function fitTitle(title, maxW, maxLines) {
  for (let fs = 84; fs >= 44; fs -= 4) {
    const lines = wrap(title, fs, maxW);
    if (lines.length <= maxLines) return { fs, lines };
  }
  const fs = 44;
  let lines = wrap(title, fs, maxW);
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[maxLines - 1] = lines[maxLines - 1].replace(/[\s.,;:]+\S*$/, '') + '…';
  }
  return { fs, lines };
}

const inv = JSON.parse(readFileSync(resolve(SITE, 'data/papers.json'), 'utf8'));
const papers = inv.papers || inv;
mkdirSync(resolve(SITE, 'public/og'), { recursive: true });

/* Locales to render a card for, from site.json. Each locale gets its own card
   built from that locale's translated title + subtitle; the collection name,
   number, tier, and track stay in English (brand + fixed taxonomy). The default
   locale keeps the plain <id>.jpg name; others are <id>.<locale>.jpg. */
const site = JSON.parse(readFileSync(resolve(SITE, 'data/site.json'), 'utf8'));
const LOCALES = (site.locales || [{ code: 'en' }]).map((l) => l.code);
const DEF = site.default_locale || LOCALES[0] || 'en';

const PAD_L = 86, USABLE = 1024;

/* Compose one 1200x630 card SVG from a localized title + subtitle. */
function cardSvg({ title, subtitle, num, tier, track }) {
  const { fs, lines } = fitTitle(title || '', USABLE, 3);
  const lineH = Math.round(fs * 1.08);
  const titleTop = 250;
  const titleSvg = lines.map((ln, i) =>
    `<text x="${PAD_L}" y="${titleTop + i * lineH}" font-family="${SANS}" font-size="${fs}" font-weight="700" fill="${NAVY}">${xml(ln)}</text>`
  ).join('\n  ');
  const ruleY = titleTop + (lines.length - 1) * lineH + 38;
  const subLines = wrap(subtitle || '', 28, USABLE, 0.52).slice(0, 2);
  const subSvg = subLines.map((ln, i) =>
    `<text x="${PAD_L}" y="${ruleY + 52 + i * 40}" font-family="${SANS}" font-size="28" fill="${MUTED}">${xml(ln)}</text>`
  ).join('\n  ');
  const eyebrow = `THE VELOCITY WHITE PAPERS · No ${num}${tier ? ' · ' + tier.toUpperCase() : ''}`;
  return { fs, lines, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${CREAM}"/>
  <rect x="0" y="0" width="14" height="630" fill="${RUST}"/>
  <rect x="40" y="40" width="1120" height="550" fill="none" stroke="${NAVY}" stroke-opacity="0.18" stroke-width="2"/>
  <text x="${PAD_L}" y="120" font-family="${MONO}" font-size="20" letter-spacing="3" fill="${NAVY}" fill-opacity="0.75">${xml(eyebrow)}</text>
  ${titleSvg}
  <rect x="${PAD_L}" y="${ruleY}" width="110" height="5" fill="${RUST}"/>
  ${subSvg}
  <text x="${PAD_L}" y="585" font-family="${MONO}" font-size="22" fill="${RUST}">thevelocitywhitepapers.com</text>
  <text x="1110" y="585" text-anchor="end" font-family="${MONO}" font-size="18" fill="${NAVY}" fill-opacity="0.7">${xml(track || 'Open source')}</text>
</svg>` };
}

let count = 0;
for (const p of papers) {
  for (const loc of LOCALES) {
    const t18 = (loc !== DEF && p.i18n && p.i18n[loc]) ? p.i18n[loc] : null;
    const title = (t18 && t18.title) || p.title;
    const subtitle = (t18 && t18.subtitle != null) ? t18.subtitle : p.subtitle;
    const { fs, lines, svg } = cardSvg({ title, subtitle, num: p.num, tier: p.tier, track: p.track });
    const name = loc === DEF ? (p.id + '.jpg') : (p.id + '.' + loc + '.jpg');
    const out = resolve(SITE, 'public/og/' + name);
    await sharp(Buffer.from(svg)).jpeg({ quality: 86, progressive: true, chromaSubsampling: '4:4:4' }).toFile(out);
    console.log('  og/' + name + '  (' + loc + ', ' + fs + 'px, ' + lines.length + ' line' + (lines.length > 1 ? 's' : '') + ')');
    count += 1;
  }
}
console.log('Built ' + count + ' per-paper og cards (' + papers.length + ' papers × ' + LOCALES.length + ' locales) under public/og/.');
