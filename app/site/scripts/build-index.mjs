/* build-index.mjs — CLI: regenerate data/papers.json and re-stamp num/sequence
   into every paper's locale files from data/order.json. Run after editing order
   or any paper's status (which changes the Published-only sequence denominator). */

import { buildIndex } from './lib/index-build.mjs';

const inv = buildIndex();
console.log('Built data/papers.json: ' + inv.papers.length + ' entries.');
