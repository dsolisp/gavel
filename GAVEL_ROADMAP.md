# Gavel Roadmap

**Status date:** 2026-07-01  
**Current release:** `v0.3.0`  
**Scope:** Framework-adaptive QA quality tool. Roadmap items are product-agnostic and reusable across Playwright, Selenium, Cypress, WebdriverIO, Cucumber, Robot, and pytest-playwright.

---

## Product Direction

Gavel behaves like a disciplined QA automation lead:

1. Classify failures before fixing them.
2. Reuse existing suite architecture before adding code.
3. Preserve strict locator → action → spec layering.
4. Prefer framework-native waits and assertions.
5. Require compile + affected-test evidence before calling work done.
6. Keep framework profiles thin; keep workflow logic generic.

```text
request / CI failure
  → detect stack and CI context
  → analyze failure cluster
  → map product or test impact
  → route to specialist
  → implement in layer order
  → compile + run affected tests
  → return evidence and final status
```

---

## Shipped Releases

| Version | Theme | Highlights |
|---------|--------|------------|
| **v0.1.0** | Foundation | Test Constitution, QA ladder, 7 agents, framework profiles, result envelope, manifest validation, self-check scanner, CI parsers (JUnit, Allure, Playwright JSON, Cypress), failure clustering, affected-test discovery v2 (import graph), golden fixtures, release checklist |
| **v0.2.0** | CI intelligence | Playwright HTML parser, area-map + commit correlation, audit/review severity, Python profile freshness (Behave, pytest, pytest-playwright, Robot), `analyze-ci --envelope`, autofix eligibility in `gavel-audit`, `CHANGELOG.md`, `docs/README.md` |
| **v0.3.0** | Safe autofix | `audit-autofix.js` (dead locators, dry-run default), `gavel-robot` profile, autofix eligibility in `gavel-review`, HTML report one-shot (`playwright-report/` → `--envelope`) |

**Verify gate:** `npm run verify` — manifest, self-check, parsers, profiles, area-map, audit-autofix fixtures.

---

## Upcoming Releases

### v0.4.0 — Autofix & audit workflow

**Goal:** Close the loop from audit finding → safe mechanical fix → ranked report.

| # | Item | Deliverable |
|---|------|-------------|
| 1 | Dead POM detection | `audit-autofix.js` flags page objects with zero spec/action refs |
| 2 | Unused factory detection | `audit-autofix.js` flags factory exports never imported |
| 3 | Audit integration | `gavel-audit` ranked output uses `audit-autofix` findings (`safe dead-locator`, `safe dead-pom`, etc.) |
| 4 | Safe-apply workflow | Orchestrator + refactor handoff doc for `gavel-review --apply-safe` |
| 5 | Adapter CI template | GitHub Actions workflow for `check-rule-copies.js --check-all` + `npm run verify` |

**Definition of done:** `audit-autofix` covers locators, POMs, and factories; audit output ranks autofix candidates; docs describe safe-apply handoff; CI template ships in repo.

---

### v0.5.0 — CI intelligence & discovery

**Goal:** Full CI-to-action pipeline without manual correlation steps.

| # | Item | Deliverable |
|---|------|-------------|
| 1 | Tag-based discovery | `affected-tests.js` clusters by test ID / `@tag` / runner metadata |
| 2 | Automated impact correlation | `analyze-ci` wires `gavel-impact` commit lookup per cluster (not manual) |
| 3 | Cucumber JSON parser | `scripts/parsers/cucumber.js` + fixture + verify gate |
| 4 | CI classification | Cluster output tags: test-maintenance drift, app regression, env, seed, flake |
| 5 | Dual-format CI summary | `analyze-ci --envelope` produces CTO one-liner + implementer handoff block |
| 6 | JSON envelope export | Machine-readable result envelope for orchestrator consumers (`--json-envelope`) |

**Definition of done:** Failed CI run → parse → cluster → suspect commits → classified verdict → envelope, no manual steps.

---

### v0.6.0 — Suite health & constitution hardening

**Goal:** High-signal audits and fewer self-check false positives.

| # | Item | Deliverable |
|---|------|-------------|
| 1 | Suite health metrics | `gavel-audit` summary: dead locators/POMs, selector leaks, waits, hardcoded data, dup factories, skip markers |
| 2 | Refactor score | Before/after line count + violation delta in `gavel-refactor` output |
| 3 | Self-check expansion | Additional Constitution rules + per-framework violation fixtures |
| 4 | Scanner precision | `self-check.js` allowlist for legitimate patterns; fewer false positives |
| 5 | Envelope completeness | Every public skill that declares completion references `templates/result-envelope.md` |
| 6 | Self-check CI examples | Sample GitHub Actions / GitLab job running `self-check.js` on target repo |

**Definition of done:** Audit report is a ranked scoreboard; self-check is trustworthy on real suites; all skills agree on completion contract.

---

### v0.7.0 — Packaging, adapters & onboarding

**Goal:** Install anywhere, detect drift, onboard without tribal knowledge.

