# Gavel 0.12.1

Release date: 2026-09-09

Gavel 0.12.1 tightens the boundary between AI guidance and deterministic QA enforcement. The CLI gains stable version, JSON, output-file, and focused-filter contracts; sensitive test data is detected without exposing values; and manual-wait interpretations are explicitly marked as unvalidated heuristics.

## Highlights

- `gavel --version`, `gavel version`, and `gavel -v`.
- `--format json` and `--out <path>` through the unified CLI.
- `--rule <id>` and `--file <relative-path>` for focused audit/self-check verdicts.
- Redacted `hardcoded-sensitive-data` rule across C#, Java, Python, and TypeScript.
- `gavel-architect-review` strict-then-manual read-only workflow.
- Azure DevOps PR reviewer runtime and shadow-mode integration contracts.
- Manual-wait interpretation provenance: static heuristic, unvalidated until supported by execution or human evidence.

## Install

```bash
npm install --save-dev @dsolisp/gavel@0.12.1
npx gavel --version
```

## CI gate

```bash
npx --yes @dsolisp/gavel@0.12.1 audit --format sarif > gavel.sarif
```

Exit codes remain `0` clean, `1` findings, and `2` usage/configuration/schema error. `ado-pr-review` additionally reserves `3` for infrastructure failure and `4` for a stale PR commit.