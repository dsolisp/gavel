# Gavel Quickstart

The judge's hammer for test quality. Seven commands, seven flows. Ten minutes from install to first verdict.

## 1. Install (1 minute)

OpenCode/npm:
```json
{ "plugin": ["@dsolisp/gavel"] }
```

Claude Code:
```bash
/plugin marketplace add dsolisp/gavel
/plugin install gavel@gavel
```

For Cursor, Windsurf, Cline, Copilot, Kiro, Gemini, and copied adapters: see [README.md#install](README.md#install). The plugin auto-loads the QA Constitution on every session.

Upgrade later through your host's plugin/package update flow, or replace copied adapter files from the new release. See [README.md#upgrade](README.md#upgrade).

## 2. Open your test repo (1 minute)

Point gavel at any project with an existing test suite. Playwright, Selenium, Cypress, WebdriverIO, or Cucumber — gavel detects the stack automatically.

```bash
gavel detect
```

Expected output:
```
  gavel-detect results:

  Framework:     Playwright
  Version:       1.61.x
  Test runner:   @playwright/test
  Language:      TypeScript
  POM pattern:   Mixin composition
  CI system:     GitHub Actions
  Profile:       gavel-playwright (activated)
```

## 3. Unified CLI

Gavel ships a single CLI entry point. All commands follow the same pattern:

```bash
gavel <command> [args] [--config gavel.config.json]
```

**Core commands:**

| Command | Purpose |
|---------|---------|
| `gavel audit` | Whole-repo suite health scan |
| `gavel review` | Diff-scoped constitution review |
| `gavel self-check` | Static constitution violation scanner |
| `gavel analyze` | Post-run failure classification |
| `gavel affected-tests` | Import-graph test discovery |
| `gavel detect` | Stack and profile detection |
| `gavel explain <tag>` | Rule contract lookup |

**Exit codes:**

| Code | Meaning |
|------|---------|
| `0` | Clean — no actionable findings |
| `1` | Actionable findings at or above fail threshold |
| `2` | Usage, config, or schema error |

**Config resolution:** `--config` flag → `gavel.config.json` in CWD → `package.json#gavel` → defaults. Zero-config first run works with defaults plus a one-line hint toward `gavel.config.json`.

**Compatibility aliases:** `gavel-audit`, `gavel-review`, `gavel-self-check`, `gavel-analyze`, `gavel-affected-tests`, `gavel-detect`, `gavel-explain` remain as one-minor-line compatibility aliases and call the same implementation.

**Companion workflows:** `gavel companion --help` lists optional skills (cloud CI, env setup, issue closure, external credentials). These are not part of the first-run path.

## 4. Flow 1: Audit a test suite (2 minutes)

Whole-repo scan for bloat, dead code, and constitution violations.

**CLI:**
```bash
gavel audit
```

**Slash command:**
```
/gavel-audit
```

**Step-by-step:**

1. Run the audit:
   ```bash
   gavel audit
   ```

2. Review the ranked output:
   ```
   Suite health:
     142 tests, 38 specs, 12 page objects
     Constitution violations:
       css-loc:        31
       no-step:        18
       no-di:           9
       hardcoded:       7
       manual-wait:     4
       over-test:       3
     Dead code:        2 unused POMs, 14 dead locators
     net: -284 lines possible.
   ```

3. Take the top 5 findings. Each has a one-line replacement.

4. Optional: run autofix dry-run to see safe cleanup candidates:
   ```bash
   node scripts/audit-autofix.js <repo> --audit-format
   ```

5. Apply safe fixes (confirmed dead code only):
   ```bash
   node scripts/audit-autofix.js <repo> --apply
   ```

6. Re-run audit to confirm improvement.

**Done when:** ranked findings reviewed, top violations fixed or scheduled, dead code removed.

## 5. Flow 2: Review a diff (2 minutes)

Diff-scoped constitution review. Catches bloat and violations in changed code only.

**CLI:**
```bash
gavel review
```

**Slash command:**
```
/gavel-review
```

**Step-by-step:**

1. Stage your changes:
   ```bash
   git add tests/
   ```

2. Run the review:
   ```bash
   gavel review
   ```

3. Review one-line findings:
   ```
   blocker review L22: manual-wait: waitForTimeout(3000). Remove; web-first assertion auto-retries.
   fix review L8: css-loc: page.locator('.submit-btn'). Click via getByRole('button', { name: 'Submit' }).
   fix review L18: selector-leak: locators.modal.locator('button.close'). Move closeButton to the locator class.
   ```

4. Fix blocker and fix findings. Cleanup/delete findings are optional.

5. Re-run review until clean:
   ```bash
   gavel review
   ```

**Done when:** zero blocker/fix findings in the diff.

## 6. Flow 3: Run self-check (1 minute)

Static constitution violation scanner. Fast, repeatable, CI-friendly.

**CLI:**
```bash
gavel self-check
```

**Slash command:**
```
/gavel-self-check
```

**Step-by-step:**

1. Run the scanner:
   ```bash
   gavel self-check
   ```

2. Review one-line findings:
   ```
   selector-leak pages/catalog/ExamplePage.ts:42 — this.page.getByRole('button', { name: 'Save' })
   manual-wait tests/e2e/users.spec.ts:15 — waitForTimeout(2000)
   ```

3. Exit code `0` = no violations. Exit code `1` = violations found.

4. Optional: JSON output for CI integration:
   ```bash
   gavel self-check --json
   ```

5. Suppress false positives with scoped ignores:
   ```typescript
   // gavel-ignore: manual-wait
   await page.waitForTimeout(1000); // known race in legacy flow
   ```

**Done when:** violations reviewed, false positives suppressed with scoped ignores, real violations fixed.

## 7. Flow 4: Analyze a CI failure (3 minutes)

Post-run failure classification. Env, seed, app bug, test bug, or expected fail.

**CLI:**
```bash
gavel analyze <report-path>
```

**Slash command:**
```
/gavel-analyze
```

**Step-by-step:**

1. Obtain the test report (JUnit XML, Allure, Playwright JSON, Cypress JSON, or HTML report directory).

2. Run the analyzer:
   ```bash
   gavel analyze playwright-report/
   ```

3. Review the classification:
   ```
   ## Suite Analysis -- MyProject -- 2026-07-09

   ### Summary
   | Metric | Count |
   |--------|------:|
   | Passed | 134 |
   | Failed (unexpected) | 8 |
   | Skipped | 2 |
   | Expected fail | 1 |
   | Duration | 4m 12s |

   ### Failures
   | Test ID | File | Classification | Notes |
   |---------|------|----------------|-------|
   | TIC-123 | tests/users.spec.ts | test bug | Locator changed after UI refactor |
   | TIC-456 | tests/billing.spec.ts | app bug | 500 response on valid payload |

   ### Recommendations (ranked)
   1. Fix locator in users.spec.ts (test bug)
   2. File bug report for billing 500 (app bug)
   ```

4. Route each failure:
   - **test bug** → `gavel heal` to diagnose, then fix
   - **app bug** → `gavel bug` to report
   - **env issue** → `gavel env` to fix (companion)
   - **flake** → `gavel flake` to triage

5. Optional: JSON envelope for machine consumption:
   ```bash
   gavel analyze playwright-report/ --json-envelope
   ```

**Done when:** all failures classified, routed to the correct skill, ranked recommendations reviewed.

## 8. Flow 5: Heal a failing test (2 minutes)

Diagnose a single failing test. Return a verdict with evidence. Do not fix — just diagnose.

**CLI:** (not a CLI command — use slash command or agent)

**Slash command:**
```
/gavel-heal tests/e2e/users/user-flow.spec.ts "submit form saves draft"
```

**Step-by-step:**

1. Run the failing test in isolation:
   ```bash
   npx playwright test tests/e2e/users/user-flow.spec.ts -g "submit form saves draft" --reporter=list
   ```

2. Capture the error message, stack trace, and screenshot/trace path.

3. Invoke gavel-heal:
   ```
   /gavel-heal tests/e2e/users/user-flow.spec.ts "submit form saves draft"
   ```

4. Review the verdict:
   ```
   ## Diagnosis: TEST BUG

   **Test:** submit form saves draft
   **File:** tests/e2e/users/user-flow.spec.ts
   **Error:** TimeoutError: locator.click: Timeout 30000ms exceeded.
   **Category:** locator

   ### Evidence
   - Error says: button not found
   - DOM shows: button renamed from "Save" to "Submit"
   - Checked: locator uses getByRole('button', { name: 'Save' })

   ### Recommended next step
   → Update locator to getByRole('button', { name: 'Submit' })
   ```

5. Route by verdict:
   - **TEST BUG** → fix the test (update locator, assertion, or data)
   - **APP BUG** → file a bug report
   - **ENV ISSUE** → fix environment (companion)
   - **FLAKY** → triage with `gavel flake`
   - **AMBIGUOUS** → escalate to user with evidence

**Done when:** verdict returned with evidence, root cause identified, next action clear.

## 9. Flow 6: Refactor test code (3 minutes)

Improve test code quality without changing what tests verify. Remove duplication, extract POMs, parameterize tests.

**CLI:** (not a CLI command — use agent)

**Slash command:**
```
/gavel-refactor tests/e2e/billing/
```

**Step-by-step:**

1. Identify the refactor target (directory, file, or smell):
   - Hardcoded data → extract to factories
   - Inline selectors → move to locator classes
   - Direct instantiation → replace with fixture DI
   - Missing step wrappers → add `test.step()` grouping
   - Brittle locators → replace with accessibility-first locators

2. Invoke gavel-refactor:
   ```
   /gavel-refactor tests/e2e/billing/
   ```

3. Review the changes:
   - Locators moved to locator classes
   - Actions updated to call `this.locators.methodName()`
   - Hardcoded data replaced with `Factory.create()`
   - Direct instantiation replaced with fixture DI
   - Step wrappers added where missing

4. Run the verification gate:
   ```bash
   # 1. Type-check
   npx tsc --noEmit

   # 2. Lint
   npx eslint .

   # 3. Run affected tests
   node scripts/affected-tests.js <repo> --git --framework playwright
   npx playwright test <affected-specs>

   # 4. Self-check
   gavel self-check
   ```

5. Compare pass rate before vs after — must be equal or better.

**Done when:** compile/lint pass, affected tests pass, self-check clean, no assertions changed, no test coverage reduced.

## 10. Flow 7: Write UI/API tests with existing framework patterns (5 minutes)

Generate new tests using the existing suite's POM, fixtures, factories, and assertion patterns.

**CLI:** (not a CLI command — use agent)

**Slash commands:**
```
/gavel-e2e Add a test that the empty list shows the 'Get Started' CTA.
/gavel-api Add a test for GET /api/users/123 schema validation.
```

**Step-by-step (UI test):**

1. Describe the test in natural language:
   ```
   /gavel-e2e Add a test that the empty list shows the 'Get Started' CTA.
   ```

2. Gavel climbs the QA Ladder and generates:
   - Semantic locator: `getByRole('link', { name: 'Get Started' })`
   - Fixture DI: no direct instantiation
   - Factory data: no hardcoded strings
   - `test.step()` grouping
   - Web-first assertion: `await expect(locator).toBeVisible()`
   - One assertion per line

3. Review the generated test:
   ```typescript
   test('empty list shows Get Started CTA', async ({ page }) => {
     await test.step('navigate to dashboard', async () => {
       await dashboardActions.open();
     });

     await test.step('verify empty state', async () => {
       const cta = page.getByRole('link', { name: 'Get Started' });
       await expect(cta).toBeVisible();
     });
   });
   ```

4. Run the verification gate:
   ```bash
   npx tsc --noEmit
   npx eslint .
   npx playwright test tests/e2e/dashboard.spec.ts
   gavel self-check
   ```

**Step-by-step (API test):**

1. Describe the test:
   ```
   /gavel-api Add a test for GET /api/users/123 schema validation.
   ```

2. Gavel generates using the service-layer pattern:
   - Service class encapsulates HTTP calls
   - Fixture DI for services
   - Factory data for request payloads
   - Schema validation with Ajv or Zod
   - Coverage: happy path (200), validation (400), auth (401), authZ (403)

3. Review the generated test:
   ```typescript
   test('GET /api/users/123 returns valid schema', async ({ request }) => {
     const response = await request.get('/api/users/123');
     expect(response.status()).toBe(200);
     const body = await response.json();
     expect(ajv.validate(userSchema, body)).toBe(true);
   });
   ```

4. Run the verification gate:
   ```bash
   npx tsc --noEmit
   npx eslint .
   npx playwright test tests/api/users.spec.ts
   ```

**Done when:** test passes, self-check clean, follows existing suite patterns, no hardcoded data, semantic locators, fixture DI, web-first assertions.

## 11. Set your intensity

```bash
gavel full      # default: enforce all rules
gavel strict    # zero tolerance
gavel lite      # suggest only
gavel off       # disable
```

`strict` is for release branches and protected main. `lite` is for spike work. `full` is the daily driver.

## 12. What's next

- See [examples/](examples/) for cross-framework patterns (Playwright, Selenium, Cypress, WebdriverIO)
- See [skills/](skills/) for the full 30-skill catalog
- See [AGENTS.md](AGENTS.md) for the complete ruleset (Minimalism Ladder + QA Ladder + Test Constitution)
- See [skills/gavel-flake/SKILL.md](skills/gavel-flake/SKILL.md) for the flaky-test quarantine policy
- See [skills/gavel-run/SKILL.md](skills/gavel-run/SKILL.md) for the verification gate and parallel execution
- See [companion/README.md](companion/README.md) for optional workflows (cloud CI, env setup, issue closure, external credentials)

One test. One verdict. Move on.