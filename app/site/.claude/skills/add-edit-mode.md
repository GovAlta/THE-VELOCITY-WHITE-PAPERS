# Skill: add-edit-mode (reference)

Documents the dev-only in-page editor. This is mostly a reference for how the feature works and how to extend it, not a step-by-step to run each time. The feature already exists; read this before changing it.

## What it is

A local editing surface for paper content. Run the site locally, turn on Edit, click into a paragraph / heading / title / subtitle / abstract, type, and Save writes the change back to `data/papers/<id>.<locale>.json`. It is for accelerating the author's own review-and-edit pass.

## The non-negotiable constraint

**Editing is OFF everywhere unless this environment explicitly enables it.** Two gates, both must pass:

1. The page must be on `localhost` / `127.0.0.1`.
2. The dev edit-server must report editing enabled. The client probes `GET /api/edit-status` on load and only shows the toolbar when it returns `{enabled:true}`. The server returns true only when started with `--enable` (which `npm run edit` passes) or `VW_EDIT=1`.

So the published static GitHub Pages site — which has no server — can never enable editing, and a visitor cannot deface content. Plain `npm run dev` (http-server, no API) also leaves editing off. Do not weaken either gate, and do not add a server write path that ships in the static build.

## How to use it

1. Run the editing server: `npm run edit` (serves `:5173` AND enables editing + image generation). To run the same server read-only (preview, no editing), use `npm run preview`. Plain `npm run dev` serves the site but does NOT enable the editor.
2. A small toolbar appears bottom-right. Click **Edit**.
3. Editable regions get a dashed outline. Click one and type. Edits update the page live, because they write to the in-memory paper object the page is rendering.
4. Click **Save**. The first save asks you to grant access to a folder; pick `data/papers` (or the site root). The file is written as pretty-printed JSON. Later saves reuse the grant for the session.
5. Browsers without the File System Access API (Firefox, Safari) fall back to downloading the JSON; move it into `data/papers/` yourself.

## What is editable

**Text (inline, source-based):** title, subtitle, abstract, section headings, paragraphs, dropcap paragraphs, and figure titles and captions. In edit mode a text region renders normally and is clickable; **click to edit its raw source, click off to commit and re-render**. Because it edits source, spaces and line breaks behave normally and inline markdown renders on blur (`**bold**`, `*italic*`, `` `code` ``, `[link](url)`); existing inline HTML in a field passes through unchanged. The dropcap's large first letter is part of the editable text now (rendered with CSS `::first-letter`), so it edits like any other character.

Each block renders with a **stable key** (a WeakMap keyed by the block object, not the array index). This is what makes reorder and insert work and prevents node reuse from cloning content. Do not switch the body `v-for` back to an index key. The key lives only in memory; it is never written to the JSON.

**Structure (edit mode):**
- Each block shows a hover toolbar: move up, move down, delete, and an "insert after" row (+ paragraph, + image, + section).
- The left contents menu supports drag-to-reorder of sections, a delete button per section, and "+ Add section". Reordering moves the section's whole block range, including its figures and images, because they live inside that section's group.
- Image blocks expose the image prompt, alt text, source path, and style as editable fields, plus the caption. A **Generate image** button (which reads **Regenerate image** once an image exists) generates the image from the prompt; a not-yet-generated image shows a placeholder until then.

## Generating images from the editor

A static page cannot call OpenAI (the key would be exposed, and there is no server). So image generation runs through a **dev-only local server**:

```
npm run edit          # serves http://127.0.0.1:5173 AND exposes /api/generate-image
```

Run this instead of `npm run dev` when you want to generate images. It needs `OPENAI_API_KEY` in `.env`, the same key the `generate:images` script uses. The **Generate / Regenerate** button on an image block POSTs the prompt to `/api/generate-image`; the server (`scripts/edit-server.mjs`) reuses `scripts/lib/images.mjs` to produce the JPG, the source PNG, and the `.meta.json` sidecar at the block's `src` under `public/images/`, then the editor refreshes the image in place. Regenerate overwrites the same path with the same prompt. For a French image, generation conditions on the English source PNG when one exists, matching the project's EN to FR convention.

Under plain `npm run dev` the endpoint is absent; the button reports that and tells you to run `npm run edit`. The server binds to `127.0.0.1` only and is never deployed.

Section numbering and the `sections` list are derived from the heading blocks and rebuilt automatically after any structural change, so the TOC, anchors, and numbers stay consistent.

## Bilingual editing

The content is two files per paper, `<id>.en.json` and `<id>.fr.json`. The page shows one locale at a time, so the editor edits whichever locale is loaded and Save writes that locale's file. The toolbar carries an EN/FR switch (it drives the same locale change as the main nav); switch it to edit the other locale. Unsaved state is tracked **per locale** (`dirtyMap` keyed `<locale>:<id>`), so switching EN↔FR never silently drops edits, and each locale has its own dot and its own Save. The Save button names the locale it will write ("Save EN" / "Save FR").

Text is per-locale by design. Structural changes (reorder, add, delete) currently apply to the locale you are editing; they are not mirrored to the sibling file, because a French stub may not be structurally parallel. Keep EN-first: finalise the English structure, then run `translate-paper` to regenerate the French sibling in matching structure. (A future enhancement could mirror structural ops when both locales are already parallel.)

