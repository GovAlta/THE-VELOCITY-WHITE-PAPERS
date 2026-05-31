# Skill: weave-sources

Take the three kinds of raw material the author hands over, his prose, provided code, and transcripts, and weave them into the technical sections of a paper. This is the skill to use when the input is mixed and the sources have to be ranked, not treated as equal.

It is a specialization of `draft-paper`: same no-invention discipline, same voice, but with an explicit source hierarchy on top. The hierarchy lives in `../../style-guide/source-hierarchy.md` and that file is the authority. This skill is the entry point that applies it.

## Read first, in this order

1. `../../style-guide/source-hierarchy.md` — the tier rules. The whole skill depends on them.
2. `../../style-guide/voice-exemplar.md` — the voice everything is written into, including transcript material converted from speaking voice.
3. `draft-paper.md` — the JSON mechanics (blocks, gaps, status, assets-come-later).

## Inputs you need from the user

- `id` — the paper.
- `prose` — the author's written prose (Tier 1). The spine. Pasted or a file path.
- `code` — paths to the provided code (Tier 2). The technical ground truth.
- `transcripts` — paths to transcript files (Tier 3). Suspect.
- `sections` — which sections to draft or integrate.
- `verbatim_overrides` — optional. Any passage the author wants quoted verbatim from a transcript, or any place his prose should stand even if the code differs. An explicit override beats the default hierarchy.

If a source is not named, ask. Do not go hunting.

## Steps

1. **Sort every input into its tier** (per `source-hierarchy.md`). Produce a short source map: which file is Tier 1, 2, or 3, and what each one is good for. Note any source marked sensitive (e.g. `sensitive-facts.md`) and hold its numbers for author clearance.

2. **Lay the spine (Tier 1).** Place the author's prose first. His structure leads; the technical material fills it in. Preserve his words, mark the verbatim passages `author_verbatim`. Do not paraphrase him.

3. **Establish technical ground truth (Tier 2).** Read the code. Pull the real component names, the real data flows, the real defaults and behavior. These are what every technical sentence cites. Use the code's actual identifiers; do not invent plausible-sounding ones.

4. **Mine the transcripts (Tier 3).** Untangle the speakers, attribute carefully, and extract the information, the anecdotes, and the story. Convert the author's speaking voice into the written voice from `voice-exemplar.md`. Keep the anecdote; rewrite the wording. Do not quote verbatim unless the author specified it.

5. **Weave.** Build the technical sections by integrating the three tiers around the spine: framing and concepts from the prose, technical fact from the code, narrative and anecdote from the transcripts (rewritten and corroborated). The result reads as one paper in the author's voice, not three sources stapled together.

6. **Run the provenance test on every technical sentence** (from `source-hierarchy.md`):
   - prose or code → keep.
   - transcript corroborated by prose or code → keep, in the author's voice.
   - transcript only, uncorroborated → flag, do not assert:
     `[CHECK — transcript only: <claim>. Corroborate against code/prose or confirm with author.]`
   - prose vs code conflict on a technical fact → use the code's fact, keep the author's framing, and flag the discrepancy for him.
   - none of the above → invented. Delete it.

7. **Hand off to `refine-paper`** for the editorial pass once the weave is in place.

8. **Do not generate assets** (audio, images) and do not flip `_meta.placeholder`. Same as `draft-paper`: weaving writes JSON only.

9. Run `npm run eval`.

## Do not

- Treat the three sources as equal weight. Rank them.
- Quote a transcript verbatim in reader-visible prose unless the author specified it.
- Let a transcript override the code on a technical fact.
- Paraphrase the author's prose away because a transcript said something similar more loosely.
- Assert an uncorroborated transcript claim as established fact. Anecdotes are kept, but framed as anecdote.
- Harden a spoken number ("about a thousand", "roughly ninety-five percent") into a published statistic without checking it against code or prose.

## Validation

```bash
npm run eval
node -e "JSON.parse(require('fs').readFileSync('data/papers/<id>.en.json'))"
```

Then:
- Walk the provenance test once more. Every technical sentence answers "where did this come from?" or it is a `[CHECK …]` marker.
- Read a woven section aloud next to `voice-exemplar.md`. Transcript-derived passages must not read as spoken filler; they must read as the author's written voice.
- Confirm no transcript verbatim quote slipped in unless it was an explicit override.
