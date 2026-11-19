/** Settings chosen on the settings page. A value is null while nothing is selected. */
export interface GameSettings {
  theme: string | null
  player: string | null
  size: number | null
}

/** Outcome of a finished game. `winner` is null on a draw. */
export interface GameResult {
  winner: 'blue' | 'orange' | null
  human: 'blue' | 'orange'
  blue: number
  orange: number
}

/** localStorage key for the settings. */
const SETTINGS_KEY = 'memory-settings'
/** localStorage key for the game result. */
const RESULT_KEY = 'memory-result'

/**
 * Stores the settings in localStorage.
 * @param settings - The settings to save.
 */
export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

/**
 * Reads the settings from localStorage.
 * @returns The saved settings, or null if none exist or they are unreadable.
 */
export function loadSettings(): GameSettings | null {
  try {
    const storedJson = localStorage.getItem(SETTINGS_KEY)
    return storedJson ? (JSON.parse(storedJson) as GameSettings) : null
  } catch {
    return null
  }
}

/**
 * Stores the game result in localStorage.
 * @param result - The result to save.
 */
export function saveResult(result: GameResult): void {
  localStorage.setItem(RESULT_KEY, JSON.stringify(result))
}

/**
 * Reads the game result from localStorage.
 * @returns The saved result, or null if none exists or it is unreadable.
 */
export function loadResult(): GameResult | null {
  try {
    const storedJson = localStorage.getItem(RESULT_KEY)
    return storedJson ? (JSON.parse(storedJson) as GameResult) : null
  } catch {
    return null
  }
}
