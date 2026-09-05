/* images.mjs — OpenAI image adapter.

   Two functions:
     generatePNG(prompt, opts)              → buffer (gpt-image-1, generations)
     generatePNGFromReference(prompt, refPath, opts)
                                            → buffer (gpt-image-1, edits, conditioned
                                              on a reference PNG for consistency)
*/

import { readFileSync } from 'node:fs';
import { loadEnv, need } from './env.mjs';

const GENS_URL  = 'https://api.openai.com/v1/images/generations';
const EDITS_URL = 'https://api.openai.com/v1/images/edits';

export async function generatePNG(prompt, opts = {}) {
  loadEnv();
  const apiKey = need('OPENAI_API_KEY');
  const model  = opts.model || process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
  const size   = opts.size  || '1536x1024';

  const body = {
    model,
    prompt,
    size,
    n: 1,
  };
  /* gpt-image models can emit true alpha; used for game sprites. */
  if (opts.background && model.startsWith('gpt-image-')) body.background = opts.background;
  if (model === 'dall-e-3') {
    body.quality = 'hd';
    body.size = '1792x1024';
  } else if (!model.startsWith('gpt-image-')) {
    body.response_format = 'b64_json';
  }

  const res = await fetch(GENS_URL, {
    method: 'POST',
    headers: {
      'authorization': 'Bearer ' + apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error('OpenAI image ' + res.status + ': ' + errText);
  }
  const json = await res.json();
  const item = json.data && json.data[0];
  if (!item) throw new Error('No image data returned');

  if (item.b64_json) return Buffer.from(item.b64_json, 'base64');
  if (item.url) {
    const r2 = await fetch(item.url);
    if (!r2.ok) throw new Error('Failed to fetch image URL');
    return Buffer.from(await r2.arrayBuffer());
  }
  throw new Error('No b64_json or url in image response');
}

/* generatePNGFromReference — image edit that conditions on a reference PNG.
   gpt-image-1 supports /v1/images/edits with an image input. We use this to
   produce a French-labeled twin that mirrors the EN composition. */
export async function generatePNGFromReference(prompt, refPath, opts = {}) {
  loadEnv();
  const apiKey = need('OPENAI_API_KEY');
  const model  = opts.model || process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
  const size   = opts.size  || '1536x1024';

  const imgBuf = readFileSync(refPath);

  const form = new FormData();
  form.append('model', model);
  form.append('prompt', prompt);
  form.append('size', size);
  form.append('n', '1');
  form.append('image', new Blob([imgBuf], { type: 'image/png' }), 'reference.png');

  const res = await fetch(EDITS_URL, {
    method: 'POST',
    headers: { 'authorization': 'Bearer ' + apiKey },
    body: form,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error('OpenAI image edits ' + res.status + ': ' + errText);
  }
  const json = await res.json();
  const item = json.data && json.data[0];
  if (!item) throw new Error('No image data returned from edits');
  if (item.b64_json) return Buffer.from(item.b64_json, 'base64');
  if (item.url) {
    const r2 = await fetch(item.url);
    return Buffer.from(await r2.arrayBuffer());
  }
  throw new Error('No b64_json or url in edits response');
}
