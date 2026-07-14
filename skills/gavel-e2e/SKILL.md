---
name: gavel-e2e
description: >
  End-to-end test authoring for any web app. POM with mixins or class-based,
  locator/page separation, fixture DI, framework-adaptive patterns. Use when
  asked to create E2E tests, verify user flows, or improve UI test coverage.
---

# Gavel E2E

E2E test authoring workflow. Framework-adaptive via active profile.

## When to Use

- Create end-to-end tests for any web dashboard
- Verify multi-step user flows (navigation, forms, data display)
- Improve UI test coverage
- Add regression tests for critical user journeys
- Test multi-tenant scenarios

## Workflow

### Step 1: Explore and Map the User Flow

1. Navigate through the real UI and map the flow
2. Identify: navigation path, interactive elements, expected states, loading states

### Step 2: Create/Update Locator Classes

Add selectors using semantic locators (framework-specific, see active profile).
This includes nested, parent, row, and dynamic elements: never leave raw selectors in action chains via `locator.locator`, `querySelector`, `closest`, `.find()`, `$`, `$$`, or equivalent APIs.

### Step 3: Create/Update Action Classes

Add reusable workflows. Actions receive locator classes, never raw pages.

### Step 4: Create/Update Page Objects

Compose locators + actions via mixins (Playwright) or composition (Selenium/WDIO).

### Step 5: Write the Test

Specs are thin. Use fixture DI. Group with test.step() or equivalent.

### Step 6: Run and Validate

Run type-checking, linting, then the test. Verify pass before proceeding.

## Application Redesign Patterns

When the product UI changes but test intent is unchanged (test-maintenance-drift):

1. **Read application source (read-only)** before changing locators
2. **Map old → new surface** — labels, roles, control types, action placement
3. **Fix layer order** — locators → actions → specs
4. **Common patterns (framework-agnostic):**
   - **Async loading shell** — wait for a stable sentinel before interactions
   - **Duplicate action labels** — scope locators to row/card/section, not global first match
   - **Custom dropdowns** — open/close listbox; wait for options; close before next dropdown
   - **Restricted / negative paths** — support optional skip of full page-ready wait
5. **Iterate** — first locator pass often needs a second pass after data-load timing

See active framework profile for syntax (`gavel-playwright`, `gavel-cypress`, etc.).

## Test Structure Best Practices

- **Specs should be thin**: behavior-focused, no inline selectors
- **No selector leakage**: actions/pages/specs call named locators only, even for child or dynamic elements
- **Use web-first assertions**: auto-retrying, no manual waits
- **Prefer real UI navigation**: through sidebar/menus, not direct URL (unless route tests)
- **One test = one user journey**: independent, no shared state
