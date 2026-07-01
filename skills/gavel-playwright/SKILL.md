---
name: gavel-playwright
description: >
  Playwright framework profile for gavel. Playwright-specific locator APIs,
  fixtures, web-first assertions, and run commands. Activated by gavel-detect.
  Cross-framework UI patterns live in gavel-e2e, not here.
---

# Gavel Playwright Profile

Playwright-specific bindings only. Universal POM/workflow rules: `gavel` + `gavel-e2e`.

**Current release (as of 2026-07-01):** `1.61.1` (patch; feature release `1.61.0`, 2026-06-15)

## Locators

```typescript
page.getByRole('button', { name: 'Submit' })     // 1st
page.getByLabel('Email')                         // 2nd
page.getByPlaceholder('Enter email')             // 3rd
page.getByText('Welcome')                        // 4th
page.getByTestId('submit-btn')                   // 5th — last resort
// NEVER: page.locator('.btn') or XPath
```

`getByRole` supports `description` option (v1.60+) for accessible description matching.

## Selector Boundary

Only locator classes create targets. Actions/specs call named locators — no
`locator.locator()`, `page.$`, or `querySelector` in specs/actions.

## Assertions (web-first)

```typescript
await expect(locator).toBeVisible();
await expect(locator).toHaveText('Success');
await expect(page).toHaveURL(/\/dashboard/);
await expect(response).toBeOK();
await expect(locator).toMatchAriaSnapshot(`- button "Submit"`);
await expect(page).toHaveScreenshot('screen.png', { mask: [loc.dynamic] });
```

Polling (specs only — see Assertion Layering):

```typescript
await expect.poll(() => actions.getGridState()).not.toBe('loading');
await expect.soft.poll(() => count()).toBeGreaterThan(0);  // v1.61+
await expect(async () => { /* multi-step */ }).toPass({ timeout: 10_000 });
```

## DI via Fixtures

```typescript
import { test as base } from '@playwright/test';

export const test = base.extend<{ adminPage: AdminPage }>({
  adminPage: async ({ page }, use) => {
    const p = new AdminPage(page);
    await p.login();
    await use(p);
  },
});
```

## Logical Grouping

```typescript
await test.step('Navigate', async () => { await actions.openDashboard(); });
```

## Wait Strategy

No `waitForTimeout()` or `networkidle`. Prefer `expect()` auto-retry, then:

```typescript
await page.waitForResponse(r => r.url().includes('/api/data'));
await locator.waitFor({ state: 'visible' });
```

## Assertion Layering

`expect()` and `expect.poll()` live in **specs only**. Actions return state;
specs assert. See `gavel` Test Constitution.

## Run Commands

```bash
npx tsc --noEmit
npx eslint .
npx playwright test --project=chromium
npx playwright test -g "test name"
npx playwright show-report
npx playwright test --trace on   # debug
```

## Release Highlights (1.61.x)

Use when upgrading or choosing APIs:

| Feature | API | Notes |
|---------|-----|-------|
| WebAuthn passkeys | `context.credentials.create()` / `.install()` | Virtual authenticator; no hardware |
| Web Storage | `page.localStorage`, `page.sessionStorage` | Prefer over `evaluate(localStorage…)` |
| Video modes | `testOptions.video` | Same mode names as `trace` (`retain-on-failure-and-retries`, etc.) |
| Soft poll | `expect.soft.poll()` | Non-fatal polling assertion |
| API TLS info | `apiResponse.securityDetails()`, `.serverAddr()` | APIRequestContext responses |
| WebSocket in traces | HAR + trace | WS traffic recorded |
| CLI | `-G` | Shorthand for `--grep-invert` |
| Browsers | Chromium 149, Firefox 151, WebKit 26.5 | Ubuntu 26.04 supported |

**Upgrade note:** Pin `1.61.1` if using Node 22.15+ (sync loader fix in patch).

## Release Highlights (1.60.x — still relevant)

| Feature | API |
|---------|-----|
| HAR on tracing | `context.tracing.startHar()` / `stopHar()` |
| File drop simulation | `locator.drop({ files })` |
| Abort test from hook | `test.abort('reason')` |
| Aria on Page | `expect(page).toMatchAriaSnapshot()` |

## API Testing (no browser)

```typescript
test('GET /users', async ({ request }) => {
  const response = await request.get('/api/users');
  await expect(response).toBeOK();
});
```

## Component Testing

```typescript
import { test, expect } from '@playwright/experimental-ct-react';
test('button', async ({ mount }) => {
  const c = await mount(<Button label="Submit" />);
  await expect(c.getByRole('button', { name: 'Submit' })).toBeVisible();
});
```

## Tags

Use project `grep` / `grepInvert` or inline `test.describe` grouping.
Common conventions: `@smoke`, `@sanity`, `@regression`, `@integration`.
