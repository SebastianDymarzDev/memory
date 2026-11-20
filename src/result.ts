import type { ThemeKey } from './themes';

type PlayerColor = 'blue' | 'orange';
/** Outcome of the game. Against the computer it is seen from the human player. */
type State = 'win' | 'lose' | 'draw';

/** Outcome of a finished game. `winner` is null on a draw. */
export interface GameResult {
  winner: PlayerColor | null;
  human: PlayerColor;
  /** False when two humans played against each other. */
  vsComputer: boolean;
  blue: number;
  orange: number;
}

const BASE = import.meta.env.BASE_URL;
const IMAGE_FOLDER = `${BASE}assets/img/`;

/** Result images per theme, relative to IMAGE_FOLDER. */
const resultImages = {
  code: { win: (color: PlayerColor) => `code_vibes/win_${color}.png`, draw: 'code_vibes/draw.png' },
  games: { win: () => 'games/win.png', draw: 'games/draw_games.png' },
  projects: { win: (color: PlayerColor) => `projects/win_${color}_projects.png`, draw: 'projects/draw_projects.png' },
  food: { win: (color: PlayerColor) => `food/win_${color}_food.png`, draw: 'food/draw_food.png' },
} as const satisfies Record<ThemeKey, unknown>;

/** The result screen that slides in over the board. */
const resultElement = document.querySelector<HTMLElement>('#result')!;

/**
 * Finds an element inside the result screen.
 * @param name - The element id without the prefix `result-`.
 * @returns The element (assumed to exist).
 */
const getElement = <ElementType extends HTMLElement>(name: string) =>
  document.querySelector<ElementType>(`#result-${name}`)!;

/**
 * Builds the path of a player icon.
 * @param theme - Current theme; code uses its own icons.
 * @param color - Player colour.
 * @returns The image URL.
 */
function playerIcon(theme: ThemeKey, color: PlayerColor): string {
  return theme === 'code'
    ? `${IMAGE_FOLDER}code_vibes/player_code_${color}.png`
    : `${IMAGE_FOLDER}icons/chess_pawn_${color}.png`;
}

/**
 * Derives win, lose or draw. Against the computer it is seen from the human player,
 * between two humans there is no loser screen.
 * @param result - The finished game.
 * @returns The state to show.
 */
function getState(result: GameResult): State {
  if (result.winner === null) return 'draw';
  if (!result.vsComputer) return 'win';
  return result.winner === result.human ? 'win' : 'lose';
}

/**
 * Sets the small line above the title and the title itself.
 * @param subtitle - Text above the title.
 * @param title - Main heading.
 */
function setTexts(subtitle: string, title: string): void {
  getElement('sub').textContent = subtitle;
  getElement('title').textContent = title;
}

/**
 * Shows the result image.
 * @param path - Image path relative to IMAGE_FOLDER.
 */
function showImage(path: string): void {
  const imageElement = getElement<HTMLImageElement>('art');
  imageElement.src = IMAGE_FOLDER + path;
  imageElement.hidden = false;
}

/**
 * Shows the winner screen (confetti only in the code theme).
 * @param theme - Current theme.
 * @param winner - Colour of the winning player.
 */
function showWin(theme: ThemeKey, winner: PlayerColor): void {
  resultElement.dataset.winner = winner;
  setTexts('The winner is', winner === 'blue' ? 'Blue Player' : 'Orange Player');
  showImage(resultImages[theme].win(winner));
  getElement('confetti').hidden = theme !== 'code';
}

/**
 * Shows the draw screen.
 * @param theme - Current theme.
 */
function showDraw(theme: ThemeKey): void {
  setTexts("It's a", 'Draw');
  showImage(resultImages[theme].draw);
}

/**
 * Shows the game over screen with the final score.
 * @param theme - Current theme.
 * @param result - The finished game.
 */
function showLose(theme: ThemeKey, result: GameResult): void {
  setTexts('Final score', 'Game over');
  getElement('score').hidden = false;
  getElement<HTMLImageElement>('icon-blue').src = playerIcon(theme, 'blue');
  getElement<HTMLImageElement>('icon-orange').src = playerIcon(theme, 'orange');
  getElement('score-blue').textContent = String(result.blue);
  getElement('score-orange').textContent = String(result.orange);
}

/**
 * Fills the matching result screen and lets it slide in over the board.
 * @param theme - Current theme.
 * @param result - The finished game.
 */
export function showResult(theme: ThemeKey, result: GameResult): void {
  const state = getState(result);
  resultElement.dataset.state = state;
  getElement('btn').textContent = theme === 'code' ? 'Back to start' : 'Home';
  if (state === 'win') showWin(theme, result.winner as PlayerColor);
  else if (state === 'draw') showDraw(theme);
  else showLose(theme, result);
  resultElement.hidden = false;
  getElement('btn').focus();
}
