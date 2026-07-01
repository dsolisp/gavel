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
