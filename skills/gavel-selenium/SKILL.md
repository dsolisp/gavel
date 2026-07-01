---
name: gavel-selenium
description: >
  Selenium WebDriver framework profile for gavel. WebDriverWait, BiDi, relative
  locators, fixture DI, and run commands. Activated by gavel-detect.
---

# Gavel Selenium Profile

Selenium-specific bindings. Universal POM/workflow: `gavel` + `gavel-e2e`.

**Current release (as of 2026-07-01):** `4.45.0` (2026-06-16)

## Locator Priority

```python
# Python — prefer accessibility-friendly strategies
driver.find_element(By.CSS_SELECTOR, "[role='button'][aria-label='Submit']")
driver.find_element(By.XPATH, "//button[@aria-label='Submit']")  # last resort
```

```java
driver.findElement(By.cssSelector("[role='button'][aria-label='Submit']"));
```

Selenium 4 **relative locators** (when semantic ID/label unavailable):

```python
from selenium.webdriver.support.relative_locator import locate_with

above = driver.find_element(locate_with(By.TAG_NAME, "label").above(input_el))
```

## Selector Boundary

Only locator classes call `find_element` / `By.*`. Actions/specs use named
locator properties or methods.

## Waits and Assertions

```python
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

wait = WebDriverWait(driver, 10)
el = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "[role='alert']")))
assert "Success" in el.text
```

```java
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
WebElement el = wait.until(ExpectedConditions.visibilityOfElementLocated(
    By.cssSelector("[role='alert']")));
assertTrue(el.getText().contains("Success"));
```

No `time.sleep()` / `Thread.sleep()`.

## DI via Fixtures

```python
@pytest.fixture
def admin_page(driver):
    page = AdminPage(driver)
    page.login()
    yield page
```

```java
@ExtendWith(AdminPageExtension.class)
class DashboardTest {
    @Test
    void showsMetrics(AdminPage page) { /* injected */ }
}
```

## POM: Class-Based Composition

```python
class AdminPage:
    def __init__(self, driver):
        self.locators = AdminLocators(driver)
        self.actions = AdminActions(self.locators)
```

## Run Commands

```bash
# Python
mypy . && ruff check .
pytest tests/ -v --junitxml=report.xml

# Java
mvn compile && mvn checkstyle:check
mvn test -Dtest=DashboardTest
```

## Release Highlights (4.45.x)

| Area | Change |
|------|--------|
| CDP | Versions 147, 148, 149 supported |
| Electron | `ElectronOptions` / `ElectronDriver` for desktop app automation |
| BiDi | `clearListeners` via `browsingContextIds` for inspectors |
| Grid | Redis-backed `SessionMap` and `SessionQueue` bundled by default |
| Grid | WebSocket proxy performance and backpressure improvements |
| Breaking | Deprecated logging classes removed — migrate to standard logging |

## Driver Selection

- **Chrome/Edge:** prefer built-in manager (`selenium-manager`) — no manual driver paths
- **BiDi:** prefer WebDriver BiDi where supported over legacy JSON Wire Protocol
- **Headless:** use `--headless=new` for Chromium
