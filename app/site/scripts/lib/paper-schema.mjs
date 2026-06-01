/* paper-schema.mjs — the block/visual vocabulary and a light validator for
   AI-generated paper parts. Shared by the draft generator and (later) an eval. */

export const BLOCK_TYPES = [
  'section_heading', 'paragraph', 'dropcap_paragraph', 'pullquote',
  'keystat', 'figure', 'table', 'sidenote', 'tag_row', 'related', 'presentation', 'audio',
];

export const VISUALS = ['title', 'stat', 'list', 'quote', 'compare', 'image', 'chart', 'custom'];

/* A compact description of the block shapes, for the model. */
export const BLOCK_SCHEMA_NOTE = [
  'Block types and their fields:',
  '- section_heading: { type, n (zero-padded "01"), title }',
  '- paragraph: { type, text } (text may contain inline HTML <code> <strong> <em> <a> <ul> <li>)',
  '- dropcap_paragraph: { type, text } (the opening paragraph; first letter is rendered large)',
  '- pullquote: { type, text, cite }',
  '- keystat: { type, label, value (short), body }',
  '- figure: { type, fno ("FIG. X.Y"), title, caption, image: { src:"", alt, image_prompt, style_kind:"diagram" } }',
  '- table: { type, title, columns: ["Col A", "Col B"], rows: [["a1","b1"],["a2","b2"]], caption, source } (for tabular facts)',
  '- sidenote: { type, label, value }',
  'Use real, source-grounded content. Where the source does not support something, write the literal marker [DRAFT GAP — needs source: ...] instead of inventing.',
].join('\n');

/* Light structural validation of generated parts. Returns an array of issues. */
export function validatePaper(p) {
  const errs = [];
  if (!p || typeof p !== 'object') return ['not an object'];
  if (!Array.isArray(p.blocks)) { errs.push('blocks must be an array'); }
  else {
    p.blocks.forEach((b, i) => {
      if (!b || !BLOCK_TYPES.includes(b.type)) errs.push('block ' + i + ': bad type ' + JSON.stringify(b && b.type));
      if (b && b.type === 'section_heading' && !/^\d{2}$/.test(String(b.n || ''))) errs.push('block ' + i + ': section_heading n must be a zero-padded string');
    });
  }
  if (p.sections && !Array.isArray(p.sections)) errs.push('sections must be an array');
  (p.tldr_presentation && Array.isArray(p.tldr_presentation.slides) ? p.tldr_presentation.slides : []).forEach((s, i) => {
    if (s.visual && !VISUALS.includes(s.visual)) errs.push('slide ' + i + ': unknown visual ' + JSON.stringify(s.visual));
  });
  return errs;
}
