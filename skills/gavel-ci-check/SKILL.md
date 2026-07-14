---
name: gavel-ci-check
description: >
  Diff-based CI safety verdict. Scans branch changes for new env vars,
  secrets, npm deps, workflow steps, and process.env references that
  aren't provisioned by CI. One-shot report: safe or unsafe to merge.
  Use when the user says "gavel-ci-check", "/gavel-ci-check", "will this
  break CI", "check CI safety", or "env var audit before merge".
---

# Gavel CI Check

Deliver a verdict on whether the current branch is safe to merge without
breaking CI. Scans the diff against main for environment, secrets, and
dependency changes.

## Scan Steps

### 1. Identify CI Workflow

Find the CI definition:
- GitHub Actions: `.github/workflows/*.yml`
- GitLab CI: `.gitlab-ci.yml`
- Jenkins: `Jenkinsfile`
- Azure DevOps: `azure-pipelines.yml`

### 2. Diff-Based Environment Audit

Run `git diff origin/main..HEAD` and check:

| Signal | Risk | Verdict |
|--------|------|---------|
| New `process.env.X` in added lines | Missing CI env var | **unsafe** |
| New `os.environ["X"]` in added lines | Missing CI env var | **unsafe** |
| New import of a package not in lock file | Missing CI dependency | **unsafe** |
| New `npm`/`pip` package in package.json/requirements.txt not in lock | Build break | **unsafe** |
| Changes to `.github/workflows/*.yml` | CI pipeline change | **review** |
| Changes to Dockerfile or docker-compose | Infrastructure change | **review** |
| New hardcoded URL, IP, or port | Env mismatch | **review** |
| New secret/token reference | Missing CI secret | **unsafe** |

### 3. Cross-Reference CI Provisions

For each `process.env.X` or `os.environ["X"]` found in the diff:
1. Check if the CI workflow sets it (inline, env-file, or secrets)
2. Check if `.env.example` documents it
3. Check if it has a sensible fallback/default

### 4. Credential Scan

Check diff for accidentally committed credentials:
- `password`, `secret`, `token`, `api_key`, `private_key` in non-env files
- `.pem`, `.key` files
- Base64-encoded blocks > 100 chars

## Output

```
gavel-ci-check verdict:

  Branch: <branch-name>
  Diff:   <N> files, +<ins>/-<del> lines

  Environment:
    New process.env references: <count>
    CI-provisioned: <count>/<total>
    Missing in CI: <list>

  Dependencies:
    New packages: <count>
    Lock file in sync: yes/no

  Workflow changes: <count> files
  Credential leaks: <count>

  VERDICT: <SAFE | UNSAFE | REVIEW>

  <If UNSAFE: list what to add to CI>
  <If REVIEW: list what to double-check>
```

Safe verdict: `Verdict: Safe. Ship it.`
Unsafe verdict: `Verdict: Unsafe. Fix: <list>.`

## Boundaries

Read-only. Scans diff and CI config. Does not modify any files.
Does not run CI. Does not check test correctness.
"gavel-ci-check" or "/gavel-ci-check" to invoke.
"stop gavel-ci-check" or "normal mode" to revert.
