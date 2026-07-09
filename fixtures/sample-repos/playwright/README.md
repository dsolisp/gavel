# Playwright Sample

Minimal Playwright + TypeScript repo showing the Test Constitution in action.

## Layout

```
playwright/
├── README.md
├── package.json
├── gavel.config.json
├── tests/
│   ├── login.good.spec.ts        # Constitution-compliant
│   └── login.bad.spec.ts         # Tagged violations
├── pages/
│   ├── locators/
│   │   └── LoginLocators.ts      # Locator class — selectors only
│   └── actions/
│       └── LoginActions.ts       # Action class — no assertions
└── support/
    ├── appFixtures.ts            # Playwright `test.extend()` DI
    └── factories.ts              # UserFactory
```

## Patterns Demonstrated

- **DI via `test.extend()`** — specs receive `loginPage`, never construct it.
- **Accessibility-first locators** — `getByRole`, `getByLabel` over CSS/XPath.
- **Native retrying assertions** — `expect(...).toBeVisible()` over manual waits.
- **Test step grouping** — `test.step()` for each logical chunk.
- **Factory data** — `UserFactory.create()` over hardcoded credentials.

## Violations Tagged In `login.bad.spec.ts`

| Rule | Where |
|------|-------|
| `expect-in-action` | `pages/actions/LoginActionsBad.ts` has `expect(...)` |
| `selector-leak` | spec uses `page.locator('#email')` outside locator class |
| `manual-wait` | spec uses `page.waitForTimeout(2000)` |
| `no-di` | spec constructs `new LoginActions(page, ...)` directly |
| `no-step` | spec body is long with no `test.step()` |
| `skip-marker` | `test.skip(...)` without reason |
| `ignore-no-reason` | bare `gavel-ignore` without tag |
