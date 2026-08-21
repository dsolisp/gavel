# Session 11 — `gavel baseline write` + `gavel baseline check`

Obey `dev/prompts/v0.12/00-PROTOCOL.md`. Implement **only** this item. Tier A+R: this is **one of two irreversible public interfaces** in v0.12 (the write format). Do not add policy presets (session 12). Zero new rule tags.

## Why

v0.8 shipped `gavel-baseline.json` **schema + verify samples only**. `docs/ENTERPRISE.md` incorrectly says the **command** shipped in v0.9. It did not. This session ships the CLI. Identity is frozen: `path + rule + snippetHash` (severity is **not** in the key — graduation must not invalidate baselines).

## Read first

- `schemas/gavel-baseline.schema.json` — `schemaVersion` enum `["1.0.0"]`; required `schemaVersion`, `generatedAt`, `findings[]` with `path`, `rule`, `snippetHash` (64 hex), `createdAt`; posix `path`; `additionalProperties: false`
- `fixtures/baseline/valid.json`, `fixtures/baseline/invalid-missing-field.json`
- `scripts/verify-baseline-schema.js`
- `scripts/to-sarif.js` — `fingerprint(finding)` = sha256 of `` `${finding.file}\n${finding.tag}\n${finding.snippet || ''}` ``. **Not currently exported.** SARIF field `partialFingerprints['gavelSnippetHash/v1']`
- `scripts/self-check.js` JSON findings: `file`, `tag`, `text` (this is the snippet), `line`
- `scripts/cli.js` — `const scripts = { ... }`, `printHelp()`, `valueFlags`, `main()` command dispatch, exit contract 0/1/2
- `scripts/verify-docs.js` — **every key in `scripts` map must have a `gavel <cmd>` row in `docs/CLI_MATRIX.md`**, and vice versa (except inline `explain` / `companion`)
- `scripts/affected-tests.js` — `gitChangedFiles` uses `git diff --name-only --diff-filter=ACMR HEAD`
- `docs/CLI_MATRIX.md`, `docs/ENTERPRISE.md` (baseline table still says v0.9)
- `docs/rules/brittle-assert.md` — fingerprint note (do not contradict)

## Interface contract (do not improvise)

### Commands

```text
gavel baseline write [repo-root] [--output gavel-baseline.json] [--config path]
gavel baseline check [repo-root] [--baseline gavel-baseline.json] [--config path]
```

- Register **one** CLI verb `baseline` in `scripts/cli.js` `scripts` map → `baseline.js` (new file).
- Subcommands `write` | `check` are argv to that script. Missing/unknown subcommand → exit **2** and a usage line.
- Default repo root: `process.cwd()` (same as `addDefaultRoot` for audit). `cli.js` `addDefaultRoot` should treat `baseline` like `audit`/`self-check` **only if** that helper still makes sense with a subcommand; if injecting cwd breaks `write`/`check` parsing, parse subcommand **first** in `baseline.js` and default root inside it. Do not break `gavel audit`.
- Default write path: `gavel-baseline.json` in the target repo root.
- Default check path: `gavel-baseline.json` in the target repo root; `--baseline` overrides.
- `--help` / `-h` on `gavel baseline` prints usage, exit 0.
- `gavel --help` lists `baseline` among commands.
- **No** `package.json` `bin` alias `gavel-baseline` unless you also add it consistently — `adoption`/`flakiness` are CLI verbs **without** extra bins. Prefer **no** new bin.

### Schema

**Reuse `schemaVersion: "1.0.0"`.** Do not bump. Do not add required fields. Optional `$schema` string pointing at the existing schema id is allowed (valid.json already has it).

Write output **must** pass `node scripts/verify-baseline-schema.js gavel-baseline.json`.

`path`: repo-relative posix (forward slashes), no backslashes (schema `pattern: "^[^\\\\]+$"`).

`rule`: finding `tag`.

`snippetHash`: **exactly** `fingerprint({ file: path, tag: rule, snippet: text })` from `to-sarif.js`. Export `fingerprint` from `to-sarif.js` (`module.exports`) and use it. Do **not** copy a second hash implementation.

Self-check JSON uses `text`; SARIF uses `snippet`. Mapping: `snippet: finding.text`.

`generatedAt`: ISO-8601 UTC when the file was written.

`createdAt` per finding:

