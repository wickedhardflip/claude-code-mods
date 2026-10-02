import { test, expect } from 'claude-code/testing'

test('spawn result passes through with its model', async ($, on) => {
  on('agent.spawn', () => ({ model: 'haiku', agentId: 'a1' }))
  const started = await $.agent.spawn({ prompt: 'hi' })
  expect(started.model).toBe('haiku')
})
