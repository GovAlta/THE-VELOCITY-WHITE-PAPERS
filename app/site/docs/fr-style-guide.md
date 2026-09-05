# Guide de style et lexique EN → FR — Livres blancs Vélocité

**Authoritative French style guide for the Velocity White Papers.** Built from the
line-by-line corrections returned by the Government of Alberta's francophone
reviewers (2026-06-12) on all 18 published papers. Every rule below is grounded
in an actual correction; the machine-readable companion is
[`data/fr-lexicon.json`](../data/fr-lexicon.json), which the translation tooling
loads into the model prompt.

> **Why these corrections happened.** The first-pass AI translation produced
> fluent but *Parisian / international* French with several literal calques and
> one real terminology error. The reviewers rewrote it into **Canadian
> public-administration French** (OQLF-aligned): correct domain terms, plain
> language, Canadian typography, and a calmer register. This guide encodes that
> standard so future EN→FR work reproduces it instead of repeating the mistakes.

---

## 1. The five things the reviewers changed most

1. **Terminology accuracy.** `contrôles cybernétiques` was simply wrong
   (*cybernetics* ≠ *cyber*); the correct term is **`contrôles de cybersécurité`**.
   Treat the lexicon (§5) as binding.
2. **Register / anglicism calques.** `piloté par l'IA` → **`appuyé par l'IA`**;
   `services sécurisés` → **`services sécuritaires`**; `à motivation financière`
   → **`motivés par des gains financiers`**; `profane` → **`personne non
   spécialiste`**.
3. **Plain language & sentence length.** Long English periods were split into
   shorter French sentences; ornate or martial metaphors (`le siège`, `les
   murailles`, `la forteresse`) were softened to plain nouns (`la pression
   externe`, `les fondations`, `les fonctions critiques`) unless the metaphor is
   the paper's central conceit (the *Ship of Theseus*, the *four-headed hydra*).
4. **Canadian typography.** Curly apostrophes `’`, guillemets `« … »` with
   non-breaking spaces, numerals with a space before `%`, decimal comma, money
   spelled out as `millions / milliards de dollars`, non-breaking hyphens in
   ranges (`2024‑2025`).
5. **Numbers as numerals.** `deux milliards de dollars` → **`2 milliards de
   dollars`**; `quatre-vingt-quinze pour cent` → **`95 %`**; `cinq mille cinq
   cents` → **`5 500`**.

---

## 2. Register and tone

- Write **Canadian / Québécois public-administration French**, aligned with the
  Office québécois de la langue française. The audience is fellow public
  servants; the voice is calm, clear, and institutional ("nous", "l'Alberta").
- **Plain language — simpler and more direct.** Prefer the everyday word over the
  learned one (`personne non spécialiste`, not `profane`). Split sentences that run
  longer than ~30 words in English. *(2026-06-24 reviewer note: the French quality
  has "improved significantly," and the next lever is **simpler, more direct
  sentence structures**. Favour short declarative sentences over long subordinate
  chains, and put the subject and verb early. The translation prompt must explicitly
  ask for **« un français clair et accessible »** — clear, accessible French — not
  merely correct French.)*
- **Soften incidental metaphor.** The English leans on siege/war imagery. Keep a
  metaphor only when it is the paper's organizing image; otherwise translate the
  meaning, not the figure. (`le siège à l'extérieur s'intensifie` →
  `la pression externe continue de s'intensifier`.)
