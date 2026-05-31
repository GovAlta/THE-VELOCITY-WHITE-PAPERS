/* llm.mjs — Claude via Google Vertex AI, for the dev editor's AI revise.

   Uses the Vertex service account in .env (VERTEX_SERVICE_ACCOUNT_JSON) to mint
   a Google access token (RS256 JWT bearer flow, no external dependency), then
   calls the Anthropic-on-Vertex rawPredict endpoint. Config from .env:
     VERTEX_SERVICE_ACCOUNT_JSON, VERTEX_PROJECT_ID, VERTEX_LOCATION_ID,
     VERTEX_ENDPOINT, VERTEX_METHOD, VERTEX_CLAUDE_SONNET_MODEL, VERTEX_CLAUDE_OPUS_MODEL.

   Used only by the dev edit-server; never runs on the published site. */

import crypto from 'node:crypto';
import { loadEnv } from './env.mjs';

let _token = null;
let _tokenExp = 0;

async function getAccessToken() {
  const saRaw = process.env.VERTEX_SERVICE_ACCOUNT_JSON;
  if (!saRaw) throw new Error('VERTEX_SERVICE_ACCOUNT_JSON is not set in .env');
  const sa = JSON.parse(saRaw);
  const now = Math.floor(Date.now() / 1000);
  if (_token && now < _tokenExp - 60) return _token;

  const tokenUri = sa.token_uri || 'https://oauth2.googleapis.com/token';
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const head = b64({ alg: 'RS256', typ: 'JWT' });
  const claims = b64({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
  });
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(head + '.' + claims);
  signer.end();
  const sig = signer.sign(sa.private_key).toString('base64url');
  const jwt = head + '.' + claims + '.' + sig;

  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  if (!res.ok) throw new Error('Google token exchange ' + res.status + ': ' + (await res.text()));
  const j = await res.json();
  _token = j.access_token;
  _tokenExp = now + (j.expires_in || 3600);
  return _token;
}

async function vertexMessages({ model, system, messages, max_tokens }) {
  const token = await getAccessToken();
  const project = process.env.VERTEX_PROJECT_ID;
  const location = process.env.VERTEX_LOCATION_ID || 'global';
  const method = process.env.VERTEX_METHOD || 'rawPredict';
  const baseHost = process.env.VERTEX_ENDPOINT || 'aiplatform.googleapis.com';
  const host = location === 'global' ? baseHost : location + '-' + baseHost;
  const url = 'https://' + host + '/v1/projects/' + project + '/locations/' + location +
              '/publishers/anthropic/models/' + model + ':' + method;

  const body = { anthropic_version: 'vertex-2023-10-16', messages, max_tokens: max_tokens || 8000 };
  if (system) body.system = system;

  const res = await fetch(url, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Vertex ' + res.status + ': ' + (await res.text()));
  return res.json();
}

export async function reviseItems({ items, instructions, guideTexts, model, tier }) {
  loadEnv();
  const mdl = model ||
    (tier === 'opus' ? process.env.VERTEX_CLAUDE_OPUS_MODEL : process.env.VERTEX_CLAUDE_SONNET_MODEL) ||
    'claude-sonnet-4-6';

  const guideBlock = (guideTexts || [])
    .map((g) => '### ' + g.title + '\n' + g.content)
    .join('\n\n');

  const system = [
    'You are a senior editor revising whitepaper prose for the Government of Alberta.',
    "Apply the style guidance and the editor's instructions to each item.",
    'Preserve the meaning, the facts, the numbers, named entities, and the author’s voice.',
    'Do not invent facts. Do not add or remove claims. Revise wording and structure only.',
    'Keep any inline HTML tags (such as <code>, <strong>, <em>, <ul>, <li>) where they belong.',
    'Return ONLY a JSON array, one object per input item, exactly of the form',
    '[{"key": <key copied from the input>, "revised": "<revised text>"}]. No prose, no code fences.',
  ].join(' ');

  const user =
    (guideBlock ? 'STYLE GUIDANCE:\n' + guideBlock + '\n\n' : '') +
    "EDITOR'S INSTRUCTIONS:\n" + (instructions && instructions.trim() ? instructions : '(none provided; apply the style guidance above)') + '\n\n' +
    'ITEMS TO REVISE (return one revised string per key, preserving each key):\n' +
    JSON.stringify(items, null, 2);

  const json = await vertexMessages({ model: mdl, system, messages: [{ role: 'user', content: user }], max_tokens: 8000 });
  const text = (json.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('Model did not return a JSON array. Got: ' + text.slice(0, 200));
  return JSON.parse(text.slice(start, end + 1));
}
