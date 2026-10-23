# Contributing

Thanks for your interest in improving `react-data-table`. This guide covers the
development setup and the conventions the project follows.

By participating in this project you agree to abide by the
[Code of Conduct](./CODE_OF_CONDUCT.md).

## Development setup

The project uses [pnpm](https://pnpm.io/). Please don't use npm or yarn, as the
lockfile is pnpm-specific. The Node version is pinned in `.nvmrc` (Node 24); CI
reads the same file.

```bash
git clone https://github.com/anthony-liddle/react-data-table.git
cd react-data-table
nvm use
pnpm install
```

Installing also sets up the Husky git hooks via the `prepare` script.

### Useful scripts

| Script | What it does |
| --- | --- |
| `pnpm storybook` | Run Storybook on port 6006, the main way to work on the table |
| `pnpm test` | Run the unit tests once (Vitest + happy-dom) |
| `pnpm test:watch` | Run the unit tests in watch mode |
| `pnpm test:storybook` | Render every story in headless Chromium: play functions + axe checks (run `pnpm exec playwright install chromium` once first) |
| `pnpm typecheck` | Type-check with `tsc --noEmit` |
| `pnpm lint` | Lint and format check with Biome |
| `pnpm lint:fix` | Apply Biome's safe fixes and formatting |
| `pnpm lint:ci` | The exact lint command CI runs (`biome ci .`) |
| `pnpm format` | Format all files with Biome |
| `pnpm build` | Emit declarations and JS to `dist/` |
| `pnpm build-storybook` | Static Storybook build to `storybook-static/` |
| `pnpm lint:package` | publint + are-the-types-wrong against the packed package |
| `pnpm smoke` | Install the packed tarball in a clean directory and use it |

## Code style

Formatting and linting are both handled by [Biome](https://biomejs.dev/). There
is no ESLint or Prettier in this project. The configuration lives in
`biome.jsonc`.

A few things worth knowing before you touch the config:

- Several rules are deliberately set to `warn` rather than `error`. These are a
  documented backlog, and each one is commented in `biome.jsonc` explaining
  why. Warnings do not fail CI. If you're fixing one, remove the corresponding
  override in the same PR.
- `useExhaustiveDependencies` is off on purpose. Some hook dependency arrays are
  intentionally partial. Please don't "fix" them.
- Biome doesn't format Markdown, so `.md` files are left unformatted.
- Imports are sorted automatically by Biome's assist actions.

Use the `@/` path alias for internal imports (`@/components/...`) rather than
long relative paths.

### Styles

`src/styles.css` is the whole stylesheet, and its class names are public API
(listed in the README's Styling section). When you add or change markup:

- Give every element the package renders an `rdt-` class: `.rdt-block`,
  `.rdt-block__element`, `.rdt-block__element--modifier`. A fixed variant is a
  modifier; state that changes at runtime goes on an attribute (`data-*`,
  `aria-*`, or Radix's own `data-state`).
- A base rule is one class. A modifier or state adds at most one more class,
  attribute or pseudo-class; put any structural part in `:where()`. No IDs and
  no `!important`.
- Read colours through the private `--_rdt-*` properties, never a token
  directly, so a consumer's theme always wins.
- Keep the file free of top-level `@import` and `@layer`: the build wraps it in
  a layer to make `styles.layer.css`, and refuses if it can't.
- The Storybook runs without Tailwind, so the stories' own chrome uses `demo-`
  classes in `.storybook/preview.css`. Don't style package elements there.

### Stories

A play function runs every time someone opens its story, including on the
published Storybook. Visible stories should stay still for visitors, so a play
function that clicks, types, or drags goes on a hidden twin story instead: spread
the visible story, add `tags: ['!dev', '!autodocs']`, and give it the play
function. `pnpm test:storybook` runs the twin, and axe still checks both. A play
function that only reads the screen can stay on the visible story.

## Commit conventions

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) and
are validated by commitlint in a `commit-msg` hook:

```
<type>(<scope>): <subject>
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`,
`build`, `ci`, `perf`, `revert`.

Examples:

```
feat(columns): add per-column visibility persistence
fix(selection): clear drag selection on escape
docs(readme): document the actions menu API
```

Branch names follow `type/kebab-case-description`, e.g. `feat/add-column-groups`
or `fix/pagination-off-by-one`.

Commits should be signed. If you haven't set up commit signing, see
[GitHub's guide](https://docs.github.com/en/authentication/managing-commit-signature-verification).

## Pre-commit hooks

Two hooks run automatically:

- `pre-commit`: `lint-staged` (Biome over staged files) then `pnpm typecheck`
- `commit-msg`: commitlint

If a hook blocks you and you're certain the failure is spurious, `--no-verify`
exists, but CI runs the same checks, so it's usually faster to fix the issue.

## Pull requests

1. Branch off `main` using the naming convention above.
2. Make your change, with tests covering it.
3. Run the full set locally before pushing. This is what the `test` CI job
   runs; CI also builds the Storybook and runs every story in Chromium:
   ```bash
   pnpm lint:ci && pnpm typecheck && pnpm test && pnpm build && pnpm lint:package && pnpm smoke
   ```
4. Open a PR and fill in the template.
5. Wait for the `test`, `storybook build`, and `storybook tests` checks to go
   green, and resolve any review conversations, before merging.

Before marking a PR ready, give the diff a final read for unused imports,
obsolete files, and leftover debug code.

## Releasing

Releases publish to npm from CI; nothing is published from a laptop.

1. Bump `version` in `package.json` in a PR and merge it.
2. Create a GitHub Release whose tag is `v` + that version (e.g. `v0.2.0`).
3. Publishing the release runs `.github/workflows/release.yml`. It checks the
   tag matches the version, reruns lint, typecheck, tests, build, publint/attw
   and the tarball smoke test, then publishes through npm trusted publishing
   (OIDC, environment `npm-publish`) with provenance. If any gate fails,
   nothing is published.

The Storybook redeploys to GitHub Pages on every push to `main`
(`.github/workflows/pages.yml`).

## Reporting bugs

Open an issue using the bug report template. A minimal reproduction, ideally a
Storybook story, makes a fix dramatically more likely.
