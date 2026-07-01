# Gavel Roadmap

**Status date:** 2026-07-01
**Scope:** General-purpose QA automation quality tool. Roadmap items must be framework-adaptive and product-agnostic. Lessons from real sessions are generalized into reusable workflow features before being added here.

---

## Product Direction

Gavel should behave like a disciplined QA automation lead:

1. Classify failures before fixing them.
2. Reuse existing suite architecture before adding code.
3. Preserve strict locator/action/spec layering.
4. Prefer framework-native waits and assertions.
5. Require compile and affected-test evidence before calling work done.
6. Keep framework profiles thin: syntax and current release capabilities only.
7. Keep workflow logic generic and reusable across Playwright, Selenium, Cypress, WebdriverIO, Cucumber, and future profiles.

Expected workflow:

```text
request / CI failure
  -> detect stack and CI context
  -> analyze failure cluster
  -> map likely product or test impact
  -> route to specialist
  -> implement in layer order
  -> compile + run affected tests
  -> return evidence and final status
```

---

## Implemented Lesson Status

| Lesson | Status | Implemented In | Remaining Roadmap Work |
|---|---|---|---|
| Assertion layering: actions never assert; specs own `expect` / assertions | Implemented | `skills/gavel`, `skills/gavel-playwright`, `skills/gavel-audit`, `skills/gavel-review`, `agents/gavel-refactor`, `agents/gavel-orchestrator` | Expand `gavel-self-check` rules; add per-framework fixtures |
| Enforced post-change verification | Implemented | `agents/gavel-orchestrator`, `agents/gavel-refactor`, `agents/gavel-healer`, `skills/gavel-run` | Wire result envelope into remaining skills (`gavel-analyze`, `gavel-heal`) |
| While-loop polling trap | Implemented | `skills/gavel`, `skills/gavel-playwright`, `agents/gavel-refactor` | Add equivalent anti-pattern examples to non-Playwright profiles where useful |
| Pre-change architecture analysis | Implemented | `agents/gavel-orchestrator`, `agents/gavel-refactor`, `agents/gavel-healer` | Add checklist reuse across generator and API specialist agents |
| Selector leaks in action/spec layers | Implemented | `skills/gavel`, `skills/gavel-audit`, `skills/gavel-review`, `agents/gavel-refactor`, `scripts/self-check.js` | Improve scanner precision; reduce false positives on allowed patterns |
| Affected test discovery | Implemented | `skills/gavel-run`, `agents/gavel-orchestrator`, `agents/gavel-refactor`, `agents/gavel-healer` | Improve discovery beyond string grep using import graph / runner metadata |
| Orchestrator handoff: plan-only is incomplete | Implemented | `agents/gavel-orchestrator`, `templates/result-envelope.md` | Add machine-readable JSON envelope export for orchestrator consumers |
| Test-maintenance drift workflow | Implemented | `skills/gavel-analyze`, `skills/gavel-impact`, `agents/gavel-orchestrator`, `agents/gavel-healer`, `skills/gavel-e2e` | Wire report parsers into `gavel-analyze` workflow |
| Thin framework profiles | Implemented | `skills/gavel-playwright`, `skills/gavel-selenium`, `skills/gavel-cucumber`, `skills/gavel-webdriverio`, `skills/gavel-cypress`, `skills/gavel-detect` | Add version freshness automation and profile self-tests |
| Iterative improvement of Gavel source itself | Partially implemented | `scripts/validate-manifest.js`, `npm run verify` | Add self-test suite for Gavel instructions and release checklist |
| Manifest completeness | Partially implemented | `plugin.yaml`, `scripts/validate-manifest.js` | Adapter skill-copy sync checks (`.qoder`, workspace mirrors) |
| Constitution self-check | Partially implemented | `skills/gavel-self-check`, `scripts/self-check.js` | Golden fixtures per framework; CI integration examples |
| CI report parsing | Partially implemented | `scripts/parsers/allure.js`, `scripts/parsers/junit.js` | Playwright/Cypress/Cucumber parsers; cluster integration in `gavel-analyze` |

---

