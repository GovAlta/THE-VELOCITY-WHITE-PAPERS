# i18n cost & token ledger

Cost of transforming the **whole corpus into one additional language**. The
estimate is grounded in a live measurement of the translatable corpus; record
**actuals** in the table at the bottom as each language is produced, so future
languages can be budgeted from real numbers.

Refresh the measurement anytime (it reads the default-locale files):

```bash
node scripts/i18n-corpus-metrics.mjs          # human-readable
node scripts/i18n-corpus-metrics.mjs --json    # for tooling
```

## Measured corpus (source = `en`, as of 2026-07-07)

| Metric | Value | Billing relevance |
|---|---:|---|
| Papers | 22 | — |
| Pages | 6 | — |
| Simulations | 7 | — |
| Translatable text | 499,993 chars ≈ **124,998 tokens** (~83,000 words) | LLM translation |
| Narration script | 350,293 chars | TTS (audio) |
| Images (heroes + figures) | 238 | image generation |

(Includes the 7 narrated simulations in `data/sims/` — their inline `{en,fr}`
text + per-chapter narration and their audio under `public/audio/<loc>/sims/`.)

## Per-language estimate

**1. Text translation (LLM).** One draft pass:
- input ≈ **169,000 tokens** (source + ~35% overhead for the style guide, lexicon,
  and per-chunk instructions re-sent with each request),
- output ≈ **125,000 tokens** (a translation runs ~the same length as the source).

A realistic full cycle (draft → human/QA review → targeted re-translation of
flagged blocks) runs **~1.5–2×** the draft, so budget **~250K–340K input** and
**~190K–250K output** tokens per language.

Cost = tokens × your model's `$/token`. Illustrative only (confirm current rates):
at a Sonnet-class rate this is on the order of a few dollars per language; at an
Opus-class rate, low-tens of dollars. Text translation is the **cheapest** part.

**2. Images.** 238 generations per language (regenerated from the English
composition, translating only the text labels). Cost = 238 × your image API's
per-image rate. At ~$0.04–0.19/image that is ~**$10–45 per language**. This is
usually the largest hard-dollar line; heroes/figures without text labels can be
symlinked instead of regenerated to cut it.

**3. Audio (TTS).** ~350,000 narration characters per language (paper long-form +
TL;DR slide scripts + the 7 simulations' per-chapter narration + 6 page narrations).
Billed per character by the TTS provider (ElevenLabs), or drawn from a monthly
character quota. At ~$0.15–0.30 per 1,000 chars this is ~**$55–105 per language**
on metered pricing; often $0 marginal if within an existing subscription quota.

**Order of magnitude, one full language:** text ≈ single-to-low-double-digit
dollars, images ≈ $10–45, audio ≈ $0–95 → **roughly $60–150 all-in** on metered
rates, dominated by media, not text. Human review time is the real cost, not tokens.

> Rates above are assumptions for sizing only and will drift; the **token/char/image
> counts** are the durable figures. Always price against current rates.

## Actuals ledger

Fill one row per language per phase as work completes. Get token counts from the
API usage dashboard (or the workflow/agent usage totals); image/char counts from
the generation scripts' output.

| Date | Language | Phase | Model / tool | Input tok | Output tok | Images | TTS chars | Cost (actual) | Notes |
|---|---|---|---|---:|---:|---:|---:|---:|---|
| 2026-07-07 | es | Phase 0 — UI bag + ~40 ui keys (site.json) | Opus 4.8 (this session) | — | — | 0 | 0 | — | ~129 UI strings + 84 tag labels + shortcuts, authored inline; not separately metered |
| 2026-07-07 | es | Phase 4 — paper bodies (22) | Claude Sonnet (Vertex) | 216,798 | 192,906 | — | — | — | 1,482 strings, 56 calls |
| 2026-07-07 | es | Phase 4 — pages (6) | Claude Sonnet (Vertex) | 15,268 | 7,276 | — | — | — | 123 strings, 7 calls; press quotes kept verbatim |
| 2026-07-07 | es | Phase 4 — simulations (7) | Claude Sonnet (Vertex) | 45,694 | 26,005 | — | — | — | 524 strings, 17 calls |
| 2026-07-07 | es | **Phase 4 text subtotal** | Claude Sonnet (Vertex) | **277,760** | **226,187** | — | — | — | 80 calls, ~504K tokens total |
| 2026-07-07 | es | Phase 4 — deep gap-fill (charts/tables/visual_config) | Claude Sonnet (Vertex) | 201,906 | 112,729 | — | — | — | 1,934 fields the shallow collector missed; collectTranslatable rewritten to walk the full tree, 74 calls |
| 2026-07-07 | es | Phase 4 — images | OpenAI gpt-image-1 | — | — | 108 | — | — | figures + slide images, conditioned on EN (heroes not rendered/generated); 1 transient 502 retried |
| 2026-07-07 | es | Phase 4 — audio | ElevenLabs | — | — | — | ~360K | — | 199 files: 22 longform + 21 TL;DR sets + 7 sims (56) + About; ES total narration 5h48m |

| 2026-09-04 | es | Review merge — professional Spanish review (docx, L. Villarroel) applied to 21 papers + about/resources/repos; paper 22 sections 01–05 and slides 5–6 hand-translated | Claude Fable 5.1 (aligner + merge) · gpt-image-1 · ElevenLabs | — | — | 24 | ~350K | — | 443 reviewed fields applied; 22 ES figures that rendered English text regenerated (2 re-done); 21 long-form + m66qi segments + 2 slides + About narration; ES style pool added to image-style.json |

### Spanish edition — final actuals (2026-07-07)

Spanish reached parity with EN/FR (text + audio + images + sims) in one session:

- **Text (LLM):** 277,760 input + 226,187 output tokens = **~504K tokens**, Claude
  Sonnet on Vertex, 80 calls, across 22 papers + 6 pages + 7 sims (2,129 strings).
- **Images:** **108** figures/slide images (gpt-image-1, conditioned on the EN render).
- **Audio:** **199** MP3s (~360K narration chars, ElevenLabs) — ES total 5h48m.
- **UI bag:** ~129 UI strings + 84 tag labels + shortcuts, authored inline (not metered).

Cost ≈ text (single-to-low-double-digit $) + 108 images + ~360K TTS chars. The
durable per-language figures for budgeting the *next* language are unchanged from
the estimate above (~125K translatable tokens, ~350K narration chars, ~110 rendered
images once orphaned legacy files are excluded).
