# Structure Review

A reflection on how this open-source whitepaper compendium is laid out, what's solid, and what's still fragile. Use this as the orienting document when reading the codebase for the first time, or before approving a structural change.

## Five operating principles

The whole codebase is shaped by five constraints:

1. **No backend.** Static files on GitHub Pages. Everything the browser needs is JSON, JPG, MP3, JS, CSS.
2. **Data-driven content.** The Vue components are templates. The papers live in JSON. Adding a paper does not touch a component.
3. **Fully bilingual.** Every reader-visible string exists in English and French. No string falls into a component when it should be in a JSON file.
4. **Script-generated assets.** Audio (MP3) and imagery (JPG via Sharp) are produced by Node scripts that read the JSON, call AI providers, and write to `public/`. The browser never calls AI.
5. **Agent-extensible.** Future Claude Code agents add papers, translate them, regenerate assets, and verify bilingual parity by following `.claude/skills/` and the evals.

If a change violates any of these, it is the wrong change. Choose a different change.

## Folder layout

```
app/site/
├── CLAUDE.md                  Codebase contract for future agents
├── STRUCTURE.md               This file
├── README.md                  Human-facing readme
├── index.html                 Single entry; loads Vue CDN + scripts
├── app.js                     Vue bootstrap, hash router, locale store
├── package.json
├── .gitignore
├── .claude/
│   └── skills/                Skill manifests for common operations
├── assets/                    Brand assets committed to repo
├── styles/                    Tokens + base + components + player + visuals
├── components/                Vue components
│   ├── visuals/
│   │   ├── _lib/              Shared animation utilities
│   │   ├── reusable/          Parameterized, register globally
│   │   └── bespoke/<id>/      One-off, paper-specific
│   └── …                      Layout, library, paper-detail, players
├── pages/                     One per top-level route
├── data/
│   ├── site.json              Site-wide config + i18n string bag
│   ├── papers.json            Inventory: id, num, tier, category, ...
│   ├── architecture.json      The 7-layer agent diagram data
│   ├── image-style.json       The shared style prompts
│   └── papers/                One <id>.<locale>.json per paper per locale
├── public/
│   ├── audio/<locale>/        Generated MP3 narration
│   └── images/<id>/<locale>/  Generated JPG + .meta.json sidecars
└── scripts/
    ├── lib/                   env.mjs, tts.mjs, images.mjs
    ├── generate-audio.mjs
    ├── generate-images.mjs
    ├── build-stubs.mjs        Generated the 32 paper stubs
    ├── migrate-*.mjs          One-shot data migrations
    └── evals/                 Sync checks (run via npm run eval)
```

## The classification system

Every entry in `data/papers.json` has a `category`:

- `paper` — numbered linear sequence (1..16 plus a companion). Lives at `#/library` and on the linear reading path.
- `architecture` — knowledge articles. Technical specs that sit outside the linear sequence and are read on demand. Lives at `#/architecture`. The Anti-Drift Harness lives here as `arch-adhd-harness`.

Visuals follow the same split:

- **Reusable** visuals (`components/visuals/reusable/`) are parameterized and work for any paper. Always loaded. Examples: `tile-heatmap`, `mini-chart`, `stat`, `list`, `quote`, `compare`, `title`, `image`. New reusable visuals register through `window.VWVisuals.registerReusable(key, componentName)`.
- **Bespoke** visuals (`components/visuals/bespoke/<owner-id>/`) are one-off, tied to a specific paper. Loaded lazily when that paper opens, declared in the paper JSON's `bespoke_scripts` array. Used as `slide.visual = "owner-id:visual-name"`.

The decision rule: would a *different* paper plausibly want this visual with different data? If yes, parameterize and put it in `reusable/`. If no, put it in `bespoke/<owner-id>/`.

## The bilingual contract

For every paper:

- `data/papers/<id>.en.json` and `data/papers/<id>.fr.json` exist and have the same shape.
- The `tldr_presentation.slides` arrays are the same length in EN and FR. Slide `id`s match.
- Every slide that has `audio_file` set in EN also has `audio_file` set in FR, pointing to `public/audio/<locale>/...`.
- The hero image and every figure block exist in both locales at `public/images/<id>/<locale>/<slot>.jpg` with a `.meta.json` sidecar.
- The FR image sidecar's `conditioned_on` points to the EN PNG it was generated from.

The eval `check-bilingual-parity.mjs` checks all of this. Run it before merging any content change.

## What's solid

- The store + hash router + locale switch. Stable, no bespoke routing logic.
- The data layer. JSON-driven, additive. Adding a paper is one JSON file in two locales.
- The visuals registry. Clear contract for reusable vs bespoke. The lazy-load pattern works.
- The asset pipeline. Idempotent. Per-locale paths. Metadata sidecars are inspectable in the UI through `ImageInspector`.
- The TL;DR presentation player. Single Audio element, scrubber, auto-advance, click-to-play stage, cross-dissolve image transitions, locale inheritance.

## What's still fragile

- **Long-form paper bodies.** Only `wp-01.en.json` has a real body. The other 16 EN papers and all 17 FR papers are placeholders. The next step is human authorship plus an `add-paper` skill to keep new entries consistent.
- **No build step.** Loading 25+ scripts via `<script>` tags is fine for a small library but will get awkward past about 40 components. Plan: a tiny optional bundler step (esbuild) when the file count starts to hurt. Don't add it before it hurts.
- **The Vue templates carry strings.** Most strings now read from `store.t.ui.*`, but a few hero h1 fragments and section labels still live in components. Search for `>{{ ` and `'</em>'` in `pages/` and move any reader-visible English into `site.json`.
- **No image-prompt versioning.** When a prompt changes, the next run overwrites the old JPG without diffing. Future improvement: a `prompts/<paper-id>/<slot>.history.jsonl` append-only log.
- **Audio is regenerated from scratch on prompt edit.** No diff. ElevenLabs is fast and cheap, so this is acceptable; flagged here for awareness.
- **The architecture page is one large diagram.** Once there are 5+ architecture articles, that page will need its own router section. Add when needed, not before.

## Open structural questions

These need decisions before they shape the code further:

- **Site URL prefix.** When deployed to GitHub Pages under a project page (e.g. `/velocity-whitepapers/`), all relative paths still work, but image-inspector links to `.meta.json` may need adjustment. Decide before first deploy.
- **Image inspector visibility for the public.** Right now anyone can click `i` and read the prompts. This is intentional for transparency. If a paper ever contains a prompt that names a vendor or contains sensitive procurement language, we need either redaction or a private/public flag in the sidecar.
- **Audio fallback behavior.** When a slide has `audio_file` declared but the MP3 is missing, the player currently shows an error. For partial drafts, consider silent skip-to-next instead.
- **French body translation strategy.** Are FR bodies translated by human, by AI with human review, or AI-direct? The current placeholder text says "translation forthcoming". The `translate-paper` skill must pick one and stick to it.
- **Compendium scope.** Is `arch-adhd-harness` the only knowledge article, or do we expect more (Nexus, Velocity Game Engine, etc. each becoming their own technical spec)? If yes, `category: architecture` is the right home. If no, fold it back into Paper 8.

## When in doubt

Read `CLAUDE.md`. It is the contract that future agents and reviewers should rely on. This document explains the structure; `CLAUDE.md` enforces it.
