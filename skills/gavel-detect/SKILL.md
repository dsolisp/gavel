---
name: gavel-detect
description: >
  Auto-detect the project's test automation stack: framework (Playwright,
  Selenium, Cypress, WebdriverIO), test runner (pytest, JUnit, TestNG,
  Cucumber, Behave), language, POM pattern, and CI system. Activates the
  matching gavel framework profile. Use when the user says "gavel-detect",
  "/gavel-detect", "detect my stack", or "what framework am I using".
---

# Gavel Detect

Scan the project and identify the test automation stack. Activate the matching
framework profile automatically.

## Detection Method

Check these signals in order:

### Automation Framework

| Signal | Framework |
|--------|-----------|
| `@playwright/test` in package.json, `playwright.config.*` | **Playwright** |
| `selenium` in requirements.txt/pyproject.toml, `chromedriver` in PATH | **Selenium (Python)** |
| `org.seleniumhq.selenium` in pom.xml/build.gradle | **Selenium (Java)** |
| `Selenium.WebDriver` in .csproj | **Selenium (C#)** |
| `cypress` in package.json, `cypress.config.*` | **Cypress** |
| `@wdio/cli` in package.json, `wdio.conf.*` | **WebdriverIO** |

### Test Runner

| Signal | Runner |
|--------|--------|
| `pytest` in requirements.txt, `conftest.py`, `pytest.ini` | **pytest** |
| `junit` in pom.xml, `@Test` annotations | **JUnit** |
| `testng.xml`, `@Test` with TestNG imports | **TestNG** |
| `cucumber` in deps, `*.feature` files | **Cucumber** |
| `behave` in requirements.txt, `features/` dir | **Behave** |
| `@playwright/test` | **Playwright test runner** |
| `mocha`/`jest`/`vitest` in package.json | **Mocha/Jest/Vitest** |

### Language

Detect from file extensions: `.ts`/`.js` = TypeScript/JavaScript, `.py` = Python,
`.java` = Java, `.cs` = C#.

### POM Pattern

| Signal | Pattern |
|--------|---------|
| `export function` + mixin composition | **Functional/Mixin POM** |
| `export class` + constructor injection | **Class-based POM** |
| `class` + `@inject` or DI container | **DI-based POM** |
| No page objects found | **No POM** |

### CI System

| Signal | CI |
|--------|-----|
| `.github/workflows/*.yml` | **GitHub Actions** |
| `.gitlab-ci.yml` | **GitLab CI** |
| `Jenkinsfile` | **Jenkins** |
| `azure-pipelines.yml` | **Azure DevOps** |
| `.circleci/config.yml` | **CircleCI** |

## Output

```
  gavel-detect results:

  Framework:     Playwright
  Version:       1.61.x (check package.json / lockfile for exact)
  Test runner:   @playwright/test
  Language:      TypeScript
  POM pattern:   Mixin composition
  CI system:     GitHub Actions
  Profile:       gavel-playwright (activated)
```

Include detected **version** from `package.json`, `requirements.txt`, `pom.xml`,
or lockfile when available. Cross-check profile **Current release** section —
flag if project is more than one minor behind.

| Framework | Typical package | As of 2026-07-01 |
|-----------|-----------------|------------------|
| Playwright | `playwright` / `@playwright/test` | 1.61.1 |
| Cypress | `cypress` | 15.18.0 |
| WebdriverIO | `webdriverio` | 9.29.0 |
| Selenium (Py) | `selenium` | 4.45.0 |
| Cucumber.js | `@cucumber/cucumber` | 13.0.0 |
| Behave | `behave` | 1.3.3 |

If no framework is detected: `No test framework detected. Run /gavel-init to bootstrap one.`

## Profile Activation

Once detected, the matching profile is activated for the session:
- Playwright -> `gavel-playwright`
- Selenium -> `gavel-selenium`
- Cypress -> `gavel-cypress`
- WebdriverIO -> `gavel-webdriverio`
- Cucumber/Behave -> `gavel-cucumber`

The profile injects framework-specific patterns into all gavel skills.

## Boundaries

Read-only. Detects and reports. Does not modify any files.
"stop gavel-detect" or "normal mode" to revert.
