# Skill: port-knowledge-article

Port an external open-source companion site into this compendium as a `category: architecture` knowledge article.

The first such port is `arch-adhd-harness` (the Anti-Drift Harness). Follow this pattern for future ports.

## Inputs

- Source site repo URL
- New `id` for the article (kebab-case, e.g. `arch-adhd-harness`)
- New `num` (e.g. `A-01`)
- Whether to lift visuals as REUSABLE or BESPOKE — see decision rule below.

## Steps

1. Add the inventory entry to `data/papers.json` with `category: "architecture"`.
2. Create `data/papers/<id>.en.json` and `data/papers/<id>.fr.json` using the schema in `CLAUDE.md`. The hero image is a flowchart cover; `style_kind: "cover"`.
3. Catalog the source site's visuals. For each animated/interactive component:
   - Decide REUSABLE vs BESPOKE using the rule below.
   - If REUSABLE: generalize it (parameterize the data, remove paper-specific labels), place in `components/visuals/reusable/<Name>.js`, register in `index.html`, register with `VWVisuals.registerReusable`.
   - If BESPOKE: copy as-is into `components/visuals/bespoke/<id>/<Name>.js`. Register with `VWVisuals.registerBespoke('<id>', '<name>', '<component-name>')`. Reference from the paper JSON's `bespoke_scripts` array.
4. Lift the shared animation utilities (`spawnPing`, `flyTicket`, `heatColor`, `prefersReducedMotion`, RAF+fonts wait) into `components/visuals/_lib/anim.js` only if they are not already there.
5. Port the prose section by section. Each section becomes a `section_heading` block + one or more `paragraph` blocks. Pullquotes, keystats, figures use their respective block types. Inline simulators become `figure` blocks with `chart.kind: "<id>:<visual-name>"`.
6. Port the TL;DR. Use the existing slide-style narration; do not invent new content. Three to six slides is typical.
7. Optionally add embedded presentations for deep-dive material.
8. Generate FR placeholder body (translate metadata + TL;DR; mark body as forthcoming).
9. Run the asset scripts to produce imagery and audio.
10. Run `npm run eval`.

## REUSABLE vs BESPOKE decision rule

A visual is REUSABLE if all three are true:
- A different paper could plausibly use this visual with different data.
- The visual's labels and data can be moved into `visual_config` without leaving paper-specific terminology behind.
- The animation timing and structure are not narrative-specific (i.e. you can change the data without breaking the visual story).

If any of those fail, it is BESPOKE. From the ADHD catalog:

- REUSABLE candidates: TileHeatmap, EvalStatusMatrix (with generic transitions/runs), the shared animation utilities, the slide-fade and ticket transitions, the standards-list / wall-stat / problem-stat slide layouts.
- BORDERLINE: ChainColumnTiles, CommitTimelineTiles, PerFileTreeCard, PerLinkHealthPills, BurnDownSim. The visual idiom generalizes; the data is paper-specific. Generalize on demand.
- BESPOKE: ChainBreakSim, WalkerSim, AntiDriftBoard. These are the narrative simulators that *are* the ADHD argument. Keep them under `components/visuals/bespoke/arch-adhd-harness/`.

## Do not

- Auto-generate the prose body. The source site has real prose; port it.
- Merge ADHD content into a linear paper. The whole point of the architecture category is to give technical reference articles their own home outside the reading sequence.
- Forget to add the bespoke scripts to `paper.bespoke_scripts`. Without that, the visuals are not loaded when the article opens.

## Validation

Open `#/architecture` → click into the article. Both TL;DR and embedded presentations must play. Bespoke visuals must render. The library at `#/library` must not include this article (it's `category: architecture`).
