# TEMP-REMOVE: Gavel Ecosystem Repository Architecture Discussion
#
# This file is a temporary working document. Remove before shipping.
# It documents the 1/2/3-repo architecture decision for Gavel + Bailiff.

---

# Gavel Ecosystem: Repository Architecture Discussion

**Date:** 2026-07-04
**Context:** Defining the scope boundaries between Gavel and future sibling repositories.

---

## The Problem

Gavel started as a test-code quality enforcement tool. Over time, it accumulated skills that don't belong in that scope:

- Test planning (`gavel-plan`)
- Bug reporting (`gavel-bug`)
- Environment provisioning (`gavel-env`)
- Issue-tracker closure (`gavel-close`)
- CI orchestration (`gavel-ci`)
- Credential management (`gavel-hub`)
- Branch workflow (`gavel-pr-prep`)
- App source-code navigation (`gavel-triage`)

These are **QA workflow operations**, not test-code quality enforcement. Bundling them in Gavel dilutes its identity and creates scope creep.

---

## Option A: One Repo (status quo)

**Gavel does everything** — test code quality, QA workflow, test authoring, CI, environments.

| Pros | Cons |
|------|------|
| Users install one tool | Scope creep inevitable |
| No coordination overhead | Identity becomes blurry |
| Simple maintenance | "Gavel" means different things to different people |

**Verdict:** Rejected. Gavel's core identity (judge/verdict on test quality) gets diluted by operational workflow tools.

---

## Option B: Two Repos (chosen)

### Gavel — The Judge

Everything about **test code**:

- **Writes:** new tests, POMs, factories, refactors (`gavel-e2e`, `gavel-api`, `gavel-generator`, `gavel-init`)
- **Reads:** audits, reviews, self-checks, failure classification (`gavel-audit`, `gavel-review`, `gavel-self-check`, `gavel-analyze`)
- **Diagnoses:** flaky tests, failing tests, refactor impact (`gavel-flake`, `gavel-heal`, `gavel-refactor`, `gavel-impact`)
- **Tracks:** deliberate deferrals (`gavel-debt`)

### Bailiff — The Court Officer

Everything about **QA workflow** (outside test files):

- Runs tests (CI, local env, nightly, quarantine)
- Plans test scenarios from tickets and requirements
- Writes bug reports from Gavel's verdicts
- Closes issue-tracker tickets after QA verification
- Manages external API credentials
- Prepares branches for PR
- Navigates to app source-code culprits

| Pros | Cons |
|------|------|
| Clear scope separation | Two repos to maintain |
| Each tool has a sharp identity | Users install two tools |
| Different evolution speeds | Need migration path for extracted skills |
| Prevents scope creep | |

**Verdict:** Chosen.

---

## Option C: Three Repos (rejected)

### Gavel — The Judge (quality only, no authoring)
### Bailiff — The Court Officer (workflow)
### Clerk — The Scribe (test authoring only)

The argument: authoring (writing new tests) and judging (auditing existing tests) are different activities.

**Why it was rejected:**

Authoring and judging share the same knowledge base:

- Framework detection (`gavel-detect`)
- POM architecture and locator strategy
- The Test Constitution and QA Ladder
- Framework profiles (Playwright, Selenium, Cypress, etc.)
- The same patterns that make a test "good" are the patterns used to write one

Splitting them creates friction:

- Users install 3 tools instead of 1
- Maintaining 3 repos, 3 CI pipelines, 3 release cycles
- Blurry boundaries that need constant policing
- Most QA engineers just want one tool for writing and maintaining tests

**Analogy:** ESLint lints AND fixes. Prettier formats AND validates. Playwright writes, runs, and debugs. Ruff lints, formats, and fixes. None split "writing" from "judging."

**Verdict:** Rejected. The authoring skills stay in Gavel.

---

## Browser-First Authoring Principle

When Gavel writes test automation, it does **not** guess from tickets or code alone. It opens a browser, navigates to the actual application, and observes real behavior before writing automation.

### Three-Source Model

Every test automation decision is grounded in three sources:

1. **Ticket requirements** — what the ticket says should happen
2. **Code implementation** — what the application code claims to do
3. **Actual app behavior** — what the browser actually shows

Source 3 is the tiebreaker. If they disagree, the browser wins. The test is written against reality, then a bug is filed for the discrepancy.

### Why This Matters

Writing automation from tickets and code alone produces tests that encode assumptions. When the app behaves differently, those tests fail — not because of a regression, but because the automation was built on an incorrect mental model.

Browser-first authoring eliminates this cycle:

- **Accurate locators** — written against the real DOM
- **Correct assertions** — assert what the UI actually shows
- **Realistic flows** — follow the actual user journey
- **Faster debugging** — failures are real regressions, not assumption mismatches

### This Is Not "Manual Testing"

It is the AI opening a browser context, inspecting the DOM, observing timing and state transitions, and using that evidence to write accurate automation. It takes seconds. It happens before the first line of test code is written.

The output is still automated tests. The difference is that those tests are grounded in observed reality rather than inferred assumptions.

---

## Skill Ownership Summary

| Skill | Gavel | Bailiff | Reason |
|-------|-------|---------|--------|
| `gavel-e2e` | ✓ | | Test authoring — uses Constitution + framework profiles |
| `gavel-api` | ✓ | | Test authoring — uses service layer patterns |
| `gavel-generator` | ✓ | | Test generation — uses framework patterns |
| `gavel-init` | ✓ | | Project scaffolding — sets up correct patterns |
| `gavel-audit` | ✓ | | Suite health audit — core quality |
| `gavel-review` | ✓ | | Diff review — core quality |
| `gavel-self-check` | ✓ | | Static analysis — core quality |
| `gavel-analyze` | ✓ | | Failure classification — core diagnostics |
| `gavel-heal` | ✓ | | Test bug vs app bug diagnosis — core diagnostics |
| `gavel-flake` | ✓ | | Flake root cause — core quality |
| `gavel-refactor` | ✓ | | Test code improvement — core quality |
| `gavel-debt` | ✓ | | Deferral tracking — core quality |
| `gavel-impact` | ✓ | | Commit correlation — core triage |
| `gavel-detect` | ✓ | | Stack detection — prerequisite for everything |
| `gavel-plan` | | ✓ | Test planning — QA workflow |
| `gavel-bug` | | ✓ | Bug report authoring — issue tracker workflow |
| `gavel-close` | | ✓ | Ticket closure — issue tracker workflow |
| `gavel-env` | | ✓ | Environment provisioning — infra workflow |
| `gavel-ci` | | ✓ | CI orchestration — infra workflow |
| `gavel-hub` | | ✓ | External credentials — infra workflow |
| `gavel-pr-prep` | | ✓ | Branch workflow — dev workflow |
| `gavel-triage` | | ✓ | App source navigation — app debugging |
| `gavel-oms` | | ✓ | Domain-specific setup — project-specific |

---

## Migration Plan

Skills marked for Bailiff live in `companion/` in the Gavel repo until Bailiff ships. Then:

1. Skills move to Bailiff repo
2. Gavel keeps stubs pointing to Bailiff
3. Gavel's orchestrator, README, and help stop routing to migrated skills
4. Bailiff ships its own README, verify gate, and workflow contracts

Timeline: Bailiff migration is tracked as v1.8.0 in the Gavel roadmap's Beyond v1.0.0 table.
