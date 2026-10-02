# first-mod

The starter mod. Use it as a template, or load it to check mods work on your build.

## What it does

- Shows a toast, `first-mod loaded`, when a session starts.
- Counts tool calls (Bash, Read, Edit and so on) and shows `tools: N` in the status line.

It doesn't change how Claude behaves.

## Run it

```
claude --plugin-dir /path/to/claude-code-mods/first-mod
```

## How it's built

`hooks/register.js` is about 15 lines: a `session.start` hook for the toast and a `tool.call` hook for the counter. Copy the folder to start a new mod.
