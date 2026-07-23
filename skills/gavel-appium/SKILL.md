---
name: gavel-appium
description: >
  Appium mobile-native framework profile for gavel (C# / .NET client).
  AppiumBy locator priority, native waits, fixture DI, POM composition, and
  dotnet test run commands. Activated by gavel-detect when Appium.WebDriver
  appears in *.csproj.
---

# Gavel Appium Profile

Appium-specific bindings for the .NET client. Universal POM/workflow rules:
`gavel` + `gavel-e2e`.

**Current release (as of 2026-07-01):** `Appium.WebDriver` **8.3.2**

Appium.WebDriver depends on `Selenium.WebDriver`, so it is a superset of the
Selenium C# client. When both packages appear in `*.csproj`, `gavel-detect`
selects **gavel-appium** (Appium wins the precedence check). Mobile-native
tests target physical/emulated devices — there are no URLs to navigate, so
selector strategy and waits carry the whole reliability burden.

## Locator Priority

Prefer stable, platform-agnostic accessibility strategies. XPath is the last
resort (slow, brittle against layout churn).

```csharp
// 1st — cross-platform accessibility id (maps to content-desc / a11y label)
driver.FindElement(AppiumBy.AccessibilityId("submit-button"));

// 2nd — platform-native engine when no accessibility id exists
driver.FindElement(AppiumBy.AndroidUIAutomator(
    "new UiSelector().resourceId(\"com.app:id/submit\")"));
driver.FindElement(AppiumBy.IosNsPredicate("label == 'Submit'"));
driver.FindElement(AppiumBy.IosClassChain("**/XCUIElementTypeButton[`label == 'Submit'`]"));

// last resort — XPath (avoid; recompute on every layout change)
driver.FindElement(AppiumBy.XPath("//android.widget.Button[@text='Submit']"));
```

Legacy `MobileBy.*` is deprecated — prefer `AppiumBy.*`.

## Selector Boundary

Only locator classes call `FindElement` / `AppiumBy.*`. Actions and specs call
named locator properties or methods. Inline `AppiumBy` / `FindElement` chains in
actions or tests are a `selector-leak`.

```csharp
// GOOD — locator layer owns the strategy
public sealed class LoginLocators
{
    private readonly AppiumDriver _driver;
    public LoginLocators(AppiumDriver driver) => _driver = driver;
    public IWebElement SubmitButton => _driver.FindElement(AppiumBy.AccessibilityId("submit-button"));
    public IWebElement ErrorBanner => _driver.FindElement(AppiumBy.AccessibilityId("error-banner"));
}
```

## Waits and Assertions

Native `WebDriverWait` only. No `Thread.Sleep` / `Task.Delay` with a fixed
duration (`manual-wait`).

```csharp
var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(10));
var banner = wait.Until(d => d.FindElement(AppiumBy.AccessibilityId("error-banner")));
Assert.That(banner.Text, Is.EqualTo("Invalid credentials"));
```

Signal-driven sync (`ManualResetEventSlim` / `TaskCompletionSource`) is allowed
**only** when a readiness owner calls `Set()` — an unset gate is a renamed
sleep, not remediation. Mirror the Playwright.NET wait policy.

## DI via Fixtures

Inject the driver and page objects through NUnit `[SetUp]`, xUnit
`IClassFixture<T>` / constructor injection, or MSTest `[TestInitialize]` — do not
`new LoginPage(driver)` inside a test body (`no-di`).

```csharp
// xUnit — constructor injection via IClassFixture
public class LoginTests : IClassFixture<AppiumFixture>
{
    private readonly LoginPage _login;
    public LoginTests(AppiumFixture fixture) => _login = fixture.LoginPage;

    [Fact]
    public void RejectsBadCredentials() => _login.SubmitInvalid();
}
```

## POM: Class-Based Composition

```csharp
public sealed class LoginPage
{
    public LoginPage(AppiumDriver driver)
    {
        Locators = new LoginLocators(driver);
        Actions = new LoginActions(Locators);
    }
    public LoginLocators Locators { get; }
    public LoginActions Actions { get; }
}
```

## Run Commands

```bash
dotnet build
dotnet test
dotnet test --filter "FullyQualifiedName~LoginTests"
# Appium server must be running (appium) with a device/emulator attached.
appium --address 127.0.0.1 --port 4723
```

## Release Highlights (Appium.WebDriver 8.3.x)

| Area | Change |
|------|--------|
| Selenium base | Tracks `Selenium.WebDriver` 4.x — shares `WebDriverWait`, `By`, BiDi plumbing |
| Locators | `AppiumBy` is the canonical builder; `MobileBy` deprecated |
| W3C | Actions API for gestures (`OpenQA.Selenium.Interactions`) over legacy TouchAction |
| Drivers | UiAutomator2 (Android) / XCUITest (iOS) are the supported first-party drivers |
| Sessions | Server-side plugin model; client stays thin over the W3C protocol |

## Gestures

Use the W3C Actions API, not the deprecated `TouchAction`/`MultiTouch`:

```csharp
var finger = new PointerInputDevice(PointerKind.Touch, "finger");
var swipe = new ActionSequence(finger);
swipe.AddAction(finger.CreatePointerMove(CoordinateOrigin.Viewport, 200, 800, TimeSpan.Zero));
swipe.AddAction(finger.CreatePointerDown(MouseButton.Left));
swipe.AddAction(finger.CreatePointerMove(CoordinateOrigin.Viewport, 200, 200, TimeSpan.FromMilliseconds(300)));
swipe.AddAction(finger.CreatePointerUp(MouseButton.Left));
driver.PerformActions(new List<ActionSequence> { swipe });
```

Wrap gestures behind action methods — never inline coordinates in a spec.

## Skip / Ignore Markers

```csharp
[Ignore("TIC-123: emulator unavailable in CI")]   // NUnit — reason + ticket
Assert.Ignore("TIC-456: known iOS regression");     // same policy
[Fact(Skip = "TIC-789: flaky on UiAutomator2")]      // xUnit — reason required
```

Bare `[Ignore]`, `Assert.Ignore()` without reason, or `[Fact(Skip = "")]` →
`skip-marker` / `ignore-no-reason`.

## Anti-Patterns

### Manual Waits

**Wrong:** Fixed sleep to "let the screen settle".

```csharp
// BAD
Thread.Sleep(3000);
Assert.That(locators.ErrorBanner.Text, Is.EqualTo("Invalid credentials"));
```

**Right:** Explicit `WebDriverWait` on the observable condition.

```csharp
// GOOD
var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(10));
var banner = wait.Until(d => locators.ErrorBanner);
Assert.That(banner.Text, Is.EqualTo("Invalid credentials"));
```

*Reference:* AGENTS.md — Test Constitution (WON'T DO) #2: no fixed sleeps.

### Selector Leaks

**Wrong:** `AppiumBy` / `FindElement` in a spec or action.

```csharp
// BAD — strategy in the test
driver.FindElement(AppiumBy.AccessibilityId("submit-button")).Click();
```

**Right:** Locator class owns the strategy; specs call named members.

```csharp
// GOOD
locators.SubmitButton.Click();
```

*Reference:* AGENTS.md — Selector Boundary Rule, Page Object Discipline.

### Gesture Leaks

**Wrong:** Raw coordinate math and `PerformActions` inside a test body.

**Right:** Expose `actions.SwipeToRefresh()` — the spec states intent, the action
owns the coordinates.

*Reference:* AGENTS.md — QA Ladder rung 3 (native waits), Page Object Discipline.
