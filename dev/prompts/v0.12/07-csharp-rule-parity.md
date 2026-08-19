# Session 07 — C# rule parity (`no-teardown`, `bare-test-fail`, `test-fail-order`)

Obey `dev/prompts/v0.12/00-PROTOCOL.md`. Implement **only** this item. Tier B. Zero new tags. Widen three existing rules so they recognize C# idioms. **`no-step` stays skipped on `.cs`** (already `return []` at ~L768–771). Do not invent a step wrapper.

## Why

Roadmap Feature 3: remaining self-check rules still miss C#. Lesson #8: NUnit has no `test.step()` analog — leave `no-step` deferred.

## Read first

- `scripts/self-check.js`:
  - `findDescribeBlocks` (L160–178) — **`describe(` only**
  - `findStateCreationSignals` / `cleanupSignals` / `findNoTeardownMatches` (L196–228)
  - `splitTestBlocks` (L610–647) — **`test(` / `it(` only**
  - `bare-test-fail` (L781–805)
  - `test-fail-order` (L808–838)
  - `no-step` C# early return — do not remove it
- Goldens (TS/Python only today):
  - `fixtures/self-check/violations/no-teardown/inline-create.spec.ts`
  - `fixtures/self-check/clean/no-teardown/`
  - `fixtures/self-check/violations/bare-test-fail/`
  - `fixtures/self-check/clean/bare-test-fail/`
  - `fixtures/self-check/violations/test-fail-order/assertion-before-fail.spec.ts`
  - `fixtures/self-check/clean/test-fail-order/fail-before-assert.spec.ts`
- `AGENTS.md` Expected-Failure Expiry Policy
- `GAVEL_ROADMAP.md` v0.12 Feature 3 table

`verify-self-check-fixtures.js` already requires every RULES id to appear in the **violations** tree (TS fixtures cover the three tags). You must add C# violators **and** C# clean files without making `clean/` dirty.

---

## 1. `no-teardown`

**Today:** test-only files; state creation = `INSERT INTO` / `fetch(..., { method: 'POST' })` / axios|supertest `.post/.put`; cleanup = `afterEach|tearDown|addfinalizer|@AfterEach` plus post-`yield` body. Blocks from JS `describe(`.

**C# cleanup signals** (add to `cleanupSignals` via `findMatches`):

- `[TearDown]`
- `[OneTimeTearDown]`
- `[TestCleanup]`
- `DisposeAsync`
- `.Dispose(` / `void Dispose(` / `IDisposable`
- `IAsyncDisposable`

**C# creation signals** (add to `findStateCreationSignals`, still comment-aware):

