#!/usr/bin/env node
/**
 * Ship the stylesheet twice from one source:
 *
 *   - dist/styles.css: the rules as written, unlayered. The default import.
 *   - dist/styles.layer.css: the same rules inside `@layer react-data-table`,
 *     for apps that order their own cascade layers (Tailwind among them).
 *
 * Wrapping only works if the source has no top-level `@import` or `@layer` of
 * its own, so the build fails rather than emit a broken layered file.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'src/styles.css'), 'utf8');

const nested = css.match(/^@(import|layer)\b.*$/m);
if (nested) {
  console.error(
    `src/styles.css can't be wrapped in a layer: it has "${nested[0]}" at the top level.`
  );
  process.exit(1);
}

const dist = join(root, 'dist');
mkdirSync(dist, { recursive: true });
writeFileSync(join(dist, 'styles.css'), css);
writeFileSync(join(dist, 'styles.layer.css'), `@layer react-data-table {\n${css}\n}\n`);
