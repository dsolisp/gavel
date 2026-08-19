# Session 09 — Appium golden fixtures + `MobileBy` fix hint

Obey `dev/prompts/v0.12/00-PROTOCOL.md`. Implement **only** this item. Tier B. Zero new tags.

## Why

Lessons #7 and #12 (3 Appium.NET production repos): `MobileBy` / `FindElement` already leak; `Thread.Sleep` already waits. Gaps: no deprecation hint (`MobileBy` → `AppiumBy`), XPath folded into leak (session 06 should have scored it), `ImplicitWait` not flagged, hybrid webview undocumented, sample repo too thin.

## Read first

- `skills/gavel-appium/SKILL.md` — already says MobileBy is deprecated; pin **8.3.2**
- `scripts/self-check.js` — `selector-leak` regex already includes `\bMobileBy\.[A-Za-z]` and `\bAppiumBy\.[A-Za-z]`; `FIX_HINTS['selector-leak']` is generic; `fixHintFor` / `manualWaitFixHint`
- `fixtures/profiles/appium-dotnet-fresh/AppiumDotnet.csproj` — **already** `Appium.WebDriver` 8.3.2. **Do not recreate this fixture.** `verify-profile-fixtures.js` already wires it.
- `fixtures/sample-repos/appium-dotnet/` — good/bad login only
- `scripts/verify-profile-fixtures.js` — asserts `appium_dotnet` → `gavel-appium` and skill contains `AppiumBy`
- `LESSONS_LEARNED_PLAYWRIGHT_CSHARP.md` §7, §12

## 1. Do not recreate the .NET golden profile

`fixtures/profiles/appium-dotnet-fresh/` is done. If the csproj pin drifts from `PROFILE_RELEASES.appium_dotnet.current` (`8.3.2` in `check-profile-freshness.js`), align to the profile current — do not invent a second fixture.

## 2. Context-aware `selector-leak` fix hint for `MobileBy`

Today `FIX_HINTS['selector-leak']`:

```
extract the selector to a named locator in a locator class and call it by name
```

And `fixHintFor` only special-cases `manual-wait`.

Add a branch: if `finding.tag === 'selector-leak'` and the snippet (`finding.text` / `finding.snippet`) matches `MobileBy.`, the hint must include:

**`deprecated — use AppiumBy.*`**

Keep the extract-to-locator guidance. Example: `MobileBy is deprecated — use AppiumBy.*; extract the selector to a named locator in a locator class`.

`AppiumBy.` leaks keep the generic extract hint (not the deprecation sentence).

Wire through `fixHintFor` so text, JSON, and SARIF `fixes[].description.text` all get it (same path as other hints). Add a unit test in `scripts/test/unit.test.js` next to the existing fix-hint test.

Self-check fixture: `violations/selector-leak/pages/actions/MobileByLoginActions.cs` with `MobileBy.AndroidUIAutomator(...)` and/or `MobileBy.IosNsPredicate(...)`. Must still be `selector-leak`. Assert in `verify-self-check-fixtures.js` that this finding’s `fix` matches `/AppiumBy/`.

Clean locator file using `AppiumBy.AccessibilityId` already exists — keep it.

## 3. `ImplicitWait` → `manual-wait`

Roadmap Feature 5: detect `driver.Manage().Timeouts().ImplicitWait` as an anti-pattern. Same tag `manual-wait`. ExpectedConditions stays allowed (session 06).

Widen the `manual-wait` regex (or add a second `findMatches` union) for:

```js
/\.Timeouts\(\)\s*\.ImplicitWait\b|ImplicitWait\s*=/
```

Typical C#: `driver.Manage().Timeouts().ImplicitWait = TimeSpan.FromSeconds(10);`

Java cousin (cheap, same session if the regex stays comment-aware): `manage().timeouts().implicitlyWait` — optional; C# is required.

Classify sub-case `intentional` (not redundant unless next line is Expect — unusual). Fix hint: `replace ImplicitWait with WebDriverWait / wait.Until(ExpectedConditions.*) or Expect on observable state`.

**Fixture violating:** `violations/manual-wait/ImplicitWaitTests.cs`  
**Fixture clean:** ExpectedConditions file from session 06 must still be clean. Do not flag `WebDriverWait` construction.

## 4. Hybrid web context — docs only (skill)

In `skills/gavel-appium/SKILL.md` add a short **Hybrid web context** section:

- Switching: `driver.Context = "WEBVIEW_..."` (and back to `NATIVE_APP`)
- After switch, **selector-leak still applies** — `FindElement` / CSS / XPath in actions/specs are leaks; locators live in locator classes
- Do not new-tag webview usage

No scanner for `Context =` unless it is a one-line note in the skill. Do not add a tag.

## 5. Expand sample repo

`fixtures/sample-repos/appium-dotnet/`:

**Good (must stay zero findings in good files):**

- Locator: `AppiumBy.AccessibilityId`
- Optional good context switch inside an **action** that uses named locators only (no inline `FindElement`)

**Bad (tagged):**

- Gesture leak: inline coordinates / `FindElement` + swipe in an action or spec (`selector-leak`)
- `MobileBy.AndroidUIAutomator` on a page/action class (`selector-leak` + new hint)
- Context switch then `FindElement(By.CssSelector(...))` in an action (`selector-leak`)
- Do not turn the sample repo into a fat POM without locators folder — keep `Pages/Locators/` as the **good** shape (lesson: sample repos should look unlike the client corpus)

Update `fixtures/sample-repos/appium-dotnet/README.md` violation table. `LoginGoodTests.cs` must remain clean.

Platform wait: if you add ImplicitWait, put it on a **bad** test/helper, not the good path.

## Commands

```bash
node scripts/self-check.js fixtures/self-check/violations --json
node scripts/self-check.js fixtures/sample-repos/appium-dotnet --json
node scripts/verify-profile-fixtures.js
node scripts/verify-self-check-fixtures.js
npm run verify
```

## Done when

- [ ] `MobileBy.*` selector-leak fix hint tells the agent to use `AppiumBy.*`
- [ ] `ImplicitWait` fires `manual-wait`; ExpectedConditions does not
- [ ] Appium skill documents WEBVIEW switch + leak still applies
- [ ] Sample repo has gesture leak, context-switch leak, MobileBy vs AppiumBy examples
- [ ] `appium-dotnet-fresh` not duplicated; verify-profile still green
- [ ] `npm run verify` green

## Out of scope

New Java skill (session 10). Java golden profile (10).
