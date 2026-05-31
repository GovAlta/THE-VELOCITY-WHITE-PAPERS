# Authoring Guide

You are about to write a whitepaper for this compendium. This guide is the field manual. Read it once before you start, then keep it open in a tab.

Three other files matter:

- `STRUCTURE.md` — what the codebase is and where things live.
- `CLAUDE.md` — the contract; the hard rules. Includes the full "Writing style — the hard rules" section that you must clear every reader-visible string against. **Read it before you write any prose.**
- `style-guide/00-writing-style-guide.md` (one directory above) — the prose-quality rules in their original long form. The CLAUDE.md section is the operational version of that guide; both say the same things.

This guide answers a different question: how do I write a good paper here, end to end.

---

## The shape of a finished paper

A good paper in this compendium has four layers stacked from short to long:

1. **The card** — a single sentence the reader sees in the library grid. Two lines max.
2. **The abstract** — a paragraph, 80 to 140 words, that names the problem and the answer. Front-page-of-newspaper voice.
3. **The TL;DR presentation** — three to six narrated slides totalling roughly four to six minutes of audio. This is the paper for someone who will not read it.
4. **The body** — the actual paper. Eighteen to thirty-five minutes of reading. Six to ten sections. Two to five paragraphs per section.

Write them in that order. Each layer constrains the next.

---

## The minimum bar a paper has to clear

A paper is ready to ship when all of the following are true:

- The English JSON parses and `_meta.placeholder` is `false`.
- The abstract is a real abstract (not a copy of the subtitle).
- Every TL;DR slide has a `text` field at least two sentences long.
- Every TL;DR slide has its MP3 generated (`public/audio/en/<id>-tldr/<NN>.mp3`).
- The hero image is generated and the inspector shows the prompt that produced it.
- The body has at least six `section_heading` blocks, each followed by at least one `paragraph`.
- At least one of: a `pullquote`, a `keystat`, a `figure`, or a `sidenote`. A paper with no visual punctuation reads as a wall.
- `npm run eval` passes for that paper.
- A human has read the body aloud at least once.

Good papers go beyond the bar in three places:

- The TL;DR slides each show a different visual type (`title` → `stat` → `list` → `quote` → `compare` → `title`). Variety carries the listener.
- The body uses a dropcap on the opening paragraph and at least two of: pullquote, keystat, figure. Visual rhythm carries the reader.
- The narration is read like a person speaking, not a person reading. Short sentences. No abbreviations. Comma where the listener needs a breath.

---

## How to write the TL;DR presentation

This is the hardest part because the narration script is the most exposed surface. The whole world hears it. Aim higher here than anywhere else in the paper.

### Structure

Six slides is a good target. The shape:

| Slide | Visual | Purpose | Narration length |
|---|---|---|---|
| 01 | `title` | Frame the paper. Name it. State the question. | 30–45 s |
| 02 | `stat`  | The number that justifies the whole paper. | 25–35 s |
| 03 | `list`  | The components of the answer or the cast of characters. | 35–50 s |
| 04 | `quote` | The one sentence you want everyone to remember. | 20–30 s |
| 05 | `compare` | The contrast that resolves the tension. | 35–50 s |
| 06 | `title` | The reframe. What changes after reading. | 25–40 s |

Total: about four to five minutes. Look at `data/papers/wp-01.en.json` for a worked example.

### Writing the `text` field

This is the script the TTS reads aloud. It is not body prose. Different rules apply:

- **Short sentences.** Twelve to eighteen words max. Periods, not commas, where you'd naturally pause.
- **No symbols.** "$2.1B" becomes "two point one billion dollars". "EPA" becomes "the act". Abbreviations sound wrong.
- **No "click here", "see below", or "as we saw".** The listener has no document to reference.
- **No parentheticals.** They break the cadence.
- **Round numbers when it doesn't lie.** "Roughly a billion" reads better than "$1.04B".
- **Read it aloud before generating audio.** If you stumble, the listener will.

You can preview the script without committing it to the paper JSON:

```bash
npm run gen:audio -- --text "Paper one. The Ship of Theseus." \
                    --out scratch/take-1.mp3
```

The MP3 lands at `scratch/take-1.mp3`. Iterate freely.

### Visual configs

Each visual type has its own `visual_config` shape:

