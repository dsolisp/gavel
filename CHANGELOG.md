# Changelog

All notable changes to the gavel package are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2026-07-04

### Added

- `scripts/verify-docs.js` — doc drift guardrail in verify gate (version, skill counts, parser refs, stale caveats)
- `scripts/refactor-score.js` — before/after line count + violation delta for refactors
- `scripts/suite-health.js` — ranked suite health summary with optional critical-area scoring via `gavel.config.json`
- `scripts/load-gavel-config.js` — shared repo config loader
- Self-check rules: `bare-test-fail`, `test-fail-order`, `skip-marker`, `test-id-duplicate`, `test-id-gap`
- Self-check inline allow (`// gavel-allow: tag`) and config allowlist
- `companion/` directory — optional skills extracted from core surface (`gavel-ci`, `gavel-env`, `gavel-hub`, `gavel-close`)
- `companion/README.md` — companion workflow index
- `templates/gitlab-ci/gavel-self-check.yml` — GitLab CI self-check template
- `.github/workflows/gavel-verify.yml` — dogfooded verify gate with CI badge
- `scripts/test/unit.test.js` — lightweight node:test unit tests for parsers, clustering, suite health

### Changed

- `scripts/audit-report.js` — suite health scoreboard, area-impact ranking, critical-area boost
- `scripts/self-check.js` — expanded rules and allowlist support
- `scripts/validate-manifest.js` — core vs companion skill validation
- `scripts/verify-skills.js` — 26 core + 4 companion skills
- `plugin.yaml` — core surface only (companion skills removed from default manifest)
- README rewrite — autonomy framing, first-run in <60s, intent → skill table, feature grid
- `docs/README.md` — clean index (not duplicate of root README)
- `agents/gavel-orchestrator.md` — companion workflows separated from core routing
- `agents/gavel-refactor.md` — refactor-score step in apply-safe workflow
- Reframed `gavel-bug`, `gavel-gain`, `gavel-api`, `gavel-triage` for test-code quality scope
- All manifest versions bumped to 0.6.0

### Removed

- `.github/workflows/test.yml` — replaced by `gavel-verify.yml`
- Ponytail fork/upstream sync language from README

## [0.5.0] - 2026-06-25

### Added

- `scripts/parsers/cucumber.js` — Cucumber.js / Cucumber-JVM / Behave JSON parser
- `scripts/extract-tags.js` — multi-framework tag extraction (Playwright, pytest, JUnit, Cucumber)
- `--tag` and `--tag-framework` flags for `affected-tests.js` (tag-based discovery)
- `--json-envelope` flag for `analyze-ci.js` (schema-versioned JSON export)
- QA-failure-mode taxonomy: `seed`, `flake`, `app-error` classifications in `cluster-failures.js`
- Auto commit correlation per cluster (not just test-maintenance-drift) in `analyze-ci.js`
- Schema versioning (`ENVELOPE_SCHEMA_VERSION = 1.0.0`) in `ci-analysis-envelope.js`
- Tag discovery fixtures for Playwright, pytest, JUnit, and Cucumber real-world naming

### Changed

- `ci-analysis-envelope.js` uses role-neutral labels: "Lead Summary" / "Worker Handoff" (was "Classification" / "CI Summary")
- `classifyCluster()` expanded for `app-regression`, `seed`, `flake` classifications
- `errorPattern()` expanded for `seed`, `flake`, `app-error` detection
- All manifest versions bumped to 0.5.0

### Fixed

- Tag discovery (`extract-tags.js`, `affected-tests.js --tag`) now matches real-world test
  file naming, not just literal `.spec./.test.` — pytest (`test_*.py`, `*_test.py`), JUnit
  (`*Test.java`, `Test*.java`, `*Tests.java`, `*IT.java`), and bare Cucumber `*.feature` files
  were previously invisible to tag discovery
- `errorPattern()` no longer misclassifies Playwright/Cypress web-first assertion timeouts as
  `flake` — bare `retry` is not a flake signal since retrying is normal web-first assertion
  behavior; flake now requires explicit vocabulary (`flaky`, `intermittent`, `race condition`)
- Removed bare `@decorator` pytest tag pattern — pytest markers are always `@pytest.mark.*`,
  so the old pattern produced false-positive tags from unrelated decorators
