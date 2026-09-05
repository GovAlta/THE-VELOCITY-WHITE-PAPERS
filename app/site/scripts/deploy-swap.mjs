/* deploy-swap.mjs — explicit, reversible swap between the dev index.html
   and the bundled index.dist.html. Use only at deploy time.

   --in   backs up the current index.html as index.dev.html.bak and
          replaces it with index.dist.html. Use right before committing
          to the deploy branch (or pushing to gh-pages).

   --out  restores index.dev.html.bak as index.html. Use right after a
          deploy to return the working tree to the dev source.

   The script refuses to run --in if it can't find index.dist.html, and
   refuses --out if it can't find the backup. Idempotent and safe to
   re-run.
*/

import { existsSync, copyFileSync, statSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const SITE = resolve(__dirname, '..');

const DEV  = resolve(SITE, 'index.html');
const DIST = resolve(SITE, 'index.dist.html');
const BAK  = resolve(SITE, 'index.dev.html.bak');

const args = process.argv.slice(2);
const direction = args.includes('--in') ? 'in'
                : args.includes('--out') ? 'out'
                : null;

if (!direction) {
  console.error('Pass --in (swap bundled in for deploy) or --out (restore dev).');
  process.exit(2);
}

if (direction === 'in') {
  if (!existsSync(DIST)) {
    console.error('index.dist.html not found. Run `npm run build:dist` first.');
    process.exit(1);
  }
  if (!existsSync(BAK)) {
    copyFileSync(DEV, BAK);
    console.log('Backed up dev index.html → index.dev.html.bak');
  } else {
    console.log('Backup already exists. Leaving as is.');
  }
  copyFileSync(DIST, DEV);
  console.log('Swapped in: index.html now matches index.dist.html');
  console.log('Run `npm run deploy:swap-out` after deploy to restore the dev source.');
} else if (direction === 'out') {
  if (!existsSync(BAK)) {
    console.error('No backup at index.dev.html.bak. Nothing to restore.');
    process.exit(1);
  }
  copyFileSync(BAK, DEV);
  console.log('Restored dev index.html from backup.');
  console.log('Backup file kept. Delete it manually if you no longer need it.');
}
