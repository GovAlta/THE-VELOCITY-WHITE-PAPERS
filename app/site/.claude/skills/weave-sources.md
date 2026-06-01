# Skill: weave-sources

Take the three kinds of raw material the author hands over, his prose, provided code, and transcripts, and weave them into the technical sections of a paper. This is the skill to use when the input is mixed and the sources have to be ranked, not treated as equal.

It is a specialization of `draft-paper`: same no-invention discipline, same voice, but with an explicit source hierarchy on top. The hierarchy lives in `../../style-guide/source-hierarchy.md` and that file is the authority. This skill is the entry point that applies it.

## Read first, in this order

1. `../../style-guide/03-fidelity-and-sourcing.md` — completeness and citation rules. Weave everything in scope, read and cite every source, defer across papers in the open, drop nothing in silence. This is the file that prevents the skinny, under-sourced draft.
2. `../../style-guide/source-hierarchy.md` — the tier rules. The whole skill depends on them.
3. `../../style-guide/voice-exemplar.md` — preserving the author's voice; the voice everything is written into, including transcript material converted from speaking voice.
4. `draft-paper.md` — the JSON mechanics (blocks, gaps, status, assets-come-later).

## Inputs you need from the user

- `id` — the paper.
- `prose` — the author's written prose (Tier 1). The spine. Pasted or a file path.
- `sources` — code paths, document/PDF paths, and URLs the author provides or links (Tier 2). The technical and factual ground truth. Every one gets read.
- `transcripts` — paths to transcript files (Tier 3). Suspect.
- `sections` — which sections to draft or integrate.
- `verbatim_overrides` — optional. Any passage the author wants quoted verbatim from a transcript, or any place the prose should stand even if the code differs. An explicit override beats the default hierarchy.

If a source is not named, ask. Do not go hunting. But every source that **is** named or linked must be read and used; leaving a provided source unread or placeholdered is a failure (see `03-fidelity-and-sourcing.md`).

## Steps

1. **Sort every input into its tier** (per `source-hierarchy.md`). Produce a short source map: which file is Tier 1, 2, or 3, and what each one is good for. Note any source marked sensitive (e.g. `sensitive-facts.md`) and hold its numbers for author clearance.

2. **Lay the spine (Tier 1).** Place the author's prose first. His structure leads; the technical material fills it in. Preserve his words, mark the verbatim passages `author_verbatim`. Do not paraphrase him.

3. **Establish ground truth (Tier 2). Read every provided and linked source.** Read the code for real component names, data flows, defaults, and behavior, using the code's actual identifiers. Read every document, report, and URL the author cites: PDFs with `scripts/extract-pdf.mjs` (chunk long ones by section), web pages with WebFetch, files with Read. Pull the specific figures, not a gesture at them, and keep the author's citation link for each. A long or deeply technical source is read in full, in sections, never sampled.

4. **Mine the transcripts (Tier 3).** Untangle the speakers, attribute carefully, and extract the information, the anecdotes, and the story. Convert the author's speaking voice into the written voice from `voice-exemplar.md`. Keep the anecdote; rewrite the wording. Do not quote verbatim unless the author specified it.

5. **Weave.** Build the technical sections by integrating the three tiers around the spine: framing and concepts from the prose, technical fact from the code, narrative and anecdote from the transcripts (rewritten and corroborated). The result reads as one paper in the author's voice, not three sources stapled together.

6. **Run the provenance test on every technical sentence** (from `source-hierarchy.md`):
   - prose or code → keep.
   - transcript corroborated by prose or code → keep, in the author's voice.
   - transcript only, uncorroborated → flag, do not assert:
     `[CHECK — transcript only: <claim>. Corroborate against code/prose or confirm with author.]`
   - prose vs code conflict on a technical fact → use the code's fact, keep the author's framing, and flag the discrepancy for him.
   - none of the above → invented. Delete it.

7. **Run the coverage check** (`03-fidelity-and-sourcing.md`, section 5). List every distinct point the author supplied — each claim, statistic, named incident, and source — and mark each as woven in (name the section), deferred to another paper (named and linked), or flagged `[[TK]]` (with the reason). Anything that is none of these was dropped; put it back. Include this list in the handoff so the author can confirm nothing was lost.

8. **Hand off to `refine-paper`** for the editorial pass once the weave is in place.

9. **Do not generate assets** (audio, images) and do not flip `_meta.placeholder`. Same as `draft-paper`: weaving writes JSON only.

10. Run `npm run eval`.

## Do not

- Treat the three sources as equal weight. Rank them.
- Minimize the author's content. Weave every point in scope; the draft is normally longer than the notes, not shorter.
- Leave a source the author named or linked unread or as a placeholder. Read it (extract-pdf / WebFetch / Read) and cite it with the author's link.
- Compress within the assigned scope. Compression is only correct across papers: defer deep detail to the paper that owns it, in the open and with a link.
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
