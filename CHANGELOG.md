# Changelog

All notable changes to the gavel package are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned — v0.10.0 Playwright.NET Language Surface

Prep only (no scanner behavior yet). Public design notes: [docs/contracts/playwright-dotnet-v0.10.0.md](docs/contracts/playwright-dotnet-v0.10.0.md).

- Next release theme: Playwright for .NET (`Microsoft.Playwright`); Remediation Loop and Assertion Integrity shift later
- Contract covers `.cs` discovery, detect/freshness, API→rule map, backward compatibility; zero new rule tags

## [0.9.0] - 2026-07-16

### Added

- **Test-vs-utility scope filter**: RULES `scope` field (`test-only` | `all-files`) and `excludePaths` config (default `scripts/**`, `fixtures/**`, `tools/**`, `utility_scripts/**`) so utility files no longer inflate self-check / audit health scores; audit summary reports `excludedFileCount`
- **Path-weighting for suite health**: `gavel.config.json` `paths` entries (`pattern`, `weight` 0–2, `label`) weight violation counts by path category; suite health / audit report raw vs weighted totals and `byLabel` grouping
- **`manual-wait` sub-classifier**: findings include `subCase` (`redundant` | `stale-read` | `intentional`); intentional waits downgrade to warning/fix; replaceable intentional waits (polling loops, post-API sleeps) further downgrade to info/report with `replaceable` and `suggestion` fields
- **`threading.Event` remediation pattern**: Python `time.sleep` inside a `while` loop is flagged with `pollingLoop: true` and `suggestion: threading.Event.wait()`
- **`threading.Event` signal-driven replacement**: agent/skill docs (`gavel-refactor`, `gavel-healer`, `gavel-heal`) encode the signal-driven `threading.Event` pattern (`.set()` by the readiness owner + single `.wait(timeout=N)` block) as the Python sleep replacement for replaceable intentional waits; an unset Event (sleep rename) is explicitly prohibited
- **Time-impact estimation**: parse wait durations into `durationMs`; audit `--json` reports `timeImpact` totals
- **Skip-marker prefix suppression**: recognized prefixes (`SEED-DATA`, `ENV-LIMIT`, …) plus configurable `skipPrefixes` suppress skip-marker findings
- **Ignore-no-reason context-aware**: bare `gavel-ignore` only flagged in test/locator/action files; docs, utilities, and fenced examples suppressed
- **IDE config directory exclusions**: `.claude`, `.qoder`, `.cursor`, `.vscode` added to `EXCLUDED_DIRS` across all scanner scripts — IDE tooling directories no longer scanned for test violations
- **No-op wait migration playbook** (`gavel-refactor`): structured 5-step playbook for bulk `manual-wait` remediation — classify (redundant / stale-read / intentional), no-op redundant waits, targeted `pollUntil` for stale-read, rename intentional, report time impact
- **Violation remediation reference table** (`gavel-refactor`): per-tag fix guidance for `selector-leak`, `brittle-assert`, `no-step`, `manual-wait`, `hardcoded-env`, `skip-marker`, `assert-drop`
- **Cross-step data-flow gate** (`gavel-refactor`): verification gate checks variable flow across step closures after bulk edits (>20); hoists shared state to test body
- **Selector-leak placement clarification** (`gavel-refactor`): selector-leak is about architectural placement, not locator quality; specs and action files both checked

### Changed

- **Default scan coverage now excludes utility globs** (`scripts/**`, `fixtures/**`, `tools/**`, `utility_scripts/**`) when a repo has no `gavel.config.json` or its config omits `excludePaths`. Pre-v0.9.0 these paths were scanned. This is a default-behavior change for repos with violations under those trees. To restore pre-v0.9.0 scanning scope, set `"excludePaths": []` in `gavel.config.json`. The self-check console now prints a one-line notice when the default exclusion applies.

### Migration

- Repos upgrading from v0.8.x without `gavel.config.json`: if you relied on findings under `scripts/`, `fixtures/`, `tools/`, or `utility_scripts/`, add `"excludePaths": []` to your `gavel.config.json` (or scope the exclusion list to your needs).

