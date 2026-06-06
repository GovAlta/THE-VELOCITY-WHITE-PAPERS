# CLAUDE.md — The Velocity White Papers Site

A contract for future Claude Code agents working on this codebase. Read this first. Do what it says. If a request conflicts with what's here, raise the conflict instead of working around it.

## What this codebase is

A static, bilingual, open-source whitepaper compendium published from GitHub Pages. Vue 3 from CDN. No backend. No login. Content is JSON. Audio and imagery are produced by Node scripts and consumed as static files. The site itself is open source and adopters bear responsibility for their own evaluation.

Read `STRUCTURE.md` for the layout overview before making any structural change.

## Five constraints

1. No backend. Static files only.
2. Data-driven content. JSON in, components render.
3. Fully bilingual EN + FR. Every reader-visible string lives in a JSON file.
4. Script-generated assets, idempotent, with metadata sidecars.
5. Agent-extensible. Skills in `.claude/skills/`. Evals in `scripts/evals/`.

## Where to put things

| You want to add… | Put it here |
|---|---|
| A new paper                          | `data/papers/<id>.en.json` and `<id>.fr.json`; entry in `data/papers.json` |
| A new architecture knowledge article | Same as a paper, with `category: "architecture"` |
| A new reusable visual                | `components/visuals/reusable/<Name>.js` + entry in `index.html` |
| A paper-specific visual              | `components/visuals/bespoke/<paper-id>/<Name>.js` + `bespoke_scripts` in paper JSON |
| A new UI string                      | `data/site.json` under `i18n.<locale>.ui` |
| Static page content (about, manual, community, repos, updates) | `data/pages/<name>.<locale>.json` (one file per locale); load with `VWLoadPageData` |
| A new block type                     | New file in `components/`, register on `window.VWComponents`, add a branch in `BlockRenderer.js` |
| A new slide visual type              | New file in `components/visuals/reusable/`, register with `VWVisuals.registerReusable` |
| A new chart for the figure block     | Register a Vue component in `components/MiniChart.js` style, map the `chart.kind` in `Figure.js` |
| A new image style preset             | `data/image-style.json` under a new top-level key |
| A new script                         | `scripts/<name>.mjs`; if reusable lib, `scripts/lib/<name>.mjs` |
| A new eval                           | `scripts/evals/check-<name>.mjs`; reference it in `npm run eval` |

## The presentation player

`components/PresentationPlayer.js` is the reusable audio + visual slide player used by every paper's TL;DR and any embedded presentations. Its surface:

- Single `<Audio>` element reused across slides; per-slide MP3 sources.
- Two-panel layout: visual stage on the left, text panel (caption + title + narration) on the right. Collapses to single column on mobile.
- Click or tap anywhere on the stage to toggle play/pause.
- Keyboard shortcuts: Space toggles play/pause, ← / → switch slides.
- Large central play overlay when paused.
- Click-to-seek scrubber, time display, prev / next / restart, auto-advance toggle.
- TOC overlay (top-right "All slides") with a "has-media" dot on slides whose audio is reachable.
- Pre-loaded cross-dissolve image transitions with a subtle Ken Burns scale, gated by `@media (prefers-reduced-motion: reduce)`.
- Slide-fade transition between non-image slides.
- Friendly error state with the exact regenerate command when audio is missing.
- Slide index indicator in the corner of the stage.
- Compact variant for inline embeds in paper bodies.
- Locale inheritance from the page: the parent (`PaperPage`) watches `paperId + locale` and reloads the paper content when either changes; the player just renders the active-locale presentation it is given.
- i18n strings throughout from `store.t.ui.*` with sensible English fallbacks.

If you add features, do not break: the click-to-play behavior on the stage; the locale-watch in `PaperPage`; the cross-dissolve image layer; the `has-media` probe.

## Where NOT to put things

- Reader-visible strings inside a Vue component file. Move them to `data/site.json`.
- Image paths in JS files. They belong in the per-paper JSON.
- Bespoke visuals in `reusable/`. The lazy-load is the whole point.
- Long-form paper body content inside a component template. It belongs in the paper JSON's `blocks` array.
- Anything that requires a backend. We do not have one. Use static files.

