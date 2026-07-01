---
name: gavel-robot
description: >
  Robot Framework profile for gavel. Resource files, keyword-driven tests,
  SeleniumLibrary/Browser library locators, and run commands. Activated by
  gavel-detect when robotframework is detected.
---

# Gavel Robot Profile

Robot Framework-specific bindings. Universal workflow: `gavel` + `gavel-e2e`.

**Current release (as of 2026-07-01):** `7.2.0` (2025-12-12)

## Locator Priority

```robot
*** Settings ***
Library    Browser    # Playwright-backed — preferred when available
# Library    SeleniumLibrary

*** Keywords ***
Click Save Button
    Click    role=button[name="Save"]

Fill Email Field
    Fill Text    label=Email    ${email}
```

Prefer `role=`, `label=`, and accessibility-based selectors through **Browser** library.
Avoid bare CSS/XPath in `.robot` files — wrap in resource keywords.

## Selector Boundary

Resource files own locators and low-level keywords. Test cases call named keywords only.

```robot
# resources/billing_keywords.robot  — locator owner
Click Billing Save
    Click    role=button[name="Save"]

# tests/billing.robot  — thin test
*** Test Cases ***
Save Draft
    Click Billing Save
```

## Waits and Assertions

```robot
Wait Until Keyword Succeeds    10s    500ms    Element Should Be Visible    role=button[name="Save"]
Should Contain    ${status}    Draft
```

No `Sleep` except when documented and unavoidable (report-only in audit).

## Structure

```text
tests/
  billing.robot
resources/
  billing_keywords.robot
  common.robot
```

## Run Commands

```bash
robot --outputdir results tests/
robot -i smoke tests/
rebot --merge results/output.xml
```

JUnit-compatible XML: `results/output.xml` → `node scripts/parsers/junit.js results/output.xml`

## DI and Data

Use **Variables** + factory Python keywords or dedicated resource files for test data.
No hardcoded credentials in `.robot` test cases.

## Profile Notes

- **Browser library** → treat like Playwright semantics (`gavel-playwright` for assertion style)
- **SeleniumLibrary** → treat like Selenium semantics (`gavel-selenium`)
- No dedicated Robot POM class pattern — use Resource keywords as the locator/action layer
