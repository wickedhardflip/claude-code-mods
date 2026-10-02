import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Recap } from '../types'

const turns = atom({ plugin: 'session-recap', key: 'turns' } as const, [] as Recap[])
const questions = atom({ plugin: 'session-recap', key: 'questions' } as const, [] as string[])

// What the current prompt has done so far; reset on each prompt.
let prompt = ''
let steps: string[] = []

const clip = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max)}...` : text

// One short line per tool call, for the summarizer to read.
function describe(call: Record<string, unknown>) {
  const target = call.description ?? call.file_path ?? call.command ?? call.pattern ?? call.url ?? ''

  return clip(`${String(call.tool)} ${String(target)}`.trim(), 120)
}

function parseRecap(text: string) {
  try {
    const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
    const parsed = JSON.parse(json) as { done?: unknown; asked?: unknown }
    const strings = (v: unknown) =>
      Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string' && s.trim() !== '') : []

    return { done: strings(parsed.done), asked: strings(parsed.asked) }
  } catch {
    return null
  }
}

export const register: Register = on => {
  on('prompt.submit', ($, e, next) => {
    prompt = e.text
    steps = []

    return next(e)
  })

  on('tool.call', ($, e, next) => {
    if (!e.agentId) {
      steps = [...steps, describe(e as unknown as Record<string, unknown>)].slice(-40)
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)

    if (e.agentId || e.reason !== 'answer') {
      return done
    }

    const result = await $.model.complete({
      model: 'haiku',
      maxTokens: 400,
      system: 'You write terse recaps for a busy developer. Reply with JSON only.',
      prompt: [
        `The user asked: ${clip(prompt, 500)}`,
        `Tool calls made:\n${steps.join('\n') || '(none)'}`,
        `The assistant's final message:\n${clip(e.answer, 3000)}`,
        '',
        'Reply with JSON: {"done": [...], "asked": [...]}',
        '"done": 2-5 plain-English bullets of what was actually done or found, each under 12 words, no file paths or jargon unless essential.',
        '"asked": every question the assistant put to the user in its final message that still needs an answer (a choice, a confirmation, an offer like "want me to...?"), each rewritten under 20 words. Empty list if none.',
      ].join('\n'),
    })

    if (!result.isAnswered) {
      return done
    }

    const recap = parseRecap(result.text)

    if (recap && recap.done.length > 0) {
      await update($, turns, list =>
        [...list, { prompt: clip(prompt, 80), bullets: recap.done }].slice(-30),
      )
      await update($, questions, list =>
        [...list, ...recap.asked.filter(q => !list.includes(q))].slice(-30),
      )
    }

    return done
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const asked = await read($, questions)
    const past = await read($, turns)
    const latest = past[past.length - 1]

    if (e.props.hasSurvey || (asked.length === 0 && !latest)) {
      return next(e)
    }

    const { Box, Button, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        {latest && <Text bold>Done last prompt</Text>}
        {latest?.bullets.map((b, j) => (
          <Text key={`b${j}`} dimColor>- {b}</Text>
        ))}
        {asked.length > 0 && <Text bold>Open questions</Text>}
        {asked.map((q, i) => (
          <Text key={`q${i}`}>? {q}</Text>
        ))}
        {asked.length > 0 && (
          <Button key="clear" label="Clear questions" onPress={() => update($, questions, () => [])} />
        )}
      </Box>
    )
  })
}