## Content schema

The full schema for a paper JSON lives at the top of each `data/papers/<id>.en.json`. The required fields:

```json
{
  "id": "wp-XX",
  "num": "XX",
  "sequence": "N of 16",
  "tier": "Conceptual | Technical | Policy & People",
  "category": "paper | architecture",
  "title": "…",
  "subtitle": "…",
  "abstract": "…",
  "tags": ["…"],
  "status": "Published | Forthcoming | Draft | Placeholder",
  "repo": "https://…" | null,
  "hero_image": {
    "src": "public/images/<id>/<locale>/hero.jpg",
    "alt": "…",
    "style_kind": "cover",
    "style_prompt": "…",     // optional override; otherwise data/image-style.json applies
    "image_prompt": "…"
  },
  "audio": { "src": "public/audio/<locale>/<id>.mp3" },
  "tldr_presentation": {
    "id": "<id>-tldr",
    "title": "…",
    "locale": "en | fr",
    "owner_id": "<id>",
    "slides": [
      {
        "id": "01",
        "title": "…",
        "audio_file": "public/audio/<locale>/<id>-tldr/01.mp3",
        "visual": "title | stat | list | quote | compare | image | chart | custom | <key>",
        "visual_config": { … },
        "image": { "src": "…", "image_prompt": "…", "style_kind": "diagram" },
        "caption": "…",
        "subcaption": "…",
        "text": "Narration script for TTS."
      }
    ]
  },
  "embedded_presentations": [],
  "sections": [{ "n": "01", "title": "…" }],
  "blocks": [
    { "type": "section_heading", "n": "01", "title": "…" },
    { "type": "paragraph", "text": "…" },
    { "type": "pullquote", "text": "…", "cite": "…" },   // visible callout only; NOT read in the long-form audio narration
    { "type": "keystat", "label": "…", "value": "…", "body": "…" },
    { "type": "figure", "fno": "…", "title": "…", "caption": "…", "chart": { "kind": "mini-chart", … }, "image": { … } },
    { "type": "sidenote", "label": "…", "value": "…" },
    { "type": "tag_row", "tags": [] },
    { "type": "related" },
    { "type": "presentation", "presentation_ref": "<embedded-presentation-id>" }
  ],
  "bespoke_scripts": ["components/visuals/bespoke/<id>/Foo.js"],
  "_meta": {
    "placeholder": true | false,
    "written_by": "…",
    "notes": "…"
  }
}
```

## Bilingual workflow — EN first, FR follows

**English is polished first.** French is generated and reviewed downstream, after the English paper is final. Do not try to keep EN and FR in lockstep during authoring.

Concretely:

1. Author and polish the EN paper JSON. Run `npm run generate:audio -- <id> --locale en` and `npm run generate:images -- <id> --locale en`. Iterate until the EN paper is final.
2. Only then run `npm run generate:images -- <id> --locale fr` (uses the EN PNG as a composition reference) and have a human review the FR JSON content.
3. Run `npm run generate:audio -- <id> --locale fr` once the FR text has been reviewed.

Every FR file carries a `translation_status` field: `"untranslated"`, `"draft"`, `"reviewed"`, or `"final"`. Set this honestly. The site reads it and shows a small advisory chip on French paper pages when status is not `"final"`.

The eval `check-bilingual-parity.mjs` is the release-readiness report. It HARD-fails when EN is broken (missing required fields, malformed paths). It produces a status table for FR but does NOT fail on FR gaps — that's expected during the period between EN polish and FR translation.

## Commands

