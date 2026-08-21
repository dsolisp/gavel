# Session 02 — `no-di` BaseTest / `[SetUp]` false-positive fix

Obey `dev/prompts/v0.12/00-PROTOCOL.md`. Implement **only** this item. Tier B. Zero new tags.

## Why

Lesson #3: `TEST_FILE_RE` includes `[^/]+Tests?\.cs$`, so `BaseTest.cs` is classified as a spec. Client suites do `new LoginPage(page)` in `[SetUp]` / `[TearDown]` — that is NUnit fixture DI, not a spec-body violation. The same suites also do `new TransferenciaRapidaPage(page)` inside `[Test]` — those are real `no-di`.

Every audited repo produced BaseTest noise. Fix the false positive without losing real test-body hits.

## Read first

- `scripts/self-check.js` — `TEST_FILE_RE` (L20–21), `no-di` rule (L741–754)
- `scripts/verify-self-check-fixtures.js` — C# `LoginTests.cs` must remain a `no-di` hit (L149–160); `TEST_FILE_RE` matrix (L170–187) including `Pages/LoginPage.cs` → not a test file
- `scripts/test/unit.test.js` — `TEST_FILE_RE recognizes C# test naming without helpers`
- Fixtures: `fixtures/self-check/violations/no-di/LoginTests.cs`, `fixtures/self-check/clean/no-di/FixtureInjectionTests.cs`, `fixtures/self-check/clean/no-di/LoginHelper.cs`
- `LESSONS_LEARNED_PLAYWRIGHT_CSHARP.md` §3
- `docs/contracts/playwright-dotnet-v0.10.0.md` — `no-di` is `new LoginPage(page)` inside **test methods**

## Current behavior

```js
test: (filePath, content) => {
  if (!TEST_FILE_RE.test(filePath)) {
    return [];
  }
  return findMatches(content, /\bnew\s+[A-Z][A-Za-z0-9_]*(Page|Actions?|Component|Locators?)\s*\(/g, filePath);
},
```

`TEST_FILE_RE`:

```js
/\.(spec|test|cy)\.(ts|js|tsx|jsx|py|java|cs|feature)$|(^|\/)(test_.+|.+_test)\.[a-z]+$|(^|\/)[^/]+Tests?\.cs$/
```

`BaseTest.cs` matches `Tests?\.cs$`. `LoginHelper.cs` does not. `LoginPage.cs` does not. Keep that.

The construction regex **requires** the type suffix `Page|Actions?|Component|Locators?`. Do not broaden to arbitrary class names.

## Change

Edit **only** the `no-di` `test` function (and helpers it needs in `self-check.js`). Do not change `TEST_FILE_RE` globally — other test-only rules (`skip-marker`, `hardcoded-env`, `bare-test-fail`, …) still need `BaseTest.cs` as a test file if it contains tests. `no-di` is the rule that must special-case infrastructure files.

### Gate 1 — infrastructure file names

If the basename (posix, after last `/`) matches **any** of:

- `BaseTest.cs` (exact)
- `/TestBase\.cs$/`
- `/TestsBase\.cs$/`

return `[]` for `no-di` only.

Examples that skip: `BaseTest.cs`, `Support/BaseTest.cs`, `LoginTestBase.cs`, `UiTestsBase.cs`.  
Examples that still scan: `LoginTests.cs`, `LoginTest.cs`, `TransferenciaRapidaTests.cs`.

Do not skip every `*Test.cs` — that would delete the rule.

### Gate 2 — C# method scope

On `filePath.endsWith('.cs')` after Gate 1, **only fire inside methods** whose attribute is one of:

- `[Test]`
- `[TestCase` (prefix; `[TestCase(...)]` and `[TestCaseSource]` used as a test method)
- `[Fact]`
- `[Theory]`

Do **not** fire inside:

- `[SetUp]`
- `[OneTimeSetUp]`
- `[TearDown]`
- `[OneTimeTearDown]`
- `[TestInitialize]`
- `[ClassInitialize]`
- `[TestCleanup]`
- `[ClassCleanup]`

Implementation sketch (keep it small):

- Walk lines with brace depth.
- When you see a method-attribute line, record the kind (test vs setup/teardown).
- The following method body (until depth returns to the class body) inherits that kind.
- Run the existing `new FooPage(` regex only on lines that belong to a **test** method body.
- `new LoginPage(` at **class field** / field-initializer scope (not inside a method) should **not** fire — that is closer to fixture wiring. If a field initializer is too expensive to parse, prefer: only fire when inside a detected `[Test]`/`[Fact]`/`[Theory]`/`[TestCase]` body. Missing a field-initializer hit is acceptable; firing on `[SetUp]` is not.

