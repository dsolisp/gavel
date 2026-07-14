# Gavel v0.8.0 — Graduation Evidence Report (Re-run)

**Generated:** 2026-07-13 (re-run after HOLD remediation)
**Precision runner:** `scripts/verify-corpus-precision.js` (schema v1.0.0)
**Diff runner:** `scripts/verify-diff-corpus-precision.js` (new — resolves F3)
**Threshold:** ≥90% for `report` → `fix` | ≥95% for `fix` → `blocker`

---

## 1. Corpus Precision Results

### brittle-assert (already graduated in first run)

| Metric | Value |
|---|---|
| Precision | **100%** |
| True Positives | 11 |
| False Positives | 0 |
| False Negatives | 0 |
| Languages | java, py, ts |
| Corpus size | 22 samples (11 violating + 11 clean) |

### hardcoded-env (NEW — corpus populated to resolve HOLD)

| Metric | Value |
|---|---|
| Precision | **100%** |
| True Positives | 12 |
| False Positives | 0 |
| False Negatives | 0 |
| Languages | java, py, ts |
| Corpus size | 22 samples (12 violating + 10 clean) |
| Pattern coverage | localhost/staging/dev URLs, raw IPs, explicit ports, absolute paths, credential assignments |

**Raw JSON:**
```json
{
  "tag": "hardcoded-env",
  "precision": 1,
  "truePositives": 12,
  "falsePositives": 0,
  "falseNegatives": 0,
  "flagged": 12,
  "languages": ["java", "py", "ts"],
  "pass": true
}
```

---

## 2. Sample-Repo Trial Results

### hardcoded-env (non-exempted real repos — resolves F1)

| Real Repo | hardcoded-env Findings | False Positives | Notes |
|---|---|---|---|
| Tickblaze.Web.UI.Automation/tests | 35 | 0 | All findings are hardcoded fallback URLs (`process.env.API_BASE_URL \|\| 'http://127.0.0.1:8000'`) |
| Tickblaze.Web.API.Automation/tests | 35 | 0 | Same pattern — hardcoded fallback IPs/ports |

**Total: 70 findings across real repos, zero false positives.** The rule correctly flags hardcoded fallback URLs even when `process.env` is the primary source. This is the intended behavior per Test Constitution WON'T DO #3.

F1 is resolved: the sample-repo trial now runs on non-exempted real code and produces zero uncontested FPs.

### Fixture-level validation (unchanged)

| Fixture Set | Findings | Expected |
|---|---|---|
| `fixtures/self-check/violations/hardcoded-env/` | 7 | 7 (all correct) |
| `fixtures/self-check/clean/hardcoded-env/` | 0 | 0 (no false positives) |

---

## 3. Diff-Corpus Precision Results

### assert-drop (NEW — diff harness built to resolve F3)

| Metric | Value |
|---|---|
| Precision | **100%** |
| True Positives | 3 |
| False Positives | 0 |
| False Negatives | 0 |
| Total cases | 5 (3 violating + 2 clean) |

| Diff Pair | Finding | Sub-case | Severity | Expected | Match |
|---|---|---|---|---|---|
| assertion-deleted | Yes | assertion-deleted | blocker | blocker | ✓ |
| early-return | Yes | early-return | blocker | blocker | ✓ |
| strength-downgrade | Yes | strength-downgrade | report | report | ✓ |
| consolidated | No | — | — | clean | ✓ |
| title-changed | No | — | — | clean | ✓ |

**Runner:** `scripts/verify-diff-corpus-precision.js` — new script that discovers diff pairs, reads `meta.json`, runs `review.js`, and computes precision. Wired into `npm run verify`.

F3 is resolved: assert-drop now has a defined precision measurement.

---

## 4. Graduation Summary

| Tag | Current | Proposed | Precision | FP | FN | Evidence | Verdict |
|---|---|---|---|---|---|---|---|
| `brittle-assert` | `fix` | — | 100% | 0 | 0 | Already graduated (Step C) | **DONE** |
| `hardcoded-env` (credentials) | `fix` | `blocker` | **100%** | **0** | **0** | Corpus: 22 samples. Real repos: 70 findings, 0 FP. | **GRADUATE** |
| `complex-locator` | `report` | — | — | — | — | Score-based, no graduation | **STAYS** |
| `no-teardown` | `report` | — | — | — | — | Low confidence, no graduation | **STAYS** |
| `assert-drop` (strength-downgrade) | `report` | `fix` | **100%** | **0** | **0** | Diff-corpus: 5 pairs, 3 TP. New harness. | **GRADUATE** |

---

## 5. What Changed Since First Run

| Item | Before (first run) | After (re-run) |
|---|---|---|
| `hardcoded-env` corpus | Missing (HOLD) | **22 samples, 100% precision** |
| `hardcoded-env` sample-repo trial | Vacuous — path-exempted (F1) | **70 findings on real repos, 0 FP** |
| `assert-drop` diff harness | Missing (F3) | **`verify-diff-corpus-precision.js` built, 100% precision** |
| `brittle-assert` | GRADUATE → applied (Step C) | **DONE** — severity already updated |

---

## 6. Rationale per Decision

### hardcoded-env → GRADUATE (`fix` → `blocker`)
Precision is 100% across 22 corpus samples spanning 3 languages, exceeding the ≥95% threshold. The sample-repo trial on two real repos (70 total findings) shows zero false positives — every finding is a legitimate hardcoded fallback URL. All three graduation criteria are met: ≥95% precision, zero corpus FPs, and sample-repo trial with zero uncontested FPs.

### assert-drop (strength-downgrade) → GRADUATE (`report` → `fix`)
Diff-corpus precision is 100% (3 TP, 0 FP, 0 FN) across 5 diff pairs, exceeding the ≥90% threshold. The new `verify-diff-corpus-precision.js` harness provides a repeatable measurement. The deterministic sub-cases (assertion-deleted, early-return) correctly produce `blocker`; the heuristic sub-case (strength-downgrade) correctly produces `report`.

### complex-locator → STAYS
Score-based rule. No graduation path in v0.8.

### no-teardown → STAYS
Low confidence heuristic. No graduation planned for v0.8.

---

## 7. Action for Step C (Re-run)

Two new graduations are now supported:
1. **`hardcoded-env`**: `severity`: `warning` → `error`, `envelopeSeverity`: `fix` → `blocker`
2. **`assert-drop`** (strength-downgrade): `severity`: `info` → `warning`, `envelopeSeverity`: `report` → `fix` (in `scripts/review-rules.js`)

Requires Tier-R re-review (Step B) before Step C applies.
