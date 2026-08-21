# Playwright.NET Sample

Minimal Playwright.NET + NUnit repo showing the Test Constitution in action.

## Layout

```text
playwright-dotnet/
├── README.md
├── PlaywrightDotnet.csproj
├── gavel.config.json
├── Tests/
│   ├── LoginGoodTests.cs         # Constitution-compliant
│   └── LoginBadTests.cs          # Tagged violations
├── Pages/
│   ├── Locators/
│   │   └── LoginLocators.cs      # Locator class — selectors only
│   └── Actions/
│       ├── LoginActions.cs       # Action class — no assertions
│       └── LoginActionsBad.cs    # expect-in-action demo (see note)
└── Support/
    └── Factories.cs              # UserFactory
```

## Patterns Demonstrated

- **DI via `PageTest`** — specs use `Page` from Playwright.NET; page objects via `LoginActions.For(Page)`, never `new LoginActions(...)` in test bodies.
- **Accessibility-first locators** — `GetByRole`, `GetByLabel` over CSS/XPath.
- **Native retrying assertions** — `Expect(...).ToBeVisibleAsync()` over `Thread.Sleep` / `WaitForTimeoutAsync`.
- **Factory data** — `UserFactory.Create()` over hardcoded credentials.
- **NUnit categories** — `[Category("smoke")]` / `[Category("regression")]` mirror TS `@smoke` / `@regression`.

## Violations Tagged In `LoginBadTests.cs`

| Rule | Where |
|------|-------|
| `selector-leak` | spec uses `Page.Locator("#email")` outside locator class |
| `manual-wait` | `WaitForTimeoutAsync`, `Thread.Sleep`, `Task.Delay` |
| `no-di` | spec constructs `new LoginActions(...)` at class scope |
| `skip-marker` | `[Ignore]` without reason |
| `ignore-no-reason` | bare `gavel-ignore` without tag |
| `expect-in-action` | `LoginActionsBad.cs` uses `Expect(...)` / `Assert.That(...)` inside an action |

**Not fired on C# in v0.10.0:** `no-step` (deferred — NUnit has no `test.step()` analog).

## Verify

From the gavel repo root:

```bash
node scripts/self-check.js fixtures/sample-repos/playwright-dotnet
```

`LoginGoodTests.cs` produces zero findings. `LoginBadTests.cs` and `LoginActionsBad.cs` produce tagged violations.
