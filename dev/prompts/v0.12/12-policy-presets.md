# Session 12 — Policy presets (`recommended` | `strict` | `legacy` | `api-only`)

Obey `dev/prompts/v0.12/00-PROTOCOL.md`. Implement **only** this item. Tier A+R: this is the **second** irreversible public interface in v0.12 — **preset IDs**. Zero new rule tags. Baseline CLI must already exist (session 11) but you must not change write format.

## Why

Brownfield suites cannot flip `failThreshold: warning` overnight. Named presets let platform teams adopt incrementally. Explicit config keys **override** preset defaults.

## Read first

- `schemas/gavel-config.schema.json` — `additionalProperties: false`; no `preset` today
- `scripts/load-gavel-config.js` — `validateGavelConfig`, `loadGavelConfig`, `resolveGavelConfig`, `parseConfigFlag`
- `scripts/cli.js` — `valueFlags` (`--config` already), `threshold()`, `selfCheckExit` / `auditExit`
- `scripts/self-check.js` — `allowlist` via `isAllowlisted`
- `docs/ENTERPRISE.md` — “Policy packs (v0.9+)” is stale; IDs `recommended`, `strict`, `legacy`, `api-only` are correct
- `fixtures/config/paths-weighting.example.json`

## Frozen preset IDs

These four strings are the public interface. Do not add aliases (`default`, `soc2`, `mobile`). Unknown preset → **exit 2** with `Unknown preset: ...`.

### `recommended`

Intent: default balanced gate.

```js
{ failThreshold: 'warning' }
```

Same as today’s implicit default (`cli.js` `threshold()` already uses `warning` when unset). Applying this preset vs empty config must not change exit behavior.

### `strict`

Intent: higher fail threshold; fewer ignores tolerated.

```js
{ failThreshold: 'info' }
```

`info` findings (`ignore-no-reason`, `no-teardown`, `complex-locator`) now fail `self-check` / contribute to audit mapping. Do **not** delete allowlists the user set — “fewer ignores tolerated” means the **threshold**, not stripping `allowlist` they wrote. Do not clear `allowlist` on strict.

### `legacy`

Intent: brownfield / baseline-friendly.

```js
{
  failThreshold: 'error',
  paths: [
    { pattern: '**/*', weight: 0.5, label: 'legacy' },
  ],
}
```

`error` means `warning`/`info` heuristics do not fail the CLI gate; `error`/`blocker` still do. Path weight 0.5 lowers weighted suite-health (weights are 0–2 per existing schema). If the user already set `paths`, **do not replace them** (explicit override). Only inject this default `paths` when `config.paths` is absent after merge.

Do not auto-run `baseline check`. Document in ENTERPRISE that `legacy` + `gavel baseline check` is the adoption path.

### `api-only`

Intent: mute UI locator rules; keep assertion/layering.

Use **existing** `allowlist` shape (no new `mutedTags` config key unless you cannot express mute otherwise). Prefer:

```js
{
  failThreshold: 'warning',
  allowlist: [
    { file: '*', tag: 'selector-leak' },
    { file: '*', tag: 'complex-locator' },
  ],
}
```

`isAllowlisted` already supports `file === '*'`. Confirm it matches all files (`entry.file === '*' || entry.file === file`). If not, do not change matching globally without tests — fix the preset to use whatever the current allowlist already supports.

Do **not** mute `expect-in-action`, `manual-wait`, `no-di`, `bare-test-fail`, `hardcoded-env`, `brittle-assert`.

If the user supplies their own `allowlist`, **concat** (user entries win / are added), do not drop preset mutes unless they explicitly set `allowlist` and you document that explicit `allowlist` **replaces** preset allowlist. **Required merge rule (pick this):**

1. Start with preset object.
2. Shallow-merge user config keys on top (`user.failThreshold` wins).
3. Arrays: if the user set `allowlist` or `paths`, the **user array replaces** the preset array for that key (explicit override). If they omitted the key, keep preset arrays.

Document that in ENTERPRISE one paragraph.

## Config + CLI

### Schema

Add to `schemas/gavel-config.schema.json`:

```json
"preset": {
  "type": "string",
  "enum": ["recommended", "strict", "legacy", "api-only"]
}
```

Keep `additionalProperties: false`.

### Loader

`validateGavelConfig`: `preset` if present must be one of the four.

