# Session 01 — `manual-wait` NetworkIdle widening

Obey `dev/prompts/v0.12/00-PROTOCOL.md`. Implement **only** this item. Tier B. Zero new tags.

## Why

Lesson #1 in `LESSONS_LEARNED_PLAYWRIGHT_CSHARP.md`: production Playwright.NET suites use `await page.WaitForLoadStateAsync(LoadState.NetworkIdle)` (12 / 31 / 20 / **157** hits). IBC also uses parameterless `WaitForLoadStateAsync()` (defaults to `load`). The scanner reported 0–5 manual waits because the regex has no NetworkIdle. Appium repos looked “worse” only because `Thread.Sleep` already matches.

Do **not** add a `networkidle` rule id. Same tag: `manual-wait`.

## Read first

- `scripts/self-check.js` — `manual-wait` rule `test` (~L703–739), detection regex (~L712–715), `classifyManualWaitSubCase` (~L440–453), `classifyReplaceability` (~L458–491), `parseManualWaitDuration` (~L539–551), `manualWaitFixHint` (~L1024–1038), severity graduation in `main()` (~L1229–1242)
- `scripts/verify-self-check-fixtures.js` — C# gate for `ThreadSleepTests.cs` (~L162–168); sub-case counts
- `scripts/test/unit.test.js` — `parseManualWaitDuration handles C# sleep APIs`; `fix hints: static per-tag and context-aware per manual-wait subCase`
- Fixtures: `fixtures/self-check/violations/manual-wait/*.cs`, `fixtures/self-check/clean/manual-wait/NativeWaitsTests.cs`
- `skills/gavel-playwright/SKILL.md` — C# “Wait strategy” (prohibited list currently omits NetworkIdle)
- `LESSONS_LEARNED_PLAYWRIGHT_CSHARP.md` §1

## Current detection regex (must keep all existing arms)

```js
/waitForTimeout\s*\(|page\.waitForTimeout|WaitForTimeoutAsync\s*\(|page\.WaitForTimeoutAsync|time\.sleep\s*\(|Thread\.sleep\s*\(|Thread\.Sleep\s*\(|Task\.Delay\s*\(|cy\.wait\s*\(\s*\d+|browser\.pause\s*\(/g
```

Existing C# hits that must still fire: `Thread.Sleep`, `Task.Delay`, `WaitForTimeoutAsync` (see `ThreadSleepTests.cs`, `TaskDelayTests.cs`, `WaitForTimeoutAsyncTests.cs`).

## Change

### 1. Widen the `manual-wait` `findMatches` regex

Add arms (comment-aware via `findMatches`, same call site):

| Pattern | Notes |
|---------|--------|
| `WaitForLoadStateAsync\s*\(\s*LoadState\.NetworkIdle` | Dominant C# failure mode |
| `WaitForLoadStateAsync\s*\(\s*["']networkidle["']` | Enum as string if it appears |
| `waitForLoadState\s*\(\s*['"]networkidle['"]` | TS/JS parity (`networkidle` is already forbidden in the Playwright skill) |
| `WaitForLoadStateAsync\s*\(\s*\)` | Parameterless; default is `load`, still not a locator wait |

Keep existing sleep/timeout arms. Do not match `WaitForLoadStateAsync(LoadState.Load)` / `LoadState.DOMContentLoaded` / `waitForLoadState('load')` / `waitForLoadState('domcontentloaded')`.

### 2. Parameterless call → `confidence: 'low'`

On the hit object for parameterless `WaitForLoadStateAsync()`, set `confidence: 'low'`. NetworkIdle matches stay at default (no confidence field, or omit). Forward `confidence` onto the finding in `main()` **only if already present on the hit** — do not invent a new RULES field. If forwarding requires a one-line `if (hit.confidence) finding.confidence = hit.confidence`, do that. Do not change the rule’s registry `confidence`.

### 3. Sub-case classification — reuse existing function

