# Public Release — 2026-10-22

- **Repo:** https://github.com/anthony-liddle/react-data-table (public)
- **npm:** https://www.npmjs.com/package/@anthony-liddle/react-data-table (`0.1.0`, with provenance)
- **Storybook:** https://anthony-liddle.github.io/react-data-table/ (GitHub Pages)

This repo's history begins with a single root commit (`8877418`). The pre-release history lives in a separate private archive and was never pushed here.

## 1. Inventory (before this pass)

| Item | Finding |
|---|---|
| Storybook | 10.6.1 with `addon-docs`, `addon-a11y`, `addon-vitest` |
| Stories | 24 visible plus 5 hidden test-only. All seven features have a story; persistence has one each for URL and localStorage. |
| Multi-column sort | Not supported: `sort` holds one key. The Sorting story says so. |
| `storybook build` | Succeeded. Output in `storybook-static/`, 11 MB, 60 files |
| Package build | `tsc` to `dist/` (`.js` + `.d.ts`, `'use client'` kept). Exports map `.` and `./styles.css`, plus a `types` entry. ESM only, `strict: true`. |
| Package metadata | `private: true`. No `license`, `repository`, or `engines`. The name `react-data-table` belongs to an unrelated npm package. |
| Release workflow | None. No publint, attw, or tarball smoke test. |
| Tests | 188 unit and 29 story tests, all passing |

## 2. Source-app references found and removed

The package was extracted from a production app. Before going public, everything that identified that app, its owner, or its product was removed or rewritten. To keep this public report from repeating the material, it lists categories only.

| Category | Resolution |
|---|---|
| Internal ticket keys in comments (3) | Removed |
| Product and feature names in comments and tests | Rewritten generically |
| Product-specific prop JSDoc, which also shipped in the Storybook bundle through docgen | Rewritten |
| Internal error-handler name, in JSDoc and docgen | Rewritten |
| Brand palette colour names | Removed |
| Product column ids and an app error message in a unit test | Replaced with generic ids |
| Domain-specific demo data, story labels, and test fixtures | Replaced by an invented, seeded 120-row "workspace member" dataset with example.com addresses |
| README examples built on the product's schema | Replaced. The README was rewritten from scratch. |
| Provenance prose: the original app's i18n library, router, GraphQL client, icon pipeline, globals.css, modal z-index layering, Biome backlog | Rewritten or removed. The README keeps one sentence saying the package was extracted from a production app. |
| Git history: commit messages and diffs that named the source | Not carried over. This repo starts from one root commit. |

Kept deliberately, because they are generic and functional rather than identifying:

- the `data-test-id="btn.pagination.*"` hooks
- the `z-902` menu layer
- the `.modal-table` CSS
- an internal `highlighted` button variant
- the `PaginationInput` type name

The final export (85 files) was swept for every category above before the repo was created, and again after deploy.

- **Export sweep:** no hits.
- **Deployed Storybook sweep** (46 files, including all 13 story chunks): the only hits were minified identifiers.

## 3. Accessibility

**Method.** `@storybook/addon-a11y` with `@storybook/addon-vitest`. `pnpm test:storybook` renders every story in headless Chromium, runs its play function, and fails on any axe violation (`a11y.test: 'error'`). Hidden audit stories open the column panel and the row-action submenu, and render the dark theme, so axe also covers portaled menus.

### Automated (axe)

- **Before the first fixes:** 28 stories, 12 failing. The raw record is [`reports/a11y/2026-10-22-before.txt`](./a11y/2026-10-22-before.txt).
  - `button-name` ×2 on the pagination buttons, in 10 stories
  - `aria-command-name` ×4 on the column drag handles
  - `aria-required-children` ×1: a `role=menu` holding checkboxes, and its focus trap hid them from keyboard users
  - `aria-hidden-focus`
- **Fixed:**
  - pagination buttons named
  - drag handles became named `<button>`s
  - column panel turned from a menu into a dialog popover
- **False positive:** `aria-hidden-focus` on an open Radix modal menu. Radix hides everything outside the menu while trapping focus inside it, so the hidden focusables can't receive focus. The rule is disabled on that one audit story, with the reason inline.
- **At the start of this pass:** 29/29 stories passed (`reports/a11y/2026-10-22-after.txt`).
- **After this pass:** 29/29 pass locally and in CI. On the deployed Pages site, the addon reported 0 violations for every story (section 5).

### Table-specific checks (not something axe flags)

Measured with Playwright on the built Storybook before fixing, then re-measured on the deployed Pages site.

