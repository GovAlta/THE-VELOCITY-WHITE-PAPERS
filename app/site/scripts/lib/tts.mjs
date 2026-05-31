/* tts.mjs — ElevenLabs TTS adapter.
   Calls the synthesize endpoint and returns an mp3 buffer. */

import { need, loadEnv } from './env.mjs';

const ELEVEN_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

export async function synthesize(text, opts = {}) {
  loadEnv();
  const apiKey = need('ELEVENLABS_API_KEY');
  const voice  = opts.voiceId || process.env.ELEVENLABS_VOICE_ID || 'KfBQnqm1qO2GnuxPtYfM';
  const modelId = opts.modelId || 'eleven_multilingual_v2';

  /* mp3_44100_64 produces ~64kbps narration (clear speech, ~0.5 MB/min).
     Override with opts.outputFormat (e.g. 'mp3_44100_128' for music or
     higher fidelity) or env ELEVENLABS_OUTPUT_FORMAT. */
  const outputFormat = opts.outputFormat
    || process.env.ELEVENLABS_OUTPUT_FORMAT
    || 'mp3_44100_64';
  const url = `${ELEVEN_URL}/${voice}/stream?optimize_streaming_latency=0&output_format=${outputFormat}`;
  const body = {
    text,
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
