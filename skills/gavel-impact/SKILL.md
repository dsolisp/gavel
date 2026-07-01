---
name: gavel-impact
description: >
  Correlate test failures with recent application commits. Identifies which
  deployable CI runs, maps failure clusters to suspect commits, and classifies
  test-maintenance-drift vs app regression. Use after gavel-analyze or when asked
  which commit broke tests.
---

# Gavel Impact

Commit-to-failure correlation. Read-only on application repositories; heal
automation only.

## When to Use

- CI failed after merge / nightly / scheduled run
- gavel-analyze flagged **test-maintenance-drift**
- Local passed recently, CI fails now
- "Which commit broke these tests?"

## Workflow

### 1. Define the failure cluster

From report output or gavel-analyze:

- Shared user flow or route
- Shared error pattern (locator timeout, missing control, contract mismatch)
- Shared test file, tag, or feature area

### 2. Resolve which application CI exercises

Read CI/CD config (checkout steps, docker compose, deploy targets):

- Which repo provides the UI or API under test
- Which branch/ref CI pins vs what developers run locally
- Whether multiple app repos exist (admin vs client, api vs worker)

Do not assume the nearest similarly-named repo is the one CI runs.

### 3. Correlate commits

```bash
git -C <application-repo> log -N --oneline --date=short
git -C <application-repo> log -N --oneline -- "<path-glob-for-failing-area>"
```

If failures span UI + API, check both application repos for commits in the same
time window.

### 4. Inspect the change surface

```bash
git -C <application-repo> diff <commit>^..<commit> -- <relevant-paths>
```

Look for: renamed labels, restructured components, removed actions, new async
loading gates, new API dependencies, auth/permission changes.

### 5. Classify and output

```markdown
## Impact Analysis

**Cluster:** <feature/area> — <N> failures — <error pattern>
**CI application repo:** <name> @ <ref>
**Automation repo:** <name> (writable)
**Likely commit:** `<hash>` — <message> — <date>
**Related commits:** <api/contract changes if applicable>
**Classification:** test-maintenance-drift | app-regression | inconclusive
**Recommended action:** update automation | file bug | re-check env
```

## Classification Guide

| Evidence | Classification |
|----------|----------------|
| UI redesign, labels/controls changed, feature shipped intentionally | test-maintenance-drift |
| Same test logic, element genuinely broken, no recent UI redesign | app-regression → gavel-bug |
| Connection refused, missing seed, wrong URL | env → gavel-env |
| Cannot tie to a commit; intermittent | inconclusive → gavel-flake or more data |

## Local vs CI Drift

| Signal | Likely explanation |
|--------|-------------------|
| Local pass, CI fail, same branch name | Local checkout behind CI tip |
| Different app repo assumed locally | Wrong source inspected for locators |
| Failures start after single merge | That merge is primary suspect |
| API + UI commits same day | UI may depend on new API — check both |

## Boundaries

- Read-only on application repositories
- Does not implement fixes (→ gavel-healer)
- Does not run tests (→ gavel-run)
- Intentional product changes are not bugs — update tests, do not file app bugs
