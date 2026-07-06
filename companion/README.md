# Gavel Companion Workflows

Optional skills that extend Gavel beyond core test-code quality enforcement.
They remain in the repo for teams that need them, but they are **not** part of
the default install surface, orchestrator happy path, or `plugin.yaml` core commands.

## Companion skills

| Skill | Purpose |
|-------|---------|
| [gavel-ci](skills/gavel-ci/SKILL.md) | Cloud CI migration and pipeline setup |
| [gavel-env](skills/gavel-env/SKILL.md) | Local environment start, seed, and verification |
| [gavel-hub](skills/gavel-hub/SKILL.md) | External API / hub credential setup |
| [gavel-close](skills/gavel-close/SKILL.md) | Issue-tracker closure summaries after QA |

## Install

Copy the skill directory into your IDE skills folder, or invoke by path:

```text
companion/skills/gavel-ci/SKILL.md
```

Core Gavel commands (`gavel-audit`, `gavel-review`, `gavel-self-check`, etc.)
live in `skills/` and do not require companion skills.
