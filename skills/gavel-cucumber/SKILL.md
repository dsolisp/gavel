---
name: gavel-cucumber
description: >
  Cucumber/BDD framework profile for gavel. Gherkin, step definitions, tags,
  hooks, and parallel execution for Cucumber.js 13+, Behave, and Cucumber-JVM.
  Activated by gavel-detect when .feature files are found.
---

# Gavel Cucumber/BDD Profile

BDD-specific bindings. Step bodies delegate to framework profiles for locators
and assertions.

**Current releases (as of 2026-07-01):**

| Runner | Version | Released |
|--------|---------|----------|
| Cucumber.js (`@cucumber/cucumber`) | **13.0.0** | 2026-06-02 |
| Behave (Python) | **1.3.3** | 2025-09-04 |
| Cucumber-JVM | Check project `pom.xml` / Gradle | — |

## Feature File Structure

```gherkin
@sanity @regression
Feature: Dashboard
  Background:
    Given I am logged in as an admin

  Scenario: Metrics load
    When I navigate to the dashboard
    Then I should see the metrics card

  Scenario Outline: Filter by range
    When I select the "<range>" filter
    Then metrics show "<expected>" data
    Examples:
      | range | expected  |
      | Today | today     |
      | Week  | this week |
```

## Step Definitions (delegate to POM/actions)

```javascript
// Cucumber.js
const { Given, When, Then } = require('@cucumber/cucumber');

Given('I am logged in as an admin', async function () {
  this.adminPage = await AdminPage.create(this.driver);
  await this.adminPage.login();
});
```

```python
# Behave
@given('I am logged in as an admin')
def step_login(context):
    context.admin_page = AdminPage(context.driver)
    context.admin_page.login()
```

## Tags

| Tag | Purpose |
|-----|---------|
| `@smoke` | Critical path |
| `@sanity` | Key features |
| `@regression` | Broad coverage |
| `@wip` | Exclude from CI |
| `@bug-XXX` | Known defect link |

## Hooks

```javascript
Before({ tags: '@sanity' }, async function () {
  this.driver = await createDriver();
});

After(async function () {
  try { await this.apiClient?.deleteTestUser(); } catch { /* idempotent */ }
});
```

## Run Commands

```bash
# Cucumber.js 13+
npx cucumber-js --tags "@sanity and not @wip"
npx cucumber-js --parallel 4        # worker-thread parallel (v13)

# Behave
behave --tags=@sanity features/

# Cucumber-JVM
mvn test -Dcucumber.filter.tags="@sanity"
```

## Cucumber.js 13.0 — Breaking Changes

Read `UPGRADING.md#1300` before upgrading:

| Change | Impact |
|--------|--------|
| Parallel runtime | Reimplemented with **worker threads** |
| `BeforeAll` / `AfterAll` | Always executed (even with parallel) |
| Node.js | **20.x and 25.x dropped**; Node **26.x** added |
| Formatters | Legacy `SummaryFormatter` / `ProgressFormatter` deprecated |
| `FORCE_COLOR` | Set from deprecated format option |

## Behave 1.3.x

- Stable at 1.3.3; use `behave --tags` for filtering
- Step modules in `features/steps/`; `environment.py` for hooks
- Context object (`context`) carries page objects — same layering as Cucumber World

## Boundaries

- Steps orchestrate; they do not own selectors (call locator/action layer)
- No assertions in step helpers — assert in Then steps or delegate to spec-style checks per active UI profile
- Feature files describe behavior, not implementation selectors

## Anti-Patterns

### Polling Trap

**Wrong:** Manual polling in step definitions.

```python
# BAD — manual polling
@then('I should see the metrics card')
def step_check_metrics(context):
    for _ in range(20):
        try:
            el = context.driver.find_element(By.CSS_SELECTOR, "[data-testid='metrics']")
            if el.is_displayed():
                return
        except NoSuchElementException:
            pass
        time.sleep(0.5)
    raise AssertionError("Metrics card not found")
```

**Right:** Delegate to POM with native waits.

```python
# GOOD — native retry via POM
@then('I should see the metrics card')
def step_check_metrics(context):
    context.admin_page.metrics_card().should_be_visible()
```

*Reference:* AGENTS.md — QA Ladder rung 3 (native waits), Test Constitution rule 6 (native retrying assertions).

### Manual Waits

**Wrong:** Fixed sleep in steps.

```python
# BAD
@when('I navigate to the dashboard')
def step_navigate_dashboard(context):
    context.driver.get('/dashboard')
    time.sleep(3)
```

**Right:** Wait for specific element or condition.

```python
# GOOD
@when('I navigate to the dashboard')
def step_navigate_dashboard(context):
    context.driver.get('/dashboard')
    WebDriverWait(context.driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='dashboard']"))
    )
```

*Reference:* AGENTS.md — Test Constitution (WON'T DO) #2: no `time.sleep()`.

### Selector Leaks

**Wrong:** Raw selectors in step definitions.

```python
# BAD — selector in step
@when('I click the submit button')
def step_click_submit(context):
    context.driver.find_element(By.CSS_SELECTOR, "[data-testid='submit']").click()
```

**Right:** Steps call named POM methods.

```python
# GOOD
@when('I click the submit button')
def step_click_submit(context):
    context.admin_page.submit_button().click()
```

*Reference:* AGENTS.md — Selector Boundary Rule, Page Object Discipline.