```bash
# Local dev
npm run dev                                      # http-server on 5173

# Generate assets
npm run generate:audio                           # all papers, all locales
npm run generate:audio -- wp-01 --locale en      # narrow
npm run generate:images                          # all papers, EN then FR (conditioned)
npm run generate:images -- wp-01 --no-condition  # text-only FR (debugging)
npm run generate:all                             # both

# Sync checks
npm run eval                                     # run every check in scripts/evals/
npm run eval:strict                              # also fail on a11y warnings

# SEO build (run before deploying)
npm run build:sitemap                            # sitemap.xml + robots.txt
npm run build:prerender                          # static HTML per paper/route
npm run build:seo                                # both

# Production build pipeline (non-destructive)
npm run build:bundle                             # bundles JS + CSS, writes index.dist.html
npm run build:dist                               # bundle + sitemap + prerender (still non-destructive)
npm run deploy:swap-in                           # at deploy time: replace index.html with index.dist.html,
                                                 #   backs up the dev version to index.dev.html.bak
npm run deploy:swap-out                          # after deploy: restore the dev index.html from backup

# Note: check-audio-coverage and check-image-metadata will fail until the
# generation scripts have been run. That is the desired behaviour — the evals
# are a release gate, not a development scratchpad. Before merging a paper
# update, run the relevant `npm run generate:*` to produce assets, then re-run
# `npm run eval`.

# Migrations (one-shot)
node scripts/build-stubs.mjs                     # generates stub paper JSONs
node scripts/migrate-classification.mjs          # one-shot category migration
node scripts/migrate-image-paths.mjs             # one-shot path migration
```

## Skills

When asked to do common operations, follow the manifest in `.claude/skills/<skill>.md`. The current skills:

- `add-paper` — add a new paper to the inventory and create its two JSON files (stub only; no body)
- `draft-paper` — scaffold a real body from named raw sources, in the author's voice, never inventing
- `weave-sources` — draft technical sections from mixed input (prose + code + transcripts), ranked by the source hierarchy
- `refine-paper` — the editorial tone pass; minimum edits, preserves the author's voice
- `translate-paper` — produce or update the FR sibling of an EN paper
- `add-presentation` — add an embedded presentation to a paper
- `regenerate-images` — regenerate hero or figure images (with the EN→FR conditioning rule)
- `regenerate-audio` — regenerate narration MP3s
- `port-knowledge-article` — port an external open-source companion site into an `architecture` knowledge article here

The authoring path for a new paper is: `add-paper` (stub) → `draft-paper` (body from sources) → `refine-paper` (tone) → human reads aloud → flip `_meta.placeholder` → `translate-paper` → `regenerate-images` → `regenerate-audio`.

Each skill is a markdown file with explicit steps and validation criteria. Follow them.

## Writing style — the hard rules

Every reader-visible string the agent writes (titles, subtitles, abstracts, paragraphs, slide captions, slide narration `text`, pullquote text, keystat bodies, figure captions, sidenote bodies) must follow these rules. The full rationale is in `../../style-guide/00-writing-style-guide.md`. These are the enforced rules.

**Read `../../style-guide/voice-exemplar.md` first.** It is the primary positive reference for preserving the author's voice. There is no single house voice to imitate: the anchor is the prose the author provides for the paper in front of you. Sample it (sentence length and rhythm, the author's chosen person, specifics woven in, coined terms kept) and write any connective prose to match. The rules below are a **filter on prose you generate from scratch** — what not to add. They are **not** a license to rewrite the author's own sentences. When the author has written the words, those words are the source of truth: fix what is false or accidental, preserve the cadence. Chopping flowing sentences into short declaratives to satisfy the rules below produces a different kind of AI smell and is the failure these notes exist to prevent.

**The register anchor, and transposing transcripts.** The two most polished papers, `data/papers/cux4h.en.json` (Ship of Theseus) and `data/papers/mwo98.en.json` (Cyber Imperative), set the register for the whole collection: institutional "we"/"Alberta"/"Technology and Innovation", almost never "I"; developed comma-joined sentences with the *occasional earned short declarative*; color from sustained metaphor and named concepts and hard numbers, never from chatty asides. Read them before drafting connective prose. When a paper is transposed from a spoken transcript (the author talking, often with an AI agent narrating a draft back that he refines live), the recurring failure is **over-editing**: re-synthesizing his words, adding earned-short-line flourishes he never wrote, and drifting into the chatty first-person register of speech. Merge the author's statements with any AI narration in the transcript, keep their wording, clean only the banned constructions, and lift "I"/"Don't forget"/"Here is the piece I like best" to institutional "we". Run a source-fidelity pass against the transcript before generating audio. The `draft-paper` skill carries the full checklist.