- Removed product-specific example names from docs and skills in favor of generic placeholders
  (`MySuite`, `../my-automation-repo`, `PROJ-123`)
- Cucumber tag discovery now handles multi-tag lines like `@smoke @regression`
- JUnit tag discovery now handles hyphenated and dotted tags like `@Tag("e2e-smoke")`
  and `@Tag("ci.fast")`
- `affected-tests.js --tag-framework <framework>` now infers the matching recommended
  command when `--framework` is omitted
- JSON and markdown envelopes now report parsed green runs as `DONE` instead of `INCOMPLETE`

## [0.4.0] - 2026-06-18

### Added

- `audit-autofix.js` — dead POM and unused factory detection; `--audit-format` output
- `scripts/audit-report.js` — ranked gavel-audit lines from autofix (+ optional self-check)
- `templates/apply-safe-workflow.md` — orchestrator → refactor handoff for `safe` findings
- `templates/github-actions/gavel-verify.yml` — adapter CI template
- Audit-autofix fixtures for POMs, factories, and specs

### Changed

- `gavel-audit` documents `audit-report.js` and `unused-factory` / safe `dead-pom` tags
- `gavel-orchestrator` and `gavel-refactor` document apply-safe routing
- `audit-report.js` now supports `--audit-format` (consistent with `audit-autofix.js`)
- `audit-autofix.js` uses O(n) content cache for reference counting (was O(n²))
- Verify script tests `--json` output for both `audit-autofix.js` and `audit-report.js`
- Multi-class POM fixture (`MixedPage.ts`) verifies partial-usage detection

## [0.3.0] - 2026-06-11

### Added

- Autofix eligibility in `gavel-review` (`safe` / `review` / `report-only`) for diff-scoped audits
- `gavel-robot` framework profile skill
- `scripts/audit-autofix.js` — safe-only dead locator deletion (dry-run default, `--apply` optional)
- `scripts/verify-audit-autofix.js` and `fixtures/audit-autofix/`
- Playwright HTML report one-shot: `analyze-ci.js playwright-report/ --envelope`

### Changed

- `gavel-detect` activates `gavel-robot` for Robot Framework projects
- `gavel-audit` documents `audit-autofix.js` for safe dead-locator removal

## [0.2.0] - 2026-06-04

### Added

- Autofix eligibility in `gavel-audit` (`safe`, `review`, `report-only`)
- `scripts/validate-area-map.js` and `verify-area-map.js`
- `scripts/ci-analysis-envelope.js` and `analyze-ci.js --envelope` for `gavel-analyze`
- pytest-playwright and Robot Framework detection in `gavel-detect`
- Python freshness for `pytest-playwright` and `robotframework`
- Profile fixtures for pytest-playwright and Robot Framework

### Changed

- `gavel-analyze` documents envelope output from `analyze-ci.js`
- `templates/result-envelope.md` includes CI analysis mapping

## [0.1.0] - 2026-05-28

### Added

- Core gavel skill, QA ladder, and Test Constitution
- Specialist agents: orchestrator, generator, healer, API specialist, impact, fail-audit, refactor
- Framework profiles: Playwright, Selenium, Cypress, WebdriverIO, Cucumber
- Workflow skills: plan, e2e, api, run, analyze, review, audit, heal, flake, init, and more
- Standard result envelope (`templates/result-envelope.md`)
- Manifest validation (`scripts/validate-manifest.js`)
- Constitution self-check (`scripts/self-check.js`, `gavel-self-check` skill)
- Affected test discovery with transitive import tracing (`scripts/affected-tests.js`)
- CI report parsers: JUnit, Allure, Playwright JSON/HTML, Cypress JSON
- Failure clustering and `analyze-ci.js` with optional commit correlation
- Profile freshness checker (`scripts/check-profile-freshness.js`)
- Golden fixtures for self-check, parsers, and profiles
- Release checklist (`RELEASE_CHECKLIST.md`)
- Product roadmap (`GAVEL_ROADMAP.md`)
- 20+ IDE adapter rule copies and hook system
- Playwright HTML report parser, area-map, Python behave freshness, changelog, docs

[Unreleased]: https://github.com/dsolisp/gavel/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/dsolisp/gavel/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/dsolisp/gavel/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/dsolisp/gavel/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/dsolisp/gavel/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/dsolisp/gavel/releases/tag/v0.1.0
