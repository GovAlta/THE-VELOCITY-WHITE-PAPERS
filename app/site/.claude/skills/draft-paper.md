# Skill: draft-paper

Scaffold a real paper body from raw source material. This is the skill that turns a stub created by `add-paper` into actual content. It is the counterpart to `add-paper`, which deliberately refuses to write a body.

This skill writes prose. The hard constraint is that **every claim it writes traces to a source line you can point to.** It never invents facts. When the source does not support a section, it leaves a marked gap for the author rather than filling it with plausible prose.

## Read these first, in this order

1. `../../style-guide/voice-exemplar.md` — the author's real voice. You are drafting *as* this author. Match the cadence shown there: long, flowing, comma-joined, first person plural, specifics woven in. Do not write in short-declarative trailer cadence.
   - Then read the two most polished published papers in full, `data/papers/cux4h.en.json` (The Two-Billion-Dollar Ship of Theseus) and `data/papers/mwo98.en.json` (The Cyber Imperative). They are the **register anchor**. The register is an institutional white paper: "we" / "Alberta" / "Technology and Innovation," almost never "I"; developed comma-joined sentences with the *occasional earned short declarative*; color from sustained metaphor and named concepts (the ship, the four-headed hydra, genius amnesiacs, poisoning the well) and from hard numbers, never from chatty asides. A rhetorical question is allowed only when answered.
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

## Transposing a transcript (read this when the source is spoken)

Several papers come from a recorded discussion: the author talking, sometimes with an AI voice agent that narrates a draft back and that the author refines live. When that is the source, the failure mode is **over-editing**, not under-sourcing. Watch for it:

- **The transcript is the source. Merge, do not re-synthesize.** When the author's statements and an AI agent's narration both appear in the transcript, your job is to merge those two into cohesive prose, keeping their actual wording. Do not paraphrase the whole thing into your own words. The author can tell the difference, and prefers the transcript.
- **Do not invent flourishes.** Earned short lines ("It does not survive contact with an AI"), trailer cadence, and rhetorical asides are seductive because they read well. If the author did not say it and the agent did not narrate it, do not add it. Color comes from the author's own metaphors and the real numbers, not from lines you compose.
- **Hold the register, do not drift to the spoken voice.** A transcript is chatty and first-person-singular; the paper is not. Strip "I", "Don't forget", "Here is the piece I like best", "Think about what that does", "a brilliant way to do it". Lift them to institutional "we"/"Alberta". This is the single most common correction the author makes; do it before he has to.
- **Clean only the banned constructions.** Spoken sources are full of "not X, but Y" ("it's not about the app, it's about engagement") and false starts. Reframe the banned constructions positively and drop the filler, and otherwise keep his sentences. Do not re-cadence true sentences that are already in his voice.
- **Keep the abstract to about three sentences** for a transposed paper unless the author asks otherwise. Long abstracts are a recurring complaint.

Before you generate any audio, run a **source-fidelity pass**: read each body paragraph against the transcript and confirm it is the author's words or the agent's narration, merged, and not something you composed. This is cheap to fix now and expensive after three audio regenerations.

## Do not

- Invent any fact, number, name, or causal claim the sources do not state. A confident sentence covering a gap is worse than an honest gap.
- Write in short cinematic cadence. Match the voice exemplar's flowing sentences.
- Add earned short lines, asides, or first-person-singular ("I will be honest", "Here is the piece I like best", "Don't forget") that are not in the source. The register is an institutional white paper, not a talk.
- Re-synthesize a transcript into your own words. Merge the author's statements with any AI narration in it, keeping their wording.
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
- **Source-fidelity pass (for transposed transcripts).** Read each body paragraph against the transcript and confirm it is the author's words or the agent's narration, merged, not prose you composed. Flag and rework any sentence that is yours, before audio.
- Read the abstract and one TL;DR narration aloud. If it sounds like a different person than the voice exemplar, or chattier and more first-person than `cux4h` / `mwo98`, it is wrong.
- Confirm `status` is still `Draft` and `_meta.placeholder` is still `true`.

Note on audio: pullquotes are **not** read in the long-form narration (they amplify the surrounding prose and would be redundant aloud). Write the body so it stands on its own without the pullquote; treat the pullquote as a visible callout only.
