import './styles/game.scss'
import { loadSettings } from './storage'

const BASE = import.meta.env.BASE_URL

type Color = 'blue' | 'orange'

interface Card {
  index: number
  pair: number // gleiche Zahl = zusammengehörendes Paar
  el: HTMLButtonElement
  matched: boolean
}

const numbered = (prefix: string): string[] =>
  Array.from({ length: 18 }, (_, i) => `${prefix}${i + 1}.png`)

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

const FLIP_BACK_DELAY = 900 // ms, so lange bleiben zwei Karten sichtbar
const COMPUTER_DELAY = 800 // ms, Denkpause des Computers
const MEMORY_CHANCE = 0.7 // Wahrscheinlichkeit, dass sich der Computer eine Karte merkt

const board = document.querySelector<HTMLElement>('#board')!
const turnText = document.querySelector<HTMLElement>('#turn-text')!
const turnIcon = document.querySelector<HTMLImageElement>('#turn-icon')!
const scoreEls: Record<Color, HTMLElement> = {
  blue: document.querySelector<HTMLElement>('#score-blue')!,
  orange: document.querySelector<HTMLElement>('#score-orange')!,
}
const quitDialog = document.querySelector<HTMLDialogElement>('#quit-dialog')!

document.querySelector('#exit-btn')!.addEventListener('click', () => quitDialog.showModal())
document.querySelector('#quit-no')!.addEventListener('click', () => quitDialog.close())

let cards: Card[] = []
let open: Card[] = []
let human: Color = 'blue'
let computer: Color = 'orange'
let current: Color = 'blue'
const score: Record<Color, number> = { blue: 0, orange: 0 }
const seen = new Set<number>() // Gedächtnis des Computers (Kartenindex)

function other(color: Color): Color {
  return color === 'blue' ? 'orange' : 'blue'
}

function randomOf<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

function shuffle<T>(list: T[]): T[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function buildBoard(themeKey: string, size: number): void {
  const theme = themes[themeKey]
  const dir = `${BASE}assets/img/${theme.folder}/`
  const faces = shuffle(theme.faces).slice(0, size / 2)
  const deck = shuffle(faces.flatMap((face, pair) => [{ face, pair }, { face, pair }]))

  // 16 Karten: 4 Spalten, 24 und 36 Karten: 6 Spalten
  board.style.setProperty('--cols', String(size === 16 ? 4 : 6))

  cards = deck.map(({ face, pair }, index) => {
    const el = document.createElement('button')
    el.type = 'button'
    el.className = 'card'
    el.innerHTML =
      '<span class="card__inner">' +
      `<img class="card__face" src="${dir}${face}" alt="">` +
      `<img class="card__back" src="${dir}${theme.back}" alt="">` +
      '</span>'

    const card: Card = { index, pair, el, matched: false }
    el.addEventListener('click', () => onCardClick(card))
    board.append(el)
    return card
  })
}

function updateScore(): void {
  scoreEls.blue.textContent = String(score.blue)
  scoreEls.orange.textContent = String(score.orange)
}

function updateTurn(): void {
  turnIcon.src = `${BASE}assets/img/code_vibes/player_code_${current}.png`
}

function remember(card: Card): void {
  if (Math.random() < MEMORY_CHANCE) {
    seen.add(card.index)
  }
}

// Karte aufdecken; bei der zweiten Karte wird nach kurzer Pause ausgewertet
function reveal(card: Card): void {
  card.el.classList.add('is-flipped')
  open.push(card)
  remember(card)

  if (open.length === 2) {
    window.setTimeout(resolve, FLIP_BACK_DELAY)
  }
}

function resolve(): void {
  const [a, b] = open
  open = []

  if (a.pair === b.pair) {
    // Treffer: Punkt, der Spieler bleibt am Zug
    for (const card of [a, b]) {
      card.matched = true
      card.el.disabled = true
      card.el.classList.add('is-matched')
    }
    score[current]++
    updateScore()

    if (cards.every((card) => card.matched)) {
      finish()
      return
    }
  } else {
    a.el.classList.remove('is-flipped')
    b.el.classList.remove('is-flipped')
    current = other(current)
    updateTurn()
  }

  if (current === computer) {
    window.setTimeout(computerTurn, COMPUTER_DELAY)
  }
}

function onCardClick(card: Card): void {
  if (current !== human || open.length === 2 || card.matched || open.includes(card)) return
  reveal(card)
}

// --- Computer ---

function findKnownPair(): [Card, Card] | null {
  const known = cards.filter((c) => !c.matched && seen.has(c.index))
  for (const a of known) {
    const b = known.find((c) => c !== a && c.pair === a.pair)
    if (b) return [a, b]
  }
  return null
}

function pickFirst(): Card {
  const pair = findKnownPair()
  if (pair) return pair[0]

  const available = cards.filter((c) => !c.matched)
  const unknown = available.filter((c) => !seen.has(c.index))
  return randomOf(unknown.length > 0 ? unknown : available)
}

function pickSecond(first: Card): Card {
  const partner = cards.find(
    (c) => c !== first && !c.matched && seen.has(c.index) && c.pair === first.pair,
  )
  if (partner) return partner

  const rest = cards.filter((c) => c !== first && !c.matched)
  const unknown = rest.filter((c) => !seen.has(c.index))
  return randomOf(unknown.length > 0 ? unknown : rest)
}

function computerTurn(): void {
  const first = pickFirst()
  reveal(first)
  window.setTimeout(() => reveal(pickSecond(first)), COMPUTER_DELAY)
}

// --- Ende ---

function finish(): void {
  const winner: Color | null =
    score.blue === score.orange ? null : score.blue > score.orange ? 'blue' : 'orange'

  turnText.textContent = winner === null ? 'Draw' : winner === human ? 'You win!' : 'Computer wins!'
  turnIcon.hidden = true
}

// --- Start ---

function init(): void {
  const settings = loadSettings()
  if (!settings || !settings.theme || !settings.player || !settings.size || !themes[settings.theme]) {
    window.location.href = BASE + 'settings.html'
    return
  }

  document.body.dataset.theme = settings.theme
  human = settings.player === 'orange' ? 'orange' : 'blue'
  computer = other(human)
  current = human // du beginnst

  buildBoard(settings.theme, settings.size)
  updateScore()
  updateTurn()
}

init()