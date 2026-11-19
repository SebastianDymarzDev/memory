import './styles/game.scss'
import { loadSettings, saveResult } from './storage'

const BASE = import.meta.env.BASE_URL

type PlayerColor = 'blue' | 'orange'

interface ValidSettings {
  theme: string
  player: string
  size: number
}

interface Card {
  index: number
  pairId: number
  button: HTMLButtonElement
  matched: boolean
}

const numbered = (prefix: string): string[] =>
  Array.from({ length: 18 }, (_, position) => `${prefix}${position + 1}.png`)

const themes: Record<string, { folder: string; back: string; faces: string[] }> = {
  code: {
    folder: 'code_vibes',
    back: 'code_back.png',
    faces: [
      'angular', 'bootstrap', 'database', 'django', 'firebase', 'git',
      'github', 'html3', 'html5', 'javascript', 'node', 'python',
      'react', 'sass', 'terminal', 'typescript', 'vscode', 'vuejs',
    ].map((name) => `${name}.png`),
  },
  games: { folder: 'games', back: 'games-back.png', faces: numbered('games') },
  projects: { folder: 'projects', back: 'projects-back.png', faces: numbered('projects') },
  food: { folder: 'food', back: 'food-back.png', faces: numbered('food') },
}

const FLIP_BACK_DELAY = 900
const COMPUTER_DELAY = 800
const MEMORY_CHANCE = 0.7
const FINISH_DELAY = 1200

const board = document.querySelector<HTMLElement>('#board')!
const turnIcon = document.querySelector<HTMLImageElement>('#turn-icon')!
const scoreElements: Record<PlayerColor, HTMLElement> = {
  blue: document.querySelector<HTMLElement>('#score-blue')!,
  orange: document.querySelector<HTMLElement>('#score-orange')!,
}
const quitDialog = document.querySelector<HTMLDialogElement>('#quit-dialog')!
const keepPlayingButton = document.querySelector<HTMLElement>('#quit-no')!
const leaveGameButton = document.querySelector<HTMLElement>('#quit-yes')!

let cards: Card[] = []
let openCards: Card[] = []
let humanPlayer: PlayerColor = 'blue'
let computerPlayer: PlayerColor = 'orange'
let currentPlayer: PlayerColor = 'blue'
const scores: Record<PlayerColor, number> = { blue: 0, orange: 0 }
const seenCardIndexes = new Set<number>()
const pendingActions: Array<() => void> = [] // Aktionen, die auf das Schließen des Dialogs warten
let themeKey = 'code'

// Während der Exit-Dialog offen ist, werden alle Timer angehalten und danach nachgeholt
function later(action: () => void, delayMs: number): void {
  window.setTimeout(() => (quitDialog.open ? pendingActions.push(action) : action()), delayMs)
}

function playerIcon(color: PlayerColor): string {
  return themeKey === 'code'
    ? `${BASE}assets/img/code_vibes/player_code_${color}.png`
    : `${BASE}assets/img/icons/chess_pawn_${color}.png`
}

function opponentOf(color: PlayerColor): PlayerColor {
  return color === 'blue' ? 'orange' : 'blue'
}

function randomItem<Item>(items: Item[]): Item {
  return items[Math.floor(Math.random() * items.length)]
}

function shuffle<Item>(items: Item[]): Item[] {
  const shuffled = [...items]
  for (let position = shuffled.length - 1; position > 0; position--) {
    const swapPosition = Math.floor(Math.random() * (position + 1))
    ;[shuffled[position], shuffled[swapPosition]] = [shuffled[swapPosition], shuffled[position]]
  }
  return shuffled
}

function cardMarkup(face: string): string {
  const theme = themes[themeKey]
  const imageFolder = `${BASE}assets/img/${theme.folder}/`
  return (
    '<span class="card__inner">' +
    `<img class="card__face" src="${imageFolder}${face}" alt="">` +
    `<img class="card__back" src="${imageFolder}${theme.back}" alt="">` +
    '</span>'
  )
}

function createCard(face: string, pairId: number, index: number): Card {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'card'
  button.innerHTML = cardMarkup(face)

  const card: Card = { index, pairId, button, matched: false }
  button.addEventListener('click', () => onCardClick(card))
  return card
}

function buildBoard(size: number): void {
  const faces = shuffle(themes[themeKey].faces).slice(0, size / 2)
  const deck = shuffle(faces.flatMap((face, pairId) => [{ face, pairId }, { face, pairId }]))

  board.style.setProperty('--columns', String(size === 16 ? 4 : 6))
  cards = deck.map(({ face, pairId }, index) => createCard(face, pairId, index))
  board.append(...cards.map((card) => card.button))
}

function updateScore(): void {
  scoreElements.blue.textContent = String(scores.blue)
  scoreElements.orange.textContent = String(scores.orange)
}

function updateTurn(): void {
  turnIcon.dataset.color = currentPlayer
  turnIcon.src =
    themeKey === 'code'
      ? playerIcon(currentPlayer)
      : `${BASE}assets/img/icons/chess_pawn_white.png`
}

