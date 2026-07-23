---
name: gavel-audit
description: >
  Whole-repo audit for test suite bloat and Test Constitution violations.
  Scans the entire codebase: unused POMs, dead locators, duplicate factories,
  orphaned tests, CSS/XPath overuse, hardcoded data, missing test.step().
  Ranked list of what to delete, simplify, or fix. Use when the user says
  "audit this test suite", "gavel-audit", "/gavel-audit", "find test bloat",
  or "what's wrong with my tests". One-shot report, does not apply fixes.
---

gavel-review, repo-wide. Scan the whole test tree instead of a diff. Rank
findings by impact (most violations first).

## Tags

Same categories as gavel-review, plus suite-level findings:

- `dead-pom:` page object with no spec referencing it. Replacement: delete.
- `dead-locator:` locator getter never used by any action or spec. Replacement: delete.
- `unused-factory:` factory export never imported. Replacement: delete export or file.
- `dup-factory:` factory that duplicates another factory's output. Replacement: consolidate.
- `orphan-test:` test with no matching feature/ticket, or testing removed functionality. Replacement: delete or verify relevance.
- `css-loc:` CSS/XPath selector count in the suite. Replacement: semantic locators.
- `selector-leak:` chained raw selector count outside locator classes (`locator.locator`, `querySelector`, `closest`, `.find()`, `$`, `find_element`). Replacement: named locators.
- `expect-in-action:` `expect()`, `assert()`, or framework assertion calls in action/page/locator files. Replacement: return state, move assertion to spec.
- `hardcoded:` hardcoded data count in test bodies. Replacement: factories.
- `no-step:` tests without logical grouping. Replacement: test.step().
- `manual-wait:` manual wait/sleep count. Replacement: web-first assertions.
- `no-di:` specs with direct instantiation. Replacement: fixture DI.
- `flake-risk:` tests with shared state, execution-order dependency, or non-idempotent cleanup. Replacement: isolate.
- `unused-helper:` wait/poll/retry helper defined in a lib/support dir but never referenced by a test. Replacement: adopt in tests or delete. (report-only)
- `unused-fixture:` fixture defined (`.extend({...})` or `@pytest.fixture`) but never consumed by a test. Replacement: adopt in tests or delete. (report-only)

## Adoption scan (report-only)

Remediation only sticks when the helpers and fixtures gavel recommends actually
get used. `gavel adoption <repo>` surfaces wait/poll/retry helpers and fixtures
that are defined but never referenced by a test — the gap between "we built the
safe pattern" and "the suite adopted it". Report-only: it lists, never edits.

```bash
gavel adoption <automation-repo>            # unused helpers + fixtures
gavel adoption <automation-repo> --json
```

## Hunt

Scan for:
1. Unused page objects — `node scripts/audit-autofix.js <repo>` or `audit-report.js`
2. Dead locator getters — `audit-autofix.js` / `audit-report.js`
3. Unused factory exports — `audit-autofix.js` / `audit-report.js`
4. Duplicate factories (compare factory outputs)
5. Orphan tests (tests referencing removed features or tickets)
6. Constitution violations — `node scripts/self-check.js <repo>` (optional `--with-self-check` on audit-report)
7. Flake risk indicators (shared accounts, no cleanup, execution-order tests)

Ranked dead-code scan (gavel-audit format):

```bash
node scripts/audit-report.js <automation-repo>
node scripts/audit-report.js <automation-repo> --with-self-check
node scripts/audit-autofix.js <automation-repo> --audit-format
```

## Output

One line per finding, ranked by impact. Prefix every line with severity:

| Severity | Use when |
|----------|----------|
| `blocker` | Constitution violation that can hide real bugs (`expect-in-action`, `manual-wait`, `no-di`) |
| `fix` | Incorrect patterns that break maintainability (`selector-leak`, `css-loc`, `hardcoded`, `no-step`) |
| `cleanup` | Dead code or duplication (`dead-pom`, `dead-locator`, `dup-factory`) |
| `delete` | Safe removal candidates (`orphan-test` with no ticket, unused POM/locator confirmed) |

Format:

`<severity> <autofix> <tag> <what to cut or fix>. <replacement>. [path]`

Examples:

`blocker review expect-in-action assertion in action file. Move expect to spec. [pages/actions/ExampleActions.ts]`
`delete safe dead-locator getter never referenced. Delete getter. [locators/catalog/ExampleLocators.ts]`

## Autofix eligibility

| Autofix | Meaning | Agent / action |
|---------|---------|----------------|
| `safe` | Mechanical change, low behavior risk | `node scripts/audit-autofix.js <repo>` (dry-run) or gavel-refactor after grep |
| `review` | Needs human or healer judgment | gavel-healer / gavel-refactor with test run |
| `report-only` | List only — do not auto-edit | Document for ticket or manual triage |

Safe autofix runner (default dry-run):

```bash
node scripts/audit-autofix.js <automation-repo>              # list candidates
node scripts/audit-autofix.js <automation-repo> --audit-format
node scripts/audit-autofix.js <automation-repo> --apply      # remove confirmed dead code
node scripts/audit-report.js <automation-repo>               # ranked gavel-audit output
```

Apply-safe handoff: `templates/apply-safe-workflow.md`

## Tag → severity + autofix

| Tag | Severity | Autofix |
|-----|----------|---------|
| `expect-in-action` | blocker | review |
| `manual-wait` | blocker | review |
| `no-di` | blocker | review |
| `selector-leak` | fix | review |
| `css-loc` | fix | review |
| `hardcoded` | fix | review |
| `no-step` | fix | review |
| `flake-risk` | fix | report-only |
| `dead-pom` | cleanup | safe |
| `dead-locator` | cleanup | safe |
| `unused-factory` | cleanup | safe |
| `dup-factory` | cleanup | review |
| `orphan-test` | delete | report-only |

End with suite health from `audit-report.js --with-self-check`:

```text
Suite health:
  Dead POMs: N
  Dead locators: N
  Unused factories: N
  Selector leaks: N
  Manual waits: N
  Skip/quarantine markers: N
  Bare test.fail markers: N
  Constitution violations: N
  Critical-area violations: N (when gavel.config.json marks criticalAreas)
  Safe autofix candidates: N
```

Return `templates/result-envelope.md` when the audit report is complete.

## Boundaries

Scope: test bloat, dead code, and Test Constitution violations only.
Correctness bugs, security holes, and performance are out of scope.
Lists findings, applies nothing. One-shot.
"stop gavel-audit" or "normal mode" to revert.
