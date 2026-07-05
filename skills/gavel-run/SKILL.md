---
name: gavel-run
description: >
  Configure and run tests for any framework. Trace viewer, project setup,
  report analysis. Framework-adaptive. Use when asked to configure test runners,
  run local tests, debug using traces, or test multi-project configurations.
---

# Gavel Run

Test execution and configuration. Framework-adaptive via active profile.

## When to Use

- Configure Playwright, Selenium, Cypress, or WebdriverIO for a project
- Run tests locally with proper project settings
- Debug using trace viewer or screenshots
- Set up multi-project browser configurations

## General Run Pattern

1. Verify env: backend running, DB seeded, correct URLs
2. Type-check + lint before running
3. Run targeted test first, then expand
4. Use trace/report viewer for failures

## Per-Framework Quick Start

See the active framework profile (`gavel-playwright`, `gavel-selenium`, etc.) for exact commands.

## Debugging

- **Trace viewer**: Playwright `npx playwright show-report`, Cypress dashboard
- **Screenshots**: auto-captured on failure in most frameworks
- **Video**: Playwright `video: 'on-first-retry'`, Cypress `video: true`
- **Console logs**: captured in test reports

## The 4-Line Verification Gate

Before declaring work done, run these in order. Any failure blocks the merge.

```bash
# 1. Type-check (TS) or syntax-check (Python)
npx tsc --noEmit                    # TS
mypy .                             # Python
mvn compile                        # Java

# 2. Lint
npx eslint .                       # TS/JS
ruff check .                       # Python
mvn checkstyle:check               # Java

# 3. Test run (the actual suite)
npx playwright test                # Playwright
pytest                             # pytest
mvn test                           # JUnit

# 4. Coverage threshold (hard gate)
npx playwright test --coverage     # Playwright
coverage run -m pytest && coverage report --fail-under=80
```

Skip step 4 and you're claiming quality you haven't measured. The default coverage threshold is **80%**; raise it for critical paths (auth, payment, tenant isolation), lower it for throwaway code.

## Affected Test Discovery

After modifying action/locator files, find which specs are affected and run
only those. This is faster than running the full suite and catches broken
imports that TypeScript may miss (e.g., methods removed but type inference
resolves to a different overload).

### v1 — grep (quick fallback)

```bash
# Step 1: Identify modified files
git diff --name-only --diff-filter=M

# Step 2: Find specs importing a specific class
grep -rl "ModifiedActionsClass" tests/

# Step 3: Run only those specs
npx playwright test $(grep -rl "ModifiedActionsClass" tests/ | \
  sed 's|.*/tests/|tests/|' | sed 's/\.ts$//')
```

### v2 — import graph (preferred)

```bash
# Changed files from git
node scripts/affected-tests.js <repo-root> --git --framework playwright

# Explicit changed files
node scripts/affected-tests.js <repo-root> \
  --changed locators/ExampleLocators.ts,pages/ExamplePage.ts \
  --framework playwright --json
```

The script traces spec imports/references to locators, pages, actions, services,
and shared helpers. It returns:

- `affectedSpecs` — targeted spec paths
- `recommendedCommand` — framework-specific run command
- `escalateFullSuite` — `true` when shared fixtures/lib layers changed

For larger suites, run affected specs first, then full suite if time permits.
Never skip the affected test run before declaring done. Report pass count
(e.g. `8/8`). Missing test-run evidence = **INCOMPLETE** per gavel-orchestrator.

## Result Envelope

When `gavel-run` completes an execution gate (not just config advice), return
`templates/result-envelope.md`.

- **Status `DONE`** — compile/lint passed and affected or requested tests ran with pass count
- **Status `INCOMPLETE`** — command suggested but not executed, or pass count missing
- Include exact `recommendedCommand` output in **Verification → Tests**

## Parallel Execution & Sharding

CI speed is non-negotiable. Run tests in parallel from day one.

```bash
# Playwright: shard across N CI runners
npx playwright test --shard=1/3
npx playwright test --shard=2/3
npx playwright test --shard=3/3

# pytest: parallel workers
pytest -n auto                      # xdist, auto-detect cores
pytest -n 4                         # explicit worker count

# JUnit: parallel surefire
mvn test -Dsurefire.parallel=classes -DthreadCount=4
```

**Shard by feature, not by file.** A suite split by file guarantees uneven load (one big file runs alone). Split by tag or directory for balanced shards.

## Retry Policy (use sparingly)

Retries mask flakiness. Use them only when:

- ✅ External service flakiness (third-party API, payment gateway)
- ✅ Initial-state races (DB seed not committed yet)
- ❌ Never retry on app bugs (forces you to fix it)
- ❌ Never retry on assertion mismatches (the test caught a real failure)

```bash
# Playwright: limit retries to 1 in CI, 0 locally
# playwright.config.ts: retries: process.env.CI ? 1 : 0
```
