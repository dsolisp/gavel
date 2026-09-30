# Prompt: port the C# POM contract to the other languages Gavel scans

You are implementing a scanner change in the Gavel repo. Read this file, then change the code. Do not treat this file as the implementation.

Base: `main` at tag `v0.12.4` (`da99e1b`). Do not apply or drop the local stash `local 0.13 architecture WIP before pull 0.12.4`.

## Outcome

`thin-wrapper`, `private-locator-alias`, `new-locator-shadow`, and `fat-method` already fire on C# page/action files. Make the same verdicts fire on page/action files in TypeScript, JavaScript, Python, and Java. Keep the rule ids. Do not add tags. Do not change C# detection, C# fixtures, or existing C# unit assertions.

Languages and stacks in scope:

- `.ts` / `.tsx` / `.js` / `.jsx` — Playwright, Cypress, WebdriverIO
- `.py` — pytest-playwright, Selenium
- `.java` — Selenium / JUnit page objects

Out of scope: `.feature` files, Cucumber/SpecFlow step bindings, and Robot keywords. Those are not page methods. A one-line step that calls a page method is not a thin wrapper.

## Why this exists

0.12.3 and 0.12.4 closed a class of POM bugs, but only for C#. The same bugs show up in the other stacks Gavel claims to support: a page method whose body is a single click or fill, a private field that only renames a locator, a subclass that hides a base locator under the same name, and a long page method that someone "fixes" by slicing it into one-line wrappers.

A separate locator pass on a legacy Playwright suite showed a second failure mode the C# release does not cover. Replacing a stable product id with `getByText` looks like a locator improvement and makes the test worse. That constraint is binding on this change. See "Do not do this" below.

## Current C# contract (do not rewrite it)

All four rules are gated by `isCsharpPomActionFile` in `scripts/self-check.js`. `buildThinWrapperIndex` skips every file that does not end in `.cs`.

| Rule | What it flags | Verdict |
|------|----------------|---------|
| `thin-wrapper` | Page/action method whose body is one call (expression-bodied or a single-statement block). `WaitFor*` is excluded. | `callSites <= 1` and not shared → `subCase: delete`. `callSites > 1` or the same normalized body on more than one page → `subCase: move` (Base/Common/Shared). Shared path and `callSites <= 1` → `subCase: shared-yagni`. Shared path and `callSites > 1` is clean. |
| `private-locator-alias` | `private` or `protected` `ILocator Name => _locators.Name`. | Flag. A `public` re-export is the dual API and stays clean. |
| `new-locator-shadow` | `public new ILocator Name`. | Flag. The `new` keyword is C#. Other languages must detect the intent (same-name override of a locator member), not the token `new`. |
| `fat-method` | Method body with at least 25 non-blank lines and at least 4 native actions. | Flag. The fix hint forbids inventing one-line wrappers as the split. |

`isSharedPomPath` is already language-neutral: a path segment or basename containing `base`, `common`, or `shared`.

The cross-file index is `buildThinWrapperIndex`. It records `callSites` as the number of `.MethodName(` hits across the scan, and `bodyDupes` as how many POM files share the same normalized one-call body. `setThinWrapperScanContext` injects that index into the rule. When the context is null, a one-liner is `delete` (callSites defaults to 0). Preserve that.

Existing proof you must keep green:

- `scripts/test/unit.test.js` test `C# thin-wrapper / private-alias / new-shadow / fat-method`
- `fixtures/self-check/clean/thin-wrapper/` and `fixtures/self-check/violations/thin-wrapper/`
- `fixtures/self-check/clean|violations/` for `private-locator-alias`, `new-locator-shadow`, `fat-method`
- `scripts/suite-health.js` `countFatPomFiles` on `fixtures/suite-health/fat-pom` still returns `1`

## Syntax you must recognize

A thin wrapper is one call, not only Click/Fill. Ignore a body that is only a wait (`waitFor`, `WaitFor`, `until`, `WebDriverWait`).

TypeScript / JavaScript, both shapes:

