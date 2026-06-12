#!/usr/bin/env node
/* screenshot-sim.mjs — visual QA loop for the simulation player (dev/edit only).

   Drives the locally installed Chrome (puppeteer-core, no bundled browser)
   against the running dev server, seeks the simulation to chosen chapters and
   times, and writes PNGs for review. The sim engine is deterministic under
   seek (the audio clock drives the timeline), so a (chapter, fraction) pair
   always renders the same frame.

   Usage:
     node scripts/screenshot-sim.mjs                          # default sweep of gov3
     node scripts/screenshot-sim.mjs --paper g3sim --sim gov3 --shots 0:0.5,2:0.9
     node scripts/screenshot-sim.mjs --base http://localhost:5173 --out .shots */

import { mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i !== -1 ? args[i + 1] : d; };
const BASE = opt('base', 'http://localhost:5173');
const PAPER = opt('paper', 'g3sim');
const LOCALE = opt('locale', 'en');
const OUT = resolve(opt('out', '.shots'));
const SHOTS = opt('shots', '0:0.05,0:0.5,0:0.95,1:0.55,2:0.6,3:0.5,4:0.4,5:0.55,6:0.55,7:0.6,7:0.95')
  .split(',').map(s => { const [c, f] = s.split(':'); return { ch: Number(c), f: Number(f) }; });

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
                'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
  .find(p => existsSync(p));
if (!CHROME) { console.error('No Chrome/Edge found.'); process.exit(1); }
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--mute-audio', '--force-prefers-no-reduced-motion'] });
const page = await browser.newPage();
await page.setViewport({ width: 1480, height: 1000, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('[pageerror]', e.message));
page.on('console', m => { if (m.type() === 'error') console.error('[console]', m.text()); });

if (LOCALE === 'fr') await page.evaluateOnNewDocument(() => { try { localStorage.setItem('vw_locale', 'fr'); } catch (e) {} });
const THEME = opt('theme', '');
if (THEME) await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('vw_sim_theme', t); } catch (e) {} }, THEME);
const url = BASE + '/paper/' + PAPER;
console.log('open', url);
await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
await page.waitForSelector('.sim-frame', { timeout: 30000 });
await page.evaluate(() => { const el = document.querySelector('.sim-frame'); el.scrollIntoView({ block: 'center' }); document.querySelectorAll('nav, header, .vw-nav, .app-nav').forEach(n => { n.style.visibility = 'hidden'; }); });
await new Promise(r => setTimeout(r, 1200));

/* Reach into the Vue component to seek deterministically (the Player registers
   itself on window.__simPlayers when served from localhost). */
async function seek(ch, f) {
  const SIMID = opt('simid', null);
  await page.evaluate(([c, frac, simid]) => {
    const all = window.__simPlayers || [];
    const inst = simid ? all.find(p => p.sim === simid) : all[0];
    if (!inst) throw new Error('sim instance not found (is this localhost? simid=' + simid + ')');
    window.__sim = inst;
    window.__simIdx = all.indexOf(inst);
    if (inst.ch !== c) { inst.pause(); inst.ch = c; }
  }, [ch, f, SIMID]);
  await new Promise(r => setTimeout(r, 900));               // let the chapter prime (audio metadata or fallback)
  await page.evaluate(([c, frac]) => { window.__sim.seekTo(frac); }, [ch, f]);
  await new Promise(r => setTimeout(r, 350));
}

for (const s of SHOTS) {
  await seek(s.ch, s.f);
  const file = resolve(OUT, 'sim-' + LOCALE + '-ch' + (s.ch + 1) + '-' + Math.round(s.f * 100) + '.png');
  const idx = await page.evaluate(() => window.__simIdx || 0);
  await page.evaluate(i => { document.querySelectorAll('.sim-frame')[i].scrollIntoView({ block: 'center' }); }, idx);
  await new Promise(r => setTimeout(r, 900));               // let any scroll-reveal animation finish
  await page.screenshot({ path: file, captureBeyondViewport: false });   // full viewport, frame centred
  console.log('shot', file);
}

await browser.close();
console.log('done: ' + SHOTS.length + ' screenshots in ' + OUT);
