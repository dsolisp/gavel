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
# resources/example_keywords.robot  — locator owner
Click Example Save
    Click    role=button[name="Save"]

# tests/example.robot  — thin test
*** Test Cases ***
Save Draft
    Click Example Save
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
  example.robot
resources/
  example_keywords.robot
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

## Anti-Patterns

### Polling Trap

**Wrong:** Manual polling with `Sleep`.

```robot
# BAD — manual polling
*** Keywords ***
Wait For Alert
    FOR    ${i}    IN RANGE    20
        ${visible}=    Run Keyword And Return Status    Element Should Be Visible    role=alert
        IF    ${visible}    RETURN
        Sleep    0.5s
    END
    Fail    Alert not displayed
```

**Right:** Use `Wait Until Keyword Succeeds` or Browser library auto-wait.

```robot
# GOOD — native retry
*** Keywords ***
Wait For Alert
    Wait Until Keyword Succeeds    10s    500ms    Element Should Be Visible    role=alert
```

*Reference:* AGENTS.md — QA Ladder rung 3 (native waits), Test Constitution rule 6 (native retrying assertions).

### Manual Waits

**Wrong:** Fixed sleep.

```robot
# BAD
*** Test Cases ***
Submit Form
    Click    role=button[name="Submit"]
    Sleep    3s
    Element Should Be Visible    role=alert
```

**Right:** Wait for element state explicitly.

```robot
# GOOD
*** Test Cases ***
Submit Form
    Click    role=button[name="Submit"]
    Wait Until Keyword Succeeds    10s    500ms    Element Should Be Visible    role=alert
```

*Reference:* AGENTS.md — Test Constitution (WON'T DO) #2: no `Sleep`.

### Selector Leaks

**Wrong:** Raw selectors in test cases.

```robot
# BAD — selector in test
*** Test Cases ***
Submit Form
    Click    css=[data-testid="submit"]
    Element Should Be Visible    css=[role="alert"]
```

**Right:** Resource keywords own selectors; tests call named keywords.

```robot
# GOOD
*** Keywords ***
Click Submit Button
    Click    css=[data-testid="submit"]

Alert Should Be Visible
    Element Should Be Visible    css=[role="alert"]

*** Test Cases ***
Submit Form
    Click Submit Button
    Alert Should Be Visible
```

*Reference:* AGENTS.md — Selector Boundary Rule, Page Object Discipline.
