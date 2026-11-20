import './styles/result.scss';
import { loadResult, loadSettings, type GameResult } from './storage';

type PlayerColor = 'blue' | 'orange';
/** Outcome from the point of view of the human player. */
type State = 'win' | 'lose' | 'draw';
/** Key of a theme that has result images. */
type ThemeKey = keyof typeof resultImages;

const BASE = import.meta.env.BASE_URL;
const IMAGE_FOLDER = `${BASE}assets/img/`;

/** Result images per theme, relative to IMAGE_FOLDER. */
const resultImages = {
  code: { win: (color: PlayerColor) => `code_vibes/win_${color}.png`, draw: 'code_vibes/draw.png' },
  games: { win: () => 'games/win.png', draw: 'games/draw_games.png' },
  projects: { win: (color: PlayerColor) => `projects/win_${color}_projects.png`, draw: 'projects/draw_projects.png' },
  food: { win: (color: PlayerColor) => `food/win_${color}_food.png`, draw: 'food/draw_food.png' },
} as const;

/**
 * Finds an element by its id.
 * @param id - The element id without `#`.
 * @returns The element (assumed to exist).
 */
const getElement = <ElementType extends HTMLElement>(id: string) =>
  document.querySelector<ElementType>(`#${id}`)!;

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
 * Derives win, lose or draw for the human player.
 * @param result - The finished game.
 * @returns The state for the human player.
 */
function getState(result: GameResult): State {
  if (result.winner === null) return 'draw';
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
  document.body.dataset.winner = winner;
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
 * Sets theme and state on the body and renders the matching screen.
 * @param theme - Current theme.
 * @param result - The finished game.
 */
function showResult(theme: ThemeKey, result: GameResult): void {
  const state = getState(result);
  document.body.dataset.theme = theme;
  document.body.dataset.state = state;
  getElement('btn').textContent = theme === 'code' ? 'Back to start' : 'Home';
  if (state === 'win') showWin(theme, result.winner as PlayerColor);
  else if (state === 'draw') showDraw(theme);
  else showLose(theme, result);
}

/** Entry point: shows the result, or redirects to the settings if theme or result is missing. */
function initResult(): void {
  const theme = loadSettings()?.theme as ThemeKey | undefined;
  const result = loadResult();
  if (!theme || !(theme in resultImages) || !result) {
    window.location.href = BASE + 'settings.html';
    return;
  }
  showResult(theme, result);
}

initResult();