- `title` — no config; uses `caption` + `title` + `subcaption`.
- `stat` — `{ stat_value: "$2.1B+", stat_label: "Credible floor over a decade" }`. Use `subcaption` for the supporting sentence.
- `list` — `{ items: [{ label: "8,000+ committers", desc: "Built across many languages…" }, …] }`. Three to six items reads well; more crowds the slide.
- `quote` — `{ text: "…", cite: "Paper N — Title" }`. Keep under 18 words; punchy is the point.
- `compare` — `{ left: { label, body }, right: { label, body } }`. Mirror the grammar between the two sides.
- `image` — `slide.image: { src, alt, image_prompt, style_kind: "diagram" }`. The composition lives in `image_prompt`.

---

## How to write the body

### Block types in order of usefulness

```
section_heading      — every section starts with one
paragraph            — the workhorse; two to five per section
dropcap_paragraph    — exactly once, on the opening paragraph
pullquote            — once or twice per paper; the line you want quoted
keystat              — once or twice; the number that proves the argument
figure               — for any visual that needs a caption (chart or image)
sidenote             — once or twice; a 30-word aside on the right rail
tag_row              — at the end of the body, before related
related              — at the very end; renders the "Read next" tiles
presentation         — optional embedded mini-player inside a section
audio                — optional standalone audio block
```

### Pacing

Hold to these unless you have a reason not to:

- **6–10 sections** per paper. Each section has a one-line title in `paper.sections[].title` that mirrors `block.type=section_heading`.
- **2–5 paragraphs per section.** A 1-paragraph section is a sidebar pretending to be a section; merge it.
- **80–160 words per paragraph.** Above 200 the reader bails.
- **One `keystat` or `pullquote` every two or three sections.** They are seasoning.
- **Total body length: 1,800 to 3,500 words** for a typical paper. Estimate one reading minute per 200 words; set `reading_min` honestly.

### How to choose between blocks

- A *number* that justifies the section → `keystat`. Reserve for one or two per paper.
- A *sentence* you'd put on a billboard → `pullquote`. Once per paper, max twice.
- A *chart* the reader needs to look at → `figure` with `chart.kind`.
- A *photo or illustration* with a caption → `figure` with `image`.
- A 30-word *aside* the reader can skip → `sidenote`.
- A *narrated visual sequence* inside a section → `presentation` (use `embedded_presentations[]`).

If you would put a thing in a footnote, it's a `sidenote`. If you would put a thing in a callout box, it's a `keystat`.

### Style discipline

The hard rules are in `CLAUDE.md` under "Writing style — the hard rules". Read that section in full before writing prose. The twelve-line cheatsheet:

1. No "not X, but Y" / "this is not A, it is B" constructions.
2. No em dashes (—) or en dashes (–).
3. No tetracolons or four-part parallel structures for rhythm.
4. No two or three short cinematic sentences in a row.
5. No "is the moment" / "is where" rhetorical anchors.
6. No banned words: leverage, unlock, seamless, robust, crucial, holistic, navigate (metaphor), delve, paradigm, ecosystem (outside biology), tapestry, realm, synergy, journey (metaphor), cutting-edge, game-changing, world-class, etc.
7. No trailing participle that restates what the sentence said.
8. No "ensure" where a direct verb works.
9. No vague intensifiers (very, truly, deeply, profoundly, particularly).
10. No decorations (emojis, flourish glyphs).
11. Active voice; name the actor; specific nouns and verbs.
12. End sections at the period; no summarizing closer.

Then read the draft aloud. If a sentence sounds like a movie trailer, a TED-talk opening, or a LinkedIn post, rewrite it. Target voice: competent senior official briefing a peer.

`npm run eval` runs an automated scan for em dashes, banned words, and intensifiers. It produces warnings, not failures. Every warning is a real candidate for revision. Final judgement is yours.

---

## How to author image prompts

You have two layers to control: the **style** (consistent across the collection) and the **subject** (specific to this image).

### Style — almost never override

The style prompt lives in `data/image-style.json` under one of three keys:

- `cover` — editorial hero illustrations.
- `diagram` — architectural flowcharts with crisp legible labels.
- `default` — generic; used by slide imagery.

Pick the right `style_kind` on your `hero_image` or `figure.image` and the right preset applies. Almost never write a per-image `style_prompt` override; you'd be drifting from the collection's visual language.

### Subject — your job

The `image_prompt` is the composition. Write it like you're briefing an illustrator:

