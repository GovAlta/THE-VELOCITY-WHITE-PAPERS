/* migrate-classification.mjs — one-shot script to add `category` to papers.json
   and append placeholder architecture-classification entries (knowledge articles
   that sit outside the linear 1..16 reading sequence). */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const SITE = resolve(__dirname, '..');
const path = resolve(SITE, 'data/papers.json');

const data = JSON.parse(readFileSync(path, 'utf8'));

for (const p of data.papers) {
  if (!p.category) p.category = 'paper';
}

const architectureEntries = [
  {
    id: 'arch-adhd-harness',
    num: 'A-01',
    sequence: 'Architecture · A-01',
    tier: 'Technical',
    category: 'architecture',
    title: 'The Anti-Drift Harness',
    subtitle: 'A reference implementation of the well-built harness. Skills, hooks, and the structural patterns that prevent agent-driven code from rotting.',
    track: 'Reference implementation',
    authors: ['Janak Alford'],
    published: null,
    reading_min: 45,
    status: 'Forthcoming',
    tags: ['architecture', 'harness', 'reference', 'claude-code'],
    repo: 'https://github.com/janakalford/adhd',
    abstract: 'A full technical specification of the Anti-Drift Harness as a worked reference implementation of Paper 8. Walks through the skill files, the hook layer, the standards-driven development pattern, and the agent-mesh architecture used to keep a 50K to 100K line codebase coherent under continuous AI editing.',
    related: ['wp-08', 'wp-09']
  }
];

for (const a of architectureEntries) {
  if (!data.papers.find(p => p.id === a.id)) data.papers.push(a);
}

if (!data.categories) {
  data.categories = [
    {
      id: 'paper',
      label_en: 'White paper',
      label_fr: 'Livre blanc',
      description_en: 'Numbered papers in the linear reading sequence.',
      description_fr: 'Livres numérotés dans la séquence de lecture.'
    },
    {
      id: 'architecture',
      label_en: 'Architecture article',
      label_fr: 'Article d\'architecture',
      description_en: 'Technical reference specifications. Detailed implementations and patterns that supplement the linear papers. Read on demand, not in sequence.',
      description_fr: 'Spécifications de référence techniques. Mises en œuvre et patrons détaillés en complément des livres linéaires. Lecture à la demande, pas en séquence.'
    }
  ];
}

writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Updated ' + path);
console.log('  - ' + data.papers.filter(p => p.category === 'paper').length + ' linear papers');
console.log('  - ' + data.papers.filter(p => p.category === 'architecture').length + ' architecture articles');