**Read `../../style-guide/03-fidelity-and-sourcing.md` before weaving sources.** Weave every point the author gives in scope (the draft is normally longer than the notes, not shorter), read and cite every source the author names (use `scripts/extract-pdf.mjs` for PDFs, WebFetch for URLs, Read for code and files), defer detail across papers in the open with a link, and drop nothing in silence. Produce the coverage check it describes so the author can confirm nothing was lost.

**Write for a mixed audience.** `00` carries a clarity standard, and it is as binding as the hard rules. One idea per sentence. A list of more than three items goes in a table or bullets, never crammed into a sentence as a wall of commas. Lead with the plain point and name the actor ("we," "the tool"), not an abstract opener ("X holds the design honest"). Explain jargon the first time it appears. Keep sentences short and parseable. A smart non-specialist should follow any paragraph on the first read. Completeness (`03`) and clarity (`00`) are both required: keep every item, but keep the list in a table and the prose around it short. This applies to the prose you generate, not to the author's own sentences.

**Never emit a phrase you recognise from a style guide's "Forbidden" column.** The guides quote bad writing to warn you off it; quoting one back as content has actually happened (two phrases were once pasted into wp-08), so the rule is explicit. See `voice-exemplar.md`.

**Core principle (for prose you generate).** Plain declarative language. Make a claim. Move on. Trust the reader to follow without rhetorical scaffolding. If a sentence works only because of its rhythm, its symmetry, or its sound when read aloud, it is the wrong sentence. This governs what you write fresh; it does not override the author's voice when he has supplied the words.

### 1. No "not X, but Y" constructions

The single most reliable signal of AI-generated prose. Every form is forbidden:

| Forbidden | Correct |
|---|---|
| "This is not a press exercise. It is a substantive program." | "This is a substantive program." |
| "Not just X, but Y." | "Y." (drop the negated half) |
| "X is not the goal. Y is." | "Y is the goal." |
| "Visible progress is not a nice to have, it is a survival requirement." | "Visible progress is a survival requirement." |
| "This is not new money. It is a redirection." | "The reprofile redirects existing committed budget." |

State what the thing is. Drop the negated half entirely.

### 2. No em dashes (—) or en dashes (–)

Use commas, periods, parentheses, or colons. If a sentence relies on an em dash, it is usually two sentences trying to be one. Split them.

### 3. No tetracolons or "is the X" listings

Four-part parallel structures used for rhythm sound polished and say very little. Convert to ordinary prose. Three-item lists for rhetorical rhythm (rather than because three items genuinely apply) are also banned.

**Forbidden:** "The whitepaper is the asset. The X Prize is the multiplier. The feature is the launch pad. The CEO's voice is the durable outcome."

**Fix:** Use a list only when the items are genuinely a comparable list, not a flourish.

### 4. No short-sentence cinematic flourishes

Two or three short declarative sentences in a row used for dramatic effect read as a movie trailer voice-over.

**Forbidden:** "The window is open. The leverage is real. The plan uses both."

**Fix:** Combine into a single sentence with normal cadence.

### 5. No "is the moment" / "is where" rhetorical anchors

**Forbidden:** "This is the moment X becomes globally visible." "This is where the strategy comes together." "This is the cadence piece."

**Fix:** Describe what the step delivers concretely.

### 6. Banned vocabulary

Strike these on sight. They almost never carry meaning that a plainer word would not.

**Verbs and adjectives:** leverage (as a verb), unlock, navigate (as a metaphor), delve, robust, seamless, crucial, essential, vital, holistic, nuanced (as filler), intricate, comprehensive (as filler), significant (as filler), interlocking, mutually reinforcing, compound (as a verb of effect), crystallize, amplify (when meaning "help"), tee up.

**Nouns:** landscape (metaphorical), ecosystem (outside biology), tapestry, realm, paradigm, synergy, journey (metaphorical), fabric (metaphorical).

**Adjective clichés:** game-changing, cutting-edge, state-of-the-art, world-class, best-in-class, next-generation.

