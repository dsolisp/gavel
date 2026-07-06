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

Prefix every finding with severity, autofix eligibility, then location and tag:

`<severity> <autofix> L<line>: <tag> <what>. <replacement>.`

Or for multi-file diffs: `<severity> <autofix> <file>:L<line>: <tag> ...`

### Severity

| Severity | Use when |
|----------|----------|
| `blocker` | Hides bugs or breaks trust (`expect-in-action`, `manual-wait`, `no-di`) |
| `fix` | Maintainability / Constitution (`selector-leak`, `css-loc`, `hardcoded`, `no-step`, `fat-spec`, `over-test`) |
| `cleanup` | Shrink without behavior risk (`shrink`, minor `fat-spec`) |
| `delete` | Remove redundant coverage (`yagni`) |

### Tag → default severity + autofix

| Tag | Severity | Autofix |
|-----|----------|---------|
| `expect-in-action` | blocker | review |
| `manual-wait` | blocker | review |
| `no-di` | blocker | review |
| `selector-leak` | fix | review |
| `css-loc` | fix | review |
| `hardcoded` | fix | review |
| `no-step` | fix | review |
| `fat-spec` | fix | review |
| `over-test` | fix | review |
| `shrink` | cleanup | safe |
| `yagni` | delete | report-only |

## Autofix eligibility (diff-scoped)

| Autofix | Meaning | Agent / action |
|---------|---------|----------------|
| `safe` | Mechanical change in the diff, low behavior risk | gavel-refactor may apply after grep confirms zero external refs |
| `review` | Needs human or healer judgment | gavel-healer / gavel-refactor with test run |
| `report-only` | List only — do not auto-edit | Document for ticket or manual triage |

Diff-scoped safe fixes (mirror `gavel-audit`):

- `safe` + `shrink`: inline trivial navigation or duplicate step in the diff only
- `safe` + dead locator symbol removed in diff: grep confirms zero refs outside the locator file
- `review` for all blocker/fix tags — never auto-apply waits, DI, or selector moves
- `report-only` for `yagni` — human decides delete vs keep

For dead locator removal at repo scale, use `node scripts/audit-autofix.js <repo>` (dry-run default).
For orchestrator handoff on `safe` findings, see `templates/apply-safe-workflow.md`.

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
- `blocker review L22: manual-wait: waitForTimeout(3000). Remove; web-first assertion auto-retries.`
- `fix review L8: css-loc: page.locator('.submit-btn'). Click via getByRole('button', { name: 'Submit' }).`
- `fix review L18: selector-leak: locators.modal.locator('button.close'). Move closeButton to the locator class.`
- `delete report-only L1-40: yagni: duplicates catalog-lifecycle coverage. Delete this spec.`
- `cleanup safe locators/ExampleLocators.ts:L45: dead-locator: unused getter in diff. Delete getter; grep shows zero refs.`
- `cleanup safe L3-20: shrink: inline navigation can be one action call. Use examplePage.open().`

## Scoring

End with the only metric that matters: `net: -<N> lines possible, <M> constitution violations.`

If there is nothing to cut: `Lean already. Ship.`

## Boundaries

Scope: test bloat, over-testing, and Test Constitution violations only.
Correctness bugs in the application, security holes, and performance are
explicitly out of scope. Route them to a normal review pass. Lists findings;
only `safe` items may be applied by gavel-refactor after grep confirmation.

"stop gavel-review" or "normal mode": revert to verbose review style.
