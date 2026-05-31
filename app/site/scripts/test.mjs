/* test.mjs — unit tests for the CMS library functions. Pure-function coverage
   for the parts the editor and CLI depend on: numbering, translation plumbing,
   the paper schema, and the id format. Run with `npm test`. */

import assert from 'node:assert';
import { computeIndex } from './lib/index-build.mjs';
import { collectTranslatable, retargetPaths, computeSignature } from './lib/translatable.mjs';
import { validatePaper, BLOCK_TYPES, VISUALS } from './lib/paper-schema.mjs';
import { normalizeForSpeech, injectSentencePauses, splitForSynthesis, stripMarkup } from './lib/tts.mjs';

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ok   ' + name); }
  catch (e) { fail++; console.error('  FAIL ' + name + ': ' + e.message); }
}

/* ---- index-build (numbering, generated inventory) ---- */
t('computeIndex builds an inventory with derived, zero-padded numbers', () => {
  const { inventory } = computeIndex();
  assert(Array.isArray(inventory.papers) && inventory.papers.length > 0, 'no papers');
  const linear = inventory.papers.find((p) => /^\d{2}$/.test(p.num));
  assert(linear, 'expected at least one zero-padded numbered paper');
});

/* ---- translatable (hard-translate plumbing) ---- */
t('retargetPaths swaps the locale in every asset path', () => {
  const p = {
    hero_image: { src: 'public/images/abc/en/hero.jpg' },
    audio: { src: 'public/audio/en/abc.mp3' },
    blocks: [{ type: 'figure', image: { src: 'public/images/abc/en/fig.jpg' } }],
    tldr_presentation: { locale: 'en', slides: [{ audio_file: 'public/audio/en/abc-tldr/01.mp3', image: { src: 'public/images/abc/en/slide.jpg' } }] },
  };
  retargetPaths(p, 'en', 'fr');
  assert(p.hero_image.src === 'public/images/abc/fr/hero.jpg');
  assert(p.audio.src === 'public/audio/fr/abc.mp3');
  assert(p.blocks[0].image.src.includes('/fr/'));
  assert(p.tldr_presentation.locale === 'fr');
  assert(p.tldr_presentation.slides[0].audio_file === 'public/audio/fr/abc-tldr/01.mp3');
});
t('computeSignature is stable for same content and changes with text', () => {
  const base = { title: 'X', blocks: [{ type: 'paragraph', text: 'hello' }], tldr_presentation: { slides: [] } };
  const same = { title: 'X', blocks: [{ type: 'paragraph', text: 'hello' }], tldr_presentation: { slides: [] } };
  const diff = { title: 'X', blocks: [{ type: 'paragraph', text: 'changed' }], tldr_presentation: { slides: [] } };
  assert(computeSignature(base) === computeSignature(same), 'should match');
  assert(computeSignature(base) !== computeSignature(diff), 'should differ');
});
t('collectTranslatable finds strings and applies translations back', () => {
  const p = { title: 'Hi', subtitle: '', abstract: 'A', blocks: [{ type: 'paragraph', text: 'B' }], tldr_presentation: { slides: [{ id: '01', text: 'C' }] } };
  const items = collectTranslatable(p);
  const keys = items.map((i) => i.key);
  assert(keys.includes('title') && keys.includes('abstract'), 'missing expected keys');
  assert(!keys.includes('subtitle'), 'empty fields should be skipped');
  items.find((i) => i.key === 'title').apply('Salut');
  assert(p.title === 'Salut', 'apply did not write back');
});

/* ---- paper-schema (draft validation) ---- */
t('validatePaper rejects unknown block types and accepts valid ones', () => {
  assert(validatePaper({ blocks: [{ type: 'nope' }] }).length > 0, 'should reject bad type');
  assert(validatePaper({ blocks: [{ type: 'paragraph', text: 'x' }], sections: [] }).length === 0, 'should accept good');
  assert(validatePaper({ blocks: [{ type: 'section_heading', n: '1', title: 'x' }] }).length > 0, 'should reject non-padded n');
  assert(BLOCK_TYPES.includes('paragraph') && VISUALS.includes('title'));
});

/* ---- id format (short opaque, stable) ---- */
t('short id format is a 5-char [a-z][a-z0-9]{4}', () => {
  const re = /^[a-z][a-z0-9]{4}$/;
  assert(re.test('p7p2k') && re.test('cux4h'), 'real ids should pass');
  assert(!re.test('wp-08') && !re.test('1abcd') && !re.test('toolong'), 'bad ids should fail');
});

/* ---- tts (markdown strip, speech normalization, pauses, paragraph split) ---- */
t('stripMarkup removes bold, italics, code, links, and tags', () => {
  assert.strictEqual(stripMarkup('the **four-headed hydra** of debt'), 'the four-headed hydra of debt');
  assert.strictEqual(stripMarkup('an *emphasis* word'), 'an emphasis word');
  assert.strictEqual(stripMarkup('run `npm run edit` now'), 'run npm run edit now');
  assert.strictEqual(stripMarkup('see [the index](#/index) here'), 'see the index here');
  assert.strictEqual(stripMarkup('plain <em>tagged</em> text'), 'plain tagged text');
});

t('normalizeForSpeech spells out %, $ magnitudes, ~ and +', () => {
  assert.strictEqual(normalizeForSpeech('rose by 78.2%'), 'rose by 78.2 percent');
  assert.strictEqual(normalizeForSpeech('a further ~33%'), 'a further approximately 33 percent');
  assert.strictEqual(normalizeForSpeech('$120 million a year'), '120 million dollars a year');
  assert.strictEqual(normalizeForSpeech('roughly $2B'), 'roughly 2 billion dollars');
  assert.strictEqual(normalizeForSpeech('$80M to $120M'), '80 million dollars to 120 million dollars');
  assert.strictEqual(normalizeForSpeech('$2,000 in tokens'), '2,000 dollars in tokens');
  assert.strictEqual(normalizeForSpeech('40+ years'), '40 plus years');
  // a decimal that is not a percent or currency is left alone
  assert.strictEqual(normalizeForSpeech('version 1.2 of the doc'), 'version 1.2 of the doc');
});
t('injectSentencePauses adds breaks only between sentences, not in decimals', () => {
  const out = injectSentencePauses('First sentence. Second one.', 0.4);
  assert(out.includes('<break time="0.4s" />'), 'should insert a break');
  assert.strictEqual(injectSentencePauses('It rose 78.2 percent today', 0.4), 'It rose 78.2 percent today');
  assert.strictEqual(injectSentencePauses('no pause here.', 0), 'no pause here.');
});
t('splitForSynthesis splits on paragraph boundaries', () => {
  const pieces = splitForSynthesis('Para one.\n\nPara two.\n\nPara three.');
  assert.strictEqual(pieces.length, 3, 'one piece per paragraph');
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
