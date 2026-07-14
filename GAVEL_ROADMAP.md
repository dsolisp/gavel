# Gavel Roadmap

**Status date:** 2026-07-13  
**Current release:** `v0.8.0` (Trust + resilience)  
**In progress:** `v0.9.0` — Enterprise adoption package  
**Scope:** Framework-adaptive QA quality tool. Roadmap items are product-agnostic across Playwright, Selenium, Cypress, WebdriverIO, Cucumber, Robot, and pytest-playwright.

**North star (v1.0):** *Add the Gavel GitHub Action. Fail PRs on new blocker findings against baseline. Import SARIF into Sonar. AI agents may use Gavel skills, but CI never depends on an LLM.*

---

## Product Direction

Gavel is **static test-code quality enforcement** — the judge for test architecture. It behaves like a disciplined QA automation lead:

1. Classify failures before fixing them.
2. Reuse existing suite architecture before adding code.
3. Preserve strict locator → action → spec layering.
4. Prefer framework-native waits and assertions.
5. Require compile + affected-test evidence before calling work done.
6. Keep framework profiles thin; keep workflow logic generic.

**One sentence for buyers:** Gavel is *SonarQube for test architecture* — POM discipline, assertion ownership, flake-structure, dead-test debt — complementary to ESLint Playwright rules and Sonar general quality.

**Do not compete with:** Playwright, Cypress, device farms, Xray/TestRail, Selenium Grid, full RPA.  
**Must beat:** ad-hoc lint rules, tribal review comments, “AI wrote 400 flaky tests.”

### Boundary Rule (short)

Everything *inside* the test codebase → **Gavel**. Everything *outside* (tickets, env, credentials, CI orchestration) → **Bailiff** (future sibling). Full planning: [docs/BAILIFF.md](docs/BAILIFF.md).

Core `audit` / `review` / `self-check` never require Bailiff or an LLM. Optional IDE skills and `companion/` workflows are human conveniences, not the enterprise CI surface. See [docs/CLI_MATRIX.md](docs/CLI_MATRIX.md) and [docs/ENTERPRISE.md](docs/ENTERPRISE.md).

### Core identity

- **Lean suites:** bloat, dead POMs/locators, duplicate factories, unnecessary abstractions.
- **Trustworthy structure:** locator/action/spec layering, fixture/DI, semantic selectors, native waits, assertion ownership.
- **Resilient automation:** brittle waits, shared-state coupling, weak assertions, unsafe skips, vacuous greens.
- **Framework-adaptive rules:** profiles translate patterns; they do not own product strategy.
- **Evidence before done:** compile/check + affected tests + concise result envelope.

**In scope:** test-code quality, suite health, failure classification, flake/test-bug diagnosis, affected-test selection, audit/refactor guidance, static CI envelopes, framework profiles.  
**Out of core:** issue-tracker product, live browser discovery as required planning, screenshot product QA, performance SLOs, predictive analytics, broad API contract governance, product security review.

```text
request / CI failure
  → detect stack and CI context
  → analyze failure cluster
  → map product or test impact
  → route to specialist
  → implement in layer order
  → run local verification gate (compile + affected tests)
  → return evidence and final status
```

---

## Enterprise Recommendation Criteria

v1.0 is “enterprise recommendable” when all of the following hold:

1. `npx gavel audit --format sarif` in CI with **baseline ratchet** — no agent required
2. Published **precision reports** per heuristic rule (≥90% / ≥95% graduation already in contract)
3. **Stable rule IDs** + deprecation policy
4. **Policy packs** + monorepo path weights
5. Official **GitHub Action** + **Azure DevOps** task + **Sonar SARIF** import recipe
6. **Zero credential leakage** in findings + **SBOM**
7. Audit of largest sample repo under a published **time budget**
8. Clear **Gavel vs Bailiff** blast radius for security teams

---

## Shipped Releases

