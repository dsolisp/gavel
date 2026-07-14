# Cypress Sample

Minimal Cypress + JavaScript repo showing the Test Constitution in action.

## Layout

```
cypress/
├── README.md
├── package.json
├── gavel.config.json
├── cypress.config.js
├── cypress/
│   ├── e2e/
│   │   ├── login.good.cy.js
│   │   └── login.bad.cy.js
│   ├── support/
│   │   ├── commands.js
│   │   ├── e2e.js
│   │   └── factories.js
│   └── pages/
│       ├── loginLocators.js
│       ├── loginActions.js
│       └── loginActionsBad.js
```

## Patterns Demonstrated

- **Custom commands** for shared actions (`cy.login()`).
- **Locator helpers** own selectors — specs call helpers, not selectors.
- **Service objects** for page composition.
- **Auto-retry assertions** — `cy.get().should()`.
- **Test isolation** — `beforeEach` setup, factory data.

## Violations Detected In This Sample

| Rule | Where |
|------|-------|
| `expect-in-action` | `pages/loginActionsBad.js` has `expect(...)` |
| `selector-leak` | `pages/loginActionsBad.js` uses raw `querySelector(...)` |
| `manual-wait` | `cy.wait(2000)` in `e2e/login.bad.cy.js` |
| `ignore-no-reason` | bare `// gavel-ignore` in `e2e/login.bad.cy.js` |
| `no-di` | `new LoginActions()` in `e2e/login.bad.cy.js` |
| `no-step` | long spec with multiple `it()` calls and no step grouping |
| `skip-marker` | `it.skip(...)` without reason in `e2e/login.bad.cy.js` |

The scanner matches `*.cy.{js,ts}` files via the expanded `TEST_FILE_RE`.
All spec-level rules (no-di, no-step, skip-marker) fire on Cypress spec files.

`bare-test-fail` and `test-fail-order` do not fire because the bad spec does not
use `test.fail()` or `it.failing()` — Cypress expected-failure patterns differ.
