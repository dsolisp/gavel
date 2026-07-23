# Selenium.NET (C#) Sample

Minimal Selenium WebDriver + NUnit C# repo showing the Test Constitution in action.

## Layout

```text
selenium-dotnet/
├── README.md
├── SeleniumDotnet.csproj
├── gavel.config.json
├── Tests/
│   ├── LoginGoodTests.cs         # Constitution-compliant
│   └── LoginBadTests.cs          # Tagged violations
├── Pages/
│   ├── Locators/
│   │   └── LoginLocators.cs      # Locator class — By.* strategies only
│   └── Actions/
│       ├── LoginActions.cs       # Action class — no assertions
│       └── LoginActionsBad.cs    # expect-in-action demo
└── Support/
    └── Factories.cs              # UserFactory + DriverFactory
```

## Patterns Demonstrated

- **DI via `[SetUp]`** — specs create the driver in `SetUp` and resolve page objects via `LoginActions.For(driver)`, never `new LoginActions(...)` in test bodies.
- **Stable locators** — `By.CssSelector("[data-test=...]")` over brittle XPath.
- **Native retrying waits** — `WebDriverWait` over `Thread.Sleep` / `Task.Delay`.
- **Factory data** — `UserFactory.Create()` over hardcoded credentials; base URL via `SELENIUM_BASE_URL`.
- **NUnit categories** — `[Category("smoke")]` / `[Category("regression")]` mirror TS `@smoke` / `@regression`.

## Violations Tagged In `LoginBadTests.cs` / `LoginActionsBad.cs`

| Rule | Where |
|------|-------|
| `selector-leak` | spec calls `FindElement(By.*)` outside a locator class |
| `manual-wait` | `Thread.Sleep`, `Task.Delay` |
| `no-di` | spec constructs `new LoginActions(...)` at class scope |
| `skip-marker` | `[Ignore]` without reason |
| `ignore-no-reason` | bare `gavel-ignore` without tag |
| `expect-in-action` | `LoginActionsBad.cs` uses `Assert.That(...)` inside an action |

**Not fired on C# in v0.10.0:** `no-step` (deferred — NUnit has no `test.step()` analog).

## Verify

From the gavel repo root:

```bash
node scripts/self-check.js fixtures/sample-repos/selenium-dotnet
node scripts/detect.js fixtures/sample-repos/selenium-dotnet --json
```

`LoginGoodTests.cs` produces zero findings. `LoginBadTests.cs` and
`LoginActionsBad.cs` produce tagged violations. `detect.js` resolves the repo to
`selenium_dotnet` → `gavel-selenium`.
