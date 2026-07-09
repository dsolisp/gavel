# Gavel Ecosystem Architecture

## Two Repos, Two Roles

The Gavel ecosystem is split into two repositories with strictly separated concerns.

| | **Gavel** | **Bailiff** |
|---|---|---|
| **Metaphor** | The judge | The court officer |
| **Domain** | Test code | QA workflow |
| **Writes test code?** | Yes — new tests, POMs, factories, refactors | No |
| **Reads test code?** | Yes — audits, reviews, self-checks | No |
| **Runs tests?** | No | Yes — CI, local env, nightly, quarantine |
| **Reports?** | Audit verdicts, failure classification | Bug reports, closure summaries, CI verdicts |
| **Touch** | Your test files | Your CI, issue tracker, environment, credentials |

### Why two repos and not one?

Gavel's scope is **test code** — its structure, quality, and correctness. Bailiff's scope is **QA operations** — running things, reporting things, managing infrastructure. These are different concerns that evolve at different speeds and serve different workflows. Keeping them separate prevents scope creep and keeps each tool's identity sharp.

### Why two repos and not three?

Test authoring (writing new tests, POMs, factories) and test judging (auditing, reviewing, self-checking) share the same knowledge: framework detection, POM architecture, locator strategy, the Test Constitution, the QA Ladder, and framework profiles. Gavel writes tests that pass its own audit — the same way ESLint formats code that passes its own rules. Splitting authoring into a third repo creates friction for zero architectural benefit.

---

## Gavel: Test Code Ownership

Gavel owns everything that lives in your test files:

**Authoring (writing from scratch):**
- Scaffold new projects (`gavel-init`)
- Write E2E tests using existing POM patterns (`gavel-e2e`)
- Write API tests using existing service layers (`gavel-api`)
- Generate tests from framework-native patterns (`gavel-generator`, `gavel-api-specialist`)
- Maintain POMs, locators, actions, factories, and fixtures

**Judging (reading and diagnosing):**
- Audit the whole suite for bloat, dead code, and constitution violations (`gavel-audit`)
- Review diffs for over-testing and layering leaks (`gavel-review`)
- Self-check for static violations (`gavel-self-check`)
- Classify CI failures as test bug, app bug, or env issue (`gavel-analyze`)
- Diagnose flaky tests (`gavel-flake`)
- Diagnose failing tests (`gavel-heal`)
- Score refactors (`gavel-refactor`)
- Track deliberate deferrals (`gavel-debt`)

---

## Bailiff: QA Workflow Ownership

Bailiff owns everything outside your test files:

- Run tests in CI or locally (`gavel-ci`, `gavel-env`)
- Plan test scenarios from tickets and requirements (`gavel-plan`)
- Write bug reports from Gavel's verdicts (`gavel-bug`)
- Close issue-tracker tickets after QA verification (`gavel-close`)
- Manage external API credentials (`gavel-hub`)
- Prepare branches for PR (`gavel-pr-prep`)
- Navigate to app source-code culprits (`gavel-triage`)

Bailiff never touches test code. It runs what Gavel wrote and judged.

---

## Browser-First Authoring Principle

When Gavel writes or modifies test automation, it does **not** guess at DOM structure, API shapes, or UI behavior from tickets or code alone. It opens a browser, navigates to the actual application, and observes real behavior before writing a single line of automation.

### The three-source model

Every test automation decision is grounded in three sources, in order:

1. **Ticket requirements** — what the ticket says should happen
2. **Code implementation** — what the application code claims to do
3. **Actual app behavior** — what the browser actually shows

Source 3 is the tiebreaker. If the ticket says one thing, the code says another, and the browser shows a third — the browser wins. The test is written against reality, then a bug is filed for the discrepancy.

### Why this matters

Writing automation from tickets and code alone produces tests that encode assumptions. When the app behaves differently than expected, those tests fail — not because of a real regression, but because the automation was built on an incorrect mental model. Debugging then becomes a cycle of "fix the test to match what the app actually does" — wasted time that could have been avoided by looking at the app first.

Browser-first authoring eliminates this cycle:

- **Accurate locators** — written against the real DOM, not guessed from component names
- **Correct assertions** — assert what the UI actually shows, not what the ticket describes
- **Realistic flows** — follow the actual user journey, including redirects, loading states, and edge cases that tickets rarely document
- **Faster debugging** — when a test fails, it's a real regression, not an assumption mismatch

### How it works in practice

```
ticket says: "User sees confirmation toast after save"
code says:   POST /api/save returns 200, then showToast() is called
browser shows: toast appears after 800ms with specific text "Changes saved"

Automation writes:
  → await page.getByRole('status').filter({ hasText: 'Changes saved' }).waitFor()
  → not: expect(toast).toBeVisible()  (assumes toast exists immediately)
  → not: expect(response.status()).toBe(200)  (asserts API, not UI)
```

The test asserts the user-visible outcome, uses a framework-native wait for the actual timing, and ignores the API response entirely — because the user doesn't see HTTP status codes.

### This is not "manual testing"

Browser-first authoring is not manual QA. It is the AI opening a browser context, navigating to the relevant page, inspecting the DOM, observing timing and state transitions, and using that evidence to write accurate automation. It takes seconds, not minutes. It happens before the first line of test code is written, not after.

The output is still automated tests. The difference is that those tests are grounded in observed reality rather than inferred assumptions.