## [0.8.1] - 2026-07-13

### Changed

- Removed `GAVEL_ROADMAP.md` and `v0.8.0-prompts.txt` from published package (internal dev documents)
- Removed graduation evidence docs (`docs/graduation*`) from distribution
- Removed all public references to private planning documents from `docs/README.md`, `docs/ENTERPRISE.md`, `docs/CONTRIBUTING.md`
- Added `.gitignore` entries for internal dev artifacts
- All seven version manifests bumped to 0.8.1

## [0.8.0] - 2026-07-13

### Added

- **5 resilience rule tags:** `brittle-assert`, `hardcoded-env`, `complex-locator`, `no-teardown`, `assert-drop`
- Corpus label schema (`schemas/corpus-labels.schema.json`) + precision report schema (`schemas/corpus-precision-report.schema.json`)
- `scripts/verify-corpus-precision.js` — measures heuristic precision from `fixtures/corpus/<tag>/labels.json`
- `scripts/verify-diff-corpus-precision.js` — measures diff-rule precision from `fixtures/self-check/diff/<tag>/` pairs
- `fixtures/corpus/brittle-assert/` — 11 violating + 11 clean labeled samples (`ts` / `py` / `java`)
- `fixtures/corpus/hardcoded-env/` — 12 violating + 10 clean labeled samples (`ts` / `py` / `java`)
- `docs/rules/brittle-assert.md` — heuristic contract (inputs, FPs, SARIF, suppression) before scanner
- `docs/rules/assert-drop.md` — diff harness contract: assertion deletion / early-return / strength downgrade
- Baseline ratchet schema (`schemas/gavel-baseline.schema.json`) + verify samples (`fixtures/baseline/`)
- `scripts/verify-baseline-schema.js` — baseline schema validation in verify gate

### Changed

- `brittle-assert` graduated: severity `info` → `warning`, envelopeSeverity `report` → `fix` (corpus precision 100%, 11 TP, 0 FP, 0 FN)
- `hardcoded-env` graduated: severity `warning` → `error`, envelopeSeverity `fix` → `blocker` (corpus precision 100%, 12 TP, 0 FP, 0 FN; real-repo trial 70 findings, 0 FP)
- `assert-drop` strength-downgrade graduated: severity `info` → `warning`, envelopeSeverity `report` → `fix` (diff-corpus precision 100%, 3 TP, 0 FP, 0 FN)
- `npm run verify` now includes corpus precision, diff-corpus precision, and baseline schema validation runners
- All seven version manifests bumped to 0.8.0

## [0.7.1] - 2026-07-13

### Added

- `docs/ENTERPRISE.md` — enterprise trust page (CI gate, SARIF, Bailiff boundary, recommendation criteria)
- `docs/CLI_MATRIX.md` — CLI vs agent-only completeness matrix
- `docs/BAILIFF.md` — Bailiff planning extracted from the product roadmap
- `docs/CONTRIBUTING.md` — model-tier protocol and contributor budgets
- `templates/github-actions/gavel-audit-sarif.yml` — SARIF → GitHub Code Scanning recipe for consumer repos

### Changed

- All seven version manifests aligned to `0.7.1`
- `GAVEL_ROADMAP.md` rewritten around Trust → Resilience → Adoption → Remediation → Freeze; enterprise criteria; v0.8–v1.0 enterprise DoD (baseline schema + Action/SARIF, policy packs, monorepo, ROI export, integration pack)
- `docs/README.md` indexes enterprise and Bailiff docs
- `scripts/verify-boundary.js` — allowlist `docs/BAILIFF.md` as planning-only (still blocks Bailiff code)
- `v0.8.0-prompts.txt` — Item #9 for enterprise CI DoD (SARIF recipe + Action template)
- `RELEASE_CHECKLIST.md` — version/enterprise trust gates
- `.gitattributes` — force LF for scripts/docs so Linux shebang CI does not break
- Unit test for `gavel-*` alias invokes via `node` (still asserts basename command routing)

### Fixed

