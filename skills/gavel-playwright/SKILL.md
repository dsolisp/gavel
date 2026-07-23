---
name: gavel-playwright
description: >
  Playwright framework profile for gavel. Playwright-specific locator APIs,
  fixtures, web-first assertions, and run commands. Activated by gavel-detect.
  Cross-framework UI patterns live in gavel-e2e, not here.
---

# Gavel Playwright Profile

Playwright-specific bindings only. Universal POM/workflow rules: `gavel` + `gavel-e2e`.

**Current release (as of 2026-07-01):**
- **Node / TS:** `@playwright/test` **1.61.1** (patch; feature release `1.61.0`, 2026-06-15)
- **Playwright.NET / C#:** `Microsoft.Playwright` **1.61.0** (align with Node 1.61.x line)

Detected via `gavel-detect` when `Microsoft.Playwright*` appears in `*.csproj` → same profile as TS/Python Playwright.

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

---

## Playwright.NET (C#)

NUnit is the primary runner (`Microsoft.Playwright.NUnit`). MSTest/xUnit packages route here too.
Cross-framework POM rules: `gavel` + `gavel-e2e`. **Pin:** `Microsoft.Playwright` / `Microsoft.Playwright.NUnit` **1.61.0**.

### Locators

```csharp
page.GetByRole(AriaRole.Button, new() { Name = "Submit" })   // 1st
page.GetByLabel("Email")                                       // 2nd
page.GetByPlaceholder("Enter email")                           // 3rd
page.GetByText("Welcome")                                      // 4th
page.GetByTestId("submit-btn")                                 // 5th — last resort
// NEVER: page.Locator(".btn"), XPath, or QuerySelector* outside locator classes
```

Locator classes live under `Pages/Locators/` (or `locators/`). Actions and specs call named locator methods — no inline `GetByRole` / `Locator("...")` chains outside that layer (`selector-leak`).

### Assertions (web-first)

```csharp
await Expect(locator).ToBeVisibleAsync();
await Expect(locator).ToHaveTextAsync("Success");
await Expect(page).ToHaveURLAsync(new Regex(@"/dashboard"));
```

Polling stays in **specs only** (Assertion Layering). Prefer `Expect(...)` auto-retry over reading DOM state after a fixed delay.

### DI via NUnit / PageTest

Use the official Playwright.NET fixture — do not `new LoginPage(page)` inside test methods (`no-di`):

```csharp
using Microsoft.Playwright;
using Microsoft.Playwright.NUnit;

public class LoginTests : PageTest
{
    [Test]
    public async Task SubmitForm()
    {
        await Page.GotoAsync("/login");
        await LoginActions.SubmitAsync(Page, user, pass);
        await Expect(LoginLocators.SuccessBanner(Page)).ToBeVisibleAsync();
    }
}
```

Inject page objects through test infrastructure (base class helpers, NUnit `SetUp`, or shared fixtures) — not direct construction in the test body.

### Logical grouping

NUnit has no `test.step()` analog in v0.10.0. Group with descriptive test names, `[SetUp]` / helper methods, or separate focused tests. Do not add fake step wrappers.

### Wait strategy

**Prohibited:** `Thread.Sleep`, `Task.Delay` with fixed duration, `page.WaitForTimeoutAsync` (`manual-wait`).

**Prefer (in order):**

1. `Expect(locator).ToBeVisibleAsync()` and other `Expect` assertions (auto-retry)
2. Named waits on observable conditions: `page.WaitForURLAsync`, `locator.WaitForAsync`
3. Signal-driven sync **only** when a readiness owner calls `Set()` / completes a `TaskCompletionSource` — mirror Python `threading.Event` rules; an unset event is **not** remediation

```csharp
// Preferred — native retrying assertion
await LoginActions.ClickSubmitAsync(Page);
await Expect(LoginLocators.ResultBanner(Page)).ToBeVisibleAsync();

// Observable condition
await page.WaitForURLAsync("**/dashboard**");
await locator.WaitForAsync(new() { State = WaitForSelectorState.Visible });

// Signal-driven (only when producer wires Set / TrySetResult)
var ready = new ManualResetEventSlim(false);
// producer when condition is true: ready.Set();
if (!ready.Wait(TimeSpan.FromSeconds(5)))
    throw new TimeoutException("condition not met");
```

**Not allowed:** `var gate = new ManualResetEventSlim(false); gate.Wait(timeout)` with no `.Set()` caller — that is a sleep rename.

Use `gavel-ignore: manual-wait` with reason only for non-replaceable intentional waits (bot jitter, safety halt).

### Manual-wait remediation (C#)

| Scanner signal | Fix |
|----------------|-----|
| **redundant** — next line has `Expect`, `WaitForAsync`, `{ Timeout = }` | Remove the sleep; subsequent code already waits |
| **stale-read-risk** — next line reads DOM via `EvaluateAsync`, `TextContentAsync`, `GetAttributeAsync` | Replace with `Expect(...)` on the target state |
| **intentional** + **replaceable: true** + `suggestion: ManualResetEventSlim.Wait()` | Signal-driven `ManualResetEventSlim` / `TaskCompletionSource` with wired producer, or prefer `Expect` when observable |
| **intentional** (non-replaceable) | Rename for clarity + `gavel-ignore: manual-wait` with ticket |

See `agents/gavel-healer.md` and `agents/gavel-refactor.md` for heal/refactor workflows (same preference order as Python).

### Run commands

```bash
dotnet build
dotnet test
dotnet test --filter "FullyQualifiedName~LoginTests"
pwsh bin/Debug/net8.0/playwright.ps1 install   # first-time browser install
```

### Skip / ignore markers

```csharp
[Ignore("PROJ-123: upstream broker unavailable")]  // reason + ticket required
Assert.Ignore("PROJ-456: known regression");        // same policy
// gavel-ignore: manual-wait — PROJ-789 bot jitter; non-replaceable
```

Bare `[Ignore]`, `Assert.Ignore()` without reason, or bare `// gavel-ignore` → `skip-marker` / `ignore-no-reason`.
