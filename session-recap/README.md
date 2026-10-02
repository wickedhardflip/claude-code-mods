# session-recap

A band above the prompt that keeps the important bits from scrolling away: a short list of what the last prompt did, and the questions Claude asked you that still need an answer.

## What it does

After each prompt finishes, the band shows:

```
Done last prompt
- Added a status line that shows each subagent's model
- Kept the line visible after agents finish
- Validated the mod and ran a headless check
Open questions
? Should I add the new mod to your default load?
? Want a README for each mod?
[Clear questions]
```

- **Done last prompt:** 2 to 5 plain-English bullets for your most recent prompt only.
- **Open questions:** every question Claude has asked you this session that needed an answer. It can't tell when you've answered one, so use **Clear questions** when you're through them.
- The band is empty until the first prompt completes, and steps aside for any survey prompt.

## Why

When a run produces a lot of output, a question or a result in the middle gets buried as the conversation scrolls. This puts both in a fixed spot.

## Install and run

```
claude --plugin-dir /path/to/claude-code-mods/session-recap
```

To load it in every session, see [Install](../README.md#install).

Try it:

```
List the files in this folder, read the README, and tell me in two sentences what it's for. Then ask me which thing to work on next, and whether you should add tests.
```

## Cost

One small Claude Haiku 4.5 call per finished prompt (a few hundred tokens). It reads your prompt, a one-line list of the tool calls and Claude's final message. Interrupted prompts and subagent turns are skipped.

## Notes

- The band is capped at about half the terminal height; a taller one scrolls.
- The summary is only as good as Haiku's reading of the turn. Tune the instructions in `hooks/register.tsx` if the bullets are too long or too vague.

## How it works

`prompt.submit` and `tool.call` collect what the prompt did, `turn.complete` makes the Haiku call through `$.model.complete` and stores the result, and a `ui.render` hook on the `AbovePrompt` band draws it.
