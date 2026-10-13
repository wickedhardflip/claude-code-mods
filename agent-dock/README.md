# agent-dock

Pick a team size and Claude splits the job across that many subagents. A band above the prompt shows a live line for each helper, with the model it runs on.

## What it does

- `/dock 3` adds a system-prompt section telling Claude to split separable work into at most 3 parallel subagents. `/dock 0` turns it off. The size is 0 to 8.
- While anything besides the main session is running, a band above the prompt shows one line per worker:

```
╭──────────────────────────────────────────────────────────────╮
│ Agent Dock 3 running, 1 done                                 │
│ ▶ Main session [opus-5-5] main · 4 tools · Agent             │
│ ▶ Scan README  [haiku-4-5] agent · 6 tools · Glob            │
│ ▶ code task    [qwen2.5-coder:14b] ollama · 1 tools · Bash   │
│ ✔ Review diff  [sonnet-5-5] agent · 9 tools · Read           │
╰──────────────────────────────────────────────────────────────╯
```

- **Subagents:** name, model, tool count and last tool, updated live. Running lines are colored; finished lines are green.
- **Ollama and Gemini:** calls to `mcp__ollama*` and `mcp__gemini__*` tools get their own line, plus a Bash `curl` to the local Ollama API (port 11434). The model shows when the call names one.
- **Collapses when idle:** the band is hidden unless a helper is running, and never takes more than 7 rows. It clears its lines on your next prompt.

## Limits

- A backgrounded Bash call has no completion event, so its Ollama line counts as running for its `curl -m` timeout (60 seconds if none is given).
- Gemini's model shows only as `gemini` unless the call carries a `model` argument.

## Install and run

```
claude --plugin-dir /path/to/claude-code-mods/agent-dock
```

To load it in every session, see [Install](../README.md#install).

## Costs

The mod makes no model calls. `/dock` adds one short paragraph to the system prompt.
