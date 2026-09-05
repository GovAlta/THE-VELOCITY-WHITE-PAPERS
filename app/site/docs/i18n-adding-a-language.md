# Internationalization (i18n): supporting many languages

**Goal.** Grow the Velocity White Papers from bilingual (EN/FR) to any number of
languages — Spanish now, then right-to-left languages like Arabic, then CJK
languages like Chinese — while keeping "add a language" a **data operation**, not
a code change.

This document is the authoritative guide. It records the architecture, the exact
steps to add a language, the phased content plan, and the remaining code
generalization work with a concrete inventory.

---

## 1. Architecture (how locales work)

**Single source of truth.** `data/site.json` declares every supported language:

```jsonc
"default_locale": "en",
"locales": [
  { "code": "en", "label": "EN", "name": "English",  "dir": "ltr", "lang_code": "en-CA", "og_locale": "en_CA" },
  { "code": "fr", "label": "FR", "name": "Français", "dir": "ltr", "lang_code": "fr-CA", "og_locale": "fr_CA" },
  { "code": "es", "label": "ES", "name": "Español",  "dir": "ltr", "lang_code": "es",    "og_locale": "es_ES" }
]
```

- `code` — the locale key used in filenames (`<id>.<code>.json`), asset dirs, URLs.
- `name` — the **autonym** (the language's name in its own language); shown in the switcher and spoken in a11y announcements. Scales O(N).
- `dir` — `ltr` or `rtl`. Applied to `<html dir>` at runtime; the hook for Arabic/Hebrew.
- `lang_code` / `og_locale` — BCP-47 and OpenGraph codes for SEO metadata.

**Runtime fallback (the keystone).** `app.js` → `applyLocale()` deep-merges the
active locale's `i18n` bag **over the default locale's** (`mergeI18n`). Any string
a locale hasn't translated yet falls back to the default rather than rendering
blank. This is what lets a language **ship partially and grow** safely.

- Per-locale content files (`data/papers/<id>.<code>.json`, `data/pages/<name>.<code>.json`)
  are loaded through a fallback chain (`loadPaper` / `loadPageData`): requested
  locale → default locale → legacy. A paper with no `es` file simply renders in
  English until its `es` file exists.
- `paper.i18n[locale]` (titles/subtitles/abstracts on cards and the index) is
  already locale-generic and populated by `scripts/lib/index-build.mjs`, which
  iterates **all** declared locales.

**Build pipeline anchor.** `scripts/lib/locales.mjs` reads `site.json` and exports
`localeCodes()`, `defaultLocale()`, `otherLocales()`, `localeMeta()`, `localeDir()`,
`sequenceTemplate()`. Build scripts import this instead of hardcoding `['en','fr']`.

**Validation.** `scripts/evals/check-locale-completeness.mjs` (auto-run by
`npm run eval`) hard-fails on structural problems (default locale missing, a locale
entry missing `code/label/name/dir`, a `tier_labels`/`status_labels` gap) and
prints per-locale UI coverage as advisory. `--strict` makes any gap fail (use when
a language is declared complete).

---

## 2. To add a locale `<X>`, produce:

**Config (small, unlocks the shell immediately)**
1. Add an entry to `site.json` `locales` (code/label/name/dir/lang_code/og_locale).
2. Add `sequence_format.<X>` (e.g. Spanish `"{i} de {N}"`).
3. Add `i18n.<X>` — translate the UI bag (nav, `ui.*` incl. `tier_labels`,
   `status_labels`, `tag_labels`, `translation_*`, hero, footer, stats,
   `section_titles`, `about_body`, `print_edition`). Missing keys fall back to
   default, so this can grow incrementally; run the completeness eval to track %.

**Content (the bulk — the phased transformation)**
4. `data/pages/<name>.<X>.json` × 6 pages (about, community, press, privacy, resources, updates).
5. `data/papers/<id>.<X>.json` × 21 papers — translate `title/subtitle/abstract/track`,
   `sections[].title`, `tldr_presentation` (title + `slides[]` text/captions/labels),
   and every text-bearing `blocks[]` field. Keep `id/num/tier/status/tags/sections[].n/slide ids`.
   Point `audio.src` and image `src` paths at `/<X>/`. Set `translation_status`.

**Simulations** (the 7 narrated sims in `data/sims/`)
6. Sim text is **inline** in the sim JSON as `{ "en": …, "fr": … }` locale-maps
   (title/blurb/chapter narration/captions/actor & step labels), resolved by
   `S.t(v, loc)` in `components/visuals/bespoke/sim/_common.js` (falls back to
   `v.en`). Add an `<X>` key to each localizable map.
7. Sim audio is per-chapter and locale-pathed:
   `public/audio/<X>/sims/<sim-id>/<chapter-id>.mp3`. Generate the `<X>` narration
   (the sim is the animation clock-master, so audio drives timing).
8. The sim/canvas components read the locale via a `loc()` helper that is currently
   hardcoded `=== 'fr' ? 'fr' : 'en'` (in `Player.js`, `Foundry.js`, `Iso.js`,
   `Lumen.js`, `Manifold.js`, `Tapestry.js`, `canvas/Scene.js`, `canvas/Tour.js`,
   and the two `_common.js` locale() helpers). Generalize these to the active
   locale **gated to the sim's available locales** (fall back to default when the
   sim has no `<X>` text/audio), so a sim only switches to `<X>` once its text +
   audio exist — never a silent or half-translated sim.

