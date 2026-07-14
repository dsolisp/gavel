# Gavel Release Checklist

Use this checklist before tagging a gavel release or merging packaging changes.

## 1. Source Verification

```bash
npm run verify
```

This runs:

- `check-rule-copies.js --check-all` — adapter rule sync
- `verify-agents-md.js` — AGENTS.md completeness
- `verify-skills.js` — all skills and agents exist
- `validate-manifest.js` — `plugin.yaml` matches `skills/`
- `check-versions.js` — version pins aligned
- `verify-self-check-fixtures.js` — Constitution rule fixtures
- `verify-parser-fixtures.js` — JUnit, Allure, Playwright, Cypress, analyze-ci fixtures
- `verify-profile-fixtures.js` — profile freshness + snippet checks
- `verify-audit-autofix.js` — dead locator dry-run and apply on fixtures
- `verify-corpus-precision.js` — heuristic corpus precision (fixtures/corpus/)
- `verify-diff-corpus-precision.js` — diff-rule corpus precision (fixtures/self-check/diff/)
- `verify-baseline-schema.js` — baseline ratchet schema validation

## 2. Manifest Completeness

- [ ] Every public skill in `skills/*/SKILL.md` appears in `plugin.yaml`
- [ ] No `plugin.yaml` entry points to a missing skill
- [ ] Framework profiles listed if intended for public install
- [ ] `npm run verify` reports: `Manifest OK`

## 3. Self-Check Golden Fixtures

```bash
node scripts/verify-self-check-fixtures.js
```

- [ ] All five tags detected: `expect-in-action`, `selector-leak`, `manual-wait`, `no-di`, `no-step`
- [ ] Fixtures live under `fixtures/self-check/violations/`

## 4. CI Parser Fixtures

```bash
node scripts/verify-parser-fixtures.js
node scripts/verify-profile-fixtures.js
```

- [ ] JUnit, Allure, Playwright JSON/HTML, Cypress, analyze-ci parsers pass fixtures
- [ ] Node + Python profile freshness fixtures pass
- [ ] `validate-area-map.js` passes on example map
- [ ] `analyze-ci.js --envelope` renders Gavel Result block (JSON and `playwright-report/` dir)
- [ ] `audit-autofix.js` covers locators, POMs, factories; `audit-report.js` ranks output
- [ ] `templates/apply-safe-workflow.md`, `templates/github-actions/gavel-verify.yml`, and `templates/github-actions/gavel-audit-sarif.yml` present
- [ ] `docs/ENTERPRISE.md` and `docs/CLI_MATRIX.md` version/links coherent with README

## 5. Agent / Skill Contract

- [ ] All specialist agents reference `templates/result-envelope.md`
- [ ] `gavel-analyze`, `gavel-run`, `gavel-heal` document envelope usage
- [ ] Orchestrator still enforces: no test evidence → `INCOMPLETE`

## 6. Adapter Sync (if rules changed)

```bash
node scripts/check-rule-copies.js --check-all
```

- [ ] Western adapters pass
- [ ] Chinese adapters pass when `--check-all` is used in CI

## 7. Manual Smoke (optional but recommended)

```bash
node scripts/self-check.js <known-automation-repo> --json
node scripts/affected-tests.js <known-automation-repo> --git --framework playwright --json
```

## 8. Version Bump

- [ ] All 7 version files match (`node scripts/check-versions.js`)
- [ ] `CHANGELOG.md` has a section for the release version
- [ ] `docs/README.md` version line matches `package.json`
- [ ] Git tag `vX.Y.Z` will match package version (maintainer creates/pushes tag)

## 9. Enterprise trust surface (from v0.7.1+)

- [ ] [docs/ENTERPRISE.md](docs/ENTERPRISE.md) describes exit codes, SARIF recipe, Bailiff boundary
- [ ] [docs/CLI_MATRIX.md](docs/CLI_MATRIX.md) lists every default-help CLI command as implemented
- [ ] Roadmap current-release line matches package version

## Release Decision

| Gate | Required |
|------|----------|
| `npm run verify` green | Yes |
| Manifest validation | Yes |
| Self-check fixtures | Yes |
| Parser fixtures | Yes |
| Result envelope docs | Yes |
| Version/CHANGELOG/docs alignment | Yes |
| Manual smoke on real repo | Recommended |

**Do not tag** if any required gate fails.
