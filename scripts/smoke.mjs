#!/usr/bin/env node
/**
 * Install the packed tarball into a clean directory and use it the way a
 * consumer would. The unit tests exercise `src/`; this exercises what npm
 * actually ships, so it catches:
 *
 *   - the exports map pointing somewhere the built files are not
 *   - the `files` array leaving out something `dist` needs
 *   - relative imports in `dist` missing their `.js` extensions
 *   - the `./styles.css` or `./styles.layer.css` subpath not resolving
 *   - `'use client'` directives lost in the build (React Server Components
 *     consumers need them on the interactive modules)
 *
 * Run `pnpm build` first; the release workflow and `prepublishOnly` do.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.cwd();
const { name } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const packDir = mkdtempSync(join(tmpdir(), 'rdt-pack-'));
const consumer = mkdtempSync(join(tmpdir(), 'rdt-consumer-'));

const run = (command, args, cwd) =>
  execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const step = label => console.log(`\n  ${label}`);

// Exactly what a consumer gets from the package root at runtime. A missing or
// renamed export fails here rather than in someone's app, and so does an
// internal one that leaks out: every export is API that has to be kept.
const EXPECTED_EXPORTS = {
  function: [
    'DataTable',
    'Pagination',
    'TableActionMenu',
    'useCursorPagination',
    'usePagination',
    'usePersistedFilters',
    'useTableSelection',
    'useTableSort',
  ],
  object: ['defaultLabels'],
};

// The custom properties the stylesheet reads: its own private and public ones,
// and the shadcn theme tokens it falls back through.
const THEME_TOKENS = [
  'accent',
  'accent-foreground',
  'background',
  'border',
  'card',
  'foreground',
  'muted',
  'muted-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'ring',
];
const BLOCKS = [
  'rdt-table',
  'rdt-sort-header',
  'rdt-checkbox',
  'rdt-column-panel',
  'rdt-menu',
  'rdt-action-menu',
  'rdt-pagination',
  'rdt-button',
  'rdt-skeleton',
];

let failed = false;
try {
  step('Packing the tarball');
  run('npm', ['pack', '--pack-destination', packDir, '--ignore-scripts'], root);
  const tarball = readdirSync(packDir).find(file => file.endsWith('.tgz'));
  assert.ok(tarball, 'npm pack produced no tarball');
  console.log(`    ${tarball}`);

  step('Installing it into a clean project with React 19');
  writeFileSync(
    join(consumer, 'package.json'),
    JSON.stringify({ name: 'smoke-consumer', private: true, type: 'module' }, null, 2)
  );
  run(
    'npm',
    ['install', '--no-audit', '--no-fund', join(packDir, tarball), 'react@19', 'react-dom@19'],
    consumer
  );

  step('Importing it and rendering a table on the server');
  writeFileSync(
    join(consumer, 'check.mjs'),
    `
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import * as pkg from '${name}';

const expected = ${JSON.stringify(EXPECTED_EXPORTS)};
for (const [type, names] of Object.entries(expected)) {
  for (const exportName of names) {
    assert.equal(typeof pkg[exportName], type, \`export \${exportName} should be a \${type}\`);
  }
}
assert.deepEqual(
  Object.keys(pkg).sort(),
  Object.values(expected).flat().sort(),
  'the package root should export exactly the public API'
);

const html = renderToString(
  createElement(pkg.DataTable, {
    columns: [
      { id: 'name', header: 'Name', sortKey: 'name', cell: ({ row }) => row.name },
      { id: 'email', header: 'Email', cell: ({ row }) => row.email },
    ],
    data: [
      { id: 'a', name: 'Ada', email: 'ada@example.com' },
      { id: 'b', name: 'Bram', email: 'bram@example.com' },
    ],
    sort: { sortKey: 'name', direction: 'asc', handleSort: () => {} },
    pagination: {
      totalCount: 2, pageIndex: 0, pageSize: 10,
      hasNextPage: false, hasPreviousPage: false,
      onNextPage: () => {}, onPreviousPage: () => {},
    },
  })
);
for (const fragment of ['<table', 'Ada', 'bram@example.com', 'aria-sort="ascending"', 'aria-label="Next page"', 'Showing 1-2 of 2 results']) {
  assert.ok(html.includes(fragment), \`rendered table should contain \${fragment}\`);
}

const cssPath = fileURLToPath(import.meta.resolve('${name}/styles.css'));
const css = readFileSync(cssPath, 'utf8');
for (const block of ${JSON.stringify(BLOCKS)}) {
  // The block or one of its elements: rdt-action-menu has no root of its own.
  assert.match(css, new RegExp(\`\\\\.\${block}(?![a-z0-9-])\`), \`styles.css should style .\${block}\`);
}
const themeTokens = new Set(${JSON.stringify(THEME_TOKENS)});
for (const [, name] of css.matchAll(/var\\(--([a-z0-9_-]+)/g)) {
  assert.ok(
    name.startsWith('_rdt-') || name.startsWith('rdt-') || themeTokens.has(name),
    \`styles.css reads --\${name}, which is neither an rdt- property nor a theme token\`
  );
}

// The layered copy is the same rules inside one cascade layer.
const layerPath = fileURLToPath(import.meta.resolve('${name}/styles.layer.css'));
const layered = readFileSync(layerPath, 'utf8');
assert.ok(layered.startsWith('@layer react-data-table {'), 'styles.layer.css should open the react-data-table layer');
assert.ok(layered.includes(css), 'styles.layer.css should wrap the whole of styles.css');

const tablePath = fileURLToPath(new URL('./components/data-table/data-table.js', import.meta.resolve('${name}')));
assert.match(readFileSync(tablePath, 'utf8'), /^'use client';/, "data-table.js should keep its 'use client' directive");

console.log('    exports, server render, both stylesheets and use-client directive OK');
`
  );
  console.log(run('node', ['check.mjs'], consumer).trimEnd());
} catch (error) {
  failed = true;
  console.error('\n  Smoke test FAILED');
  console.error(error.stderr?.toString() || error.stdout?.toString() || error.message);
} finally {
  rmSync(packDir, { recursive: true, force: true });
  rmSync(consumer, { recursive: true, force: true });
}

if (failed) {
  process.exit(1);
}
console.log('\n  Smoke test passed');
