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

The skill is one file: [`skills/ponytail/SKILL.md`](skills/ponytail/SKILL.md). Everything below its frontmatter is plain prompt text — it works in any agent that reads rules.

**Claude Code**

```bash
git clone https://github.com/DietrichGebert/ponytail.git
cp -r ponytail/skills/ponytail ~/.claude/skills/   # personal, all projects
# or: cp -r ponytail/skills/ponytail .claude/skills/   # this project only
```

**Cursor** — save the SKILL.md body as `.cursor/rules/ponytail.mdc`, or paste it into *Settings → Rules for AI*.

**Windsurf** — save it as `.windsurf/rules/ponytail.md`, or add it to your global rules.

**Cline** — save it as `.clinerules/ponytail.md`.

**Aider** — save it as `PONYTAIL.md` and start with `aider --read PONYTAIL.md`.

## Trigger Words

With Claude Code the skill activates on its own when you say any of:

`ponytail` · `be lazy` · `lazy mode` · `simplest solution` · `minimal solution` · `yagni` · `do less` · `shortest path`

— or when you complain about over-engineering. Other tools apply rules files unconditionally.

## Token Savings

Ponytail saves tokens on two levels at once:

1. **Shorter output** — less code written, fewer output tokens.
2. **Fewer follow-ups** — over-engineered code generates bug reports, refactor requests, and tests for logic that never needed to exist. Ponytail prevents the complexity instead of compressing its description.

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
