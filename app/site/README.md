# The Velocity White Papers — Site

A static, bilingual, open-source whitepaper compendium. Vue 3 from CDN. No backend. Served from GitHub Pages.

> For the operating contract, read `CLAUDE.md`. For the layout and what's solid vs fragile, read `STRUCTURE.md`. This README is the human-facing entry point.

## Architecture in one paragraph

`index.html` loads Vue 3 from CDN. `app.js` boots the app: a small reactive store, a hash router (`#/`, `#/index`, `#/architecture`, `#/about`, `#/paper/<id>`), and locale state. Content lives in `data/`: `site.json` for site-wide configuration and i18n strings; `papers.json` for the inventory; `papers/<id>.<locale>.json` for the body of each paper in each locale. Vue components in `components/` render the data; pages in `pages/` compose components into top-level views. Reusable visual components live under `components/visuals/reusable/`; one-off paper-specific visuals live under `components/visuals/bespoke/<paper-id>/`. Audio (MP3) and imagery (JPG via Sharp) are produced by Node scripts in `scripts/`. The browser never calls AI.

## Local development

```bash
cd app/site
npm install                          # only required for asset-generation scripts
npm run dev                          # http://localhost:5173
```

The site works with any static server. `npm run dev` uses `http-server`.

## Generating audio and imagery

`.env` (in the parent `Whitepaper/` directory) supplies API keys:
- `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` — narration
- `OPENAI_API_KEY` + `OPENAI_IMAGE_MODEL` (default `gpt-image-1`) — imagery

```bash
npm run generate:audio                                # all papers, all locales
npm run generate:audio -- wp-01                       # one paper, both locales
npm run generate:audio -- wp-01 --locale en           # one paper, EN only
npm run generate:audio -- --tldr-only                 # skip long-form narration

npm run generate:images                               # all papers, EN first then FR-conditioned
npm run generate:images -- wp-01 --locale en          # EN only
npm run generate:images -- wp-01 --force              # regenerate
npm run generate:images -- wp-01 --no-condition       # FR from text only (no EN reference)
npm run generate:images -- --quality 78 --max-width 1600   # JPG tuning

npm run generate:all                                  # both
```

Pass `--force` on any of these to regenerate an existing cached output.

### Image style — the EPA pattern

Every image prompt is composed at runtime as:

```
<style_prompt>\n\nSubject: <image_prompt>\n\n<trailer>
```

The style and trailer live in **`data/image-style.json`** so editing the whole collection's visual language is a one-file change. The per-paper `image_prompt` lives in the paper JSON. Three style variants:

- `cover` — editorial hero illustration.
- `diagram` — architectural flowchart with crisp legible labels.
- `default` — generic; mostly for slide imagery.

A paper-specific override is allowed: set `style_prompt` on a hero_image or figure to bypass the shared style for that one image only. The composed prompt is recorded in the image's `.meta.json` sidecar so future editors see exactly what produced it.

### Bilingual workflow — EN first, FR follows

The site is bilingual but **English is polished first**. French is generated and reviewed downstream:

1. Author and polish the EN paper. Iterate. Run `generate:audio` and `generate:images` with `--locale en` until happy.
2. Then run `generate:images -- <id> --locale fr` (uses the EN PNG as a composition reference so the FR-labeled twin matches the EN layout).
3. Translate the FR JSON content (skill: `.claude/skills/translate-paper.md`).
4. Run `generate:audio -- <id> --locale fr`.

Each FR file carries a `translation_status` field (`untranslated` / `draft` / `reviewed` / `final`). The site shows a small advisory chip on FR paper pages when the status is not `final`.

## The presentation player

`components/PresentationPlayer.js` is a reusable Vue component used for every paper's TL;DR presentation and any embedded presentations.

Features:

- Single Audio element reused across slides; per-slide MP3 sources.
- Two-panel layout: visual stage on the left, text panel (caption + title + narration) on the right. Collapses to a single column on mobile.
- Click or tap anywhere on the stage to toggle play/pause.
- Keyboard shortcuts: Space toggles play/pause, ← / → switch slides.
- Large central play overlay when paused.
- Click-to-seek scrubber, time display, prev / next / restart, auto-advance toggle.
- TOC overlay with a "has-media" indicator showing which slides have audio ready (derived from a HEAD probe on mount).
- Pre-loaded cross-dissolve image transitions with a subtle Ken Burns scale, gated by `prefers-reduced-motion`.
- Friendly error state with the exact regenerate command when audio is missing.
- Slide index indicator in the corner of the stage.
- Compact variant for inline embeds.
- Locale inheritance from the page: when you switch EN/FR, the player reloads automatically with the right-locale slides and audio paths.
- i18n strings throughout.

