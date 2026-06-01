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

export async function vertexMessages({ model, system, messages, max_tokens }) {
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

/* translateItems — translate each item's text from sourceLocale to targetLocale.
   Same [{key},{key,revised}] envelope as reviseItems. Keys prefixed "imgprompt:"
   get composition-preserving label-only translation. Preserves inline HTML,
   numbers, names. Canadian-French conventions for fr targets. */
export async function translateItems({ items, sourceLocale, targetLocale, glossary, model, tier }) {
  loadEnv();
  const mdl = model || (tier === 'opus' ? process.env.VERTEX_CLAUDE_OPUS_MODEL : process.env.VERTEX_CLAUDE_SONNET_MODEL) || 'claude-sonnet-4-6';
  const langName = (l) => (l === 'fr' ? 'Canadian French' : l === 'en' ? 'English' : l);

  const frConventions = targetLocale === 'fr'
    ? ' Use Canadian French government conventions: "livre blanc" for whitepaper, "logiciel libre" for open source, "ministère"/"ministre"/"sous-ministre", currency like "2 G$". '
    : ' ';

  const system = [
    'You are a professional government translator. Translate each item from ' + langName(sourceLocale) + ' to ' + langName(targetLocale) + '.' + frConventions,
    'Preserve meaning, facts, numbers, proper names, and any inline HTML tags (<code>, <strong>, <em>, <a href>, <ul>, <li>) exactly — translate only the human-readable text between/around them.',
    'For keys beginning "imgprompt:", keep the composition description and only translate the words that would appear as labels in the image; end such values with: "All text labels in ' + langName(targetLocale) + '. Match the composition of the source image exactly; only the text labels change."',
    (glossary ? 'Apply this glossary where relevant:\n' + glossary : ''),
    'Return ONLY a JSON array, one object per input item: [{"key": <key copied from input>, "revised": "<translation>"}]. No prose, no code fences.',
  ].filter(Boolean).join(' ');

  const user = 'ITEMS TO TRANSLATE (return one translation per key, preserving each key):\n' + JSON.stringify(items, null, 2);

  const json = await vertexMessages({ model: mdl, system, messages: [{ role: 'user', content: user }], max_tokens: 8000 });
  const text = (json.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  const start = text.indexOf('['); const end = text.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('Model did not return a JSON array. Got: ' + text.slice(0, 200));
  return JSON.parse(text.slice(start, end + 1));
}

/* One JSON call: returns the parsed object/array between the given delimiters,
   with a single retry on parse failure. */
async function jsonCall(model, system, user, open, close) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const json = await vertexMessages({ model, system, messages: [{ role: 'user', content: user }], max_tokens: 8000 });
    const text = (json.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
    const s = text.indexOf(open); const e = text.lastIndexOf(close);
    if (s !== -1 && e !== -1) { try { return JSON.parse(text.slice(s, e + 1)); } catch (_) {} }
    if (attempt === 1) throw new Error('Model did not return parseable JSON. Got: ' + text.slice(0, 200));
  }
}

/* draftPaper — build paper parts from a rough Markdown draft (or a skeleton from
   scratch), chunked so a long draft never truncates: one outline call, then one
   blocks call per section. Returns { abstract, subtitle, tags, sections,
   hero_image, tldr_presentation, blocks }. Never invents; marks gaps. */
export async function draftPaper({ mode, title, tier, draftMarkdown, guideTexts, modelTier }) {
  loadEnv();
  const mdl = (modelTier === 'opus' ? process.env.VERTEX_CLAUDE_OPUS_MODEL : process.env.VERTEX_CLAUDE_SONNET_MODEL) || 'claude-sonnet-4-6';
  const guide = (guideTexts || []).map((g) => '### ' + g.title + '\n' + g.content).join('\n\n');
  const source = (mode === 'draft' && draftMarkdown && draftMarkdown.trim())
    ? draftMarkdown
    : '(No draft provided. Build a SKELETAL outline from the title and tier: real section titles, placeholder one-line intents, no invented facts.)';

  const voice = (guide ? 'Follow this style guidance:\n' + guide + '\n\n' : '')
    + 'Write in the author voice: flowing, first person plural, specific, plain. Preserve all facts and numbers from the source. Never invent facts.';

  const outlineSys = voice + '\n\n' + 'From the SOURCE, produce ONLY a JSON object: '
    + '{ "abstract": "80-140 words", "subtitle": "one line", "tags": ["..."], '
    + '"sections": [{ "n": "01", "title": "..." }], '
    + '"hero_image": { "image_prompt": "plain composition brief", "alt": "...", "style_kind": "cover" }, '
    + '"tldr_presentation": { "slides": [{ "id": "01", "title": "...", "visual": "title|stat|list|quote|compare", "caption": "...", "subcaption": "...", "text": "narration, short spoken sentences" }] } }. '
    + 'Six to ten sections. Three to six TL;DR slides. No body blocks here.';
  const outline = await jsonCall(mdl, outlineSys, 'TITLE: ' + title + '\nTIER: ' + tier + '\n\nSOURCE:\n' + source, '{', '}');

  const blocks = [];
  for (const sec of (outline.sections || [])) {
    const secSys = voice + '\n\n'
      + 'Produce ONLY a JSON array of blocks for ONE section. Start with { "type":"section_heading", "n":"' + sec.n + '", "title":"' + (sec.title || '').replace(/"/g, '\\"') + '" }, then 2 to 5 blocks drawn from the SOURCE for this section. '
      + 'Allowed block types: paragraph {type,text}, dropcap_paragraph {type,text} (only for section 01), pullquote {type,text,cite}, keystat {type,label,value,body}, sidenote {type,label,value}. '
      + 'Where the source does not cover this section, emit one paragraph whose text is the literal marker "[DRAFT GAP - needs source for: ' + (sec.title || '') + ']".';
    const arr = await jsonCall(mdl, secSys, 'PAPER: ' + title + '\nSECTION ' + sec.n + ': ' + sec.title + '\n\nSOURCE:\n' + source, '[', ']');
    if (!Array.isArray(arr) || !arr.length) { blocks.push({ type: 'section_heading', n: sec.n, title: sec.title }); continue; }
    if (arr[0].type === 'section_heading') { arr[0].n = sec.n; arr[0].title = sec.title; }
    else arr.unshift({ type: 'section_heading', n: sec.n, title: sec.title });
    for (const b of arr) blocks.push(b);
  }
  blocks.push({ type: 'tag_row', tags: outline.tags || [] });
  blocks.push({ type: 'related' });

  return {
    abstract: outline.abstract, subtitle: outline.subtitle, tags: outline.tags || [],
    sections: outline.sections || [], hero_image: outline.hero_image || null,
    tldr_presentation: outline.tldr_presentation || null, blocks,
  };
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
