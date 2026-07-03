# Changelog

All notable changes to the gavel package are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0] - 2026-07-01

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

## [0.3.0] - 2026-07-01

### Added

- Autofix eligibility in `gavel-review` (`safe` / `review` / `report-only`) for diff-scoped audits
- `gavel-robot` framework profile skill
- `scripts/audit-autofix.js` — safe-only dead locator deletion (dry-run default, `--apply` optional)
- `scripts/verify-audit-autofix.js` and `fixtures/audit-autofix/`
- Playwright HTML report one-shot: `analyze-ci.js playwright-report/ --envelope`

### Changed

- `gavel-detect` activates `gavel-robot` for Robot Framework projects
- `gavel-audit` documents `audit-autofix.js` for safe dead-locator removal

## [0.2.0] - 2026-07-01

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

## [0.1.0] - 2026-07-01

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

[Unreleased]: https://github.com/dsolisp/gavel/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/dsolisp/gavel/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/dsolisp/gavel/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/dsolisp/gavel/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/dsolisp/gavel/releases/tag/v0.1.0
