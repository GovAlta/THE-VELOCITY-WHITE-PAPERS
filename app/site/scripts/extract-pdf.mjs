#!/usr/bin/env node
/* extract-pdf.mjs — send a PDF to Claude on Vertex and print its answer.
   Claude accepts PDFs up to 100 pages / 32 MB. Used to mine secondary-source
   documents (annual reports, vendor docs) for figures to weave into a paper.

   Usage:
     node scripts/extract-pdf.mjs <file.pdf> "<question>" [--opus]
*/

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnv } from './lib/env.mjs';
import { vertexMessages } from './lib/llm.mjs';

loadEnv();
const args = process.argv.slice(2);
const opus = args.includes('--opus');
const rest = args.filter((a) => a !== '--opus');
const file = rest[0];
const question = rest[1] || 'Summarize this document and list its key statistics with exact figures.';
if (!file) { console.error('Usage: node scripts/extract-pdf.mjs <file.pdf> "<question>" [--opus]'); process.exit(1); }

const data = readFileSync(resolve(file)).toString('base64');
const model = (opus ? process.env.VERTEX_CLAUDE_OPUS_MODEL : process.env.VERTEX_CLAUDE_SONNET_MODEL) || 'claude-sonnet-4-6';
console.error('Sending ' + file + ' (' + Math.round(data.length / 1024) + ' KB base64) to ' + model + ' …');

const json = await vertexMessages({
  model,
  max_tokens: 4000,
  messages: [{
    role: 'user',
    content: [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } },
      { type: 'text', text: question },
    ],
  }],
});
const text = (json.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
console.log(text);
