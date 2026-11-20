import './styles/game.scss';
import { loadSettings, saveResult } from './storage';

/** Base URL of the app (Vite `base`). */
const BASE = import.meta.env.BASE_URL;

/** Colour of a player. */
type PlayerColor = 'blue' | 'orange';

/** Settings after validation: every value is present and the theme exists. */
interface ValidSettings {
  theme: string;
  player: string;
  size: number;
}

/** A single card on the board. */
interface Card {
  /** Position in the shuffled deck. */
  index: number;
  /** Cards with the same pairId belong together. */
  pairId: number;
  button: HTMLButtonElement;
  matched: boolean;
}

/**
 * Builds the file names `<prefix>1.png` to `<prefix>18.png`.
 * @param prefix - File name prefix, e.g. "games".
 */
const numbered = (prefix: string): string[] =>
  Array.from({ length: 18 }, (_, position) => `${prefix}${position + 1}.png`);

/** Image folder, card back and card faces per theme. */
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
};

/** Time in ms until two opened cards are resolved. */
const FLIP_BACK_DELAY = 900;
/** Time in ms the computer waits before each of its moves. */
const COMPUTER_DELAY = 800;
/** Probability (0 to 1) that the computer remembers a revealed card. */
const MEMORY_CHANCE = 0.7;
/** Time in ms between the last pair and the redirect to the result page. */
const FINISH_DELAY = 1200;

const board = document.querySelector<HTMLElement>('#board')!;
const turnIcon = document.querySelector<HTMLImageElement>('#turn-icon')!;
const scoreElements: Record<PlayerColor, HTMLElement> = {
  blue: document.querySelector<HTMLElement>('#score-blue')!,
  orange: document.querySelector<HTMLElement>('#score-orange')!,
};
const quitDialog = document.querySelector<HTMLDialogElement>('#quit-dialog')!;
const keepPlayingButton = document.querySelector<HTMLElement>('#quit-no')!;
const leaveGameButton = document.querySelector<HTMLElement>('#quit-yes')!;

/** All cards of the current game. */
let cards: Card[] = [];
/** Cards currently turned over in this turn (0 to 2). */
let openCards: Card[] = [];
let humanPlayer: PlayerColor = 'blue';
let computerPlayer: PlayerColor = 'orange';
let currentPlayer: PlayerColor = 'blue';
const scores: Record<PlayerColor, number> = { blue: 0, orange: 0 };
/** Indexes of cards the computer has seen and remembers. */
const seenCardIndexes = new Set<number>();
/** Actions that wait until the quit dialog is closed. */
const pendingActions: Array<() => void> = [];
let themeKey = 'code';

/**
 * Runs an action after a delay. While the quit dialog is open, the action
 * is queued and runs once the dialog closes, so the game is effectively paused.
 * @param action - The function to run.
 * @param delayMs - Delay in milliseconds.
 */
function later(action: () => void, delayMs: number): void {
  window.setTimeout(() => (quitDialog.open ? pendingActions.push(action) : action()), delayMs);
}

/**
 * Builds the icon path of a player for the current theme.
 * @param color - Player colour.
 */
function playerIcon(color: PlayerColor): string {
  return themeKey === 'code'
    ? `${BASE}assets/img/code_vibes/player_code_${color}.png`
    : `${BASE}assets/img/icons/chess_pawn_${color}.png`;
}

/**
 * Returns the other player.
 * @param color - Player colour.
 */
function opponentOf(color: PlayerColor): PlayerColor {
  return color === 'blue' ? 'orange' : 'blue';
}