- Name every object and its position. "A wooden ship at sea, planks being replaced one at a time by carpenters while it moves forward."
- Name labels you want rendered. "A horizontal chain of fourteen rectangles labelled L01 to L14."
- Avoid adjectives that have no visual content ("compelling", "powerful", "modern").
- For French twins, end with: "All text labels in French. Match the composition of the English version exactly; only the text labels change."

### Iterating on a prompt

You can generate a one-off image without editing any paper JSON:

```bash
npm run gen:image -- \
  --prompt "A wooden ship at sea, planks being replaced mid-voyage by carpenters" \
  --out scratch/ship-take-1.jpg \
  --style cover
```

The JPG lands at `scratch/ship-take-1.jpg`. The source PNG and a `.meta.json` sidecar land next to it. Iterate until the composition is right, then copy the prompt into your paper JSON's `image_prompt` and run the full `generate:images` to produce the proper locale-suffixed outputs.

### Producing the French twin

Once the EN PNG exists you can condition the FR image on it:

```bash
npm run gen:image -- \
  --prompt "Schema with French labels; same composition as the reference" \
  --out public/images/<id>/fr/hero.jpg \
  --ref  public/images/<id>/en/hero.source.png \
  --locale fr
```

The reference image keeps the composition consistent; the new prompt swaps the labels.

---

## The full author workflow

A from-scratch paper, end to end:

1. **Add the inventory entry.** Append to `data/papers.json` with the metadata. Set `_meta.placeholder: true` for now (we'll flip it last).
2. **Create the EN stub.** Use the `add-paper` skill or copy `data/papers/wp-01.en.json` as a template. Adjust id, num, tier, category, title, subtitle, abstract, sections, hero image prompt, TL;DR presentation. Leave the body with the placeholder paragraph for now.
3. **Create the FR stub.** Same shape, FR title and sections; mark `translation_status: "untranslated"`. The body stays placeholder until EN is final.
4. **Generate the hero image.** `npm run generate:images -- <id> --locale en`. View it. Iterate the prompt by editing `hero_image.image_prompt` and re-running with `--force`. Or use `npm run gen:image` to experiment freely first.
5. **Iterate the TL;DR.** Write each slide's `text`. Preview with `npm run gen:audio -- --text "…" --out scratch/take.mp3`. When happy, run `npm run generate:audio -- <id> --locale en --tldr-only`.
6. **Open the site.** `npm run dev` then `#/paper/<id>`. Watch the TL;DR end to end at least twice. The first watch tells you what to fix; the second confirms the fix worked.
7. **Write the body.** Six to ten sections. Two to five paragraphs each. Sprinkle one or two of pullquote / keystat / figure / sidenote per paper.
8. **Generate the long-form narration (optional).** `npm run generate:audio -- <id> --locale en` produces a full-paper MP3 from abstract + body. Useful for accessibility; optional.
9. **Run `npm run eval`.** Fix every hard failure. Read the style-guide warnings and decide each one.
10. **Flip `_meta.placeholder` to `false`.** Set `status` to `Published`.
11. **Hand off for FR translation.** Use the `translate-paper` skill.

---

## How to read the evals

`npm run eval` prints a status table per paper plus six checks:

| Check | Pass condition |
|---|---|
| bilingual-parity | EN file parses; required fields present; locale paths consistent. FR side reported as `untranslated` / `draft` / `reviewed` / `final`. |
| image-metadata   | Every JPG on disk has a sidecar with prompts. Generated by `generate-images` automatically. |
| audio-coverage   | Every EN slide's declared MP3 exists on disk. Placeholder papers are exempt. |
| prompt-provenance| Every image declared in JSON has `image_prompt` and `style_kind`. |
| narration-text   | Every audio-declaring slide has a `text` field at least 20 chars. |
| style-guide      | Warning-only. Banned words, em dashes, AI tells. |

The eval is the release gate. A paper without a passing eval is not ready.

---

## What good looks like

Read `data/papers/wp-01.en.json` end to end. That is the reference. It has:

- A 130-word abstract that names the problem and the answer.
- Six TL;DR slides covering five different visual types.
- A body with six sections, two to four paragraphs each, opened by a dropcap, anchored by one `keystat` and one `pullquote`, decorated with one `sidenote` and one `figure`, closed by a `tag_row` and a `related` block.
- A hero image prompt that an illustrator could brief from.
- Narration scripts that read aloud cleanly.

If your paper does each of those, it will be a good paper.