| Version | Theme | Highlights |
|---------|-------|------------|
| **v0.1.0** | Foundation | Constitution, QA ladder, agents, profiles, envelope, self-check, CI parsers, clustering, affected-tests |
| **v0.2.0** | CI intelligence | Playwright HTML parser, area-map + commits, severity, `analyze-ci --envelope` |
| **v0.3.0** | Safe autofix | `audit-autofix.js`, `gavel-robot`, HTML report one-shot |
| **v0.4.0** | Autofix & audit workflow | Dead POM/factory, ranked audit, apply-safe handoff, adapter CI template |
| **v0.5.0** | CI intelligence & discovery | Cucumber parser, multi-framework tags, envelope `1.0.0`, failure taxonomy |
| **v0.6.0** | Suite health & constitution | Scoreboard, self-check expansion, companion extraction, `verify-docs.js` |
| **v0.7.0** | Packaging & onboarding | Unified CLI, RULES registry, SARIF 2.1.0, envelope `1.1.0`, area-map gen, tag-scoped ignore, `gavel explain`, boundary guard, sample repos, config schema |
| **v0.7.1** | Release integrity hotfix | Version/CHANGELOG/docs alignment; [ENTERPRISE.md](docs/ENTERPRISE.md); [CLI_MATRIX.md](docs/CLI_MATRIX.md); Bailiff/contributing docs extracted; roadmap trust narrative; SARIF CI recipe template |
| **v0.8.0** | Trust + resilience | 5 resilience tags (`brittle-assert`, `hardcoded-env`, `complex-locator`, `no-teardown`, `assert-drop`); corpus precision runner + diff-corpus harness; baseline ratchet schema; 3 rules graduated with 100% precision |

**Verify gate:** `npm run verify`.

**v0.7 interface-budget note:** v0.7.0 shipped three irreversible public interfaces (RULES+CLI exit contract, envelope `1.1.0`, SARIF). Contract #7 caps two per minor unless explicitly declared — **declared exception** with two Tier-R cross-review sessions (documented in v0.7 release history). Future minors return to the cap of two unless a new exception is named here.

---

## Implementation Contract (for humans and AI agents)

Roadmap items below are written to be implementable by any competent AI coding agent without extra context. Non-negotiables:

1. **Rule contract** — a new self-check/audit tag ships only with all five parts:
   - `RULES` entry in `scripts/self-check.js`: id, severity, class (`deterministic`/`heuristic`), message, remediation.
   - Comment-aware detection through `findMatches` — never bare regex over raw text. Diff-scoped rules document their scanner contract (see `assert-drop`).
   - Suppression: `gavel-ignore: <tag>` + config allowlist.
   - Golden fixtures in `fixtures/self-check/` — violating + clean per language — wired into `verify-self-check-fixtures.js`. Diff rules use `fixtures/self-check/diff/`.
   - `npm run verify` green.
2. **Heuristic discipline** — start at `report` with `confidence` + evidence; graduate only after corpus precision + tag-scoped ignores.
   - **Corpus:** `fixtures/corpus/<tag>/` ≥10 violating + ≥10 clean, ≥2 languages. Precision = TP / total findings.
   - **Graduation:** `report` → `warning` ≥90%; `warning` → `blocker` ≥95% with zero corpus FPs **and** sample-repo trial with zero uncontested FPs (also required for deterministic blockers).
3. **Envelope discipline** — schema bumps stay backward-compatible; update `templates/result-envelope.md` + validation in the same change.
4. **Boundary guard** — test-code → Gavel; workflow → Bailiff planning only. No `bailiff-*` code in this repo.
5. **Evidence before done** — table row + release definition of done + fixtures/tests.
6. **Rule budget** — ≤ **5** new rule tags per minor release.
7. **Interface budget** — ≤ **2** irreversible public interfaces per minor unless this roadmap names an exception + cross-review gate. Public interfaces: CLI contracts, exit codes, schema versions, SARIF shape, MCP tools, baseline formats, plugin APIs, policy-pack IDs.
8. **Static-input boundary** — consume files, diffs, reports, envelopes, repo metadata. Do not create runtime evidence except the heal carve-out below. No CI reruns, browser exploration, env probes, DB sweeps, issue-tracker calls, or telemetry in core commands.
   - **Heal evidence exception:** `gavel-heal` may re-run failing tests via the repo’s own runner with native artifacts (max 2 capture reruns). Never for `audit`/`review`/`self-check`/authoring. Insufficient evidence → `evidence-insufficient`, not locator guessing.
