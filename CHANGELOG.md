# Changelog

All notable changes to the gavel package are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Playwright HTML report directory parser (`scripts/parsers/playwright-html.js`)
- Configurable area → application path mapping (`scripts/area-map.js`, `--area-map` on `analyze-ci.js`)
- Audit severity prefixes in `gavel-review` (`blocker`, `fix`, `cleanup`, `delete`)
- Python profile freshness for `requirements.txt` / `pyproject.toml` (behave, pytest, selenium)
- Public docs index at `docs/README.md`

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
- CI report parsers: JUnit, Allure, Playwright JSON, Cypress JSON
- Failure clustering and `analyze-ci.js` with optional commit correlation
- Profile freshness checker (`scripts/check-profile-freshness.js`)
- Golden fixtures for self-check, parsers, and profiles
- Release checklist (`RELEASE_CHECKLIST.md`)
- Product roadmap (`GAVEL_ROADMAP.md`)
- 20+ IDE adapter rule copies and hook system

[Unreleased]: https://github.com/dsolisp/gavel/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/dsolisp/gavel/releases/tag/v0.1.0
