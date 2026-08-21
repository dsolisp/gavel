# Appium.NET Sample

Minimal Appium.NET + NUnit mobile-native repo showing the Test Constitution in action.

## Layout

```text
appium-dotnet/
├── README.md
├── AppiumDotnet.csproj
├── gavel.config.json
├── Tests/
│   ├── LoginGoodTests.cs         # Constitution-compliant
│   └── LoginBadTests.cs          # Tagged violations
├── Pages/
│   ├── Locators/
│   │   └── LoginLocators.cs      # Locator class — AppiumBy strategies only
│   └── Actions/
│       ├── LoginActions.cs       # Action class — no assertions
│       ├── LoginActionsBad.cs    # expect-in-action demo
│       └── MobileGestureActionsBad.cs  # gesture leak, MobileBy, context-switch leak
└── Support/
    └── Factories.cs              # UserFactory + DriverFactory
```

## Patterns Demonstrated

- **DI via `[SetUp]`** — specs create the driver in `SetUp` and resolve page objects via `LoginActions.For(driver)`, never `new LoginActions(...)` in test bodies.
- **Accessibility-first locators** — `AppiumBy.AccessibilityId` over XPath.
- **Native retrying waits** — `WebDriverWait` over `Thread.Sleep` / `Task.Delay`.
- **Factory data** — `UserFactory.Create()` over hardcoded credentials; server URL via `APPIUM_SERVER_URL`.
- **NUnit categories** — `[Category("smoke")]` / `[Category("regression")]` mirror TS `@smoke` / `@regression`.

## Violations Tagged In `LoginBadTests.cs` / `LoginActionsBad.cs` / `MobileGestureActionsBad.cs`

| Rule | Where |
|------|-------|
| `selector-leak` | spec calls `FindElement(AppiumBy.*)` outside a locator class |
| `selector-leak` | `MobileBy.AndroidUIAutomator` (deprecated — use `AppiumBy.*`; fix hint carries deprecation note) |
| `selector-leak` | context switch then `FindElement(By.CssSelector(...))` in action |
| `selector-leak` | inline gesture coordinates in action |
| `manual-wait` | `Thread.Sleep`, `Task.Delay`, `ImplicitWait =` |
| `no-di` | spec constructs `new LoginActions(...)` at class scope |
| `skip-marker` | `[Ignore]` without reason |
| `ignore-no-reason` | bare `gavel-ignore` without tag |
| `expect-in-action` | `LoginActionsBad.cs` uses `Assert.That(...)` inside an action |

**Not fired on C# in v0.10.0:** `no-step` (deferred — NUnit has no `test.step()` analog).

## Verify

From the gavel repo root:

```bash
node scripts/self-check.js fixtures/sample-repos/appium-dotnet
node scripts/detect.js fixtures/sample-repos/appium-dotnet --json
```

`LoginGoodTests.cs` produces zero findings. `LoginBadTests.cs` and
`LoginActionsBad.cs` produce tagged violations. `detect.js` resolves the repo to
`appium_dotnet` → `gavel-appium`.
