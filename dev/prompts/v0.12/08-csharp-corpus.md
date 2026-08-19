# Session 08 — C# corpus completion (6 tags)

Obey `dev/prompts/v0.12/00-PROTOCOL.md`. Implement **only** this item. Tier A+R (precision-gated; you still **implement**, you do not redesign scanners). Zero new tags.

**Depends on sessions 01, 06, 07** already merged: NetworkIdle detection, complex-locator C# CSS/XPath, C# `no-teardown` / `bare-test-fail` / `test-fail-order`. If those scanners are missing, stop and say so — do not fake labels.

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
| `no-teardown` | **no corpus directory** | Create corpus. ≥10 violating + ≥10 clean, **≥10 C# each side**, plus existing-language samples so languages ≥2 (copy TS self-check goldens in) |
| `complex-locator` | **no corpus directory** | Same. Shapes: `Locator("#BNCRMP_cphContenidoPagina_*")`, XPath chains; clean `GetByRole` / `AppiumBy.AccessibilityId` in `pages/locators/` |
| `test-fail-order` | **no corpus directory** | Same. `[Test(Order=)]`, `[TestCase]` ordering, assert-then-Fail |
| `bare-test-fail` | **no corpus directory** | Same. `Assert.Fail(`, `Assert.Throws<>` without follow-up |
| `expect-in-action` | 1 violating + 1 clean C# | Grow to **≥10 + ≥10 C#**. Include `using static Microsoft.Playwright.Assertions` in a **page** file that also calls `Expect(` (the using-alone line is not a match; the `Expect(` call is). FluentAssertions `.Should()` in `pages/actions/` is already in the rule regex |
| `manual-wait` | 6 violating + 1 clean C# (sleeps) | Add NetworkIdle violating + `Expect`/`WaitForAsync` clean until **≥10 + ≥10 C#**. Keep existing sleep samples. New violating: `WaitForLoadStateAsync(LoadState.NetworkIdle)` in `pages/LoginPage.cs` after click (lesson #12). New clean: native Expect / `WaitForURLAsync` / `WaitForAsync(Visible)` and **ExpectedConditions** `wait.Until` (must stay clean after session 06) |

Cover runners across the C# samples (not necessarily 10 of each): **NUnit, xUnit, MSTest, FluentAssertions** where the rule applies (`expect-in-action` FluentAssertions `.Should()`; `bare-test-fail` NUnit Assert; xUnit `[Fact]`; MSTest `[TestMethod]` if the scanner sees it — if `[TestMethod]` is not in session 07’s test-method list, do not add MSTest samples that the scanner cannot see; prefer NUnit/xUnit).

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

Roadmap: **100% precision** on these tags (zero FPs). `verify-corpus-precision.js` default threshold is 0.9; **your Done-when is precision === 1** and `falsePositives === 0` for each of the six tags. FNs on labeled violating lines also fail (runner reports them).

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

## Do not

- Change scanner regexes “to make corpus pass” unless you found an obvious session 01/06/07 bug; if you must fix, keep the fix minimal and document it in the PR/session notes.
- Add a seventh tag corpus.
- Delete existing non-C# samples.
- Put violating NetworkIdle in a **clean** manual-wait file.

## Commands

```bash
node scripts/verify-corpus-precision.js --json
npm run verify
```

## Done when

- [ ] Six tags meet ≥10 C# violating + ≥10 C# clean (new dirs created where missing)
- [ ] ≥2 languages per tag
- [ ] Precision 1.0 / zero FPs on those tags
- [ ] Lesson #12 shapes present: NetworkIdle in a page after click; WebForms `Locator("#BNCRMP_cph...")`; `using static Microsoft.Playwright.Assertions` in a page; `[Test(Order=)]`; `Assert.Fail(` / `Assert.Throws`
- [ ] `npm run verify` green

## Out of scope

Appium sample-repo expansion (09). Baseline CLI (11).
