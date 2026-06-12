<p align="center">
  <img src="assets/logo.png" width="220" alt="Ponytail — the lazy senior dev">
</p>

<h1 align="center">Ponytail</h1>

<p align="center">
  <em>A skill that makes your AI agent think like the laziest senior dev in the room —<br>
  because the best code is the code you never wrote.</em>
</p>

---

## The Problem

AI coding agents are overenthusiastic by default. Give them a simple task and they will:

- Write 200 lines where 5 would work
- Build custom implementations when the standard library already has it
- Add dependencies when a native feature exists
- Generate boilerplate nobody asked for
- Abstract everything, over-engineer everything

**Ponytail fixes this.**

## What Ponytail Is

Ponytail is an AI agent skill. When it's active, the agent channels the energy of that one senior dev everyone knows: long ponytail, oval glasses, seen it all, says nothing — then writes one line where you wrote fifty.

Before writing any code, the agent walks this ladder and stops at the first rung that holds:

```
1. Does this need to be built at all?          → YAGNI
2. Does the standard library already do this?  → use it
3. Does a native platform feature cover this?  → use it
4. Does an existing package solve this?        → use it
5. Can this be done in one line?               → do it
6. Only then: write the minimum code that works
```

Intentional simplifications are marked with a `ponytail:` comment, so simple reads as deliberate — not naive.

## Examples

| Task | Without Ponytail | With Ponytail |
|---|---|---|
| [Email validation](examples/email-validation.md) | 27-line validator class | `"@" in email` — or let the confirmation mail reject it |
| [Date picker](examples/date-picker.md) | flatpickr + wrapper component | `<input type="date">` |
| [Sorting](examples/sorting.md) | hand-rolled quicksort | `arr.sort((a, b) => a - b)` |
| [Caching](examples/caching.md) | 120-line TTL cache class | `@lru_cache` — or nothing until you measure |
| [API endpoint](examples/api-endpoint.md) | 5 files of layers | 5 lines |

Full before/after in [examples/](examples/).

## Install

**Claude Code — plugin (full integration)**

```
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
```

Auto-activation every session, `/ponytail` levels, `/ponytail-review`, `/ponytail-help`, `[PONYTAIL]` statusline badge. Restart Claude Code after install.

**Claude Code — skill only**

```bash
git clone https://github.com/DietrichGebert/ponytail.git
cp -r ponytail/skills/ponytail ~/.claude/skills/   # personal, all projects
# or: cp -r ponytail/skills/ponytail .claude/skills/   # this project only
```

**Cursor** — copy [`.cursor/rules/ponytail.mdc`](.cursor/rules/ponytail.mdc) into your project.

**Windsurf** — copy [`.windsurf/rules/ponytail.md`](.windsurf/rules/ponytail.md).

**Cline** — copy [`.clinerules/ponytail.md`](.clinerules/ponytail.md).

**Aider** — `aider --read AGENTS.md` with [`AGENTS.md`](AGENTS.md) in the repo root.

**GitHub Copilot** — copy [`.github/copilot-instructions.md`](.github/copilot-instructions.md).

## Levels

| Level | Trigger | What changes |
|---|---|---|
| **lite** | `/ponytail lite` | Builds what's asked, names the lazier alternative in one line. |
| **full** | `/ponytail` | The ladder enforced. Questions necessity, stdlib first, shortest diff. Default. |
| **ultra** | `/ponytail ultra` | YAGNI extremist. Deletion before addition. Challenges the requirement before building. |

Deactivate: say "stop ponytail" / "normal mode", or `/ponytail off`.

## Commands

| Command | What it does |
|---|---|
| `/ponytail [lite\|full\|ultra\|off]` | Switch level |
| `/ponytail-review` | Over-engineering review — `L42: yagni: factory, one product. Inline.` |
| `/ponytail-help` | Reference card |

## Configure

The plugin auto-activates at `full` every session. Change the default:

```bash
export PONYTAIL_DEFAULT_MODE=ultra   # env var, highest priority
```

or `~/.config/ponytail/config.json` (Windows: `%APPDATA%\ponytail\config.json`):

```json
{ "defaultMode": "off" }
```

`off` = no auto-activation, `/ponytail` still works on demand. Statusline badge (`[PONYTAIL]`, `[PONYTAIL:ULTRA]`) offers to configure itself if no statusline is set.

## Trigger Words

With Claude Code the skill activates on its own when you say any of:

`ponytail` · `be lazy` · `lazy mode` · `simplest solution` · `minimal solution` · `yagni` · `do less` · `shortest path`

— or when you complain about over-engineering. Other tools apply rules files unconditionally.

## Token Savings

Ponytail saves tokens on two levels at once:

1. **Shorter output** — less code written, fewer output tokens.
2. **Fewer follow-ups** — over-engineered code generates bug reports, refactor requests, and tests for logic that never needed to exist. Ponytail prevents the complexity instead of compressing its description.

Measured (5 coding tasks, fresh agent per run, same model):

| Config | Agent tokens | Time | Code written |
|---|---|---|---|
| No skill | 161,955 | 479s | ~293 lines |
| Caveman | 138,410 | 136s | ~117 lines |
| **Ponytail** | **136,624** | 158s | **~47 lines** |

The no-skill baseline produced a 190-line countdown "dashboard" where ponytail shipped 13 lines. Full data: [benchmarks/](benchmarks/).

## Comparison to Caveman

| | Caveman | Ponytail |
|---|---|---|
| Core idea | Answer short | Solve minimal |
| Target | Response verbosity | Code complexity |
| Token savings | Output shorter | Output shorter **+ fewer follow-ups** |
| Character | Primitive caveman | Tired senior dev |

Same category — a character skill with a measurable effect — different problem. They stack nicely.

## License

[MIT](LICENSE). Ponytail would have chosen the shortest license anyway.
