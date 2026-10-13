# clean-view

Hides the tool calls and code that scroll by while Claude works, and shows a short checklist of the plan instead.

## What it does

- **Hides tool rows:** the tool-call rows, their results, grouped calls and the "run in background" hint are not drawn.
- **Plan band:** while Claude is working and has a todo list, a band above the prompt shows it:

```
╭──────────────────────────────────────╮
│ Plan ████░░░░░░░░ 3/8 done, 5 left   │
│ ✔ Read the config                    │
│ ▶ Writing the migration              │
│ ○ Run the tests                      │
╰──────────────────────────────────────╯
```

  Done items are green and struck through, the current step is amber and bold, the rest are dim.
- **Collapses when idle:** the band disappears when the turn ends or when there is no plan. It never takes more than 6 rows (fewer on a short terminal); extra steps show as "… N more".
- `/cleanview` turns the mod off and on, which shows the tool rows again.

The plan comes from the main session's `TodoWrite` calls, so it only appears when Claude keeps a todo list. A subagent's list is ignored.

## Install and run

```
claude --plugin-dir /path/to/claude-code-mods/clean-view
```

To load it in every session, see [Install](../README.md#install).

## Costs

None. It makes no model calls.
