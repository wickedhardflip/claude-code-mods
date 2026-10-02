export type Breakdown = { took: string; lines: string[] }

declare module 'claude-code' {
  interface PluginState {
    'run-breakdown': { breakdown: Breakdown | null }
  }
}