**Sentence openers:** Moreover, Furthermore, In essence, At its core, Fundamentally, In today's world, In the world of, It's worth noting that, It is important to note that.

**Phrases to delete:** "It is also worth noting", "From X to Y" (as flourish), "In a world where", "At the end of the day", "Move the needle", "Drive impact".

### 7. No trailing participle that restates the sentence

**Forbidden:** "X has built the only operational answer in Y, demonstrating its leadership."

**Fix:** End the sentence at the period. If the second clause adds real information, write it as its own sentence; if it does not, delete it.

### 8. No "ensure" when a direct verb works

| Hedged | Direct |
|---|---|
| "Ensure the whitepaper anchors the story." | "Anchor the story on the whitepaper." |
| "Ensure that visibility is maintained." | "Maintain visibility." |

### 9. No vague intensifiers

Strike: very, really, truly, deeply, profoundly, incredibly, extremely, particularly (as filler), notably, importantly. If a claim needs an intensifier to land, the claim is weak. Strengthen the claim instead.

### 10. No decorations

No emojis. No unrequested icons. No flourish characters. These are obvious AI tells.

### 11. Voice and cadence

- Default sentence length is medium. Mix short and long. Avoid long runs of sentences of the same length.
- Use the active voice. "The Ministry releases the whitepaper" not "the whitepaper is released by the Ministry".
- Name the actor where it matters who is doing the thing.
- Use specific nouns and verbs. "Forty million dollars reprofiled from contractor budgets" not "significant resources redirected toward the initiative".
- Numbers are concrete. Use them when real; round when honest; never as decoration.
- Trust the reader. Do not foreshadow ("As we will see below…") and do not recap ("As noted above…").

### 12. Structure

- Headings describe content, not signal importance. "The Asks" not "Critical Strategic Asks".
- Bullets are for genuine lists with parallel grammatical form. If items are not a list, write prose.
- One idea per paragraph. Open with the claim. Support it. Stop.
- End sections at the period. Do not add a closing flourish that summarizes the section. The reader has just read it.

### The reviewer's checklist

Before considering any reader-visible string done, run through this:

1. Does any sentence use "not X, but Y" or "this is not A, it is B"? Strike it.
2. Does any sentence end with a comma and a participle phrase? Strike the trailing phrase.
3. Are there three or more short sentences in a row used for rhythm? Combine them.
4. Does the paragraph contain any banned word from the list above? Replace it.
5. Is there a tetracolon or four-part parallel listing for rhetorical effect? Convert to prose.
6. Is "ensure" used where a direct verb would work? Replace.
7. Is there an em dash? Replace with comma, period, or parenthesis.
8. Does any sentence open with Moreover, Furthermore, In essence, At its core? Cut the opener.
9. Does the closing sentence of the section restate what was just said? Cut it.
10. Are there intensifiers (very, deeply, truly, particularly)? Strike unless they carry real meaning.

### Quick test

Read the draft aloud. If any sentence sounds like a movie trailer, a TED talk opening, or a LinkedIn post, rewrite it. The target voice is a competent senior official briefing a peer. Direct, specific, declarative, unhurried.

### Automated check

`npm run eval` runs a static scan for the most common violations (em dashes, banned words, vague intensifiers). It produces warnings, not failures, because final judgement requires a human. But every warning is a real candidate for revision.

**Author-verbatim exemption.** The scan rules apply to prose Claude generates. They do not apply to the author's own words. When a string is the author's verbatim prose, mark it so the scan leaves it alone:

- `_meta.author_verbatim: true` — exempt the whole paper.
- `_meta.author_verbatim: ["abstract", "title", "subtitle"]` — exempt named top-level fields.
- `"author_verbatim": true` on a block or a TL;DR slide — exempt that block or slide.

A warning on author-verbatim prose is the scanner doing its job on the wrong target. Mark the content; do not "fix" the author's voice to silence it.

## Do not

