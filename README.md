<p align="center">
  <img width="400" height="400" alt="gavel" src="https://github.com/user-attachments/assets/94ac2e95-0f1b-4965-a720-3846c055d6c2" />

  <h1 align="center">Gavel</h1>
  <p align="center">
    <em>Test-code quality enforcement for AI agents.</em><br>
    <em>One test. One verdict. Move on.</em>
  </p>
  <p align="center">
    <img src="https://img.shields.io/github/v/release/dsolisp/gavel?style=flat-square&label=release" alt="Release">
    <img src="https://github.com/dsolisp/gavel/actions/workflows/gavel-verify.yml/badge.svg" alt="CI">
    <img src="https://img.shields.io/badge/works%20with-20%2B%20IDEs-blue?style=flat-square" alt="Works with 20+ IDEs">
    <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT license">
  </p>
</p>

---

Gavel is an independent QA discipline project for automation repos. It enforces **lean suites**, **trustworthy test code**, and **resilient structure** across Playwright (TS/JS, pytest-playwright, and Playwright.NET), Selenium (incl. Selenium C#), Appium (.NET mobile-native), Cypress, WebdriverIO, Cucumber, and Robot — without turning into a full QA platform. The C# / .NET ecosystem (NUnit/xUnit/MSTest/SpecFlow/Reqnroll/FluentAssertions) is a first-class audited surface as of v0.10.0.

Inspired by [ponytail](https://github.com/DietrichGebert/ponytail)'s minimalism. Not a fork. No upstream sync required.

## First run (< 60s)

```bash
git clone https://github.com/dsolisp/gavel.git
cd gavel
npm run verify                        # dogfood the verify gate
node scripts/cli.js self-check ../your-automation-repo
node scripts/cli.js audit ../your-automation-repo --with-self-check --audit-format
```

Or gate CI with **SARIF 2.1.0** (no LLM required):

```bash
npx --yes @dsolisp/gavel@0.10.0 audit --format sarif > gavel.sarif
```

Copy the GitHub Actions recipe from [templates/github-actions/gavel-audit-sarif.yml](templates/github-actions/gavel-audit-sarif.yml). Enterprise trust criteria, Sonar import, and exit codes: [docs/ENTERPRISE.md](docs/ENTERPRISE.md).

Install into your IDE (Cursor, Claude Code, OpenCode, Windsurf, and 16+ more) using [QUICKSTART.md](QUICKSTART.md), then invoke `/gavel-audit` or `/gavel-review` on your test repo.

### Sample repos

Seven complete example projects under `fixtures/sample-repos/` — **Playwright**, **Playwright.NET**, **Appium.NET**, **Selenium**, **Selenium.NET**, **Cypress**, and **WebdriverIO** — each with good and bad examples showing Gavel's constitution rules applied to real test code. Run the self-check against them to see verdicts in action.

## What can gavel do for me?

| I want to… | Command / skill | Outcome |
|------------|-----------------|---------|
| Scan my suite for bloat and violations | `/gavel-audit` | Ranked scoreboard: dead POMs, leaks, waits, markers |
| Review a test diff before merge | `/gavel-review` | One line per constitution violation |
| Enforce layering in CI | `node scripts/self-check.js .` | Blocker/fix report with exit code |
| Understand a CI failure cluster | `/gavel-analyze` | Classified clusters + next agent |
| Fix a failing test | `/gavel-heal` | Verdict: test bug, app bug, env, or flake |
| Remove safe dead code | `/gavel-refactor` (apply-safe) | Dead locators/POMs removed with test evidence |
| Detect my stack | `/gavel-detect` | Activates the right framework profile |
| Explain a rule or finding | `/gavel explain` | Human-readable explanation of any verdict |
| Prepare a branch for PR | `/gavel-pr-prep` | Commit, merge main, verify FF, push |
| Write UI/API tests in existing patterns | `/gavel-e2e`, `/gavel-api` | Test code using your repo's architecture |
| Track deferred test decisions | `/gavel-debt` | Ledger of `gavel:` comments |
| See suite health at a glance | `/gavel-gain` | Pass rate, flake count, LOC per test |
| Check CI safety before merge | `/gavel-ci-check` | Diff-based env var / secret / dep audit |

Run `gavel companion --help` for optional companion workflows (CI migration, env setup, hub credentials, issue closure — not in default install).

## Core commands

| Command | What it does |
|---------|-------------|
| `/gavel [lite \| full \| strict \| off]` | Set intensity level |
| `/gavel-audit` | Whole-repo audit + suite health scoreboard |
| `/gavel-review` | Review test diffs for constitution violations |
| `/gavel-self-check` | Static constitution scanner (12 rules, multi-framework) |
| `/gavel-heal` | Diagnose a failing test |
| `/gavel-analyze` | Parse CI report, cluster failures |
| `/gavel-refactor` | Improve test code; apply-safe dead code removal |
| `/gavel-detect` | Auto-detect your test stack |
| `/gavel-explain` | Explain any rule or finding |
| `/gavel-ci-check` | Diff-based CI safety verdict |
| `/gavel-pr-prep` | Automated PR preparation |
| `/gavel-help` | Quick reference |

## Feature grid

| Area | What Gavel enforces |
|------|---------------------|
| **Layering** | Locators → actions → specs; no assertion leakage |
| **Locators** | Semantic/accessibility first; no raw selector chains outside locator classes |
| **Waits** | Native retry assertions; no arbitrary sleeps |
| **DI** | Fixtures over `new PageObject(page)` in specs |
| **Suite health** | Dead POMs/locators/factories, skip markers, bare `test.fail()` |
| **Suppression** | Tag-scoped `@gavel-ignore(TICKET-123)` — unreasoned suppressions flagged |
| **SARIF export** | Valid SARIF 2.1.0 output for GitHub Code Scanning & CI dashboards |
| **Result envelope** | Schema-wrapped output (`schemaVersion`, `findings`, `summary`) for machine piping |
| **Config schema** | `gavel.config.json` with JSON Schema validation — declare rules, scans, suppressions |
| **Area map** | Auto-generated from `tests/` + `pages/` structure, with manual overrides |
| **Boundary guard** | Mechanical enforcement of Gavel/Bailiff scope separation |
| **CI intelligence** | JUnit, Allure, Playwright, Cypress, Cucumber parsers + clustering |
| **Evidence gate** | Compile + affected tests before declaring done |
| **Frameworks** | Playwright (TS/JS, pytest-playwright, .NET), Appium (.NET), Selenium (incl. C#), Cypress, WebdriverIO, Cucumber, Robot |

## Example output

```text
Gavel audit report — ../my-automation-repo
blocker review manual-wait Manual sleeps or arbitrary polling. [pages/actions/ExampleActions.ts:L42]
fix review selector-leak Raw selector chains outside locator classes. [pages/actions/ExampleActions.ts:L18]

Suite health:
  Dead POMs: 2
  Dead locators: 5
  Unused factories: 1
  Selector leaks: 3
  Manual waits: 7
  Skip/quarantine markers: 0
  Bare test.fail markers: 1
  Constitution violations: 11
  Critical-area violations: 4
  Safe autofix candidates: 8
  Top areas:
    tests/e2e/catalog: 6
```

## Scripts (run on any automation repo)

| Script | Purpose |
|--------|--------|
| `scripts/cli.js` | Unified CLI — dispatches all commands (`gavel <command>`) |
| `scripts/self-check.js` | Constitution violation scan (12 rules, multi-framework) |
| `scripts/audit-report.js` | Ranked audit + suite health (`--with-self-check`) |
| `scripts/to-sarif.js` | SARIF 2.1.0 export for CI dashboards |
| `scripts/detect.js` | Auto-detect test automation stack |
| `scripts/generate-area-map.js` | Auto-generate area map from directory structure |
| `scripts/validate-envelope.js` | Validate result envelope against JSON schema |
| `scripts/validate-manifest.js` | Validate plugin.yaml manifest |
| `scripts/verify-boundary.js` | Enforce Gavel/Bailiff scope separation |
| `scripts/refactor-score.js` | Before/after line + violation delta |
| `scripts/affected-tests.js` | Transitive affected spec discovery |
| `scripts/analyze-ci.js` | Parse CI report, cluster, correlate commits |

Report parsers: `junit`, `allure`, `playwright`, `playwright-html`, `cypress`, `cucumber`.

## Install

See [QUICKSTART.md](QUICKSTART.md) for IDE-specific paths. OpenCode npm package:

```json
{ "plugin": ["@dsolisp/gavel"] }
```

## Docs

| Doc | Audience |
|-----|----------|
| [QUICKSTART.md](QUICKSTART.md) | First session — audit, heal, write (7 end-to-end flows) |
| [docs/ENTERPRISE.md](docs/ENTERPRISE.md) | CI gate, SARIF recipes, trust criteria (platform teams) |
| [docs/README.md](docs/README.md) | Script reference and CI templates |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Two-repo architecture (Gavel + Bailiff) |
| [AGENTS.md](AGENTS.md) | Universal QA rules for all adapters |
| [CHANGELOG.md](CHANGELOG.md) | Release history |

## Development

```bash
npm run verify    # all gates including docs drift + unit tests
```

## License

[MIT](LICENSE). QA discipline layer inspired by [ponytail](https://github.com/DietrichGebert/ponytail) minimalism.
