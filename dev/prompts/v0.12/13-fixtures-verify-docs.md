# Session 13 — Fixtures + verify + docs closeout

Obey `dev/prompts/v0.12/00-PROTOCOL.md`. Implement **only** this item. Tier B. No new tags, no new interfaces, **no version bump / tag / publish**.

This is the release DoD mop: anything 01–12 left incomplete in docs, sample-repo READMEs, skill copy, CHANGELOG, and verify. If a **scanner** from 01–07 is still missing, do **not** invent it here — list the gap and stop after docs you can honestly write. Prefer finishing leftover **fixtures and docs** over opening new design.

## Why

Roadmap definition of done: scanner fixes validated against the 7-repo lessons, every remaining C# rule has corpus precision ≥95% (session 08 target was 100%), Appium goldens for .NET and Java, `gavel baseline write` + `"preset": "legacy"` documented in ENTERPRISE.md.

## Read first

- `CHANGELOG.md` — `[Unreleased]` section (currently empty)
- `docs/ENTERPRISE.md` — baseline/policy tables
- `docs/CLI_MATRIX.md`
- `docs/README.md` — version line must stay **0.11.0** until the maintainer bumps (do **not** change it to 0.12.0)
- `skills/gavel-playwright/SKILL.md` — C# Wait strategy / Prohibited list
- `skills/gavel-audit/SKILL.md` — suite-health field list
- `skills/gavel-appium/SKILL.md`, `skills/gavel-detect/SKILL.md`
- `fixtures/sample-repos/playwright-dotnet/README.md`, `appium-dotnet/README.md`, `selenium-dotnet/README.md`
- `scripts/verify-docs.js`, `scripts/check-versions.js` (seven files must stay equal — do not bump)
- `GAVEL_ROADMAP.md` DoD paragraph for v0.12 (do not edit budgets)
- `LESSONS_LEARNED_PLAYWRIGHT_CSHARP.md` §11 follow-ups 6–7 (docs)

## 1. CHANGELOG

Under `## [Unreleased]`, Keep-a-Changelog entries for v0.12 work that actually exists in the tree. Theme line:

**`.NET + Appium depth & baseline gates`**

Group **Added** / **Fixed** / **Changed**. Examples of what should appear **if shipped**:

- NetworkIdle / `waitForLoadState('networkidle')` as `manual-wait`
- `no-di` skips BaseTest / `[SetUp]`
- Dead-code `n/a (csharp)`
- Audit suite-health freshness + Playwright package mismatch
- `fat-pom-files` / `leak-files` rollup
- `complex-locator` C# CSS/XPath; ExpectedConditions not `manual-wait`
- C# `no-teardown` / `bare-test-fail` / `test-fail-order`
- C# corpus for the six tags
- `MobileBy` → `AppiumBy` fix hint; ImplicitWait; Appium Java skill
- `gavel baseline write` / `check`
- `"preset"` / `--preset` IDs

Do not document unshipped items. Do not add `## [0.12.0] - date` (maintainer tags later).

## 2. ENTERPRISE.md

Must be true:

| Topic | Truth |
|-------|--------|
| Baseline command | **v0.12** `gavel baseline write` / `check`; v0.8 was schema only; **not v0.9** |
| Identity | `path + rule + snippetHash`; severity excluded |
| Presets | v0.12 IDs `recommended`, `strict`, `legacy`, `api-only`; explicit keys override |
| Adoption | `"preset": "legacy"` + baseline check for brownfield |

Grep `v0.9` in `docs/` and `templates/` for leftover “baseline in v0.9” and fix.

## 3. CLI_MATRIX.md

Confirm `gavel baseline` row exists (session 11). No extra verbs.

## 4. Playwright C# skill (lesson #4, #11 item 6)

In `skills/gavel-playwright/SKILL.md` C# section:

- Prohibited waits include `WaitForLoadStateAsync(LoadState.NetworkIdle)` and parameterless `WaitForLoadStateAsync()` / `waitForLoadState('networkidle')`
- Spec assertion is `await Expect(locator).ToBeVisibleAsync()`, **not** `Assert.That(await locator.IsVisibleAsync())` (bool snapshot, no auto-retry)
- Never zoom via `EvaluateAsync` CSS (`document.body.style.zoom`) — use `ViewportSize` / `deviceScaleFactor` (lesson #10; docs only, no tag)
- Locator split: extract `ILocator` properties **out** of `LoginPage` into `Pages/Locators/` (lesson #2). Sample repos already show this — add a 5-line bad vs good snippet if missing

## 5. Audit skill suite-health

`skills/gavel-audit/SKILL.md`: document new health lines if present in code: freshness, package mismatch, fat-POM files, leak files, dead-code n/a. Do not document fields that were not implemented.

## 6. Sample-repo READMEs

- `playwright-dotnet`: NetworkIdle is a violation if you added a **bad** example; good tests must not use it. Fix stale README claiming `Expect(` is undetected (scanner already matches `Expect(`).
- `appium-dotnet`: MobileBy hint, ImplicitWait, context switch — only what session 09 added.
- `fixtures/sample-repos/README.md` index if it lists profiles.

Good tests stay clean under `node scripts/self-check.js fixtures/sample-repos/<name>`. If bad files exist, README tables must match actual tags.

## 7. Remaining goldens

If sessions 01–09 missed a **required** self-check file named in those prompts and the scanner **exists**, add the fixture here (smallest). Do not re-open corpus to 10+10 if session 08 already passed — only fill holes that make `npm run verify` fail.

`no-step` must still not fire on `.cs`.

## 8. Verify

```bash
npm run verify
```

Fix any drift `verify-docs.js` / `verify-skills.js` / `validate-manifest.js` / `check-rule-copies.js --check-all` reports from new skills or CLI verbs. **Do not** run `check-versions.js` “fix” by bumping to 0.12.0.

## Do not

- Edit the 7 version files (`package.json`, `plugin.yaml`, `docs/README.md` version line, etc.)
- Tag `v0.12.0` or publish
- Add GitHub Action / Azure DevOps / MCP (v1.0)
- Add rule tags
- Treat `*Page.cs` as locator files
- Implement C# dead-code graph

## Done when

- [ ] Unreleased CHANGELOG matches the tree
- [ ] ENTERPRISE baseline + presets are dated v0.12 and internally consistent
- [ ] Playwright C# skill forbids NetworkIdle and prefers Expect over `IsVisibleAsync` snapshots
- [ ] Audit skill / sample READMEs match shipped suite-health and Appium examples
- [ ] `npm run verify` green
- [ ] Versions still 0.11.0

## After this session

Maintainer: bump seven version files, `RELEASE_CHECKLIST.md`, tag `v0.12.0`. Not this prompt.