**Media**
9. Images: `public/images/<id>/<X>/…` — regenerate figures/hero conditioned on the
   English source composition, translating only the text labels in the prompt
   (`npm run generate:images -- <id> --locale <X>`).
10. Audio: `public/audio/<X>/<id>.mp3` + `<id>-tldr/NN.mp3` + page narration
    (`npm run generate:audio -- <id> --locale <X>`), then `npm run measure:audio`.

**Docs / conventions**
11. `docs/<X>-style-guide.md` + `data/<X>-lexicon.json` (mirror the FR pair): register,
    typography, tone, binding term map. Load the lexicon into the translation prompt.

---

## 3. Phased rollout

> **Spanish (`es`) status — shipped 2026-07-07.** Full parity with EN/FR: all UI,
> 22 papers, 6 pages, 7 simulations (text + audio), 108 figures, 199 audio files.
> Phases 0, 1 (measure-audio, generate-images/audio), 2, and 4 are done for `es`.
> **Remaining (cosmetic / SEO, tracked here):** the 8 sim-visual `L()` control-bar
> maps (Play/Pause/Captions/Expand) still fall back to English for non-EN/FR (Phase 3
> §2); and `prerender.mjs` / `build-sitemap.mjs` / `build-gallery.mjs` still emit
> EN+FR only (Phase 1) — `es` is served by the SPA fallback and is fully usable, but
> has no prerendered SEO shells or sitemap alternates yet.


### Phase 0 — Foundation (DONE)
Locale-generic runtime + inventory + Spanish registered with a full UI bag.
- `scripts/lib/locales.mjs` (new anchor).
- `site.json`: locale metadata (`name`/`dir`/`lang_code`/`og_locale`), `es`
  registered, `sequence_format.es`, complete `i18n.es` bag (94 UI strings, 84 tag labels).
- `app.js`: `mergeI18n` default-locale fallback; `applyLocale` sets `<html dir>`
  for RTL and uses autonyms + a localized a11y announce; stale/unknown locale normalizes to default.
- `scripts/lib/index-build.mjs`: iterates all locales for numbering, sequence, and
  the per-locale `i18n` inventory block (was hardcoded EN↔FR).
- `scripts/evals/check-locale-completeness.mjs` (new test).
- **Result:** toggling to ES renders the whole shell in Spanish (nav, home,
  paper chrome, tags); paper bodies fall back to English until `es` files exist.

### Phase 1 — Finish generalizing the build/tooling (mechanical)
Swap hardcoded `['en','fr']` / `other = loc==='en'?'fr':'en'` for `locales.mjs`
helpers. Behavior-identical for EN/FR; enables `es` (and beyond) to build/deploy.
Priority order:
1. `scripts/prerender.mjs` — per-locale route shells + hreflang (currently 2 hardcoded loops, depth `fr?3:2`, hardcoded hreflang/route labels).
2. `scripts/build-sitemap.mjs` — per-locale URLs + hreflang alternates.
3. `scripts/measure-audio.mjs` — measure/stamp durations for all locales.
4. `scripts/build-gallery.mjs` — replace `_fr` suffix fields with a locale-keyed `i18n` object; read all locales.
5. `scripts/generate-images.mjs` / `gen-image.mjs` — default to declared locales; condition non-primary on the primary render; ensure `data/image-style.json` has per-locale style prompts.
6. `components/EditMode.js` / `EditPanels.js` / `edit-server.mjs` — dev editor: locale-select from `site.locales`, generate stubs for all locales, drop the FR↔EN swap assumption.
7. `scripts/evals/check-bilingual-parity.mjs`, `check-audio-coverage.mjs`, `fr-review/*` — parameterize by locale (or clone per language).

### Phase 2 — Migrate runtime UI strings into the i18n bag
~60 inline `store.locale === 'fr' ? '…' : '…'` ternaries hardcode French/English
in components (they currently fall back to English for `es`). Move each to a
`store.t.ui.*` key (add the key to every locale bag). Inventory (file — count):
`AppNav.js` (7, switcher aria), `RelatedPapers.js` (8, pager), `PaperDetail.js`
(7, "Updated"/"What changed"/TOC/banner/`primary_locale` dropdown → iterate locales),
`IndexTable.js` (5, download/table), `KeyboardShortcuts.js` (14, move shortcut list
into `ui.shortcuts`), `PaperPage.js` (3), `PaperDownloads.js` (1),
`components/_lib/meta.js` (6, drive `og_locale`/`lang_code`/hreflang from `site.locales`),
`components/_lib/export.js` (`EXPORT_I18N` → add locales / read from `site.json`).
The paper `translation_status` banner should check "current locale ≠ paper primary_locale"
rather than `=== 'fr'`.

