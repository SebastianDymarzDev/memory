/** Settings chosen on the settings page. A value is null while nothing is selected. */
export interface GameSettings {
  theme: string | null;
  player: string | null;
  size: number | null;
  /** 'human', 'easy', 'medium' or 'hard'. */
  opponent: string | null;
}

const SETTINGS_KEY = 'memory-settings';

/**
 * Stores the settings in localStorage.
 * @param settings - The settings to save.
 */
export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Reads the settings from localStorage.
 * @returns The saved settings, or null if none exist or they are unreadable.
 */
export function loadSettings(): GameSettings | null {
  try {
    const storedJson = localStorage.getItem(SETTINGS_KEY);
    return storedJson ? (JSON.parse(storedJson) as GameSettings) : null;
  } catch {
    return null;
  }
}
