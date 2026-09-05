# CMS authoring plan — bilingual whitepaper platform

Working plan for the authoring upgrades. Designed by an 8-agent workflow (mapped the real code, designed four dimensions, synthesized, then stress-tested against the core use cases). The full critique is summarized at the end.

## The decision that shapes everything: hard overwrite, not soft merge

Cross-language content uses **hard overwrite-and-translate**, not bidirectional soft merge.

- A paper has a `primary_locale` (`en` or `fr`) — the canonical locale that owns the **structure**.
- "Translate & build &lt;target&gt;" **clones the primary's structure** into the target, **translates all text**, and **regenerates all target assets** (images conditioned on the primary's source PNG; audio via ElevenLabs). The target is a structural clone, then translated; it is overwritten, never merged.
- A cheap **staleness flag** (a hash of the primary's structure + text, stamped on the target as `source_signature`) shows when a target is behind the canonical. No merge logic.

**Why hard, not soft:** the workflow's critic proved the soft path's central mechanism wrong on our own wp-08 — EN has 87 blocks/12 sections, FR has 56/10 with a French-only figure, and positional/`sid` alignment cannot reconcile a 31-block divergence without a manual drag-to-link UI. Every critical bug lived in reconciling divergent structures. Hard overwrite makes the target a clone of the source, so **there is no divergence to reconcile** — slots align 1:1, no `sid` join is needed, no positional mis-pairing. Soft merge is deferred indefinitely.

One-time consequence: the current *reviewed* wp-08 FR will be replaced by a fresh machine translation when first re-ported. Back it up before doing so.

## Decisions locked

- **Build order:** (1) numbering, (2) hard translate, (3) draft-to-JSON.
- **Sequence denominator:** count **only Published** papers. The 9 published papers read "i of 9"; non-published linear papers show no "of N" (status carries the signal). `num` stays the stable position in the linear order.
- **Non-linear entries** (`wp-companion-workforce` = "P", `arch-adhd-harness` = "A-01") live in a separate non-linear list with `_meta.num_override` / `_meta.sequence_override`; excluded from the linear numbering and the Published denominator.
- **`primary_locale` is per-paper** (defaults to `en` when absent — zero migration for the 18 existing papers).

## Phase 1 — Numbering as derived + generated index

- `data/order.json` = `{ "order": [linear ids in reading order], "nonlinear": [companion + architecture ids] }`. Position in `order` is the only manual ordering input.
- `num` and `sequence` become **derived**: `scripts/lib/index-build.mjs` `buildIndex(order, readPaper)` computes `num` (zero-padded position for linear; `_meta.num_override` for non-linear) and `sequence` (Published-only denominator; `_meta.sequence_override` for non-linear), and stamps them into both locale files.
- **`data/papers.json` becomes a generated artifact** — the sole output of `buildIndex`, read from each paper's **primary** locale file. `related` moves into the per-paper primary file so the index is fully regenerable. `categories` preserved as a passthrough.
- Endpoint `POST /api/build-index`; `npm run build:index`; one-time `npm run migrate:index` (creates `order.json`, lifts `related`, sets overrides, diffs the regenerated `papers.json` against the committed one before writing).
- Editor: `createPaper` appends to `order.json` (drops the manual `num`); `movePaper`/`deletePaper` edit `order.json` then rebuild; `PaperDetail` shows `num`/`sequence` read-only; `IndexTable` drops the No. input; `save()` stops doing its seven-key inventory resync (the index is generated instead).
- Eval `check-index-consistency.mjs`: `buildIndex(order)` must deep-equal the committed `papers.json`.

## Phase 2 — Hard translate + asset regeneration

- `primary_locale` on both files; `source_signature` staleness flag; a **TranslatePanel** with a "Translate &amp; build &lt;target&gt;" action (confirm: overwrites the target).
- `translateItems()` in `lib/llm.mjs` (Claude-on-Vertex, same `[{key},{key,revised}]` envelope as `reviseItems`) over all text + image prompts/alt/captions + translatable metadata, with the Canadian-French glossary.
- Clone structure → translate → regenerate target **images** (`/api/generate-image` generalized with `conditionFrom` = primary locale) and **audio**. Set `translation_status: draft`, record `_meta.translated_from`.
- Eval: FAIL when a non-primary file ships placeholder/forthcoming text.

## Phase 3 — Draft → JSON from Markdown

- `lib/paper-schema.mjs` (`PAPER_SCHEMA_PROMPT`, `validatePaper`, shared `BLOCK_TYPES`/`VISUALS`).
- `draftPaper()` in `lib/llm.mjs`, **chunked** (metadata+sections, then blocks per section, then TL;DR) — a single 16k call truncates on a long paper. Results land as `__ai` proposals (accept/reject), status stays `Draft`, no assets.
- `DraftImport` panel (scratch or paste Markdown). New skill `draft-to-json.md`.
- `check-schema-sync.mjs`: schema block/visual sets must match `BlockRenderer.js` / `TldrEditor.js`.

## Deferred (not building)

Bidirectional soft sync, cross-locale `sid` alignment, drift reconciliation UI, smart-merge. Reason: the correspondence-matching across divergent structures is where the critical bugs live, for value the hard path already delivers.

## Critic's gaps that still apply to the hard path (must handle)

- **Sequence formats:** three live formats today ("i of N", "TBD"/P, "Architecture · A-01"). `num_override`/`sequence_override` are first-class for non-linear entries; the denominator counts only linear Published papers.
- **EN-first eval:** `check-bilingual-parity.mjs` hard-fails on the EN file and only warns on FR. Parameterize by `primary_locale` so an FR-primary paper is checked correctly.
- **Draft generation truncation:** chunk it; don't single-shot a long paper.
- **Asset orphaning:** deleting/reordering a figure renumbers positional slots; image files/sidecars can orphan. Warn on slot drift; clean up on delete. (Hard-translate is safe here because the target is a fresh clone.)
- **Index single-writer:** only `buildIndex` writes `papers.json`, reading the primary file — removes the FR-overwrites-inventory and index-drift risks at once.
