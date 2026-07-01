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
```

- [ ] JUnit fixture parses with expected failure count
- [ ] Allure fixture parses with expected failure count
- [ ] `cluster-failures.js` produces actionable clusters

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

- [ ] `package.json` version updated
- [ ] `plugin.yaml` version updated
- [ ] `check-versions.js` passes after bump

## Release Decision

| Gate | Required |
|------|----------|
| `npm run verify` green | Yes |
| Manifest validation | Yes |
| Self-check fixtures | Yes |
| Parser fixtures | Yes |
| Result envelope docs | Yes |
| Manual smoke on real repo | Recommended |

**Do not tag** if any required gate fails.
