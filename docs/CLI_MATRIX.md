# CLI Completeness Matrix

Every name that looks like a “core command” in README / help must either ship a real executable path or be labeled **agent-only**.

**Exit contract (CLI):** `0` clean · `1` findings at/above threshold · `2` usage/config/schema error.

## Unified CLI (`npx gavel` / `scripts/cli.js`)

| Command | Implementation | Status |
|---------|----------------|--------|
| `gavel audit` | `scripts/audit-report.js` (+ self-check by default) | **CLI** |
| `gavel review` | `scripts/self-check.js` | **CLI** |
| `gavel self-check` | `scripts/self-check.js` | **CLI** |
| `gavel analyze` | `scripts/analyze-ci.js` | **CLI** |
| `gavel affected-tests` | `scripts/affected-tests.js` | **CLI** |
| `gavel detect` | `scripts/detect.js` | **CLI** |
| `gavel adoption` | `scripts/adoption-scan.js` | **CLI** (report-only, exit `0`) |
| `gavel flakiness` | `scripts/flakiness.js` | **CLI** (report-only, exit `0`; `2` on unreadable report) |
| `gavel explain <tag>` | Inline in `scripts/cli.js` (RULES registry) | **CLI** |
| `gavel companion --help` | Stub → points at `companion/README.md` | **CLI stub** (no workflow execution) |
| `gavel --help` | Lists CLI commands only | **CLI** |

Binary aliases (`gavel-audit`, `gavel-review`, …) resolve to the same `scripts/cli.js` entry.

## Supporting scripts (not separate `gavel <cmd>` verbs)

| Script | Purpose | Invoked by |
|--------|---------|------------|
| `scripts/to-sarif.js` | SARIF 2.1.0 serialization | `audit` / `self-check` / `review` via `--format sarif` |
| `scripts/audit-autofix.js` | Dead code dry-run / apply-safe | Skills / direct node |
| `scripts/suite-health.js` | Suite health scoring | `audit-report.js` |
| `scripts/refactor-score.js` | Before/after refactor delta | Skills / direct node |
| `scripts/generate-area-map.js` | Area map generation | Direct / audit tooling |

## Agent / skill only (no CLI verb today)

These are **optional IDE workflows**. Enterprise CI must not depend on them.

| Skill / agent surface | Notes |
|----------------------|--------|
| `gavel-heal`, `gavel-flake` | Diagnosis from evidence; heal may re-run failing tests (contract carve-out) |
| `gavel-refactor`, `gavel-debt` | Remediations / ledger — prompt skills |
| `gavel-impact` | Commit ↔ failure correlation (uses analyze envelopes) |
| `gavel-e2e`, `gavel-api`, `gavel-generator`, `gavel-init` | Authoring from provided patterns |
| `gavel-run` | Thin wrapper guidance for the **repo’s own** verify commands |
| `gavel-gain` | Suite-health narrative (machine scorecard export lands v0.10) |
| `gavel-ci-check`, `gavel-pr-prep` | Diff / branch workflow helpers |
| Framework profiles (`gavel-playwright`, …) | Pattern translation, not CI binaries |
| Companion: `gavel-ci`, `gavel-env`, `gavel-hub`, `gavel-close` | Explicitly non-core; see `companion/README.md` |

## Enterprise mandate

Platform teams should pin and gate on:

```text
npx gavel@<pinned> audit --format sarif
npx gavel@<pinned> self-check --format sarif
```

Anything agent-only stays out of the required PR check list until it graduates to a documented CLI command in a minor release.
