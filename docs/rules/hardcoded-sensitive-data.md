# Rule: `hardcoded-sensitive-data`

Static self-check rule for hardcoded personal and financial identifiers in test specs.

## Intent

Prevent test source, reports, and review artifacts from exposing sensitive values. Findings identify the field and location but replace the literal with `hardcoded sensitive data`.

## Detection

The rule matches string assignments to explicitly sensitive field names such as email, SSN, social security number, national or tax ID, IBAN, account number, card number, and PAN.

| Dimension | Contract |
|-----------|----------|
| Surface | `gavel audit` and `gavel self-check` |
| Scope | Test/spec files only |
| Output | Redacted finding; never includes the matched literal |
| Remediation | Create the value through a test-data factory or protected fixture and mask it in logs |
| Focused check | `gavel self-check --rule hardcoded-sensitive-data --file <test-file>` |

## Boundaries

- Detection is based on explicit field names, not broad number or entropy heuristics.
- Values in source remain violations even when they look synthetic; clean tests obtain them from factories or protected fixtures.
- The rule does not inspect runtime traffic, external stores, or generated reports.
- A clean focused result does not replace a full-suite scan for other rule debt.