```ts
async submit() { await this.locators.submitButton.click() }
submit = async () => { await this.locators.submitButton.click() }
```

A method with two calls is composed and clean:

```ts
async signIn(email: string) {
  await this.locators.email.fill(email)
  await this.locators.submitButton.click()
}
```

Python:

```python
def submit(self):
    self.locators.submit_button.click()
```

Java:

```java
public void submit() {
    locators.submit().click();
}
```

Private locator alias (flag). Public re-export (clean):

```ts
private submit = this.locators.submit          // flag
private get submit() { return this.locators.submit }  // flag
public get submit() { return this.locators.submit }   // clean dual API
```

```python
def _submit(self):
    return self.locators.submit   # flag when the name is a 1:1 alias
```

```java
private Locator submit() { return locators.submit(); }  // flag
public Locator submit() { return locators.submit(); }   // clean dual API
```

Locator shadow means a subclass member with the same name as a locator on the base type, not the C# `new` keyword:

```ts
class FeaturePage extends BasePage {
  submit = this.locators.other   // flag when BasePage already exposes submit as a locator
}
```

```python
class FeaturePage(BasePage):
    def submit(self):
        return self.locators.other
```

```java
class FeaturePage extends BasePage {
    public Locator submit() { return locators.other(); }
}
```

If you cannot prove the base member without a type resolver, flag only an explicit override marker (`override` in TS, a method that redefines a name already declared on a `Base*` / `*Page` in the same file or a file the index already loaded). Do not flag every subclass method. A wrong `new-locator-shadow` on TypeScript is worse than a miss. Add a fixture that shows the case you can prove, and a clean fixture for an unrelated extra method.

Native actions for `fat-method`, in addition to the existing C# list:

- TS/JS: `.click(`, `.fill(`, `.press(`, `.selectOption(`, `.check(`, `.uncheck(`, `.type(`, `.hover(`, `.dblclick(`, `.tap(`
- Python: `.click(`, `.send_keys(`, `.clear(`
- Java: `.click(`, `.sendKeys(`, `.clear(`

Threshold stays 25 non-blank lines and 4 action calls. Do not lower it.

## Fat POM count

`countFatPomFiles` in `scripts/suite-health.js` already walks `.ts`, `.js`, `.py`, `.java`, and `.cs`, but `LOCATOR_SIGNAL_RE` and `ACTION_SIGNAL_RE` only match C# shapes (`GetByRole`, `.Locator(`, `ClickAsync`, `SendKeys`). A TypeScript page that calls `getByRole` and `.click()` is invisible.

Extend the signals so these count as selector creation: `getByRole`, `getByText`, `getByLabel`, `getByPlaceholder`, `getByAltText`, `getByTitle`, `getByTestId`, `.locator(`, `find_element`, `find_elements`, `findElement`, `findElements`, and the existing C# / Appium forms.

Extend actions with the camelCase and Python forms above (`.click(`, `.fill(`, `.send_keys(`, `.sendKeys(`) without dropping `ClickAsync` / `SendKeys`.

A typed re-export is not ownership. `private submit = this.locators.submit` must not by itself make the file a fat POM. The file is fat only when it both creates a selector and performs an action.

## Do not do this

These came from a real Playwright suite, not from the C# release. The implementing change must not teach or automate them.

- Playwright has no `getById`. The way to target an `id` is `locator('#id')` or `locator('[id="id"]')`. Do not retarget `testIdAttribute` to `id`. That breaks `getByTestId('rose-ui-notification')` and is a cosmetic alias.
- `getByRole` / `getByLabel` / `getByTitle` / `getByText` is an improvement only when that accessible name is unique on the live page. A stable product id (`#POM_SAVEbtnCtr`, `By.id`) stays. The product's own script often calls `getElementById` on it, and the visible label goes through i18n.
- Do not replace `page.locator('#POM_SAVEbtnCtr')` with `getByText('Save').first()`, or `getByText('Add Existing POM(s)')` when the visible label is `Add Existing`, or `getByText('Search')` when the dialog has two cells named Search. `complex-locator` only scores string literals inside `locator()` / `Locator()` / `FindElement`. Swapping to `getByText` makes the scanner go quiet and the test worse. Do not add a fixer that does this. Do not document it as the remediation for `complex-locator`.
- Do not remediate `fat-method` by inventing `clickSave()` / `fillEmail()`. That is the thin wrapper this rule exists to delete.
- Do not move assertions into page methods to "use" a wrapper. Specs own business `expect`. Pages own composed flows.

