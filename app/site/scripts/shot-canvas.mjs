#!/usr/bin/env node
/* shot-canvas.mjs — capture just the sim WebGL canvas (clipped, hi-res) for QA.
   Usage: node scripts/shot-canvas.mjs --paper rzsim --simid rationalize --shots 0:0.6,4:0.55 --out .shots/dir */
import { mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import puppeteer from 'puppeteer-core';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i !== -1 ? args[i + 1] : d; };
const BASE = opt('base', 'http://localhost:5173'), PAPER = opt('paper', 'rzsim'), SIMID = opt('simid', 'rationalize');
const OUT = resolve(opt('out', '.shots/canvas'));
const SHOTS = opt('shots', '0:0.6,1:0.6,3:0.55,5:0.6,6:0.6,6:0.95').split(',').map(s => { const [c, f] = s.split(':'); return { ch: Number(c), f: Number(f) }; });
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => existsSync(p));
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--mute-audio', '--force-prefers-no-reduced-motion'] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1100, deviceScaleFactor: 2 });
page.on('pageerror', e => console.error('[pageerror]', e.message));
page.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) console.error('[console]', m.text()); });
await page.goto(BASE + '/paper/' + PAPER, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('.sim-frame', { timeout: 30000 });
const ZOOM = Number(opt('zoom', '0')) || 0;
await page.evaluate(() => { document.querySelector('.sim-frame').scrollIntoView({ block: 'center' }); document.querySelectorAll('nav, header, .vw-nav, .app-nav').forEach(n => { n.style.visibility = 'hidden'; }); });
await new Promise(r => setTimeout(r, 1200));
/* pick the LIVE instance: switching locale REMOUNTS the embedded sim (paper re-renders
   FR/EN content blocks → figure vnode recreated), leaving a stale detached instance in
   __simPlayers. Always select the one whose canvas is still in the DOM. */
const LIVE = `(()=>{const all=window.__simPlayers||[];const live=all.filter(p=>p.$refs&&p.$refs.cv&&document.contains(p.$refs.cv));const m=(sid)=>live.filter(p=>p.sim===sid);return {all,live,m};})()`;
async function seek(ch, f) {
  /* 1) set locale first and let the remount happen, 2) re-find the LIVE instance,
     3) set chapter and let primeChapter settle, 4) seekTo on the live instance */
  await page.evaluate(([loc]) => { if (loc && window.VWStore && window.VWStore.locale !== loc) window.VWStore.locale = loc; }, [opt('loc', '')]);
  await new Promise(r => setTimeout(r, 950)); // allow locale-triggered remount + nextTick
  await page.evaluate(([c, simid]) => { const all = window.__simPlayers || []; const live = all.filter(p => p.$refs && p.$refs.cv && document.contains(p.$refs.cv)); const inst = (simid ? live.filter(p => p.sim === simid) : live).slice(-1)[0]; if (!inst) throw new Error('live sim not found'); window.__sim = inst; if (inst.ch !== c) { inst.pause(); inst.ch = c; } }, [ch, SIMID]);
  await new Promise(r => setTimeout(r, 900));
  const SELAPP = Number(opt('selapp', '-1'));
  const VIEW = opt('view', ''); // "z,fx,fy" virtual focal
  await page.evaluate(([frac, z, sel, view]) => { const s = window.__sim; s.seekTo(frac); if (z > 0 && s._user) s._user.zoom = z; if (sel >= 0) s.selApp = sel; if (view) { const [zz, fx, fy] = view.split(',').map(Number); const cv = s.$refs.cv, bs = s._scale, ox = s._ox || 0, oy = s._oy || 0; s._view = { z: zz, px: cv.width / 2 - ox - bs * zz * fx, py: cv.height / 2 - oy - bs * zz * fy }; } }, [f, ZOOM, SELAPP, VIEW]);
  await new Promise(r => setTimeout(r, 600));
}
for (const s of SHOTS) {
  await seek(s.ch, s.f);
  const canvas = await page.$('.sim-stage canvas');
  const file = resolve(OUT, 'cv-ch' + (s.ch + 1) + '-' + Math.round(s.f * 100) + '.png');
  await canvas.screenshot({ path: file });
  console.log('shot', file);
}
await browser.close();
console.log('done ' + SHOTS.length + ' -> ' + OUT);
