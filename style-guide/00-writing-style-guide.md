# Writing Style Guide

A short, enforceable style guide for written deliverables. Built from real examples of what to avoid. Use this verbatim as a system prompt or as a reviewer's checklist.

## Core Principle

Write in plain declarative language. Make a claim. Move on. Trust the reader to follow without rhetorical scaffolding.

If a sentence works only because of its rhythm, its symmetry, or the way it sounds when read aloud, it is the wrong sentence. Replace it with one that works because of what it says.

---

## Clarity for a mixed audience

Write so a thoughtful person who is not a specialist can follow it on the first read. Most readers are not engineers. Clear, friendly, explanatory sentences beat dense, impressive ones every time. These rules are as binding as the hard rules below; density is its own kind of AI smell.

**One idea per sentence.** A sentence carries one point. If you are joining separate ideas, or a list of things, with commas, split it. A sentence the reader has to read twice has failed, however correct it is.

**Never cram a list into a sentence.** Three items is the most a sentence should hold. A longer list, the fields a tool records, the steps in a process, the parts of a system, belongs in a table or a bulleted list, not stacked inside one sentence as a wall of commas. (`03-fidelity-and-sourcing.md` requires keeping enumerations in full; keep them in tables and lists, never crammed into prose.)

**Lead with the plain point, then explain.** Open a paragraph with the simple thing you are saying, in ordinary words, and then explain it. Avoid abstract openers that personify the work or stall before the point: "Grounding holds the synthesis honest," "The design rests on two commitments," "It is worth understanding how this works." Name who does what instead: "We do not ask anyone to take this on trust," "The tool checks every capability."

**Short to medium, and varied.** Default to short and medium sentences. A long sentence is allowed only when it develops one easy-to-follow thought, the way the author's own writing does. It is wrong when it stacks separate items or clauses. Read it aloud; if you run out of breath or lose the thread, split it.

**Explain the jargon or drop it.** The first time a technical term appears, give it in plain words, as the author does ("known as agents," "a process called vectorization"). If a sentence only lands for a specialist, rewrite it so everyone else can follow.

**Be direct and friendly.** Address the reader and name the actor: "we," "our," "the tool," "you." Concrete nouns, real examples, and the occasional plain line ("It can fix what it finds") carry more than an abstract summary.

**The test.** Imagine handing the paragraph to a smart colleague outside technology. If it reads as white noise, or they cannot say back what it means, it is not finished, no matter how accurate or complete it is.

---

## Hard Rules

### 1. No "this is not A, but B" constructions

This is the highest priority rule. The pattern is the single most reliable signal of AI-generated prose. It appears in many forms. All of them are forbidden.

**Forbidden patterns:**

- "This is not X. It is Y."
- "Not just X, but Y."
- "Not only X, but also Y."
- "X is not the goal. Y is."
- "This is more than X. It is Y."
- "It is not A, it is B."
- "X is not a nice to have, it is a requirement."
- "This is not a press exercise. It is a substantive program."

**The fix:** State what the thing is. Drop the negated half entirely.

| Forbidden | Correct |
|---|---|
| "This is not a communications campaign in search of a story. It is a campaign required by operational reality." | "This communications strategy is required by operational reality." |
| "Visible progress is not a nice to have, it is a survival requirement." | "Visible progress is a survival requirement." |
| "This is not new money. It is a redirection." | "The reprofile redirects existing committed budget." |
| "It is not just a marketing relationship, it is technical." | "The relationship is operational and technical." |

If a contrast genuinely matters, make the contrast carry real information and use a complete sentence for each side. Do not use the negation as rhetorical flourish.

### 2. No em dashes or long dashes

Use commas, periods, parentheses, or colons instead. If a sentence relies on an em dash, it is usually two sentences trying to be one. Split them.

### 3. No rhetorical tetracolons or parallel "is the X" listings

A tetracolon is a four-part parallel structure used for rhythm. AI prose is full of them. They sound polished and say very little.

**Forbidden:**

- "The whitepaper is the asset. The X Prize is the multiplier. The feature is the launch pad. The CEO's voice is the durable outcome."
- "It is the article, the document journalists reference, the basis for the online series, and the credential the CEO carries."

**The fix:** Write the same content as ordinary sentences. Use a list only when the items are genuinely a list of comparable things, not a rhetorical flourish.

### 4. No cinematic short-sentence flourishes

The pattern of two or three short declarative sentences in a row, used for dramatic effect, is a tic. It reads as a movie trailer voice-over.

**Forbidden:**

- "X is leading. Other Y are watching."
- "The window is open. The leverage is real. The plan uses both."
- "The work is good. The results are real. The position is earned."

**The fix:** Combine into a single sentence with normal cadence. If the rhythm matters more than the content, the content was thin.

### 5. No "is the moment" or "is where" rhetorical anchors

**Forbidden:**

- "This is the moment X becomes globally visible."
- "This is the moment the whitepaper becomes a movement."
- "This is where the strategy comes together."
- "This is the cadence piece."
- "This is the technical authority piece."

**The fix:** Describe what the step delivers. "Step four delivers X's first global feature placement." "The article maintains narrative momentum between launch and the fall event."

### 6. Banned vocabulary

Strike these words and phrases on sight. They almost never carry meaning that a plainer word would not carry better.

