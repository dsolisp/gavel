# Session 08 — C# corpus completion (7 tags)

Obey `dev/prompts/v0.12/00-PROTOCOL.md`. Implement **only** this item. Tier A+R (precision-gated; you still **implement**, you do not redesign scanners). Zero new tags.

**Depends on sessions 01, 02, 06, 07** already merged:

- **01** — NetworkIdle `manual-wait`
- **02** — `no-di` Gate 1 (`BaseTest.cs`, `*TestBase.cs`, `*TestsBase.cs`) + Gate 2 (only `[Test]` / `[TestCase]` / `[Fact]` / `[Theory]` bodies)
- **06** — `complex-locator` C# CSS/XPath; ExpectedConditions not `manual-wait`
- **07** — C# `no-teardown` / `bare-test-fail` / `test-fail-order`

If those scanners are missing, stop and say so — do not fake labels.

## Why

Contract #2: heuristic discipline uses `fixtures/corpus/<tag>/` with ≥10 violating + ≥10 clean, ≥2 languages. Roadmap Feature 4: fill C# gaps with **real-world shapes from lesson #12**, 100% precision (zero FPs on the measured tag).

## Read first

- `fixtures/corpus/README.md`
- `schemas/corpus-labels.schema.json`
- `scripts/verify-corpus-precision.js` — scans the **whole tag directory** with self-check, then precision = TP / flagged findings **for that tag** whose `file` is listed in `labels.json`. Extra tags on the same file are ignored. A `complex-locator` hit on a labeled file at an unlabeled line is an **FP**.
- Existing `fixtures/corpus/<tag>/labels.json` for `manual-wait`, `expect-in-action`, `no-di`, `selector-leak`
- `LESSONS_LEARNED_PLAYWRIGHT_CSHARP.md` §12
- Self-check goldens from sessions 01/06/07 (copy shapes; do not delete them)

## Target (per tag)

| Tag | Current C# in labels.json | Target |
|-----|---------------------------|--------|
| `no-di` | 1 violating + 1 clean C# | Grow to **≥10 + ≥10 C#** (see **Session 02 carryover** below — includes shapes deferred from optional session 02 fixtures) |
| `no-teardown` | **no corpus directory** | Create corpus. ≥10 violating + ≥10 clean, **≥10 C# each side**, plus existing-language samples so languages ≥2 (copy TS self-check goldens in) |
| `complex-locator` | **no corpus directory** | Same. Shapes: `Locator("#BNCRMP_cphContenidoPagina_*")`, XPath chains; clean `GetByRole` / `AppiumBy.AccessibilityId` in `pages/locators/` |
| `test-fail-order` | **no corpus directory** | Same. `[Test(Order=)]`, `[TestCase]` ordering, assert-then-Fail |
| `bare-test-fail` | **no corpus directory** | Same. `Assert.Fail(`, `Assert.Throws<>` without follow-up |
| `expect-in-action` | 1 violating + 1 clean C# | Grow to **≥10 + ≥10 C#**. Include `using static Microsoft.Playwright.Assertions` in a **page** file that also calls `Expect(` (the using-alone line is not a match; the `Expect(` call is). FluentAssertions `.Should()` in `pages/actions/` is already in the rule regex |
| `manual-wait` | 6 violating + 1 clean C# (sleeps) | Add NetworkIdle violating + `Expect`/`WaitForAsync` clean until **≥10 + ≥10 C#**. Keep existing sleep samples. New violating: `WaitForLoadStateAsync(LoadState.NetworkIdle)` in `pages/LoginPage.cs` after click (lesson #12). New clean: native Expect / `WaitForURLAsync` / `WaitForAsync(Visible)` and **ExpectedConditions** `wait.Until` (must stay clean after session 06) |

Cover runners across the C# samples (not necessarily 10 of each): **NUnit, xUnit, MSTest, FluentAssertions** where the rule applies.

### Session 02 carryover — `no-di` required C# shapes

