---
name: gavel-appium-java
description: >
  Appium mobile-native framework profile for gavel (Java/Kotlin client).
  AppiumBy locator priority, native waits, fixture DI, POM composition, and
  mvn/gradle test run commands. Activated by gavel-detect when io.appium:java-client
  appears in pom.xml or build.gradle.
---

# Gavel Appium Java/Kotlin Profile

Appium-specific bindings for the Java/Kotlin client. Universal POM/workflow rules:
`gavel` + `gavel-e2e`.

**Current release (as of 2026-07-01):** `io.appium:java-client` **9.4.0**

java-client depends on `org.seleniumhq.selenium:selenium-java`, so it is a superset
of the Selenium Java client. When both appear in `pom.xml`, `gavel-detect` selects
**gavel-appium-java** (Appium wins the precedence check). Mobile-native tests target
physical/emulated devices — there are no URLs to navigate, so selector strategy and
waits carry the whole reliability burden.

**Kotlin:** same APIs (`AppiumBy.accessibilityId(...)`, `WebDriverWait`), same rules.
No separate skill needed.

## Locator Priority

Prefer stable, platform-agnostic accessibility strategies. XPath is the last
resort (slow, brittle against layout churn).

```java
// 1st — cross-platform accessibility id (maps to content-desc / a11y label)
driver.findElement(AppiumBy.accessibilityId("submit-button"));

// 2nd — platform-native engine when no accessibility id exists
driver.findElement(AppiumBy.androidUIAutomator(
    "new UiSelector().resourceId(\"com.app:id/submit\")"));
driver.findElement(AppiumBy.iOSNsPredicate("label == 'Submit'"));
driver.findElement(AppiumBy.iOSClassChain("**/XCUIElementTypeButton[`label == 'Submit'`]"));

// last resort — XPath (avoid; recompute on every layout change)
driver.findElement(AppiumBy.xpath("//android.widget.Button[@text='Submit']"));
```

Legacy `MobileBy.*` is deprecated — prefer `AppiumBy.*`.

## Selector Boundary

Only locator classes call `findElement` / `AppiumBy.*`. Actions and specs call
named locator properties or methods. Inline `AppiumBy` / `findElement` chains in
actions or tests are a `selector-leak`.

```java
// GOOD — locator layer owns the strategy
public class LoginLocators {
    private final AppiumDriver driver;
    public LoginLocators(AppiumDriver driver) { this.driver = driver; }
    public WebElement submitButton() {
        return driver.findElement(AppiumBy.accessibilityId("submit-button"));
    }
    public WebElement errorBanner() {
        return driver.findElement(AppiumBy.accessibilityId("error-banner"));
    }
}
```

## Waits and Assertions

Native `WebDriverWait` + expected conditions only. No `Thread.sleep` /
`implicitlyWait` (`manual-wait`).

```java
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
WebElement banner = wait.until(
    ExpectedConditions.visibilityOfElementLocated(
        AppiumBy.accessibilityId("error-banner")));
assertEquals(banner.getText(), "Invalid credentials");
```

## DI via Fixtures

Inject the driver and page objects through JUnit 5 `@ExtendWith` / constructor
injection — do not `new LoginPage(driver)` inside a test body (`no-di`).

```java
@ExtendWith(AppiumExtension.class)
class LoginTests {
    private final LoginPage login;

    @Inject
    LoginTests(LoginPage login) { this.login = login; }

    @Test
    void rejectsBadCredentials() {
        login.submitInvalid();
        // ...
    }
}
```

## POM: Class-Based Composition

```java
public class LoginPage {
    private final LoginLocators locators;
    private final LoginActions actions;

    public LoginPage(AppiumDriver driver) {
        this.locators = new LoginLocators(driver);
        this.actions = new LoginActions(locators);
    }
    public LoginLocators getLocators() { return locators; }
    public LoginActions getActions() { return actions; }
}
```

## Run Commands

```bash
mvn test
mvn test -Dtest=LoginTests
# or Gradle
gradle test
# Appium server must be running with a device/emulator attached.
appium -p 4723
```

## Release Highlights (java-client 9.x)

| Area | Change |
|------|--------|
| Selenium base | Tracks `selenium-java` 4.x — shares `WebDriverWait`, `By`, BiDi plumbing |
| Locators | `AppiumBy` is the canonical builder; `MobileBy` deprecated |
| W3C | Actions API for gestures over legacy TouchAction |
| Drivers | UiAutomator2 (Android) / XCUITest (iOS) are the supported first-party drivers |
| Sessions | Server-side plugin model; client stays thin over the W3C protocol |

## Hybrid Web Context

Hybrid apps embed a webview inside the native shell. Switch context to interact
with web content, then switch back:

```java
// Native → webview
driver.context("WEBVIEW_com.example");
// interact with web elements via named locators (same selector boundary)
driver.context("NATIVE_APP");
```

After switching to a webview context the **selector-leak rule still applies**:
`findElement`, CSS selectors, and XPath in actions or specs are leaks. Locators
live in locator classes regardless of context. Do not inline
`driver.findElement(By.cssSelector(...))` in an action just because the context
changed — expose it as a named locator method.

*Reference:* AGENTS.md — Selector Boundary Rule, Page Object Discipline.

## Anti-Patterns

### Manual Waits

**Wrong:** Fixed sleep to "let the screen settle".

```java
// BAD
Thread.sleep(3000);
assertEquals(locators.errorBanner().getText(), "Invalid credentials");
```

**Right:** Explicit `WebDriverWait` on the observable condition.

```java
// GOOD
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
WebElement banner = wait.until(
    ExpectedConditions.visibilityOf(locators.errorBanner()));
assertEquals(banner.getText(), "Invalid credentials");
```

*Reference:* AGENTS.md — Test Constitution (WON'T DO) #2: no fixed sleeps.

### Selector Leaks

**Wrong:** `AppiumBy` / `findElement` in a spec or action.

```java
// BAD — strategy in the test
driver.findElement(AppiumBy.accessibilityId("submit-button")).click();
```

**Right:** Locator class owns the strategy; specs call named members.

```java
// GOOD
locators.submitButton().click();
```

*Reference:* AGENTS.md — Selector Boundary Rule, Page Object Discipline.
