# Rule: `brittle-assert`

Heuristic contract (Implementation Contract #9). **No scanner yet** — detection lands in v0.8 item #7. This page is the Tier-R review surface before Tier-B implements.

## Intent

Flag equality assertions whose expected value is a **prose literal** that will drift when product copy changes. Prefer substring / contains / regex matchers for user-visible text.

## Exact inputs

| Dimension | In scope |
|-----------|----------|
| **File types** | Test files only (`*.spec.*`, `*.test.*`, `*.cy.*`, `test_*.py`, `*_test.py`, and equivalents matched by `TEST_FILE_RE` in `scripts/self-check.js`) |
| **Out of scope** | Locator / action / page / factory source (covered by other tags); non-test modules |
| **Assertion APIs** | Equality / identity matchers only (not contains / regex / soft matchers) |

### Matcher surface (first ship)

| Language | Frameworks | Equality APIs |
|----------|------------|---------------|
| TypeScript / JS | Playwright, Jest, Mocha | `expect(x).toBe(...)`, `expect(x).toEqual(...)`, `assert.equal`, `assert.strictEqual`, `assert.deepEqual` |
| Python | pytest, unittest | `assert x == ...`, `assertEqual`, `assertEquals`, `self.assertEqual` |
| Java | JUnit, TestNG | `assertEquals(...)`, `Assertions.assertEquals(...)`, AssertJ `assertThat(x).isEqualTo(...)` |

### Prose literal (violation predicate)

A string (single- or double-quoted) is **prose** when **either**:

1. It contains whitespace (multi-word), **or**
2. It ends with sentence punctuation: `.` `!` `?`

Non-string RHS (numbers, booleans, enums, identifiers) is never prose.

## First supported languages / frameworks

| Language | Frameworks |
|----------|------------|
| TypeScript | Playwright, Jest, Mocha |
| Python | pytest, unittest |
| Java | JUnit, TestNG |

Cross-file import resolution is **out of scope for v1** (deferred). Same-file `const` / final field provenance is in scope for the scanner (item #7).

## Detection examples

Violating (prose equality):

```typescript
// Playwright / Jest
expect(message).toBe("Not found.");
expect(title).toEqual("Welcome back, user!");
```

```typescript
// Mocha
assert.strictEqual(err.message, "File not found.");
```

```python
# pytest
assert result == "User not authorized."

# unittest
self.assertEqual(text, "Access denied.")
```

```java
// JUnit
assertEquals("Invalid credentials.", response.getMessage());
assertThat(actual).isEqualTo("Checkout failed.");
```

Clean (not prose / domain invariant):

```typescript
expect(status).toBe(200);
expect(enabled).toBe(true);
expect(role).toBe("admin");

const NOT_FOUND = "Not found.";
expect(message).toBe(NOT_FOUND); // same-file constant — clean
```

## Known false positives

| Pattern | Why it looks like a hit | Why it is clean |
|---------|-------------------------|-----------------|
| `expect(status).toBe(200)` | Equality matcher | Numeric domain invariant |
| `expect(ok).toBe(true)` | Equality matcher | Boolean |
| `expect(code).toBe("OK")` | String equality | Short token: no whitespace, no sentence punctuation |
| `expect(role).toBe("admin")` | String equality | Enum-like token |
| Same-file `const MSG = "Not found."; expect(x).toBe(MSG)` | Prose lives nearby | Provenance: identifier, not a literal RHS |
| `expect(locator).toHaveText(/partial/)` | Text assertion | Not an equality matcher — out of rule scope |
| `assert "denied" in message` | String in assert | Contains / membership, not equality |

Deliberate shallow provenance (v1): only same-file bindings. Imported constants are treated as literals unless allowlisted.

## Argument-position prose (subject-first shapes)

`proseLiteral` (`scripts/self-check.js`) inspects only the **first** quoted literal on the line. Assertions whose *actual* is a literal and whose *expected* is prose are caught by the companion `expectedProseLiteral` predicate (shipped v0.11.0 #11), which inspects the equality **argument/expected** literal instead of the first quote:

| Pattern | How it is caught | Status |
|---------|------------------|--------|
| `"actual".Should().Be("Payment rejected.")` (FluentAssertions, subject-first) | `expectedProseLiteral` reads the `.Be(...)` argument, not the short-token subject | Shipped v0.11.0 #11 |
| `Assert.That("actual", Is.EqualTo("Welcome home!"))` (NUnit, subject-first) | `expectedProseLiteral` reads the `Is.EqualTo(...)` argument | Shipped v0.11.0 #11 |
| `message.Should().NotBeNull().And.Be("Payment rejected.")` (FluentAssertions chain) | `.And.Be(` is an equality candidate; `expectedProseLiteral` scans **every** matcher call on the line, so a later `.And.Be` prose is not shadowed by an earlier short-token `.Be` | Shipped v0.11.0 remediation |

Two argument-position refinements ship with the v0.11.0 remediation loop:

- **Trailing failure-message argument is dropped.** Function-style equality assertions compare their first two positional arguments; any further argument is a human-readable message, not a compared value. `assert.equal(status, 404, "Status should be Not Found.")`, `self.assertEqual(count, 3, "Should be three items.")`, `assertEquals(2, actual, "Payment count mismatch.")` and `Assert.AreEqual(2, actual, "Payment count mismatch.")` are **clean** — the prose lives only in the message slot. Method-style matchers (`.toBe`, `.Be`, `Is.EqualTo`) take the expected value as their first argument, so any because/reason string after it is likewise ignored.
- **`.And.Be(` FluentAssertions chains are candidates.** Both `EQUALITY_ASSERTION_RE` and `MATCHER_EQUALITY_RE` accept `.And.Be(`, and `expectedProseLiteral` scans every matcher call, so chained equalities with prose in any position flag.

When a matcher-style equality is present, only the argument-position literal is inspected (the first-quote subject prose is **not** OR'd in), so `"Payment rejected.".Should().Be(actual)` — prose subject, identifier expected — is not flagged. Surfaced by the v0.10.0 .NET ecosystem Tier-R cross-review; shipped in v0.11.0 with `cs` subject-first corpus rows proving cross-language FP-freedom.

## Corpus path

`fixtures/corpus/brittle-assert/`

Layout and labels: [`fixtures/corpus/README.md`](../../fixtures/corpus/README.md) · schema [`schemas/corpus-labels.schema.json`](../../schemas/corpus-labels.schema.json).

| Bucket | Count (item #3) | Languages |
|--------|-----------------|-----------|
| `violating/` | ≥10 | `ts`, `py`, `java` |
| `clean/` | ≥10 | `ts`, `py`, `java` |

### Corpus precision (recorded)

| When | Result |
|------|--------|
| Item #3 (this contract + corpus, **no RULES entry**) | **`precision=n/a` (`pendingScanner`)** — TP=0 FP=0 FN=11; languages=`java,py,ts`; exit 0 |
| Item #7 (scanner lands) | Must reach ≥ **0.90** for `report` → `warning` graduation floor |

Re-measure: `node scripts/verify-corpus-precision.js`

## Suppression

| Mechanism | Form |
|-----------|------|
| Inline | `// gavel-ignore: brittle-assert` (or `#` in Python) with a reason on the same or adjacent line |
| Config allowlist | `gavel.config.json` → `allowlist: [{ "file", "tag": "brittle-assert", "line"? }]` |

Wildcard `gavel-ignore` still suppresses every tag (legacy); prefer tag-scoped ignores.

## Severity

| Layer | Value at ship (item #7) |
|-------|-------------------------|
| Envelope (`envelopeSeverity`) | `report` |
| Self-check (`severity` / failThreshold vocab) | `info` (registry has no `report` severity) |
| Confidence | `medium` |
| Class | `assertion` / heuristic |

Graduation (Contract #2): `report` → `warning` at corpus precision ≥ **0.90**; `warning` → `blocker` only at ≥ **0.95** with zero corpus FPs **and** sample-repo trial. Heuristic never autofixes.

## SARIF mapping

Produced via `scripts/to-sarif.js` when self-check/audit emit `--format sarif`:

| SARIF field | Mapping |
|-------------|---------|
| `runs[].tool.driver.rules[].id` | `brittle-assert` |
| `results[].ruleId` | `brittle-assert` |
| `results[].level` | `note` (`SARIF_LEVEL.info` / `SARIF_LEVEL.report`) |
| `results[].message.text` | Rule `message` from `RULES` |
| `results[].locations[].physicalLocation` | `artifactLocation.uri` = repo-relative path; `region.startLine` = finding line |
| `results[].partialFingerprints['gavelSnippetHash/v1']` | SHA-256 of `file + tag + snippet` (line excluded — baseline identity) |
| `helpUri` | Deferred until per-rule explain pages (roadmap v1.0); contract lives at `docs/rules/brittle-assert.md` until then |

Baseline key (v0.8 schema): `path + rule + snippetHash` (severity excluded — graduation must not invalidate baselines).
