# ship-board

A pane beside the chat that shows what is still unshipped across your git worktrees.

## What it does

Run `/ship-board`. The pane lists every folder under `E:/Projects/worktrees`, one entry each:

```
Unpushed work or a failed run
myapp-new-feature
  new-feature | 2 dirty | 1 unpushed | not merged | run: success
```

- **Header:** green when everything is pushed, red when any worktree has unpushed commits or its last CI run failed.
- **Per worktree:** branch, dirty file count, unpushed commits, whether the branch is already merged into `main` (so you know it can be removed), and the last `gh run` result.
- **Refresh:** after any Bash command that mentions `git`, `gh` or `new-worktree`, and with the Refresh button.

## Why

"Is it pushed? Did the deploy pass? Which worktrees can I delete?" came up again and again across parallel sessions.

## Setup

- Needs `git`, and `gh` signed in for the run column (it shows `no runs` without it).
- The worktree folder is the `ROOT` constant at the top of `hooks/register.tsx`; change it to yours.

Costs tokens: no. The git and gh checks run in the mod, not as tool calls.
