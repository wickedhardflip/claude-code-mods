export type Card = {
  kind: 'main' | 'agent' | 'ollama' | 'gemini'
  label: string
  model: string
  tools: number
  last: string
  isRunning: boolean
  endsAt?: number
}

declare module 'claude-code' {
  interface PluginState {
    'agent-dock': { size: number; cards: Record<string, Card> }
  }
}
