# Skill: draft-to-json

Generate a paper's parts from a rough Markdown draft (or a skeleton from scratch) using the paper schema. This is the editor's **Draft** button; the CLI/agent equivalent posts to `/api/generate-paper`.

It is the schema-driven sibling of `draft-paper` and `weave-sources`: same no-invention discipline, but the AI fills the JSON schema directly instead of you writing blocks by hand.

## How it works

- The authority on shape is `scripts/lib/paper-schema.mjs` (`BLOCK_TYPES`, `VISUALS`, `validatePaper`). The renderer (`BlockRenderer.js`, `TldrEditor.js`) and this schema must agree.
- Generation is **chunked** in `scripts/lib/llm.mjs` `draftPaper()`: one outline call (abstract, subtitle, tags, sections, hero prompt, TL;DR slides), then one blocks call per section. Chunking is deliberate — a single call truncates on a long paper and fails JSON parsing.
- It runs on Claude-on-Vertex (Sonnet by default, Opus optional), and applies any selected style guides.
- The result is a **preview** in the Draft panel. Nothing is written until you click **Apply**, which fills the current paper (abstract, subtitle, tags, sections, blocks, hero prompt, TL;DR). Status stays `Draft`; no assets are generated here.

## Discipline

- **Never invent.** The prompt forbids facts beyond the source and emits the literal marker `[DRAFT GAP - needs source for: ...]` where the draft does not cover a section. Fill those gaps from real source, do not paper over them.
- **Voice.** Drafts are first-person, plain, specific. They are a starting point — run `refine-paper` afterward, and the style scanner will catch any em dashes or banned phrasing the model introduced.
- **Modes.** `draft` takes your Markdown (headings → sections, prose → paragraphs). `scratch` builds a skeletal outline from the title and tier, for you to fill.

## The full path

`add-paper` (stub) → **draft-to-json** (or `weave-sources`) → `refine-paper` → generate images → generate audio → `translate-paper` (hard build of the other locale) → set status Published → commit.

## Do not

- Treat the generated draft as final. It is a proposal you review, refine, and ground against sources.
- Generate assets or flip `_meta.placeholder` here. Drafting writes the body only.
- Let the schema drift from the renderers without updating `paper-schema.mjs`.
