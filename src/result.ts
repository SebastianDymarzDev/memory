import './styles/result.scss'
import { loadResult, loadSettings, type GameResult } from './storage'

type PlayerColor = 'blue' | 'orange'
type State = 'win' | 'lose' | 'draw'
type ThemeKey = keyof typeof resultImages

const BASE = import.meta.env.BASE_URL
const IMAGE_FOLDER = `${BASE}assets/img/`

const resultImages = {
  code: { win: (color: PlayerColor) => `code_vibes/win_${color}.png`, draw: 'code_vibes/draw.png' },
  games: { win: () => 'games/win.png', draw: 'games/draw_games.png' },
  projects: { win: (color: PlayerColor) => `projects/win_${color}_projects.png`, draw: 'projects/draw_projects.png' },
  food: { win: (color: PlayerColor) => `food/win_${color}_food.png`, draw: 'food/draw_food.png' },
} as const

const getElement = <ElementType extends HTMLElement>(id: string) =>
  document.querySelector<ElementType>(`#${id}`)!

function playerIcon(theme: ThemeKey, color: PlayerColor): string {
  return theme === 'code'
    ? `${IMAGE_FOLDER}code_vibes/player_code_${color}.png`
    : `${IMAGE_FOLDER}icons/chess_pawn_${color}.png`
}

function getState(result: GameResult): State {
  if (result.winner === null) return 'draw'
  return result.winner === result.human ? 'win' : 'lose'
}

function setTexts(subtitle: string, title: string): void {
  getElement('sub').textContent = subtitle
  getElement('title').textContent = title
}

function showImage(path: string): void {
  const imageElement = getElement<HTMLImageElement>('art')
  imageElement.src = IMAGE_FOLDER + path
  imageElement.hidden = false
}

function showWin(theme: ThemeKey, winner: PlayerColor): void {
  document.body.dataset.winner = winner
  setTexts('The winner is', winner === 'blue' ? 'Blue Player' : 'Orange Player')
  showImage(resultImages[theme].win(winner))
  getElement('confetti').hidden = theme !== 'code'
}

function showDraw(theme: ThemeKey): void {
  setTexts("It's a", 'Draw')
  showImage(resultImages[theme].draw)
}

function showLose(theme: ThemeKey, result: GameResult): void {
  setTexts('Final score', 'Game over')
  getElement('score').hidden = false
  getElement<HTMLImageElement>('icon-blue').src = playerIcon(theme, 'blue')
  getElement<HTMLImageElement>('icon-orange').src = playerIcon(theme, 'orange')
  getElement('score-blue').textContent = String(result.blue)
  getElement('score-orange').textContent = String(result.orange)
}

function showResult(theme: ThemeKey, result: GameResult): void {
  const state = getState(result)
  document.body.dataset.theme = theme
  document.body.dataset.state = state
  getElement('btn').textContent = theme === 'code' ? 'Back to start' : 'Home'
  if (state === 'win') showWin(theme, result.winner as PlayerColor)
  else if (state === 'draw') showDraw(theme)
  else showLose(theme, result)
}

function initResult(): void {
  const theme = loadSettings()?.theme as ThemeKey | undefined
  const result = loadResult()
  if (!theme || !(theme in resultImages) || !result) {
    window.location.href = BASE + 'settings.html'
    return
  }
  showResult(theme, result)
}

initResult()