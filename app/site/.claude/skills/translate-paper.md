# Skill: translate-paper

Produce or update the FR sibling of an EN paper JSON.

## ⚑ Binding French standard (read first)

All French content must follow **[`docs/fr-style-guide.md`](../../docs/fr-style-guide.md)**
and the machine-readable lexicon **[`data/fr-lexicon.json`](../../data/fr-lexicon.json)**.
These encode the corrections returned by the Government of Alberta's francophone
reviewers (2026-06-12): Canadian / Québécois public-administration French
(OQLF-aligned), the binding term map (e.g. `contrôles de cybersécurité` not
`contrôles cybernétiques`; `appuyé par l'IA` not `piloté par l'IA`; `sécuritaire`
not `sécurisé`), Canadian typography, and a calmer register. Load
`data/fr-lexicon.json` into your working context before translating.

**Write « un français clair et accessible » (2026-06-24 reviewer note).** The
reviewers confirmed the French quality has improved significantly; the next lever
is **simpler, more direct sentence structures**. Favour short declarative
sentences over long subordinate chains, put the subject and verb early, and split
any English period that runs past ~30 words. Your goal is clear, accessible
French — not merely grammatically correct French. See style guide §2.

**Do not blow away reviewed French.** A paper with `translation_status: "reviewed"`
and `_meta.fr_review` has been corrected by humans and is authoritative. When the
EN changes, re-translate **only the blocks whose EN actually changed** (per-block
drift via `_meta.block_sigs`) and leave every other reviewed FR block untouched.
Never hard-overwrite a reviewed paper. See §6 of the style guide.

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
6. Style compliance: follow `docs/fr-style-guide.md` + `data/fr-lexicon.json`. Write **« un français clair et accessible »** — short, direct sentences, subject and verb early (§2). NOTE: the English "no em dashes / no 'not X, but Y'" rule is **English-only** — French uses the spaced em dash and `non pas X, mais Y` freely. Use Canadian typography (curly `’`, guillemets `« »`, `95 %`, `2 milliards de dollars` not `2 G$`).
7. Set `translation_status` to the right value (`draft` or `reviewed`).
8. Set `_meta.placeholder` to `false` once the body is real.
9. Run `npm run generate:images -- <id> --locale fr` to produce FR imagery conditioned on the EN PNGs.
10. Run `npm run generate:audio -- <id> --locale fr` once the FR text is reviewed.
11. Run `npm run eval`. The advisory FR status should now read `draft`, `reviewed`, or `final`.

## Style notes (superseded by docs/fr-style-guide.md — kept as a quick reminder)

- Money in prose: spell the unit — `2 milliards de dollars`, `120 millions de dollars` — **never** `M$` / `G$` (the old "`2 G$`" guidance is retired).
- `open source` is acceptable as the adjective for repos/packages; `logiciel libre` for the licensing/ethos sense.
- Government roles: "ministère", "ministre", "sous-ministre", "vérificateur"; spell out "le ministère de la Technologie et de l'Innovation" (drop the "(TI)" abbreviation in prose).
- "white paper" → "livre blanc"; numbered reference → "Livre blanc N" / "Document N", never "papier".
- AI-driven → "appuyé par l'IA"; cyber controls → "contrôles de cybersécurité"; secure services → "sécuritaires"; layperson → "personne non spécialiste". Full table in the lexicon.

## Validation

```bash
npm run eval                              # report shows FR status for this id
node -e "JSON.parse(require('fs').readFileSync('data/papers/<id>.fr.json'))"
```

Load `#/paper/<id>` with the FR locale toggled on. Read the abstract and the first TL;DR slide aloud. If it reads like a translation rather than French, revise.