Every paper detail page renders a TL;DR presentation between the abstract and the body. Papers can also embed additional presentations inline using a `presentation` block in the `blocks[]` array — the block references an entry in `embedded_presentations` by id.

## Visuals registry

`components/visuals/_lib/registry.js` defines two classes of visual:

- **Reusable** — parameterized components that work for any paper. Live in `components/visuals/reusable/`, always loaded. Examples: `tile-heatmap`, `mini-chart`. Slide author selects with `slide.visual: "tile-heatmap"`.
- **Bespoke** — paper-specific one-offs. Live in `components/visuals/bespoke/<owner-id>/`. Lazy-loaded when the owning paper opens (declared in `paper.bespoke_scripts`). Slide author selects with `slide.visual: "<owner-id>:<visual-name>"`.

Shared animation utilities (ping rings, ticket-fly, heat colors, reduced-motion gate) live in `components/visuals/_lib/anim.js`.

## Image inspector

Every AI-generated image renders behind a small `i` badge (`components/ImageInspector.js`). Clicking the badge opens a panel showing the style prompt, the image prompt, the composed prompt, the model, the locale, the conditioning source (for FR images, the EN PNG they were generated from), and a link to the raw `.meta.json` sidecar. This is the transparency contract: if a prompt can't be shown publicly, the image can't ship.

## Adding a paper

The recommended flow is to use the `add-paper` skill (`.claude/skills/add-paper.md`):

1. Append metadata to `data/papers.json`.
2. Create `data/papers/<id>.en.json` and `data/papers/<id>.fr.json` (FR stays as a stub for now).
3. Author the EN body. Block types: `section_heading`, `paragraph`, `dropcap_paragraph`, `pullquote`, `keystat`, `figure`, `sidenote`, `tag_row`, `related`, `presentation`.
4. Add a `tldr_presentation` with at least three slides (title / quote / list) plus `text` narration scripts.
5. Run `npm run generate:audio` and `npm run generate:images` for the EN paper.
6. Run `npm run eval` to confirm structural validity.
7. Translate FR later (skill: `translate-paper`).

The full content schema is documented in `CLAUDE.md`.

## Accessibility and SEO

The site targets **WCAG 2.1 AA** and ships SEO infrastructure for a content rollout:

- Per-page `<title>`, meta description, Open Graph, Twitter Card, canonical, and hreflang at runtime (`components/_lib/meta.js`).
- JSON-LD `ScholarlyArticle` / `TechArticle` structured data on every paper.
- Static pre-rendering for crawlers (`npm run build:prerender` → one HTML file per paper per locale at `paper/<id>/index.html` with abstract + meta + JSON-LD baked in).
- `sitemap.xml` + `robots.txt` generation (`npm run build:sitemap`).
- Global skip-to-content link, focus-visible styles, `aria-live` announcements for state changes, focus traps on every modal, ESC closes any open dialog.
- Press **`?`** anywhere on the site to see the keyboard shortcuts.

Run the static a11y check on its own:

```bash
node scripts/evals/check-a11y-static.mjs
```

It scans templates for clickable divs without role, unlabeled inputs, icon-only buttons without `aria-label`, heading skips, images without alt, and anchor tags without href. It runs automatically as part of `npm run eval`.

## Evals and skills

```bash
npm run eval                         # runs every check in scripts/evals/
npm run eval:strict                  # also hard-fails on a11y warnings
```

Seven checks:
- `check-a11y-static` — clickable divs without role, unlabeled inputs, icon-only buttons without `aria-label`, heading skips, images without alt.
- `check-bilingual-parity` — EN side hard-checked; FR side reported as advisory translation-status table.
- `check-image-metadata` — every JPG has a sidecar with the prompts that produced it.
- `check-audio-coverage` — every declared MP3 exists for non-placeholder EN papers.
- `check-prompt-provenance` — every declared image has `image_prompt` and `style_kind`.
- `check-narration-text` — every audio-declaring slide has a `text` field at least 20 chars long.
- `check-style-guide` — fast static scan for banned words, em dashes, AI tells. Warning-only.

Skills (manifests in `.claude/skills/`):
- `add-paper` — add a new entry to the inventory and create its JSONs.
- `translate-paper` — produce the FR version after EN is polished.
- `add-presentation` — embed an additional presentation in a paper body.
- `regenerate-images` — produce hero / figure / slide imagery; EN first, FR conditioned.
- `regenerate-audio` — produce narration MP3s; configurable bitrate.
- `port-knowledge-article` — port a separate site (e.g. ADHD) as a `category: architecture` knowledge article.

## Authoring and operating

