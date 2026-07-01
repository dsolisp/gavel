---
name: gavel-ci
description: >
  Run automation on cloud infrastructure (OCI, GitHub Actions, GitLab CI, etc.).
  Use for CI migration, nightly test runs, or when asked about cloud vs local
  test execution.
---

# Gavel CI

Cloud CI automation runner.

## When to Use

- Setting up CI pipelines for test automation
- Migrating tests from local to cloud execution
- Nightly/weekly automated test runs
- Comparing cloud vs local test execution

## Supported CI Systems

| CI | Config File | Notes |
|----|-------------|-------|
| GitHub Actions | `.github/workflows/*.yml` | Most common for open-source |
| GitLab CI | `.gitlab-ci.yml` | Good for monorepos |
| Jenkins | `Jenkinsfile` | Enterprise standard |
| Azure DevOps | `azure-pipelines.yml` | Microsoft ecosystem |
| CircleCI | `.circleci/config.yml` | Fast parallel execution |
| Oracle Cloud (OCI) | Custom scripts | Always Free tier available |

## General CI Pattern

```yaml
# GitHub Actions example
name: Test Automation
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
```

## Best Practices

1. Cache dependencies (node_modules, Playwright browsers)
2. Run smoke tests on PR, full suite on merge to main
3. Upload test reports as artifacts
4. Use matrix strategy for multi-browser testing
5. Set appropriate timeouts (tests should complete in < 30 min)

## CI Report Artifacts

Upload machine-readable reports so gavel-analyze can ingest failures:

| Artifact | Parser |
|----------|--------|
| JUnit XML | `node scripts/parsers/junit.js report.xml --json` |
| Allure results dir | `node scripts/parsers/allure.js allure-results --json` |
| Playwright JSON | `node scripts/parsers/playwright.js report.json --json` |
| Cypress JSON | `node scripts/parsers/cypress.js results.json --json` |
| Unknown report | `node scripts/parsers/index.js artifact --json` |
| Full analysis + impact | `node scripts/analyze-ci.js report.json --app-repo ../app --json` |

Example GitHub Actions upload:

```yaml
- run: npx playwright test --reporter=junit
  if: always()
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: junit-report
    path: results.xml
```

Post-run workflow:

```text
download CI artifact
  → parse report (junit/allure/index)
  → cluster failures (cluster-failures.js)
  → gavel-analyze classification
  → gavel-impact when drift cluster detected
```

## Gavel Verify Gate (package repo)

For the gavel package itself, release readiness requires:

```bash
npm run verify
node scripts/self-check.js <target-automation-repo> --json
```

See `RELEASE_CHECKLIST.md` for the full release gate list.
