import type { EngineInterface, Register } from 'claude-code'

// Models of the subagents started since the last prompt, by agent id.
const models = new Map<string, string>()

const short = (model: string) => model.replace(/^claude-/, '')

async function refresh($: EngineInterface) {
  if (models.size === 0) {
    $.ui.status(undefined)
    return
  }

  const running = new Set(
    (await $.agent.list()).filter(a => a.status === 'running').map(a => a.id),
  )
  const label = [...models].map(
    ([id, model]) => `${short(model)}${running.has(id) ? '' : ' ✓'}`,
  )

  $.ui.status(`agents: ${label.join(', ')}`)
}

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    models.clear()
    await refresh($)
    return next(e)
  })

  on('agent.spawn', async ($, e, next) => {
    const started = await next(e)

    if (!started.deny && started.agentId) {
      models.set(started.agentId, started.model)
      await refresh($)
    }

    return started
  })

  // Subagents finish with a turn.complete; tool calls catch the rest.
  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    await refresh($)
    return done
  })

  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    await refresh($)
    return ran
  })
}
