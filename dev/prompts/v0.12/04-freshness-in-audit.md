# Session 04 — Surface profile freshness in `gavel audit`

Obey `dev/prompts/v0.12/00-PROTOCOL.md`. Implement **only** this item. Tier B. Zero new tags.

**Status: shipped.** Do not re-run this session unless verify regresses. Deferred (acceptable): new `stale-pin` tag, audit exit-code change, ENTERPRISE rewrite, `playwright-dotnet-stale` fixture (mismatch + `cypress-stale` already prove `compareFreshness`). Add stale-only fixture when a stale-without-mismatch case is needed (session 13 mop).

## Why

Lesson #5: `gavel-detect` routed profiles correctly; `gavel-audit` did not warn on stale pins. Sinpe shipped `Microsoft.Playwright` **1.55.0** + `Microsoft.Playwright.NUnit` **1.27.1** in one process. All Appium client repos pin `Appium.WebDriver` **7.2.0** vs profile **8.3.2**. A single suite-health warning would have ranked Sinpe P0 immediately.

Knowledge already lives in `scripts/check-profile-freshness.js`. Audit does not call it.

## Read first

- `scripts/check-profile-freshness.js` — `PROFILE_RELEASES` (`playwright_dotnet` current `1.61.0`, `appium_dotnet` `8.3.2`), `parseCsprojPackages`, `collectCsprojDeps`, `detectDotnetFramework` (returns **first** matching package only), `compareFreshness`, `module.exports`
- `scripts/audit-report.js` — builds `suiteHealth`, prints `formatSuiteHealth`
- `scripts/suite-health.js` — summary object + `formatSuiteHealth`
- `scripts/detect.js` — uses `detectDotnetFramework`
- `scripts/verify-profile-fixtures.js` — already runs freshness on `fixtures/profiles/playwright-dotnet-fresh`, `appium-dotnet-fresh`, `selenium-dotnet-fresh`
- `scripts/test/unit.test.js` — `playwright_dotnet freshness reads Microsoft.Playwright from csproj`
- `LESSONS_LEARNED_PLAYWRIGHT_CSHARP.md` §5

## Current gap

`detectDotnetFramework()` walks `PROFILE_RELEASES` packages in order and **returns on the first hit**. For `playwright_dotnet` the package list is:

```js
['Microsoft.Playwright', 'Microsoft.Playwright.NUnit', 'Microsoft.Playwright.MSTest', 'Microsoft.Playwright.Xunit']
```

If both `Microsoft.Playwright` and `Microsoft.Playwright.NUnit` are present at **different** versions, only the first listed package’s version is reported. The mismatch smell is invisible.

Appium precedence already wins over Playwright/Selenium when `Appium.WebDriver` is present — keep that.

## Change

### 1. Reuse freshness in audit suite-health

From `audit-report.js` (or inside `buildSuiteHealthSummary` with `repoRoot`):

- `const detected = detectFramework(repoRoot)` from `check-profile-freshness.js`
- If detected, `compareFreshness(detected.installed, detected.current)`
- Attach to the suite-health object, e.g.

```js
freshness: {
  detected: true,
  framework: 'playwright_dotnet',
  package: 'Microsoft.Playwright.NUnit',
  installed: '1.27.1',
  profileCurrent: '1.61.0',
  status: 'stale-minor', // from compareFreshness
  detail: '...',
}
```

`formatSuiteHealth` adds one line when `freshness.detected` and status is not `fresh`:

```
  Profile freshness: Microsoft.Playwright.NUnit 1.27.1 < pin 1.61.0 (stale-minor)
```

When fresh, omit the line **or** print a quiet `Profile freshness: fresh` — prefer omit to keep the default report small; include in JSON either way.

### 2. Mixed Playwright + Playwright.NUnit versions (C# smell)

After `collectCsprojDeps(repoRoot)` (or per-csproj `parseCsprojPackages` — **per csproj is more accurate** for “in one csproj”):

If a single `.csproj` has both `Microsoft.Playwright` and any of `Microsoft.Playwright.NUnit` / `Microsoft.Playwright.MSTest` / `Microsoft.Playwright.Xunit` and the **Version strings differ**, set e.g.

