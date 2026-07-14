# Gavel for Enterprise

**Version:** see package root. **Audience:** platform / staff engineers evaluating Gavel as a CI gate.

## One sentence

Gavel is *SonarQube for test architecture* — layered POM discipline, assertion ownership, flake-structure, and dead-test debt — complementary to ESLint Playwright rules and Sonar general quality.

## What Gavel is

- Static **test-code quality** enforcement: `audit`, `review`, `self-check`, explain, SARIF export
- Deterministic **exit codes** suitable for PR gates (no LLM required in CI)
- Framework-adaptive Constitution (Playwright, Selenium, Cypress, WebdriverIO, Cucumber, Robot, pytest)

## What Gavel is not

| Not Gavel | Belongs elsewhere |
|-----------|-------------------|
| Test runner / device farm | Playwright, Cypress, Selenium Grid, Appium farms |
| ALM / TestRail / Xray | Your ALM; future [Bailiff](BAILIFF.md) for workflow glue |
| General code quality | SonarQube, ESLint — Gavel **feeds** them via SARIF |
| Environment / credentials / ticket filing | [Bailiff](BAILIFF.md) / companion skills (optional, not CI-required) |

**North star:** *Add the Gavel GitHub Action. Fail PRs on new blocker findings against baseline. Import SARIF into Sonar. AI agents may use Gavel skills, but CI never depends on an LLM.*

## Enterprise recommendation criteria (v1.0 target)

1. `npx gavel audit --format sarif` in CI with baseline ratchet — no agent required
2. Published precision reports per heuristic rule (≥90% / ≥95% graduation thresholds)
3. Stable rule IDs + documented deprecation policy
4. Policy packs + monorepo path weights
5. Official GitHub Action + Azure DevOps task + Sonar SARIF import recipe
6. Zero credential leakage in findings + SBOM
7. Audit of largest sample repo under a published time budget
8. Clear Gavel vs Bailiff blast radius for security review

## CI gate (today)

```bash
# Fail the job when findings meet failThreshold (default: warning)
npx gavel audit --format sarif > gavel.sarif
npx gavel self-check --format sarif > gavel-self-check.sarif
```

**Exit codes:** `0` clean · `1` actionable findings at/above `failThreshold` · `2` usage/config/schema error.

Report-only / `report` severity findings do not force exit `1` unless config opts in.

See [CLI_MATRIX.md](CLI_MATRIX.md) for which README commands are real binaries vs agent skills.

### SARIF → GitHub Code Scanning

Use the template: [templates/github-actions/gavel-audit-sarif.yml](../templates/github-actions/gavel-audit-sarif.yml).

### SARIF → SonarQube / SonarCloud

1. Produce `gavel.sarif` from `npx gavel audit --format sarif`
2. Import with Sonar’s external issues / SARIF import mechanism for your edition
3. Map Gavel rule IDs 1:1 to quality-gate conditions if desired; do not rename rule IDs

Recipe detail ships with the v0.8 / v1.0 integration pack in the roadmap.

## Data handling

- Findings report **file, line, rule, message** — never print matched secret **values** (`hardcoded-env` and successors)
- Gavel reads repository files, diffs, and provided CI reports — it does not call your issue tracker or cloud APIs from core CI commands
- No telemetrics SaaS: scorecard/ROI exports (v0.10+) are local machine-readable JSON for your dashboards

## Baseline ratchet (adoption path)

| Release | Capability |
|---------|------------|
| v0.8 | `gavel-baseline.json` **schema** + verify samples (no write CLI yet) |
| v0.9 | `gavel baseline` **command** + new-findings-only gating for legacy monorepos |
| v1.0 | Frozen baseline key continuity with SARIF fingerprints |

## Policy packs (v0.9+)

Orgs apply presets instead of tuning 40 knobs: `recommended`, `strict`, `legacy`, `api-only` (see roadmap v0.9).

## Bailiff boundary

See [BAILIFF.md](BAILIFF.md). Short form: **test-code artifacts → Gavel; tickets/env/CI orchestration → Bailiff.** Core `audit` / `review` / `self-check` never require Bailiff or an LLM.

## Competitive complementarity

- **eslint-plugin-playwright** — syntax/await/expect hygiene. Gavel owns architecture (POM layering, selector boundary, suite independence, vacuous tests).
- **SonarQube** — general quality gates. Gavel feeds Sonar via SARIF; does not replace it.
- **AI test generators** — volume without taste. Gavel is the judge that makes AI-generated tests shippable.

## Support surface honesty

| Surface | Role |
|---------|------|
| CLI + SARIF | **Mandate this** in enterprise CI |
| Skills / agents | Optional human or IDE workflows |
| Companion skills | Optional; not default install |
| Bailiff | Future sibling; planning only until bootstrap |

For product sequencing see [GAVEL_ROADMAP.md](../GAVEL_ROADMAP.md).