## Roadmap Phases

### Phase 1 - Reliability Contract

Goal: make it impossible for Gavel to claim success without evidence.

- Define a standard result envelope:
  - `DONE`
  - `INCOMPLETE`
  - `BLOCKED`
  - `APP BUG`
  - `ENV ISSUE`
  - `FLAKY`
- Require every specialist agent to return:
  - root cause classification
  - files changed
  - compile/lint result
  - exact test command
  - pass/fail count
  - remaining risk
- Add an orchestrator rule: no test output means `INCOMPLETE`.
- Add a reusable completion template shared by orchestrator, healer, refactor, generator, and API specialist.

**Progress (2026-07-01):** `templates/result-envelope.md` added. All seven agents reference the envelope. Skills still pending.

Definition of done:

- All specialist agents use the same result envelope. **Done**
- Orchestrator refuses to summarize plan-only work as complete. **Done**
- Docs include examples of complete vs incomplete outputs. **Done** (`templates/result-envelope.md`)
- All public skills reference the envelope where they declare completion. **Remaining**

### Phase 2 - Automated Gavel Self-Checks

Goal: enforce the Constitution on Gavel-generated or Gavel-edited test code.

- Add static checks for:
  - assertion APIs in actions/pages/locators
  - raw selectors outside locator classes
  - manual sleeps / pauses
  - direct page object construction in specs
  - missing step grouping in specs
  - unverified final summaries
- Add a `gavel-self-check` script or skill that runs against a target automation repo.
- Add fixture examples for each framework profile.

**Progress (2026-07-01):** `scripts/self-check.js`, `fixtures/self-check/violations/`, and
`verify-self-check-fixtures.js` in `npm run verify`.

Definition of done:

- A single command or skill can report Constitution violations. **Done**
- The report uses `gavel-audit` tags. **Done**
- At least one sample project or fixture validates each rule. **Done**

### Phase 3 - Affected Test Discovery 2.0

Goal: run the smallest meaningful test set after a change.

- Go beyond grep:
  - import graph tracing
  - fixture usage tracing
  - page/action/locator ownership mapping
  - test ID/tag clustering
- Map changed files to affected specs per framework.
- Return recommended commands for Playwright, Selenium, Cypress, WebdriverIO, and Cucumber.
- Use runner metadata when available.

**Progress (2026-07-01):** `scripts/affected-tests.js` with `--git` and `--changed` modes.
Documented in `skills/gavel-run`. Tag-based clustering not started.

Definition of done:

- Given changed locator/action/helper files, Gavel suggests targeted test commands. **Done**
- Commands are framework-specific through active profile. **Done**
- Full-suite escalation is recommended only when shared layers changed. **Done**

### Phase 4 - CI Intelligence

Goal: turn failed scheduled runs into actionable QA decisions.

- Parse common report formats:
  - Allure JSON
  - JUnit XML
  - Playwright HTML/report JSON
  - Cypress results
  - Cucumber JSON
- Cluster failures by:
  - area
  - route / endpoint
  - error pattern
  - test ID / tag
- Correlate clusters with recent commits using `gavel-impact`.
- Classify:
  - test-maintenance drift
  - app regression
  - env issue
  - seed/data issue
  - flake

**Progress (2026-07-01):** Parsers, `cluster-failures.js`, fixtures, and skill wiring in
`gavel-analyze` / `gavel-ci`. Playwright/Cypress native JSON parsers not started.

Definition of done:

- Gavel can summarize a failed CI run with pass rate, clusters, likely root cause, suspected commits, and next action. **Partial** — parse + cluster done; impact correlation manual
- Output is short enough for CTO/lead sharing and detailed enough for implementation handoff. **Partial**

### Phase 5 - Framework Profile Freshness

Goal: keep framework profiles useful without polluting generic workflow docs.

- Keep each profile thin:
  - current release
  - locator syntax
  - assertion/wait syntax
  - DI/fixture pattern
  - run commands
  - release caveats
- Add version freshness checks:
  - compare project version to profile current release
  - flag major-version migration risks
  - warn when profile is stale
