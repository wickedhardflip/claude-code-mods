import { test, expect } from 'claude-code/testing'

test('tool calls pass through unchanged', async ($, on) => {
  on('tool.call', () => ({ result: 'hi' }))
  const ran = await $.tool.call({ tool: 'Bash', command: 'echo hi' })
  expect(ran.deny).toBeUndefined()
})
