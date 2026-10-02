# run-breakdown

After a long run, a band above the prompt lists which model and effort level each part of the work ran under.

## What it does

When a prompt takes longer than the threshold, the band shows:

```
Last run took 2m 10s
- Main session: opus-5-5, effort high
- Explore: find auth code: sonnet-5-5, effort medium
- Gemini: gemini-analyze-code x2
- Ollama: qwen2.5:3b (explain_file)
```

- **Main session:** the model and effort of the main conversation. This also shows when there are no subagents.
- **Subagents:** one line per subagent that ran, with its model and effort.
- **Gemini and Ollama:** calls to the `mcp__gemini__*` and `mcp__ollama-claude__*` tools, with a count when called more than once. These are tool calls to MCP servers, not subagents, so they're detected by tool name. The Ollama model name appears only if the call carries a `model` argument; otherwise it says `default model`.

The band clears when you submit your next prompt.

## Why

Mixed setups (different models for the main session, subagents and delegated tools) make it easy to lose track of what ran where.

## Install and run

```
claude --plugin-dir /path/to/claude-code-mods/run-breakdown
```

To load it in every session, see [Install](../README.md#install).

## Settings

In `hooks/register.tsx`:

- `MIN_MS` is how long a prompt must take before the band appears. It is 5 seconds while testing; 30 seconds is the planned everyday value.
- To track other external tools, add a branch in the `tool.call` hook that matches their tool-name prefix. The two MCP prefixes are specific to the author's setup, so change them to match yours.

## Cost

No tokens. It only reads what the engine already knows about each request.

## How it works

`turn.step` records each request's model and effort per loop (main or subagent id), `tool.call` counts Gemini and Ollama calls, `turn.complete` builds the list when the run was long enough, and a `ui.render` hook on the `AbovePrompt` band draws it.
