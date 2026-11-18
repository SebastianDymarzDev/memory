export interface GameSettings {
  theme: string | null
  player: string | null
  size: number | null
}

const KEY = 'memory-settings'

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings))
}

export function loadSettings(): GameSettings | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as GameSettings) : null
  } catch {
    return null
  }
}