| # | Item | Deliverable |
|---|------|-------------|
| 1 | Skill-copy sync | `validate-manifest.js` or new script checks `.qoder`, workspace mirrors vs `skills/` |
| 2 | Instruction self-test | Verify agent/skill markdown contracts (envelope refs, required sections) |
| 3 | Profile anti-patterns | Non-Playwright profiles document polling trap, manual waits, selector leaks |
| 4 | Agent checklist reuse | Generator + API specialist share orchestrator pre-change architecture checklist |
| 5 | QUICKSTART expansion | End-to-end flows: audit suite, heal failure, analyze CI, write UI test, write API test |
| 6 | Sample projects | Minimal golden repos per framework under `examples/` or `fixtures/sample-repos/` |

**Definition of done:** A new user installs Gavel, detects stack, audits a suite, heals one failure, and reads a structured result — without project-specific docs.

---

## v0.8.0 — Test resilience & safety guardrails

**Goal:** Prevent the most common test failures before they reach CI by enforcing correct structure, assertion strategy, action contracts, and configuration safety.

**Source:** Generalized from real debugging sessions where 9 distinct issues were traced to 4 missing guardrails. Each feature below is a capability gavel provides, not a detector for a specific anti-pattern.

### Feature 1: Test Architecture Guardrails

Gavel prescribes and audits the correct test structure so suites don't cascade failures or waste setup overhead.

- **Independence enforcement:** `gavel-audit` flags `test.describe.configure({ mode: 'serial' })` and tests that depend on prior test state. Recommends self-contained `beforeEach` setup per test. Serial mode is allowed only when explicitly justified in a comment.
- **Consolidation guidance:** `gavel-review` identifies tests that share >70% setup steps and recommends merging into single tests with `test.step()` boundaries and soft asserts. Fewer tests = less setup overhead = faster suite.
- **Soft-assert strategy:** Constitution rule defining when to use `expect.soft()` (non-critical UI-state checks: artifact visibility, secondary metadata, audit events) vs hard `expect()` (critical path: status badge, revision number, core workflow completion). Audit flags all-or-nothing assertion blocks where a single non-critical failure blocks all subsequent verification.

**Prevents:** Serial cascade failures, redundant test maintenance, all-or-nothing assertion blocks.

### Feature 2: Async-Aware Assertion Constitution

Gavel's constitution and self-check enforce that timing-dependent assertions use polling, not instant checks — and that dynamic data uses ranges, not exact values.

- **Polling requirement:** Timing-dependent UI state (button enable after async, count update, badge transition, toast appearance) must use `expect.poll()` or `pollUntil()` — never instant `expect()` with a fixed timeout. Self-check flags instant asserts on elements known to update asynchronously.
- **Range-based count verification:** Hardcoded count assertions (`toHaveCount(N)`, `toBe(N)`) on dynamic data are flagged. Recommends `toBeGreaterThanOrEqual(min)` or polling until the count stabilizes. Tests verify what the app does, not what we assume it does.

**Prevents:** Instant-assert false failures on async state, hardcoded count mismatches against real app behavior.

### Feature 3: Action-Method Boundary Enforcement

Gavel audits action and page-object classes to ensure they return state and never assert — extending existing assertion-layering rules to cover API-response checks and SPA refresh patterns.

- **No API responses in actions:** Self-check flags `waitForResponse` + `response.ok()` / `response.status()` inside action classes. UI tests verify UI state (element visibility, text content, status changes), not HTTP response codes. Actions use `pollUntil` for terminal UI state.
- **SPA refresh awareness:** Constitution rule: action methods that trigger lifecycle events (download, verify, generate) must handle SPA sections that don't auto-update. If the target UI panel (audit log, activity feed) requires a page reload to reflect the action, the action method performs the reload internally — the spec never needs to know about refresh mechanics.

**Prevents:** API-response-in-action false failures (503 from API while UI succeeds), SPA no-refresh assertion failures after lifecycle actions.

### Feature 4: Configuration & Locator Safety Scanner

Gavel pre-flights test configuration and locators before tests run, catching issues that cause silent divergence or runtime crashes.

- **Env-var precedence audit:** `gavel-audit` flags `dotenv.config({ override: true })` that prevents CI/shell env-var precedence. When `.env.local` overrides shell exports, CI and local runs diverge silently. Recommends `override: false` (dotenv default) so shell-level env vars always win.
- **Strict-mode locator scanner:** `gavel-audit` detects locators likely to match multiple elements at runtime (`getByText` without `.first()`, loose `filter()` patterns, broad role queries). Recommends `.first()` or stricter scoping before Playwright strict mode throws at runtime.

**Prevents:** Silent env-var divergence between CI and local, Playwright strict-mode runtime crashes on ambiguous locators.

**Definition of done:** A test suite passing gavel audit will not fail due to serial dependencies, instant asserts on async state, API checks in action methods, env-var override issues, or strict-mode violations. Constitution documents the correct patterns for each feature area. Self-check and audit enforce all four features automatically.

---

## Future — v1.0.0

Productization gate. All v0.4–v0.8 definition-of-done criteria met. Public docs, changelog, and verify gate green on every release. npm publish ready.

---

## Release Process

1. Implement release scope on feature branch.
2. `npm run verify` green.
3. Update `CHANGELOG.md`, `docs/README.md`, `RELEASE_CHECKLIST.md`.
4. Bump version in all 7 version files (`check-versions.js`).
5. Tag `vX.Y.Z`. User pushes manually.

See [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) for pre-tag gates.