Keep existing SQL/HTTP patterns (they can appear in C#). Add cheap C# creates if they stay low-FP:

- `HttpClient` `.PostAsync(` / `.PutAsync(`
- `INSERT INTO` already covered

Do **not** treat `new LoginPage(` as state creation (that is `no-di`).

**C# lexical block:** `findDescribeBlocks` will not see NUnit classes. For `.cs` files, treat the **class body** as the block (or each `[Test]` method). Smallest approach: if the file is `.cs` and `TEST_FILE_RE`, use one block `{ start: 1, end: lineCount }` **or** split on methods with brace depth (reuse session 02 style if that helper was exported; otherwise a local walker). Creation without a cleanup signal **in the same class/file** fires.

Heuristic stays `confidence: 'low'` / `info` / `report` — do not graduate.

**Violating:** `violations/no-teardown/NoCleanupTests.cs` — `[Test]` does `INSERT INTO` or `PostAsync` and the class has no `[TearDown]` / `Dispose`.

**Clean:** `clean/no-teardown/TearDownTests.cs` — same create + `[TearDown]` deletes.  
**Clean:** `clean/no-teardown/DisposableTests.cs` — `IDisposable` / `Dispose()` present with create.

Existing TS clean/violating must still work (`describe` + `afterEach`).

---

## 2. `bare-test-fail`

**Today:** lines matching `test.fail(` / `it.failing(` / `pytest.mark.xfail` without a ticket in adjacent lines (`/[A-Z][A-Z0-9]+-\d+|PROJ-\d+|#\d+/`).

**Add C# matches** (same ticket context rule, ±1 line):

- `Assert.Fail(`
- `Assert.Throws<` / `Assert.ThrowsAsync<` **when used as the whole expected-failure marker** without a follow-up assert **and** without a ticket

Roadmap: “`Assert.Fail(` / `Assert.Throws<` without follow-up assert”.

Be conservative on `Assert.Throws`:

- **Fire** when `Assert.Throws<Exception>(() => ...)` is the only assertion-like call in the method and no ticket on adjacent lines (vacuous expected-failure).
- **Do not fire** `Assert.Throws<InvalidLoginException>(() => login.Submit())` followed by `Assert.That(ex.Message, Does.Contain(...))` or `Expect(...)` — that is a real assertion.
- **Do not fire** `Assert.Fail("PROJ-123: ...")` when the ticket regex matches the line (already the TS behavior).

Also accept NUnit `Assert.Ignore`? **No** — that is `skip-marker` already.

**Violating:** `violations/bare-test-fail/BareAssertFailTests.cs` — `[Test] public void X() { Assert.Fail(); }` no ticket.  
**Violating:** `violations/bare-test-fail/BareAssertThrowsTests.cs` — `Assert.Throws<Exception>(() => DoThing());` no follow-up, no ticket.

**Clean:** `clean/bare-test-fail/TicketedAssertFailTests.cs` — `Assert.Fail("PROJ-123: known bug");`  
**Clean:** `clean/bare-test-fail/ThrowsThenAssertTests.cs` — Throws + follow-up `Assert.That`.

Keep Python `xfail` and JS `test.fail` fixtures.

---

## 3. `test-fail-order`

**Today:** `splitTestBlocks` only sees `test(` / `it(`. Then fail marker after an assert in the same block.

**C#:** `splitTestBlocks` must also start a block on `[Test]` / `[Fact]` / `[Theory]` / `[TestCase` method headers (brace-depth method body), **or** add `splitCsharpTestMethods(content)` and union the blocks.

Fail markers: existing JS plus `Assert.Fail(`.

Assert markers: existing `expect(` / `assert` / `assertEquals` / `assertThat` plus `Expect(` / `Assert.That` / `Assert.AreEqual` / `.Should(`.

**Order attributes:** detect `[Test(Order=` and ordered `[TestCase]` as **additional** hits? Roadmap: “Detect NUnit `[Test(Order=)]`, xUnit test class ordering”.

Smallest useful behavior:

1. **Same as JS:** `Assert.Fail` **after** `Assert.That`/`Expect` in one method → `test-fail-order`.
2. **`[Test(Order=n)]`:** if a test class has `[Test(Order=` on methods, emit **one** finding on the first ordered test (or each ordered method). This is suite-order coupling. Keep it on the attribute line. Do **not** flag unordered `[Test]` classes.

xUnit collection/order: `[TestCaseOrderer(...)]` or `ITestCollectionOrderer` — if cheap, flag `[TestCaseOrderer` as the same tag. If noisy, NUnit `[Test(Order=` is enough for this session.

**Violating:** `violations/test-fail-order/AssertBeforeFailTests.cs` — Expect/Assert.That then `Assert.Fail`.  
**Violating:** `violations/test-fail-order/OrderedTests.cs` — two `[Test(Order=1)]` `[Test(Order=2)]` methods.

**Clean:** `clean/test-fail-order/FailBeforeAssertTests.cs` — `Assert.Fail("PROJ-1")` then no assert, or fail before assert. Ticket may also trip `bare-test-fail` if no ticket — **include a ticket** so clean tree stays clean.  
**Clean:** `clean/test-fail-order/UnorderedTests.cs` — two `[Test]` methods, no `Order=`.

---

## Shared constraints

- All detection through `findMatches` or line loops that skip comments the same way `bare-test-fail` already does (it loops raw lines — **match existing style** for that rule; do not regress comment false positives: a comment `Assert.Fail()` must not fire — use `findMatches` for new C# arms where possible).
- Do not change severities.
- Do not touch `no-step`.

## Verify wiring

Spot-check in `verify-self-check-fixtures.js` (same pattern as LoginTests.cs):

- `NoCleanupTests.cs` → `no-teardown`
- `BareAssertFailTests.cs` → `bare-test-fail`
- `AssertBeforeFailTests.cs` → `test-fail-order`

Unit tests: call each rule `.test(path, content)` with in-memory C# snippets for the four cases (violating + clean) per rule.

## Commands

```bash
node scripts/verify-self-check-fixtures.js
npm run verify
```

## Done when

- [ ] C# teardown/dispose is recognized as cleanup; missing cleanup still fires `no-teardown`
- [ ] `Assert.Fail(` without ticket fires `bare-test-fail`; ticketed / Throws+follow-up do not
- [ ] Assert-then-Fail in one C# method fires `test-fail-order`; `[Test(Order=` fires; unordered tests do not
- [ ] `no-step` still returns [] on `.cs`
- [ ] TS/Python fixtures still pass
- [ ] `npm run verify` green

## Out of scope

Corpus ≥10+≥10 (session 08). Docs (13).
