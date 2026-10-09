# Changed-code PR gate

`gavel pr-check` is a deterministic static gate. It does not call an LLM, run application tests, vote on a PR, or mutate the scanned repository.

```bash
node scripts/cli.js pr-check ../automation \
  --base <captured-target-commit> --head <captured-merge-commit> \
  --json --out pr-check.json
```

Both revisions are mandatory. The command resolves them to commits, materializes isolated snapshots using Git blobs, and scans both with the same trusted policy. Dirty files, staged changes and local merge conflicts are not part of the scan.

Snapshots materialize supported source files, project manifests, `package.json` and `gavel.config.json`, not unrelated APKs, images or test-report assets. This keeps large mobile binaries out of the Git object buffer without removing the code context needed by the scanner.

## Blocking contract

An occurrence blocks only when it is new relative to the base, its finding points to an added/replacement line in the after snapshot, and the rule provides local evidence. Existing violations elsewhere in a touched file, class, method or test do not block.

Unchanged occurrences consume the historical allowance before changed occurrences. Copying an existing violation to another line therefore creates a new occurrence and fails. Pure renames preserve history; deleted files do not create added-line violations. New code files are evaluated through their added lines. Indentation-only changes can preserve the same finding identity.

The protected base policy is loaded from the base snapshot. `--config` selects an explicit trusted policy file instead. The PR's after-version configuration cannot weaken the gate. Inline `gavel-ignore` / `gavel-allow` directives are neutralized in both temporary snapshots for this command only; authorize exceptions through the protected policy, not a PR-authored comment. Existing audit/self-check commands retain their suppression behavior.

New line-attributable findings block regardless of the ordinary audit `failThreshold`, including `complex-locator` and `bare-test-fail`. A new dead locator blocks only on its added declaration line. Removing the consumer of an unchanged old declaration does not make that old declaration an added line.

`no-step`, `no-teardown`, `fat-method`, `thin-wrapper`, and test-ID aggregate findings cannot establish instruction-level causality with their current evidence. They are informational in this gate. New findings outside added lines appear under `unattributed`; the gate never expands them to the containing function or class. Deletion-only assertion loss is outside this added-code contract; use a separately approved assertion-diff check if needed.

The gate inherits the existing detectors' supported syntax and heuristic limits, including line-oriented locator detection. It is not an AST compiler or proof that every possible new bug is absent. Do not reinterpret an informational result as a clean architecture audit.

## Exit codes and evidence

| Code | Meaning |
|---|---|
| 0 | No new attributable violations |
| 1 | New attributable violations; reject the PR |
| 2 | Usage, commit, Git, snapshot, scanner or diff failure; validation incomplete |

The report contains exact base/head SHAs, changed-file count, status, `findings` and `unattributed`. Public findings contain rule, path, line and optional subcase, never source snippets or credential values. Full code context is used internally, but does not widen the blocking scope.

Diff limits are the existing defaults: 100 supported changed code files, 5,000 added lines and 500,000 patch bytes. Limits are not silently truncated. Binary source files, unsafe paths, symlinks in analysis inputs and unreadable snapshots return code 2. Code extensions are C#, JavaScript/TypeScript, Python, Java and feature files; docs/assets and submodule contents are outside this gate.

## Azure Repos

Use [pr-static-check.yml](../templates/azure-pipelines/pr-static-check.yml) as an independent validation job. It verifies the Azure PR merge ref and uses that merge's captured target parent as the base. Both line coordinates and scanned content therefore refer to the same after commit; target-branch history is not included as new PR code.

The caller must declare a `gavel` repository resource pinned to an approved immutable commit and supply the same 40-character `gavelCommit` parameter. The job verifies the checkout before executing the scanner. Do not execute a scanner from the PR source tree or install packages/scripts supplied by that PR. Configure repository-resource read access separately; this gate needs no bank credentials or application environment.

In Azure Repos branch policies, add this pipeline as **Build validation / Required / Automatic**, with expiration **Immediately when the target branch is updated**, on the actual `main` or `master`. A YAML `pr:` trigger is not the Azure Repos enforcement mechanism. Restrict policy bypass permissions.

Protect the pipeline definition, template, pinned scanner reference and exception policy from unauthorized PR changes. Pinning a checkout is insufficient if the PR author can change both the expected SHA and the validation job. Use a centrally governed definition or mandatory owner review for the gate's trust configuration. Branch policy enablement is an administrator action; adding the template alone does not protect a branch.

The job is separate from UI/Appium execution, publishes sanitized evidence on success or failure, and does not depend on previous review snapshots or the last commit only. Every build re-evaluates the complete captured PR delta.

## Verification

```bash
node --test --test-name-pattern="PR check" scripts/test/unit.test.js
npm run verify
```

The acceptance checks cover an innocent edit inside a historically faulty function, a new identical violation, rename with spaces, after-policy and inline suppression bypass attempts, deletion-only changes, invalid revisions, structural header edits and new dead-locator declaration evidence. The IBP regression range `d177209` to `c1a626c` was also checked: the gate rejects its new selector leak and complex locators without treating old suite totals as PR failures.

### Eight-project compatibility check (2026-10-09)

```bash
node scripts/verify-pr-check-repos.js <workspace-parent>
```

The harness creates isolated, no-checkout shared clones and temporary commits; it never edits or commits to the source repositories. These projects all use C# / .NET 8 / NUnit. The probe APIs match their actual Appium or Playwright surface; package-version differences do not require runtime imports, browsers or devices for static validation.

| Project | Stack | Unchanged historical debt | New violations | Clean edit inside faulty method |
|---|---|---|---|---|
| BNMovil | Appium/NUnit | PASS (0) | REJECT (1) | PASS (0) |
| BNMovil_Huawei | Appium/NUnit | PASS (0) | REJECT (1) | PASS (0) |
| BNM_iOS | Appium/NUnit | PASS (0) | REJECT (1) | PASS (0) |
| BNM_Empresarial | Playwright/NUnit | PASS (0) | REJECT (1) | PASS (0) |
| BNServicios | Playwright/NUnit | PASS (0) | REJECT (1) | PASS (0) |
| BNSinpeMovil | Playwright/NUnit | PASS (0) | REJECT (1) | PASS (0) |
| IBC_UI | Playwright/NUnit | PASS (0) | REJECT (1) | PASS (0) |
| IBP_UI | Playwright/NUnit | PASS (0) | REJECT (1) | PASS (0) |

All 24 CLI executions matched the expected exit contract. Each negative case verified `manual-wait`, `no-di`, `selector-leak` and `dead-locator` at the exact added file/line, and asserted that no historical repository finding entered the blocking list. IBC validation used committed snapshots despite its local conflicts. Mobile binaries exposed a snapshot-buffer problem during this verification; restricting snapshots to analysis inputs fixed it before the eight-project matrix passed.

This is static-check compatibility, not a claim that application builds, pipelines or functional tests passed. The harness is opt-in because the eight external repositories are not dependencies of the public Gavel package's unit tests. New languages or frameworks require their own capability/fixture checks rather than inheriting this matrix's verdict.