How this platform is built and run. The Velocity White Papers are a static, bilingual, open-source site. Vue runs from a CDN, the content is JSON, images and audio are files, and GitHub Pages serves the result. There is no backend in production. You author locally through a dev-only editor, and the published site stays read-only. This section sets out how to fill it and ship it.

### Who does what

The human is the architect, the author, and the reviewer. You decide the collection, the order, the argument of each paper, and the voice. You accept or reject every AI suggestion. Nothing the AI produces reaches a file without your sign-off.

The AI drafts, refines, translates, and generates assets, always as proposals. It scaffolds a body from your raw material, tightens prose against the style guides, translates a paper into the other language, and produces imagery and narration. It never invents facts, and it never publishes on its own.

### Start the editor

From `app/site`, run `npm run edit`. This serves the site at `127.0.0.1:5173` and turns editing on. The gate is local-only, so the public site can never be edited. The server reads `.env` for the Vertex service account (Claude), the OpenAI key (images), and the ElevenLabs key (audio). Open the site and click **Edit** in the toolbar.

Run `npm run dev` for a read-only preview with no editor. Run `npm run preview` to serve the site through the same server without turning editing on.

### The life of a paper

1. **Add it to the collection.** On the Index at `#/index` in edit mode, use **+ Add paper** and give it an id, a title, and a tier. The number and the sequence are derived from order position. Reorder with the up and down controls and the numbering follows. `data/papers.json` is generated, so you never edit it by hand.
2. **Draft the body.** Build from scratch, or paste a rough Markdown draft and let the AI fill the paper schema: sections, paragraphs, TL;DR, and metadata. When the source is mixed, the source hierarchy applies. Your prose is the spine, the code is the technical ground truth, and transcripts are third-order and never quoted verbatim.
3. **Refine the prose.** Use **AI** on a paragraph, **Revise §** on a section, or **Revise paper**. Pick style guides or give direction, choose Sonnet for speed or Opus for the heavier passes, then accept or reject each change. The guides apply to the prose the AI generates. They leave your own wording alone.
4. **Generate the imagery.** On each figure or slide, write an image prompt and click **Generate** or **Regenerate**. The image is produced from the prompt and saved with a metadata sidecar, and the inspector shows the prompt that made it.
5. **Generate the narration.** In the TL;DR slide editor, write each slide's narration and click **Generate narration**. The full-paper audio comes from the script through `npm run generate:audio`.
6. **Translate and build the other language.** Set the canonical primary locale, then use **Translate**. It clones the structure into the target language, translates every string, and regenerates the target images and audio. The target is overwritten. A sync chip shows when a translation falls behind its source.
7. **Publish.** Set the paper's status to Published. It then appears on the home page and counts in the sequence. Save, then commit and push.

### What the editor changes

In edit mode you click any heading, paragraph, abstract, title, caption, or narration to edit its source, and the Markdown renders when you click off. You reorder, insert, and delete blocks. You reorder, add, and delete TL;DR slides. You edit figure prompts and captions. You edit paper metadata such as tier, status, read time, and tags. The contents menu reorders sections by drag and renumbers them. The Guides panel lets you curate the editable style guides. Save writes back to the JSON through the local edit-server. The About page is editable the same way and saves to `data/pages/about.<locale>.json`.

### Voice and substance

Two disciplines govern every reader-visible string. Substance comes first. Every claim traces to a source, every number says what it measures, and nothing is invented. Voice comes second. Match the author's exemplar, which is flowing, first person, and specific. Treat the style rules as a list of things to avoid adding. Do not use them to flatten the author's own sentences. When the author wrote the words, the words stand, and the AI fixes only what is wrong.

### How it is stored and shipped

Each paper is two JSON files, `<id>.en.json` and `<id>.fr.json`, under `data/papers`. The inventory `data/papers.json` and the numbers are generated from `data/order.json` and the primary files, so they cannot drift. Images and audio live under `public`. You work locally, commit, and push to GitHub, and GitHub Pages serves the static result. Secrets, internal source material, and recordings stay out of the repository.

## Article classification

Two categories live in `papers.json`:

- `paper` — numbered linear sequence (1..16 + companion). Shown on `#/library`.
- `architecture` — technical reference articles outside the linear flow. Shown on `#/architecture` under the agentic-architecture diagram. The future ADHD port lives here as `arch-adhd-harness`.

## Style guide

All reader-visible content follows `style-guide/00-writing-style-guide.md` (one directory up). The `check-style-guide` eval flags banned words, em dashes, and common AI tells. Warnings are advisory; the human writer is responsible for the final judgment.

## License

MIT. The site is itself open source. Adopters bear responsibility for their own evaluation, decisions, and costs.
