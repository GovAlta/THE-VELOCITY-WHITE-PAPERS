# Skill: add-paper

Add a new whitepaper to the compendium.

## Inputs you need from the user

- `id` (kebab-case, e.g. `wp-17` or `arch-nexus-deep-dive`)
- `num` (display number, e.g. `17` or `A-02`)
- `category` (`paper` or `architecture`)
- `tier` (`Conceptual`, `Technical`, or `Policy & People`)
- `title` and `subtitle` in EN
- `title` and `subtitle` in FR (if FR is being authored now; otherwise the skill creates a placeholder)
- `abstract` in EN, FR
- `sections` — array of `{ n, title_en, title_fr }`
- `repo` — optional GitHub URL
- `tags` — list of strings
- `status` — `Draft` by default

If any input is missing, ask once. Do not invent.

## Steps

1. Append the entry to `data/papers.json` with the metadata only. Set `category` and `tier`. Set `_meta.placeholder: true`.
2. Create `data/papers/<id>.en.json` following the schema in `CLAUDE.md`. Populate:
   - top-level metadata
   - `hero_image` with `src` = `public/images/<id>/en/hero.jpg`, `style_kind: "cover"`, and an `image_prompt` describing the cover composition in plain English. **Do not write a `style_prompt` unless the paper needs a per-image override; the shared style in `data/image-style.json` applies by default.**
   - `audio` with `src` = `public/audio/en/<id>.mp3`
   - `tldr_presentation` with three slides minimum: a title slide, an abstract-as-quote slide, and a sections-as-list slide. Each slide must have `audio_file` and `text`. **Do not exceed three slides** unless you have specific narration material to add.
   - `embedded_presentations: []`
   - `sections` mirroring the user's input
   - `blocks` containing only a `section_heading` for §01 and a placeholder paragraph that reads: `"<strong>Content forthcoming.</strong> The body of this paper will be authored from source material and will not be auto-generated."`
3. Create `data/papers/<id>.fr.json` as a stub: same metadata shape with FR titles/sections, an `untranslated` placeholder body, and `translation_status: "untranslated"`. FR is downstream of EN polish; you do NOT need to translate the body here. The skill `translate-paper` does that later, once EN is final.
4. Run `npm run eval`. The EN side must pass strictly. The FR side will show as `untranslated` in the report; that's expected.

## Do not

- Write a full body. The placeholder is intentional.
- Add more than three TL;DR slides without explicit user direction and source material.
- Inline `style_prompt` unless the paper needs to deviate from the shared style.
- Skip the FR file. The site is bilingual.

## Validation

```bash
npm run eval
node -e "JSON.parse(require('fs').readFileSync('data/papers/<id>.en.json'))"
node -e "JSON.parse(require('fs').readFileSync('data/papers/<id>.fr.json'))"
```

Then load the site at `#/paper/<id>` and confirm:
- The library card appears.
- The detail page renders.
- The TL;DR presentation has three slides and the play button shows (audio will 404 until the next asset run; this is expected).