## Index and file classification

Reuse `buildThinWrapperIndex`, `callSites`, and `bodyDupes`. Stop skipping non-`.cs` files.

A POM/action file for this rule is:

- under `pages/`, `page/`, `page-objects/`, or `actions/`, and not a locator file and not a spec, or
- a basename ending in `Page.cs` (already), `Page.ts`, `Page.js`, `Page.py`, `Page.java`, `_page.py`

Locator files (`*.locators.ts`, `locators/`, `Locators/`) stay out. Specs stay out. The one-liner has to live on the page/action type.

`countMethodCallSites` looks for `.MethodName(`. That matches C# and TS/Java. For Python, also count `self.method_name(` and a bare `method_name(` call. Do not count the definition line as a call site. The existing C# fixture `pages/shared/SharedSubmitPage.cs#SharedSubmitAsync` must still report `callSites > 1`.

Normalize bodies the way `normalizeThinBody` already does (strip `await`, collapse whitespace, lowercase) and also strip a leading `return` so `return this.locators.submit.click()` and `await this.locators.submit.click()` share a body key.

## Tests and docs

Add clean and violating fixtures beside the C# ones. Mirror the C# layout; do not replace it.

- `fixtures/self-check/violations/thin-wrapper/pages/` — one TS (or JS), one Python, and one Java page with a single-call method (`delete`)
- `fixtures/self-check/clean/thin-wrapper/pages/` — a composed two-call method in each of those languages, plus one shared helper that is actually called twice (`callSites > 1` stays clean)
- one feature-page file whose body matches another page, expecting `subCase: move` when the index is built
- one shared file whose one-liner has `callSites <= 1`, expecting `shared-yagni`
- `private-locator-alias`: private 1:1 alias flagged, public re-export clean, in TS and at least one of Python or Java
- `new-locator-shadow`: one proven same-name override flagged, one extra method on a subclass clean
- `fat-method`: one method over the threshold flagged, one 3-action method clean
- `fixtures/suite-health/`: a TS page that creates a selector and clicks is a fat POM; a TS page that only re-exports locators and clicks through them is not, unless it also creates a selector

Extend `scripts/test/unit.test.js` with a sibling of the C# test, not a rewrite of it. Cover `subCase` `delete`, `move`, and `shared-yagni`, the public-vs-private alias, and `buildThinWrapperIndex` on a non-`.cs` fixture root.

Update:

- `CHANGELOG.md` under `## [Unreleased]`, describing the widened rules. Do not edit the 0.12.2–0.12.4 sections.
- `skills/gavel-self-check/SKILL.md` rule rows so `thin-wrapper`, `private-locator-alias`, `new-locator-shadow`, and `fat-method` no longer say "C# only". `new-locator-shadow` should describe same-name locator override, and mention `public new ILocator` as the C# form.
- `AGENTS.md` only if a sentence still says the one-liner rule is C#-specific. WON'T DO #6 is already language-neutral; leave it unless it contradicts the new detection.

## Verification

Run `npm run verify` from the Gavel repo root. If that gate is too broad for a local check, run the unit test file and `node scripts/verify-self-check-fixtures.js` and say which gate you did not run.

Done means:

- Existing C# tests still pass, including `countFatPomFiles(fixtures/suite-health/fat-pom) === 1` and the shared C# call-site assertion.
- New TS/JS, Python, and Java fixtures produce the subCases named above.
- A `getByText` swap of a stable id is not introduced as a fix, a fixture marked clean, or a skill example.
- No new rule id.
