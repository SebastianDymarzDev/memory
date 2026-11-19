export interface GameSettings {
  theme: string | null
  player: string | null
  size: number | null
}

export interface GameResult {
  winner: 'blue' | 'orange' | null
  human: 'blue' | 'orange'
  blue: number
  orange: number
}

const SETTINGS_KEY = 'memory-settings'
const RESULT_KEY = 'memory-result'

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function loadSettings(): GameSettings | null {
  try {
    const storedJson = localStorage.getItem(SETTINGS_KEY)
    return storedJson ? (JSON.parse(storedJson) as GameSettings) : null
  } catch {
    return null
  }
}

export function saveResult(result: GameResult): void {
  localStorage.setItem(RESULT_KEY, JSON.stringify(result))
}

export function loadResult(): GameResult | null {
  try {
    const storedJson = localStorage.getItem(RESULT_KEY)
    return storedJson ? (JSON.parse(storedJson) as GameResult) : null
  } catch {
    return null
  }
}