## Keyboard

The TL;DR player's Space / arrow shortcuts are suppressed while a contenteditable region is focused or while edit mode is on, so the space bar types a space instead of toggling play. Keep that guard if you touch `PresentationPlayer.onKeydown`.

Not yet inline-editable: pullquote text, keystat bodies, sidenotes, and TL;DR slide text. Edit those in the JSON for now.

## Phase 3 — AI revise + style-guide library (built)

**Saving** now goes through the edit-server (`POST /api/save-json`), not the File System Access API — so there is no folder picker, and any browser works. Transient editor-only keys (anything starting with `__`, such as AI proposals) are stripped before the file is written.

**Style-guide library.** The **Guides** button opens a panel listing the editable guides — `voice-exemplar`, `00`/`01`/`02`, `source-hierarchy`, and `image-style.json`. Edit one and **Save guide** overwrites the local file (`GET /api/style-guides`, `POST /api/save-guide`; the set is a whitelist in `edit-server.mjs`). JSON guides are validated before writing.

**AI revise with accept/reject.** Three scopes:
- paragraph: the **AI** button on a paragraph's block bar.
- section: the **Revise §** button on a section heading's block bar.
- paper: **Revise paper** in the toolbar.

Each opens a dialog to pick any guides and add free-form direction, then runs `POST /api/revise`, which calls Claude (`scripts/lib/llm.mjs`, needs `ANTHROPIC_API_KEY` in `.env`, model via `ANTHROPIC_MODEL`, default `claude-sonnet-4-6`). The model returns a revision per paragraph; each lands as a **proposal** under its block (stored on `block.__ai`, never saved as-is) with **Accept** / **Reject**. Accept replaces the text and marks dirty; reject discards. The toolbar has **Accept all** / **Reject all** when proposals exist. The revise prompt instructs the model to preserve meaning, facts, numbers, and the author's voice.

The proposals layer lives on `VWEdit`; the per-block UI lives in the `.vw-block` wrapper in `PaperDetail`. Keep both intact when extending.

## Adding, reordering, and deleting papers (built)

On the Index page (`#/index`), in edit mode, `IndexTable` shows **+ Add paper** and per-row **↑ ↓ ✕** controls (visible only with search/tier filters cleared, so row order is the real inventory order).
- **Add paper** takes an id (kebab-case), number, title, and tier; `VWEdit.createPaper` writes `data/papers/<id>.en.json` and `<id>.fr.json` placeholder stubs and appends the inventory entry, saving `data/papers.json`.
- **Reorder** (`VWEdit.movePaper`) swaps entries in `store.papers` and re-saves `data/papers.json`.
- **Delete** (`VWEdit.deletePaper`, confirm dialog) removes the inventory entry, re-saves `papers.json`, and calls `POST /api/delete-paper` to unlink both locale JSON files. Images/audio under `public/` are left in place.

## Paper metadata editing (built)

In edit mode, `PaperDetail` shows a metadata panel under the byline with inputs for number, sequence, read time (`reading_min`), published date, tier, status, category, repo, and tags. Editing marks dirty; **Save** writes the paper JSON and **syncs the inventory** (`papers.json`) so the index reflects the same number, title, subtitle, tier, status, read time, and tags.

## TL;DR slide editing (built)

`TldrEditor` (`components/TldrEditor.js`) renders under the player in edit mode. Per slide: editable caption, title, subcaption, and narration text; a visual-type select; and an image (prompt + alt + **Generate / Regenerate**, reusing `VWEdit.generateImage`, writing `public/images/<id>/<locale>/slide-<NN>.jpg`). Add, remove (confirm), and reorder slides. Narration edits change what the audio should say; the MP3 is refreshed out of band with `npm run generate:audio`.

## How it is built

- `components/EditMode.js` — `window.VWEdit` (reactive controller: `available`, `enabled`, `dirty`, `current`, `save()`) plus the `edit-toolbar` component. The host gate and the File System Access API save live here.
- `components/EditableText.js` — the `editable-text` component. Read mode renders exactly as before. Edit mode renders a contenteditable element, uncontrolled (initial content set once when editing begins, so typing never fights a Vue re-render), and commits to `obj[field]` on blur.
- `styles/edit.css` — toolbar and editable-affordance styles. Inert unless the toolbar renders.
- `components/BlockRenderer.js` and `components/PaperDetail.js` use `editable-text` for the editable fields. `PaperDetail` registers the on-screen paper with `VWEdit.setCurrent` so Save knows what to write.

## Extending to Phase 2

To make another field editable, render it through `editable-text` bound to its object and field:

```html
<editable-text tag="p" :obj="block" field="caption" :html="true" />
```

For fields inside child components (pullquote, keystat), thread `editable-text` into that component's template the same way, binding to the block object it already receives. Keep edits writing to the shared reactive paper object so Save stays a single serialize of `VWEdit.current`.

## Do not

- Remove or weaken the `localhost` host gate.
- Add a deployed backend save path. The dev File System Access API (or the download fallback) is the whole mechanism.
- Bind `v-html` and `contenteditable` to the same element with a live value; that fights the cursor. The uncontrolled pattern in `EditableText.js` is deliberate.
- Change the JSON serialization away from `JSON.stringify(paper, null, 2)`; it matches the repo's existing 2-space format so diffs stay clean.
