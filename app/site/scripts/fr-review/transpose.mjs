#!/usr/bin/env node
/* transpose.mjs — ingest a francophone-corrected <id>.fr.md back into
   data/papers/<id>.fr.json.

   The corrections came back as full corrected Markdown exports (the same format
   the site's "Download Markdown" produces). This tool parses that Markdown into
   an ordered token stream and aligns it to the CURRENT fr.json block structure
   (which is exactly what was exported to MD), overwriting only the text-bearing
   fields — title, subtitle, abstract, and per-block prose — while preserving
   every structural / asset field (types, ids, fno, image src + image_prompt).

   It NEVER guesses structure: it walks the fr.json blocks and consumes the
   matching token. If a block's expected token kind does not match, it records a
   MISALIGN (almost always English drift the MD predates) and leaves that field
   untouched, so nothing is silently corrupted.

   Usage:
     node scripts/fr-review/transpose.mjs <id>            # dry run: report only
     node scripts/fr-review/transpose.mjs <id> --write    # apply to fr.json
     node scripts/fr-review/transpose.mjs --all [--write]  */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '..', '..');
const FEED = resolve(SITE, '..', '..', 'french-translation', 'velocity-white-papers_fr_2026-06-12',
  "Corrections de la version française des 'Velocity White Papers'");

/* doc number -> paper id (from the folder listing) */
const DOC_MAP = {
  '01': 'cux4h', '02': 'mwo98', '03': 'bbkac', '04': 'offjm', '05': 'zgym1', '06': 'p7p2k',
  '07': 'l199t', '08': 'qthji', '09': 'uwpxr', '10': 'k3tc3', '11': 'qxlzo', '12': 'dt725',
  '13': 'oxj36', '14': 'eujjc', '15': 'yu5k9', '16': 'l5wsi', '17': 'of1cj', '18': 'xs7uh',
};
const ID_TO_DOC = Object.fromEntries(Object.entries(DOC_MAP).map(([d, id]) => [id, d]));

function mdPath(id) {
  const doc = ID_TO_DOC[id];
  if (!doc) return null;
  return resolve(FEED, 'Document numéro ' + doc, id + '.fr.md');
}

