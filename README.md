# Claude Code mods

Small mods for [Claude Code](https://claude.com/claude-code) that put useful information where it doesn't scroll away: a status line, a band above the prompt, a plan checklist. Each mod is a self-contained plugin of function hooks, written with Claude's help.

Built and tested on Claude Code **2.1.287** on Windows. Mods are a recent Claude Code feature, so you need a build that has hook modules turned on.

| Mod | What it shows | Where | Costs tokens? |
| --- | --- | --- | --- |
| [subagent-models](subagent-models) | Which model each subagent runs on | Status line under the prompt | No |
| [session-recap](session-recap) | What the last prompt did, plus questions Claude is waiting on | Band above the prompt | Yes, one small Haiku call per prompt |
| [clean-view](clean-view) | Hides tool-call rows while Claude works; shows the plan as a colored checklist | Band above the prompt | No |
| [agent-dock](agent-dock) | `/dock N` (or a default size) splits work across N subagents; a live line per agent, Ollama and Gemini call, each with its model | Band above the prompt | No |
| [run-breakdown](run-breakdown) | After a long run: model and effort for the main session, each subagent, Gemini and Ollama | Band above the prompt | No |
| [tripwire](tripwire) | Blocks Bash commands that repeat known mistakes (heredoc source edits, relative ssh keys, hand-edited VMs, force pushes) | Status line under the prompt | No |
| [first-mod](first-mod) | Starter example: a toast on start and a tool-call counter | Toast and status line | No |

## Install

1. Clone this repo anywhere:
   ```
   git clone https://github.com/wickedhardflip/claude-code-mods.git
   ```
2. Pick how to load the mods.

**Try one for a single session** (nothing saved):

```
claude --plugin-dir /path/to/claude-code-mods/subagent-models
```

Repeat `--plugin-dir` to load several. On Windows, `.\dev.ps1` loads every mod in the folder, or `.\dev.ps1 subagent-models` just that one.

**Load them in every session.** Add a `CLAUDE_CODE_PLUGIN_DIRS` entry to the `env` block of your user settings, `~/.claude/settings.json`. Separate folders with `;` on Windows or `:` on macOS and Linux:

```json
{
  "env": {
    "CLAUDE_CODE_PLUGIN_DIRS": "C:\\path\\to\\claude-code-mods\\subagent-models;C:\\path\\to\\claude-code-mods\\session-recap"
  }
}
```

Open a new terminal afterwards. Sessions that are already open don't pick it up. Put it in your user settings, not a project's, because project settings are ignored for this.

Saving a mod's files reloads it live in a running session.

## Check a mod

```
claude plugin validate subagent-models
claude plugin test subagent-models
```

`validate` reads the manifest and source the way the engine will. `test` runs the mod's `*.test.ts` files, and needs hook modules turned on in your build.

## Layout

```
<mod-name>/
├── .claude-plugin/plugin.json   # name, version, description
└── hooks/
    ├── hooks.json               # { "modules": ["./register.ts"] }
    ├── register.ts(x)           # export const register = (on) => { ... }
    └── register.test.ts         # optional tests
```

A mod that keeps values for drawing also has `types/index.d.ts`, its state contract. `.claude-plugin/types/` is written by the engine when a mod loads; it is git-ignored.

## Make your own

Copy `first-mod`, rename the folder, and change `name` in `plugin.json`. The engine's API docs are in the types file it writes to `.claude-plugin/types/claude-code/index.d.ts` after a mod first loads.

## License

MIT
