# Skill: draft-paper

Scaffold a real paper body from raw source material. This is the skill that turns a stub created by `add-paper` into actual content. It is the counterpart to `add-paper`, which deliberately refuses to write a body.

This skill writes prose. The hard constraint is that **every claim it writes traces to a source line you can point to.** It never invents facts. When the source does not support a section, it leaves a marked gap for the author rather than filling it with plausible prose.

## Read these first, in this order

1. `../../style-guide/voice-exemplar.md` — the author's real voice. You are drafting *as* this author. Match the cadence shown there: long, flowing, comma-joined, first person plural, specifics woven in. Do not write in short-declarative trailer cadence.
2. `../../style-guide/02-substance-and-structure-guide.md` — run Pass 1 (the claims audit) before writing any prose.
3. The `CLAUDE.md` style section — the negative filter for prose you generate (no em dashes, no banned vocabulary, no "not X but Y"). Apply it to what you write, never to phrasing the author has already supplied.
4. `../../style-guide/source-hierarchy.md` — if the sources are mixed (prose, code, transcripts), they are not equal weight. Rank them per this file, or use the `weave-sources` skill, which applies the hierarchy for you.

## Inputs you need from the user

- `id` — the paper to draft (the stub must already exist; if not, run `add-paper` first).
- `sources` — the explicit list of files this paper is drafted from. Examples: `video-transcripts/nexus.md`, `technical-reference/alberta-ai-initiative.md`, `technical-reference/sensitive-facts.md`. **You draft only from named sources.** If the user has not named sources, ask. Do not go hunting and stitch a paper from whatever you find.
- Any author-supplied draft prose (e.g. a pasted abstract or section). If the author gives you prose, that prose is the source of truth for those parts; you place it, you do not rewrite it. See `refine-paper` for how it then gets cleaned.

## Steps

1. **Claims audit (Pass 1 of guide `02`).** Before writing one sentence of prose, list every factual claim the paper will make and name the source line that supports each. Numbers, counts, dates, who-did-what, before-and-after figures. A claim with no source is a defect, not a detail to smooth over. Produce this list and keep it. If you cannot produce it, you do not understand the material well enough to draft yet.

2. **Check classification.** If a source is marked sensitive (e.g. `sensitive-facts.md` is "Sensitive — Internal Use Only"), do not lift its numbers into reader-visible strings without flagging each one for the author. The site is public and open source. A real internal number may not be publishable. List every sensitive figure you want to use and let the author clear it before it ships. Default to not publishing it.

3. **Draft the layers in order** (per `AUTHORING.md`): card sentence, then abstract (80–140 words), then the TL;DR slide narration, then the body. Each layer constrains the next.
   - **Abstract.** Name the problem and the answer in the author's voice. If the author supplied an abstract, use it; clean only typos via `refine-paper`.
   - **TL;DR slides.** Three to six slides. Narration `text` written to be heard (short complete sentences that open standalone, no parentheticals, numbers spoken). This is the most exposed surface; the narration must read as the author speaking, anchored to the exemplar's audio guidance.
   - **Body.** Six to ten sections. Each section opens by naming the specific friction it addresses, states the principle in plain language, anchors it in something concrete from the sources, gives a real example with real numbers, and points forward. Use the block types in `CLAUDE.md` (`section_heading`, `paragraph`, `dropcap_paragraph` once, `pullquote`, `keystat`, `figure`, `sidenote`).

4. **Where the source runs out, leave a gap, do not invent.** Insert a visible marker rather than fabricating:
   ```json
   { "type": "paragraph", "text": "[DRAFT GAP — needs source: <what fact or section is missing and which source would supply it>]" }
   ```
   A marked gap is honest and gets filled. Invented prose reads well and survives editing, which is exactly why it is dangerous.

5. **Keep the author's coined vocabulary.** skill files, harness, spec-driven development, AI smell, Hello World templates, red / blue / green / yellow team, and similar terms are the author's, defined inline. Do not strike them as jargon and do not paraphrase them into generic words.

   When you place prose the author supplied verbatim (a pasted abstract or section), mark it with `author_verbatim` (see the schema note in `CLAUDE.md`): `"author_verbatim": true` on the block, or `_meta.author_verbatim: ["abstract"]` for a top-level field. This keeps the style scanner from flagging his deliberate word choices. It does not freeze the prose; `refine-paper` can still fix a real error in it later.

6. **Set status honestly.** Leave `status: "Draft"` and `_meta.placeholder: true`. The body is not finished until `refine-paper` has run and a human has read it aloud. Drafting does not flip the placeholder.

7. **Do not generate assets yet.** No audio, no images. Those come after the EN body is refined and final. Drafting only writes JSON.

8. Run `npm run eval`. The EN side will report style-guide *warnings* — read them, but do not auto-apply them in a way that re-voices the author. The eval is advisory at the draft stage.

## Do not

- Invent any fact, number, name, or causal claim the sources do not state. A confident sentence covering a gap is worse than an honest gap.
- Write in short cinematic cadence. Match the voice exemplar's flowing sentences.
- Copy phrasing out of a style guide's "Forbidden" or "bad example" column. Those are landmines. See the poison-phrase list in `voice-exemplar.md`.
- Rewrite prose the author supplied. Place it as given; clean it later with `refine-paper`.
- Lift sensitive internal numbers into public strings without explicit author clearance.
- Generate audio or images, or flip `_meta.placeholder` to `false`.

## Validation

```bash
npm run eval
node -e "JSON.parse(require('fs').readFileSync('data/papers/<id>.en.json'))"
```

Then:
- Re-read the claims audit against the draft. Every factual sentence in the body must map to a source line. Any that does not is either a `[DRAFT GAP]` marker or a defect to fix.
- Read the abstract and one TL;DR narration aloud. If it sounds like a different person than the voice exemplar, it is wrong.
- Confirm `status` is still `Draft` and `_meta.placeholder` is still `true`.
