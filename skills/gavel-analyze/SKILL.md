---
name: gavel-analyze
description: >
  Analyze test suite run results for any framework. Classify failures as env,
  seed, app bug, test bug, or expected fail. Produce pass-rate by area and
  ranked recommendations. Use after any test suite run.
---

# Gavel Analyze

Post-run suite analysis. Framework-adaptive.

## When to Use

- After running a full or partial test suite
- "Analyze results", "why did tests fail", "pass rate by area"

## Failure Classification

| Category | Signals | Action |
|----------|---------|--------|
| **env** | Connection refused, timeout, DNS failure | Fix env, re-run |
| **seed** | 404 on seeded data, empty grids, "not found" | Re-seed database |
| **app bug** | Assertion fails on correct test logic | File bug report |
| **test bug** | Wrong locator, stale auth, wrong config | Fix test |
| **test-maintenance-drift** | Clustered failures, same route/area, element-not-found or renamed-control pattern after recent deploy | gavel-impact → gavel-healer |
| **expected fail** | Marked expected failure (test.fail, @ExpectedFailure) | Document, link bug |

### Detecting test-maintenance-drift

Flag when **most** of these are true:

- ≥3 failures in the same feature area, route, or spec directory
- Errors are locator timeouts, missing text/roles, or "not attached" — not 5xx/auth
- Pass rate was high recently; failures coincide with application merges
- Retries do not help (not flaky — consistently missing DOM)

Hand off to **gavel-impact** for commit correlation, then **gavel-healer** to update
automation. Do not classify as app-bug without evidence the product regressed.

## Output Template

```
## Suite Analysis -- [project] -- [date]

### Summary
| Metric | Count |
|--------|------:|
| Passed | |
| Failed (unexpected) | |
| Skipped | |
| Expected fail | |
| Duration | |

### Pass Rate by Area
| Area | Passed | Total | Rate |
|------|-------:|------:|-----:|

### Failures
| Test ID | File | Classification | Notes |
|---------|------|----------------|-------|

### Recommendations (ranked)
1. [Highest impact action]
```

## Report Ingestion

When CI artifacts are available, parse them before manual triage:

```bash
# JUnit XML
node scripts/parsers/junit.js path/to/results.xml --json

# Allure results directory
node scripts/parsers/allure.js path/to/allure-results --json

# Auto-detect file or directory
node scripts/parsers/index.js path/to/report --json

# Cluster failures for drift vs env signals
node scripts/parsers/junit.js results.xml --json | node scripts/cluster-failures.js

# Playwright JSON report
node scripts/parsers/playwright.js playwright-report.json --json

# Cypress JSON report
node scripts/parsers/cypress.js cypress-results.json --json

# Full CI analysis with optional commit correlation (gavel-impact)
node scripts/analyze-ci.js path/to/report.json --app-repo path/to/app-repo --commits 15 --json
node scripts/parsers/playwright.js report.json --json | node scripts/analyze-ci.js --json
```

`analyze-ci.js` output includes per-cluster `classification`, `suspectCommits` (when
`--app-repo` is set), and `nextAction`. Use suspect commits as the starting point
for manual **gavel-impact** validation — do not treat git keyword search as proof.

Use parser output to pre-fill **Summary**, **Pass Rate by Area**, and **Failures** tables.
When a cluster shows `locator-timeout` in the same area (≥3 failures), classify as
**test-maintenance-drift** and hand off to **gavel-impact** → **gavel-healer**.

## Result Envelope

Analysis-only skill. Return `templates/result-envelope.md` when the report is complete.

- **Status `DONE`** — summary, clusters, and ranked recommendations present
- **Status `INCOMPLETE`** — raw failures listed but clustering or classification unfinished
- Omit **Changes** and **Verification** unless you also fixed tests
- **Next Action** must name `gavel-impact`, `gavel-healer`, `gavel-env`, or `none`
