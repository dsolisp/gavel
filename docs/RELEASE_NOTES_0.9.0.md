# Gavel 0.9.0

**Release date:** July 16, 2026  
**Codename:** Wait Intelligence

This release improves how Gavel classifies manual waits, scopes scans to test-relevant paths, and reports suite health with path-aware weighting. Rule severities are unchanged.

---

## Overview

Gavel 0.9.0 focuses on wait analysis and scan accuracy. Fixed sleeps are no longer treated as a single failure class. Findings distinguish redundant waits, stale-read risks, and intentional delays, and attach duration and replaceability metadata where applicable. Utility and IDE paths are excluded from default scans so health scores reflect test and page-object code.

---

## What’s New

### Manual wait classification

The `manual-wait` rule now assigns a sub-case to each finding:

- **Redundant** — a subsequent statement already waits or retries
- **Stale-read** — a fixed sleep precedes a DOM or state read
- **Intentional** — neither of the above; may be legitimate

Intentional waits that are replaceable (for example polling loops or post-API sleeps) include `replaceable` and `suggestion` fields. Python `time.sleep` inside a `while` loop is flagged with `pollingLoop` and a `threading.Event.wait()` suggestion. Agent and skill documentation specify a signal-driven `threading.Event` pattern; an event that is never set is not an accepted remediation.

### Time impact

Wait durations are parsed into `durationMs`. Audit JSON output includes `timeImpact` totals for estimating dead sleep across a suite.

### Scan scope

Rules declare `scope` as `test-only` or `all-files`. Configuration supports `excludePaths` (default: `scripts/**`, `fixtures/**`, `tools/**`, `utility_scripts/**`). Audit summaries report `excludedFileCount`.

IDE directories (`.claude`, `.qoder`, `.cursor`, `.vscode`) are excluded from scanning.

### Suite health path weighting

`gavel.config.json` may define `paths` entries with `pattern`, `weight` (0–2), and `label`. Suite health and audit reports show raw and weighted totals, grouped by label.

### Skip and ignore handling

Recognized skip prefixes (`SEED-DATA`, `ENV-LIMIT`, and others), plus configurable `skipPrefixes`, suppress skip-marker findings when present. Bare `gavel-ignore` is reported only in test, locator, and action files; documentation, utilities, and fenced examples are not flagged.

### Remediation guidance

`gavel-refactor` includes a five-step wait migration playbook, a per-tag remediation reference, and a cross-step data-flow check for large edits. Selector-leak guidance clarifies that the rule enforces placement (locators belong in locator classes), not locator quality alone.

---

## Behavior Changes

**Default scan coverage.** When `gavel.config.json` is absent or omits `excludePaths`, Gavel excludes `scripts/**`, `fixtures/**`, `tools/**`, and `utility_scripts/**`. Prior releases scanned those paths. Self-check prints a one-line notice when default exclusions apply.

To restore prior coverage:

```json
{
  "excludePaths": []
}
```

**Rule severities.** No severity or envelope severity changes ship in 0.9.0. Affected rules remain at their previous levels pending further evidence.

---

## Compatibility

| Requirement | Notes |
|-------------|--------|
| Upgrade from 0.8.x | Review `excludePaths` if you depended on findings under utility trees |
| Config schema | New optional fields: `excludePaths`, `paths`, `skipPrefixes`; existing configs remain valid |
| Output | `manual-wait` findings may include `subCase`, `replaceable`, `suggestion`, `durationMs`, `pollingLoop` |
| Verify gate | `npm run verify` unchanged in purpose; corpus precision checks include wait, skip, and ignore corpora |

Supported frameworks are unchanged: Playwright, Cypress, Selenium, WebdriverIO, Cucumber, Robot, and pytest-playwright.

---

## Installation

```bash
npm install @dsolisp/gavel@0.9.0
```

```bash
npx --yes @dsolisp/gavel@0.9.0 self-check .
npx --yes @dsolisp/gavel@0.9.0 audit . --with-self-check --audit-format
```

Documentation: [README](../README.md) · [Changelog](../CHANGELOG.md) · [Enterprise](ENTERPRISE.md)

---

## Resolved in this release

- Utility and fixture paths inflating suite health scores
- Uniform treatment of all fixed sleeps as equivalent violations
- Bare `gavel-ignore` in documentation and non-test utilities
- IDE tooling directories included in constitution scans
- Lack of duration metadata for wait-related findings

---

## Known limitations

- Skip-marker prefix suppression matches recognized tokens; free-text skip messages without those prefixes continue to report under the current contract
- Corpus sample sizes for new classifiers are modest; precision gates pass, but statistical power remains limited
- Severity graduation for `manual-wait`, `skip-marker`, and `ignore-no-reason` is deferred (HOLD)

---

Gavel 0.9.0  
© 2026 Gavel contributors. Released under the MIT License.
