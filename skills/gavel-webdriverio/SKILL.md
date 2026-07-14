---
name: gavel-webdriverio
description: >
  WebdriverIO v9 framework profile for gavel. expect-webdriverio, BiDi,
  waitForResponse, service objects, and run commands. Activated by gavel-detect.
---

# Gavel WebdriverIO Profile

WebdriverIO-specific bindings. Universal POM/workflow: `gavel` + `gavel-e2e`.

**Current release (as of 2026-07-01):** `v9.29.0` (2026-06-18)

**Note:** v10 is not released yet (wish-list in progress). Stay on v9.x.

## Locators

```typescript
import { $, $$ } from '@wdio/globals';

// Priority: aria / role semantics, then test id
$('aria/Submit')
$('[data-testid="submit-btn"]')
// NEVER: $('.btn-primary') in specs
```

Only locator getters use `$` / `$$`. Actions call named getters.

## Assertions (`expect-webdriverio`)

```typescript
import { expect } from '@wdio/globals';

await expect(locators.alert).toBeDisplayed();
await expect(locators.alert).toHaveText('Success');
await expect(browser).toHaveUrl(expect.stringContaining('/dashboard'));
```

## Service Object POM

```typescript
class DashboardLocators {
  get metricsCard() { return $('[data-testid="metrics"]'); }
  rowAction(name: string) {
    return $(`[role="row"]*=${name}`).$('button=Download');
  }
}

class DashboardPage {
  locators = new DashboardLocators();
  async open() { await browser.url('/dashboard'); }
}
```

## Waits

```typescript
await element.waitForDisplayed({ timeout: 10_000 });
await browser.waitUntil(async () => (await element.getText()) === 'Done');

// Network-aware (v9.27+)
await browser.waitForResponse({ url: /\/api\/data/, statusCode: 200 });
```

No `browser.pause()`.

## DI

```typescript
// wdio.conf.ts — inject via before() hook or custom commands
before: async () => {
  browser.addCommand('adminDashboard', () => new AdminDashboardPage());
}
```

## Run Commands

```bash
npx tsc --noEmit && npx eslint .
npx wdio run wdio.conf.ts
npx wdio run wdio.conf.ts --spec ./test/specs/dashboard.e2e.ts
```

## Release Highlights (9.29.x / 9.28.x)

| Area | Change |
|------|--------|
| `waitForResponse` | Fixed to await network collector response (9.29) |
| EdgeDriver CDN | Supported CDN path for driver downloads (9.29) |
| Logger | CJS compliance fix (9.28) |
| Node 24 | CI compatibility improvements (9.28) |
| BiDi | Protocol generation and type improvements ongoing in v9 |

## v10 Preview (not released)

Planned breaking changes include Node.js 22+ requirement and stricter `$`
single-element matching. Do not target v10 APIs until released.

## Node.js

v9 supports Node 18+. For new projects prefer Node 20 LTS or 22.

## Anti-Patterns

### Polling Trap

**Wrong:** Manual polling with `browser.pause()`.

```typescript
// BAD — arbitrary pause
await element.click();
browser.pause(3000);
await expect(resultElement).toBeDisplayed();
```

**Right:** Use `expect-webdriverio` auto-retry assertions.

```typescript
// GOOD — native retry
await expect(resultElement).toBeDisplayed({ timeout: 10000 });
```

*Reference:* AGENTS.md — QA Ladder rung 3 (native assertions), Test Constitution rule 6 (native retrying assertions).

### Manual Waits

**Wrong:** Fixed pause.

```typescript
// BAD
await browser.pause(5000);
await expect(locators.alert).toBeDisplayed();
```

**Right:** Wait for element state or network response.

```typescript
// GOOD — explicit wait
await locators.alert.waitForDisplayed({ timeout: 10_000 });
// or network-aware (v9.27+)
await browser.waitForResponse({ url: /\/api\/data/, statusCode: 200 });
```

*Reference:* AGENTS.md — Test Constitution (WON'T DO) #2: no `browser.pause()`.

### Selector Leaks

**Wrong:** Raw `$` / `$$` in specs/actions.

```typescript
// BAD — selector in spec
it('shows success', async () => {
  await $('[data-testid="submit"]').click();
  await expect($('[role="alert"]')).toHaveText('Success');
});
```

**Right:** Locator classes own `$` / `$$`; specs call named getters.

```typescript
// GOOD
class DashboardLocators {
  get submitButton() { return $('[data-testid="submit"]'); }
  get alert() { return $('[role="alert"]'); }
}

class DashboardPage {
  locators = new DashboardLocators();
  async submit() { await this.locators.submitButton.click(); }
}

it('shows success', async () => {
  const page = new DashboardPage();
  await page.submit();
  await expect(page.locators.alert).toHaveText('Success');
});
```

*Reference:* AGENTS.md — Selector Boundary Rule, Page Object Discipline.
