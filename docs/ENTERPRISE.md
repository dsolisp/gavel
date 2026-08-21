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

## Day-1 CI (no LLM)

Platform teams wire Gavel as a **static CLI gate** — pin the npm package, emit SARIF, upload to your dashboard, fail the job on threshold. IDE skills and companion workflows are optional; they are not part of the required PR check.

```bash
# Pin the version in regulated orgs (matches templates/github-actions/gavel-audit-sarif.yml)
npx --yes @dsolisp/gavel@0.9.0 audit --format sarif > gavel.sarif
```

`gavel audit` runs constitution self-check by default. A separate `gavel self-check --format sarif` step is optional when you want SARIF split by category.

**Exit codes:** `0` clean · `1` actionable findings at/above `failThreshold` (default: `warning`) · `2` usage/config/schema error.

Report-only / `report` severity findings do not force exit `1` unless config opts in.

See [CLI_MATRIX.md](CLI_MATRIX.md) for which README commands are real binaries vs agent skills.

### SARIF → GitHub Code Scanning

1. Copy [templates/github-actions/gavel-audit-sarif.yml](../templates/github-actions/gavel-audit-sarif.yml) into your automation repo as `.github/workflows/gavel-audit.yml`.
2. Ensure the workflow has `security-events: write` (required for Code Scanning upload).
3. The template pins `@dsolisp/gavel@0.9.0`, runs `audit --format sarif`, uploads via `github/codeql-action/upload-sarif@v3`, then fails the job when the audit step exits non-zero.
4. Findings appear under **Security → Code scanning alerts** with category `gavel`. Rule IDs match Gavel tags (`selector-leak`, `manual-wait`, …).

Prefer a locked `package.json` dependency over floating `npx` when your change-control policy requires it; keep the semver pin aligned with [package.json](../package.json).

### SARIF → SonarQube / SonarCloud

Gavel ships **SARIF 2.1.0** only — there is no Sonar plugin. Import the file as external issues alongside your normal Sonar scan.

1. **Produce SARIF in CI** (before `sonar-scanner`):

   ```bash
   npx --yes @dsolisp/gavel@0.9.0 audit --format sarif > gavel.sarif
   ```

2. **Point Sonar at the file** — add to `sonar-project.properties` or pass as a scanner parameter:

   ```properties
   sonar.sarifReportPaths=gavel.sarif
   ```

   Multiple reports: comma-separated paths. Path is relative to the project base directory.

3. **Run your existing Sonar scan** — Gavel findings import as external issues with stable `ruleId` values from the SARIF driver rules list.

4. **Quality gates** — reference Gavel rule IDs as-is in gate conditions; do not rename or remap IDs (baseline ratchet keys on `path + rule + snippetHash`).

5. **Edition notes** — SonarCloud and SonarQube 9.9+ support `sonar.sarifReportPaths`. Older editions may require the REST import API; consult your Sonar admin docs for SARIF external-issue import.

## Data handling

- Findings report **file, line, rule, message** — never print matched secret **values** (`hardcoded-env` and successors)
- Gavel reads repository files, diffs, and provided CI reports — it does not call your issue tracker or cloud APIs from core CI commands
- No telemetrics SaaS: scorecard/ROI exports (v0.10+) are local machine-readable JSON for your dashboards

## Baseline ratchet (adoption path)

| Release | Capability |
|---------|------------|
| v0.8 | [`gavel-baseline.json` schema](../schemas/gavel-baseline.schema.json) + [verify samples](../fixtures/baseline/) (no write CLI yet) |
| v0.12 | `gavel baseline` **command** (`write` / `check`) + new-findings-only gating for legacy monorepos; `createdAt` ratchet clock preserves first-seen timestamps across rewrites |
| v1.0 | Frozen baseline key identity (`path + rule + snippetHash`) with SARIF fingerprints |

## Policy packs (v0.12)

Named presets in `gavel.config.json` `"preset"` or CLI `--preset`. IDs are frozen: `recommended`, `strict`, `legacy`, `api-only`. Unknown ID → exit `2` (`Unknown preset: …`). No aliases.

| ID | Intent | Defaults |
|----|--------|----------|
| `recommended` | Balanced gate (same as implicit default) | `failThreshold: warning` |
| `strict` | Fail on `info` findings | `failThreshold: info` (does not strip user `allowlist`) |
| `legacy` | Brownfield / baseline-friendly | `failThreshold: error`; `paths: [{ pattern: '**/*', weight: 0.5, label: 'legacy' }]` if `paths` omitted |
| `api-only` | Mute UI locator rules | `failThreshold: warning`; allowlist `selector-leak` + `complex-locator` on `file: '*'` |

**Merge:** start with the pack, then shallow-merge file keys. `failThreshold` in the file wins. If the file sets `allowlist` or `paths`, that array **replaces** the pack array for that key; omitted keys keep pack defaults. CLI `--preset` selects which pack; file keys still override that pack (e.g. `--preset legacy` + `"failThreshold": "info"` → legacy paths + `info` threshold).

**Adoption:** `"preset": "legacy"` plus `gavel baseline check` for brownfield suites. The preset does not run baseline check.

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
