/* translatable.mjs — collect the human-readable strings of a paper for
   translation, apply translations back, retarget locale-specific asset paths,
   and compute a staleness signature. Used by the hard "translate & build" flow. */

/* Returns [{ key, text, apply(newValue) }] over every translatable field.
   imgprompt: keys get label-only translation downstream. */
export function collectTranslatable(paper) {
  const items = [];
  const add = (key, owner, field, isPrompt) => {
    if (!owner) return;
    const v = owner[field];
    if (typeof v === 'string' && v.trim()) {
      items.push({ key: (isPrompt ? 'imgprompt:' : '') + key, text: v, apply: (nv) => { if (nv != null) owner[field] = nv; } });
    }
  };
  add('title', paper, 'title');
  add('subtitle', paper, 'subtitle');
  add('abstract', paper, 'abstract');
  if (paper.hero_image) { add('hero.alt', paper.hero_image, 'alt'); add('hero.image_prompt', paper.hero_image, 'image_prompt', true); }
  (paper.blocks || []).forEach((b, i) => {
    ['text', 'caption', 'title', 'cite', 'label', 'value'].forEach((f) => add('block:' + i + ':' + f, b, f));
    if (b.image) { add('block:' + i + ':image.alt', b.image, 'alt'); add('block:' + i + ':image.image_prompt', b.image, 'image_prompt', true); }
  });
  const slides = (paper.tldr_presentation && paper.tldr_presentation.slides) || [];
  slides.forEach((s, i) => {
    ['title', 'caption', 'subcaption', 'text'].forEach((f) => add('slide:' + i + ':' + f, s, f));
    if (s.image) { add('slide:' + i + ':image.alt', s.image, 'alt'); add('slide:' + i + ':image.image_prompt', s.image, 'image_prompt', true); }
  });
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
