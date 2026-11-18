import './styles/settings.scss'
import { loadSettings, saveSettings } from './storage'

// Basis-Pfad aus vite.config.ts ("/memory/")
const BASE = import.meta.env.BASE_URL

const previews: Record<string, string> = {
  code: 'assets/img/code_vibes/code_example.png',
  games: 'assets/img/games/games_example.png',
  projects: 'assets/img/projects/projects_example.png',
  food: 'assets/img/food/food_example.png',
}

const steps = ['theme', 'player', 'size'] as const

const preview = document.querySelector<HTMLImageElement>('#preview')!
const startBtn = document.querySelector<HTMLButtonElement>('#start-btn')!

// Alle Vorschaubilder vorab laden, damit beim Hover nichts flackert
Object.values(previews).forEach((path) => {
  new Image().src = BASE + path
})

function getSelected(name: string): HTMLInputElement | null {
  return document.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)
}

function showPreview(theme: string | undefined): void {
  if (theme) {
    preview.src = BASE + previews[theme]
  }
}

// Gespeicherte Auswahl wiederherstellen
function restore(): void {
  const saved = loadSettings()
  if (!saved) return

  for (const name of steps) {
    const value = saved[name]
    if (value === null) continue
    const input = document.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`)
    if (input) input.checked = true
  }
}

function save(): void {
  const size = getSelected('size')
  saveSettings({
    theme: getSelected('theme')?.value ?? null,
    player: getSelected('player')?.value ?? null,
    size: size ? Number(size.value) : null,
  })
}

function update(): void {
  // Vorschau passend zum gewählten Thema
  showPreview(getSelected('theme')?.value)

  // Schritte in der Leiste markieren, sobald etwas gewählt ist
  for (const name of steps) {
    const step = document.querySelector<HTMLElement>(`[data-step="${name}"]`)
    step?.classList.toggle('is-done', getSelected(name) !== null)
  }

  // Start erst möglich, wenn alles gewählt ist
  startBtn.disabled = !steps.every((name) => getSelected(name) !== null)
}

// Hover: Vorschau des überfahrenen Themas zeigen, danach wieder das gewählte
document.querySelectorAll<HTMLInputElement>('input[name="theme"]').forEach((input) => {
  const label = input.closest('label')!
  label.addEventListener('mouseenter', () => showPreview(input.value))
  label.addEventListener('mouseleave', () => showPreview(getSelected('theme')?.value))
})

document.addEventListener('change', () => {
  update()
  save()
})

startBtn.addEventListener('click', () => {
  save()
  window.location.href = BASE + 'game.html'
})

restore()
update()