/* translatable.mjs — collect the human-readable strings of a paper for
   translation, apply translations back, retarget locale-specific asset paths,
   and compute a staleness signature. Used by the hard "translate & build" flow. */

/* Returns [{ key, text, apply(newValue) }] over EVERY translatable string in a
   paper — deep. Walks the whole tree so figure charts (step-flow / bar / owner
   charts), data tables (columns + rows), TL;DR visual_config (compare/list/stat),
   sidenotes, keystats, etc. are all covered, not just top-level captions.
   `image_prompt` values are prefixed "imgprompt:" for label-only translation
   downstream. Grouping keys (tags), identifiers, paths, and enum/number-only
   cells are skipped. */
export function collectTranslatable(paper) {
  const items = [];
  // Keys whose string value is human-readable prose to translate.
  const TKEYS = new Set([
    'title', 'subtitle', 'subcaption', 'caption', 'abstract', 'text', 'label', 'desc',
    'body', 'cite', 'heading', 'sub', 'name', 'stat_label', 'blurb', 'note', 'summary',
    'value', 'alt', 'tagline', 'placeholder',
  ]);
  // Never translate: identifiers, paths, enums, styling, grouping keys.
  const SKIP = new Set([
    'id', 'src', 'href', 'url', 'kind', 'type', 'fno', 'n', 'num', 'slot', 'style_kind',
    'style_prompt', 'color', 'icon', 'audio_file', 'presentation_ref', 'owner_id', 'locale',
    'primary_locale', 'category', 'tier', 'track', 'status', 'repo', 'tags', 'related',
    'visual', 'ref', 'sig', 'block_sigs', 'source_signature', 'translation_status',
  ]);
  const push = (owner, field, key, isPrompt) => {
    const v = owner[field];
    if (typeof v === 'string' && v.trim()) {
      items.push({ key: (isPrompt ? 'imgprompt:' : '') + key, text: v, apply: (nv) => { if (nv != null) owner[field] = nv; } });
    }
  };
  const hasLetters = (s) => /[A-Za-zÀ-ÿ]/.test(s);
  function walk(node, path) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach((v, i) => { if (v && typeof v === 'object') walk(v, path + '.' + i); }); return; }
    for (const k of Object.keys(node)) {
      if (SKIP.has(k)) continue;
      const v = node[k];
      if (k === 'image_prompt') { push(node, k, path + '.' + k, true); continue; }
      if (typeof v === 'string') {
        if (TKEYS.has(k)) push(node, k, path + '.' + k);
      } else if (Array.isArray(v)) {
        if (k === 'columns') {
          v.forEach((cell, i) => { if (typeof cell === 'string' && cell.trim() && hasLetters(cell)) items.push({ key: path + '.columns.' + i, text: cell, apply: (nv) => { if (nv != null) v[i] = nv; } }); });
        } else if (k === 'rows') {
          v.forEach((row, ri) => { if (Array.isArray(row)) row.forEach((cell, ci) => { if (typeof cell === 'string' && cell.trim() && hasLetters(cell)) items.push({ key: path + '.rows.' + ri + '.' + ci, text: cell, apply: (nv) => { if (nv != null) row[ci] = nv; } }); }); });
        } else {
          v.forEach((el, i) => {
            if (el && typeof el === 'object') walk(el, path + '.' + k + '.' + i);
            else if (typeof el === 'string' && TKEYS.has(k) && el.trim()) items.push({ key: path + '.' + k + '.' + i, text: el, apply: (nv) => { if (nv != null) v[i] = nv; } });
          });
        }
      } else if (v && typeof v === 'object') {
        walk(v, path + '.' + k);
      }
    }
  }
  walk(paper, '');
  return items;
}

/* Swap locale-specific asset paths from sourceLocale to targetLocale so the
   target points at its own files. */
export function retargetPaths(paper, srcLoc, tgtLoc) {
  const swap = (s) => (typeof s === 'string' ? s.replace('/' + srcLoc + '/', '/' + tgtLoc + '/') : s);
  if (paper.hero_image && paper.hero_image.src) paper.hero_image.src = swap(paper.hero_image.src);
  if (paper.audio && paper.audio.src) paper.audio.src = swap(paper.audio.src);
  (paper.blocks || []).forEach((b) => { if (b.image && b.image.src) b.image.src = swap(b.image.src); });
  const tldr = paper.tldr_presentation;
  if (tldr) {
    tldr.locale = tgtLoc;
    (tldr.slides || []).forEach((s) => {
      if (s.audio_file) s.audio_file = swap(s.audio_file);
      if (s.image && s.image.src) s.image.src = swap(s.image.src);
    });
  }
}

/* A stable fingerprint of the canonical's structure + visible text, so a target
   can tell when it is behind the source it was translated from. */
export function computeSignature(paper) {
  const parts = [];
  parts.push('meta|' + (paper.title || '') + '|' + (paper.subtitle || '') + '|' + (paper.abstract || ''));
  (paper.blocks || []).forEach((b) => parts.push(b.type + '|' + (b.n || '') + '|' + (b.text || b.caption || b.title || b.value || '')));
  ((paper.tldr_presentation && paper.tldr_presentation.slides) || []).forEach((s) => parts.push('s:' + s.id + '|' + (s.visual || '') + '|' + (s.text || '')));
  let h = 5381;
  const str = parts.join('\n');
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return String(h);
}
