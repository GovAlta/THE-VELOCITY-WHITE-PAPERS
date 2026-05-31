# Skill: translate-paper

Produce or update the FR sibling of an EN paper JSON.

## When to invoke this skill

Only AFTER the EN paper is final. The workflow is EN-first: polish the EN paper, generate EN assets, iterate until you and the user are happy, THEN translate.

If the user asks you to translate a paper whose EN body is still placeholder, stop and confirm: "the EN body is still marked placeholder — do you want me to translate the placeholder text, or wait for EN to be finalized?"

## Inputs

- `id` of the paper (e.g. `wp-01`)
- Translation mode:
  - `human` — user is supplying FR copy directly
  - `ai-reviewed` — you draft, user reviews before set to `"final"`
  - `ai-direct` — you draft and the result is final without further review (use rarely)

## Translation status field

Every FR file has a `translation_status` field. Update it as work progresses:

| Value          | Meaning |
|----------------|---------|
| `untranslated` | Default for stub FR files. Only metadata and TL;DR slides are translated; the body is a "translation forthcoming" placeholder. |
| `draft`        | A first translation pass has been written but not reviewed. |
| `reviewed`     | A human has reviewed the translation. |
| `final`        | Ready for public consumption. |

## Steps

1. Read `data/papers/<id>.en.json`. Confirm `_meta.placeholder` is `false`.
2. Read `data/papers/<id>.fr.json` (it always exists as a stub).
3. Translate these reader-visible strings, preserving the JSON structure exactly:
   - `title`, `subtitle`, `abstract`
   - `sections[].title`
   - `hero_image.alt`
   - `tldr_presentation.title`, `slides[].title`, `caption`, `subcaption`, `text`, `visual_config.items[].label/desc`, `visual_config.text/cite`, `visual_config.stat_label`, etc.
   - `blocks[]` text content (`paragraph`, `pullquote.text/cite`, `keystat.label/body`, `figure.title/caption`, `sidenote.label/value`)
   - `_meta.notes`
4. Do NOT change:
   - `id`, `num`, `tier`, `category`, `status`, `published`, `reading_min`, `tags`, `repo`
   - `sections[].n`, slide `id`s, block `n`s
   - `audio_file` paths beyond the `/en/` → `/fr/` swap
   - `hero_image.src` beyond the `/en/` → `/fr/` swap
   - `figure.image.src` beyond the same swap
5. For each slide's `image_prompt` (if any): translate textual labels inside the prompt to French, but keep the composition description in English. Add at the end: `"All text labels in French. Match the composition of the English version of this image exactly; only the text labels change."`
6. Style guide compliance: French content follows the same `00-writing-style-guide.md` discipline. No em dashes. No "not X, but Y". Plain declarative French.
7. Set `translation_status` to the right value (`draft` or `reviewed`).
8. Set `_meta.placeholder` to `false` once the body is real.
9. Run `npm run generate:images -- <id> --locale fr` to produce FR imagery conditioned on the EN PNGs.
10. Run `npm run generate:audio -- <id> --locale fr` once the FR text is reviewed.
11. Run `npm run eval`. The advisory FR status should now read `draft`, `reviewed`, or `final`.

## Style notes

- Canadian French conventions for numbers and currency (`2 G$` not `2 Mrd€`).
- "logiciel libre" rather than "open source".
- Government roles: "ministère", "ministre", "sous-ministre", "vérificateur".
- "whitepaper" → "livre blanc".
- "paper" (numbered) → "livre" with the number ("livre 1"), not "papier".

## Validation

```bash
npm run eval                              # report shows FR status for this id
node -e "JSON.parse(require('fs').readFileSync('data/papers/<id>.fr.json'))"
```

Load `#/paper/<id>` with the FR locale toggled on. Read the abstract and the first TL;DR slide aloud. If it reads like a translation rather than French, revise.
