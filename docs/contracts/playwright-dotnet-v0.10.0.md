# Contract: Playwright.NET Language Surface (v0.10.0)

> **SUPERSEDED (v0.10.0):** This contract is superseded by
> [`dotnet-ecosystem-v0.10.0.md`](./dotnet-ecosystem-v0.10.0.md), which widens the
> .NET surface to the full ecosystem — Appium (`gavel-appium`), Selenium C# full
> constitution audit (`gavel-selenium`), and the C# common libraries
> (NUnit/xUnit/MSTest/SpecFlow/Reqnroll/FluentAssertions). Retained for historical
> reference; the Playwright.NET decisions below still hold, but the "Selenium C#
> audit — out of scope" and "detect-only" notes are no longer accurate.

**Status:** Design contract — items #1–#2 implemented on branch; rule ports and remaining prompts open.  
**Date:** 2026-07-20  
**Release:** v0.10.0  
**Audience:** Contributors implementing or reviewing the Playwright.NET language surface

---

## Problem

C# / Playwright.NET suites are invisible to Gavel today:

1. `walkFiles` only collects `ts|tsx|js|jsx|py|java|feature` — **not** `.cs`.
2. `TEST_FILE_RE` does not match NUnit/xUnit/MSTest naming (`*Test.cs`, `*Tests.cs`).
3. `gavel-detect` recognizes Selenium C# (`.csproj` + `Selenium.WebDriver`) but **not** `Microsoft.Playwright`.
4. Manual-wait patterns target Java-style `Thread.sleep` (lowercase), not C# `Thread.Sleep` / `Task.Delay` / `WaitForTimeoutAsync`.

Playwright on Python (`pytest-playwright`) is already first-class. Playwright.NET must reach parity for the shared constitution tags — without new rule tags.

---

## Locked product decisions

| Decision | Value |
|----------|-------|
| Package | `Microsoft.Playwright` only |
| Profile | Extend `gavel-playwright` (no new skill package) |
| Primary runner | NUnit (official Playwright.NET template) |
| Also discover | MSTest / xUnit via `*Test.cs` / `*Tests.cs` |
| Profile pin | Playwright.NET **1.61.0** (align with Node 1.61.x line) |
| Freshness key | `playwright_dotnet` |
| New rule tags | **Zero** |
| Selenium C# audit | **Out of scope** (detect-only remains) |

---

## Interface budget (≤2 irreversible surfaces)

| # | Surface | Kind | Notes |
|---|---------|------|-------|
| 1 | `.cs` walk + `TEST_FILE_RE` discovery | Irreversible | Once shipped, removing `.cs` scanning is a breaking change |
| 2 | Detect / freshness key `playwright_dotnet` | Irreversible | Manifested in `check-profile-freshness.js` + detect skill |

No additional config schema fields required for v0.10.0. Do **not** change `scope`, `excludePaths`, or `paths` weighting from v0.9.0.

---

## File discovery contract

### `walkFiles`

Extend the extension filter to include `.cs`:

```text
/\.(ts|tsx|js|jsx|py|java|cs|feature)$/
```

### `TEST_FILE_RE`

