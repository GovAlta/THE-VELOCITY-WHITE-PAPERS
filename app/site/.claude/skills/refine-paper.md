# Skill: refine-paper

The editorial pass. Take a drafted paper and improve it without corrupting the author's voice. This is the skill the author reaches for when he says "enhance the tone."

It exists because the previous approach failed in a specific way: Claude read the style guides, treated the author's prose as raw material, and rewrote it into a short-declarative cadence that reads as a new kind of AI smell. It also copied the guides' bad-example phrases ("Velocity is an imperative," "the weight underneath is the reason") straight into the paper. This skill is built to make both failures impossible.

## The governing principle

**The author's draft is the source of truth, not raw material to be rewritten.** Refining means making the *minimum* edits that fix what is genuinely wrong, and leaving everything else exactly as the author wrote it. When in doubt, keep his words.

If you find yourself "improving" a sentence that was true, clear, and in his voice, stop. That is the failure this skill prevents.

## Read these first

1. `../../style-guide/voice-exemplar.md` — the author's real cadence and the poison-phrase list. This is the standard you are protecting, not overwriting.
2. `../../style-guide/00-writing-style-guide.md` — the hard rules and the "Clarity for a mixed audience" section. The clarity rules apply to prose you generate (Pass 5).
3. `../../style-guide/02-substance-and-structure-guide.md` — the substance passes (truth, sourcing, numbers-carry-units). Run on substance only.
4. `../../style-guide/03-fidelity-and-sourcing.md` — completeness, and the rule that enumerations go in tables or lists, never crammed into a prose sentence.

## Inputs

- `id` — the paper to refine.
- `scope` — optional: a specific section, the abstract, or the whole paper. Default whole paper.
- The claims audit, if `draft-paper` produced one. If not, build one for the sections you touch.

## The passes, in order. Do not collapse them.

### Pass 1 — Poison-phrase scan (do this first)

Scan every reader-visible string for the poison phrases in `voice-exemplar.md` and for any sentence that reads like a quoted bad example from a style guide. Replace each with the author's plain version. This pass is mechanical and non-negotiable: these strings must not survive.

### Pass 2 — Substance (guide `02`)

For each factual claim, against the named source:
- Is it true? Does it trace to a source line?
- Is causality right (does the draft say A waits on B when A happens regardless of B)?
- Does every number say what it measures and against what?
- Any category error, any circular sentence that renames the problem instead of explaining it?

Fix the substance. This is the highest-value pass and the one most worth being aggressive on. A false sentence in the author's beautiful voice is still false.

### Pass 3 — Genuine AI tells only (guide `00` as a filter)

Remove only what should not be there:
- em dashes and en dashes → comma, period, or parenthesis
- "not X, but Y" / "this is not A, it is B" constructions
- banned vocabulary used as filler (leverage, unlock, seamless, robust, crucial, holistic, delve, paradigm, tapestry, realm, synergy, etc.)
- tetracolons and four-part parallel flourishes
- trailing participles that restate the sentence
- emojis and flourish glyphs

**What Pass 3 does not do:** it does not shorten the author's sentences, strip his commas, remove his coined terms, swap his words for "plainer" ones, or impose the short-declarative cadence. Guide `00`'s positive advice ("short sentences," "the short one carries the weight") applies to prose *you* generate, not to his. If a long flowing sentence has no banned construction in it, it is correct as written. Leave it.

### Pass 4 — Typos and grammar

Fix obvious typos, agreement errors, and dropped words (the author drafts fast: "prototcols," "quicky," "Slot" for "Slop," a trailing "with."). This is mechanical cleanup, not editing. Do not change word choice while you are at it.

### Pass 5 — Clarity for a mixed audience (on the prose you generated)

Apply the "Clarity for a mixed audience" rules in `00` to the connective and explanatory prose you wrote, the sentences that are not the author's own. Most papers are built by expanding the author's notes into full prose, and that expansion is yours. It is where dense, crammed, AI-flavoured writing creeps in.

