# Guía de estilo y léxico EN → ES — Libros blancos Velocity

**Authoritative Spanish style guide for the Velocity White Papers.** Companion to
the machine-readable [`data/es-lexicon.json`](../data/es-lexicon.json), which the
translation tooling loads into the model prompt. Mirrors the structure of the
French guide but targets **neutral international Spanish** for public
administration — readable in both Spain and Latin America.

> **Why neutral Spanish.** The white papers are drawing international interest, so
> the Spanish edition avoids strong regionalisms and follows RAE guidance where
> Spain and Latin America diverge, choosing the form that reads naturally to the
> widest audience. It is calm, clear, institutional public-service Spanish.

---

## 1. Register and tone

- Write **neutral, institutional Spanish** in the first person plural (*nosotros*,
  *Alberta*). Address the reader with *usted*.
- **Plain language:** short declarative sentences; put the subject and verb early;
  prefer the everyday word over the learned one (*una persona no especialista*,
  not *un profano*). Split English periods longer than ~30 words.
- **Soften incidental metaphor.** The English leans on siege/war imagery; keep a
  metaphor only when it is the paper's organizing image (the *Ship of Theseus*,
  the *four-headed hydra*), otherwise translate the meaning, not the figure.
- **Do not name AI vendors gratuitously.** Keep a vendor/product name only when it
  is substantive and cited.
- **Quotations are verbatim.** Reproduce a direct quote in its original language;
  never translate quoted speech attributed to a person.

## 2. Typography (Spanish / RAE)

| Element | Rule | Example |
|---|---|---|
| Opening marks | Inverted `¿` / `¡` open questions and exclamations | `¿por qué?`, `¡atención!` |
| Quotation | Comillas latinas `« … »` for quotes | `« deuda técnica »` |
| Colon | **No** space before the colon (unlike French) | `Autores: …` |
| Percent | Space before `%` | `95 %`, `78,2 %` |
| Decimals | Comma | `78,2 %` |
| Thousands | Space | `5 000`, `189 millones` |
| Money | Spell the unit; **never** `M$`/`B$` | `120 millones de dólares`, `2000 millones de dólares` |
| "billion" | English *billion* = **mil millones** | `$2 billion` → `2000 millones de dólares` |
| Em dash | Spaced em dash allowed | `dos transformaciones — el PAPHA y Care First — …` |

## 3. Lexicon (binding term map)

Use the **es** column; the **avoid** column lists calques to reject. Full
machine-readable version in [`data/es-lexicon.json`](../data/es-lexicon.json).
Highlights:

| English | Preferred ES | Avoid |
|---|---|---|
| white paper | libro blanco | papel blanco |
| the Velocity white papers (brand) | los libros blancos Velocity | (don't translate "Velocity") |
| technology estate | el patrimonio tecnológico / el parque tecnológico | — |
| legacy systems | sistemas heredados / sistemas antiguos | sistemas legados |
| technical debt | deuda técnica | — |
| AI-driven / AI-powered | asistido por la IA / impulsado por la IA | pilotado por la IA |
| cyber controls | los controles de ciberseguridad | controles cibernéticos |
| secure / safe (services) | seguro | — |
| layperson | una persona no especialista | profano |
| data breach | una filtración de datos | — |
| ransomware | un programa de secuestro (ransomware) | — |
| open source (adj.) | de código abierto / open source | — |
| Ministry of Technology and Innovation | el Ministerio de Tecnología e Innovación | añadir "(TI)" en prosa |
| public servants | los funcionarios públicos / el personal del sector público | — |
| Government 3.0 | Gobierno 3.0 | — |

Numbered cross-references: **`Libro blanco N`** or **`Documento N`** (never *papel*).

## 4. Structural labels

The interface labels (status, level, stream, keywords, etc.) are localized in
`data/site.json` under `i18n.es.ui` (and the `tier_labels` / `status_labels` /
`tag_labels` maps). Content JSON keeps English grouping keys; only the **display**
is Spanish — the same convention as French.

## 5. Procedure (do not blow away reviewed Spanish)

Same as French (see `docs/fr-style-guide.md` §6): reviewed Spanish is
authoritative; on an EN change, re-translate only the drifted blocks; a fresh
machine draft is `translation_status: "draft"` until a human review promotes it to
`"reviewed"` / `"final"`. Load `data/es-lexicon.json` into the prompt; then read
the result aloud — if it sounds like a translation rather than Spanish written by
a public servant, revise.
