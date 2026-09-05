# The Velocity White Papers

A static, bilingual, open-source whitepaper compendium from the Government of Alberta, Technology and Innovation. It is published with GitHub Pages at **[thevelocitywhitepapers.com](https://thevelocitywhitepapers.com)** and the source lives here.

The papers describe how Alberta is using artificial intelligence to rapidly and securely transform its technical estate. The site itself is built the same way it describes: the writing, the imagery, and the narration are all produced with AI under human direction, and the whole pipeline is open for inspection.

> Quick map: this file is the overview. `app/site/README.md` is the developer reference. `app/site/CLAUDE.md` is the operating contract for AI agents working on the code. `structure.md` covers the layout and what is solid versus fragile.

## How the site works

There is no backend. `index.html` loads Vue 3 from a CDN, and `app/site/app.js` boots a small reactive store, a hash router (`#/`, `#/index`, `#/architecture`, `#/about`, `#/paper/<id>`), and locale state. Vue components in `components/` render the data, and pages in `pages/` compose those components into views. The browser never calls an AI service. Everything the visitor loads is a static file: HTML, JavaScript, CSS, JSON, JPG, and MP3.

Because it is static, it runs on any plain web server and costs almost nothing to host. A GitHub Actions workflow bundles the JavaScript and CSS, pre-renders an HTML page per paper for crawlers, generates the sitemap, and deploys the result to GitHub Pages.

## The content is JSON

All reader-visible content lives in `app/site/data/` as JSON. Components render it. There is no database and no CMS server.

- `site.json` holds site-wide configuration and every interface string, in both languages.
- `papers.json` is the inventory: one entry per paper with its title, abstract, tags, and status.
- `papers/<id>.en.json` and `papers/<id>.fr.json` hold the body of each paper, one file per language.

A paper body is an ordered `blocks` array. Each block has a `type`: `section_heading`, `paragraph`, `dropcap_paragraph`, `pullquote`, `keystat`, `figure`, `table`, `sidenote`, `tag_row`, `related`, or `presentation`. To change what a paper says, you edit its JSON. The full schema is documented at the top of `CLAUDE.md`.

Each paper also carries a `tldr_presentation`: a short slide deck with per-slide narration text and imagery, played by a reusable audio-and-visual presentation component.

## Bilingual by construction (i18n)

Every reader-visible string exists in English and French. Interface text is keyed by locale in `site.json`; each paper has an `en` and an `fr` body file. The toolbar switches locale at runtime, and the page reloads the matching content and audio.

English is polished first. French is generated and reviewed afterward. Each French file carries a `translation_status` (`untranslated`, `draft`, `reviewed`, or `final`), and the site shows a small advisory note on French pages until the status is `final`.

## The CMS: an in-browser editor for authors

The site has no server in production, so the editing tools run locally on the author's machine and write back to the JSON files. Run `npm run edit` (instead of `npm run dev`) and the page gains a DEV-only editor:

- Text regions become editable in place. Edits change the underlying JSON fields, not just the rendered page, and unsaved changes are tracked per language so switching locales never drops work.
- The editor can generate or regenerate a paper's imagery and narration on demand, and can ask AI to revise, translate, or draft content.
- It binds to localhost only and is never deployed. The public site stays read-only static.

This keeps authoring approachable for a non-developer while the published artifact remains a set of flat files anyone can audit.

## How AI is used to edit and augment

The papers are written by a human author and augmented with AI under that author's direction. The drafting, refining, and translating work is done with **Anthropic's Claude** (Claude Code and the Claude Agent SDK), guided by a set of skills in `app/site/.claude/skills/` and a writing style guide in `style-guide/`. The style guide is the rulebook: it defines the voice to write in, the constructions and vocabulary to avoid, and the fidelity and sourcing rules that keep the prose honest. An automated check (`npm run eval`) scans for the most common AI tells so they can be caught and removed.

The principle throughout is that the human owns the argument and the voice, and AI accelerates the production. Nothing is invented: the writing traces to the author's own material and named sources.

### Imagery is driven by OpenAI

Every illustration is produced with **OpenAI's image model** (`gpt-image-1`). Each image prompt is composed at generation time from a shared visual style and the per-image subject described in the paper JSON, so the whole collection holds one consistent look. The generator writes the JPG, the source PNG, and a `.meta.json` sidecar that records the exact prompt, model, and locale that produced it.

### Narration is an ElevenLabs voice clone of Deputy Minister Janak Alford

Every paper has long-form audio narration, and each TL;DR slide has its own narration. The audio is synthesized with **ElevenLabs** using a voice clone of the author, **Deputy Minister Janak Alford** (Technology and Innovation, Government of Alberta). The narration script is written for the ear, with markup and links stripped and numbers normalized so the spoken track reads cleanly. The text sent to ElevenLabs is the same `text` you can see in each slide and paper, so the narration is reproducible from the source.

## The transparency contract

This site is open source, and the way it was made is part of the artifact. Every generated image carries a visible inspector that shows the style prompt, the subject prompt, the composed prompt, the model, and the language it was generated in. Every narration script is the text stored in the JSON. If a prompt cannot be shown publicly, the image does not ship. Adopters who reuse this work are responsible for their own review and evaluation.

## Repository layout

```
app/site/          The site: Vue components, pages, data (JSON), styles, public assets, scripts
app/site/data/     site.json, papers.json, and per-paper en/fr body files
app/site/scripts/  Node tools: audio (ElevenLabs), images (OpenAI), build, evals, dev edit-server
app/site/.claude/  Skills the AI agents follow when authoring and maintaining the site
style-guide/       The writing style guide the author and AI agents write to
.github/           The GitHub Actions workflow that builds and deploys to GitHub Pages
```

## Running it locally

```bash
cd app/site
npm install            # only needed for the asset-generation and edit scripts
npm run dev            # serves http://localhost:5173 (read-only)
npm run edit           # serves the same site with the local editor enabled
npm run eval           # structural, style, accessibility, and consistency checks
```

Asset generation reads API keys from a `.env` file in this directory (see `.env.example`): `OPENAI_API_KEY` for imagery and `ELEVENLABS_API_KEY` plus `ELEVENLABS_VOICE_ID` for narration. The public build needs none of these; it only serves the files that were already generated.

## License

MIT. See the site footer and the repository license for details.
