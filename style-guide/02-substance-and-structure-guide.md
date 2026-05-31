# Substance and Structure Guide

A companion to the Writing Style Guide. The first guide governs how a sentence sounds: banned words, forbidden constructions, rhythm tics. This guide governs whether a sentence is true, whether it carries information, and whether the paragraph around it holds together.

The two guides catch different failures. A sentence can pass every rule in the first guide and still be false, circular, or empty. "The benchmark was forty per cent" has no banned words, no em dash, no tetracolon, and tells the reader nothing. This guide is for that sentence.

Use both guides together. Run this one first.

## Core Principle

Every sentence has to earn its place twice: once by being true, once by carrying information the reader did not already have. A sentence that restates the previous sentence, labels a thing without explaining it, or asserts a number without saying what the number measures has failed, no matter how clean it reads.

When you do not have a fact, do not reach for a phrasing that sounds like one. A confident sentence covering a gap is worse than an honest gap, because it survives editing while a gap gets filled.

---

## The Method: run these passes in order

Most rework comes from collapsing three separate jobs into one. Separate them. Do them in this order. Do not start prose until the first two are done.

### Pass 1: The claims audit (before writing any prose)

List every factual claim the draft will make. For each one, name the source line that supports it. A claim with no source is a defect, not a detail to smooth over.

The audit surfaces three failures that are nearly invisible once they are wrapped in finished sentences:

1. **Unsupported specifics.** A number, a count, a characterization of who did what, that the source does not actually state. Example from a real draft: the source said "most of the cohort would not have called themselves software engineers." The draft said "a hundred people who had never shipped software." Different claim, not supported, and it survived four rounds of style editing because it read well.
2. **Inverted or invented causality.** The draft asserts that A waits on B when in fact A happens regardless of B. Example: "nothing reaches the public until the software is built" was false. The regulation comes into force on its own date whether or not the software is ready. The whole pressure of the situation was backwards.
3. **Category errors.** The sentence describes a thing doing something it cannot do. Example: "the public cannot use a rule." The public does not use rules. It gains access to services or has to comply with obligations.

If you cannot produce the claims list, you do not understand the material well enough to write about it yet.

### Pass 2: The logic pass (sentence by sentence, before style)

Read each sentence in isolation and ask:

- **Is it true?** Against the source, not against what sounds plausible.
- **Is it circular?** "The reason for the slowness is the weight underneath" explains nothing; it renames the problem. "Velocity is an imperative" asserts importance without saying what is at stake.
- **Does it carry new information,** or restate the sentence before it?
- **Does the number say what it measures?** "Forty per cent" of what? "Forty per cent passed" is a fact; "the benchmark was forty per cent" is a fragment of one.
- **Would a domain expert wince?** If someone who knows the material would say "that is not quite how it works," fix it before it ships.

### Pass 3: The style pass

Only now apply the first guide. Banned words, forbidden constructions, rhythm. A sentence that fails Pass 1 or Pass 2 is not worth styling; styling it just makes the wrong thing harder to spot.

---

## Hard Rules

### 1. Name what a thing is, never what it is not

Anything can be described by what it is not, and the description says nothing. A whitepaper is not an elephant, a trumpet, or a bagel. Listing absences is not definition.

This extends the first guide's "no not-X-but-Y" rule from rhetorical contrasts to definitions. The first guide bans the flourish. This bans defining by negation at all.

| Forbidden | Correct |
|---|---|
| "This paper is not about building the scaffolding." | "This paper takes the scaffolding as given and covers what is assembled around it." |
| "The harness is the workbench, not the workpiece." | "The harness is the workbench; the application is the piece taking shape on it." |
| "A template is more than a sample application." | "A template carries the whole setup pre-configured." |
| "The order is not the order the code is laid out in." | "The order follows the path someone probing the system would walk." |

Exception: a factual negative that is itself the information. "The session token lives in a cookie the page's JavaScript never reads" states a real security property. "Keys held in a managed store rather than in environment files" names the specific wrong place that matters. The test: is the negative the content, or is it standing in for a positive you have not written?

### 2. Every number carries its unit of meaning

A number alone is decoration. State what it counts and against what.

| Forbidden | Correct |
|---|---|
| "The benchmark before this was forty per cent." | "Before this, only four in ten applications cleared the bars on first release; the rest came back for rework." |
| "It held 338 agents." | "It held three hundred and thirty-eight agents at once, each one observable." |
| "Coverage is at 81 suites." | "Seven hundred and seventy-three tests across eighty-one suites." |

A number the reader cannot picture the meaning of has not been used. It has been displayed.