On the prose you generated:
- Split any sentence that stacks several ideas, or a list of items, joined by commas. One idea per sentence.
- Move any list longer than three items into a table or a bulleted list. Never leave it crammed inside a sentence as a wall of commas (also required by `03-fidelity-and-sourcing.md`).
- Rewrite abstract or self-referential openers ("X holds the design honest," "the design rests on two commitments") to lead with the plain point and name the actor: "we," "the tool."
- Explain a technical term in plain words the first time it appears, or cut it.
- Read each paragraph as a smart non-specialist. If it is white noise to them, simplify it until it is not.

This pass does **not** touch the author's own sentences. His long, flowing, comma-joined prose is his voice (see Pass 3 and `voice-exemplar.md`); leave it. The clarity rules are for the prose you added around it.

## Per-string discipline

Go string by string through the reader-visible fields (title, subtitle, abstract, paragraphs, slide captions and narration `text`, pullquotes, keystat bodies, figure captions, sidenotes). For each one, the default decision is **keep**. You only change a string if it fails a pass above, and then you change the smallest amount that fixes it.

## This skill still improves flawed prose. It just improves the right things.

Preserving the author's voice does not mean leaving real defects in place. The author drafts fast and his drafts have genuine flaws: a number that does not say what it measures, a sentence that is false against the source, a dropped word, a typo, a sentence that renames the problem instead of explaining it. **Fix all of those.** That is the enhancement the author is asking for. Passes 2 and 4 exist precisely to do it.

The line is between *defects* and *voice*:

- A **defect** is wrong: false, unsupported, circular, a typo, a genuine AI tell. Fix it.
- His **voice** is his: the long flowing sentences, the comma-joined clauses, the contractions, the deliberate "leverage" or "extremely", the built-out analogies, the coined terms. Keep it, even though a rule would flag it.

When a call is genuinely ambiguous (is this a flaw or a choice?), do not decide silently. Log it as a question for the author. He stays in control of his own voice.

## Marking author prose so the scanner stops nagging

After you finish, mark the strings that are the author's own words with `author_verbatim` (see the schema note in `CLAUDE.md`): `_meta.author_verbatim: ["abstract"]` for top-level fields, or `"author_verbatim": true` on a block or slide. This tells `check-style-guide.mjs` to skip them, so a deliberate "leverage" stops producing a warning on every eval.

The marker silences the **blunt regex scanner** and signals "the voice here is locked." It does **not** freeze the prose. A later refine pass still fixes a real substance error or typo in a marked block; it just will not re-voice it. Marker = "don't impose styles here," not "never touch this."

## Output a change log

When you finish, report what you changed and why, grouped by pass. For anything you were tempted to change but were not sure about, list it as a question for the author rather than changing it. The author needs to be able to see that you fixed real problems and left his voice alone.

## Then, and only then, assets

After the EN body is refined and the author is happy, the bilingual and asset steps follow the normal workflow: `translate-paper`, then `regenerate-images`, then `regenerate-audio`. Refining text does not regenerate audio on its own; stale audio is fine until the author signs off on the text.

## Do not

- Re-voice the author. No re-cadencing, no sentence-chopping, no synonym swaps for words that were fine.
- Apply guide `00`'s positive cadence advice to the author's existing prose.
- Strike the author's coined vocabulary (skill files, harness, AI smell, red/blue/green/yellow team, Hello World templates).
- Let a poison phrase survive.
- Flip `_meta.placeholder` to `false` until a human has read the refined body aloud.
- Silently make a judgment call on a debatable edit. Log it as a question instead.

## Validation

```bash
npm run eval
node -e "JSON.parse(require('fs').readFileSync('data/papers/<id>.en.json'))"
```

Then:
- Read the refined abstract and one section aloud next to the voice exemplar. They should sound like the same person.
- Confirm no poison phrase remains: `grep -ni "is an imperative\|weight underneath" data/papers/<id>.en.json` returns nothing.
- Confirm the change log shows substance and typo fixes, not a wholesale rewrite.
