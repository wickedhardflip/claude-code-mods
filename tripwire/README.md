# tripwire

Blocks Bash commands that repeat a mistake you have already paid for, and says why in one line so the model corrects course instead of retrying.

## What it does

When Claude is about to run a Bash command that matches a rule, the call is denied and the reason goes back to the model. The status line shows `tripwire: 2 blocked, last hand-edited-vm`.

| Rule | Blocks | Reason given |
| --- | --- | --- |
| `heredoc-edit` | A heredoc, python or sed rewrite of a source file | Use the Write or Edit tool; escapes become real tabs and newlines |
| `relative-ssh-key` | `ssh -i .ssh/key` with a relative path | Use the absolute key path |
| `hand-edited-vm` | `qm set`, `qm resize`, `qm destroy` | VMs are Terraform managed |
| `blind-terraform` | `terraform apply` or `destroy` with no plan file | Plan with `-out=tfplan`, then apply it |
| `nas-delete` | `rm` or `Remove-Item` under `/media`, `/volume1`, NAS mounts | Needs approval of the exact path |
| `force-push` | `git push --force`, `-f`, `--force-with-lease` | Needs you to say so first |

Scratch paths (scratchpad, temp) and `git commit` messages are exempt from `heredoc-edit`.

## Why

The same few mistakes came back across sessions even with written rules. A hook enforces them where a memory note only asks.

## Make it yours

The rules are the `rules` array at the top of `hooks/register.ts`: an `id`, a `test` on the command text and a `why`. Edit them for your own mistakes.

Costs tokens: no. A block costs the model one short reply, only when it fires.
