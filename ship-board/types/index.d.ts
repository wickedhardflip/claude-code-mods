export type Row = {
  name: string
  branch: string
  dirty: number
  ahead: number
  isMerged: boolean
  run: string
}

declare module 'claude-code' {
  interface PluginState {
    'ship-board': { rows: Shaped<Row[]> }
  }
}
