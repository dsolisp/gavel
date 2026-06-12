# Caveman vs Ponytail — 2026-06-12

5 coding tasks × fresh subagent per config, same model. Tokens = agent total
(includes thinking). Code lines = fenced blocks in the deliverable, approx.
n=1 per cell — durations carry noise.

## Ponytail v1 (before this benchmark)

| Task | Baseline | Caveman | Ponytail v1 |
|---|---|---|---|
| email | 31,971 tok · 104s · ~34 loc | 26,464 · 20s · ~25 | 27,582 · 32s · 6 |
| debounce | 23,966 · 25s · ~38 | 26,496 · 19s · ~36 | 27,812 · 33s · 6 |
| csv-sum | 22,607 · 11s · 6 | 26,062 · 13s · 6 | 26,867 · 20s · 7 |
| react-countdown | 44,629 · 208s · ~190 | 26,656 · 21s · ~30 | 28,748 · 49s · 13 |
| rate-limit | 38,782 · 131s · ~25 | 32,732 · 63s · ~20 | 32,579 · 93s · ~21 |
| **Total** | **161,955 · 479s · ~293** | **138,410 · 136s · ~117** | **143,588 · 228s · ~53** |

### v1 findings

1. Code minimalism: ponytail dominated (2.2× fewer lines than caveman, 5.5× fewer than baseline).
2. Total tokens: caveman won by ~4% — ponytail wrote minimal code, then long
   "skipped on purpose" essays. Prose ate the code savings.
3. Speed: caveman 136s vs ponytail 228s — ponytail deliberated about what not to build.
4. Floor effect: on already-minimal tasks (csv-sum) both skills pay ~3k tokens
   skill-read tax over baseline.

## Ponytail v2 (after fixes)

v2 changes: Output cap (code + ≤3 short lines, "if the explanation is longer
than the code, delete the explanation"), ladder-is-a-reflex clause
(anti-deliberation), ship-and-question rule (never stall on "do you need X?").

| Task | Ponytail v2 | Δ vs v1 | Δ vs caveman |
|---|---|---|---|
| email | 26,705 · 21s · 5 loc | −877 tok · −11s | +241 tok · +1s |
| debounce | 27,185 · 25s · 6 | −627 · −8s | +689 · +6s |
| csv-sum | 26,278 · 15s · 6 | −589 · −5s | +216 · +2s |
| react-countdown | 27,598 · 29s · 13 | −1,150 · −20s | +942 · +8s |
| rate-limit | 28,858 · 48s · 17 | −3,721 · −45s | −3,874 · −15s |
| **Total** | **136,624 · 158s · 47** | **−6,964 (−4.8%) · −70s (−31%)** | **−1,786 (−1.3%) · +22s** |

## Verdict

| Area | Winner |
|---|---|
| Code size | **Ponytail** — 47 vs 117 lines (2.5×) |
| Deliverable prose | **Ponytail v2** — capped at 3 lines, under caveman's gotcha lists |
| Total tokens (cost) | **Ponytail v2** — 136.6k vs 138.4k |
| Wall time | Caveman by 16% (was 68% in v1) — within n=1 noise |
| Follow-up prevention | **Ponytail** — every skip names its escalation path |

Both skills demolish the no-skill baseline: −16% tokens, −3× time, and the
baseline's degenerate cases (190-line countdown dashboard, 208s) simply don't
happen.
