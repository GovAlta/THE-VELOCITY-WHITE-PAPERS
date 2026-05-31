# Source Hierarchy — how to weave prose, code, and transcripts

The canonical rule for combining the three kinds of raw material the author hands over. `draft-paper`, `refine-paper`, and `weave-sources` all defer to this file. It is operational, not an essay: read it, apply it.

A paper is built from sources of three different kinds. They are not equal. Each has a different job and a different level of trust. Mixing them without ranking them is how a transcript's offhand remark ends up asserted as fact in a published paper.

## The three tiers

### Tier 1 — The author's prose (the spine, and the voice)

The author's written prose is the spine of the paper and the authority on **voice, narrative, framing, and concepts.** Everything else is woven around it, not over it.

- Integrate it preserving his words. Place it; do not paraphrase it. Clean only genuine defects (see `refine-paper`).
- Mark it `author_verbatim` so the style scanner leaves his deliberate choices alone.
- Where his prose sets the structure of an argument, the technical material fills it in; it does not rearrange it.

### Tier 2 — Provided code (the technical ground truth)

Code is the authority on **what the system actually does**: real component names, real data flows, real behavior, real defaults.

- For any technical claim, the code is the source of truth. If the author's prose describes a technical behavior and the code contradicts it, **the code wins on the fact** — and you flag the discrepancy for the author rather than silently overriding his sentence. His prose still wins on how the behavior is framed and named for the reader.
- Use the code's real identifiers when naming things. Do not invent plausible-sounding component names.
- A technical description that cannot be traced to the code (or to the author's prose) is a candidate, not a fact.

### Tier 3 — Transcripts (third-order, suspect)

Transcripts are valuable and untrustworthy at the same time. They carry the information, the anecdotes, and the story, often in the author's *speaking* voice. They are also jumbled, multi-speaker, and full of false starts. Treat them as a third-order source.

- **Never quote a transcript verbatim** in reader-visible prose unless the author specifically asks for that quote. The spoken register is not the written voice.
- **Untangle the speakers.** A transcript may have several people talking. Attribute carefully. Do not put one speaker's claim in the author's mouth.
- **Convert speaking voice to written prose.** Keep the substance and the anecdote; rewrite it into the cadence in `voice-exemplar.md`. The story is the asset, not the wording.
- **Corroborate before asserting.** A claim that appears only in a transcript, with no support in the author's prose or the code, is a candidate. Flag it for the author; do not state it as established fact. Anecdotes are the exception worth keeping even when uncorroborated, but mark them as anecdote ("the team found that…", "in one session…"), not as measured fact.
- Numbers from a transcript are the least reliable numbers in the building. A spoken "about a thousand" gets checked against the code or the author's prose before it earns a place.

## Conflict resolution, in one line each

- **Voice / narrative / concept conflict** → the author's prose wins.
- **Technical fact conflict** → the code wins; flag the discrepancy to the author.
- **A transcript disagrees with prose or code** → the transcript loses. It is a prompt to ask, not a fact to assert.
- **"Unless specified"** → the author can override any of the above for a specific passage ("quote this transcript line", "use the prose description even though the code differs"). An explicit instruction beats the default hierarchy.

## The provenance test (run it on every technical sentence)

For each technical sentence in the draft, name its source:

1. Author's prose → keep, preserve voice.
2. Code → fine; use real names; this is ground truth.
3. Transcript, corroborated by 1 or 2 → fine; written in the author's voice.
4. Transcript only, uncorroborated → **flag it**, do not assert it. Use a marker:
   `[CHECK — transcript only: <claim>. Corroborate against code/prose or confirm with author.]`
5. None of the above → it is invented. Delete it.

A sentence that cannot answer "where did this come from?" does not ship.

## What this protects against

- A multi-speaker transcript putting someone else's words in the author's voice.
- A spoken aside ("I think it's around 95 percent") hardening into a published statistic.
- The author's prose getting paraphrased away because a transcript said the same thing more loosely.
- A technical section describing a system that sounds right but does not match the code that runs.
