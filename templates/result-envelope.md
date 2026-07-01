# Gavel Result Envelope

Every specialist agent and implementer MUST return this structure. The orchestrator
refuses to summarize work as complete when required fields are missing.

## Status Values

| Status | When to use |
|--------|-------------|
| `DONE` | Code shipped, compile/lint passed, affected tests run with evidence |
| `INCOMPLETE` | Plan, analysis, or partial fix without test-run evidence |
| `BLOCKED` | Cannot proceed — missing credentials, access, human decision, or tooling |
| `APP BUG` | Product defect confirmed; automation must not be worked around |
| `ENV ISSUE` | Infrastructure, seed, config, or service availability problem |
| `FLAKY` | Intermittent failure; not reproducible on targeted re-run |

**Orchestrator rule:** no test command + pass/fail count → status is `INCOMPLETE`, not `DONE`.

## Required Template

```markdown
## Gavel Result

**Status:** DONE | INCOMPLETE | BLOCKED | APP BUG | ENV ISSUE | FLAKY

### Classification
- **Root cause:** test-maintenance-drift | test-bug | app-bug | env | seed | flake | none
- **Suspect commit(s):** <sha / message> or n/a
- **Remaining risk:** <one line>

### Changes
| File | Layer | Summary |
|------|-------|---------|
| | locator / action / spec / service / helper | |

### Verification
| Gate | Result | Detail |
|------|--------|--------|
| Compile | pass / fail / n/a | `<command>` |
| Lint | pass / fail / n/a | `<command>` |
| Tests | pass / fail / skipped | `<exact command>` |
| Pass count | | e.g. `8/8` targeted |

### Next Action
<single concrete step for the caller, or "none">
```

## Analysis-Only Agents

`gavel-impact`, `gavel-analyze`, and `gavel-fail-audit` do not ship code. They use:

- **Status:** `DONE` when the report is complete
- **Status:** `INCOMPLETE` when clustering or correlation was not finished
- Omit **Changes** and **Verification** tables when no code was edited
- Include **Next Action** pointing to the implementer (`gavel-healer`, `gavel-generator`, etc.)

### CI suite runs (`gavel-analyze`)

When ingesting CI via `analyze-ci.js`, use `--envelope` or map JSON into this template.
Required sections: **Classification**, **CI Summary**, **Failure Clusters**,
**Suspect Commits**, **Next Action**. See `scripts/ci-analysis-envelope.js`.

## Examples

### Complete (implementer)

```markdown
## Gavel Result

**Status:** DONE

### Classification
- **Root cause:** test-maintenance-drift
- **Suspect commit(s):** `a1b2c3d` — renamed billing toolbar actions
- **Remaining risk:** none for targeted billing specs

### Changes
| File | Layer | Summary |
|------|-------|---------|
| locators/admin/BillingLocators.ts | locator | Updated snapshot action roles |
| pages/admin/BillingPage.ts | action | Scoped row delete to table section |

### Verification
| Gate | Result | Detail |
|------|--------|--------|
| Compile | pass | `npx tsc --noEmit` |
| Lint | pass | n/a |
| Tests | pass | `npx playwright test tests/admin/billing/billing-snapshot-lifecycle.spec.ts` |
| Pass count | 3/3 |

### Next Action
none
```

### Incomplete (plan only)

```markdown
## Gavel Result

**Status:** INCOMPLETE

### Classification
- **Root cause:** test-maintenance-drift
- **Suspect commit(s):** pending gavel-impact
- **Remaining risk:** locators not yet updated; tests not run

### Changes
| File | Layer | Summary |
|------|-------|---------|

### Verification
| Gate | Result | Detail |
|------|--------|--------|
| Tests | skipped | not executed |

### Next Action
Delegate to gavel-healer: implement locator/action fixes and run affected billing specs.
```
