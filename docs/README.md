# Gavel Documentation

Version: **0.6.0** (see [CHANGELOG.md](../CHANGELOG.md))

Index for scripts, templates, and companion workflows. For install and first run, start at [README.md](../README.md).

## Start here

| Doc | Purpose | Audience |
|-----|---------|----------|
| [README.md](../README.md) | Install, core commands, feature grid | New users |
| [QUICKSTART.md](../QUICKSTART.md) | First session: audit → heal → write | QA engineers |
| [AGENTS.md](../AGENTS.md) | Universal QA rules | All IDE adapters |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Two-repo design, browser-first authoring principle | Contributors, architects |
| [companion/README.md](../companion/README.md) | Optional CI/env/hub/closure skills | Teams needing extras |

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/self-check.js` | Constitution violation scan (`--json`) |
| `scripts/audit-report.js` | Ranked audit + suite health (`--with-self-check`, `--audit-format`) |
| `scripts/refactor-score.js` | Before/after line count + violation delta |
| `scripts/affected-tests.js` | Affected spec discovery + `--tag` |
| `scripts/extract-tags.js` | Multi-framework tag extraction |
| `scripts/analyze-ci.js` | Parse CI report, cluster, correlate commits |
| `scripts/audit-autofix.js` | Safe dead code removal (dry-run default) |
| `scripts/verify-docs.js` | Doc drift guardrail (runs in `npm run verify`) |

### Report parsers

| Format | Parser |
|--------|--------|
| JUnit XML | `scripts/parsers/junit.js` |
| Allure results dir | `scripts/parsers/allure.js` |
| Playwright JSON | `scripts/parsers/playwright.js` |
| Playwright HTML dir | `scripts/parsers/playwright-html.js` |
| Cypress JSON | `scripts/parsers/cypress.js` |
| Cucumber JSON | `scripts/parsers/cucumber.js` |
| Auto-detect | `scripts/parsers/index.js` |

### CI templates

| Template | Purpose |
|----------|---------|
| [templates/github-actions/gavel-verify.yml](../templates/github-actions/gavel-verify.yml) | Verify gate for adapter forks |
| [templates/gitlab-ci/gavel-self-check.yml](../templates/gitlab-ci/gavel-self-check.yml) | Self-check on target automation repo |
| [templates/apply-safe-workflow.md](../templates/apply-safe-workflow.md) | Orchestrator → refactor handoff |

### Example commands

```bash
node scripts/audit-report.js ../my-automation-repo --with-self-check --audit-format
node scripts/refactor-score.js ../my-automation-repo
node scripts/analyze-ci.js playwright-report/ --envelope --project MySuite
node scripts/affected-tests.js ../my-repo --tag smoke
```

## Skills and agents

- **Core skills:** `skills/*/SKILL.md` (26 skills — in default plugin manifest)
- **Companion skills:** `companion/skills/*/SKILL.md` (4 optional workflows)
- **Agents:** `agents/*.md` — workflow specialists
- **Templates:** `templates/result-envelope.md` — completion contract

Run `npm run verify` from the gavel package root before release.
