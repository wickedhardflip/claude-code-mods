export type Todo = { content: string; status: 'pending' | 'in_progress' | 'completed'; activeForm: string }

declare module 'claude-code' {
  interface PluginState {
    'clean-view': { todos: Todo[]; isOn: boolean }
  }
}
