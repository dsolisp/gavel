# Gavel Documentation

Version: **0.4.0** (see [CHANGELOG.md](../CHANGELOG.md))

## Start here

| Doc | Purpose |
|-----|---------|
| [QUICKSTART.md](../QUICKSTART.md) | Install, audit, heal, write — first session |
| [AGENTS.md](../AGENTS.md) | Universal QA rules for all adapters |
| [GAVEL_ROADMAP.md](../GAVEL_ROADMAP.md) | Product direction and backlog |
| [RELEASE_CHECKLIST.md](../RELEASE_CHECKLIST.md) | Pre-release verification gates |

## Scripts (automation repos)

| Script | Purpose |
|--------|---------|
| `scripts/self-check.js` | Constitution violation scan |
| `scripts/affected-tests.js` | Transitive affected spec discovery |
| `scripts/check-profile-freshness.js` | Framework version vs profile |
| `scripts/analyze-ci.js` | Parse CI report, cluster, correlate commits |
| `scripts/audit-autofix.js` | Safe dead code removal (locators, POMs, factories) — O(n) content cache |
| `scripts/audit-report.js` | Ranked gavel-audit output (`--audit-format`, `--json`, `--with-self-check`) |
| `scripts/validate-area-map.js` | Validate `gavel-area-map.json` |
| `scripts/ci-analysis-envelope.js` | Format analyze-ci output as Gavel Result markdown |
| `scripts/parsers/index.js` | Auto-detect report format |

### CI analysis with area mapping

Copy and customize [fixtures/config/area-map.example.json](../fixtures/config/area-map.example.json):

```bash
node scripts/analyze-ci.js playwright-report/ \
  --envelope \
  --project Tickblaze.UI
```

### Audit autofix & ranked audit

```bash
node scripts/audit-report.js ../Tickblaze.Web.UI.Automation
node scripts/audit-report.js ../Tickblaze.Web.UI.Automation --audit-format
node scripts/audit-report.js ../Tickblaze.Web.UI.Automation --json
node scripts/audit-report.js ../Tickblaze.Web.UI.Automation --with-self-check
node scripts/audit-autofix.js ../Tickblaze.Web.UI.Automation --audit-format
node scripts/audit-autofix.js ../Tickblaze.Web.UI.Automation --json
node scripts/audit-autofix.js ../Tickblaze.Web.UI.Automation --apply
```

Both scripts support `--audit-format` (human-readable) and `--json` (machine-readable). `audit-report.js` also supports `--with-self-check` for Constitution violations in the same pass.

Apply-safe handoff: [templates/apply-safe-workflow.md](../templates/apply-safe-workflow.md)

### Adapter CI template

Copy [templates/github-actions/gavel-verify.yml](../templates/github-actions/gavel-verify.yml) into your fork as `.github/workflows/gavel-verify.yml`.

### Report formats

| Format | Parser |
|--------|--------|
| JUnit XML | `scripts/parsers/junit.js` |
| Allure results dir | `scripts/parsers/allure.js` |
| Playwright JSON | `scripts/parsers/playwright.js` |
| Playwright HTML dir | `scripts/parsers/playwright-html.js` |
| Cypress JSON | `scripts/parsers/cypress.js` |
| Auto-detect | `scripts/parsers/index.js` |

## Skills and agents

- **Skills** live in `skills/*/SKILL.md` — invoked by name in supported IDEs
- **Agents** live in `agents/*.md` — workflow specialists for orchestration
- **Templates** live in `templates/` — shared output contracts

Run `npm run verify` from the gavel package root before release.