/* ---------- markdown -> token stream ---------- */
function parseMd(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  // title
  let i = 0;
  while (i < lines.length && !lines[i].startsWith('# ')) i++;
  const title = i < lines.length ? lines[i].slice(2).trim() : '';
  i++;
  // subtitle (first _italic_ block before meta)
  let subtitle = '';
  while (i < lines.length && !lines[i].trim()) i++;
  if (i < lines.length && /^[_*].*[_*]$/.test(lines[i].trim())) { subtitle = lines[i].trim().replace(/^[_*]+/, '').replace(/[_*]+$/, ''); i++; }
  // skip meta until the first ## heading
  while (i < lines.length && !/^##\s/.test(lines[i])) i++;
  // an Abstract/Résumé heading (## but not ## §NN) marks the abstract: the
  // abstract is exactly the FIRST paragraph chunk after it. The lead body
  // paragraphs that follow (before ## §01) are real blocks, so we must NOT
  // greedily swallow them.
  let hasAbstractHeading = false;
  if (i < lines.length && /^##\s/.test(lines[i]) && !/^##\s+§/.test(lines[i])) { hasAbstractHeading = true; i++; }
  // remaining -> chunks split on blank lines
  const rest = lines.slice(i).join('\n');
  let chunks = rest.split(/\n\s*\n/).map(c => c.replace(/\n+$/, '')).filter(c => c.trim().length);
  // drop trailing meta lines the exporter emits from tag_row / related blocks
  // (e.g. "**Mots-clés:** …", "**Documents connexes:** …"); they are not prose.
  const META_RE = /^\*\*\s*(Mots-?cl[ée]s|Tags|Documents?\s+connexes|Articles?\s+connexes|Related\b|Vid[ée]o)\s*\*?\*?\s*:/i;
  chunks = chunks.filter(c => !META_RE.test(c.trim()));
  let abstract = '';
  if (hasAbstractHeading && chunks.length && !isTokenStart(chunks[0].trim())) { abstract = chunks.shift().trim(); }
  const tokens = [];
  for (let c = 0; c < chunks.length; c++) {
    const raw = chunks[c];
    const t = raw.trim();
    if (/^#{1,3}\s+§/.test(t)) {
      const m = t.match(/^#{1,3}\s+§\s*(\S*)\s*(.*)$/);
      tokens.push({ kind: 'HEADING', n: (m && m[1]) || '', title: (m && m[2] ? m[2] : '').trim() });
    } else if (/^###\s/.test(t)) {
      // table title; the table rows are usually in the SAME chunk (no blank line) or next chunk
      const tl = t.split('\n');
      const ttitle = tl[0].replace(/^###\s+/, '').trim();
      const rowLines = tl.slice(1).filter(x => x.trim().startsWith('|'));
      let cols = [], rows = [];
      if (rowLines.length) { ({ cols, rows } = parseTable(rowLines)); }
      else if (c + 1 < chunks.length && chunks[c + 1].trim().startsWith('|')) { ({ cols, rows } = parseTable(chunks[++c].split('\n'))); }
      tokens.push({ kind: 'TABLE', title: ttitle, cols, rows });
    } else if (t.startsWith('|')) {
      const { cols, rows } = parseTable(t.split('\n'));
      tokens.push({ kind: 'TABLE', title: '', cols, rows });
    } else if (/^>\s*\*\*/.test(t)) {
      // sidenote: > **label** — value
      const m = t.replace(/^>\s*/, '').match(/^\*\*(.+?)\*\*\s*[—-]\s*([\s\S]*)$/);
      tokens.push({ kind: 'SIDENOTE', label: (m && m[1]) || '', value: (m && m[2] ? m[2] : '').trim() });
    } else if (t.startsWith('>')) {
      const ql = t.split('\n').map(x => x.replace(/^>\s?/, ''));
      let cite = '';
      const last = ql[ql.length - 1] || '';
      if (/^[—-]\s/.test(last.trim())) { cite = last.trim().replace(/^[—-]\s*/, ''); ql.pop(); }
      tokens.push({ kind: 'QUOTE', text: ql.join('\n').trim(), cite });
    } else if (/^[_*]Figure\b/.test(t)) {
      const m = t.match(/^[_*]Figure\s+(.*?)(?:\s+—\s+(.*))?[_*]$/);
      const fig = { kind: 'FIGURE', fno: (m && m[1] ? m[1] : '').trim(), title: (m && m[2] ? m[2] : '').trim(), caption: '', alt: '' };
      // lookahead: caption chunk (not image comment / not new token), then image comment
      if (c + 1 < chunks.length && !/^<!--\s*image:/.test(chunks[c + 1].trim()) && !isTokenStart(chunks[c + 1].trim())) {
        fig.caption = chunks[++c].trim();
      }
      if (c + 1 < chunks.length && /^<!--\s*image:/.test(chunks[c + 1].trim())) {
        fig.alt = chunks[++c].trim().replace(/^<!--\s*image:\s*/, '').replace(/-->$/, '').trim();
      }
      tokens.push(fig);
    } else if (/^<!--\s*image:/.test(t)) {
      tokens.push({ kind: 'IMAGE', alt: t.replace(/^<!--\s*image:\s*/, '').replace(/-->$/, '').trim() });
    } else if (/^\*\*[^*]+:\s.*\*\*$/.test(t) && !t.includes('\n')) {
      const m = t.match(/^\*\*(.+?):\s([\s\S]*)\*\*$/);
      tokens.push({ kind: 'KEYSTAT', label: (m && m[1]) || '', value: (m && m[2] ? m[2] : '').trim() });
    } else {
      tokens.push({ kind: 'PARA', text: t });
    }
  }
  return { title, subtitle, abstract, tokens };
}
function isTokenStart(t) {
  return /^#{1,3}\s+§/.test(t) || /^##\s/.test(t) || /^###\s/.test(t) || t.startsWith('|') || t.startsWith('>') || /^[_*]Figure\b/.test(t) || /^<!--\s*image:/.test(t) || (/^\*\*[^*]+:\s.*\*\*$/.test(t) && !t.includes('\n'));
}
function parseTable(rowLines) {
  const cells = (ln) => ln.replace(/^\|/, '').replace(/\|$/, '').split('|').map(s => s.replace(/\\\|/g, '|').trim());
  const rl = rowLines.filter(x => x.trim().startsWith('|'));
  if (!rl.length) return { cols: [], rows: [] };
  const cols = cells(rl[0]);
  let start = 1;
  if (rl[1] && /^[\s|:-]+$/.test(rl[1])) start = 2;   // separator row
  const rows = rl.slice(start).map(cells);
  return { cols, rows };
}

/* ---------- align tokens to fr.json blocks ---------- */
function transpose(id, write) {
  const frPath = resolve(SITE, 'data/papers/' + id + '.fr.json');
  const p = mdPath(id);
  if (!existsSync(frPath)) return { id, error: 'no fr.json' };
  if (!p || !existsSync(p)) return { id, error: 'no corrected md' };
  const fr = JSON.parse(readFileSync(frPath, 'utf8'));
  const md = parseMd(readFileSync(p, 'utf8'));
  const changes = [];
  const misaligns = [];
  const setIf = (obj, key, val, label) => {
    if (val == null) return;
    const cur = obj[key] == null ? '' : String(obj[key]);
    if (cur.trim() !== String(val).trim()) { changes.push({ field: label, from: cur, to: val }); obj[key] = val; }
  };

  setIf(fr, 'title', md.title, 'title');
  setIf(fr, 'subtitle', md.subtitle, 'subtitle');
  if (md.abstract) setIf(fr, 'abstract', md.abstract, 'abstract');

  /* Anchor-based alignment. Non-paragraph blocks are structural anchors that
     stay 1:1 with their MD tokens (the reviewers did not add/remove headings,
     figures, quotes, keystats or tables). Paragraphs are fungible fill: between
     two anchors we map the JSON paragraph run to the MD paragraph run. If the
     run lengths match we apply 1:1; if they differ (a reviewer merged or split
     paragraphs) we DO NOT guess — we flag that run for manual handling, and the
     surrounding anchors keep everything else correctly aligned (no cascade). */
  const ANCHOR_KIND = { section_heading: 'HEADING', pullquote: 'QUOTE', keystat: 'KEYSTAT', sidenote: 'SIDENOTE', figure: 'FIGURE', table: 'TABLE' };
  const isParaBlock = (b) => b.type === 'paragraph' || b.type === 'dropcap_paragraph';
  const toks = md.tokens.filter(t => t.kind !== 'IMAGE');
  const blocks = fr.blocks || [];
  let bi = 0, ti = 0;

  const applyAnchor = (b, t, idx) => {
    switch (b.type) {
      case 'section_heading': setIf(b, 'title', t.title, 'block[' + idx + '].heading'); break;
      case 'pullquote': setIf(b, 'text', t.text, 'block[' + idx + '].quote'); if (t.cite) setIf(b, 'cite', t.cite, 'block[' + idx + '].cite'); break;
      case 'sidenote': setIf(b, 'label', t.label, 'block[' + idx + '].snlabel'); setIf(b, 'value', t.value, 'block[' + idx + '].snvalue'); break;
      case 'keystat':
        setIf(b, 'label', t.label, 'block[' + idx + '].kslabel'); setIf(b, 'value', t.value, 'block[' + idx + '].ksvalue');
        if (b.body != null && toks[ti] && toks[ti].kind === 'PARA') { setIf(b, 'body', toks[ti].text, 'block[' + idx + '].ksbody'); ti++; }
        break;
      case 'figure':
        if (t.title) setIf(b, 'title', t.title, 'block[' + idx + '].figtitle');
        if (t.caption) setIf(b, 'caption', t.caption, 'block[' + idx + '].figcaption');
        if (t.alt && b.image) setIf(b.image, 'alt', t.alt, 'block[' + idx + '].figalt');
        break;
      case 'table':
        if (t.title && b.title != null) setIf(b, 'title', t.title, 'block[' + idx + '].tabletitle');
        if (t.cols.length && Array.isArray(b.columns) && t.cols.length === b.columns.length) t.cols.forEach((c, ci) => setIf(b.columns, ci, c, 'block[' + idx + '].col[' + ci + ']'));
        else if (t.cols.length && Array.isArray(b.columns)) misaligns.push('block ' + idx + ' table cols ' + t.cols.length + ' != ' + b.columns.length);
        if (Array.isArray(b.rows) && t.rows.length === b.rows.length) t.rows.forEach((r, ri) => {
          if (Array.isArray(b.rows[ri]) && r.length === b.rows[ri].length) r.forEach((cv, ci) => setIf(b.rows[ri], ci, cv, 'block[' + idx + '].row[' + ri + '][' + ci + ']'));
          else misaligns.push('block ' + idx + ' table row ' + ri + ' len ' + r.length + ' != ' + (b.rows[ri] || []).length);
        });
        else if (Array.isArray(b.rows) && t.rows.length) misaligns.push('block ' + idx + ' table rows ' + t.rows.length + ' != ' + b.rows.length);
        break;
    }
  };

  // Precheck: do the structural anchors line up 1:1? (Keystat-body paragraphs
  // are PARA fill, so the non-PARA token sequence == the anchor-block sequence
  // when structure is parallel.) Only when anchors align do we trust a full
  // rebuild of paragraph runs; otherwise there is EN drift and we fall back to
  // conservative in-place edits so nothing is corrupted.
  const anchorJson = blocks.filter(b => ANCHOR_KIND[b.type]).map(b => ANCHOR_KIND[b.type]);
  const anchorMd = toks.filter(t => t.kind !== 'PARA').map(t => t.kind);
  const anchorsOk = anchorJson.length === anchorMd.length && anchorJson.every((k, i) => k === anchorMd[i]);

  const newBlocks = [];
  while (bi < blocks.length) {
    const b = blocks[bi];
    if (b.type === 'tag_row' || b.type === 'related') { newBlocks.push(b); bi++; continue; }
    if (isParaBlock(b)) {
      const jStart = bi; const jRun = [];
      while (bi < blocks.length && isParaBlock(blocks[bi])) jRun.push(blocks[bi++]);
      const tRun = [];
      while (ti < toks.length && toks[ti].kind === 'PARA') tRun.push(toks[ti++]);
      if (jRun.length === tRun.length) {
        // 1:1 — update text in place (mutates original objects, survives either path)
        jRun.forEach((blk, k) => { setIf(blk, 'text', tRun[k].text, 'block[' + (jStart + k) + '].text'); newBlocks.push(blk); });
      } else if (anchorsOk && tRun.length >= 1) {
        // mirror the reviewers' exact paragraph structure
        changes.push({ field: 'block[' + jStart + '] re-paragraphed', from: jRun.length + ' para', to: tRun.length + ' para' });
        tRun.forEach((tk, k) => newBlocks.push({ type: (k < jRun.length) ? jRun[k].type : 'paragraph', text: tk.text }));
      } else {
        jRun.forEach(blk => newBlocks.push(blk));
        misaligns.push('para-run at block ' + jStart + ': ' + jRun.length + ' json vs ' + tRun.length + ' md (kept existing FR — drift/manual)');
      }
      continue;
    }
    const want = ANCHOR_KIND[b.type];
    const t = toks[ti];
    if (!t || t.kind !== want) { misaligns.push('block ' + bi + ' ' + b.type + ': expected ' + want + ', got ' + (t && t.kind)); newBlocks.push(b); bi++; continue; }
    ti++;
    applyAnchor(b, t, bi);
    newBlocks.push(b);
    bi++;
  }
  const leftover = toks.slice(ti);
  if (leftover.length) misaligns.push('UNCONSUMED tokens: ' + leftover.map(t => t.kind + (t.text ? '("' + t.text.slice(0, 40) + '")' : '')).join(' , '));
  // Only swap in the rebuilt array when anchors aligned; otherwise the in-place
  // edits already landed on the original objects and we keep the structure.
  if (anchorsOk) fr.blocks = newBlocks;

  // Safe to write even with misaligns: a misaligned field is never assigned
  // (it is skipped and flagged), so writing only commits confidently-aligned
  // corrections. Misaligned blocks keep their existing French for manual repair.
  if (write) {
    writeFileSync(frPath, JSON.stringify(fr, null, 2) + '\n');
  }
  return { id, changes, misaligns, wrote: !!write, blocks: blocks.length, tokens: md.tokens.length };
}

export { parseMd, mdPath, DOC_MAP };

/* ---------- main (only when run directly, not when imported) ---------- */
import { pathToFileURL } from 'node:url';
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
const args = process.argv.slice(2);
const write = args.includes('--write');
const all = args.includes('--all');
const ids = all ? Object.values(DOC_MAP) : args.filter(a => !a.startsWith('--'));
let totalCh = 0, totalMis = 0;
for (const id of ids) {
  const r = transpose(id, write);
  if (r.error) { console.log('\n### ' + id + ' — ERROR: ' + r.error); continue; }
  console.log('\n### ' + id + '  (' + r.blocks + ' blocks, ' + r.tokens + ' tokens)  ' + r.changes.length + ' changed' + (r.misaligns.length ? '  ⚠ ' + r.misaligns.length + ' MISALIGN' : '') + (r.wrote ? '  [WROTE]' : ''));
  totalCh += r.changes.length; totalMis += r.misaligns.length;
  for (const m of r.misaligns) console.log('  ⚠ ' + m);
  if (!all) {
    const rep = resolve(__dirname, 'reports', id + '.changes.md');
    const out = ['# ' + id + ' — FR corrections (' + r.changes.length + ' changed fields)\n'];
    for (const c of r.changes) { out.push('## ' + c.field); out.push('- **was:** ' + c.from); out.push('- **now:** ' + c.to + '\n'); }
    writeFileSync(rep, out.join('\n'));
    console.log('  report → scripts/fr-review/reports/' + id + '.changes.md');
  }
}
console.log('\nTOTAL: ' + totalCh + ' changed fields, ' + totalMis + ' misaligns across ' + ids.length + ' papers.');
}