/** Picks a random element of a non-empty list. */
function randomItem<Item>(items: Item[]): Item {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Shuffles a list (Fisher-Yates) without changing the original.
 * @param items - The list to shuffle.
 * @returns A new, shuffled list.
 */
function shuffle<Item>(items: Item[]): Item[] {
  const shuffled = [...items];
  for (let position = shuffled.length - 1; position > 0; position--) {
    const swapPosition = Math.floor(Math.random() * (position + 1));
    [shuffled[position], shuffled[swapPosition]] = [shuffled[swapPosition], shuffled[position]];
  }
  return shuffled;
}

/**
 * Builds the inner HTML of a card (face and back image).
 * @param face - File name of the face image.
 */
function cardMarkup(face: string): string {
  const theme = themes[themeKey];
  const imageFolder = `${BASE}assets/img/${theme.folder}/`;
  return (
    '<span class="card__inner">' +
    `<img class="card__face" src="${imageFolder}${face}" alt="">` +
    `<img class="card__back" src="${imageFolder}${theme.back}" alt="">` +
    '</span>'
  );
}

/**
 * Creates a card with its button and click handler.
 * @param face - File name of the face image.
 * @param pairId - Identifier shared by both cards of a pair.
 * @param index - Position in the deck.
 */
function createCard(face: string, pairId: number, index: number): Card {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'card';
  button.innerHTML = cardMarkup(face);

  const card: Card = { index, pairId, button, matched: false };
  button.addEventListener('click', () => onCardClick(card));
  return card;
}

/**
 * Creates the shuffled deck and adds it to the board.
 * @param size - Number of cards (16, 24 or 36).
 */
function buildBoard(size: number): void {
  const faces = shuffle(themes[themeKey].faces).slice(0, size / 2);
  const deck = shuffle(faces.flatMap((face, pairId) => [{ face, pairId }, { face, pairId }]));

  board.style.setProperty('--columns', String(size === 16 ? 4 : 6));
  cards = deck.map(({ face, pairId }, index) => createCard(face, pairId, index));
  board.append(...cards.map((card) => card.button));
}

/** Writes both scores to the page. */
function updateScore(): void {
  scoreElements.blue.textContent = String(scores.blue);
  scoreElements.orange.textContent = String(scores.orange);
}

/** Shows whose turn it is. */
function updateTurn(): void {
  turnIcon.dataset.color = currentPlayer;
  turnIcon.src =
    themeKey === 'code'
      ? playerIcon(currentPlayer)
      : `${BASE}assets/img/icons/chess_pawn_white.png`;
}

/**
 * Lets the computer remember a revealed card, with probability MEMORY_CHANCE.
 * @param card - The revealed card.
 */
function rememberCard(card: Card): void {
  if (Math.random() < MEMORY_CHANCE) {
    seenCardIndexes.add(card.index);
  }
}

/**
 * Turns a card over; after the second card the turn is resolved.
 * @param card - The card to reveal.
 */
function revealCard(card: Card): void {
  card.button.classList.add('is-flipped');
  openCards.push(card);
  rememberCard(card);

  if (openCards.length === 2) {
    later(resolveTurn, FLIP_BACK_DELAY);
  }
}

/**
 * Locks a found pair and awards a point to the current player.
 * @param firstCard - First card of the pair.
 * @param secondCard - Second card of the pair.
 */
function markAsMatched(firstCard: Card, secondCard: Card): void {
  for (const card of [firstCard, secondCard]) {
    card.matched = true;
    card.button.disabled = true;
    card.button.classList.add('is-matched');
  }
  scores[currentPlayer]++;
  updateScore();
}

/**
 * Turns two non-matching cards back and passes the turn to the opponent.
 * @param firstCard - First opened card.
 * @param secondCard - Second opened card.
 */
function flipBack(firstCard: Card, secondCard: Card): void {
  firstCard.button.classList.remove('is-flipped');
  secondCard.button.classList.remove('is-flipped');
  currentPlayer = opponentOf(currentPlayer);
  updateTurn();
}

/** Ends the game when all cards are matched, otherwise starts the computer's turn if it is up. */
function startNextTurn(): void {
  if (cards.every((card) => card.matched)) {
    finishGame();
  } else if (currentPlayer === computerPlayer) {
    later(computerTurn, COMPUTER_DELAY);
  }
}

/** Compares the two open cards and continues with the next turn. */
function resolveTurn(): void {
  const [firstCard, secondCard] = openCards;
  openCards = [];
  if (firstCard.pairId === secondCard.pairId) {
    markAsMatched(firstCard, secondCard);
  } else {
    flipBack(firstCard, secondCard);
  }
  startNextTurn();
}

/**
 * Click handler: reveals the card if the human may play it.
 * @param card - The clicked card.
 */
function onCardClick(card: Card): void {
  if (
    currentPlayer !== humanPlayer ||
    openCards.length === 2 ||
    card.matched ||
    openCards.includes(card)
  ) {
    return;
  }
  revealCard(card);
}

/**
 * Looks for a pair of which the computer remembers both cards.
 * @returns The pair, or null if none is known.
 */
function findKnownPair(): [Card, Card] | null {
  const knownCards = cards.filter((card) => !card.matched && seenCardIndexes.has(card.index));
  for (const knownCard of knownCards) {
    const partner = knownCards.find(
      (candidate) => candidate !== knownCard && candidate.pairId === knownCard.pairId,
    );
    if (partner) return [knownCard, partner];
  }
  return null;
}

/** Chooses the computer's first card: a known pair, else an unseen card, else any card. */
function pickFirstCard(): Card {
  const knownPair = findKnownPair();
  if (knownPair) return knownPair[0];

  const availableCards = cards.filter((card) => !card.matched);
  const unseenCards = availableCards.filter((card) => !seenCardIndexes.has(card.index));
  return randomItem(unseenCards.length > 0 ? unseenCards : availableCards);
}

/**
 * Chooses the computer's second card: the remembered partner, else an unseen card, else any card.
 * @param firstCard - The card already revealed this turn.
 */
function pickSecondCard(firstCard: Card): Card {
  const partner = cards.find(
    (card) =>
      card !== firstCard &&
      !card.matched &&
      seenCardIndexes.has(card.index) &&
      card.pairId === firstCard.pairId,
  );
  if (partner) return partner;

  const remainingCards = cards.filter((card) => card !== firstCard && !card.matched);
  const unseenCards = remainingCards.filter((card) => !seenCardIndexes.has(card.index));
  return randomItem(unseenCards.length > 0 ? unseenCards : remainingCards);
}

/** Plays the computer's turn: reveals a first card, then a second one after a delay. */
function computerTurn(): void {
  const firstCard = pickFirstCard();
  revealCard(firstCard);
  later(() => revealCard(pickSecondCard(firstCard)), COMPUTER_DELAY);
}

/** Saves the result and redirects to the result page. */
function finishGame(): void {
  const winner: PlayerColor | null =
    scores.blue === scores.orange ? null : scores.blue > scores.orange ? 'blue' : 'orange';

  saveResult({ winner, human: humanPlayer, blue: scores.blue, orange: scores.orange });

  later(() => {
    window.location.href = BASE + 'result.html';
  }, FINISH_DELAY);
}

/**
 * Reads the saved settings and checks them.
 * @returns The valid settings, or null if something is missing or the theme is unknown.
 */
function readValidSettings(): ValidSettings | null {
  const settings = loadSettings();
  if (!settings || !settings.theme || !settings.player || !settings.size) return null;
  if (!themes[settings.theme]) return null;
  return { theme: settings.theme, player: settings.player, size: settings.size };
}

/** Sets the theme-specific icons next to the scores. */
function setPlayerIcons(): void {
  document.querySelectorAll<HTMLImageElement>('.game__player-icon').forEach((icon) => {
    icon.src = playerIcon(icon.dataset.color === 'orange' ? 'orange' : 'blue');
  });
}

/** Uses the longer button labels of the games theme in the quit dialog. */
function setQuitLabels(): void {
  if (themeKey !== 'games') return;
  keepPlayingButton.textContent = 'No, back to game';
  leaveGameButton.textContent = 'Yes, quit game';
}

/**
 * Applies the settings to the page and builds the board.
 * @param settings - The validated settings.
 */
function applySettings({ theme, player, size }: ValidSettings): void {
  document.body.dataset.theme = theme;
  document.body.dataset.size = String(size);
  themeKey = theme;
  humanPlayer = player === 'orange' ? 'orange' : 'blue';
  computerPlayer = opponentOf(humanPlayer);
  currentPlayer = humanPlayer;
  setPlayerIcons();
  setQuitLabels();
  buildBoard(size);
}

/** Entry point: starts the game, or redirects to the settings if they are invalid. */
function initGame(): void {
  const settings = readValidSettings();
  if (!settings) {
    window.location.href = BASE + 'settings.html';
    return;
  }
  applySettings(settings);
  updateScore();
  updateTurn();
}

document.querySelector('#exit-btn')!.addEventListener('click', () => quitDialog.showModal());
keepPlayingButton.addEventListener('click', () => quitDialog.close());
quitDialog.addEventListener('close', () => pendingActions.splice(0).forEach((action) => action()));

initGame();
