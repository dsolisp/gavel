---
name: gavel-architect-review
description: Runs Gavel strict audit and then a read-only, evidence-based QA architecture audit for risks deterministic rules cannot prove. Use for combined strict plus manual audits of automation repositories.
---

# Gavel Architect Review

Run both audits. The manual review complements strict; it never replaces or weakens it.

## Procedure

1. Detect the repository stack and its native verification commands.
2. Run the deterministic gate first:

```bash
gavel audit <repo> --preset strict --format json --out <temporary-path>/gavel-strict.json
```

Exit `1` means findings were produced and is valid audit evidence. Exit `2` blocks the review until the usage or configuration error is resolved.

3. Read the strict result and build a set of its file, line, and tag findings.
4. Manually inspect only risks that require cross-file or semantic judgment:
   - shared mutable sessions, accounts, drivers, pages, or execution-order state
   - dead POMs, locators, factories, and helpers missed by static reference analysis
   - fixture or dependency-injection bypass
   - assertions hidden in actions or helpers when aliases evade deterministic rules
   - non-idempotent cleanup and state leakage
   - duplicated workflows or page objects across modules
   - secrets, sensitive data, and endpoints not covered by deterministic rules
   - broad responsibilities, deep inheritance, and dependency-direction violations
5. Confirm every manual finding from surrounding code. Do not report search hits without evidence.
6. De-duplicate manual findings already represented by strict.
7. Return one combined report with separate `strict` and `manual` sections.

A strict `selector-leak` finding is not a false positive merely because a legacy `*Page` class owns locators and actions together. Under Gavel's locator boundary, only a dedicated locator class owns `AppiumBy`, `MobileBy`, `By`, or equivalent selector construction. Report a mixed Page Object as architecture debt; do not suppress the deterministic finding by inheritance or filename alone.

## Severity

- `P0`: exposes secrets or makes test verdicts unreliable.
- `P1`: architecture or shared state likely to replicate failures.
- `P2`: maintainability or framework-pattern drift.
- `P3`: hygiene, duplication, or scanner coverage gaps.

## Output

Include:

- strict command, exit code, counts by tag, and artifact path
- manual search areas and files inspected
- manual findings ordered P0 to P3 with file and line evidence
- producer (`strict-cli`, `architect-agent`, or `human`) and validation status for each interpretation
- why each manual finding was not represented by strict
- combined verdict: `CLEAN`, `FINDINGS`, or `INCOMPLETE`

`CLEAN` requires a completed strict audit and completed manual review. Never convert strict exit `1` into a clean verdict.

## Boundaries

Read-only. Do not modify product or test code. Never print complete credentials, tokens, personal identifiers, account numbers, or card numbers; mask values to prefix and suffix. Delegate remediation to `gavel-healer` or `gavel-refactor` and require executable verification.

The CLI does not yet emit a versioned execution-provenance manifest containing normalized command, config hash, agent/skill, human decisions, and retained artifacts. Record these fields in the combined report until that machine contract is added.