| Check | Before | After (observed on Pages) |
|---|---|---|
| Sort headers reachable by keyboard | **No.** Headers were clickable `<div>`s; Tab never reached them. | Yes. Tab order is `button "Team"`, `button "Role"`, … |
| Sort state announced | **No.** No `aria-sort` anywhere; the arrow icon is `aria-hidden`. | `aria-sort="ascending"` on the sorted `<th>` only |
| Header association | No `scope`. Grouped parent headers span sub-columns without `scope="colgroup"`. | `scope="col"` on leaf headers; `scope="colgroup"` on "Activity" and "Usage" |
| Distinct control names | 11 buttons named "Actions" (column settings plus one per row) | The column settings trigger is "Column settings"; 10 row triggers remain "Actions" |
| Loading state | No `aria-busy` | `aria-busy="true"` while loading |
| Selection by keyboard | Checkboxes in tab order; Space toggles | Unchanged (Space on a row checkbox gives "1 of 15 selected") |
| Column panel by keyboard | Unreachable (menu focus trap) | Dialog. Focus lands on the first checkbox; Space toggles; Tab reaches "Reorder ⟨column⟩"; Space, arrow, Space moves the column |

Still gaps (documented in the README):

- Drag and click-to-select are mouse-only; the checkboxes are the keyboard path.
- `onRowClick` (row expansion) has no keyboard path.
- Row checkboxes are named "Select row ⟨id⟩".
- Accessible names are English-only.
- Without an action menu, the last data cell's `colSpan=2` puts it under the settings header as well.

## 4. Deployed URLs

- **Storybook:** https://anthony-liddle.github.io/react-data-table/. Deployed by `.github/workflows/pages.yml` on every push to `main`.
- **npm:** https://www.npmjs.com/package/@anthony-liddle/react-data-table
  - `latest` = `0.1.0`, 56 files, 128 kB unpacked
  - SLSA v1 provenance: workflow `anthony-liddle/react-data-table/.github/workflows/release.yml` at `refs/tags/v0.1.0`, source commit `8877418`
  - Sigstore transparency log index `3408618429`
- **Release run:** https://github.com/anthony-liddle/react-data-table/actions/runs/39891724587. Every gate passed, then `npm publish --provenance` printed "Signed provenance statement with source and build information from GitHub Actions" and `+ @anthony-liddle/react-data-table@0.1.0`.
- **Install check:** a clean install of `0.1.0` from the registry passed `npm audit signatures` (verified registry signatures and attestations), imported the package, server-rendered a sorted table (`aria-sort="ascending"` present), and resolved `@anthony-liddle/react-data-table/styles.css`.

## 5. Verified on the deployed Pages origin

All checks ran against `https://anthony-liddle.github.io/react-data-table` with Playwright-driven Chromium.

**The page loads, assets included (the base-path check).**
- `/react-data-table/` returned 200.
- `/react-data-table` (no slash) returned 301 to the slash form.
- In a browser, both landed on `?path=/story/features-sorting--sorting`.
- The preview iframe loaded from `/react-data-table/iframe.html?id=…`, the story rendered, and there were zero 4xx responses.
- Storybook 10's static build uses relative asset URLs, so no `base` setting was needed. The same build was checked under a local `/react-data-table/` subpath before deploying, with and without the trailing slash.

**Every story renders.** All 29 entries in the deployed `index.json` (24 visible plus 5 hidden test-only) loaded through `iframe.html`. Each emitted Storybook's `storyFinished` event with status `success`, which means its play function passed. Every one rendered content, none showed the error display, and none raised a page error.

**The a11y addon runs in the deployed Storybook.**
- Every story's `storyFinished` event carried an `a11y` report with status `passed` and 0 violations, with 9–25 passing rules each.
- The two open-menu audit stories each list one *inconclusive* `aria-valid-attr-value`, which is axe's "needs review" bucket.
- The manager UI's Accessibility panel showed:
  - Sorting: "Violations 0 · Passes 17 · Inconclusive 0"
  - Column Management: "Violations 0 · Passes 19 · Inconclusive 0"
  - Playground: "Violations 0 · Passes 20 · Inconclusive 0"

