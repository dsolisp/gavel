# Gavel v0.8.0 — Graduation Evidence Report

**Generated:** 2026-07-13
**Precision runner:** `scripts/verify-corpus-precision.js` (schema v1.0.0)
**Threshold:** ≥90% for `report` → `fix` | ≥95% for `fix` → `blocker`

---

## 1. Corpus Precision Results

### brittle-assert

| Metric | Value |
|---|---|
| Precision | **100%** |
| True Positives | 11 |
| False Positives | 0 |
| False Negatives | 0 |
| Flagged | 11 |
| Languages | java, py, ts |
| Corpus size | 22 samples (11 violating + 11 clean) |
| Scanner registered | Yes |

**Raw JSON:**
```json
{
  "tag": "brittle-assert",
  "precision": 1,
  "truePositives": 11,
  "falsePositives": 0,
  "falseNegatives": 0,
  "flagged": 11,
  "languages": ["java", "py", "ts"],
  "pass": true,
  "pendingScanner": false
}
```

---

## 2. Sample-Repo Trial Results

### hardcoded-env (seeking `fix` → `blocker`)

| Sample Repo | Files Scanned | hardcoded-env Findings | Expected |
|---|---|---|---|
| playwright | 7 | 0 | 0 (exempted) |
| cypress | 5 | 0 | 0 (exempted) |
| selenium | 6 | 0 | 0 (exempted) |
| webdriverio | 6 | 0 | 0 (exempted) |

**Sample-repos are explicitly exempted** from the hardcoded-env rule (scanner line 84: `scanRoot.includes('/fixtures/sample-repos/')`). The trial validates the exemption works correctly — zero uncontested false positives across all four sample repos.

### Fixture-level validation (hardcoded-env)

| Fixture Set | Findings | Expected |
|---|---|---|
| `fixtures/self-check/violations/hardcoded-env/` | 7 | 7 (all correct) |
| `fixtures/self-check/clean/hardcoded-env/` | 0 | 0 (no false positives) |

---

## 3. Diff-Fixture Trial Results

### assert-drop (strength-downgrade seeking `report` → `fix`)

| Diff Pair | Finding | Sub-case | Severity | Expected | Match |
|---|---|---|---|---|---|
| assertion-deleted | Yes | assertion-deleted | blocker | blocker | ✓ |
| early-return | Yes | early-return | blocker | blocker | ✓ |
| strength-downgrade | Yes | strength-downgrade | report | report | ✓ |
| consolidated | No | — | — | clean | ✓ |
| title-changed | No | — | — | clean | ✓ |

**Result:** 5/5 diff pairs match expected outcomes.

---

## 4. Graduation Summary

| Tag | Current | Proposed | Precision | FP | FN | Evidence | Verdict |
|---|---|---|---|---|---|---|---|
| `brittle-assert` | `report` | `fix` | 100% | 0 | 0 | Corpus: 22 samples, 3 languages | **GRADUATE** |
| `hardcoded-env` (credentials) | `fix` | `blocker` | n/a | 0 | — | Fixture: 7 TP, 0 FP. Sample-repo: 0 FP. No corpus populated. | **HOLD** |
| `complex-locator` | `report` | — | — | — | — | Score-based, no graduation expected | **STAYS** |
| `no-teardown` | `report` | — | — | — | — | Low confidence, no graduation in v0.8 | **STAYS** |
| `assert-drop` (strength-downgrade) | `report` | `fix` | n/a | — | — | Diff fixtures: 5/5 correct. No corpus populated. | **HOLD** |

---

## 5. Rationale per Decision

### brittle-assert → GRADUATE
Precision is 100% across 22 labeled samples spanning 3 languages (TypeScript, Python, Java), far exceeding the ≥90% threshold. Zero false positives and zero false negatives. The scanner is registered in RULES and the corpus is fully populated.

### hardcoded-env → HOLD
Fixture-level validation shows 7/7 correct detections and 0 false positives on clean fixtures. Sample-repo trial produces zero findings (exemption works). However, **no `fixtures/corpus/hardcoded-env/` directory with `labels.json` exists**, so there is no precision percentage computed by the corpus runner. Graduation to `blocker` requires ≥95% precision from a populated corpus per Implementation Contract #2.

### assert-drop (strength-downgrade) → HOLD
Diff-fixture trials show 5/5 correct outcomes across all sub-cases. The deterministic sub-cases (assertion-deleted, early-return) correctly produce `blocker`. The heuristic sub-case (strength-downgrade) correctly produces `report`. However, **no `fixtures/corpus/assert-drop/` directory with `labels.json` exists**, so there is no corpus precision run. Additionally, assert-drop runs via `gavel-review` (diff scanner), not the self-check corpus runner, so the standard corpus precision workflow does not directly apply. A dedicated diff-corpus precision harness would be needed.

### complex-locator → STAYS
Score-based rule by design. No graduation path in v0.8.

### no-teardown → STAYS
Low confidence heuristic (`confidence: 'low'`). No graduation planned for v0.8.

---

## 6. Additional Evidence Needed (HOLD items)

| Tag | Missing | Action Required |
|---|---|---|
| `hardcoded-env` | `fixtures/corpus/hardcoded-env/labels.json` with ≥10 violating + ≥10 clean samples across ≥2 languages | Populate corpus, run precision runner, verify ≥95% |
| `assert-drop` | Diff-aware corpus or dedicated precision harness | Design diff-corpus precision measurement (out of scope for v0.8 standard corpus runner) |