9. **Heuristic first contract** — one-page contract before code: inputs, languages, examples, false positives, corpus path, suppression, severity, SARIF mapping.

Contributor / multi-model protocol: [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md). Per-item prompts for v0.8: [v0.8.0-prompts.txt](v0.8.0-prompts.txt).

---

## Upcoming Releases — Trust → Resilience → Adoption → Remediation → Freeze

| Release | Theme | Enterprise why |
|---------|-------|----------------|
| **v0.7.1** | Release integrity + trust docs | Restore pin/compliance confidence |
| **v0.8.0** | Resilience rules + **baseline schema** + **GH Action / SARIF CI recipe** | Usable in enterprise CI day-1 |
| **v0.9.0** | Baseline **command** + policy packs + monorepo mode + scorecard/criteria | Legacy monorepo adoption |
| **v0.10.0** | Remediation intelligence + **ROI / scorecard export** | “Why did we buy this?” |
| **v1.0.0** | Freeze + perf + SBOM + **official integration pack** | Recommendable |

---

### v0.8.0 — Trust + test resilience

**Goal:** Catch brittle tests before CI *and* give platform teams a deterministic SARIF gate with a reviewed baseline schema.  
**Scope:** Test-code quality only. Heuristics stay `report` until corpus graduation.  
**Rule budget:** exactly 5 tags — `brittle-assert`, `hardcoded-env`, `complex-locator`, `no-teardown`, `assert-drop`.  
**Interface budget:** two irreversible interfaces — `gavel-baseline.json` schema + corpus precision-report format (corpus `labels.json` is internal tooling, not counted).  
**Enterprise DoD add-ons (same release):** official-ready **GitHub Action template** + **SARIF CI recipe** (already seeded under `templates/github-actions/gavel-audit-sarif.yml` and [docs/ENTERPRISE.md](docs/ENTERPRISE.md); pin + Code Scanning upload must be documented and verify-referenced).

**Shared scanner constraints:** read only repo files, diffs, local git metadata, prior envelopes by path. Never run tests to reproduce flakes, query CI, inspect live env, sweep data, or print credential values.

#### Guardrails (product intent)

1. **Async and state assertions** — native retry semantics; no sleep/exact-count/draft-vs-list traps.  
2. **Locator and overlay safety** — ambiguity, selector boundary, overlay attachment.  
3. **Shared-state / suite independence** — serial coupling, teardown-only restore, order-flake classification from *provided* evidence only.  
4. **Action boundary** — no hidden asserts; no transport-success-as-UI-success; refresh mechanics in actions.  
5. **Weak/vacuous verification** — early returns, existence-only asserts for strong claims, duplicate action paths (report).

#### Concrete rule tags

| Tag | Class | Severity | Detection summary |
|-----|-------|----------|-------------------|
| `brittle-assert` | Heuristic | `fix` (graduated) | Prose equality literals that drift with external copy |
| `hardcoded-env` | Deterministic | `blocker` (graduated) | Spec URLs/IPs/paths/credential-shaped assigns — **never print values** |
| `complex-locator` | Heuristic score | `report` | Fragility score in locator files; component-prefix allowlist |
| `no-teardown` | Heuristic | `report` (never blocker in v0.8) | Create signals without cleanup in same lexical block |
| `assert-drop` | Split | `blocker` / `fix` (graduated) | Diff-only: deleted asserts / early-return before asserts; strength downgrade heuristic |