- Generate AI-slop paper bodies. The placeholders are deliberate. A real body comes from `technical-reference/`, the transcripts, or a human author. Do not invent.
- Modify `data/image-style.json` to be more verbose. The style prompt is short on purpose. The composition belongs in `image_prompt`, not `style_prompt`.
- Skip the eval. If `npm run eval` fails, the merge is not ready.
- Add features the user did not ask for. This codebase is on the small side intentionally.
- Add a build step before there is pain. Until then the script-tag pattern works.
- Disable or weaken the bilingual checks because the FR side is sparser. The structural parity matters; the content depth can grow asymmetrically.

## Accessibility — non-negotiable

The site targets WCAG 2.1 AA, and aims for 2.2 AA where the criteria apply. The static a11y eval (`scripts/evals/check-a11y-static.mjs`) catches the common regressions; it runs as part of `npm run eval`. If you add reader-visible UI, you must clear it.

Rules:

- **Interactive elements use real interactive tags.** `<button>` for actions, `<a href>` for navigation. Never a `<div>` with `@click` unless it has `role="button"`, `tabindex="0"`, and Enter/Space keyboard handlers.
- **Inputs have labels.** Either a real `<label for>` or a visually-hidden `<label>` with `class="sr-only"`. Placeholder text is not a label.
- **Icon-only buttons have `aria-label`.** Glyph characters (×, ☰, ↻, ▶, etc.) inside a button are invisible to screen readers without one.
- **Headings never skip levels.** h1 → h2 → h3, never h1 → h3 or h2 → h4. The eval flags every jump.
- **All images have an `alt` attribute.** Decorative images use `alt=""`. Generated AI images carry their `alt` from the paper JSON.
- **Modals trap focus and close on ESC.** Use `window.VWA11y.trapFocus(rootEl, returnFocusEl)` and `window.VWA11y.onEsc(handler)`.
- **State changes announce to screen readers.** Use `window.VWA11y.announce(message)` for: route changes, paper loads, locale switches, player play/pause/next-slide.
- **`prefers-reduced-motion` is honored.** Every transition longer than 100ms should have a `@media (prefers-reduced-motion: reduce)` zero-duration override.
- **Tap targets are at least 44×44 px on touch devices.** The `@media (hover: none)` block enforces this.
- **Focus visible on every interactive element.** The global `:focus-visible` style does this; do not override it without a reason.
- **`lang` attributes match content.** Default `<html lang>` switches with the locale; localized snippets inside other-locale pages carry their own `lang`.

For a screen-reader pass before launch: NVDA + Firefox on Windows, VoiceOver + Safari on macOS, TalkBack on Android, VoiceOver on iOS. Listen to a full paper read aloud at least once per browser before the public launch.

## SEO — content site essentials

The site is a content site. Discoverability matters as much as legibility.

- **Per-page meta tags update at runtime.** `components/_lib/meta.js` rewrites `<title>`, `<meta name="description">`, Open Graph tags, Twitter Card tags, canonical link, and hreflang alternates when the route or paper changes. Paper detail pages also emit JSON-LD `ScholarlyArticle` (or `TechArticle` for architecture articles).
- **Static pre-rendering is the discoverability layer.** Crawlers that don't run JavaScript (most non-Google bots, social-media preview bots, AI crawlers) get a real HTML page at `paper/<id>/index.html` with the abstract as visible text plus all the meta tags. JS-enabled clients are redirected to the SPA route. Run `npm run build:prerender` before each deploy.
- **`sitemap.xml` and `robots.txt`** are generated by `npm run build:sitemap`. The sitemap lists every reachable route per locale with hreflang alternates. The robots.txt permits the main crawlers including AI bots (GPTBot, ClaudeBot, PerplexityBot); adjust per-deployment if your context requires otherwise.
- **Default base URL** is the GitHub Pages URL. Override with `--base https://your-domain` on either script.
- **Re-run both builds when you add or rename a paper.** They read `data/papers.json` so they stay in sync, but the output files need to be regenerated.

## Transparency contract

This site is open source. The prompts that produced the imagery and the narration are part of the artifact. Every generated image has a `.meta.json` sidecar viewable in the UI through `ImageInspector`. Every slide's `text` field is the script that was sent to ElevenLabs. Do not hide this. If a prompt cannot be shown publicly, the image cannot ship.