- `write` on a **new** file: all `createdAt = generatedAt`
- `write` when a previous baseline exists: **preserve** `createdAt` for identities already present; new identities get now. This is the ratchet clock. Document it in ENTERPRISE one line.

### `write` behavior

1. Run the same self-check the audit uses (spawn `self-check.js <root> --json` + `--config` if provided, same as `audit-report.js` `runSelfCheck`, **or** extract a shared scan helper — spawning is smaller).
2. Map each finding → `{ path: file, rule: tag, snippetHash, createdAt }`.
3. Deduplicate by identity (`path + rule + snippetHash`). Same finding twice → one row.
4. Write JSON (pretty-print 2 spaces, trailing newline).
5. Exit **0** on success. Scanner findings do **not** fail write (write is a snapshot). Self-check spawn status 1 (violations found) is **normal** — still write and exit 0. Spawn status 2 → exit 2.

### `check` behavior

1. Load baseline; missing file or schema-invalid → exit **2**.
2. Run self-check JSON (same as write).
3. Compute identity for each current finding.
4. **New** finding = identity not in the baseline set.
5. Git-aware (roadmap: “prefer findings on changed lines when git metadata exists”):
   - Try `git diff --name-only --diff-filter=ACMR HEAD` in repo root (reuse `affected-tests.js` export or copy the 10-line helper). If git fails or the list is **empty**, check **all** current findings against the baseline (full tree).
   - If the list is **non-empty**, only consider findings whose `file` is in that set (posix-normalized). Optional line filter: if you can get `git diff -U0` hunks cheaply, drop findings whose `line` is not in a changed hunk; file-level filter is the **minimum**. Do not require a network. Do not query GitHub.
6. Print new findings (same `tag file:line — text` style as self-check). If none, print a one-line OK.
7. Exit **1** if any **new** finding remains after the git filter. Exit **0** if all considered findings are baselined (even if the repo is full of old violations).
8. `failThreshold` does **not** apply to `baseline check`. A baselined `blocker` must not fail check. That is the whole point of the ratchet.

Do not implement `baseline merge` / `baseline prune`.

### CLI wiring gotcha

`cli.js` remaps exit for `audit` / `review` / `self-check` via `jsonReportExit`. **Do not** add `baseline` to that list — `baseline.js` owns 0/1/2.

### Docs (this session, required by verify-docs)

- `docs/CLI_MATRIX.md`: row `| \`gavel baseline\` | \`scripts/baseline.js\` (\`write\` / \`check\`) | **CLI** |`
- `docs/ENTERPRISE.md` baseline table: v0.8 schema only; **v0.12** command (not v0.9); v1.0 freeze. Fix the lie.
- `printHelp()` command list includes `baseline`.

CHANGELOG Unreleased bullet: session 13 can polish; add a one-liner here if you touch CHANGELOG anyway.

## Tests

1. Unit: `fingerprint` export stable; write mapping of a fake finding matches schema + hash of `file\\ntag\\ntext`.
2. Integration in `scripts/test/unit.test.js` or `verify-baseline-schema.js` extension:
   - Temp dir or `fixtures/baseline/cli/`: a small tree with one known violation.
   - `write` creates JSON that `verify-baseline-schema.js` accepts.
   - `check` exit 0 when the file is that snapshot.
   - Edit snippet or add a new violating line → `check` exit 1.
   - Identity ignores `line` (same snippet moved down still matches — hash has no line). If you move the **snippet text**, it is new — exit 1.
3. Usage: `gavel baseline` with no subcommand → 2.

Keep golden `fixtures/baseline/valid.json` valid.

## Commands

```bash
node scripts/cli.js baseline --help
node scripts/verify-baseline-schema.js
node scripts/verify-docs.js
npm run verify
```

## Done when

- [ ] `gavel baseline write` emits schema `1.0.0` JSON using SARIF fingerprint identity
- [ ] `gavel baseline check` fails only on unknown identities (git-filtered when diff exists)
- [ ] Exit 0/1/2 match the contract
- [ ] `fingerprint` is the single hash implementation
- [ ] CLI_MATRIX + ENTERPRISE (v0.12, not v0.9) updated
- [ ] No `preset` work
- [ ] `npm run verify` green

## Out of scope

Policy presets (12). Version bump. GitHub Action changes beyond docs if the SARIF template mentions v0.9 baseline — grep `v0.9` / `gavel baseline` under `templates/` and `docs/` and fix stale “until v0.9” sentences in this session if they would remain false after the command exists.
