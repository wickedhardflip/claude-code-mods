import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Row } from '../types'

const PANE = 'ship-board'
const ROOT = 'E:/Projects/worktrees'
// Change the tag when a row's fields change: it declines what an earlier
// version stored, which outlives a reload.
const rows = atom({ plugin: 'ship-board', key: 'rows' } as const, [], {
  shape: 'rows-1',
})

async function refresh($: EngineInterface) {
  const dirs = (await $.fs.list(ROOT).catch(() => [])).filter(d => d.kind === 'dir')
  const found: Row[] = await Promise.all(
    dirs.map(async dir => {
      const cwd = `${ROOT}/${dir.name}`
      const status = await $.process.run(['git', 'status', '--porcelain=v1', '-b'], { cwd })
      const [head = '', ...files] = status.stdout.split('\n').filter(Boolean)
      const ahead = Number(/ahead (\d+)/.exec(head)?.[1] ?? 0)
      const branch = head.replace(/^## /, '').split('...')[0]
      const merged = await $.process.run(
        ['git', 'merge-base', '--is-ancestor', 'HEAD', 'main'],
        { cwd },
      )
      const gh = await $.process
        .run(['gh', 'run', 'list', '--limit', '1', '--json', 'conclusion,status'], { cwd })
        .catch(() => undefined)
      const last = gh?.exitCode === 0 ? JSON.parse(gh.stdout || '[]')[0] : undefined

      return {
        name: dir.name,
        branch,
        dirty: files.length,
        ahead,
        isMerged: merged.exitCode === 0,
        run: last ? last.conclusion || last.status : 'no runs',
      }
    }),
  )
  await update($, rows, () => found)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'ship-board',
      description: 'Show worktrees, unpushed commits and the last CI run in a pane',
    })

    return next(e)
  })

  on('command.run', { command: 'ship-board' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Ship board' })
    await refresh($)

    return { text: 'Ship board opened.' }
  })

  // A git or gh command, or a worktree script, is what changes the board.
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const ran = await next(e)
    if (/\b(git|gh)\b|new-worktree/.test(e.command)) void refresh($)

    return ran
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const list = await read($, rows)
    const alert = list.some(r => r.ahead > 0 || /fail/.test(r.run))

    return (
      <Box flexDirection="column">
        <Text color={alert ? 'red' : 'green'}>
          {alert ? 'Unpushed work or a failed run' : 'Everything pushed'}
        </Text>
        {list.length === 0 && <Text dimColor>No worktrees under {ROOT}.</Text>}
        {list.map(r => (
          <Box flexDirection="column" key={r.name}>
            <Text bold>{r.name}</Text>
            <Text dimColor>
              {r.branch} | {r.dirty} dirty | {r.ahead} unpushed |{' '}
              {r.isMerged ? 'merged: remove it' : 'not merged'} | run: {r.run}
            </Text>
          </Box>
        ))}
        <Button key="refresh" onPress={() => void refresh($)}>
          Refresh
        </Button>
      </Box>
    )
  })
}
