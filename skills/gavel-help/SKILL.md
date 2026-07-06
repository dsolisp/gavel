---
name: gavel-help
description: >
  Quick-reference card for core gavel modes, skills, and commands.
  One-shot display, not a persistent mode. Trigger: /gavel-help,
  "gavel help", "what gavel commands", "how do I use gavel".
---

# Gavel Help

Display this reference card when invoked. One-shot, do NOT change mode,
write flag files, or persist anything.

## Levels

| Level | Trigger | What changes |
|-------|---------|-------------|
| **Lite** | `/gavel lite` | Write what's asked, name the leaner test approach in one line. |
| **Full** | `/gavel` | QA ladder enforced. Default. |
| **Strict** | `/gavel strict` | Zero tolerance. Every Test Constitution rule is a hard gate. |

## Core skills (default install)

| Skill | Trigger | What it does |
|-------|---------|--------------|
| **gavel** | `/gavel` | QA discipline mode. Test Constitution enforcement. |
| **gavel-review** | `/gavel-review` | Test diff review: Constitution violations. |
| **gavel-audit** | `/gavel-audit` | Suite health scoreboard + ranked findings. |
| **gavel-self-check** | `/gavel-self-check` | Static constitution scanner (`scripts/self-check.js`). |
| **gavel-heal** | `/gavel-heal` | Diagnose failing test: test bug, app bug, env, flake. |
| **gavel-analyze** | `/gavel-analyze` | Post-run failure clustering + classification. |
| **gavel-refactor** | via agent | Improve test code; apply-safe dead code removal. |
| **gavel-detect** | `/gavel-detect` | Auto-detect stack and activate profile. |
| **gavel-run** | `/gavel-run` | Compile + affected test verification gate. |
| **gavel-debt** | `/gavel-debt` | Harvest `gavel:` deferral comments. |
| **gavel-gain** | `/gavel-gain` | Suite-health scoreboard from test results. |
| **gavel-plan** | `/gavel-plan` | Test planning and coverage gaps. |
| **gavel-e2e** | `/gavel-e2e` | E2E test authoring in existing patterns. |
| **gavel-api** | `/gavel-api` | API test authoring in existing patterns. |
| **gavel-bug** | `/gavel-bug` | Bug report from test-confirmed APP BUG only. |
| **gavel-triage** | `/gavel-triage` | Source navigation for test-confirmed failures. |
| **gavel-auth** | `/gavel-auth` | Multi-tenant auth for tests. |
| **gavel-flake** | `/gavel-flake` | Flaky test triage and quarantine. |
| **gavel-init** | `/gavel-init` | Bootstrap new QA project scaffold. |
| **gavel-help** | `/gavel-help` | This card. |

## Companion skills (optional)

See `companion/README.md`. Not in default plugin manifest.

| Skill | What it does |
|-------|--------------|
| **gavel-ci** | Cloud CI migration and pipeline setup |
| **gavel-env** | Local environment start, seed, verification |
| **gavel-hub** | Hub/external API credential setup |
| **gavel-close** | Issue-tracker closure summaries |

## Deactivate

Say "stop gavel" or `/gavel off`. Resume with `/gavel`.

## More

Full docs: https://github.com/dsolisp/gavel