### Phase 3 — Bespoke visuals & simulations
Two things here:
1. **Sim/canvas `loc()` helpers** — the 10 hardcoded `=== 'fr' ? 'fr' : 'en'`
   helpers (`sim/Player.js`, `Foundry.js`, `Iso.js`, `Lumen.js`, `Manifold.js`,
   `Tapestry.js`, `canvas/Scene.js`, `canvas/Tour.js`, `canvas/_common.js`,
   `of1cj/_common.js`) must return the active locale **gated to the sim's available
   locales** (fall back to default otherwise). Sim text already resolves through
   `S.t(v, loc)` (falls back to `v.en`) and sim audio is locale-pathed
   (`public/audio/<loc>/sims/<id>/<chapter>.mp3`), so once a sim has `<X>` text +
   audio it switches cleanly; until then it stays in the default locale (never
   silent/half-translated).
2. **Foundry** embeds 100+ inline label ternaries and bilingual data tables;
   extract these to per-visual locale data (e.g. `data/sims/foundry-locales.json`)
   with a `tx(key)` lookup.

### Phase 4 — Spanish content (the transformation)
Per §2 steps 4–8, in this order so value lands early and review is tractable:
1. Page chrome + `i18n.es` polish (mostly done) → the shell is fully Spanish.
2. Tags/labels (done) + TL;DR slides for the 3 on-ramp papers → localized previews.
3. Paper bodies, paper-by-paper, `translation_status: draft` → human review → `final`.
4. Simulations: add `<X>` to each sim JSON's inline text maps, then flip the sim's
   available-locales gate (Phase 3).
5. Images regenerated per paper (text labels only; composition matches EN).
6. Audio — paper long-form + TL;DR, the 7 sims' per-chapter narration, and the 6
   page narrations — then `measure:audio`.
Estimated footprint per locale: ~700 MB–1 GB (images + audio) + ~20 MB JSON/docs.

### Phase 5 — RTL & CJK (extensibility, when Arabic/Chinese are added)
- **Arabic (RTL):** set `"dir": "rtl"` on the locale (already applied to `<html dir>`).
  Add an `html[dir="rtl"]` CSS layer (mirror flex/grid, padding/margins via logical
  properties, flip the audio scrubber and prev/next, right-align text). Use an
  Arabic-capable TTS voice and Arabic figure labels. Arabic lexicon + style guide.
- **Chinese (CJK):** add a CJK font stack, adjust line-height and `word-break`,
  Mandarin TTS voice, Chinese figure labels + lexicon.
- Everything else (config, fallback, per-locale files, build pipeline, switcher)
  is already language-count-agnostic.

---

## 3b. Permanent language links (deep-linking)

A locale can be carried in the URL so a link opens (and persists) in that language:

- **Leading prefix (canonical, shareable):** `/es/`, `/es/paper/<id>`, `/fr/glossary`, `/en/about`.
- **Trailing suffix (crawler hreflang form):** `/paper/<id>/fr`, `/about/fr`.

`app.js` `parsePath()` detects either, strips it to resolve the route, and
`applyLocaleHint()` switches the language and persists it (localStorage **and** a
`vw_locale` cookie). An unknown code (e.g. `/xx/`) falls back to the default
locale. On GitHub Pages a `/es/…` path with no prerendered shell is caught by
`404.html` → `/?redirect=/es/…` → the boot script restores the clean URL → the
router applies the locale. (Prerendering `/<locale>/` landing shells for SEO is
the deferred Phase-1 item; the runtime deep-link works today via the fallback.)

## 4. Conventions

- **Filenames/paths use the locale `code`** everywhere: `<id>.<code>.json`,
  `public/images/<id>/<code>/…`, `public/audio/<code>/…`.
- **Grouping keys stay English in data** (`tier`, `track`, `tags`); only their
  **display** is localized (via `ui.tier_labels` / `ui.tag_labels`). This keeps
  search and cross-locale joins stable.
- **Quotes in press/news content are reproduced verbatim** in the original
  language, never machine-translated (see `data/pages/press.*`).
- **Never hard-overwrite reviewed translations**; detect per-block drift and
  re-translate only changed blocks (see `.claude/skills/translate-paper.md`).
- Run `npm run eval` (includes locale completeness) before publishing.

---

## 5. Cost & tokens

Budgeting and tracking for transforming the whole corpus into one more language
lives in [`i18n-cost-ledger.md`](./i18n-cost-ledger.md), grounded by
`scripts/i18n-corpus-metrics.mjs` (which counts papers, pages, and the 7 sims).
Headline (source = EN, 2026-07-07): **~125K translatable tokens** (~83K words),
**~350K narration chars** for TTS, **238 images** per language. Text translation is
cheap (single-to-low-double-digit dollars/language); media dominates. Record actuals
in the ledger as each language ships.
