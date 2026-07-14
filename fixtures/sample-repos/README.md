# Sample Repositories

Minimal golden repos per supported framework. Each repo demonstrates:

1. **Correct structure** — locator / action / spec layers separated, fixture DI, native waits and assertions.
2. **Common violations** — tagged with the self-check rule that catches them.
3. **`gavel.config.json`** — minimal config showing how to wire Gavel to the stack.

## Repos

| Framework | Language | Path | Good / Bad pair | Rules fired |
|-----------|----------|------|-----------------|-------------|
| Playwright | TypeScript | [`playwright/`](./playwright/) | `login.good.spec.ts` vs `login.bad.spec.ts` | 7 of 9 (40 findings) |
| Cypress | JavaScript | [`cypress/`](./cypress/) | `login.good.cy.js` vs `login.bad.cy.js` | 7 of 9 (12 findings) |
| Selenium | Python | [`selenium/`](./selenium/) | `test_login_good.py` vs `test_login_bad.py` | 5 of 9 (36 findings) |
| WebdriverIO | TypeScript | [`webdriverio/`](./webdriverio/) | `login.good.spec.ts` vs `login.bad.spec.ts` | 7 of 9 (32 findings) |

See each repo's `README.md` for the full rule coverage table.

## Reading Order

1. Skim the README inside one repo to see the layout.
2. Read the `*.good.*` file — the canonical pattern.
3. Read the `*.bad.*` file — same test shape, with comments naming each violation.
4. Open `gavel.config.json` to see the stack wiring.

## How to Verify

From the gavel repo root, point self-check at any sample:

```bash
node scripts/self-check.js fixtures/sample-repos/playwright
node scripts/self-check.js fixtures/sample-repos/cypress
node scripts/self-check.js fixtures/sample-repos/selenium
node scripts/self-check.js fixtures/sample-repos/webdriverio
```

The `.good.*` files produce zero findings. The `.bad.*` files produce a finding per tagged violation.

## What "Minimal" Means

Each sample has:

- One feature area (login)
- One locator class and one action class
- One good spec and one bad spec
- No fixtures/factories beyond what's needed to compile the example
- No README beyond a one-page layout note

Do not add app code, CI config, or any Gavel orchestration to these repos — they exist to teach the patterns, not to run end-to-end.

## Adding a New Framework

1. Copy the closest existing repo as a skeleton.
2. Translate the four violations to the new stack's idioms.
3. Add a row to the table above.
4. Run `npm run verify` from the gavel repo root — the gate must stay green.
