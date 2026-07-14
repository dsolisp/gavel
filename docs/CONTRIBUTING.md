# Contributing to Gavel

## Verify gate

From the package root:

```bash
npm run verify
```

Green verify is required before any release commit. See [RELEASE_CHECKLIST.md](../RELEASE_CHECKLIST.md).

## Implementation Contract

Non-negotiables for rules, envelopes, and boundaries live in [AGENTS.md](../AGENTS.md). Read that before adding a rule tag or public interface.

## Model tiers and working protocol

Roadmap items are implemented **one item per session, one model per item**. Finish the item, get `npm run verify` green, commit, then switch model if the next item is a different tier.

| Tier | Use for |
|------|---------|
| **A — Frontier reasoning** | Irreversible interfaces: CLI/exit codes, schemas, MCP, scoring rubrics |
| **B — Coder** | Templated work against an approved contract: rule tags, verify scripts, fixtures |
| **C — Bulk** | Mechanical verify-gated edits: docs, sample repos, profile snippets |
| **R — Cross-review** | Adversarial review of Tier-A output; **different model family** than the author |

**Protocol:**

1. Fresh session with the item’s tier model; pass the roadmap row + `AGENTS.md`.
2. Implement only that item.
3. Verify green → commit on the release branch.
4. Tier-A items get a Tier-R pass before merge (batched when the release says so).
5. Never carry one session across items.

Tier-A designs; Tier-R **flags, never fixes**. The original implementer applies fix-pass changes.

## Budgets

- ≤ **5** new rule tags per minor release
- ≤ **2** irreversible public interfaces per minor release unless the roadmap names an explicit exception and cross-review gate

## Docs that must stay aligned

| File | Role |
|------|------|
| `package.json` + 6 manifests | Single pinned semver (`scripts/check-versions.js`) |
| `CHANGELOG.md` | Keep a Changelog |
| `docs/README.md` | Version line must match package |
| `docs/CLI_MATRIX.md` | CLI vs agent-only honesty |
| `docs/ENTERPRISE.md` | Buyer / platform trust page |
| `docs/BAILIFF.md` | Sibling-repo planning (no Bailiff code here) |

## Release tagging

Tag `vX.Y.Z` only when all seven version files equal `X.Y.Z` and CHANGELOG has that section. Do not push tags from automation agents unless the maintainer requests it.