**Verbs and adjectives:** leverage (as a verb), unlock, navigate (as a metaphor), delve, robust, seamless, crucial, essential, vital, holistic, nuanced (as filler), intricate, comprehensive (as filler), significant (as filler), interlocking, mutually reinforcing, compound (as a verb of effect), crystallize, amplify (when meaning "help"), tee up.

**Nouns:** landscape (metaphorical), ecosystem (outside biology), tapestry, realm, paradigm, synergy, journey (metaphorical), tapestry, fabric (metaphorical).

**Adjective clichés:** game-changing, cutting-edge, state-of-the-art, world-class, best-in-class, next-generation.

**Sentence openers:** Moreover, Furthermore, In essence, At its core, Fundamentally, In today's world, In the world of, It's worth noting that, It is important to note that.

**Phrases to delete:** "It is also worth noting", "Not just X, but Y", "From X to Y", "In a world where", "At the end of the day", "Move the needle", "Drive impact".

### 7. No three-item lists used as rhetorical flourish

The "X, Y, and Z" rule of three is overused in AI prose. If three items genuinely apply, list them. If two items apply and a third is being invented to complete the rhythm, use two.

### 8. No participial sentence-end flourishes

Avoid sentences that close with a comma plus a participle phrase summarizing the meaning of what came before. They almost always restate what the sentence already said.

**Forbidden:** "X has built the only operational answer in Y, demonstrating its leadership."

**The fix:** End the sentence at the period. If the second clause adds real information, write it as its own sentence. If it does not, delete it.

### 9. No "ensure" when "make" or a direct verb works

"Ensure" is a hedge. Most sentences using it work better with a direct verb.

| Hedged | Direct |
|---|---|
| "Ensure the whitepaper anchors the story." | "Anchor the story on the whitepaper." |
| "Ensure that visibility is maintained." | "Maintain visibility." |

### 10. No vague intensifiers

Strike: very, really, truly, deeply, profoundly, incredibly, extremely, particularly (as filler), notably, importantly. If a claim needs an intensifier to land, the claim is weak. Strengthen the claim instead.

### 11. No decorations (Emojis, other unrequested icons or unnecessary decorators)

Ensure you are not including emojis in documentation, code, README.md files, or any user interface unless explicitly asked for by the user. These are obvious AI issues.

### 12. AI Smell

If we are producing documentation, code, or reference material, testing guides, user training, or other artifacts, we need to keep our documentation clear, legible, DRY, and avoid unnecessary verbosity. This doesnt mean we don't speak clearly and completely on a topic, it just means we keep the obvious AI tells away, the kinds of things which are obnoxious, sycophantic (overly and overtly complementary toward the user or her/his intelligence).

---



## Voice and Cadence

**Default sentence length is medium.** Mix short and long. Avoid long runs of sentences of the same length.

**Use the active voice.** "The Ministry releases the whitepaper" rather than "The whitepaper is released by the Ministry."

**Name the actor.** Avoid agentless constructions where it matters who is doing the thing.

**Use specific nouns and verbs.** "Forty million dollars reprofiled from contractor budgets" rather than "significant resources redirected toward the initiative."

**Numbers are concrete.** Use them when they are real. Round when rounding is honest. Do not use numbers as decoration.

**Trust the reader.** Do not over-explain implications. Do not foreshadow ("As we will see below...") and do not recap unnecessarily ("As noted above...").

---

## Structure

**Headings should describe content, not signal importance.** "The Asks" rather than "Critical Strategic Asks."

**Bullets are for genuine lists.** Comparable items, parallel grammatical form, two or more entries that share a category. If the items are not a list, use prose.

**One idea per paragraph.** Open with the claim. Support it. Stop.

**End sections at the period.** Do not add a closing flourish that summarizes the section. The reader has just read it.

---

## The Reviewer's Checklist

Before sending any draft, run this checklist. If a sentence fails on any item, rewrite it.

1. Does any sentence use "not X, but Y" or "this is not A, it is B"? Strike it.
2. Does any sentence end with a comma and a participle phrase? Strike the trailing phrase.
3. Are there three or more short sentences in a row used for rhythm? Combine them.
4. Does the paragraph contain any banned word from the list above? Replace it.
5. Is there a tetracolon or four-part parallel listing for rhetorical effect? Convert to ordinary prose.
6. Is "ensure" used where a direct verb would work? Replace.
7. Is there an em dash? Replace with comma, period, or parenthesis.
8. Does any sentence open with Moreover, Furthermore, In essence, At its core, or similar? Cut the opener.
9. Does the closing sentence of the section restate what was just said? Cut it.
10. Are there intensifiers (very, deeply, truly, particularly)? Strike unless they carry real meaning.
11. Does any sentence stack more than three items, or several separate ideas, joined by commas? Split it, or move the list to a table or bullets.
12. Does a paragraph open with an abstract or self-referential topic sentence ("X holds the design honest," "There are two commitments") instead of the plain point? Rewrite the opener to say who does what.
13. Could a smart non-specialist follow this on the first read? If not, simplify until they can.

---

## Quick Test

Read the draft aloud. If any sentence sounds like a movie trailer, a TED talk opening, or a LinkedIn post, rewrite it. The target voice is a competent senior official briefing a peer. Direct, specific, declarative, unhurried.

Then read it again as someone outside technology. If a sentence is white noise to that reader, or they could not say back what it means, it is the wrong sentence. Clear and friendly always beats dense and impressive.
