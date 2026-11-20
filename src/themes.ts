/**
 * Builds the file names `<prefix>1.png` to `<prefix>18.png`.
 * @param prefix - File name prefix, e.g. "games".
 * @returns The list of file names.
 */
const buildNumberedFileNames = (prefix: string): string[] =>
  Array.from({ length: 18 }, (_, position) => `${prefix}${position + 1}.png`);

/** Key of a theme. */
export type ThemeKey = 'code' | 'games' | 'projects' | 'food';

/** Image folder, card back and card faces per theme. */
export const themes: Record<ThemeKey, { folder: string; back: string; faces: string[] }> = {
  code: {
    folder: 'code_vibes',
    back: 'code_back.png',
    faces: [
      'angular', 'bootstrap', 'database', 'django', 'firebase', 'git',
      'github', 'html3', 'html5', 'javascript', 'node', 'python',
      'react', 'sass', 'terminal', 'typescript', 'vscode', 'vuejs',
    ].map((name) => `${name}.png`),
  },
  games: { folder: 'games', back: 'games-back.png', faces: buildNumberedFileNames('games') },
  projects: { folder: 'projects', back: 'projects-back.png', faces: buildNumberedFileNames('projects') },
  food: { folder: 'food', back: 'food-back.png', faces: buildNumberedFileNames('food') },
};

/**
 * Checks if a text is the key of a theme.
 * @param value - The text to check.
 * @returns True if a theme with this key exists.
 */
export function isThemeKey(value: string): value is ThemeKey {
  return value in themes;
}
