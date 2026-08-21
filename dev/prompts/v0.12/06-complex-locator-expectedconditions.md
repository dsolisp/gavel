# Session 06 — `complex-locator` C# CSS + ExpectedConditions exclusion

Obey `dev/prompts/v0.12/00-PROTOCOL.md`. Implement **only** this item. Tier B. Zero new tags. Two scanner edits in one session (roadmap row 6).

**Do not** reorder or rewrite `formatSuiteHealth` freshness/mismatch (session 04) or fat-POM rollup lines (session 05: `Fat POM files` / `Leak files` after `Selector leaks:`). Scanner-only session — no suite-health edits unless verify breaks.

## Why

Lessons #2, #7, #12:

- Client web suites use `page.Locator("#BNCRMP_cphContenidoPagina_ddlCuentas")` (WebForms id prefixes). Today that is only `selector-leak` (wrong layer). `complex-locator` never sees it because it only scans `locators?/` and `literalSelector` is JS-shaped.
- Appium XPath counts (22–27 per repo) folded into leak, not complexity scoring. `AppiumBy.XPath` is **not** in `locatorExpressions()`.
- `wait.Until(ExpectedConditions.*)` (`DotNetSeleniumExtras.WaitHelpers`) is closer to constitution than `Thread.Sleep`. Do **not** flag it as `manual-wait`. Session 01 widened NetworkIdle; this session adds the exclusion. `WaitForTimeout` / `Sleep` must still fire.

## Read first

- `scripts/self-check.js`:
  - `literalSelector` (L230–233)
  - `locatorExpressions` (L235–240)
  - `combinatorHops` / `selectorFragility` (L242–263)
  - `findComplexLocatorMatches` (L265–271) — **returns [] unless `LOCATOR_FILE_RE`**
  - `manual-wait` rule `test` (L710–738)
  - `selector-leak` regex (L690–693) — keep firing; complexity is additional
- Existing goldens: `fixtures/self-check/violations/complex-locator/pages/locators/*.ts`, `fixtures/self-check/clean/complex-locator/`
- `skills/gavel-selenium/SKILL.md` — ExpectedConditions is the native wait
- `LESSONS_LEARNED_PLAYWRIGHT_CSHARP.md` §2, §7, §11 item 8

## Part A — `complex-locator` widen

### Extraction

Today:

```js
findMatches(content, /(?:\.\s*(?:locator|Locator)|(?:querySelector(?:All)?|QuerySelector(?:All)?)|\$(?:\$)?)\s*\(\s*['"`]/, filePath)
```

`literalSelector`:

```js
line.match(/(?:\.\s*locator|querySelector(?:All)?|\$(?:\$)?)\s*\(\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`)/)
```

C# `page.Locator("#id")` uses `.Locator(` + `"..."`. The **findMatches** pattern includes `Locator` but `literalSelector` looks for `.locator` (lowercase) and will **drop** C# lines (`filter(({ selector }) => selector !== undefined)`).

Fix `literalSelector` to also accept `.Locator(` / `Locator(` with `"..."` or `'...'`.

Also extract:

- `Locator(\s*"#...` and `Locator(\s*"//...` (roadmap)
- XPath from Appium/Selenium: `AppiumBy.XPath(`, `MobileBy.XPath(`, `By.XPath(`, `FindElement(By.XPath(`, `xpath=` strings
- Treat the XPath **string literal** as the selector for `selectorFragility` (axis `::` already +3; positional `[n]` +2)

### Where it runs

Today: locator directories only. Client CSS ids live on **Page classes**, not in `locators?/`.

Widen `findComplexLocatorMatches` so it also scores:

- files under `pages?/` (not only `locators?/`), **and/or**
- any `.cs` file whose content has `Locator(` / `AppiumBy.XPath` / `By.XPath`

**Do not** reclassify those files as locator files. `selector-leak` must still fire on `Pages/LoginPage.cs` with `Locator("#...")`. A single line may be both `selector-leak` (wrong layer) **and** `complex-locator` (fragile selector). That is intended.

Skip `TEST_FILE_RE` specs unless they already match `pages?/` — keep noise down. Specs with inline `Locator("#")` remain `selector-leak` only unless they are also page files.

Threshold stays **score >= 5**. WebForms `#BNCRMP_cphContenidoPagina_*` may not hit 5 on combinators alone (it is one id). Roadmap still wants these distinguished from accessibility GetByRole-in-the-wrong-layer.

Add a fragility contribution for:

- CSS id selectors that look like generated/WebForms prefixes: `cph`, `ctl00`, `aspnetForm`, or `#` + long underscore-separated id (`/_/` in an id after `#`) — enough points to reach ≥5 for `#BNCRMP_cphContenidoPagina_ddlCuentas`. Name the contribution e.g. `generated id` +3 or +5. Do **not** score `#submit` (short stable id) as complex unless other signals apply.
- XPath starting with `//` or `xpath=` : ensure score ≥5 via existing axis/positional rules, or add `xpath string` +5 so `//android.widget.Button[@text='Submit']` graduates.

`config.selectorAllowlist.componentPrefixes` deductions stay.

### Do not

- Stop `selector-leak` on these lines.
- Treat `*Page.cs` as `locators?/`.
- Add tag `css-loc`.

## Part B — ExpectedConditions exclusion

In the `manual-wait` rule `test`, after `findMatches`, **drop** hits whose line (or the same trimmed line) matches:

```js
/\.Until\s*\(\s*ExpectedConditions\b|wait\.Until\s*\(\s*ExpectedConditions\b|Until\s*\(\s*ExpectedConditions\./
```

Also exclude `ExpectedConditions.` used as the wait callback even if split as `wait.Until(ExpectedConditions.ElementIsVisible(...))`.

Do **not** exclude:

- `Thread.Sleep` / `Task.Delay` / `WaitForTimeoutAsync` / NetworkIdle (session 01)
- `Thread.sleep` (Java)

If a line contains both Sleep and ExpectedConditions (should not happen), still flag Sleep.

`WebDriverWait` construction without Sleep is already clean (no match). No need to whitelist `WebDriverWait` itself.

Session 09 adds `ImplicitWait` as a **positive** `manual-wait` match — do not add it here.

## Fixtures

**complex-locator violating**

1. `violations/complex-locator/pages/locators/WebFormsIdLocators.cs` — `page.Locator("#BNCRMP_cphContenidoPagina_ddlCuentas")` inside `pages/locators/` so it is **not** a selector-leak (locator dir excluded from leak) but **is** complex-locator. Path must include `locators/`.
2. `violations/complex-locator/pages/FatLoginPage.cs` — same Locator("#cph...") **outside** locators dir. Expect **both** `selector-leak` and `complex-locator` when the violations tree is scanned. `verify-self-check-fixtures.js` requires every RULES tag to appear; extra leaks are OK. **Clean tree must not include this file.**
3. `violations/complex-locator/pages/locators/AppiumXPathLocators.cs` — `AppiumBy.XPath("//android.widget.Button[@text='Submit']")` in locators dir. Must fire `complex-locator`. Should **not** fire `selector-leak` (locator dir).

Keep existing TS XPath/generated-class violators.

**complex-locator clean**

- `clean/complex-locator/pages/locators/AccessibleCsharpLocators.cs` — `GetByRole` / `AppiumBy.AccessibilityId` only. Must not fire complex-locator.
- Short `#submit` in a locator file should stay clean (score < 5).

**manual-wait clean (ExpectedConditions)**

- `clean/manual-wait/ExpectedConditionsWaitTests.cs` — NUnit test using `wait.Until(ExpectedConditions.ElementIsVisible(...))`. Must **not** fire `manual-wait`. Must **not** fire `no-di` (no `new FooPage(`). Use `WebDriverWait` + ExpectedConditions only.

If `ExpectedConditionsWaitTests.cs` matches `TEST_FILE_RE` and contains other rule patterns, the entire clean tree fails. Keep it minimal.

## Verify wiring

- `verify-self-check-fixtures.js`: finding in `WebFormsIdLocators.cs` or `AppiumXPathLocators.cs` with `tag === 'complex-locator'`.
- Unit tests: `literalSelector` on `page.Locator("#BNCRMP_cphContenidoPagina_x")` returns the id string; fragility score ≥ 5. ExpectedConditions line is not in `manual-wait` `test()` output.
- Existing TS complex-locator fixtures still fire.

## Commands

```bash
node scripts/self-check.js fixtures/self-check/violations --json
node scripts/self-check.js fixtures/self-check/clean --json
node scripts/verify-self-check-fixtures.js
npm run verify
```

## Done when

- [ ] C# `Locator("#cph...")` / `Locator("//...")` can score as `complex-locator`
- [ ] Appium/Selenium XPath strings score as `complex-locator` in locator files
- [ ] Page-class CSS locators still also `selector-leak`
- [ ] `wait.Until(ExpectedConditions.*)` is not `manual-wait`
- [ ] Sleep / NetworkIdle still `manual-wait`
- [ ] No new tags
- [ ] `npm run verify` green

## Out of scope

Corpus ≥10+≥10 for complex-locator (session 08). ImplicitWait (session 09).