Session 02 shipped Gates 1–2 but left some goldens optional. **This session must corpus them** (copy from `fixtures/self-check/clean/no-di/` and `violations/no-di/` where they exist; add any missing file).

**Gate 1 clean (must NOT fire `no-di`)** — basename matters:

| File basename | Pattern | Shape |
|---------------|---------|--------|
| `BaseTest.cs` | exact | `[SetUp]` / `[OneTimeSetUp]` with `new LoginPage(page)` |
| `LoginTestBase.cs` | `*TestBase.cs` | `[SetUp]` with `new LoginPage(page)` — **not** `LoginTestsBase.cs` only; both suffixes need a clean sample |
| `LoginTestsBase.cs` | `*TestsBase.cs` | same SetUp DI pattern |
| `SetUpInjectionTests.cs` | normal `*Tests.cs` | `new LoginPage(page)` **only** in `[SetUp]`; `[Test]` uses injected field — Gate 2 regression |

**Gate 2 violating (must fire `no-di`)**:

| Shape | Framework |
|-------|-----------|
| `new LoginPage(page)` inside `[Test]` | NUnit (existing `LoginTests.cs`) |
| `new LoginPage(page)` inside `[Fact]` | xUnit (`FactConstructionTests.cs` — copy to corpus) |
| `new LoginPage(page)` inside `[TestCase(...)]` method | NUnit — **required**; session 02 skipped this golden |

**Gate 2 + MSTest clean (must NOT fire)**:

| Shape | Notes |
|-------|--------|
| `[TestInitialize]` with `new LoginPage(page)` | MSTest — construction in initialize, `[TestMethod]` uses field. Session 02 skipped this golden; **add here**. Scanner treats `TestInitialize` like `[SetUp]` (see `CS_SETUP_ATTR_RE` in `self-check.js`). |

**Violating lesson #12 shape (must include at least one labeled sample):**

- `new TransferenciaRapidaPage(page)` (or similar) inside `[Test]` on a normal `*Tests.cs` — not in BaseTest/SetUp.

Reuse TS samples in `fixtures/corpus/no-di/` for language ≥2. Keep existing `direct-construction.spec.ts` / `fixture-injection.spec.ts`. Do not delete them.

For other tags: `expect-in-action` FluentAssertions `.Should()`; `bare-test-fail` NUnit Assert; xUnit `[Fact]`; MSTest `[TestMethod]` only if session 07’s test-method list includes it — for **`no-di`**, MSTest coverage is **`[TestInitialize]` clean**, not `[TestMethod]` violating, unless you extend Gate 2 (out of scope — do not change scanner in this session).

## labels.json rules

- `schemaVersion`: `"1.0.0"`
- `tag` equals directory name
- Each sample: `file` posix relative to the tag dir, `label` `violating`|`clean`, `language: "cs"` for C#, `framework` e.g. `nunit` / `xunit` / `mstest` / `playwright-dotnet` / `appium-dotnet` (match existing corpus style: `playwright-dotnet`, `nunit`)
- `rationale` one line
- Violating: `expectedFindings: [{ line, tag }]` — **line numbers must match the scanner** after you write the file. Re-scan and fix lines. Optional field locks (`subCase`, `replaceable`, …) for `manual-wait` NetworkIdle redundant vs intentional.
- Clean: omit `expectedFindings` or `[]`
- ≥2 languages per tag (TS + CS is enough; keep Java/Python where they already exist)

## Precision gate

```bash
node scripts/verify-corpus-precision.js --json
```

Roadmap: **100% precision** on these tags (zero FPs). `verify-corpus-precision.js` default threshold is 0.9; **your Done-when is precision === 1** and `falsePositives === 0` for each of the **seven** tags. FNs on labeled violating lines also fail (runner reports them).

If a clean C# file still fires the measured tag, the scanner from 01/06/07 is wrong **or** the sample is mislabeled — do **not** suppress with `gavel-ignore` to fake precision. Fix the sample or stop and report the scanner bug. `gavel-ignore` clean samples are allowed only when testing ignore behavior for other tags, not this session.

