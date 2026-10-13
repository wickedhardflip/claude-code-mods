import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Todo } from '../types'

const todos = atom({ plugin: 'clean-view', key: 'todos' } as const, [])
const isOn = atom({ plugin: 'clean-view', key: 'isOn' } as const, true)

const ACCENT = '#7aa2f7'
const GREEN = '#9ece6a'
const AMBER = '#e0af68'

const HIDDEN = ['ToolUse', 'ToolResult', 'ToolGroup', 'ToolProgress'] as const

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'cleanview',
      description: 'Toggle Clean View (hide tool-call rows, show plan checklist)',
    })

    return next(e)
  })

  on('command.run', { command: 'cleanview' }, async $ => {
    const now = await update($, isOn, v => !v)

    return { text: `Clean View ${now ? 'on' : 'off'}.` }
  })

  // Main loop only: a subagent's TodoWrite is not the plan.
  on('tool.call', { tool: 'TodoWrite' }, async ($, e, next) => {
    if (!e.agentId) {
      const list = (e as unknown as { todos?: Todo[] }).todos ?? []
      await update($, todos, () => list)
    }

    return next(e)
  })

  for (const component of HIDDEN) {
    on('ui.render', { component }, async ($, e, next) => {
      if (!(await read($, isOn))) {
        return next(e)
      }

      return <Fragment />
    })
  }

  // Collapses to nothing when idle or when there is no plan; never taller than the room allows.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const list: Todo[] = await read($, todos)

    if (e.props.hasSurvey || !e.props.isWorking || !(await read($, isOn)) || list.length === 0) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)
    const done = list.filter(t => t.status === 'completed').length
    const room = Math.max(2, Math.min(6, e.props.maxRows - 3))
    const cur = Math.max(0, list.findIndex(t => t.status === 'in_progress'))
    const start = Math.max(0, Math.min(cur - 1, list.length - room))
    const shown = list.slice(start, start + room)
    const filled = Math.round((done / list.length) * 12)

    return (
      <Box flexDirection="column" borderStyle="round" borderColor={ACCENT} paddingX={1}>
        <Text>
          <Text bold color={ACCENT}>Plan </Text>
          <Text color={GREEN}>{'█'.repeat(filled)}</Text>
          <Text dimColor>{'░'.repeat(12 - filled)}</Text>
          <Text dimColor> {done}/{list.length} done, {list.length - done} left</Text>
        </Text>
        {shown.map(t => {
          const cur = t.status === 'in_progress'
          const ok = t.status === 'completed'

          return (
            <Text color={ok ? GREEN : cur ? AMBER : undefined} dimColor={t.status === 'pending'} bold={cur} strikethrough={ok}>
              {ok ? '✔ ' : cur ? '▶ ' : '○ '}
              {cur ? t.activeForm : t.content}
            </Text>
          )
        })}
        {list.length > shown.length && <Text dimColor>… {list.length - shown.length} more</Text>}
      </Box>
    )
  })
}
