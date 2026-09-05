/* tts.mjs — ElevenLabs TTS adapter.

   Two responsibilities beyond the raw API call:

   1. normalizeForSpeech — ElevenLabs voices mishandle numeric decorators
      ($, %, M/B abbreviations, ~, trailing +). We spell them out before
      synthesis: "33%" -> "33 percent", "$120 million" -> "120 million dollars",
      "$2B" -> "2 billion dollars", "~33" -> "approximately 33", "40+" -> "40 plus".

   2. injectSentencePauses — adds short SSML <break> pauses between sentences for
      a calmer reading cadence. ElevenLabs supports <break time="x.xs"/> on all
      models except v3, but too many breaks in a single generation can corrupt
      the audio. synthesizeLong avoids that by generating one paragraph at a time
      (a handful of breaks per call) and concatenating the MP3 buffers. */

import { need, loadEnv } from './env.mjs';

const ELEVEN_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

/* ElevenLabs hard cap is 10k chars per call. We split well below it because
   number spell-outs and <break> tags inflate the text after splitting. */
const MAX_CALL_CHARS = 6000;

const MAGNITUDE = { K: 'thousand', M: 'million', B: 'billion', T: 'trillion' };

/* Strip Markdown and HTML so the voice never reads "asterisk asterisk" or a tag.
   Runs before number normalization and before any <break> tags are added. */
export function stripMarkup(text) {
  return String(text == null ? '' : text)
    .replace(/<[^>]+>/g, '')                       // HTML tags
    .replace(/!?\[([^\]]+)\]\([^)]*\)/g, '$1')     // [label](url) / ![alt](src) -> label
    .replace(/(\*\*|__)(.*?)\1/g, '$2')            // **bold** / __bold__
    .replace(/\*(\S(?:.*?\S)?)\*/g, '$1')          // *italic*
    .replace(/~~(.*?)~~/g, '$1')                   // ~~strike~~
    .replace(/`+/g, '')                            // inline code backticks
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')            // # headings
    .replace(/^\s{0,3}>\s?/gm, '')                 // > blockquote markers
    .replace(/\*\*|__/g, '')                       // any stray bold markers
    .replace(/[ \t]{2,}/g, ' ');                   // collapse runs of spaces
}

export function normalizeForSpeech(text) {
  let t = String(text == null ? '' : text);
  // "~33" -> "approximately 33"
  t = t.replace(/~(?=\s*\d)/g, 'approximately ');
  // "40+" / "70+" -> "40 plus"
  t = t.replace(/(\d)\s*\+/g, '$1 plus');
  // Currency with a magnitude word: "$120 million" -> "120 million dollars"
  t = t.replace(/\$(\d[\d,]*(?:\.\d+)?)\s*(trillion|billion|million|thousand)/gi,
                (_, n, m) => `${n} ${m.toLowerCase()} dollars`);
  // Currency with an abbreviated magnitude: "$2B", "$80M", "$2.1B" -> "... dollars"
  t = t.replace(/\$(\d[\d,]*(?:\.\d+)?)\s*([KMBTkmbt])\b/g,
                (_, n, s) => `${n} ${MAGNITUDE[s.toUpperCase()]} dollars`);
  // Plain currency: "$2,000" -> "2,000 dollars"
  t = t.replace(/\$(\d[\d,]*(?:\.\d+)?)/g, '$1 dollars');
  // Percent: "33%" / "78.2%" -> "33 percent"
  t = t.replace(/(\d[\d,]*(?:\.\d+)?)\s*%/g, '$1 percent');
  return t;
}

/* Insert a <break> after sentence-ending punctuation. The lookahead requires the
   next sentence to start with a capital, quote, or opening bracket, which skips
   decimals (next char is a digit) and most mid-number cases. */
export function injectSentencePauses(text, seconds) {
  const s = Number(seconds);
  if (!s || s <= 0) return text;
  const tag = `<break time="${s}s" />`;
  return text.replace(/([.!?]["'”’)\]]?)\s+(?=["“'(A-Z])/g, `$1 ${tag} `);
}

function sentencePauseSeconds(opts) {
  if (opts.sentencePause != null) return Number(opts.sentencePause);
  const env = process.env.ELEVENLABS_SENTENCE_PAUSE;
  return env != null && env !== '' ? Number(env) : 0.4;
}

/* Synthesize a single block of text (one API call). Applies speech
   normalization and sentence pauses. Returns an mp3 Buffer. */
export async function synthesize(text, opts = {}) {
  loadEnv();
  const apiKey = need('ELEVENLABS_API_KEY');
  const voice  = opts.voiceId || process.env.ELEVENLABS_VOICE_ID || 'KfBQnqm1qO2GnuxPtYfM';
  const modelId = opts.modelId || 'eleven_multilingual_v2';

  /* mp3_44100_64 produces ~64kbps narration (clear speech, ~0.5 MB/min).
     Override with opts.outputFormat or env ELEVENLABS_OUTPUT_FORMAT. */
  const outputFormat = opts.outputFormat
    || process.env.ELEVENLABS_OUTPUT_FORMAT
    || 'mp3_44100_64';

  const prepared = injectSentencePauses(normalizeForSpeech(stripMarkup(text)), sentencePauseSeconds(opts));

  const url = `${ELEVEN_URL}/${voice}/stream?optimize_streaming_latency=0&output_format=${outputFormat}`;
  const body = {
    text: prepared,
    model_id: modelId,
    voice_settings: {
      stability: 0.55,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'accept': 'audio/mpeg',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error('ElevenLabs ' + res.status + ': ' + errText);
  }

  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

/* Split long narration into paragraph-sized pieces so each generation carries
   only a few break tags. A paragraph over the call cap is split on sentences. */
export function splitForSynthesis(text) {
  const paragraphs = String(text || '').split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  const pieces = [];
  for (const para of paragraphs) {
    if (para.length <= MAX_CALL_CHARS) { pieces.push(para); continue; }
    const sentences = para.split(/(?<=[.!?])\s+/);
    let buf = '';
    for (const s of sentences) {
      if ((buf + ' ' + s).length > MAX_CALL_CHARS && buf) { pieces.push(buf); buf = s; }
      else buf = buf ? buf + ' ' + s : s;
    }
    if (buf) pieces.push(buf);
  }
  return pieces.length ? pieces : [String(text || '')];
}

/* Synthesize long-form narration: one ElevenLabs call per paragraph, then
   concatenate the MP3 buffers (CBR frames join into a valid stream). Keeps the
   break-tag count per call low so the audio stays clean. Returns an mp3 Buffer. */
export async function synthesizeLong(text, opts = {}) {
  const pieces = splitForSynthesis(text);
  if (pieces.length <= 1) return synthesize(pieces[0] || text, opts);
  const buffers = [];
  for (let i = 0; i < pieces.length; i++) {
    buffers.push(await synthesize(pieces[i], opts));
    if (opts.onProgress) opts.onProgress(i + 1, pieces.length, pieces[i].length);
  }
  return Buffer.concat(buffers);
}
