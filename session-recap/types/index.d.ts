export type Recap = { prompt: string; bullets: string[] }

declare module 'claude-code' {
  interface PluginState {
    'session-recap': { turns: Recap[]; questions: string[] }
  }
}