- Scripts committed as CRLF broke the Linux alias/shebang path in `npm run verify` (unit test suite 10/11)

## [0.7.0] - 2026-07-13

### Added

- Unified CLI (`npx gavel <command>`) — `audit`, `review`, `self-check`, `analyze`, `affected-tests`, `detect`, `explain`
- RULES metadata registry consumed by SARIF and `gavel explain`
- SARIF 2.1.0 export (`--format sarif`)
- Envelope schema `1.1.0` with `confidence`; schema validation for machine output
- Auto-generated area map tooling
- Tag-scoped `gavel-ignore: <tag>` suppression — comma-separated lists; bare `gavel-ignore` stays wildcard for back-compat
- `ignore-no-reason` self-check rule
- Boundary guard in verify (`verify-boundary.js`)
- Sample projects under `fixtures/sample-repos/`
- JSON Schema for `gavel.config.json`
- `docs/ARCHITECTURE.md`
- Golden fixtures for expanded scanner patterns: `WdioShorthandPage.ts`, `mocha-large-spec.cy.ts`, `test_unreasoned_skip.py`, `wdio-pause.spec.ts`, `bad_python_actions.py`, `test_missing_ticket_xfail.py`; matching clean fixtures

### Changed

- `scripts/self-check.js` — suppression at finding-filter time; `gavel-allow` deprecated alias for `gavel-ignore`
- `scripts/self-check.js` — Cypress/Python file globs; wdio/Cypress `$`/`$$` and `page.$` in `selector-leak`; `it()` in `no-step`; `browser.pause` in `manual-wait`; pytest skip/xfail and Python `assert` patterns
- Sample repos updated for new rule firings
- All manifest versions bumped to 0.7.0

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
- Cypress flake classification no longer treats bare `retry` as flake evidence
- Product-neutral placeholders in docs and fixtures

## [0.4.0] - 2026-06-18

### Added

- Dead POM + unused factory detection in audit autofix
- `scripts/audit-report.js` ranked audit output
- Orchestrator → refactor apply-safe handoff (`templates/apply-safe-workflow.md`)
- Adapter CI template (`templates/github-actions/gavel-verify.yml`)
- Audit-autofix fixtures and O(n) content cache

## [0.3.0] - 2026-06-11

### Added

- `scripts/audit-autofix.js` (dead locators, dry-run default)
- `gavel-robot` framework profile
- Autofix eligibility in `gavel-review`
- Playwright HTML report one-shot (`playwright-report/` → `--envelope`)

## [0.2.0] - 2026-06-04

### Added

- Playwright HTML parser
- Area-map + commit correlation
- Audit/review severity
- Python profile freshness (Behave, pytest, pytest-playwright, Robot)
- `analyze-ci --envelope`
- Autofix eligibility in `gavel-audit`
- `CHANGELOG.md`, `docs/README.md`

## [0.1.0] - 2026-05-28

### Added

- Test Constitution, QA ladder, agents, framework profiles
- Result envelope, manifest validation, self-check scanner
- CI parsers (JUnit, Allure, Playwright JSON, Cypress)
- Failure clustering, affected-test discovery v2 (import graph)
- Golden fixtures, release checklist
- Profile freshness checker (`scripts/check-profile-freshness.js`)
- Golden fixtures for self-check, parsers, and profiles
- Release checklist (`RELEASE_CHECKLIST.md`)
- Product roadmap (`GAVEL_ROADMAP.md`)
- 20+ IDE adapter rule copies and hook system
- Playwright HTML report parser, area-map, Python behave freshness, changelog, docs

[Unreleased]: https://github.com/dsolisp/gavel/compare/v0.8.1...HEAD
[0.8.1]: https://github.com/dsolisp/gavel/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/dsolisp/gavel/compare/v0.7.1...v0.8.0
[0.7.1]: https://github.com/dsolisp/gavel/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/dsolisp/gavel/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/dsolisp/gavel/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/dsolisp/gavel/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/dsolisp/gavel/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/dsolisp/gavel/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/dsolisp/gavel/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/dsolisp/gavel/releases/tag/v0.1.0