function rememberCard(card: Card): void {
  if (Math.random() < MEMORY_CHANCE) {
    seenCardIndexes.add(card.index)
  }
}

function revealCard(card: Card): void {
  card.button.classList.add('is-flipped')
  openCards.push(card)
  rememberCard(card)

  if (openCards.length === 2) {
    later(resolveTurn, FLIP_BACK_DELAY)
  }
}

function markAsMatched(firstCard: Card, secondCard: Card): void {
  for (const card of [firstCard, secondCard]) {
    card.matched = true
    card.button.disabled = true
    card.button.classList.add('is-matched')
  }
  scores[currentPlayer]++
  updateScore()
}

function flipBack(firstCard: Card, secondCard: Card): void {
  firstCard.button.classList.remove('is-flipped')
  secondCard.button.classList.remove('is-flipped')
  currentPlayer = opponentOf(currentPlayer)
  updateTurn()
}

function startNextTurn(): void {
  if (cards.every((card) => card.matched)) {
    finishGame()
  } else if (currentPlayer === computerPlayer) {
    later(computerTurn, COMPUTER_DELAY)
  }
}

function resolveTurn(): void {
  const [firstCard, secondCard] = openCards
  openCards = []
  if (firstCard.pairId === secondCard.pairId) {
    markAsMatched(firstCard, secondCard)
  } else {
    flipBack(firstCard, secondCard)
  }
  startNextTurn()
}

function onCardClick(card: Card): void {
  if (
    currentPlayer !== humanPlayer ||
    openCards.length === 2 ||
    card.matched ||
    openCards.includes(card)
  ) {
    return
  }
  revealCard(card)
}

function findKnownPair(): [Card, Card] | null {
  const knownCards = cards.filter((card) => !card.matched && seenCardIndexes.has(card.index))
  for (const knownCard of knownCards) {
    const partner = knownCards.find(
      (candidate) => candidate !== knownCard && candidate.pairId === knownCard.pairId,
    )
    if (partner) return [knownCard, partner]
  }
  return null
}

function pickFirstCard(): Card {
  const knownPair = findKnownPair()
  if (knownPair) return knownPair[0]

  const availableCards = cards.filter((card) => !card.matched)
  const unseenCards = availableCards.filter((card) => !seenCardIndexes.has(card.index))
  return randomItem(unseenCards.length > 0 ? unseenCards : availableCards)
}

function pickSecondCard(firstCard: Card): Card {
  const partner = cards.find(
    (card) =>
      card !== firstCard &&
      !card.matched &&
      seenCardIndexes.has(card.index) &&
      card.pairId === firstCard.pairId,
  )
  if (partner) return partner

  const remainingCards = cards.filter((card) => card !== firstCard && !card.matched)
  const unseenCards = remainingCards.filter((card) => !seenCardIndexes.has(card.index))
  return randomItem(unseenCards.length > 0 ? unseenCards : remainingCards)
}

function computerTurn(): void {
  const firstCard = pickFirstCard()
  revealCard(firstCard)
  later(() => revealCard(pickSecondCard(firstCard)), COMPUTER_DELAY)
}

function finishGame(): void {
  const winner: PlayerColor | null =
    scores.blue === scores.orange ? null : scores.blue > scores.orange ? 'blue' : 'orange'

  saveResult({ winner, human: humanPlayer, blue: scores.blue, orange: scores.orange })

  later(() => {
    window.location.href = BASE + 'result.html'
  }, FINISH_DELAY)
}

function readValidSettings(): ValidSettings | null {
  const settings = loadSettings()
  if (!settings || !settings.theme || !settings.player || !settings.size) return null
  if (!themes[settings.theme]) return null
  return { theme: settings.theme, player: settings.player, size: settings.size }
}

function setPlayerIcons(): void {
  document.querySelectorAll<HTMLImageElement>('.game__player-icon').forEach((icon) => {
    icon.src = playerIcon(icon.dataset.color === 'orange' ? 'orange' : 'blue')
  })
}

function setQuitLabels(): void {
  if (themeKey !== 'games') return
  keepPlayingButton.textContent = 'No, back to game'
  leaveGameButton.textContent = 'Yes, quit game'
}

function applySettings({ theme, player, size }: ValidSettings): void {
  document.body.dataset.theme = theme
  document.body.dataset.size = String(size)
  themeKey = theme
  humanPlayer = player === 'orange' ? 'orange' : 'blue'
  computerPlayer = opponentOf(humanPlayer)
  currentPlayer = humanPlayer
  setPlayerIcons()
  setQuitLabels()
  buildBoard(size)
}

function initGame(): void {
  const settings = readValidSettings()
  if (!settings) {
    window.location.href = BASE + 'settings.html'
    return
  }
  applySettings(settings)
  updateScore()
  updateTurn()
}

document.querySelector('#exit-btn')!.addEventListener('click', () => quitDialog.showModal())
keepPlayingButton.addEventListener('click', () => quitDialog.close())
quitDialog.addEventListener('close', () => pendingActions.splice(0).forEach((action) => action()))

initGame()