- Update `gavel-detect` to include framework version and freshness status.

Definition of done:

- Profiles are no longer long-form testing guides.
- Generic UI patterns live in `gavel-e2e`.
- Version freshness is reported during detection.

### Phase 6 - Manifest and Packaging Completeness

Goal: make shipped Gavel match source capabilities.

- Update `plugin.yaml` to include all public skills that are expected to be available:
  - `gavel-impact`
  - framework profiles if they are intended as public skills
  - any new self-check skill
- Decide whether agents are exposed directly by package metadata or adapter-specific directories only.
- Add a manifest validation script:
  - every `gavel/skills/*/SKILL.md` either appears in `plugin.yaml` or is marked internal
  - every public agent is discoverable in supported adapters
  - `.cursor`, `.qoder`, and source copies are in sync

**Progress (2026-07-01):** `plugin.yaml` updated with all 29 public skills. `scripts/validate-manifest.js` added to `npm run verify`.

Definition of done:

- No hidden public skill exists only in source. **Done**
- Sync drift between source and adapters is detectable. **Partial** (rules sync via `check-rule-copies.js`; skill-copy sync remaining)
- Release checklist includes manifest validation. **Done** — `RELEASE_CHECKLIST.md`

### Phase 7 - Audit and Review Maturity

Goal: make `gavel-audit` and `gavel-review` high-signal, not noisy.

- Add severity:
  - `blocker`
  - `fix`
  - `cleanup`
  - `delete`
- Add autofix eligibility:
  - safe to edit
  - needs human review
  - report only
- Add suite health metrics:
  - dead locator count
  - selector leaks
  - manual waits
  - hardcoded data
  - duplicate factories
  - skipped / expected-fail markers
- Add before/after score for refactors.

Definition of done:

- Audit reports are ranked by impact.
- Findings map directly to remediation agents or skills.
- Safe-removal candidates are separated from behavior-risk changes.

### Phase 8 - Productization and Examples

Goal: make Gavel usable outside one workspace.

- Add framework sample projects or golden fixtures.
- Add `QUICKSTART` flows for:
  - audit an existing suite
  - heal a failing test
  - analyze CI
  - write new UI test
  - write new API test
- Add changelog and versioned docs.
- Add release checklist:
  - profile release versions checked
  - manifest validated
  - adapter sync verified
  - self-check suite green

Definition of done:

- A new user can install Gavel, detect their stack, audit a suite, heal one failure, and understand the result without project-specific knowledge.

---

## Priority Backlog

| Priority | Item | Why | Status |
|---|---|---|---|
| P0 | Standard result envelope | Prevents ambiguous "done" responses | **Shipped** — template + agent references |
| P0 | Manifest completeness validation | Ensures shipped package exposes implemented features | **Shipped** — `validate-manifest.js` in verify |
| P0 | Gavel self-check for Constitution violations | Turns lessons into enforceable behavior | **Shipped** — scanner + golden fixtures |
| P1 | Affected test discovery 2.0 | Reduces verification cost while preserving confidence | **Shipped** — `scripts/affected-tests.js` |
| P1 | CI report parser + failure clustering | Makes scheduled run failures actionable | **Shipped** — parsers + `cluster-failures.js` + skill wiring |
| P1 | Version freshness check in `gavel-detect` | Keeps profiles current across frameworks | **Shipped** — `check-profile-freshness.js` |
| P2 | Audit severity and autofix eligibility | Makes audit output more useful | **Shipped** — severity + autofix in `gavel-audit` |
| P2 | Golden fixtures per framework | Prevents profile regressions | **Shipped** — includes Python behave fixtures |
| P3 | Full public docs and changelog | Productization polish | **Shipped** — `CHANGELOG.md`, `docs/README.md` |

---

## Immediate Next Tasks

1. ~~Update `plugin.yaml` to reflect current public skills and profiles.~~ **Done**
2. ~~Add a manifest/sync validation script.~~ **Done** — `scripts/validate-manifest.js`
3. ~~Add a `gavel-self-check` skill or script for Constitution violations.~~ **Done** — v1
4. ~~Standardize result envelope across agents.~~ **Done** — extend to skills next
5. ~~Add report parser skeletons for Allure and JUnit.~~ **Done** — wire into `gavel-analyze`