`assert-drop` lives in `REVIEW_RULES` (`gavel-review` only) with before/after diff fixtures.

**Heal governance:** repair as reviewable diffs; never delete/weaken asserts (`assert-drop` blocks that). Evidence loop per contract #8.

**Adoption aid — baseline schema (promote to DoD):** design `gavel-baseline.json` (schema version, path, rule, snippet hash, created-at). Identity = v0.7 SARIF fingerprint (`path + rule + snippetHash`); severity is **not** part of the key (CR Session 1 — graduation must not invalidate baselines). Ship schema-validation verify script + golden samples. **No baseline write CLI in v0.8** — that is v0.9.

**Enterprise CI surfaces (DoD):**

| # | Item | Deliverable |
|---|------|-------------|
| E1 | SARIF CI recipe | Documented workflow: `npx gavel audit --format sarif` → Code Scanning upload ([template](templates/github-actions/gavel-audit-sarif.yml)) |
| E2 | GitHub Action template | Version-pinned composite/reusable workflow checked into `templates/github-actions/`; README/ENTERPRISE link; consumer copy-paste path clear |
| E3 | False-positive SLA posture | Corpus runner + precision report format public as artifacts of this release (quarterly public report cadence begins at v1.0) |

#### Implementation order

| Order | Item | Tier | Notes |
|-------|------|------|-------|
| 1 | Corpus label format + precision runner | **A** + R | Labels internal; precision-report is the public interface |
| 2 | Baseline ratchet schema + verify samples | **A** + R | Irreversible; no write flag |
| 3 | `brittle-assert` contract + corpus population | **A** + R | Contract #9 before scanner |
| 4 | `hardcoded-env` | B | |
| 5 | `no-teardown` | B | |
| 6 | `complex-locator` | B | Weights fixed by this row |
| 7 | `brittle-assert` scanner | B | |
| 8 | `assert-drop` | B (harness **A**) | |
| 9 | E1–E2 Action + recipe finalize | C | Must land before release tag |
| — | Graduation decisions | **A** + R | Corpus + sample-repo trial |

**Definition of done:** Five resilience tags ship under contract #1–#2. Baseline schema validated in verify. SARIF CI recipe + GH Action template published and linked from ENTERPRISE.md. Heuristics have corpora. A platform engineer can wire Code Scanning without an agent. Gavel does not become a general QA platform.

---

### v0.9.0 — Enterprise adoption package

**Goal:** Legacy monorepos can adopt Gavel without a big-bang fail — policy packs, monorepo mode, baseline command, traceability, and a reproducible scorecard.

**Interface budget:** two — scorecard schema (fixed weights) + `gavel-criteria.json`. Baseline *schema* already counted in v0.8; `gavel baseline` command is not a new interface. Policy pack IDs are config presets (documented); if pack IDs are treated as frozen public API, count them inside the scorecard/criteria design session or declare an exception in the release PR.

**Rule budget:** Feature 2 adds ≤2 assertion-quality tags; Feature 1 extends existing test-ID tags. Within cap.

#### Feature 1: Test-ID and criteria traceability

Static metadata only. Tickets/plans stay Bailiff. `gavel-criteria.json`: `{ criteria: [{ id, name, area, criticality? }] }`. Gap ranking by criticality / changed area / config.

#### Feature 2: Assertion-quality review

Zero-assertion / navigation-only asserts on long tests; redundant stacks; critical-vs-secondary guidance. Start `report` + corpus. Marker/quarantine lifecycle deferred to v1.3.

#### Feature 3: Deterministic health score + baseline gating

- Versioned scorecard; fixed documented weights (configurable weights → v1.0 after validation).
- **Path-weighted health:** `gavel.config.json` `paths` globs with weight/label for legacy vs active trees.
- **`gavel baseline`:** implement v0.8 schema — snapshot + ratchet; prefer new findings on changed lines when git metadata exists.

#### Feature 4: Policy packs (enterprise)

Presets applied via `gavel.config.json` / `--pack`:

| Pack | Intent |
|------|--------|
| `recommended` | Default balanced gate |
| `strict` | Higher fail threshold; fewer ignores tolerated |
| `legacy` | Lower path weights + baseline-friendly defaults for brownfield |
| `api-only` | UI locator rules muted; API layering/assertion rules emphasized |

Packs are documented matrices of rule severities / failThreshold / path defaults — not a second config language.

#### Feature 5: Monorepo mode (enterprise)

- Workspace discovery (npm/pnpm/yarn workspaces, or explicit `packages` list in config).
- Per-package `gavel.config.json` with root defaults.
- Path weights compose with pack presets.
- CI recipe documents running audit per package or once at root with path filters.

#### Implementation order

| Order | Item | Tier | Notes |
|-------|------|------|-------|
| 1 | Criteria format + matrix + export | **A** + R | |
| 2 | Scorecard schema + rubric | **A** + R | After criteria signals known |
| 3 | Policy packs design + schema knobs | **A** + R | May share session with #2 if interface budget tight |
| 4 | `gavel baseline` command | B | Against v0.8 schema |
| 5 | Monorepo discovery + per-package config | B | |
| 6 | Assertion-quality review | B | Slip watch — keep v1 narrow |

**Definition of done:** A 10k-test monorepo can apply `legacy` pack + baseline ratchet and fail PRs on **new** findings only. Policy pack names and monorepo mode are documented in ENTERPRISE.md. No live browser, issue tracker, or Bailiff required.

---

### v0.10.0 — Remediation intelligence + adoption ROI

**Goal:** Turn walls of findings into prioritized fixes *and* give VP-Eng a machine-readable “why we bought this” export.

**Rule budget:** 0 new tags.  
**Interface budget:** one — remediation-suggestion shape inside the result envelope **or** the ROI scorecard export schema (pick one irreversible shape in Tier-A; the other may be a versioned file under the same envelope family if cross-reviewed as one coupled interface).

#### Feature 1: Wait-remediation classifier

Context-aware replacements for `manual-wait` (UI transition / network / animation) + higher severity when a local `wait_for_*` / `poll_*` helper exists but is unused.

#### Feature 2: Remediation-adoption scanner

Wait-helper, fixture, and POM adoption gaps — enhance existing rule output / `adoption` category; no new tags.

#### Feature 3: Machine scorecard / ROI export (enterprise)

Local JSON (not SaaS), suitable for dashboards:

- Flake-structure rate, dead locator/POM counts, assertion-vacuity / `assert-drop` rates
- Baseline ratchet progress (suppressed legacy vs new open findings)
- Top remediation categories with suggested fix class counts
- Optional before/after delta when two envelopes are provided

Skill `gavel-gain` may narrate this file; **CI and finance/eng reviews consume the JSON**, not the skill.

#### Implementation order

| Order | Item | Tier | Notes |
|-------|------|------|-------|
| 1 | Remediation envelope + ROI export schema | **A** + R | One coupled interface decision |
| 2 | Wait-remediation classifier + helper inventory | B | |
| 3 | Adoption scanners (wait/fixture/POM) | B | |
| 4 | Scorecard export CLI flag / file writer | B | |
| 5 | Fixtures + verify | B | |

**Definition of done:** Real multi-surface suite run yields violation counts, top-3 remediation classes with suggestions, adoption gaps, and a scorecard JSON a dashboard can ingest.

---

## Future — v1.0.0 Freeze + official integration pack

Productization gate. All v0.7.1–v0.10 DoD met. Public docs, changelog, verify green. npm publish ready. Plus:

| Item | Notes |
|------|-------|
| **Stability contract** | Rule-tag taxonomy frozen; envelope/scorecard/baseline deprecation policy. Tier A + R |
| **Per-rule doc pages** | `gavel explain` → `helpUri`. Tier C from RULES |
| **Performance budget** | Largest sample repo under published bound, CI-checked. Tier B |
| **Zero runtime dependencies** | Product guarantee + verify. Tier B |
| **Compatibility suite** | Old configs, envelopes, SARIF, baselines, aliases. Tier B |
| **Upgrade guide** | v0.x → v1.0. Tier C |
| **SBOM** | Generated and published with release artifacts. Tier B |
| **Official integration pack** | Version-pinned **GitHub Action**; **Azure DevOps** task; **Sonar** SARIF import recipe; **MCP read-only** tools only: `gavel_audit`, `gavel_explain`, `gavel_affected_tests` — never env/credentials. Tier A + R for MCP surface |
| **False-positive public artifact** | Quarterly corpus precision report; blocker rules cannot ship without sample-repo trial (contract #2) |

**v1.0 freeze scope:** rule IDs, default severities, CLI command/flag names, exit codes, JSON field names, SARIF rule IDs, baseline keys, policy pack IDs, schema compatibility policy. Message text may improve. Post-v1 experimental rules must be marked `experimental` and excluded from default fail thresholds.

---

## Beyond v1.0.0

Post-v1 may expand breadth only if it improves test-code quality, suite health, failure classification, or framework adaptation. Otherwise → `companion/` or Bailiff. **Breadth before trust kills recommendation** — v1.4–v1.9 stay behind the v1.0 enterprise pack.

| Version | Theme | Idea |
|---------|-------|------|
| **v1.1.0** | Test data quality + POM scaffold | Static duplicate-factory audit; `gavel scaffold-pom`; deeper fixture-utilization scanner |
| **v1.2.0** | API test-quality profile | Spec-owned response asserts; no broad OpenAPI governance |
| **v1.3.0** | Quarantine lifecycle | Expiry/reporting for skip/xfail/WIP; Bailiff owns SLA escalation |
| **v1.4.0** | Mobile / desktop bridge profiles | Appium + bridge-specific rules only; farms/env → Bailiff |
| **v1.5.0** | Cross-run flake intelligence | Compare *provided* envelopes; no CI query |
| **v1.6.0** | Performance-test quality | Brittle thresholds / hidden pass logic in perf *code* only |
| **v1.7.0** | Browser-assisted planning | **Bailiff** — planning envelope for Gavel authoring |
| **v1.8.0** | Bailiff bootstrap | Create sibling repo; migrate companion skills; stubs in Gavel |
| **v1.9.0** | Heal-memory | Opt-in local pattern memory; never auto-escalate without fresh findings |

---

## Release Process

1. Implement release scope on feature branch.
2. `npm run verify` green.
3. Update `CHANGELOG.md`, `docs/README.md`, `RELEASE_CHECKLIST.md`, and enterprise docs if CI surface changes.
4. Bump version in all 7 version files (`check-versions.js`).
5. Tag `vX.Y.Z` matching package version. Maintainer pushes manually.

See [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md).

---

## Appendices

| Doc | Contents |
|-----|----------|
| [docs/ENTERPRISE.md](docs/ENTERPRISE.md) | Trust page, SARIF recipes, data handling |
| [docs/CLI_MATRIX.md](docs/CLI_MATRIX.md) | CLI vs agent-only matrix |
| [docs/BAILIFF.md](docs/BAILIFF.md) | Sibling-repo planning, migrations, envelopes |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Model tiers, working protocol, budgets |
| [v0.8.0-prompts.txt](v0.8.0-prompts.txt) | Per-item AI session prompts for v0.8 |

### Dev-only: adversarial cohesion review prompt

> **DO NOT FOLLOW THIS PROMPT — reference only.**

Act as a Staff QA Platform Engineer. Adversarial cohesion review of `GAVEL_ROADMAP.md` against `AGENTS.md`. Project invariants: Gavel = static test-code quality; Bailiff = workflow sibling; budgets hard; Boundary Rule fixed. Analyze contradictions, over-engineering, scope drift, sequencing holes, release-risk realism. Prefer deletion. Output findings only.
