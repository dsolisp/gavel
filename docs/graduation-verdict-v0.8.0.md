# Gavel v0.8.0 — Graduation Tier-R Verdict (Step B)

**Reviewer role:** Tier-R (Cross-review) — did NOT implement any of these rules.
**Evidence under review:** `docs/graduation-evidence-v0.8.0.md` (Step A)
**Governing contract:** AGENTS.md Implementation Contract #2; GAVEL_ROADMAP.md line 104.
**Reviewer constraint:** Produces verdict only. Does NOT edit code or change severities.

---

## Overall Verdict

**APPROVE** — The Step A evidence report's verdicts are all correct. One GRADUATE
(`brittle-assert`) is confirmed and may proceed to Step C. Both HOLDs are correctly
held. Three findings are raised below for the record; none block the `brittle-assert`
graduation.

---

## 1. Summary Table

| Tag | Current | Proposed | Precision | FP | FN | Verdict |
|---|---|---|---|---|---|---|
| `brittle-assert` | `report` | `fix` | 100% | 0 | 0 | **APPROVE GRADUATE** |
| `hardcoded-env` (credentials) | `fix` | `blocker` | n/a | 0* | — | **APPROVE HOLD** |
| `complex-locator` | `report` | — | — | — | — | **APPROVE STAYS** |
| `no-teardown` | `report` | — | — | — | — | **APPROVE STAYS** |
| `assert-drop` (strength-downgrade) | `report` | `fix` | n/a | — | — | **APPROVE HOLD** |

\* The hardcoded-env sample-repo FP count of 0 is non-evidentiary — see Finding F1.

---

## 2. Rationale per Decision

### `brittle-assert` — APPROVE GRADUATE (`report` → `fix`)
Corpus precision is 100% (11 TP / 0 FP / 0 FN) across 3 languages, exceeding the ≥90%
threshold for `report` → `fix`. The corpus is well-constructed: violating samples use
punctuated/multi-word prose literals; clean samples cover numbers, booleans, enums,
short tokens, and a same-file-const provenance case. No sample-repo trial is required
for this graduation tier. **May proceed to Step C.**

### `hardcoded-env` — APPROVE HOLD (`fix` → `blocker`)
Graduation to `blocker` requires ≥95% precision from a populated corpus AND a
sample-repo trial with zero uncontested FPs (roadmap line 104). No
`fixtures/corpus/hardcoded-env/` exists, so no precision percentage was computed.
The HOLD is correct. Additionally, the sample-repo evidence gathered is vacuous (F1).

### `complex-locator` — APPROVE STAYS
Score-based heuristic by design (roadmap line 154). No graduation path in v0.8.

### `no-teardown` — APPROVE STAYS
Low-confidence heuristic (`confidence: 'low'`), explicitly "never blocker in v0.8"
(roadmap line 155). No graduation path.

### `assert-drop` (strength-downgrade) — APPROVE HOLD (`report` → `fix`)
Diff-fixture trials show 5/5 correct outcomes. However, assert-drop is a diff-only rule
in `REVIEW_RULES` (runs via `gavel-review`), and the corpus precision runner only
invokes `self-check`. The graduation criterion "requires corpus run" (prompts line 659)
is ill-defined for a diff-only rule (F3). HOLD is correct pending a defined measurement.

---

## 3. Findings

| # | Item | File:line | Issue | Severity | Suggested fix |
|---|---|---|---|---|---|
| F1 | `hardcoded-env` sample-repo trial | `scripts/self-check.js:84` | The rule short-circuits (`return []`) when `scanRoot` includes `/fixtures/sample-repos/`. The "0 findings across 4 repos" in the evidence report is therefore vacuous — the rule never examined those files. Framing this as "zero uncontested false positives" overstates the evidence. | Medium | Evidence report should mark the sample-repo row as "non-evidentiary (path-exempted)" rather than "0 FP". A real trial requires scanning a non-exempted realistic repo, or temporarily lifting the exemption on a throwaway copy. |
| F2 | `brittle-assert` corpus size | `fixtures/corpus/brittle-assert/labels.json` | 22 hand-crafted samples (authored in the same release cycle as the scanner) yielding 100% precision is statistically weak and at risk of circular validation. The prompts file itself acknowledges this (line 676: "~20 samples per tag the estimate is statistically weak"). | Low | Does NOT block `report` → `fix` (only ≥90% precision is required at this tier; sample-repo trial is not required until `blocker`). Note the weakness on the record. For any future `fix` → `blocker` push, a sample-repo trial becomes mandatory. |
| F3 | `assert-drop` graduation criterion | `v0.8.0-prompts.txt:659` | The criterion "requires corpus run" is undefined for a diff-only rule. The corpus runner (`verify-corpus-precision.js`) invokes `self-check`, which cannot exercise `gavel-review`'s diff scanner. | Low | Roadmap author should define a diff-aware precision measurement (e.g., a diff-corpus harness with before/after pairs and expected sub-case verdicts) before this graduation can be evaluated. Out of scope for v0.8 ship. |

---

## 4. HOLD — Additional Evidence Needed

| Tag | Gap | Required before graduation |
|---|---|---|
| `hardcoded-env` | No populated corpus; sample-repo trial is vacuous (F1) | (1) Populate `fixtures/corpus/hardcoded-env/labels.json` (≥10 violating + ≥10 clean, ≥2 languages). (2) Run precision runner, verify ≥95%. (3) Run a real sample-repo trial on a non-exempted realistic repo with zero uncontested FPs. |
| `assert-drop` | No diff-aware precision measurement defined (F3) | Define and build a diff-corpus precision harness before the strength-downgrade sub-case can graduate. |

---

## 5. DEMOTE — Current Severity Too High?

No demote findings. All current severities are appropriate:
- `hardcoded-env` at `fix` matches the roadmap ship severity (`warning`; credentials → `blocker` only after trial).
- `assert-drop` deterministic sub-cases at `blocker` are justified by literal-string title comparison (deterministic, not heuristic).
- `complex-locator` and `no-teardown` at `report` match their heuristic/score-based nature.

---

## 6. Action for Step C

**Only `brittle-assert` is cleared to graduate.** Step C (Tier-A implementer, same
model family as the original brittle-assert implementer) may update the `brittle-assert`
severity in `scripts/self-check.js`:
- `severity`: `info` → `warning`
- `envelopeSeverity`: `report` → `fix`

No other severity changes are authorized by this verdict.
