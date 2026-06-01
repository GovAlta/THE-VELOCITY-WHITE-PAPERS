# 03 — Fidelity and sourcing

Universal rules for turning an author's raw material into a paper without losing it. They apply to every paper and every author, not to any one person. Read alongside `00` (style), `source-hierarchy` (tiers), and `voice-exemplar.md` (voice).

Where this file and a stylistic rule pull apart on whether to keep the author's content, **this file wins**: completeness and sourcing come before polish.

These rules exist because three failures keep recurring. The author's text gets minimized. The sources the author cited get under-used or left as placeholders. Rich material gets compressed into something skinny. Each rule below closes one of those.

## 1. Completeness: weave everything in scope

- Every claim, statistic, incident, example, and named thing the author supplies for this paper goes into this paper, unless it belongs to a different paper in the collection (see section 4).
- The author's notes are seeds, not a ceiling. The drafted section is normally **longer** than the raw notes, because the work is expanding compressed points into full prose and weaving sourced detail around them. If the draft is shorter than the input, it was compressed, not written.
- Do not drop a point because it is hard to place, sounds redundant, or the piece is running long. Place it.
- A list the author gives in full gets used in full. If the author names four incidents, the paper covers four, not two.
- When the author enumerates categories, fields, or a taxonomy (for example, the dimensions a tool measures or the fields it records), keep the enumeration and name every item. Collapsing a named list of fifteen things into a sentence that gestures at "a range of dimensions" is the granularity loss this rule exists to prevent. A table that lists each category beats a paragraph that summarizes them.
- Keep the enumeration, but keep it in a table or a bulleted list. Do not satisfy this rule by cramming the named items into one prose sentence as a wall of commas. That is just as unreadable as dropping them, and it breaks the clarity rules in `00`. Completeness and readability are both required: the list goes in a table, and the prose around it stays short and plain.

## 2. Sourcing: read and cite every source the author names

- If the author links a URL, names a document, or points at code, **read it**. Use the tools: `scripts/extract-pdf.mjs` for PDFs (Claude on Vertex, up to 100 pages; chunk longer ones by section), WebFetch for web pages, Read for files and code. Do not guess what a source says, and do not leave a source the author provided as a placeholder.
- Pull the **specific** figures and facts, not a gesture at them. "The report shows a rising trend" is a failure. "189 million per day, up from 126.3 million the year before" is the job.
- Every source the author cites appears in the paper, inline where it supports a claim and gathered in a Sources line. Preserve the author's links exactly.
- If a source genuinely cannot be read (no access, no tooling), say so loudly in the handoff and leave a visible `[[TK — <source>: <what is needed>]]` marker. A flagged gap is acceptable; a silent omission is not.
- A figure that cannot be traced to a provided source, the code, or the author's prose does not ship (see the provenance test in `source-hierarchy`).

## 3. Voice and length do not compete with completeness

- `00` is a filter on the connective prose you generate, never a reason to shorten or flatten what the author wrote (see `voice-exemplar.md`). Applying `00` changes word choice and removes flourishes. It does not reduce coverage.
- "Tight" means no wasted words. It does not mean fewer facts, fewer incidents, or shorter analogies. Keep enumerations and built-out analogies whole.

## 4. The only licence to omit: cross-paper scope

- A collection splits one large story across many papers. Detail that belongs to another paper is **deferred to that paper, with a forward link**, not dropped.
- This is the one place compression is correct: route the deep treatment to the paper that owns it. Everywhere else, within the scope the author assigned to this paper, omit nothing.
- Deferral is explicit and visible. Name where it went and link it ("the Red and Blue agents are covered in Paper 7"). A silent cut is never deferral.

## 5. The coverage check — produce it every time

Before handing back a draft, list every distinct point the author supplied: each claim, each statistic, each named incident, each source. Mark each one as:

- **woven in** (with the section it landed in), or
- **deferred** to another paper (named and linked), or
- **flagged** as a `[[TK]]` gap (with the reason).

If a point is none of these, it was dropped. Put it back. Include this check in the handoff so the author can confirm nothing was lost. This is the single most reliable guard against minimizing the author's material.

## 6. Large and technical sources

- A long or deeply technical source is read **in full, in sections**, not sampled. For a big PDF, run `extract-pdf` with a focused question per section. For a codebase, read the real files and use the real identifiers (Tier 2 in `source-hierarchy`).
- Technical depth is content, not decoration. Preserve the real mechanism, the real data flow, the real numbers, the real component names. A technical paper that is vaguer than the code it describes has failed.
- Sensitive material (anything marked internal or sensitive) informs framing, but its redacted specifics do not ship. Pull only what is public-safe, and state in the handoff what was held back and why.

## The one line

Expand, do not compress. Read every source the author cites and use its real numbers. Defer across papers in the open, and drop nothing in silence.