**URL persistence works on the deployed origin.**
- In URL Persistence I sorted by Name, filtered to Design, and showed Location. The iframe URL gained `sort=name&dir=asc&team=Design&cols=…`.
- The story's share link pointed at `/react-data-table/?path=/story/features-url-persistence--url-persistence&sort=…`, so the subpath was preserved.
- "Reload table from URL" (which deletes this story's localStorage keys, then remounts) restored the view.
- "Open this view in a new tab" restored it, and the manager forwarded the params into the iframe.
- The share link opened in a **brand-new browser context** also restored it. On arrival that context held only Storybook's own two localStorage keys. The view came back as team Design, the Location column, and Name ascending (Bram Dunmore, Hana Galloway, …).

**localStorage persistence survives a reload on the deployed origin.**
- In localStorage Persistence I sorted by Name, filtered to Engineering, and showed Storage. The four keys `datatable:`, `tablesort:…:key` / `:dir`, and `filters:local-storage-demo` were written.
- After a full `page.reload()`, the iframe document loaded with no `sort`, `dir`, `cols`, or `team` params. The view still came back: Engineering, Storage, and Name ascending.
- `sort` and `cols` were still absent from the URL afterwards, so they came from storage. `team=Engineering` reappears afterwards, because the filter hook writes its restored value back to the URL.
- A separate fresh browser profile opened the same story at its defaults.
- Note: localStorage is scoped per origin. On `anthony-liddle.github.io` it is shared with any other Pages project on that origin, and the keys are namespaced by `persistKey`.

**Drag selection with real mouse input.** `page.mouse` down on row 2, a 15-step move to row 7, then up: 6 rows were highlighted mid-drag, and the readout then said "6 selected".

## 6. Guards that failed first

### Storybook build guard (PR #4)

[PR #4](https://github.com/anthony-liddle/react-data-table/pull/4) changed the Sorting story's title to a template literal. That passes `tsc` (the `test` job's Typecheck step passed) but breaks Storybook's static CSF indexing.

- **Red run:** https://github.com/anthony-liddle/react-data-table/actions/runs/39890118943 on `3431eb5`
  - `storybook build`: failure at "Build Storybook"
  - `storybook tests`: failure
  - `test`: failure at its Test step (Vitest initializes the Storybook project even under `--project unit`)
  - The PR showed `mergeStateStatus: BLOCKED`.

  ```
  ▲  🚨 Unable to index ./src/stories/features/sorting.stories.tsx:
  │  Error: CSF: unexpected dynamic title
  │  /home/runner/work/react-data-table/react-data-table/src/stories/features/sorting.stories.tsx
  ■  Error: Unable to index ./src/stories/features/sorting.stories.tsx
  └  Storybook exited with an error
   ELIFECYCLE  Command failed with exit code 1.
  ##[error]Process completed with exit code 1.
  ```

  The error names the story file, which holds exactly one story, Features › Sorting.
- **After the revert:** https://github.com/anthony-liddle/react-data-table/actions/runs/39890263260 on `060be18`, with all three checks green. The PR was closed unmerged.

### Release gate

On a throwaway branch, `package.json` pointed `./styles.css` at a file that doesn't exist, with version `0.1.0-gate-check.1`. A **prerelease GitHub Release** `v0.1.0-gate-check.1` was then published, which ran the real `release.yml` on the real `release: published` event.

I confirmed locally first that the break fails both `publint` and the smoke test (exit 1). This ran before the npm trusted publisher existed, so a wrongly-passing gate could not have published.

- **Run:** https://github.com/anthony-liddle/react-data-table/actions/runs/39890017877 on `d962bf7`, conclusion **failure**.
  - The tag check, Lint, Typecheck, Test, and Build passed.
  - **Lint the package (publint + attw)** failed.
  - The smoke test, the npm version check, and **Publish to npm** were **skipped**.

  ```
  Running publint v0.3.25 for @anthony-liddle/react-data-table...
  Packing files with `pnpm pack`...
  Linting...
  Errors:
  1. pkg.exports["./styles.css"] is ./dist/style.css but the file does not exist.
   ELIFECYCLE  Command failed with exit code 1.
  ##[error]Process completed with exit code 1.
  ```

- **Cleanup:** the prerelease, its tag, and the branch were deleted, and npm returned 404 for the package afterwards. The real `v0.1.0` then went through the same gates green (section 4).

## 7. Still wrong or unfinished

- **npm registry leftovers.** `0.0.0` is the manual bootstrap placeholder that let the trusted publisher be configured. `0.0.0-stage` was created automatically by npm ("Temporary package placeholder for staged publishing"). Neither is `latest` and neither has provenance. Consider deprecating both: `npm deprecate @anthony-liddle/react-data-table@"<0.1.0" "placeholder; use 0.1.0 or later"`, which needs 2FA.
- **Trusted publisher permissions.** It allows direct `npm publish` as well as staged publishing. npm flags direct publishing as "not recommended". Staged publishing would add a 2FA approval per release; the workflow would need `npm stage publish`.
- **Branch protection vs. a sole maintainer.** It requires an approving and code-owner review, but the repo has no `CODEOWNERS` file and only one maintainer, so PRs merge with an admin override after the checks pass. The checks themselves are enforced.
- **Accessibility gaps** (section 3): mouse-only drag and row-click selection; no keyboard path for `onRowClick`; checkbox names built from the row id; English-only accessible names; the last-cell `colSpan`; one inconclusive axe item on open menus that I didn't investigate.
- **Known component issues** (documented in the README): `alwaysVisible` either leaves a no-op checkbox in the single-row column panel or, in grouped tables, makes reordering ineffective. A one-line fix was tried and reverted because it broke reordering. No multi-column sort.
- **CI coupling.** A story that can't be indexed also fails the unit `test` job, because Vitest initializes every project. In the past, `playwright install --with-deps` once hung for more than 20 minutes; every job now has a 15-minute timeout.
- **Storybook UX.** Play functions run on every visit, so tables briefly animate on load, and the five hidden test-only stories are deployed and reachable by URL.
- **Dependabot.** Three PRs opened on the new repo (#1–#3) and are untriaged.
- **Lint backlog.** 34 Biome warnings remain, by design: `noSvgWithoutTitle`, `noImportantStyles`, `noDescendingSpecificity`, `noArrayIndexKey`, `noNonNullAssertion`, and one `useKeyWithClickEvents`.
