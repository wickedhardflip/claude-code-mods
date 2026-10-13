import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Card } from '../types'

const ACCENT = '#bb9af7'
const GREEN = '#9ece6a'
const AMBER = '#e0af68'
const KIND_COLOR = { main: '#7aa2f7', agent: '#7dcfff', ollama: '#ff9e64', gemini: '#f7768e' } as const

// -1 until /dock is used this session; the defaultSize option applies until then.
const size = atom({ plugin: 'agent-dock', key: 'size' } as const, -1)
const cards = atom({ plugin: 'agent-dock', key: 'cards' } as const, {})

const clamp = (n: number) => Math.max(0, Math.min(8, Math.trunc(n) || 0))

const short = (model: string) => model.replace(/^claude-/, '').replace(/-\d{8}$/, '')

// Gemini / Ollama calls, from MCP tools or a Bash curl to the local Ollama API.
function external(tool: string, input: unknown): { kind: 'ollama' | 'gemini'; label: string; model: string } | null {
  const args = (input ?? {}) as Record<string, unknown>
  const str = (v: unknown) => (typeof v === 'string' ? v : '')

  if (tool.startsWith('mcp__gemini__')) {
    return { kind: 'gemini', label: tool.slice('mcp__gemini__gemini-'.length), model: str(args.model) || 'gemini' }
  }

  if (tool.startsWith('mcp__ollama')) {
    return { kind: 'ollama', label: tool.replace(/^mcp__ollama[^_]*__(ollama_)?/, ''), model: str(args.model) || 'ollama' }
  }

  if (tool === 'Bash' && str(args.command).includes(':11434')) {
    const m = /"model"\s*:\s*"([^"]+)"/.exec(str(args.command))

    return { kind: 'ollama', label: str(args.description) || 'local call', model: m?.[1] ?? 'ollama' }
  }

  return null
}

export const register: Register = (on, options) => {
  const defaultSize = clamp(Number(options.defaultSize ?? 0))

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'dock',
      description: 'Set team size: /dock 3 splits jobs across 3 subagents; /dock 0 turns it off',
      argumentHint: '<team size>',
    })

    return next(e)
  })

  on('command.run', { command: 'dock' }, async ($, e) => {
    const n = clamp(parseInt(String(e.args ?? '').trim(), 10))
    await update($, size, () => n)

    return { text: n ? `Agent Dock: team of ${n}.` : 'Agent Dock off.' }
  })

  // The team size rides on each prompt as context the model reads and the user never sees.
  // Not a prompt.compose section: Claude Code's default security plugin skips user-tier
  // system-prompt hooks (prompt.compose, prompt.context) since 2.1.296.
  on('prompt.submit', async ($, e, next) => {
    await update($, cards, () => ({}))
    const set = await read($, size)
    const n = set < 0 ? defaultSize : set

    if (!n) {
      return next(e)
    }

    const note = `Agent Dock: team size is ${n}. For any task with separable parts, split it into at most ${n} independent pieces and run them as ${n} parallel subagents (Agent tool, one message, background where possible), each with a short description. Give each a self-contained brief. Merge and verify the results yourself.`

    return next({ ...e, context: [...(e.context ?? []), note] })
  })

  // Every request names its model, in the main loop or a subagent's.
  on('turn.step', async function* ($, e, next) {
    const key = e.agentId ?? 'main'
    await update($, cards, all => {
      const c: Card = all[key] ?? { kind: e.agentId ? 'agent' : 'main', label: e.agentId ? 'subagent' : 'Main session', model: '', tools: 0, last: '', isRunning: true }

      return { ...all, [key]: { ...c, model: short(String(e.model)) } }
    })

    return yield* next(e)
  })

  on('tool.call', async ($, e, next) => {
    const ext = external(String(e.tool), e)
    const key = ext ? `ext:${e.tool_use_id}` : (e.agentId ?? 'main')

    await update($, cards, all => {
      const c: Card = all[key] ?? {
        kind: ext ? ext.kind : e.agentId ? 'agent' : 'main',
        label: ext ? ext.label : e.agentId ? 'subagent' : 'Main session',
        model: ext ? ext.model : '',
        tools: 0,
        last: '',
        isRunning: true,
      }

      return { ...all, [key]: { ...c, tools: c.tools + 1, last: String(e.tool).replace(/^mcp__/, ''), isRunning: true } }
    })

    const ran = await next(e)

    if (ext) {
      // simplified: a backgrounded Bash call has no completion event, so it counts as running for its curl -m timeout (default 60 s); upgrade: watch the task's output file
      const bg = (ran as { result?: { backgroundTaskId?: string } } | undefined)?.result?.backgroundTaskId
      const secs = Number(/\s-m\s+(\d+)/.exec(String((e as unknown as { command?: string }).command ?? ''))?.[1] ?? 60)
      const endsAt = bg ? (await $.clock.now()) + secs * 1000 : undefined
      await update($, cards, all => (all[key] ? { ...all, [key]: { ...all[key], isRunning: !!bg, endsAt } } : all))
    }

    return ran
  })

  // Collapses to nothing unless something besides the main session is running.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const all = await read($, cards)
    const info = await $.agent.list()
    const now = await $.clock.now()
    const rows = Object.entries(all).map(([id, c]) => {
      const a = info.find(x => x.id === id)

      return {
        ...c,
        label: a ? a.description || a.name || a.type : c.label,
        isRunning: c.kind === 'agent' ? (a ? a.status === 'running' : false) : c.kind === 'main' ? e.props.isWorking : c.isRunning && (c.endsAt === undefined || now < c.endsAt),
      }
    })
    const helpers = rows.filter(r => r.kind !== 'main')
    const running = helpers.filter(r => r.isRunning).length

    if (e.props.hasSurvey || running === 0) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)
    const room = Math.max(2, Math.min(7, e.props.maxRows - 4))
    const order = [...rows].sort((a, b) => Number(b.kind === 'main') - Number(a.kind === 'main') || Number(b.isRunning) - Number(a.isRunning))
    const shown = order.slice(0, room)

    return (
      <Box flexDirection="column" borderStyle="round" borderColor={ACCENT} paddingX={1}>
        <Text>
          <Text bold color={ACCENT}>Agent Dock </Text>
          <Text color={AMBER}>{running} running</Text>
          <Text dimColor>, {helpers.length - running} done</Text>
        </Text>
        {shown.map(r => {
          const color = r.isRunning ? KIND_COLOR[r.kind] : GREEN

          return (
            <Text dimColor={!r.isRunning}>
              <Text color={color}>{r.isRunning ? '▶ ' : '✔ '}</Text>
              <Text bold={r.isRunning} color={color}>{r.label}</Text>
              <Text color={KIND_COLOR[r.kind]}> [{r.model || '?'}]</Text>
              <Text dimColor> {r.kind} · {r.tools} tools{r.last ? ` · ${r.last}` : ''}</Text>
            </Text>
          )
        })}
        {rows.length > shown.length && <Text dimColor>… {rows.length - shown.length} more</Text>}
      </Box>
    )
  })
}