## File layout examples

```text
fixtures/corpus/complex-locator/
  labels.json
  violating/pages/locators/WebFormsIdLocators.cs
  violating/pages/locators/XPathChainLocators.cs
  violating/pages/FatWebFormsPage.cs    # only if session 06 scores pages/ ; expectedFindings for complex-locator lines
  clean/pages/locators/RoleLocators.cs
  clean/pages/locators/AppiumA11yLocators.cs
  violating/pages/locators/GeneratedClassLocators.ts   # copy from self-check so language≥2
  clean/pages/locators/AccessibleLocators.ts
```

Put page classes under `pages/` so `expect-in-action` / `selector-leak` path gates still make sense. Corpus precision **only scores the corpus tag**, so a fat page that also leaks is OK for `complex-locator` as long as every `complex-locator` line on labeled files is listed.

For `expect-in-action`, files **must** live under `pages/` or `actions/` or `locators/` or the rule returns []. Use `violating/pages/LoginPage.cs` with `using static Microsoft.Playwright.Assertions` + `Expect(locator).ToBeVisibleAsync()`.

For `no-teardown` / `bare-test-fail` / `test-fail-order`, files must match `TEST_FILE_RE` (`*Tests.cs` / `*Test.cs`).

For `no-di` corpus layout:

```text
fixtures/corpus/no-di/
  labels.json
  violating/LoginTests.cs              # [Test] — keep/update line in expectedFindings
  violating/FactConstructionTests.cs # [Fact]
  violating/TestCaseConstructionTests.cs  # [TestCase] — required session 02 carryover
  clean/BaseTest.cs
  clean/LoginTestBase.cs               # *TestBase.cs — required (not only LoginTestsBase)
  clean/LoginTestsBase.cs              # *TestsBase.cs
  clean/SetUpInjectionTests.cs
  clean/MstestTestInitializeTests.cs   # [TestInitialize] — required session 02 carryover
  clean/FixtureInjectionTests.cs       # PageTest / ctor DI
  ... (more C# until ≥10+≥10)
  violating/direct-construction.spec.ts
  clean/fixture-injection.spec.ts
```

Optional: mirror the new corpus files back into `fixtures/self-check/clean/no-di/` and `violations/no-di/` if they are not already there (`LoginTestBase.cs`, `TestCaseConstructionTests.cs`, `MstestTestInitializeTests.cs`) so `verify-self-check-fixtures.js` stays aligned — only if those files are missing from self-check after session 02.

## Do not

- Change scanner regexes “to make corpus pass” unless you found an obvious session 01/02/06/07 bug; if you must fix, keep the fix minimal and document it in the PR/session notes.
- Add an eighth tag corpus.
- Delete existing non-C# samples.
- Put violating NetworkIdle in a **clean** manual-wait file.

## Commands

```bash
node scripts/verify-corpus-precision.js --json
npm run verify
```

## Done when

- [ ] **Seven** tags meet ≥10 C# violating + ≥10 C# clean (`no-di` expanded, six others created or expanded as in table)
- [ ] ≥2 languages per tag
- [ ] Precision 1.0 / zero FPs on all seven tags
- [ ] **`no-di` carryover:** clean `LoginTestBase.cs` + `LoginTestsBase.cs`; violating `[TestCase]`; clean MSTest `[TestInitialize]` — all labeled with correct `expectedFindings` lines
- [ ] Lesson #12 shapes present: NetworkIdle in a page after click; WebForms `Locator("#BNCRMP_cph...")`; `using static Microsoft.Playwright.Assertions` in a page; `[Test(Order=)]`; `Assert.Fail(` / `Assert.Throws`; client-style `new XxxPage` in `[Test]`
- [ ] `npm run verify` green

## Out of scope

Appium sample-repo expansion (09). Baseline CLI (11). Fat-POM rollup / `fatPomFiles` (session 05 — corpus may include fat `*Page.cs` samples labeled **`selector-leak`**, not rollup fields).
