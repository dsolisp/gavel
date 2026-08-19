# v0.12 coder prompt pack

Session-ready prompts that implement [GAVEL_ROADMAP.md](../../../GAVEL_ROADMAP.md) **v0.12.0** (.NET + Appium depth & baseline gates). Source of truth for scanner gaps: [LESSONS_LEARNED_PLAYWRIGHT_CSHARP.md](../../../LESSONS_LEARNED_PLAYWRIGHT_CSHARP.md).

These files are **dev-only**. They are not under `docs/` and must not be added to the npm `files` list in `package.json`.

## How to run

1. Fresh chat / fresh coder session. Do not carry context across items.
2. Paste **[`00-PROTOCOL.md`](00-PROTOCOL.md)** first (or tell the model to read it).
3. Paste **exactly one** numbered prompt (`01` … `13`).
4. Wait until `npm run verify` is green and the session’s Done-when checklist is true.
5. Commit on the release branch (human or a follow-up commit session). Then start the next item with a **new** session.

Order is the roadmap implementation table. Do not skip ahead. Later prompts assume earlier scanners exist (corpus session 08 needs NetworkIdle + C# parity from 01/07; baseline session 11 needs a working self-check).

| File | Item | Tier |
|------|------|------|
| [01-manual-wait-networkidle.md](01-manual-wait-networkidle.md) | `manual-wait` NetworkIdle widening | B |
| [02-no-di-basetest.md](02-no-di-basetest.md) | `no-di` BaseTest / `[SetUp]` FP | B |
| [03-dead-code-na.md](03-dead-code-na.md) | Dead-code `n/a (csharp)` | B |
| [04-freshness-in-audit.md](04-freshness-in-audit.md) | Freshness in `gavel audit` | B |
| [05-fat-pom-rollup.md](05-fat-pom-rollup.md) | Suite-health fat-POM rollup | B |
| [06-complex-locator-expectedconditions.md](06-complex-locator-expectedconditions.md) | `complex-locator` C# CSS + ExpectedConditions exclusion | B |
| [07-csharp-rule-parity.md](07-csharp-rule-parity.md) | C# parity for `no-teardown` / `bare-test-fail` / `test-fail-order` | B |
| [08-csharp-corpus.md](08-csharp-corpus.md) | C# corpus completion (6 tags) | A + R |
| [09-appium-goldens.md](09-appium-goldens.md) | Appium goldens + `MobileBy` hint | B |
| [10-appium-java-skill.md](10-appium-java-skill.md) | Appium Java/Kotlin client skill | C |
| [11-baseline-cli.md](11-baseline-cli.md) | `gavel baseline write` + `check` | A + R |
| [12-policy-presets.md](12-policy-presets.md) | Policy preset IDs | A + R |
| [13-fixtures-verify-docs.md](13-fixtures-verify-docs.md) | Fixtures + verify + docs closeout | B |

## Budgets (whole release)

- **0 new rule tags.** Widen existing regexes, suite-health fields, and fix hints only.
- **2 irreversible public interfaces:** baseline write format (extends the v0.8 read schema) + policy preset IDs in `gavel.config.json`.
- Do not bump the 7 version files or tag `v0.12.0` in these sessions. That is a later maintainer release step.