Shipped regex (v0.10.0 item #1):

```js
/\.(spec|test|cy)\.(ts|js|tsx|jsx|py|java|cs|feature)$|(^|\/)(test_.+|.+_test)\.[a-z]+$|(^|\/)[^/]+Tests?\.cs$/
```

Must match at least:

| Pattern | Example |
|---------|---------|
| `*Test.cs` | `LoginTest.cs` |
| `*Tests.cs` | `LoginTests.cs` |
| `*.spec.cs` / `*.test.cs` | if present |
| Path segments under common test roots | `Tests/`, `tests/`, `E2E/` — via naming, not mandatory path allowlist |

Must **not** treat every `.cs` file as a test (helpers, page objects, factories stay non-test unless they match test naming). Locator/action path heuristics (`locators?/`, `pages?/`, `actions?/`) continue to apply for `all-files` rules.

### Comment stripping

C# uses `//` and `/* */` — reuse the existing JS/TS comment path in `findMatches` (already handles these). No Python docstring path for `.cs`.

---

## Detect + freshness contract

### Detection signals (ordered)

1. `Microsoft.Playwright` `PackageReference` in any `*.csproj`
2. `Microsoft.Playwright.NUnit` / `Microsoft.Playwright.MSTest` / `Microsoft.Playwright.Xunit` package reference
3. Optional supporting signal: `using Microsoft.Playwright;` in scanned sources (secondary; do not require alone)

### Activation

| Detected stack | Profile |
|----------------|---------|
| Playwright.NET | `gavel-playwright` |
| Selenium C# (existing) | `gavel-selenium` (unchanged; still no `.cs` constitution audit until a future release) |

If both Selenium and Playwright packages appear, prefer **Playwright.NET** when `Microsoft.Playwright*` is present.

### Freshness

| Key | Packages | Profile current |
|-----|----------|-----------------|
| `playwright_dotnet` | `Microsoft.Playwright` | `1.61.0` |

Golden fixture: `fixtures/profiles/playwright-dotnet-fresh/` (minimal `.csproj` + PackageReference).

---

## API → rule map

| C# / Playwright.NET pattern | Tag / behavior |
|-----------------------------|----------------|
| `Thread.Sleep(ms)` | `manual-wait` |
| `Task.Delay(ms)` / `Task.Delay(TimeSpan)` with fixed duration | `manual-wait` |
| `WaitForTimeoutAsync(ms)` / `page.WaitForTimeoutAsync` | `manual-wait` |
| Existing `subCase` / `replaceable` / `suggestion` classifiers | Apply after hit (same as TS/Python) |
| `Expect(locator).ToBeVisibleAsync()` and other `Expect` assertions | Clean (native) |
| `GetByRole` / `GetByLabel` / `GetByPlaceholder` / `GetByText` / `GetByTestId` | Locator priority (profile) |
| `page.Locator("css")`, XPath, `QuerySelector*` outside locator class | `selector-leak` / `complex-locator` |
| `new LoginPage(page)` (or similar) inside test methods | `no-di` |
| `[Ignore]` / `[Ignore("msg")]` without bug/reason policy | `skip-marker` / `ignore-no-reason` |
| Bare `Assert.Ignore()` / skip without reason | `skip-marker` |
| Hardcoded URLs, credentials, env literals | `hardcoded-env` (existing patterns + C# analogs) |

### Remediation preference (agents)

1. Prefer Playwright.NET `Expect(...)` auto-retry assertions.
2. Prefer named waits on observable conditions (`WaitForURLAsync`, locator `WaitForAsync`).
3. Signal-driven sync (`ManualResetEventSlim` / `TaskCompletionSource`) only when a readiness owner calls `Set` / completes the TCS — mirror Python `threading.Event` rules; an unset event is **not** an allowed remediation.
4. `gavel-ignore` with reason only for non-replaceable intentional waits.

---

## Backward compatibility

| Scenario | Required behavior |
|----------|-------------------|
| Repo with no `.cs` files | Identical findings to post-v0.9.0 |
| Default config / omitted `excludePaths` | Same default globs as v0.9.0 |
| Existing TS / Python / Java corpora + sample-repos | `npm run verify` green, no finding deltas |
| `scope` / `excludePaths` / `paths` | Unchanged contracts |

---

## Precision / graduation gates

- Add `language: cs` corpus labels under `fixtures/corpus/<tag>/` for every tag exercised by C# ports.
- Minimum corpus precision **≥ 0.90** before any severity / envelopeSeverity change.
- Default graduation verdict for v0.10.0: **HOLD** on all existing tags (language expansion is not a promotion signal).
- Record corpus precision and HOLD rationales in the release’s internal graduation evidence (not published).

---

## Sample repo contract

Path: `fixtures/sample-repos/playwright-dotnet/`

Minimum layout (mirror Playwright TS sample):

```text
playwright-dotnet/
  README.md
  gavel.config.json
  PlaywrightDotnet.csproj
  Tests/LoginGoodTests.cs
  Tests/LoginBadTests.cs
  Pages/Locators/LoginLocators.cs
  Pages/Actions/LoginActions.cs
  Pages/Actions/LoginActionsBad.cs
  Support/Factories.cs
```

Self-check on the sample must produce known bad findings and zero unexpected findings on the good path.

---

## extract-tags / affected-tests

| Convention | Behavior |
|------------|----------|
| File naming | `*Test.cs`, `*Tests.cs` discovered as test specs |
| NUnit | `[Category("smoke")]` → tag `smoke` |
| Framework label | `nunit` when reporting tag framework (Playwright.NET / NUnit `[Category]`) |

---

## Explicit non-goals (v0.10.0)

- Selenium C# constitution audit parity
- New rule tags or severity graduation of existing rules
- Parsing `.csproj` MSBuild beyond PackageReference detection
- Roslyn / AST-based analysis (regex / line heuristics remain)
- Bumping published package version until implementation + verify are green

---

## Tier-R review focus

Cross-review items #1–2 only (file surface + detect/freshness):

1. Does default behavior without `.cs` match pre-v0.10.0?
2. Is `TEST_FILE_RE` too broad (helpers flagged as tests) or too narrow (NUnit specs missed)?
3. Does `playwright_dotnet` freshness collide with Node `playwright` key?
4. Any accidental contract change to `excludePaths` / `scope` / `paths`?
