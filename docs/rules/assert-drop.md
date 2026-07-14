# Rule: `assert-drop`

Diff-scoped review rule (Implementation Contract #1). **Harness design only in item #8a** — detection lands in item #8b (`REVIEW_RULES` / `gavel-review`). This page is the Tier-B coding surface.

## Intent

Catch the **Green-Pipeline Lie**: a PR makes a test pass by deleting or weakening verification while the test title stays the same. Prefer keeping assertions, consolidating with equal coverage, or renaming the test when behavior intentionally changes.

## Exact inputs

| Dimension | In scope |
|-----------|----------|
| **Surface** | `gavel-review` only — never `gavel self-check` |
| **Evidence** | Before/after file contents (git diff hunks or fixture pairs) |
| **File types** | Test files only (`TEST_FILE_RE`) |
| **Out of scope** | Locator / action / page / factory source; non-test modules; Bailiff runtime confirmation |

### Sub-cases and severity

| Sub-case | Class | Self-check `severity` | `envelopeSeverity` | Predicate (v1) |
|----------|-------|------------------------|--------------------|----------------|
| Assertion deletion | Deterministic | `blocker` | `blocker` | An assertion call present in **before** is absent in **after**, and the **test title string is byte-identical** |
| Early-return insertion | Deterministic | `blocker` | `blocker` | An early `return` / `return;` / `pytest.skip` / equivalent is inserted **before** remaining assertions in the same test block, title unchanged |
| Strength downgrade | Heuristic | `info` | `report` | Equality / contains / schema assertion is replaced by existence-only (`toBeDefined`, `toBeTruthy`, `assert … is not None`, etc.), title unchanged |

Never autofix. Heuristic sub-case starts at `report` per Contract #2.

## Diff-fixture harness layout

```text
fixtures/self-check/diff/assert-drop/
  <case-id>/
    before.spec.ts   # pre-change test body
    after.spec.ts    # post-change test body
    meta.json        # label + expected findings for verify (item #8b wires this)
```

| Case id | Label | Scenario |
|---------|-------|----------|
| `assertion-deleted` | violating | Assertion removed; title unchanged |
| `early-return` | violating | Early return before remaining asserts; title unchanged |
| `title-changed` | clean | Assertion removed **and** title string changed (refactor) |
| `consolidated` | clean | Multiple asserts → one with same observable coverage |

v1 languages for fixtures: TypeScript / Playwright. Additional languages may reuse the same layout.

### `meta.json` shape

```json
{
  "tag": "assert-drop",
  "label": "violating" | "clean",
  "subCase": "assertion-deleted" | "early-return" | "strength-downgrade" | "title-changed" | "consolidated",
  "expectedFindings": [{ "file": "after.spec.ts", "line": 1, "subCase": "assertion-deleted" }]
}
```

- `label: "clean"` → `expectedFindings` must be `[]` or omitted.
- `file` is relative to the case directory; findings are reported against the **after** file.
- Item #8b wires these into verify (new path or extend `verify-self-check-fixtures.js`).

## Title comparison (v1)

**Literal string equality only.** Extract the test title from the `test(` / `it(` / `@Test` declaration line. Compare before vs after with exact Unicode equality after trimming surrounding quotes — no stemming, no synonymy, no fuzzy match.

If the title changes, assertion deletion / early-return / strength-downgrade **do not fire** for that test block.

## Assertion and early-return signals (v1)

| Kind | Patterns (illustrative) |
|------|-------------------------|
| Assertion | `expect(`, `assert.`, `assertEquals`, `assertThat`, `self.assert`, bare `assert ` (Python) |
| Early exit | `return;`, `return `, `pytest.skip`, `test.skip` inside the test body before remaining asserts |
| Existence-only (downgrade target) | `toBeDefined()`, `toBeTruthy()`, `toBeTruthy`, `is not None`, `assertNotNull` |

Comment-aware: reuse `findMatches` semantics — never count matches inside comments.

## Scanner contract (Tier-B must implement)

```typescript
/** One golden before/after pair (fixture or git-resolved). */
export interface AssertDropDiffPair {
  caseId: string;
  beforePath: string; // absolute or repo-relative
  afterPath: string;
  before: string;
  after: string;
}

export type AssertDropSubCase =
  | 'assertion-deleted'
  | 'early-return'
  | 'strength-downgrade';

export interface AssertDropFinding {
  tag: 'assert-drop';
  subCase: AssertDropSubCase;
  severity: 'blocker' | 'info';
  envelopeSeverity: 'blocker' | 'report';
  file: string; // after path, repo-relative posix
  line: number; // 1-based line in after (or first removed assert line mapped to after context)
  message: string;
  confidence?: 'medium'; // required for strength-downgrade only
}

/**
 * Compare after against before for one file pair.
 * Pseudocode:
 * 1. Split both sides into test blocks (reuse splitTestBlocks / language analogs).
 * 2. Pair blocks by literal test title.
 * 3. Unpaired deleted title → out of scope for v1 (treat as refactor).
 * 4. For each paired title:
 *    a. If assertion count/set decreases and title unchanged → assertion-deleted (blocker)
 *       unless after consolidates into a stronger or equal single assert covering the same subject (consolidated clean).
 *    b. If early exit appears before remaining asserts and title unchanged → early-return (blocker)
 *    c. Else if assert strength downgrades and title unchanged → strength-downgrade (report)
 * 5. Apply gavel-ignore: assert-drop + reason (and config allowlist).
 */
export function scanAssertDrop(pair: AssertDropDiffPair): AssertDropFinding[];
```

### Consolidation exemption (clean)

When **before** has N assertions (N ≥ 2) and **after** has 1 assertion on the **same primary subject** (same first `expect(...)` / assert left-hand expression text) with a **non-existence-only** matcher, treat as consolidation — **no finding**. Document FPs in item #8b corpus if needed; v1 uses lexical subject equality, not semantic coverage proof.

## Detection examples

Violating — assertion deleted, title unchanged:

```typescript
// before
test('checkout shows total', async () => {
  await expect(total).toHaveText('$10');
});

// after
test('checkout shows total', async () => {
  await page.goto('/checkout');
});
```

Violating — early return before asserts:

```typescript
// before
test('login succeeds', async () => {
  await login();
  await expect(dashboard).toBeVisible();
});

// after
test('login succeeds', async () => {
  await login();
  return;
  await expect(dashboard).toBeVisible();
});
```

Clean — title changed with assert removal:

```typescript
// before
test('checkout shows total', async () => {
  await expect(total).toHaveText('$10');
});

// after
test('checkout opens payment form', async () => {
  await page.goto('/checkout');
});
```

Clean — consolidation:

```typescript
// before
test('status is ok', async () => {
  expect(status).toBe(200);
  expect(status).toBeGreaterThan(199);
});

// after
test('status is ok', async () => {
  expect(status).toBe(200);
});
```

## Suppression

| Mechanism | Form |
|-----------|------|
| Inline | `// gavel-ignore: assert-drop — consolidating redundant assertions` (reason required) |
| Config | `allowlist: [{ "file", "tag": "assert-drop", "line"? }]` |

## Registry placement (item #8b)

- Register in `REVIEW_RULES` (not `RULES` in `self-check.js`).
- Invoked only by `gavel-review`.
- Diff rules document this scanner contract instead of a single-file `findMatches` pass (Contract #1).

## Ceiling (v1)

- No fuzzy title comparison.
- No cross-file fixture / shared helper resolution.
- Consolidation uses lexical subject match only — cannot prove runtime coverage equivalence.
- Strength-downgrade is heuristic; never blocker in v0.8.
