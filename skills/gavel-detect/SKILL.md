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
| `Appium.WebDriver` in `*.csproj` (checked first — Appium depends on Selenium) | **Appium (C#)** |
| `Microsoft.Playwright` / `Microsoft.Playwright.NUnit` (or MSTest/Xunit) in `*.csproj` (and no `Appium.WebDriver`) | **Playwright.NET** |
| `selenium` in requirements.txt/pyproject.toml, `chromedriver` in PATH | **Selenium (Python)** |
| `org.seleniumhq.selenium` in pom.xml/build.gradle | **Selenium (Java)** |
| `Selenium.WebDriver` in .csproj (and no `Microsoft.Playwright*` / `Appium.WebDriver`) | **Selenium (C#)** |
| `cypress` in package.json, `cypress.config.*` | **Cypress** |
| `@wdio/cli` in package.json, `wdio.conf.*` | **WebdriverIO** |
| `pytest-playwright` in Python deps | **pytest-playwright** |
| `robotframework` in deps, `*.robot` files | **Robot Framework** |

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
| `pytest-playwright` + `pytest` | **pytest-playwright** |
| `Microsoft.Playwright.NUnit` (or MSTest/Xunit) | **NUnit / MSTest / xUnit** |
| `robotframework` | **Robot Framework** |

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
| Playwright.NET | `Microsoft.Playwright` | 1.61.0 |
| Appium.NET | `Appium.WebDriver` | 8.3.2 |
| Cypress | `cypress` | 15.18.0 |
| WebdriverIO | `webdriverio` | 9.29.0 |
| Selenium (Py) | `selenium` | 4.45.0 |
| Cucumber.js | `@cucumber/cucumber` | 13.0.0 |
| Behave | `behave` | 1.3.3 |
| pytest-playwright | `pytest-playwright` | 0.6.2 |
| Robot Framework | `robotframework` | 7.2.0 |

If no framework is detected: `No test framework detected. Run /gavel-init to bootstrap one.`

## Version Freshness

After detection, run the freshness script when a target repo path is known:

```bash
node scripts/check-profile-freshness.js <target-repo-root> --json
```

Supports **Node** (`package.json`), **Python** (`requirements.txt`, `pyproject.toml`),
and **.NET** (`*.csproj` PackageReference) for Playwright, Playwright.NET, Cypress,
WebdriverIO, Selenium, Cucumber.js, Behave, pytest, pytest-playwright, and Robot Framework.

Interpret `freshness` status:

| Status | Meaning |
|--------|---------|
| `fresh` | Within profile current release window |
| `stale-patch` | One minor behind profile |
| `stale-minor` | More than one minor behind — review profile caveats |
| `stale-major` | Major version behind — migration risk |
| `ahead-major` | Project newer than profile — profile may need update |

Include freshness in detect output:

```
  Freshness:     fresh (playwright @1.61.1, profile current 1.61.1)
```

Golden fixtures: `fixtures/profiles/` (verified by `npm run verify`).

## Profile Activation

Once detected, the matching profile is activated for the session:
- Playwright -> `gavel-playwright`
- Playwright.NET -> `gavel-playwright`
- Appium (C#) -> `gavel-appium`
- Selenium -> `gavel-selenium`
- Cypress -> `gavel-cypress`
- WebdriverIO -> `gavel-webdriverio`
- Cucumber/Behave -> `gavel-cucumber`
- pytest-playwright -> `gavel-playwright`
- Robot Framework -> `gavel-robot`

The profile injects framework-specific patterns into all gavel skills.

## Boundaries

Read-only. Detects and reports. Does not modify any files.
"stop gavel-detect" or "normal mode" to revert.