### 3. No label-drop in place of explanation

Naming the technical term for a thing is not explaining the thing. The label is the least informative sentence available.

| Forbidden | Correct |
|---|---|
| "The technical term is technical debt." | "Each year the code grows harder to read and test, and the cost of that accumulation is what the field calls technical debt." |
| "This is the observer pattern." | "Each part registers to be told when the value changes, the arrangement the field calls the observer pattern." |

If the label is worth giving, give it inside a sentence that does the explaining. Never as a sentence of its own.

### 4. No word-music standing in for a claim

A sentence built from balanced clauses or repetition can feel meaningful while asserting nothing checkable. The tell: you cannot say whether it is true, because it does not make a claim.

**Forbidden:** "The lived experience is a system that every senior engineer describes in their own words, that no two engineers describe alike, that bends and sometimes breaks under the weight of one more addition."

That sentence sounds like insight. Test it: what does "no two engineers describe it alike" tell the reader about technical debt? Nothing. It is rhythm.

**The fix:** state the actual consequence. "No single person holds the full picture of an old system anymore. The few who understand a given part are scarce, and a change in one place can break something in another that nobody knew was connected."

### 5. No circular or self-referential sentences

A sentence that explains a thing by renaming it has done no work.

| Forbidden | Correct |
|---|---|
| "The reason for the slowness is the weight underneath." | "Every new change takes longer than the last and risks breaking something that works, because of how much has piled up beneath it." |
| "Velocity is an imperative." | "A regulation comes into force on a fixed date, and the system that delivers the program behind it has to exist by then." |

If removing the sentence loses no information, it was circular. Cut it.

### 6. No throat-clearing or meta-narration

Sentences that announce what the document is about to do, or comment on the document itself, delay the content.

**Forbidden:** "The practical question is...", "It is worth asking...", "This brings us to...", "The next section will...", "is the job", "is what this collection is named for".

**The fix:** make the point. The reader does not need to be told a point is coming; they need the point.

### 7. Do not inherit. Re-derive.

When rewriting an existing draft, treat it as a suspect, not a source. Every claim in it has to re-trace to the ground truth on its own. A phrase that has survived several versions is not thereby true; it may be an error that nobody re-checked. Most of the worst errors in a rewrite are inherited from the draft and waved through because they were already there.

---

## Paragraph-Level Analysis

A paragraph is sound when it makes one claim, supports it, and stops. Run these checks on every paragraph.

**One claim per paragraph.** Name the claim in a word. If the paragraph has two unrelated claims, split it. If it has none, cut it.

**The opening sentence is the claim.** The rest supports it. A paragraph that opens with a supporting detail and arrives at its point three sentences later should be reordered.

**Each sentence advances the one before.** If sentence three could be deleted and the paragraph loses nothing, delete it. Watch for the same point stated at the top and again at the bottom in different words.

**The paragraph stops at the point.** No closing sentence that restates what the paragraph just said. The reader was there for it.

**Two adjacent paragraphs do not open the same way.** Identical opening clauses in neighbouring paragraphs, or an abstract and a section that begin with the same sentence, signal that one of them is redundant. Each must do its own work. An abstract may preview the body; it may not repeat the body's opening sentence.

**The setup-and-payoff test.** If a paragraph opens on a symptom ("changes take longer and risk breakage") and closes on the mechanism ("because old systems have hidden connections nobody tracks"), that is sound: the close earns the open. If it opens and closes on the same statement, the close is redundant.

---

## The Combined Reviewer's Checklist

Run the first guide's checklist for style. Run this one for substance and structure. This one first.

1. Does every factual claim trace to a source line? If not, cut it or flag it.
2. Is any causality inverted? Does the draft say A waits on B when A happens regardless of B?
3. Any category errors? A thing described doing something it cannot do?
4. Is any sentence circular, renaming the problem instead of explaining it?
5. Does every number say what it measures and against what?
6. Is any technical term dropped as a bare label instead of explained inside a sentence?
7. Is any sentence word-music, balanced or repetitive but making no checkable claim?
8. Does any sentence define a thing by what it is not, where a positive statement would carry the meaning?
9. Does each paragraph make one claim, open with it, and stop at it?
10. Do any two adjacent paragraphs, or the abstract and first section, open the same way?
11. Does any paragraph's closing sentence restate what it already said?
12. In a rewrite: has every inherited claim been re-checked against the source, rather than waved through because it was already there?

---

## Quick Test

Take any sentence and ask two questions. Can I check whether it is true? Does it tell the reader something the sentence before it did not? If the answer to either is no, the sentence is not finished, however well it reads. Fix the substance first. Style it last.