- **Do not name AI vendors gratuitously.** Where the English drops in
  "OpenAI et Anthropic" as a throwaway, the FR generalizes (`les modèles
  actuels`). Keep a vendor/product name only when it is substantive and cited
  (e.g. Anthropic's *Glasswing*, the *Mythos* model, *Axios*, *Firefox*).
- **Inclusive, epicene phrasing** where natural: `celles et ceux`, `toutes et
  tous`. `les Albertains` (generic masculine) remains acceptable.

---

## 3. Typography (Canadian French)

| Element | Rule | Example |
|---|---|---|
| Apostrophe | Curly `’` (U+2019), never straight `'` | `l’Alberta`, `d’affaires` |
| Quotation | Guillemets with NBSP inside | `« dette technique »` |
| Em dash | Spaced em dash is allowed (overrides the EN no-em-dash rule) | `deux transformations — le PAPHA et Care First — touchent…` |
| Percent | Space before `%` (NBSP) | `95 %`, `78,2 %` |
| Decimals | Comma | `78,2 %`, `126,3 millions` |
| Thousands | Space (NBSP) as separator | `5 500`, `189 millions` |
| Money | Spell the unit; **never** `M$` / `G$` in prose | `120 millions de dollars`, `2 milliards de dollars` |
| Ranges / compounds | Non-breaking hyphen `‑` | `2024‑2025`, `main‑d’œuvre` |
| Numbers | Numerals for quantities ≥ 2 digits and round large figures | `70 par année`, `40 ans`, `2 milliards` |

> The EN writing-style rule "no em dashes / no 'not X, but Y'" is an **English-only**
> rule. French freely uses the spaced em dash and the `non pas X, mais Y` /
> `non seulement X, mais Y` construction. Do not strip these from French.

---

## 4. Structural labels (rendering & Markdown export)

The francophone reviewers localized the document's structural labels, so the FR
rendering and the FR Markdown export must use French labels, and tier / track /
status / tags must **display** in French (the JSON keys stay English; only the
displayed label is French — see the tier/track/tag label maps).

| EN label | FR label |
|---|---|
| No. | Numéro |
| Authors | Auteurs |
| Published | Publié le |
| Tier | Niveau |
| Track | Volet |
| Status | Statut |
| Reading | Temps de lecture |
| Tags | Mots-clés |
| Abstract | Résumé |
| Related papers | Documents connexes |
| Video | Vidéo |

Numbered cross-references: **`Livre blanc N`** or **`Document N`** (never
`papier`).

---

## 5. Lexicon (binding term map)

Use the **Preferred** column. The **Avoid** column lists the calque the reviewers
removed. Full machine-readable version in `data/fr-lexicon.json`.

### Collection & framing
| English | Preferred FR | Avoid |
|---|---|---|
| white paper | livre blanc | papier blanc |
| the Velocity white papers (brand) | les livres blancs Vélocité | (keep accent + capital) |
| velocity (delivery throughput) | la cadence / le rythme / la capacité | vélocité (reserve for the brand) |
| technology estate / the estate | le parc technologique / le parc | — |
| legacy systems | les systèmes hérités / les systèmes plus anciens | systèmes légués |
| technical debt | la dette technique | — |
| red tape | les démarches administratives / la paperasse | formalités administratives |
| blueprint / playbook | un guide / un plan directeur | — |

### AI & engineering
| English | Preferred FR | Avoid |
|---|---|---|
| AI-driven / AI-powered | appuyé par l'IA / alimenté par l'IA | piloté par l'IA |
| data-driven | axé sur les données / piloté par les données | — (the *piloté→appuyé* fix is specific to "par l'IA"; "piloté par les données" is correct) |
| agentic AI | l'IA agentique | — |
| agent | un agent (d'IA) | — |
| human-centred AI | l'IA centrée sur l'humain | — |
| harness | un harnais | — |
| prompt engineering | l'ingénierie de requête | — |
| context window | la fenêtre de contexte | — |
| foundation model | un modèle de fondation | — |
| bug | un bogue | — |
| layperson / the profane | une personne non spécialiste | profane |

### Cybersecurity
| English | Preferred FR | Avoid |
|---|---|---|
| cyber controls | les contrôles de cybersécurité | **contrôles cybernétiques** (wrong) |
| cybersecurity | la cybersécurité | — |
| secure / safe (services) | sécuritaire | sécurisé (only for "encrypted/secured") |
| data breach | une fuite de données | atteinte aux données |
| ransomware | un rançongiciel | — |
| exploit (attack code) | un exploit / un code d'exploitation | — |
| vulnerability / flaw | une vulnérabilité / une faille | — |
| supply chain (software) | la chaîne d'approvisionnement (logicielle) | — |
| open source (adj., repos/packages) | open source | à code source ouvert |
| open-source software (licensing/ethos) | logiciel libre / open source | — |
| financially motivated (actors) | motivés par des gains financiers | à motivation financière |
| cloud | infonuagique | — |
| API tokens / SSH keys | jetons d'API / clés SSH | — |
| disaster recovery | reprise après sinistre | — |
| backlog (work) | l'arriéré / les demandes en attente | — |
| product backlog | un carnet de produit | — |
| surge workforce | la main‑d'œuvre d'appoint | — |

### Government & roles
| English | Preferred FR | Avoid |
|---|---|---|
| (Department/Ministry of) Technology and Innovation | le ministère de la Technologie et de l'Innovation | adding the "(TI)" abbreviation in prose |
| AI Academy | l'Académie de l'IA | — |
| Deputy Minister / Minister | sous-ministre / ministre | — |
| public servants | les fonctionnaires | — |
| stakeholders | les parties prenantes | — |
| Government 3.0 | Gouvernement 3.0 | — |

---

## 6. Procedure for future EN→FR work (do not blow away reviewed French)

Reviewed French is authoritative. The translation tooling must **merge, never
overwrite**:

1. A reviewed FR paper carries `translation_status: "reviewed"` and
   `_meta.fr_review { date, by, source }`. Treat its prose as locked.
2. On an EN change, detect drift **per block** (compare each EN block's hash to
   the FR's recorded `_meta.block_sigs`). Re-translate **only the blocks whose EN
   changed**; leave every reviewed FR block untouched.
3. Any re-translated block follows this guide + `data/fr-lexicon.json`, and is
   marked for re-review (downgrade only that paper to `draft` if you must, and
   note which blocks changed).
4. Never run a whole-paper hard overwrite on a `reviewed` paper.

When translating fresh prose, load `data/fr-lexicon.json` into the prompt, apply
§2–§5, then read the result aloud: if it sounds like a translation rather than
French written by an Albertan public servant, revise.
