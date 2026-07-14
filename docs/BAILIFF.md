# Bailiff (planning only)

**Status:** Future sibling repository. No Bailiff code, agents, or scripts ship inside Gavel.

## Boundary Rule

| Artifact lives… | Owner |
|-----------------|-------|
| Inside the test codebase (specs, POMs, locators, factories, fixtures, helpers) | **Gavel** |
| Outside it (tickets, test plans, bug filing, environments, credentials, CI orchestration, branch workflow) | **Bailiff** |

Metaphor: *Gavel delivers the verdict. Bailiff executes the order.*

## Why two repos

- **One repo** rejected — workflow scope dilutes test-architecture identity.
- **Three repos** (separate authoring “Clerk”) rejected — authoring and judging share Constitution, profiles, and POM discipline.
- **Two repos** split by the Boundary Rule is the standing decision.

Until Bailiff exists, out-of-core workflows live in Gavel’s `companion/` (interim) or stay split-scope skills. Core `audit` / `review` / `self-check` never require Bailiff.

## Planned skill migrations

| Skill | Current home | Migrates to Bailiff |
|-------|--------------|---------------------|
| `gavel-plan` | core (split scope) | Test *case design*; test *code* stays in Gavel |
| `gavel-bug` | core (split scope) | Bug report filing; evidence/classification stay in Gavel |
| `gavel-close` | companion/ | Issue-tracker closure |
| `gavel-pr-prep` | — / emerging | Branch prep, merge, push |
| `gavel-env` | companion/ | Env provisioning, seeding, lifecycle fixtures |
| `gavel-ci` | companion/ | CI orchestration / cloud pipelines |
| `gavel-hub` | companion/ | External API credentials |
| `gavel-triage` | core (split scope) | App source navigation; test impact stays in Gavel (`gavel-impact`) |
| Browser-assisted planning | design only | Live exploration → planning envelope |

## Future Bailiff-native agents (sketches)

| Agent | Role |
|-------|------|
| `bailiff-env-ready` | Pre-flight doctor; readiness envelope for `gavel-analyze` |
| `bailiff-data-steward` | Entity lifecycle / orphan sweep; optional `no-teardown` confidence |
| `bailiff-enforce` | Infra enforcement (expiry SLA, quarantine ratchet); bug filing stays human-gated |

## Evidence contracts (design)

Gavel and Bailiff integrate only through versioned envelopes. Gavel never imports Bailiff code or shells out to Bailiff from core commands.

| Envelope | Owner | Consumed by | Purpose |
|----------|-------|-------------|---------|
| `gavel-result-envelope` | Gavel | Bailiff, agents, dashboards | Static verdict |
| `bailiff-readiness-envelope` | Bailiff | Optional `gavel-analyze` | `ready=false` → prefer `env` classification |
| `bailiff-planning-envelope` | Bailiff | Optional authoring | Approved scenarios + evidence |
| `bailiff-steward-envelope` | Bailiff | Optional audit confidence | Orphan signals — not exit codes in v1 |

## Case lifecycle

1. **Bailiff opens** — ticket → scenarios → env readiness → hands Gavel a plan + evidence.
2. **Gavel works** — authors/heals/audits test code → returns verdict.
3. **Bailiff closes** — bug filing, CI, story closure.

*Interim:* companion / split-scope skills play Bailiff’s part. Bootstrap is deferred to roadmap **v1.8.0**.

## Migration rules

- Skills stay in `companion/` until Bailiff can receive them.
- No skill is deleted — it moves; Gavel keeps a stub.
- After migration, orchestrator/README/help stop routing first-run users to Bailiff skills.
- Bailiff does not inherit Gavel’s Constitution or verify gate — it has its own contracts.

## Trend watch (Bailiff scope only)

Risk-based planning, ML locator governance, synthetic data stewardship, semantic traceability, observability-driven triage — all workflow artifacts under the Boundary Rule. None enter Gavel core.