`classifyManualWaitSubCase(lines, lineNumber)` already inspects the **next 3 lines** (slice from `lineNumber`, which is the 0-based index of the hit line’s *following* line when called as `classifyManualWaitSubCase(lines, hit.line)` — match the existing call: `classifyManualWaitSubCase(lines, hit.line)` in the rule `test`).

Current `redundantPattern`:

```js
/waitFor(?!Timeout)\w+\s*\(|WaitFor(?!Timeout)\w+Async\s*\(|expect\.poll\s*\(|Expect\.Poll|ToBeVisibleAsync\s*\(|cy\.wait\s*\(\s*['"`@]/
```

`WaitForURLAsync` and `WaitForAsync` already match `WaitFor(?!Timeout)\w+Async`. `ToBeVisibleAsync` is already listed. `Expect(` is **not** listed except via `ToBeVisibleAsync` / `Expect.Poll`.

**Required:** a NetworkIdle (or parameterless load-state) hit whose next 3 lines contain `Expect(` / `ToBeVisibleAsync` / `WaitForAsync` / `WaitForURLAsync` must classify `redundant`.

Add `Expect\s*\(` to `redundantPattern` if needed so `await Expect(locator).ToBeVisibleAsync()` still matches even if split oddly. Do **not** let `WaitForLoadStateAsync` classify **itself** as redundant — the classifier must keep using *following* lines only, never the hit line.

If the next lines are a DOM snapshot (`EvaluateAsync`, `InnerText`, `GetAttributeAsync`, …), keep `stale-read`. Otherwise `intentional`.

Reuse existing severity graduation in `main()` (~L1229–1242). Do not add a fourth path:

- `redundant` / `stale-read` → `severity: error`, `envelopeSeverity: blocker`
- `intentional` + `replaceable: true` → `info` / `report`
- `intentional` + not replaceable → `warning` / `fix`

### 4. Fix hint for NetworkIdle

`manualWaitFixHint` today:

- redundant → `remove — subsequent code already waits`
- stale-read → `replace with expect.poll / pollUntil on the specific DOM state`
- intentional replaceable → `replace with ${suggestion} (see gavel-refactor)`
- intentional non-replaceable → `rename for clarity or gavel-ignore with a reason`

For C# NetworkIdle / parameterless load-state:

- If `subCase === 'redundant'`: keep the existing remove hint.
- Else (intentional or stale-read on a load-state wait): prefer a C#-specific suggestion `Expect(locator).ToBeVisibleAsync()` / `WaitForURLAsync`. You may set `hit.suggestion` in the rule `test` when the matched text includes `WaitForLoadState` / `waitForLoadState`, then let `manualWaitFixHint` use `finding.suggestion` for the replaceable/intentional branch. For `stale-read` on NetworkIdle, a C# hint `replace with Expect(locator).ToBeVisibleAsync() / WaitForURLAsync` is better than the TS `expect.poll` string — branch on `finding.file` ending `.cs` **or** on the snippet matching `WaitForLoadState`.

Do not remove the existing Python/TS hint paths.

### 5. Duration

`parseManualWaitDuration` will return `null` for NetworkIdle (no ms argument). That is correct. Existing verify requires `durationMs` on fixtures that *have* parseable durations; do not require duration on NetworkIdle fixtures. If verify currently errors on *any* missing `durationMs`, only the existing sleep fixtures must keep numeric durations — read `verify-self-check-fixtures.js` around the `missingDuration` check and do not break it. NetworkIdle findings may have `durationMs: null` or omit the field if the existing code only sets it when parsed.

### 6. Out of scope for this session (do not do)

- Do **not** exclude `wait.Until(ExpectedConditions.*)` — session 06.
- Do **not** detect `ImplicitWait` — session 09.
- Do **not** add corpus samples — session 08 (self-check goldens only here).
- Do **not** rewrite `skills/gavel-playwright/SKILL.md` beyond a one-line add of `WaitForLoadStateAsync(LoadState.NetworkIdle)` / `waitForLoadState('networkidle')` to the C# **Prohibited** list (and the TS prohibited list if `networkidle` is not already there). Session 13 does the fuller C# Expect vs `IsVisibleAsync` docs.

## Fixtures

Add under `fixtures/self-check/` (NUnit style, match existing `NativeWaitsTests.cs` / `WaitForTimeoutAsyncTests.cs` namespaces):

**Violating**

1. `violations/manual-wait/NetworkIdleTests.cs` — `await page.WaitForLoadStateAsync(LoadState.NetworkIdle);` with no following Expect. Must fire `manual-wait`. Prefer `subCase: 'intentional'`.
2. `violations/manual-wait/NetworkIdleRedundantTests.cs` — NetworkIdle on one line, next line `await Expect(locator).ToBeVisibleAsync();`. Must fire `manual-wait` with `subCase: 'redundant'`.
3. `violations/manual-wait/networkidle.spec.ts` — `await page.waitForLoadState('networkidle');` so TS parity is golden, not only C#.

Optional but good: `violations/manual-wait/ParameterlessLoadStateTests.cs` — `await page.WaitForLoadStateAsync();` must fire, `confidence: 'low'` if you implemented that field.

**Clean** (must not fire — the whole `clean/` tree must stay at `violationCount === 0`)

1. Extend `clean/manual-wait/NativeWaitsTests.cs` **or** add `clean/manual-wait/LoadStateDomContentTests.cs` with `WaitForLoadStateAsync(LoadState.DOMContentLoaded)` or `waitForLoadState('load')` — must **not** fire.
2. A comment containing `WaitForLoadStateAsync(LoadState.NetworkIdle)` and/or `networkidle` must **not** fire (`findMatches` skips comments). Put that comment in the clean file.
3. Do not put a real NetworkIdle call in `clean/`.

Do not break existing manual-wait sub-case counts in `verify-self-check-fixtures.js` (needs `redundant`, `stale-read`, `intentional` each ≥2). The new redundant NetworkIdle fixture helps the redundant count.

## Verify wiring

In `scripts/verify-self-check-fixtures.js`, after the `ThreadSleepTests.cs` assertion, add:

- A finding in `NetworkIdleTests.cs` with `tag === 'manual-wait'`.
- A finding in `NetworkIdleRedundantTests.cs` with `tag === 'manual-wait'` and `subCase === 'redundant'`.

In `scripts/test/unit.test.js`:

- `parseManualWaitDuration` may stay unchanged (null for NetworkIdle is fine).
- Extend the fix-hint test so a finding with snippet/file indicating NetworkIdle and `subCase: 'redundant'` still matches `/remove/`, and a non-redundant C# NetworkIdle hint mentions `Expect` or `WaitForURLAsync`.

## Commands

```bash
node scripts/self-check.js fixtures/self-check/violations --json
node scripts/verify-self-check-fixtures.js
npm run verify
```

Confirm JSON contains `WaitForLoadStateAsync` / `networkidle` hits and does **not** flag the clean DOMContentLoaded / comment-only files.

## Done when

- [ ] NetworkIdle C# and `waitForLoadState('networkidle')` TS fire `manual-wait`
- [ ] Parameterless `WaitForLoadStateAsync()` fires (low confidence if implemented)
- [ ] `LoadState.Load` / `domcontentloaded` / `'load'` do not fire
- [ ] Comments mentioning NetworkIdle do not fire
- [ ] Redundant-next-line Expect classifies `redundant`
- [ ] Existing Thread.Sleep / Task.Delay / WaitForTimeoutAsync fixtures still fire
- [ ] No new rule tag
- [ ] `npm run verify` green

## Out of scope (next sessions)

ExpectedConditions exclusion (06). Corpus NetworkIdle samples (08). Playwright skill long-form C# Expect vs `Assert.That(IsVisibleAsync)` (13).