Non-`.cs` files: keep current behavior (any `new FooPage(` in a test file). Do not break TS `new LoginActions(page)` in `*.spec.ts`.

xUnit constructor injection (`public LoginTests(IPage page)` / `IClassFixture<T>`) has no `new LoginPage(` — already clean. Optional: a clean fixture that uses ctor injection plus `new` only in a helper — not required if Gate 2 is solid.

### Do not

- Change the construction regex suffix list.
- Exclude `[SetUp]` hits by commenting them with `gavel-ignore` in production scanners.
- Add a `PageTest` unused-inheritance hint (lesson #3 optional detect output — not this session, not a new tag).
- Touch `hardcoded-env` BaseTest policy (lesson mentions it as optional; out of scope).

## Fixtures

**Clean** (must produce zero findings when scanned as part of `fixtures/self-check/clean/`):

1. `clean/no-di/BaseTest.cs` — class named `BaseTest`, `[SetUp]` does `new LoginPage(page)` (and optionally `[TearDown]`). **Must not** fire `no-di`. File name must be exactly `BaseTest.cs` so Gate 1 also applies. Because `clean/` is scanned as a tree, this file’s path will be `no-di/BaseTest.cs` — basename `BaseTest.cs` still matches.
2. `clean/no-di/LoginTestBase.cs` — `[SetUp]` constructs a page object. Basename matches `TestBase.cs`. Must not fire.
3. `clean/no-di/SetUpInjectionTests.cs` — a **normal** `*Tests.cs` file (so Gate 1 does not skip the file) with `new LoginPage(page)` **only** inside `[SetUp]`, and the `[Test]` method uses the field. **Must not** fire. This is the critical Gate 2 fixture — without it, Gate 1 alone would still FP every client spec that constructs pages in SetUp.

Keep `clean/no-di/FixtureInjectionTests.cs` (`PageTest`, no `new`).

**Violating** (must keep firing):

1. Existing `violations/no-di/LoginTests.cs` — `new LoginPage` inside `[Test]`. `verify-self-check-fixtures.js` already requires this finding. Do not rename it.
2. Add `violations/no-di/FactConstructionTests.cs` — xUnit `[Fact]` with `new LoginPage(page)` inside the fact. Must fire.
3. Optional: `[TestCase("x")]` method with `new FooActions(` inside — must fire.

MSTest: optional clean `[TestInitialize]` constructing a page in `*Tests.cs` (Gate 2). If you add it, `[TestMethod]` / `[Test]` must still fire when `new` is inside the test method. NUnit `[Test]` is enough if time is tight; prefer at least SetUpInjectionTests + FactConstructionTests.

## Verify wiring

- Keep the `LoginTests.cs` `no-di` assertion.
- Add assertions:
  - no `no-di` finding whose file ends with `BaseTest.cs` or `SetUpInjectionTests.cs` in the **clean** report (clean report must already be `violationCount === 0` — if SetUpInjectionTests is in `clean/`, that is the gate).
  - a `no-di` finding in `FactConstructionTests.cs` on the violations scan (if you added it).

Unit test in `scripts/test/unit.test.js`: export a small helper if needed (`isNoDiInfrastructureFile(filePath)` and/or run `RULES.find(r => r.id === 'no-di').test(...)` on in-memory snippets). Assert:

- `BaseTest.cs` + SetUp `new LoginPage(` → `[]`
- `LoginTests.cs` + Test `new LoginPage(` → hit
- `FooTests.cs` + SetUp `new LoginPage(` → `[]`
- `FooTests.cs` + Test `new LoginPage(` → hit
- `login.spec.ts` + `new LoginPage(` → hit (no C# method gate)

You may export `RULES` (already exported) and call `.test` directly — no new public CLI.

## Commands

```bash
node scripts/self-check.js fixtures/self-check/clean --json   # violationCount 0
node scripts/self-check.js fixtures/self-check/violations --json
node scripts/verify-self-check-fixtures.js
npm run verify
```

## Done when

- [ ] `BaseTest.cs` / `*TestBase.cs` / `*TestsBase.cs` never emit `no-di`
- [ ] `new LoginPage(` in `[SetUp]` of a `*Tests.cs` file does not fire
- [ ] `new LoginPage(` in `[Test]` / `[Fact]` / `[Theory]` still fires
- [ ] Existing `LoginTests.cs` violation still found
- [ ] TS/JS `no-di` fixtures still fire
- [ ] `TEST_FILE_RE` unchanged for helpers vs tests
- [ ] `npm run verify` green

## Out of scope

Freshness “package present, PageTest unused” (session 04/13). Corpus extra no-di samples (08 only if needed for precision).
