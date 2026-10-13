# agent-dock

Pick a team size and Claude splits the job across that many subagents. A band above the prompt shows a live line for each helper, with the model it runs on.

## What it does

- `/dock 3` attaches a note to each prompt you send telling Claude to split separable work into at most 3 parallel subagents. The note is context the model reads; it is not shown in your message. `/dock 0` turns it off. The size is 0 to 8.
- **Default size:** the `defaultSize` option sets the team size each session starts with (0 to 8, default 0, which leaves the dock off until you use `/dock`). `/dock` overrides it for that session.
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
- The note rides on each prompt, not the system prompt: since 2.1.296, Claude Code's built-in security plugin (`cc-plugin-sec-default`) skips a user mod's system-prompt hooks.

## Install and run

```
claude --plugin-dir /path/to/claude-code-mods/agent-dock
```

To load it in every session, see [Install](../README.md#install).

To start every session with a team, set `defaultSize` in the `pluginConfigs` block of `~/.claude/settings.json`, or change it in `/config`:

```json
{
  "pluginConfigs": {
    "agent-dock": { "options": { "defaultSize": 8 } }
  }
}
```

Claude Code refuses new subagents past `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` (default 20). If you have lowered it, keep it at or above your team size.

## Costs

The mod makes no model calls. While the dock is on, each prompt carries one short paragraph.
