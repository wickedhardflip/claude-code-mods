import { test, expect } from 'claude-code/testing'
import type { On } from 'claude-code'

// Stands in for the engine: records the context each prompt entered with.
const capture = (on: On) => {
  const seen: (readonly string[] | undefined)[] = []
  on('prompt.submit', (_$, e) => {
    seen.push(e.context)

    return { text: e.text, context: e.context }
  })

  return seen
}

const dock = (context: readonly string[] | undefined) => context?.find(c => c.startsWith('Agent Dock:'))

test('off by default', async ($, on) => {
  const seen = capture(on)
  await $.prompt.submit({ text: 'hi' })
  expect(dock(seen[0])).toBeUndefined()
})

test('defaultSize starts the dock', { options: { defaultSize: 8 } }, async ($, on) => {
  const seen = capture(on)
  await $.prompt.submit({ text: 'hi' })
  expect(dock(seen[0])).toContain('team size is 8.')
})

test('/dock overrides the default for the session', { options: { defaultSize: 8 } }, async ($, on) => {
  const seen = capture(on)
  await $.command.run({ command: 'dock', args: '3' })
  await $.prompt.submit({ text: 'hi' })
  expect(dock(seen[0])).toContain('team size is 3.')
  await $.command.run({ command: 'dock', args: '0' })
  await $.prompt.submit({ text: 'hi' })
  expect(dock(seen[1])).toBeUndefined()
})

test('defaultSize is clamped to 8', { options: { defaultSize: 20 } }, async ($, on) => {
  const seen = capture(on)
  await $.prompt.submit({ text: 'hi' })
  expect(dock(seen[0])).toContain('team size is 8.')
})
