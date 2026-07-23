# Contract: .NET Ecosystem Parity (v0.10.0)

**Status:** Implemented — supersedes [`playwright-dotnet-v0.10.0.md`](./playwright-dotnet-v0.10.0.md).
**Date:** 2026-07-20
**Release:** v0.10.0
**Audience:** Contributors implementing or reviewing the C# / .NET ecosystem surface

---

## Problem

v0.9.0 gave Playwright.NET a language surface but left the rest of the .NET
ecosystem partial:

1. Selenium C# was **detect-only** — no constitution audit for `driver.FindElement(By.*)` suites.
2. **Appium.NET** (mobile-native) had no profile or detection at all.
3. The C# common libraries — **NUnit / xUnit / MSTest / SpecFlow / Reqnroll / FluentAssertions** —
   were not recognized by the shared rule regexes (C# equality assertions, `[Trait]` tags, xUnit `Skip=`).

This release brings the whole C# / .NET ecosystem to parity with TS/JS/Python/Java
for the shared constitution tags — **without new rule tags**.

---

## Locked product decisions

| Decision | Value |
|----------|-------|
| Appium profile | New dedicated `gavel-appium` skill (mobile-native locators + gestures) |
| Selenium C# | Promoted from detect-only to **full constitution audit** on `gavel-selenium` |
| C# libraries | NUnit + xUnit + MSTest + SpecFlow/Reqnroll + FluentAssertions |
| Appium package | `Appium.WebDriver` (depends on `Selenium.WebDriver`) |
| Appium pin | `Appium.WebDriver` **8.3.2** |
| Selenium C# pin | `Selenium.WebDriver` **4.45.0** |
| Detection precedence | `Appium.WebDriver` → `Microsoft.Playwright` → `Selenium.WebDriver` |
| New rule tags | **Zero** (frozen RULES contract; widen existing regexes only) |
| Roslyn / AST | **No** — regex / line heuristics remain across all languages |

---

## Interface budget (declared exception)

The steady-state budget is **≤2 irreversible surfaces per release**. This release
adds **3**, declared and justified as one cohesive ".NET ecosystem" release:

| # | Surface | Kind | Notes |
|---|---------|------|-------|
| 1 | `gavel-appium` skill + profile | Irreversible | New skill package; registered in `plugin.yaml`, `verify-skills.js`, and `gavel-detect` (AGENTS.md lists profiles by capability, not brand — no profile is named there) |
| 2 | Appium detection + freshness key `appium_dotnet` | Irreversible | Manifested in `check-profile-freshness.js` + `detect.js` + detect skill |
| 3 | Selenium C# profile routing (`selenium_dotnet` → `gavel-selenium` with full audit) | Irreversible | Promotes detect-only to audited surface |

Justification: surfaces 1–2 are technically coupled — `Appium.WebDriver` depends on
`Selenium.WebDriver`, so Appium detection **must** resolve ahead of Selenium (surface 2)
or an Appium repo would mis-route; the `gavel-appium` skill (surface 1) is inert without it.
Surface 3 (promoting Selenium C# from detect-only to full audit) is a deliberate **parity
choice** bundled into this one cohesive ".NET ecosystem" release — not a technical necessity.
It could ship on its own, but splitting it out would leave the C# ecosystem half-audited
across two releases; bundling it is a scope decision, not a dependency constraint.

---

## Rule coverage contract (widen, zero new tags)

All C# coverage is achieved by widening existing rule regexes in `scripts/self-check.js`:

| C# / library pattern | Tag / behavior |
|----------------------|----------------|
| `Assert.AreEqual(...)` (NUnit/MSTest), `Assert.That(x, Is.EqualTo(...))`, FluentAssertions `.Should().Be(...)` on a prose/imported value | `brittle-assert` (FP guard preserved: numeric / `Is.True` / bool stay clean) |
| `Assert.*(...)` or `.Should()` chains inside `pages?/`, `actions?/`, locator files | `expect-in-action` |
| `FindElement(s)`, `AppiumBy.*`, `MobileBy.*` outside a locator class | `selector-leak` |
| `Thread.Sleep`, `Task.Delay`, `WaitForTimeoutAsync` | `manual-wait` |
| `new XPage(...)` / `new XActions(...)` in test bodies | `no-di` (ctor injection / `IClassFixture` / `.For(driver)` stay clean) |
| `[Ignore]`, `Assert.Ignore()`, xUnit `[Fact(Skip=...)]` / `[Theory(Skip=...)]` | `skip-marker` |
| Bare `gavel-ignore` without tag | `ignore-no-reason` |
| Hardcoded URLs / credentials / env literals | `hardcoded-env` |

**Deferred for `.cs`:** `no-step` — NUnit/xUnit/MSTest have no `test.step()` analog
(consistent with the locked contract; unchanged from v0.9.0).

---

## Detect + freshness contract

### Detection precedence (ordered)

`detectDotnetFramework` iterates the dotnet `PROFILE_RELEASES` in this order:

1. `Appium.WebDriver` → `appium_dotnet` → `gavel-appium`
2. `Microsoft.Playwright` → `playwright_dotnet` → `gavel-playwright`
3. `Selenium.WebDriver` → `selenium_dotnet` → `gavel-selenium`

Appium.WebDriver depends on Selenium.WebDriver, so it **must** be checked first;
otherwise an Appium repo would resolve to Selenium. `hasSeleniumCsproj` remains as
fallback evidence.

### Freshness

| Key | Packages | Profile current |
|-----|----------|-----------------|
| `appium_dotnet` | `Appium.WebDriver` | `8.3.2` |
| `selenium_dotnet` | `Selenium.WebDriver` | `4.45.0` |
| `playwright_dotnet` | `Microsoft.Playwright` | `1.61.0` (unchanged) |

Golden fixtures: `fixtures/profiles/appium-dotnet-fresh/`,
`fixtures/profiles/selenium-dotnet-fresh/` (minimal `.csproj` + PackageReference).

---

## Precision / graduation gates (HOLD policy)

- Add `language: cs` corpus labels under `fixtures/corpus/<tag>/` for every tag
  newly exercising C#: `brittle-assert`, `expect-in-action`, `selector-leak`
  (Appium + Selenium), plus existing `no-di`, `skip-marker`, `ignore-no-reason`,
  `manual-wait`, `hardcoded-env`.
- Minimum corpus precision **≥ 0.90** with **zero false negatives** on `cs`.
- **HOLD rule:** if any tag cannot reach 0.90 on `cs`, gate that tag's cs findings
  at `info` / report severity rather than shipping false positives.
- Language expansion is **not** a promotion signal — all existing tags keep their
  v0.9.0 severity (default graduation verdict: **HOLD**).

Achieved: all C#-exercising tags report **100%** precision on `cs` with zero FN
(`node scripts/verify-corpus-precision.js`).

---

## Sample repo contract

Two new repos mirror `fixtures/sample-repos/playwright-dotnet/` (9 files each):

```text
appium-dotnet/    # AppiumBy locators, mobile POM, WebDriverWait, DriverFactory
selenium-dotnet/  # By.CssSelector locators, WebDriverWait + ExpectedConditions
```

Each: `README.md`, `gavel.config.json`, `*.csproj`, `Tests/LoginGoodTests.cs`,
`Tests/LoginBadTests.cs`, `Pages/Locators/LoginLocators.cs`,
`Pages/Actions/LoginActions.cs`, `Pages/Actions/LoginActionsBad.cs`,
`Support/Factories.cs`.

Self-check on each sample produces known bad findings (`selector-leak`,
`manual-wait`, `no-di`, `skip-marker`, `ignore-no-reason`, `expect-in-action`)
and **zero** findings on the good path. `detect.js` resolves
`appium-dotnet` → `gavel-appium`, `selenium-dotnet` → `gavel-selenium`.

---

## extract-tags / affected-tests

| Convention | Behavior |
|------------|----------|
| File naming | `*Test.cs`, `*Tests.cs` discovered as test specs |
| NUnit / MSTest | `[Category("smoke")]` / `[TestCategory("smoke")]` → tag `smoke` |
| xUnit | `[Trait("Category", "smoke")]` → tag `smoke` |
| SpecFlow / Reqnroll | `.feature` `@tag` handled by the cucumber pattern |
| Framework label | `nunit` family when reporting `.cs` tag framework |

---

## Backward compatibility

| Scenario | Required behavior |
|----------|-------------------|
| Repo with no `.cs` files | Identical findings to v0.9.0 |
| Existing TS / JS / Python / Java corpora + sample-repos | `npm run verify` green, no finding deltas |
| Playwright.NET repos | Still resolve to `gavel-playwright` (precedence keeps Playwright between Appium and Selenium) |
| `scope` / `excludePaths` / `paths` | Unchanged contracts |

---

## Explicit non-goals (v0.10.0)

- New rule tags or severity graduation of existing rules
- Parsing `.csproj` MSBuild beyond PackageReference detection
- Roslyn / AST-based analysis (regex / line heuristics remain)
- `no-step` for `.cs` (no `test.step()` analog in C# runners)
- Subject-first / argument-position prose literals in equality assertions — e.g. `"actual".Should().Be("prose.")` and `Assert.That("actual", Is.EqualTo("prose."))`. `proseLiteral` inspects the first quoted literal only, so these are a known false negative (surfaced by Tier-R). Deferred to roadmap v0.11.0 #11 rather than widening the shared, language-agnostic predicate without cross-language FP proof.
- Additional C# assertion-regex widenings — `StringAssert.*`, `Assert.Inconclusive`, FluentAssertions `.Should().Contain(...)`. Evaluated for v0.10.0 but **not shipped**: none has a corpus-proven, cross-language FP-free form, and folding them into `EQUALITY_ASSERTION_RE` risks interacting with `proseLiteral`. Deferred until a corpus gate proves them clean rather than forced into this release.
- Runner-name disambiguation for `.cs` tag extraction — every C# file reports the `nunit` family label (tag extraction itself is runner-agnostic; see `scripts/extract-tags.js`). A `.csproj` PackageReference sniff to name NUnit vs xUnit vs MSTest would add a freshness/profile surface and is out of scope.