### Next Up

1. ~~Wire `scripts/parsers/*` into `skills/gavel-analyze` and `skills/gavel-ci`.~~ **Done**
2. ~~Add golden fixtures that exercise each `gavel-self-check` rule.~~ **Done**
3. ~~Extend result envelope references to `gavel-heal`, `gavel-run`, and `gavel-analyze`.~~ **Done**
4. ~~Build affected-test discovery 2.0 (import graph) in `gavel-run`.~~ **Done**
5. ~~Add release checklist doc with manifest + self-check + verify gates.~~ **Done**

### Next Up

1. ~~Add Playwright and Cypress native report parsers to `scripts/parsers/`.~~ **Done**
2. ~~Wire `gavel-impact` commit correlation into `gavel-analyze` cluster output.~~ **Done** — `scripts/analyze-ci.js`
3. ~~Add version freshness check to `gavel-detect`.~~ **Done** — `scripts/check-profile-freshness.js`
4. ~~Add audit severity (`blocker` / `fix` / `cleanup` / `delete`) to `gavel-audit`.~~ **Done**
5. ~~Add per-framework golden fixtures beyond self-check (profile regression tests).~~ **Done** — `fixtures/profiles/`

### Next Up

1. ~~Add Playwright HTML report parser (not just JSON).~~ **Done** — `scripts/parsers/playwright-html.js`
2. ~~Improve `analyze-ci` area → application path mapping (configurable map file).~~ **Done** — `scripts/area-map.js`, `--area-map`
3. ~~Extend audit severity to `gavel-review` for diff-scoped audits.~~ **Done**
4. ~~Add Behave/pytest profile freshness (Python `requirements.txt` / `pyproject.toml`).~~ **Done**
5. ~~Publish changelog and versioned public docs.~~ **Done** — `CHANGELOG.md`, `docs/README.md`

### Next Up

1. ~~Add autofix eligibility to `gavel-audit` (`safe` / `review` / `report-only`).~~ **Done**
2. ~~Add pytest-playwright and robot-framework detection in `gavel-detect`.~~ **Done**
3. ~~Add `gavel-area-map.json` schema validation script.~~ **Done** — `validate-area-map.js`
4. ~~Wire `analyze-ci` output into a single `gavel-analyze` result envelope template block.~~ **Done** — `--envelope`
5. ~~Tag `v0.2.0` after autofix eligibility and schema validation land.~~ **Done**

### Next Up

1. ~~Extend autofix eligibility to `gavel-review` with diff-scoped safe fixes.~~ **Done**
2. ~~Add Robot Framework profile (`gavel-robot`) or document `gavel-run` patterns.~~ **Done**
3. ~~Add `analyze-ci` HTML report one-shot: `playwright-report/` → `--envelope` without manual parser step.~~ **Done**
4. ~~Add audit autofix runner script (safe-only dead locator deletion behind `--dry-run`).~~ **Done** — `scripts/audit-autofix.js`
5. ~~Tag `v0.3.0` after robot profile or autofix runner ships.~~ **Done**

### Next Up

1. Extend `audit-autofix.js` to dead POM classes and unused factory exports.
2. Wire `audit-autofix` findings into `gavel-audit` ranked output format.
3. Add `gavel-review --apply-safe` agent workflow doc (orchestrator + refactor handoff).
4. Publish adapter sync CI job template for GitHub Actions.
5. Tag `v0.4.0` after audit-autofix scope expansion.

---

## Historical Lessons Folded Into This Roadmap

The former lessons-learned document identified these concrete gaps:

- missing assertion layering rule
- no enforced test execution after changes
- while-loop polling trap
- missing pre-refactor architecture analysis
- selector leaks in action classes
- lack of self-checks for Gavel source behavior

The first five are implemented in source rules and workflows. Self-checks,
manifest validation, structured completion, stronger affected-test discovery,
and CI intelligence are now partially implemented and tracked by phase above.
