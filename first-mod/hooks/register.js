/** @type {import('claude-code').Register} */
export const register = on => {
  let calls = 0

  on('session.start', ($, e, next) => {
    $.ui.toast(`${$.plugin.name} loaded`)
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    calls += 1
    $.ui.status(`tools: ${calls}`)
    return ran
  })
}
