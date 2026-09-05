# Skill: regenerate-images

Generate or regenerate hero, figure, and slide imagery for a paper, in both locales, with EN→FR composition conditioning.

## Default behavior

```bash
npm run generate:images -- <paper_id>
```

For each image slot in the paper:
1. The EN PNG is generated from the shared style prompt (or a per-image `style_prompt` override) plus the `image_prompt`.
2. The FR JPG is then generated using OpenAI's `/v1/images/edits` endpoint, with the EN PNG as the reference image. This produces a French-labeled version with matching composition.
3. Both PNGs are converted to JPG via Sharp (default quality 80, max width 1600). Source PNGs are kept alongside the JPGs for future re-conditioning.
4. A `.meta.json` sidecar is written next to each JPG capturing: paper_id, locale, slot, model, style_prompt, image_prompt, composed_prompt, conditioned_on, generated_at, byte sizes.

## When to use --force

Only when an image is being explicitly redone. The default is cached generation; ad-hoc reruns will not re-spend tokens.

## When to use --no-condition

When the EN PNG no longer exists on disk, or when the FR composition should deliberately differ from EN. Use sparingly; the default conditioning is what keeps the bilingual visual identity consistent.

## When to use --quality / --max-width

When investigating output size. Defaults: quality 80, max width 1600 (≈ 200-450 KB per image). Lower quality only if a specific slot is failing a size budget.

## Editing a prompt

To edit a prompt for an image, change the `image_prompt` (and optionally `style_prompt`) in `data/papers/<id>.<locale>.json`. Then run with `--force`:

```bash
npm run generate:images -- <id> --force
```

The new prompt is recorded in the sidecar; the old prompt is overwritten. If prompt history matters, copy the old sidecar to `data/papers/<id>/prompts-history/` first. (No automated history yet; flagged in STRUCTURE.md.)

## Do not

- Add prompt material to the script. Prompts live in JSON.
- Generate FR images from text only (skip `--no-condition`) unless the user is debugging or has a reason. The conditioning is what makes the bilingual pair feel like one set.
- Skip the JPG conversion step or remove the source PNG cache. The PNG is the reference for the next FR regeneration.

## Validation

```bash
npm run eval                              # check-image-metadata.mjs verifies every JPG has a sidecar
ls public/images/<id>/en/                 # confirm files present
ls public/images/<id>/fr/                 # confirm parity
```

In the UI, open the paper at `#/paper/<id>` in both locales. Click the `i` badge on the hero image. The inspector should show the style prompt, image prompt, model, and (for FR) the EN PNG it was conditioned on.
