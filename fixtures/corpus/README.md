# Corpus fixtures

Golden labeled samples for heuristic precision measurement (Implementation Contract #2).

## Layout

```text
fixtures/corpus/<tag>/
  labels.json          # corpus labels document (schemaVersion 1.0.0)
  violating/...        # samples labeled violating
  clean/...            # samples labeled clean
```

Tag directories are added when each heuristic builds its corpus (v0.8 items #3+). This directory may be empty of tag data; `npm run verify` still runs the precision runner and exits 0.

## `labels.json` contract

Schema: [`schemas/corpus-labels.schema.json`](../../schemas/corpus-labels.schema.json)

| Field | Notes |
|-------|--------|
| `schemaVersion` | `"1.0.0"` only until a documented bump |
| `tag` | Must equal the directory name |
| `samples[].file` | Path relative to the tag directory (posix `/`) |
| `samples[].label` | `violating` or `clean` |
| `samples[].language` | e.g. `ts`, `js`, `py` — corpus needs ≥2 languages per tag |
| `samples[].framework` | e.g. `playwright`, `pytest` |
| `samples[].rationale` | One-line label justification |
| `samples[].expectedFindings` | `{ line, tag }[]` — required non-empty for `violating`; omit or `[]` for `clean` |

## Precision

`scripts/verify-corpus-precision.js` scans each tag corpus with self-check and reports:

- **Precision** = true positives / flagged findings for that tag
- **TP** = finding matches an `expectedFindings` entry (same file, line, tag)
- **FP** = finding for the tag with no matching expected entry
- **FN** = expected entry with no matching finding

Graduation floors (Contract #2): `report` → `warning` ≥ **0.90**; `warning` → `blocker` ≥ **0.95** with zero corpus FPs.

Precision report schema: [`schemas/corpus-precision-report.schema.json`](../../schemas/corpus-precision-report.schema.json)
