# Session 05 — Suite-health rollup for fat-POM architectures

Obey `dev/prompts/v0.12/00-PROTOCOL.md`. Implement **only** this item. Tier B. Zero new tags. Do **not** create a `fat-pom` rule id.

## Why

Lesson #2: every client `*Page.cs` owns `private ILocator X => page.GetByRole(...)` **and** click/fill methods. There is no `pages/locators/` split. Constitution is correct: GetByRole outside a locator class is `selector-leak`. IBC emitted **656** leaks; BNMovil **414**. Humans cannot see the real signal: “1 architecture finding / 40 files.”

Keep tagging every leak. Add a **rollup** so suite health shows architecture-level counts.

## Read first

- `scripts/suite-health.js` — `buildSuiteHealthSummary`, `formatSuiteHealth`, `selectorLeaks` count (L123)
- `scripts/audit-report.js` — JSON `suiteHealth`
- `scripts/self-check.js` — `selector-leak` rule (L676–700), `LOCATOR_FILE_RE = /locators?\//i`, `TEST_FILE_RE`
- `scripts/test/unit.test.js` — existing suite-health summary test (~L45–53)
- `fixtures/sample-repos/playwright-dotnet/` — **good** shape: locators folder, not fat POM
- `LESSONS_LEARNED_PLAYWRIGHT_CSHARP.md` §2 and §11 item 2
- `AGENTS.md` Selector Boundary Rule

## Non-negotiables

- Do **not** special-case `*Page.cs` as locator files. That would hide the defect. `selector-leak` continues to fire on `GetByRole` / `Locator(` / `FindElement` outside `locators?/`.
- Do **not** flag `NameString` vs `Name` as its own issue. `GetByRole(new() { NameString = "..." })` is Playwright.NET API. It remains a leak **if** it appears outside a locator class (wrong layer), which is correct. Add a regression fixture that uses `NameString` in a Page class — it must count as `selector-leak` like `Name` would, and must **not** introduce a second tag or message about NameString.

## Change

### `fatPomFiles` (number)

Count **files** (not lines) that look like a page object owning both locators and actions.

A file counts if **all** of:

1. Path matches `/(?:^|\/)(?:pages?|page-objects?)\//i` **or** basename matches `/Page\.cs$/` (e.g. `LoginPage.cs` even if not under `pages/` — client repos used `Pages/LoginPage.cs` which hits both).
2. Path does **not** match `LOCATOR_FILE_RE` (`locators?/`). Locator files are allowed to contain locator APIs.
3. Content has a **locator API** signal: `ILocator` or `GetByRole` / `GetByText` / `GetByLabel` / `GetByTestId` / `.Locator(` / `FindElement` / `AppiumBy.` / `MobileBy.`
4. Content has an **action** signal: methods that click/fill/type/navigate/submit — smallest reliable regex set, e.g. `.Click` / `ClickAsync` / `.Fill` / `FillAsync` / `GotoAsync` / `Navigate` / `SendKeys` / `Tap` / `TypeAsync`. Prefer matching method **bodies** or public methods, not comments (`findMatches` / line comments).

Do not require both signals on the same line. File-level AND is enough.

TS fat pages (`pages/LoginPage.ts` with `page.getByRole` + `async click`) should count too if they match (3)+(4). Good sample repo `Pages/Locators/` must **not** count (locator dir excluded). Good `Pages/Actions/` with no locator API should **not** count as fat POM (actions-only is the intended split).

### `leakFiles` (number)

`new Set(selfCheckFindings.filter(f => f.tag === 'selector-leak').map(f => f.file)).size`

Distinct files, not distinct lines. `selectorLeaks` line count stays as today.

### Summary object

Add to `buildSuiteHealthSummary` return:

```js
fatPomFiles: N,
leakFiles: N,
```

Always numbers (0 is honest here — this rollup **can** see C#).

### Print

```
  Fat POM files: N
  Leak files: N
```

Place near `Selector leaks:` so 656 leaks sit next to “40 files / 40 fat POMs”. Do not hide the per-line selector-leak findings in the ranked audit list — only the **health block** rollup changes.

### JSON

Same fields on `suiteHealth` for `--json` consumers.

### Do not

- Suppress or sample selector-leak findings.
- Change `selector-leak` regex (MobileBy hint is session 09).
- Change `complex-locator` (session 06).

## Fixtures

Add a **small** rollup fixture dir, e.g. `fixtures/suite-health/fat-pom/`:

```
Pages/LoginPage.cs          # ILocator + ClickAsync + GetByRole — counts as fat POM; also selector-leak
Pages/Locators/OkLocators.cs  # locator dir — not fat POM, not leak
Tests/LoginTests.cs         # optional
```

`LoginPage.cs` must use `GetByRole(new() { NameString = "Submit" })` as the NameString regression.

Unit test: `buildSuiteHealthSummary` with:

- synthetic self-check findings: two `selector-leak` rows in the same file + one in another → `leakFiles === 2`
- scan or pass file contents: one fat page → `fatPomFiles === 1`

If `buildSuiteHealthSummary` does not currently read the disk for page files (it only counts findings), you **must** walk `repoRoot` for the fat-POM file count. Add a `countFatPomFiles(repoRoot)` in `suite-health.js` (reuse excluded dirs: `node_modules`, `bin`, `obj`, … — copy the set from `self-check.js` `EXCLUDED_DIRS` or walk via existing helpers). Call it from `buildSuiteHealthSummary` using `repoRoot`.

`leakFiles` comes from findings; `fatPomFiles` comes from the filesystem walk.

Wire: `scripts/test/unit.test.js` + optionally `verify-audit-autofix.js` is the wrong file — keep tests in `unit.test.js`. If audit-report integration is cheap, spawn audit `--json` on the fat-pom fixture.

Update `fixtures/sample-repos/playwright-dotnet`: it should have **fatPomFiles: 0** (locators extracted). `LoginActionsBad.cs` has leaks but is actions, not a page with both APIs — should not inflate fat POM if it has no `ILocator`/`GetByRole`. Check the actual files; do not force the sample repo to become a fat POM (lesson: sample repos should look **unlike** the client corpus).

## Commands

```bash
node --test scripts/test/unit.test.js
npm run verify
```

## Done when

- [ ] `suiteHealth.fatPomFiles` and `suiteHealth.leakFiles` exist
- [ ] Human health block prints both
- [ ] `*Page.cs` still emits per-line `selector-leak` (no locator-file exemption)
- [ ] `NameString` is not a unique finding type
- [ ] Good locator-folder sample repo is not counted as fat POM
- [ ] `npm run verify` green

## Out of scope

`complex-locator` CSS/XPath scoring (06). Corpus fat-POM samples (08).
