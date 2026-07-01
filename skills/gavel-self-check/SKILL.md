---
name: gavel-self-check
description: >
  Static Constitution violation scanner for automation repos. Detects assertion
  layering leaks, selector leaks, manual waits, missing DI, and oversized specs
  without step grouping. Use before audit, after refactors, or in CI pre-checks.
---

# Gavel Self-Check

Runs static checks against a target automation repository. Complements
`gavel-audit` (agent-driven, ranked report) with a fast, repeatable command.

## When to Use

- Before declaring a refactor complete
- After gavel-healer or gavel-refactor edits
- In CI as a lightweight Constitution gate
- When validating a new or imported test suite

## Command

From the gavel package root:

```bash
node scripts/self-check.js <target-automation-repo-root>
node scripts/self-check.js <target-automation-repo-root> --json
```

Exit code `0` = no violations. Exit code `1` = violations found.

## Rules (gavel-audit tags)

| Tag | Detects |
|-----|---------|
| `expect-in-action` | `expect`, `assert`, or assertion helpers in page/action/locator files |
| `selector-leak` | Raw selector APIs outside locator classes |
| `manual-wait` | `waitForTimeout`, `time.sleep`, `Thread.sleep`, fixed `cy.wait(ms)` |
| `no-di` | `new SomePage(` construction inside spec files |
| `no-step` | Large multi-test specs without `test.step()` grouping |

## Output

Human mode — one line per finding:

```text
selector-leak pages/admin/BillingPage.ts:42 — this.page.getByRole('button', { name: 'Save' })
```

JSON mode — machine-readable report with `summary` counts and `findings` array.
Feed into `gavel-analyze` or orchestrator handoff when violations block completion.

## Boundaries

- Static scan only — no test execution
- Heuristic, not exhaustive — pair with targeted test runs via `gavel-run`
- Does not replace `gavel-audit` suite-health metrics (dead POMs, duplicate factories)
- Golden fixtures: `fixtures/self-check/violations/` (verified by `npm run verify`)

## Completion

Self-check alone does not mean `DONE`. Pair with the result envelope in
`templates/result-envelope.md` and affected test evidence from `gavel-run`.
