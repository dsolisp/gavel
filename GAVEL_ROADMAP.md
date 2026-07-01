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
| Assertion layering: actions never assert; specs own `expect` / assertions | Implemented | `skills/gavel`, `skills/gavel-playwright`, `skills/gavel-audit`, `skills/gavel-review`, `agents/gavel-refactor`, `agents/gavel-orchestrator` | Add static self-checks that fail if assertion APIs appear outside allowed layers |
| Enforced post-change verification | Implemented | `agents/gavel-orchestrator`, `agents/gavel-refactor`, `agents/gavel-healer`, `skills/gavel-run` | Add structured machine-readable completion status and evidence schema |
| While-loop polling trap | Implemented | `skills/gavel`, `skills/gavel-playwright`, `agents/gavel-refactor` | Add equivalent anti-pattern examples to non-Playwright profiles where useful |
| Pre-change architecture analysis | Implemented | `agents/gavel-orchestrator`, `agents/gavel-refactor`, `agents/gavel-healer` | Add checklist reuse across generator and API specialist agents |
| Selector leaks in action/spec layers | Implemented | `skills/gavel`, `skills/gavel-audit`, `skills/gavel-review`, `agents/gavel-refactor` | Add automated scanner for raw selectors outside locator classes |
| Affected test discovery | Implemented | `skills/gavel-run`, `agents/gavel-orchestrator`, `agents/gavel-refactor`, `agents/gavel-healer` | Improve discovery beyond string grep using import graph / runner metadata |
| Orchestrator handoff: plan-only is incomplete | Implemented | `agents/gavel-orchestrator` | Add a standard `DONE / INCOMPLETE / BLOCKED / APP BUG / ENV ISSUE` result envelope |
| Test-maintenance drift workflow | Implemented | `skills/gavel-analyze`, `skills/gavel-impact`, `agents/gavel-orchestrator`, `agents/gavel-healer`, `skills/gavel-e2e` | Add report parsers and commit correlation helpers |
| Thin framework profiles | Implemented | `skills/gavel-playwright`, `skills/gavel-selenium`, `skills/gavel-cypress`, `skills/gavel-webdriverio`, `skills/gavel-cucumber`, `skills/gavel-detect` | Add version freshness automation and profile self-tests |
| Iterative improvement of Gavel source itself | Partially implemented | Source rules updated from lessons | Add self-test suite for Gavel instructions, manifest completeness checks, and release checklist |

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

Definition of done:

- All specialist agents use the same result envelope.
- Orchestrator refuses to summarize plan-only work as complete.
- Docs include examples of complete vs incomplete outputs.

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

Definition of done:

- A single command or skill can report Constitution violations.
- The report uses `gavel-audit` tags.
- At least one sample project or fixture validates each rule.

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

Definition of done:

- Given changed locator/action/helper files, Gavel suggests targeted test commands.
- Commands are framework-specific through active profile.
- Full-suite escalation is recommended only when shared layers changed.

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

Definition of done:

- Gavel can summarize a failed CI run with pass rate, clusters, likely root cause, suspected commits, and next action.
- Output is short enough for CTO/lead sharing and detailed enough for implementation handoff.

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

Definition of done:

- No hidden public skill exists only in source.
- Sync drift between source and adapters is detectable.
- Release checklist includes manifest validation.

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

| Priority | Item | Why |
|---|---|---|
| P0 | Standard result envelope | Prevents ambiguous "done" responses |
| P0 | Manifest completeness validation | Ensures shipped package exposes implemented features |
| P0 | Gavel self-check for Constitution violations | Turns lessons into enforceable behavior |
| P1 | Affected test discovery 2.0 | Reduces verification cost while preserving confidence |
| P1 | CI report parser + failure clustering | Makes scheduled run failures actionable |
| P1 | Version freshness check in `gavel-detect` | Keeps profiles current across frameworks |
| P2 | Audit severity and autofix eligibility | Makes audit output more useful |
| P2 | Golden fixtures per framework | Prevents profile regressions |
| P3 | Full public docs and changelog | Productization polish |

---

## Immediate Next Tasks

1. Update `plugin.yaml` to reflect current public skills and profiles.
2. Add a manifest/sync validation script.
3. Add a `gavel-self-check` skill or script for Constitution violations.
4. Standardize result envelope across agents.
5. Add report parser skeletons for Allure and JUnit.

---

## Historical Lessons Folded Into This Roadmap

The former lessons-learned document identified these concrete gaps:

- missing assertion layering rule
- no enforced test execution after changes
- while-loop polling trap
- missing pre-refactor architecture analysis
- selector leaks in action classes
- lack of self-checks for Gavel source behavior

The first five are implemented in source rules and workflows. The remaining
work is now tracked as product roadmap items: self-checks, manifest validation,
structured completion, stronger affected-test discovery, and CI intelligence.
