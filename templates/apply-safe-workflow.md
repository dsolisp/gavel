# Apply-Safe Workflow

When `gavel-review` or `gavel-audit` marks a finding as **`safe`**, the orchestrator may
delegate mechanical cleanup to **gavel-refactor** without a heal loop.

## Eligible tags

| Tag | Safe action |
|-----|-------------|
| `shrink` | Inline trivial steps in the diff only |
| `dead-locator` | Remove getter/method after `audit-autofix` dry-run confirms zero refs |
| `dead-pom` | Delete page object file after `audit-autofix` confirms zero refs |
| `unused-factory` | Remove export or delete file after `audit-autofix` confirms zero imports |

**Never auto-apply:** `blocker`, `fix`, `review`, or `report-only` findings.

## Orchestrator routing

```text
gavel-review / gavel-audit
  → findings include safe candidates?
      yes → gavel-refactor (apply-safe mode)
      no  → gavel-healer / human review
  → gavel-run (affected tests)
  → result envelope (DONE only with test evidence)
```

> **Note:** `affected-tests.js` for import-graph-based discovery is planned for v0.5.0. Until then, use `gavel-run` to execute the full suite or manually scope to affected specs.

## Refactor steps (apply-safe)

1. Run dry-run: `node scripts/audit-autofix.js <repo> --audit-format`
2. Confirm only `safe` items are in scope for this task
3. Apply: `node scripts/audit-autofix.js <repo> --apply`
4. Compile / lint
5. Run affected specs via `gavel-run` (or `affected-tests.js` when available in v0.5.0)
6. Return envelope with before/after candidate counts

## Ranked audit output

For repo-wide dead-code scan integrated with audit format:

```bash
node scripts/audit-report.js <automation-repo>
node scripts/audit-report.js <automation-repo> --with-self-check
```

## Completion rule

Apply-safe is **INCOMPLETE** without affected test run evidence — same as any refactor.
