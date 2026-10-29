import type { Register } from 'claude-code'

type Rule = { id: string; test: (command: string) => boolean; why: string }

// Source files written from a shell heredoc: python/sed/cat/tee that carry
// escapes corrupt code. Scratch and temp paths are fine.
const SOURCE = /\.(js|jsx|ts|tsx|py|html|css|ps1|tf|yaml|yml)\b/
const WRITES = /\.write\(|write_text|open\([^)]*,\s*['"][wa]|sed\s+-i|(cat|tee)\s+[^|]*>/
const SCRATCH = /scratchpad|\/tmp\/|\$TEMP|\\Temp\\|\/Temp\//i

export const rules: Rule[] = [
  {
    id: 'heredoc-edit',
    why: 'Edit source with the Write or Edit tool, not a heredoc or python/sed rewrite (escapes turn into real tabs and newlines).',
    test: c =>
      !/^\s*git\b/.test(c) &&
      /<<-?\s*['"]?\w+/.test(c) &&
      SOURCE.test(c) &&
      WRITES.test(c) &&
      !SCRATCH.test(c),
  },
  {
    id: 'relative-ssh-key',
    why: 'Use the absolute key path, like C:/Users/you/.ssh/id_ed25519; a relative -i path fails from other folders.',
    test: c => /\bssh(-add)?\b[^|;&]*\s-i\s+['"]?\.{0,2}\/?\.ssh\//.test(c),
  },
  {
    id: 'hand-edited-vm',
    why: 'VMs are Terraform managed: change the .tf and plan, do not qm set/resize/destroy by hand.',
    test: c => /\bqm\s+(set|resize|destroy)\b/.test(c),
  },
  {
    id: 'blind-terraform',
    why: 'Run terraform plan -out=tfplan first, then apply tfplan.',
    test: c =>
      /\bterraform\s+(apply|destroy)\b/.test(c) && !/tfplan|\.tfplan|\.plan\b/.test(c),
  },
  {
    id: 'nas-delete',
    why: 'Never delete from the NAS or /media without Brian approving the exact path; writers get a new share.',
    test: c =>
      /\b(rm|rmdir|unlink|Remove-Item)\b/.test(c) &&
      /(\/media\b|\/volume\d|\/mnt\/(nas|media)|\\\\(nas|synology))/i.test(c),
  },
  {
    id: 'force-push',
    why: 'Force-pushing needs Brian to say so first.',
    test: c => /\bgit\s+push\b[^|;&]*(\s--force\b|\s-f\b|--force-with-lease)/.test(c),
  },
]

export const register: Register = on => {
  let blocked = 0

  on('tool.call', { tool: 'Bash' }, ($, e, next) => {
    const hit = rules.find(rule => rule.test(e.command))
    if (!hit) return next(e)

    blocked += 1
    $.ui.status(`tripwire: ${blocked} blocked, last ${hit.id}`)

    return { deny: `${$.plugin.name} (${hit.id}): ${hit.why}` }
  })
}
