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

## Anti-Patterns

### Polling Trap

**Wrong:** Manual polling loop with sleep.

```python
# BAD — manual polling
for _ in range(20):
    try:
        el = driver.find_element(By.CSS_SELECTOR, "[role='alert']")
        if el.is_displayed():
            break
    except NoSuchElementException:
        pass
    time.sleep(0.5)
```

**Right:** Use `WebDriverWait` with expected conditions.

```python
# GOOD — native retry
wait = WebDriverWait(driver, 10)
el = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "[role='alert']")))
```

*Reference:* AGENTS.md — QA Ladder rung 3 (native waits), Test Constitution rule 6 (native retrying assertions).

### Manual Waits

**Wrong:** Fixed sleep.

```python
# BAD
time.sleep(3)
assert "Success" in driver.find_element(By.CSS_SELECTOR, "[role='alert']").text
```

**Right:** Explicit wait with expected condition.

```python
# GOOD
wait = WebDriverWait(driver, 10)
el = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "[role='alert']")))
assert "Success" in el.text
```

*Reference:* AGENTS.md — Test Constitution (WON'T DO) #2: no `time.sleep()`.

### Selector Leaks

**Wrong:** Raw selectors in specs/actions.

```python
# BAD — selector in spec
def test_shows_success(driver):
    driver.find_element(By.CSS_SELECTOR, "[data-testid='submit']").click()
    assert "Success" in driver.find_element(By.CSS_SELECTOR, "[role='alert']").text
```

**Right:** Locators own selectors; specs call named properties.

```python
# GOOD
class DashboardLocators:
    def __init__(self, driver):
        self.driver = driver
    @property
    def submit_button(self):
        return self.driver.find_element(By.CSS_SELECTOR, "[data-testid='submit']")
    @property
    def alert(self):
        return self.driver.find_element(By.CSS_SELECTOR, "[role='alert']")

def test_shows_success(driver):
    locators = DashboardLocators(driver)
    locators.submit_button.click()
    assert "Success" in locators.alert.text
```

*Reference:* AGENTS.md — Selector Boundary Rule, Page Object Discipline.
