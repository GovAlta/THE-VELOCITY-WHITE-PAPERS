#!/usr/bin/env node
/* build-og-card.mjs — render the site's social sharing card (Open Graph /
   Twitter) as a crisp 1200x630 JPG, composed from an SVG so the text is sharp
   and on-brand rather than generated. Output: public/og-card.jpg.
   Run: npm run build:og  */

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '..');

const CREAM = '#F7F4ED';
const NAVY = '#1A3A6E';
const RUST = '#C2491A';
const MUTED = '#4A5A73';
const SANS = "Inter, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'JetBrains Mono', 'Courier New', monospace";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${CREAM}"/>
  <rect x="0" y="0" width="14" height="630" fill="${RUST}"/>
  <rect x="40" y="40" width="1120" height="550" fill="none" stroke="${NAVY}" stroke-opacity="0.18" stroke-width="2"/>

  <text x="90" y="130" font-family="${MONO}" font-size="22" letter-spacing="4" fill="${NAVY}" fill-opacity="0.75">GOVERNMENT OF ALBERTA · TECHNOLOGY AND INNOVATION</text>

  <text x="86" y="278" font-family="${SANS}" font-size="92" font-weight="700" fill="${NAVY}">The <tspan font-style="italic">Velocity</tspan></text>
  <text x="86" y="378" font-family="${SANS}" font-size="92" font-weight="700" fill="${NAVY}">White Papers</text>

  <rect x="90" y="408" width="120" height="5" fill="${RUST}"/>

  <text x="90" y="460" font-family="${SANS}" font-size="29" fill="${MUTED}">How the Government of Alberta is leveraging</text>
  <text x="90" y="498" font-family="${SANS}" font-size="29" fill="${MUTED}">artificial intelligence to rapidly and securely</text>
  <text x="90" y="536" font-family="${SANS}" font-size="29" fill="${MUTED}">transform its technical estate.</text>

  <text x="90" y="585" font-family="${MONO}" font-size="24" fill="${RUST}">thevelocitywhitepapers.com</text>
  <text x="1110" y="582" text-anchor="end" font-family="${MONO}" font-size="20" fill="${NAVY}" fill-opacity="0.7">Open source · bilingual</text>
</svg>`;

const out = resolve(SITE, 'public/og-card.jpg');
await sharp(Buffer.from(svg))
  .jpeg({ quality: 88, progressive: true, chromaSubsampling: '4:4:4' })
  .toFile(out);
console.log('Built public/og-card.jpg (1200x630)');
