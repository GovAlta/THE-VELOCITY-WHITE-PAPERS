# Skill: regenerate-audio

Generate or regenerate narration MP3s for a paper, in both locales.

## What gets generated

For each paper in scope, the script produces:
- One MP3 per slide in `tldr_presentation` and `embedded_presentations` (saved at the slide's `audio_file` path).
- One long-form MP3 of the full paper body, if `paper.audio.src` is set (longform narration of title + subtitle + abstract + body paragraphs).

## Commands

```bash
npm run generate:audio                              # all papers, all locales
npm run generate:audio -- <id>                      # one paper
npm run generate:audio -- <id> --locale en          # one paper, EN only
npm run generate:audio -- --tldr-only               # skip the longform narration
npm run generate:audio -- --no-longform             # same effect; explicit
npm run generate:audio -- --force                   # regenerate even if cached
```

## Audio format

Default output: `mp3_44100_64` (64 kbps, 44.1 kHz). This is mono-equivalent for narration, around 480 KB per minute. Override via `--output-format` arg or `ELEVENLABS_OUTPUT_FORMAT` in `.env` if you need higher fidelity for music or stereo content.

Voice: from `ELEVENLABS_VOICE_ID` in `.env`. Same voice for EN and FR by default. ElevenLabs's multilingual model handles both.

## When editing a slide's narration

The script reads from the `text` field of each slide (NOT the `subcaption` or `caption`). Edit the `text` and re-run with `--force` on that paper:

```bash
npm run generate:audio -- <id> --force
```

Do not insert SSML tags into the `text` field. The TTS provider handles natural punctuation; if you need a pause, write a period or use shorter sentences.

## Do not

- Generate audio when the `text` field is auto-generated AI slop. The site is open source and the narration script must be honest. If the slide narration was not written by a human or carefully reviewed, fix the script first.
- Generate audio for FR slides if the FR translation has not been reviewed. The narration script is what the listener hears; bad FR text becomes bad FR audio.
- Use a different voice for FR without coordinating. The bilingual identity assumes one voice across locales.

## Validation

```bash
npm run eval                              # check-audio-coverage.mjs verifies every audio_file declared in JSON exists on disk
ls public/audio/en/<id>-tldr/             # confirm slide MP3s present
ls public/audio/fr/<id>-tldr/             # confirm FR parity
du -sh public/audio/                       # check total size
```

Open the paper at `#/paper/<id>`. Click play on the TL;DR. The audio should start within a second, the scrubber should advance, and auto-advance should jump to the next slide when the file ends.