```js
freshness.packageMismatch: {
  file: 'relative/path.csproj',
  packages: { 'Microsoft.Playwright': '1.55.0', 'Microsoft.Playwright.NUnit': '1.27.1' },
}
```

Print:

```
  Package mismatch: Microsoft.Playwright 1.55.0 vs Microsoft.Playwright.NUnit 1.27.1 (Sinpe-style mixed bindings)
```

(Use the real versions; do not hardcode “Sinpe” in user-facing text. A short `mixed Microsoft.Playwright* versions in <file>` is enough.)

Implement the mismatch helper in `check-profile-freshness.js` and export it (`findPlaywrightPackageMismatch(repoRoot)` → `null | { file, packages }`). Do not change `detectDotnetFramework` return shape in a breaking way — add a sibling function. Existing `verify-profile-fixtures.js` JSON assertions (`framework`, `profile`) must keep passing.

### 3. Exit codes

This is a **warning line**, not a new rule tag. Do **not** fail `gavel audit` solely because of stale freshness unless findings already fail the threshold. Freshness must not flip exit 0 → 1 by itself. CLI `auditExit` keys off `scoredFindings`, not this line.

`check-profile-freshness.js` CLI (`node scripts/check-profile-freshness.js <root>`) **may keep** exiting 1 on stale — that is a dedicated freshness tool. Do not change that contract unless tests require it.

### 4. Do not

- New tag `stale-pin`.
- Hint “package present, PageTest unused” (optional in lesson #3 — skip).
- Network calls to nuget.org.
- Recreate golden fresh fixtures. They already exist.

## Fixtures

Add **`fixtures/profiles/playwright-dotnet-mismatch/`** with a `.csproj` containing:

```xml
<PackageReference Include="Microsoft.Playwright" Version="1.55.0" />
<PackageReference Include="Microsoft.Playwright.NUnit" Version="1.27.1" />
```

Do **not** add this dir to the “must pass freshness” loop in `verify-profile-fixtures.js` as a fresh fixture. Add an explicit assertion:

- `findPlaywrightPackageMismatch(mismatchDir)` is non-null
- versions differ

Optional: `fixtures/profiles/playwright-dotnet-stale/` with NUnit 1.27.1 only — only if you need a stale-without-mismatch case. The mismatch fixture plus existing `cypress-stale` already prove `compareFreshness`. Audit JSON against the mismatch dir should include `packageMismatch`.

Keep `playwright-dotnet-fresh` both packages at `1.61.0` — mismatch helper must return null there.

## Verify wiring

- `scripts/verify-profile-fixtures.js`: mismatch fixture detected; fresh fixture has no mismatch.
- `scripts/test/unit.test.js`: mismatch helper; `formatSuiteHealth` includes the freshness/mismatch line when the summary has those fields.
- Optional: spawn `audit-report.js` on the mismatch fixture `--json` and assert `suiteHealth.freshness` / mismatch.

## Commands

```bash
node scripts/check-profile-freshness.js fixtures/profiles/playwright-dotnet-fresh --json
node scripts/verify-profile-fixtures.js
npm run verify
```

## Done when

- [ ] `gavel audit` / `audit-report.js` suite-health JSON includes freshness when a framework is detected
- [ ] Stale pins render a human-readable `<installed> < pin <current>` line
- [ ] Mixed Playwright + Playwright.NUnit versions in one csproj are flagged
- [ ] Fresh aligned pins do not false-positive mismatch
- [ ] Audit exit code unchanged for freshness-only
- [ ] `npm run verify` green

## Shipped shape (reference for 05+)

- `audit-report.js` calls `buildSuiteHealthSummary`, **then** attaches `health.freshness` / `health.packageMismatch` from `check-profile-freshness.js` (does not change exit code).
- `formatSuiteHealth` prints freshness (when not `fresh`) and mismatch **after** dead-code / constitution lines, **before** Top areas.
- `findPlaywrightPackageMismatch(repoRoot)` exported; `fixtures/profiles/playwright-dotnet-mismatch/` wired in verify + unit tests.
- One line added to `skills/gavel-audit/SKILL.md` — full audit-skill mop is session 13.

## Out of scope

Fat-POM rollup (05). Appium `MobileBy` hint (09). ENTERPRISE refresh (13). Stale-only profile fixture (13, only if needed).
