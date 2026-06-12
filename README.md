<p align="center">
  <img src="assets/logo.png" width="220" alt="Ponytail — the lazy senior dev">
</p>

<h1 align="center">Ponytail</h1>

<p align="center">
  <em>Makes your AI agent think like the laziest senior dev in the room.<br>
  The best code is the code you never wrote.</em>
</p>

---

AI agents over-deliver. Ask for a date picker, get a component library.

With ponytail:

```html
<!-- ponytail: browser has one -->
<input type="date">
```

More before/afters in [examples/](examples/).

## How it works

Before writing code, the agent stops at the first rung that holds:

```
1. Does this need to exist?   → no: skip it (YAGNI)
2. Stdlib does it?            → use it
3. Native platform feature?   → use it
4. Installed dependency?      → use it
5. One line?                  → one line
6. Only then: the minimum that works
```

Never lazy about: validation at trust boundaries, error handling against data loss, security, accessibility.

## Install

Claude Code:

```
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
```

Active every session. `/ponytail lite|full|ultra|off` switches intensity, `/ponytail-review` hunts over-engineering, `/ponytail-help` explains the rest.

Cursor, Windsurf, Cline, Copilot, Aider: copy the matching rules file from this repo ([`.cursor/rules/`](.cursor/rules/), [`.windsurf/rules/`](.windsurf/rules/), [`.clinerules/`](.clinerules/), [`.github/copilot-instructions.md`](.github/copilot-instructions.md), [`AGENTS.md`](AGENTS.md)).

## Numbers

5 coding tasks, same agent with and without ponytail: **−16% tokens, ~4× faster, 293 → 47 lines of code.** Data: [benchmarks/](benchmarks/).

## License

[MIT](LICENSE). The shortest license that works.
