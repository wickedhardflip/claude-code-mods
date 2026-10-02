# subagent-models

Shows which model each subagent is running on, in the status line under the prompt.

## What it does

When Claude starts subagents, the status line shows one entry per subagent:

```
agents: haiku-4-5, sonnet-5-5
```

When a subagent finishes, its entry gets a check mark and stays visible until your next prompt, so a short run can't flash past:

```
agents: haiku-4-5 ✓, sonnet-5-5
```

If several subagents ran in one turn, they all stay listed. Submitting a prompt clears the line.

## Why

The built-in subagent list doesn't say what model each one is using. A default subagent model set in your settings, or a subagent picking its own, can make that a surprise.

## Install and run

```
claude --plugin-dir /path/to/claude-code-mods/subagent-models
```

To load it in every session, see [Install](../README.md#install).

Try it: ask Claude to "use the Explore agent to list the files in this folder, then reply done."

## Notes

- No tokens: it only reads which model each subagent resolved to.
- A subagent that started before the mod loaded shows `?` for its model.
- The name is the model Claude Code resolved, so an alias like `sonnet` appears as its full name, for example `sonnet-5-5`. A default subagent model set in your settings (`CLAUDE_CODE_SUBAGENT_MODEL`) overrides what Claude chooses.

## How it works

Hooks on `agent.spawn` (records the model each subagent started with), `turn.complete` and `tool.call` (refresh which are still running), and `prompt.submit` (clears). It writes through `$.ui.status`.
