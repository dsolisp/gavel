---
name: gavel-review
description: >
  Review test diffs for over-testing, redundant assertions, fat specs, missing
  test.step(), hardcoded data, and Test Constitution violations. One line per
  finding: location, what to cut or fix, what replaces it. Use when the user
  says "review my tests", "gavel-review", "/gavel-review", or "check this test".
  Complements correctness-focused review -- this one hunts test bloat and
  constitution violations.
---

Review test diffs for unnecessary complexity and Test Constitution violations.
One line per finding: location, what to cut or fix, what replaces it. The
diff's best outcome is getting leaner and more disciplined.

## Format

Prefix every finding with severity, then location and tag:

`<severity> L<line>: <tag> <what>. <replacement>.`

Or for multi-file diffs: `<severity> <file>:L<line>: <tag> ...`

### Severity

| Severity | Use when |
|----------|----------|
| `blocker` | Hides bugs or breaks trust (`expect-in-action`, `manual-wait`, `no-di`) |
| `fix` | Maintainability / Constitution (`selector-leak`, `css-loc`, `hardcoded`, `no-step`, `fat-spec`, `over-test`) |
| `cleanup` | Shrink without behavior risk (`shrink`, minor `fat-spec`) |
| `delete` | Remove redundant coverage (`yagni`) |

### Tag → default severity

| Tag | Severity |
|-----|----------|
| `expect-in-action` | blocker |
| `manual-wait` | blocker |
| `no-di` | blocker |
| `selector-leak` | fix |
| `css-loc` | fix |
| `hardcoded` | fix |
| `no-step` | fix |
| `fat-spec` | fix |
| `over-test` | fix |
| `shrink` | cleanup |
| `yagni` | delete |

Tags:

- `over-test:` multiple assertions checking the same state. Replacement: one focused assertion.
- `fat-spec:` logic, selectors, or data in the spec that belongs in POM/actions/factories. Replacement: thin spec + extracted helper.
- `selector-leak:` raw selector introduced outside the locator layer, including chained locator/WebElement/DOM traversal. Replacement: named locator getter/method.
- `css-loc:` CSS or XPath selector used. Replacement: semantic locator (getByRole, getByLabel, etc.).
- `hardcoded:` string, ID, URL, or credential in test body. Replacement: factory or fixture.
- `no-step:` logical grouping without test.step() / subTest / equivalent. Replacement: wrap in step.
- `manual-wait:` waitForTimeout, sleep, networkidle. Replacement: framework-native wait or web-first assertion.
- `no-di:` `new PageObject(page)` or `new Service()` in spec. Replacement: fixture DI.
- `expect-in-action:` `expect()`, `assert()`, or framework assertion calls in action/page/locator files. Replacement: return state, move assertion to spec.
- `yagni:` test that duplicates existing coverage. Replacement: nothing, delete it.
- `shrink:` same test logic, fewer lines. Show the shorter form.

## Examples

Bad: "This test might have too many assertions, consider reducing them."

Good:
- `blocker L22: manual-wait: waitForTimeout(3000). Remove; web-first assertion auto-retries.`
- `fix L8: css-loc: page.locator('.submit-btn'). Click via getByRole('button', { name: 'Submit' }).`
- `fix L18: selector-leak: locators.modal.locator('button.close'). Move closeButton to the locator class.`
- `delete L1-40: yagni: duplicates billing-snapshot-lifecycle coverage. Delete this spec.`
- `cleanup L3-20: shrink: inline navigation can be one action call. Use billingPage.open().`

## Scoring

End with the only metric that matters: `net: -<N> lines possible, <M> constitution violations.`

If there is nothing to cut: `Lean already. Ship.`

## Boundaries

Scope: test bloat, over-testing, and Test Constitution violations only.
Correctness bugs in the application, security holes, and performance are
explicitly out of scope. Route them to a normal review pass. Does not apply
the fixes, only lists them.

"stop gavel-review" or "normal mode": revert to verbose review style.
