# v0.12 session protocol

Read this before implementing any numbered prompt. Obey it for the entire session.

You are a **coder**. Implement **only** the item in the numbered prompt that was pasted with this protocol. Finish it, get verify green, stop. Do not start the next roadmap row.

## Read first (every session)

1. `AGENTS.md` — Minimalism Ladder, QA Ladder, Test Constitution, verification gate.
2. `docs/CONTRIBUTING.md` — one item per session; `npm run verify` required.
3. The files listed under **Read first** in the numbered prompt. Read them. Do not guess at regexes or line numbers if the file has moved — search the current tree.

## Hard budgets (v0.12)

- **Zero new rule tags.** Do not add a `RULES` entry. Do not invent `networkidle`, `css-loc`, `fat-pom`, `implicit-wait`, or `appium-java` as tags. Same ids: `manual-wait`, `no-di`, `selector-leak`, `complex-locator`, `no-teardown`, `bare-test-fail`, `test-fail-order`, `expect-in-action`.
- **Interface budget already claimed** by sessions 11 and 12. Other sessions must not add CLI verbs, schema versions, exit-code meanings, SARIF shape changes, or config keys other than what their prompt explicitly names.
- Detection goes through `findMatches` in `scripts/self-check.js`. Never run a bare regex over raw file text that includes comments. Comment-aware detection is the contract.
- Suppression stays `gavel-ignore: <tag>` plus config allowlist. Do not invent a second ignore syntax.
- Boundary: test-code → Gavel. No Bailiff code, no `bailiff-*` files, no live browser, no CI reruns, no issue-tracker calls.

## Do not

- Treat `*Page.cs` as locator files (that hides fat-POM defects). Locator files are paths matching `/locators?\//i` only.
- Flag `NameString` in `GetByRole(new() { NameString = "..." })` as its own issue. That is Playwright.NET API.
- Invent a C# `test.step()` analog. `no-step` stays skipped on `.cs` (`scripts/self-check.js` already returns `[]` for `.cs`).
- Build a C# import graph for dead POMs.
- Recreate `fixtures/profiles/appium-dotnet-fresh/` — it already exists and is wired.
- Edit `GAVEL_ROADMAP.md` budgets or retitle releases.
- Bump versions in the 7 version files, tag a release, or publish npm.
- “While I’m here” extra refactors, new abstractions, new dependencies, or drive-by doc rewrites outside the prompt’s file list.
- Skip `npm run verify`.

## Fixtures contract (when the prompt adds detection)

Golden fixtures live under `fixtures/self-check/`:

- `violations/<tag>/` — must fire that tag (the whole violations tree is scanned; every `RULES` id must appear in the summary — do not delete existing violators).
- `clean/<tag>/` — the whole `clean/` tree must produce **zero** findings. A new clean fixture that trips another tag fails verify.
- Diff rules stay under `fixtures/self-check/diff/` — not this release unless a prompt says so.

Corpus (session 08) uses `fixtures/corpus/<tag>/labels.json` per `schemas/corpus-labels.schema.json` and `fixtures/corpus/README.md`.

## Verify gate (every session)

From the package root:

```bash
npm run verify
```

That chain includes self-check fixtures, corpus precision, baseline schema, profile fixtures, docs/CLI matrix sync, and `scripts/test/unit.test.js`. If you add a CLI verb, `scripts/verify-docs.js` requires a matching `gavel <cmd>` row in `docs/CLI_MATRIX.md`. If you add a skill directory, register it in `scripts/verify-skills.js` `CORE_SKILLS` **and** `plugin.yaml` `provides_skills`.

Targeted extra commands in the numbered prompt are in addition to, not instead of, full verify.

## Output

Code first. Then at most three short lines: what shipped, what was skipped, when to add it. Do not write an essay. Do not commit unless the human asked.

## Stop

When the numbered prompt’s **Done when** checklist is true and verify is green, stop. The next item is a different session.
