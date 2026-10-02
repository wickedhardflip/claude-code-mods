import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Breakdown } from '../types'

// Only runs at least this long get a breakdown (5 s while testing; 30 s planned).
const MIN_MS = 5_000

const breakdown = atom({ plugin: 'run-breakdown', key: 'breakdown' } as const, null as Breakdown | null)

// What this prompt's run used; reset on each prompt. Key 'main' or a subagent id.
const loops = new Map<string, { model: string; effort: string }>()
const external = new Map<string, number>()

const short = (model: string) => model.replace(/^claude-/, '').replace(/-\d{8}$/, '')

function duration(ms: number) {
  const s = Math.round(ms / 1000)

  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`
}

async function build($: EngineInterface, ms: number): Promise<Breakdown> {
  const agents = await $.agent.list()
  const lines: string[] = []

  for (const [key, run] of loops) {
    const who =
      key === 'main'
        ? 'Main session'
        : (a => (a ? `${a.type}: ${a.description}` : 'Subagent'))(agents.find(x => x.id === key))
    lines.push(`${who}: ${short(run.model)}, effort ${run.effort}`)
  }

  for (const [name, count] of external) {
    lines.push(`${name}${count > 1 ? ` x${count}` : ''}`)
  }

  return { took: duration(ms), lines }
}

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    loops.clear()
    external.clear()
    await update($, breakdown, () => null)

    return next(e)
  })

  // Each request names its model and effort, in the main loop or a subagent's.
  on('turn.step', async function* ($, e, next) {
    loops.set(e.agentId ?? 'main', { model: e.model, effort: String(e.effort ?? 'default') })

    return yield* next(e)
  })

  // Gemini and Ollama are MCP tool calls, not agents.
  on('tool.call', ($, e, next) => {
    const tool = String(e.tool)
    const args = e as unknown as Record<string, unknown>
    const name = tool.startsWith('mcp__gemini__')
      ? `Gemini: ${tool.slice('mcp__gemini__'.length)}`
      : tool.startsWith('mcp__ollama-claude__')
        ? `Ollama: ${typeof args.model === 'string' ? args.model : 'default model'} (${tool.slice('mcp__ollama-claude__ollama_'.length)})`
        : null

    if (name) {
      external.set(name, (external.get(name) ?? 0) + 1)
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)

    if (!e.agentId && e.durationMs >= MIN_MS) {
      const result = await build($, e.durationMs)
      await update($, breakdown, () => result)
    }

    return done
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const shown = await read($, breakdown)

    if (e.props.hasSurvey || !shown) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        <Text bold>Last run took {shown.took}</Text>
        {shown.lines.map((line, i) => (
          <Text key={`l${i}`} dimColor>- {line}</Text>
        ))}
      </Box>
    )
  })
}