`loadGavelConfig` / `resolveGavelConfig`: after reading JSON, `applyPreset(config)` → merged object used by scanners. Store `preset` on the object so dumps still show what was asked.

CLI `--preset <id>`:

- Add `--preset` to `cli.js` `valueFlags`.
- Parse it (extend `parseConfigFlag` **or** a sibling `parsePresetFlag`) so it is stripped before script argv.
- Apply **after** file config: CLI `--preset` overrides `gavel.config.json` `"preset"` (CLI is more specific). Then explicit keys in the file still override preset defaults (`failThreshold` in file wins over preset even if CLI `--preset strict` — **conflict**. Resolve as:

**Required:** CLI `--preset` selects which default pack to load. File `failThreshold` / `allowlist` / `paths` still override that pack. File `"preset"` is used when CLI `--preset` is absent.

If both CLI `--preset legacy` and file `"failThreshold": "info"`, result is legacy pack + `failThreshold: info`.

Unknown `--preset` → exit 2 **before** spawn.

### Apply in self-check / audit

`self-check.js` already calls `loadGavelConfig`. Ensure it uses the merged config (allowlist + failThreshold live in cli.js for exits; allowlist lives in self-check). If self-check loads config independently, it must apply the same merge function. **Export `applyPreset` / `mergeGavelConfig` from `load-gavel-config.js`** and use it in one place.

`cli.js` `threshold(config)` must see merged `failThreshold`.

## Fixtures

`fixtures/config/preset-recommended.json`, `preset-strict.json`, `preset-legacy.json`, `preset-api-only.json` — each `{ "$schema": "...", "preset": "<id>" }` plus one override example e.g. `preset-strict-override.json` with `"preset": "strict", "failThreshold": "blocker"`.

Unit tests:

- `recommended` → `failThreshold === 'warning'`
- `strict` → `info`
- `legacy` → `error` and default paths weight 0.5 when paths omitted
- `api-only` → allowlist mutes `selector-leak` on `file: '*'`
- override: `preset: strict` + `failThreshold: blocker` → blocker
- unknown preset throws / validate error
- CLI unknown `--preset` exit 2 (spawn `cli.js`)

Optional: run self-check on `fixtures/self-check/violations` with `--config` api-only and assert no `selector-leak` in findings (or they are allowlisted away). `complex-locator` too.

## Docs

- `docs/ENTERPRISE.md`: Policy packs **v0.12**; table of four IDs; merge/override rules; `legacy` + `gavel baseline check`.
- `docs/CLI_MATRIX.md` only if `--preset` needs a mention — not a new verb. Help text: `gavel --help` does not need to list flags if it currently does not; `Usage:` line may include `[--preset name]`.
- `skills/gavel-init` / README config examples: add `"preset": "legacy"` only if those files already show `gavel.config.json` snippets (grep). Session 13 can finish README; do ENTERPRISE here because it is the buyer surface for this interface.

## Commands

```bash
node --test scripts/test/unit.test.js
node scripts/cli.js self-check fixtures/self-check/violations --preset api-only --json
node scripts/verify-docs.js
npm run verify
```

(`--json` may be passed through to self-check; config merge must happen in cli **or** self-check — if cli only spawns, pass `--preset` through to self-check and teach `self-check.js` / `loadGavelConfig` to read it. Smallest: parse `--preset` in `parseConfigFlag` companion, merge in `resolveGavelConfig({ preset })`, pass `--config` to a **temp merged file** — ugly. Better: `loadGavelConfig` accepts `options.preset` from CLI parse in both `cli.js` and `self-check.js`. Duplicate parse is OK if you export `parsePresetFlag`.)

**Smallest recommended:** extend `parseConfigFlag` to also return `preset`, and `loadGavelConfig(root, { configPath, preset })` applies it. `cli.js` must pass `preset` into `resolveGavelConfig`. `self-check.js` already uses `parseConfigFlag` — thread `preset` there too so `node scripts/self-check.js` works without the unified CLI.

## Done when

- [ ] `"preset"` in config schema enum of exactly four IDs
- [ ] `--preset` works; unknown → exit 2
- [ ] Explicit keys override preset defaults
- [ ] Four intents match the table above
- [ ] ENTERPRISE documents v0.12 packs (not v0.9)
- [ ] `npm run verify` green

## Out of scope

New mutedTags schema key if allowlist suffices. Changing baseline identity. Version bump.
