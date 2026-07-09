---
name: gavel-cypress
description: >
  Cypress framework profile for gavel. Auto-retry assertions, cy.intercept,
  Studio, cy.prompt, and run commands. Activated by gavel-detect.
---

# Gavel Cypress Profile

Cypress-specific bindings. Universal POM/workflow: `gavel` + `gavel-e2e`.

**Current release (as of 2026-07-01):** `15.18.0` (2026-06-23) — Cypress 15.x line

## Locators

```javascript
cy.get('[role="button"]').contains('Submit')
cy.get('[aria-label="Email"]')
cy.get('[data-testid="submit-btn"]')   // last resort
// NEVER: cy.get('.btn-primary') or deep CSS chains in specs
```

Selectors belong in page helpers / custom commands, not spec bodies.

## Assertions (auto-retry)

```javascript
cy.get('[role="alert"]').should('be.visible');
cy.get('[role="alert"]').should('contain.text', 'Success');
cy.url().should('include', '/dashboard');
cy.intercept('POST', '/api/data').as('postData');
cy.wait('@postData').its('response.statusCode').should('eq', 200);
```

## Cross-Origin

```javascript
cy.origin('https://other.example', () => {
  cy.get('[data-cy="submit"]').click();
});
```

## DI via Custom Commands

```javascript
// support/commands.js
Cypress.Commands.add('loginAsAdmin', () => {
  cy.session('admin', () => { /* login */ });
});
```

## POM Pattern

```javascript
export class DashboardPage {
  visit() { cy.visit('/dashboard'); }
  metricsCard() { return cy.get('[data-testid="metrics"]'); }
}
```

## Wait Strategy

No `cy.wait(ms)`. Use:

```javascript
cy.get('[role="status"]').should('not.exist');
cy.intercept('GET', '/api/data').as('data');
cy.wait('@data');
```

## Run Commands

```bash
npx eslint .
npx cypress run --browser chrome
npx cypress open
npx cypress run --spec "cypress/e2e/dashboard.cy.js"
bun run cypress run    # Bun supported since 15.17
```

## Release Highlights (15.x — current)

| Feature | Status | Notes |
|---------|--------|-------|
| `cy.prompt()` | Beta (15.14+) | Plain-English test steps; no feature flag |
| Cypress Studio | Default (15.0+) | No `experimentalStudio` flag required |
| `Cypress.ElementSelector` | Renamed | Was `Cypress.SelectorPlayground` |
| Node.js | 20, 22, or 24 required | 18 dropped in v15 |
| Bun | Supported | `bun run cypress` |
| `Cypress.expose()` | Per-suite overrides | `{ expose: { key: value } }` in describe/it config |
| `removeSRIAttributes` | Config option | Strips `integrity` on rewritten first-party assets |
| WebKit | Experimental | Use for Safari-like runs when enabled |

## Migration Notes (14 → 15)

- Drop Webpack 4, Vite 4, Angular 17, Firefox-via-CDP
- Rename `Cypress.SelectorPlayground` → `Cypress.ElementSelector`
- Custom commands named `prompt` conflict with built-in `cy.prompt()` — rename them

## Environment

- Linux: glibc 2.31+ (Ubuntu 20.04+)
- macOS: Big Sur (11) or newer for Node 20+

## Anti-Patterns

### Polling Trap

**Wrong:** Manual polling with `cy.wait(ms)`.

```javascript
// BAD — arbitrary wait
cy.get('[role="alert"]').should('exist');
cy.wait(3000);
cy.get('[role="alert"]').should('contain.text', 'Success');
```

**Right:** Use Cypress auto-retry assertions.

```javascript
// GOOD — native retry
cy.get('[role="alert"]').should('be.visible').and('contain.text', 'Success');
```

*Reference:* AGENTS.md — QA Ladder rung 3 (native assertions), Test Constitution rule 6 (native retrying assertions).

### Manual Waits

**Wrong:** Fixed millisecond wait.

```javascript
// BAD
cy.wait(5000);
cy.get('[data-testid="result"]').should('be.visible');
```

**Right:** Wait for specific network request or element state.

```javascript
// GOOD — network-aware
cy.intercept('GET', '/api/data').as('data');
cy.wait('@data');
cy.get('[data-testid="result"]').should('be.visible');
```

*Reference:* AGENTS.md — Test Constitution (WON'T DO) #2: no `cy.wait(ms)`.

### Selector Leaks

**Wrong:** Raw selectors in spec bodies.

```javascript
// BAD — selector in spec
it('shows success', () => {
  cy.get('[data-testid="submit"]').click();
  cy.get('[role="alert"]').should('contain.text', 'Success');
});
```

**Right:** Page objects own selectors; specs call named methods.

```javascript
// GOOD
class DashboardPage {
  visit() { cy.visit('/dashboard'); }
  submitButton() { return cy.get('[data-testid="submit"]'); }
  alert() { return cy.get('[role="alert"]'); }
}

it('shows success', () => {
  const page = new DashboardPage();
  page.submitButton().click();
  page.alert().should('contain.text', 'Success');
});
```

*Reference:* AGENTS.md — Selector Boundary Rule, Page Object Discipline.
