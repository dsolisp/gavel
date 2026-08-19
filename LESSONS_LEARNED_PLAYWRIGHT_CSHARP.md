# Lessons learned — Playwright.NET / C# audit (client BN suites)

**Date:** 2026-08-17  
**Trigger:** First multi-repo `gavel-audit` against seven production C# suites (4 Playwright.NET, 3 Appium.NET).  
**Status:** Product notes for gavel. Constitution tags stay frozen (zero new rule ids unless a later release budget allows). Prefer regex widen + docs/profile hints.

This audit used gavel 0.11.0 scanners plus human review. The scanners were directionally right on fat POM / `no-di` / `Thread.Sleep`. They **missed the dominant Playwright C# failure mode**.

---

## 1. `NetworkIdle` is the real `manual-wait` on Playwright.NET

**Signal seen:** `await page.WaitForLoadStateAsync(LoadState.NetworkIdle)` — 12 / 31 / 20 / **157** hits across Empresarial, Servicios, Sinpe, IBC. IBC also uses parameterless `WaitForLoadStateAsync()` (defaults to `load`).

**Skill already says:** `gavel-playwright` forbids `networkidle` (TS section: “No `waitForTimeout()` or `networkidle`”). C# section lists `Thread.Sleep` / `Task.Delay` / `WaitForTimeoutAsync` only.

**Scanner:** `manual-wait` regex has no `WaitForLoadStateAsync` / `LoadState.NetworkIdle` / `networkidle`.

**Effect:** Playwright repos reported **0–5 manual waits** while shipping the worst sync strategy Playwright documents. Appium repos looked “worse” because `Thread.Sleep` matches.

**Learn:** Widen `manual-wait` (same tag) for:

- `WaitForLoadStateAsync\s*\(\s*LoadState\.NetworkIdle`
- `WaitForLoadStateAsync\s*\(\s*\)` (optional; default is `load`, still not a locator wait — maybe `confidence: low`)
- TS/JS cousins already partially covered; keep C#/TS parity.

Remediation hint for C#: `Expect(locator).ToBeVisibleAsync()` / `WaitForURLAsync` / `locator.WaitForAsync(Visible)`.

Classify sub-case like existing sleeps: redundant if next line is `Expect`/`WaitForAsync`; otherwise intentional/replaceable.

---

## 2. Fat POM is the default C# shape — `selector-leak` explodes

**Signal:** Every `*Page.cs` owns `private ILocator X => page.GetByRole(...)` **and** click/fill methods. No `pages/locators/` in any of the seven repos.

**Scanner:** Correct per constitution (GetByRole outside locator class = leak). IBC emitted **656** leaks, BNMovil **414**. Dead locators stayed **0**.

**Learn:**

- Keep tagging leaks (do not special-case `*Page.cs` as locator files — that would hide the defect).
- Add a **suite-health rollup**: `fat-pom-files: N` = page files with locator API + actions, so humans see “1 architecture finding / 40 files” instead of 656 lines.
- C# locator-class convention in `gavel-playwright` (`Pages/Locators/` or `pages/locators/`) is right; none of the client repos follow it. Profile examples should show extracting `ILocator` properties **out** of `LoginPage`.
- `page.Locator("#id")` / `#BNCRMP_cphContenidoPagina_*` is the web idiom here. `complex-locator` / a `css-loc` widen for `Locator\(\s*"#` and `Locator\(\s*"//` would distinguish accessibility GetByRole-in-the-wrong-layer vs CSS ids. Still **same tags** (`selector-leak` + existing `complex-locator`).

`NameString` vs `Name` in `GetByRole(new() { NameString = "..." })` is Playwright.NET API, not a leak. Do not flag `NameString`.

---

## 3. `*Test.cs` matches `BaseTest.cs` — `no-di` noise

**Signal:** `TEST_FILE_RE` includes `[^/]+Tests?\.cs$`, so `BaseTest.cs` is a spec. `new BasePage(page)` in `[SetUp]`/`[TearDown]` is NUnit DI, not a spec-body violation.

Client specs **also** do `new TransferenciaRapidaPage(page)` inside `[Test]` — those are real `no-di`.

**Learn:**

- Exclude files named `BaseTest.cs` / `*TestBase.cs` / `*TestsBase.cs` from `no-di` (and probably `hardcoded-env` if the only hit is driver URL in setup — still a finding, but it is infrastructure).
- Alternatively: only fire `no-di` inside methods marked `[Test]` / `[TestCase]` / `[Fact]` / `[Theory]`, not `[SetUp]`.
- `Microsoft.Playwright.NUnit` is referenced everywhere; **zero** classes inherit `PageTest`. Freshness/detect could hint: “package present, PageTest unused” as report-only (no new tag — maybe detect output).

---

## 4. Assertions: NUnit `Assert.That` + `IsVisibleAsync` vs `Expect`

**Signal:** Specs use `Assert.That(await page.ValidarX())` and pages return `bool` from `IsVisibleAsync()`. That does **not** auto-retry. Playwright C# web-first is `await Expect(locator).ToBeVisibleAsync()`.

`brittle-assert` caught some `Is.EqualTo("prose")`. It did **not** catch “bool snapshot of visibility”.

`expect-in-action` **did** catch `using static Microsoft.Playwright.Assertions` in `LoginPage` (IBC, Servicios). Good.

**Learn:**

- Docs: C# spec assertion is `Expect`, not `Assert.That(await locator.IsVisibleAsync())`.
- Optional widen `brittle-assert` / hint only: `IsVisibleAsync()` result asserted in spec without `Expect` — heuristic, `confidence: medium`.
- Keep `expect-in-action` on `Expect(` and `Assert.` inside `pages/`.

---

