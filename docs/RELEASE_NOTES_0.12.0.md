# Gavel 0.12.0

**Release date:** August 20, 2026  
**Codename:** .NET + Appium Depth & Baseline Gates

This release delivers full C# rule parity, Appium golden fixtures, incremental adoption via the baseline ratchet, and policy presets for config-driven severity control.

---

## Overview

Gavel 0.12.0 deepens .NET and Appium coverage while adding two enterprise-facing features: a baseline ratchet that gates only *new* violations, and policy presets that let platform teams tune severity without editing individual rule config. The C# scanner surface now matches the TypeScript/JavaScript surface across all shipped tags.

---

## What's New

### Baseline ratchet (`gavel baseline write` / `check`)

Snapshot current self-check findings into `gavel-baseline.json` and fail only on violations not already in baseline. Identity: `path + rule + snippetHash` (line-number-independent via sha256); severity excluded from key. Git-aware when metadata exists. Presets and explicit config files are forwarded through the unified CLI.

### Policy presets

Four config packs — `recommended`, `strict`, `legacy`, `api-only` — selectable via `"preset": "name"` in `gavel.config.json` or `--preset name` on the CLI. Explicit file keys override pack defaults. Unknown preset ID exits with code 2.

### C# rule parity

- **`no-teardown`** — detects `IDisposable.Dispose`, `[TearDown]`, `[OneTimeTearDown]`, `DisposeAsync` as cleanup signals.
- **`bare-test-fail`** — detects `Assert.Fail(` without ticket, `Assert.Throws<>` without follow-up assertion.
- **`test-fail-order`** — detects NUnit `[Test(Order=)]`, `[TestCase]` ordering dependencies.
- **C# corpus** — `language: cs` corpus samples for `no-di`, `no-teardown`, `complex-locator`, `test-fail-order`, `bare-test-fail`, `expect-in-action`, `manual-wait` (NetworkIdle) at 100% precision.

### Appium & mobile

- **`MobileBy` → `AppiumBy` fix hint** — `selector-leak` findings on `MobileBy.*` carry deprecation hint pointing at `AppiumBy.*`.
- **ImplicitWait detection** — `driver.Manage().Timeouts().ImplicitWait` and `ImplicitWait =` fire `manual-wait` with remediation hint.
- **Appium Java/Kotlin skill** (`gavel-appium-java`) — `io.appium:java-client` profile: `AppiumDriver`, `MobileBy` → `AppiumBy` migration, UiAutomator2/XCUITest locator priority.

### Suite-health rollup

- **Freshness + mismatch** — `gavel audit` surfaces csproj pin warnings via `check-profile-freshness.js` knowledge; flags mixed `Microsoft.Playwright` + `Microsoft.Playwright.NUnit` version mismatch in one csproj.
- **Architecture-level signal** — `fatPomFiles` (page files with both locator API and action methods) and `leakFiles` (distinct files with selector-leak findings) replace per-line noise.
- **C# dead-code graph** — `audit-autofix` walks `.cs` page/locator/factory files and counts unused types via identifier references (`new FooPage`, `FooPage` in other files). Suite health prints numeric Dead POMs / locators / factories on C# repos (no `n/a`). `--apply` does not delete `.cs` (`autofix: report-only`).

---

## Fixes

- **`manual-wait` NetworkIdle on C#** — widened regex for `WaitForLoadStateAsync(LoadState.NetworkIdle)`, parameterless `WaitForLoadStateAsync()`, and TS/JS cousins `waitForLoadState('networkidle')`. Sub-case classification: redundant if next line is `Expect`/`WaitForAsync`; otherwise intentional/replaceable.
- **`no-di` BaseTest / `[SetUp]` false positive** — excludes `BaseTest.cs` / `*TestBase.cs` / `*TestsBase` from `no-di`. Only fires inside `[Test]` / `[TestCase]` / `[Fact]` / `[Theory]` methods — not `[SetUp]` / `[OneTimeSetUp]`.
- **`complex-locator` C# CSS/XPath** — widened for `Locator("#...")` and WebForms id prefix patterns. `ExpectedConditions` excluded from `manual-wait` (`DotNetSeleniumExtras.WaitHelpers` is closer to constitution than Sleep).

---

## Install

```bash
npm install @dsolisp/gavel@0.12.0
npx --yes @dsolisp/gavel@0.12.0 self-check .
```

---

## Verify

```bash
npm run verify
```

60/60 unit tests, 16 pre-check scripts (rule copies, manifest, fixtures, corpus precision, baseline schema, docs sync).
