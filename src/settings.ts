import './styles/settings.scss'
import { loadSettings, saveSettings } from './storage'

const BASE = import.meta.env.BASE_URL

const previewImages: Record<string, string> = {
  code: 'assets/img/code_vibes/code_example.png',
  games: 'assets/img/games/games_example.png',
  projects: 'assets/img/projects/projects_example.png',
  food: 'assets/img/food/food_example.png',
}

const settingNames = ['theme', 'player', 'size'] as const

const previewImage = document.querySelector<HTMLImageElement>('#preview')!
const startButton = document.querySelector<HTMLButtonElement>('#start-btn')!

function preload(): void {
  Object.values(previewImages).forEach((imagePath) => {
    new Image().src = BASE + imagePath
  })
}

function getSelected(settingName: string): HTMLInputElement | null {
  return document.querySelector<HTMLInputElement>(`input[name="${settingName}"]:checked`)
}

function showPreview(theme: string | undefined): void {
  if (theme) {
    previewImage.src = BASE + previewImages[theme]
  }
}

function restore(): void {
  const savedSettings = loadSettings()
  if (!savedSettings) return

  for (const settingName of settingNames) {
    const value = savedSettings[settingName]
    if (value === null) continue
    const radio = document.querySelector<HTMLInputElement>(
      `input[name="${settingName}"][value="${value}"]`,
    )
    if (radio) radio.checked = true
  }
}

function save(): void {
  const selectedSize = getSelected('size')
  saveSettings({
    theme: getSelected('theme')?.value ?? null,
    player: getSelected('player')?.value ?? null,
    size: selectedSize ? Number(selectedSize.value) : null,
  })
}

function update(): void {
  showPreview(getSelected('theme')?.value)

  for (const settingName of settingNames) {
    const stepElement = document.querySelector<HTMLElement>(`[data-step="${settingName}"]`)
    stepElement?.classList.toggle('is-done', getSelected(settingName) !== null)
  }

  startButton.disabled = !settingNames.every((settingName) => getSelected(settingName) !== null)
}

document.querySelectorAll<HTMLInputElement>('input[name="theme"]').forEach((radio) => {
  const label = radio.closest('label')!
  label.addEventListener('mouseenter', () => showPreview(radio.value))
  label.addEventListener('mouseleave', () => showPreview(getSelected('theme')?.value))
})

document.addEventListener('change', () => {
  update()
  save()
})

startButton.addEventListener('click', () => {
  save()
  window.location.href = BASE + 'game.html'
})

preload()
restore()
update()