## 5. Version matrix is chaotic — detect ≠ audit

| Repo | Packages |
|------|----------|
| IBC / Empresarial | Playwright.NUnit **1.53.0** |
| Servicios | Playwright.NUnit **1.51.0** |
| Sinpe | Playwright **1.55.0** + Playwright.NUnit **1.27.1** (mismatch) |
| All Appium | Appium.WebDriver **7.2.0** (pin 8.3.2), Selenium 4.32, `MobileBy` not `AppiumBy` |

`gavel-detect` routed profiles correctly. `gavel-audit` did not fail or warn on freshness. Sinpe can run two different binding generations in one process.

**Learn:** Audit (or detect) should surface freshness the way `check-profile-freshness.js` already knows `playwright_dotnet` / `appium_dotnet`. A single `warning` line in audit suite health (“Playwright.NUnit 1.27.1 < pin 1.61.0”) would have ranked Sinpe P0 immediately. Mixed `Microsoft.Playwright` + `Microsoft.Playwright.NUnit` versions in one csproj is a C#-specific smell.

---

## 6. Dead code scan is blind on C#

All seven repos: Dead POMs 0, dead locators 0, unused factories 0, safe autofix 0.

`audit-autofix` import graph is TS/JS-shaped. C# `using X.pages;` + `new FooPage` is not followed. Reporting “clean dead code” is misleading.

**Learn:** Until C# references are parsed (even regex `new FooPage`), suite health should say `dead-pom: n/a (csharp)` rather than `0`. Do not claim safe autofix on .cs.

---

## 7. Appium C# — what worked / what did not

Worked: `MobileBy` / `FindElement` → `selector-leak`; `Thread.Sleep` → `manual-wait`; Appium-before-Selenium detect; hardcoded `http://127.0.0.1:4723`.

Missed / weak:

- `MobileBy` vs `AppiumBy` not called out (deprecation). Same `selector-leak` tag is enough if the fix hint says `AppiumBy`.
- iOS `Thread.Sleep(50)` in keyboard helper is a polling loop; existing `pollingLoop` / `ManualResetEventSlim` hint is Python/C# sleep-oriented — OK.
- Shared session on iOS/IBC = `flake-risk` (report-only). Not implemented on `.cs`.
- XPath counts existed (22–27) but folded into leak, not `complex-locator` scoring.

`DotNetSeleniumExtras.WaitHelpers` (`ExpectedConditions`) is still the wait library. That is closer to constitution than Sleep. Do not flag `wait.Until(ExpectedConditions...)` as manual-wait.

---

## 8. `no-step` deferred for C# is still correct

NUnit has no `test.step()`. Client uses one `[Test]` per flow + ExtentReports steps. Do not invent a fake step wrapper. Grouping via `[SetUp]` / helper methods is enough. Leave `no-step` skipped on `.cs`.

---

## 9. False confidence from try/catch + ExtentReports

Every `BaseTest` wraps login and teardown in `try/catch` → `ErrorHelper.ManejarError` (screenshot + report) **without rethrow** in several paths. Scanner does not see this. Tests can “pass” after a swallowed login failure depending on helper behavior.

Out of constitution tag set. Document in healer/audit narrative as remaining risk. Do not add a tag in this lesson cycle.

---

## 10. `EvaluateAsync` DOM hacks

BNServicios: `document.body.style.zoom = '80%'`. Breaks hit testing. No rule. Candidate for `manual-wait`? No. Closer to a Playwright anti-pattern note in `gavel-playwright` C# section: never zoom via CSS; use `ViewportSize` / `deviceScaleFactor`.

---

## 11. Recommended gavel follow-ups (priority)

1. **Widen `manual-wait`** for `LoadState.NetworkIdle` / `WaitForTimeoutAsync` already present — NetworkIdle is the gap. Highest ROI. Same tag.  
2. **Suite-health rollup** for fat-POM / leak-files so 656 lines collapse.  
3. **`no-di` skip `[SetUp]` / `BaseTest.cs`**.  
4. **Freshness line on `gavel audit`** for csproj pins (`playwright_dotnet`, `appium_dotnet`). Flag mixed Playwright + Playwright.NUnit versions.  
5. **Dead-code `n/a` on `.cs`** until import graph exists.  
6. **C# `Expect` vs `IsVisibleAsync` + `Assert.That`** in `gavel-playwright` examples (this client’s spec style).  
7. **AppiumBy fix hint** on `MobileBy` leaks.  
8. Optional: `css-loc` / `complex-locator` for `Locator("#...")` and WebForms id prefix patterns (`cphContenidoPagina`).

Do **not** add a `networkidle` rule id. Do **not** treat `*Page.cs` as locator files.

---

## 12. Client corpus (for future fixtures)

Real-world shapes to add under `fixtures/` when implementing the widens:

- `WaitForLoadStateAsync(LoadState.NetworkIdle)` in `pages/LoginPage.cs` after click.  
- `private ILocator X => page.GetByRole(...)` on a Page class (leak, not locator file).  
- `page.Locator("#BNCRMP_cphContenidoPagina_ddlCuentas")`.  
- `BaseTest.cs` with `new LoginPage(page)` in `[SetUp]` (should be clean) vs in `[Test]` (should fire).  
- `using static Microsoft.Playwright.Assertions` inside `pages/LoginPage.cs`.  
- csproj with `Microsoft.Playwright` 1.55 + `Microsoft.Playwright.NUnit` 1.27.  
- `MobileBy.AndroidUIAutomator` on a Page class.  
- `Thread.Sleep(1200)` between Appium clicks.

Sample repos under `fixtures/sample-repos/playwright-dotnet` should look **unlike** this corpus (locators folder, PageTest, Expect in spec, no NetworkIdle).
