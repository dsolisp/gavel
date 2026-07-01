# Gavel Documentation

Version: **0.3.0** (see [CHANGELOG.md](../CHANGELOG.md))

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
| `scripts/audit-autofix.js` | Safe dead-locator removal (dry-run default) |
| `scripts/validate-area-map.js` | Validate `gavel-area-map.json` |
| `scripts/ci-analysis-envelope.js` | Format analyze-ci output as Gavel Result markdown |
| `scripts/parsers/index.js` | Auto-detect report format |

### CI analysis with area mapping

Copy and customize [fixtures/config/area-map.example.json](../fixtures/config/area-map.example.json):

```bash
# Playwright HTML report dir — one-shot parse + envelope
node scripts/analyze-ci.js playwright-report/ \
  --envelope \
  --project Tickblaze.UI

node scripts/analyze-ci.js playwright-report/ \
  --app-repo ../TTS.CFD.Frontend \
  --area-map ./gavel-area-map.json \
  --envelope \
  --json
```

### Audit autofix (dead locators)

```bash
node scripts/audit-autofix.js ../Tickblaze.Web.UI.Automation
node scripts/audit-autofix.js ../Tickblaze.Web.UI.Automation --apply
```

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
