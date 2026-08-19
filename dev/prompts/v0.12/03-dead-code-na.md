# Session 03 — Dead-code honesty: `n/a (csharp)`

Obey `dev/prompts/v0.12/00-PROTOCOL.md`. Implement **only** this item. Tier B. Zero new tags.

## Why

Lesson #6: all seven C# client repos reported Dead POMs 0, dead locators 0, unused factories 0, safe autofix 0. `audit-autofix.js` walks only JS/TS (`CODE_FILE_RE = /\.(ts|tsx|js|jsx)$/`) and looks for `export class`. C# `public class LoginPage` is never scanned. Printing `0` claims the suite is clean. It is not — the scanner is blind.

Until a C# reference graph exists (not this release), suite health must say **not applicable**, not zero.

## Read first

- `scripts/audit-autofix.js` — `CODE_FILE_RE` (L34), `CLASS_EXPORT_RE` (L37), `findDeadPoms` / `findDeadLocators` / `findUnusedFactories`, dry-run counts printed ~L434
- `scripts/suite-health.js` — `buildSuiteHealthSummary` dead fields (L119–128), `formatSuiteHealth` (L140–154), `module.exports`
- `scripts/audit-report.js` — how autofix findings feed suite health
- `scripts/verify-audit-autofix.js` — TS-only dead-pom fixtures under `fixtures/audit-autofix/`
- `scripts/test/unit.test.js` — suite-health test that expects `deadPoms: 1` from a TS finding
- `fixtures/sample-repos/playwright-dotnet/` and `fixtures/sample-repos/appium-dotnet/`
- `LESSONS_LEARNED_PLAYWRIGHT_CSHARP.md` §6

## Current printout

```
  Dead POMs: 0
  Dead locators: 0
  Unused factories: 0
  ...
  Safe autofix candidates: 0
```

JSON: `suiteHealth.deadPoms` is a number (0).

## Change

### Detection of “C# blind”

A repo is C#-scanner-blind for dead-code when the walk would not see POM/locator/factory symbols:

- The target root contains at least one `.cs` file under typical test/page paths **and**
- `audit-autofix` produced no dead-pom/dead-locator/unused-factory candidates **because** `CODE_FILE_RE` excluded `.cs` (always today)

Simplest honest rule (prefer this — smallest):

**If the target repo has one or more `.cs` files (skip `bin/` `obj/` like self-check) and zero `.ts/.tsx/.js/.jsx` files under `pages?/` + `locators?/` + `factories?/` (or zero JS/TS code files at all besides nothing to graph), treat dead-code metrics as n/a.**

Even simpler and good enough for sample repos and the seven client suites: **if any `.cs` file exists in the scan root (excluding bin/obj) and `findDeadPoms`/`findDeadLocators` ran on an empty JS/TS graph, report n/a for those three counts.** Mixed repos (TS + C#) are rare here; if both exist, keep numeric counts for the JS/TS graph and still do **not** claim C# is scanned. Mixed: print numbers for JS/TS plus a note `dead-pom csharp: n/a`. Smallest acceptable mixed behavior: if **any** `.cs` exists, append the n/a note and **do not** pretend C# zeros are included in the JS counts. If the repo is C#-only, replace `0` with n/a.

### Display (`formatSuiteHealth`)

C#-only (or C# with no JS/TS POM graph):

```
  Dead POMs: n/a (csharp)
  Dead locators: n/a (csharp)
```

Unused factories: same `n/a (csharp)` when C# files exist and factories were not JS/TS-scanned. Safe autofix: **do not claim** a numeric safe-autofix count that implies `.cs` was eligible. If autofix candidates are all JS/TS and C# exists, print `Safe autofix candidates: N (js/ts only; csharp n/a)` or `Safe autofix candidates: n/a (csharp)` for C#-only repos.

Do not use the word `0` for those fields on C#-only sample repos.

### JSON

Do **not** keep `deadPoms: 0` on C#-only. Options (pick one and use it everywhere):

- `deadPoms: null` with `deadPomsStatus: "n/a (csharp)"`, or
- `deadPoms: "n/a (csharp)"` (string). **Avoid** if existing consumers assume a number — prefer `null` + sibling status string.

Recommended (smallest breakage):

```js
deadPoms: null,           // was 0
deadLocators: null,
unusedFactories: null,
deadCodeStatus: 'n/a (csharp)',
safeAutofixCandidates: 0  // C#-only: 0 meaning none applied, plus
safeAutofixStatus: 'n/a (csharp)'
```

Update `scripts/test/unit.test.js` suite-health test that currently `assert.equal(summary.deadPoms, 1)` — that fixture is TS; it must **stay numeric**. Add a new unit test for a C# root.

### Do not

- Add `.cs` to `CODE_FILE_RE` and regex-count `new FooPage` as a fake graph.
- Emit `dead-pom` findings on `.cs`.
- Run `--apply` / safe autofix against `.cs`.
- Change JS/TS dead-pom behavior or `fixtures/audit-autofix/` expectations.

## Fixtures / verify

1. Unit test: `buildSuiteHealthSummary([], [], csharpRepoRoot)` (or a tiny temp/fixture dir pointing at `fixtures/sample-repos/playwright-dotnet`) → `deadPoms === null` (or status n/a), `formatSuiteHealth` includes `n/a (csharp)` and does not include `Dead POMs: 0`.
2. Unit test: existing TS autofix summary still has numeric `deadPoms: 1`.
3. Wire `scripts/verify-audit-autofix.js` **or** a few lines in `unit.test.js`: spawn `node scripts/audit-report.js fixtures/sample-repos/playwright-dotnet` (or `--json`) and assert stdout/JSON contains `n/a (csharp)` and does not report `Dead POMs: 0`.

`gavel audit` on the sample repo currently runs self-check too (CLI injects `--with-self-check`). Direct `node scripts/audit-report.js <root> --json` is enough if it builds suite health. Read `audit-report.js` usage; pass whatever flags produce JSON suiteHealth.

## Commands

```bash
node --test scripts/test/unit.test.js
node scripts/audit-report.js fixtures/sample-repos/playwright-dotnet --json
npm run verify
```

## Done when

- [ ] C#-only sample repos print `dead-pom: n/a (csharp)` / `dead-locators: n/a (csharp)` (wording may be `Dead POMs: n/a (csharp)`)
- [ ] JSON does not report `0` as if C# dead-code was measured
- [ ] TS audit-autofix fixtures and unit tests still pass
- [ ] No C# import graph, no new tags
- [ ] `npm run verify` green

## Out of scope

Fat-POM rollup (session 05). Freshness line (session 04).
