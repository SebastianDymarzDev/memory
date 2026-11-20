import './styles/settings.scss';
import { loadSettings, saveSettings } from './storage';

const BASE = import.meta.env.BASE_URL;

const previewImages: Record<string, string> = {
  code: 'assets/img/code_vibes/code_example.png',
  games: 'assets/img/games/games_example.png',
  projects: 'assets/img/projects/projects_example.png',
  food: 'assets/img/food/food_example.png',
};

/** Names of the radio groups on the page. */
const settingNames = ['theme', 'player', 'size'] as const;

const previewImage = document.querySelector<HTMLImageElement>('#preview')!;
const startButton = document.querySelector<HTMLButtonElement>('#start-btn')!;

/** Loads all preview images into the browser cache so hovering does not flicker. */
function preload(): void {
  Object.values(previewImages).forEach((imagePath) => {
    new Image().src = BASE + imagePath;
  });
}

/**
 * Finds the checked radio button of a group.
 * @param settingName - The `name` attribute of the radio group.
 * @returns The checked input, or null if nothing is selected.
 */
function getSelected(settingName: string): HTMLInputElement | null {
  return document.querySelector<HTMLInputElement>(`input[name="${settingName}"]:checked`);
}

/**
 * Shows the preview image of a theme.
 * @param theme - Theme key; nothing happens if it is undefined.
 */
function showPreview(theme: string | undefined): void {
  if (theme) {
    previewImage.src = BASE + previewImages[theme];
  }
}

/** Checks the radio buttons according to the saved settings. */
function restore(): void {
  const savedSettings = loadSettings();
  if (!savedSettings) return;

  for (const settingName of settingNames) {
    const value = savedSettings[settingName];
    if (value === null) continue;
    const radio = document.querySelector<HTMLInputElement>(
      `input[name="${settingName}"][value="${value}"]`,
    );
    if (radio) radio.checked = true;
  }
}

/** Saves the current selection to localStorage. */
function save(): void {
  const selectedSize = getSelected('size');
  saveSettings({
    theme: getSelected('theme')?.value ?? null,
    player: getSelected('player')?.value ?? null,
    size: selectedSize ? Number(selectedSize.value) : null,
  });
}

/** Updates preview, step markers and the start button to match the selection. */
function update(): void {
  showPreview(getSelected('theme')?.value);

  for (const settingName of settingNames) {
    const stepElement = document.querySelector<HTMLElement>(`[data-step="${settingName}"]`);
    stepElement?.classList.toggle('is-done', getSelected(settingName) !== null);
  }

  startButton.disabled = !settingNames.every((settingName) => getSelected(settingName) !== null);
}

document.querySelectorAll<HTMLInputElement>('input[name="theme"]').forEach((radio) => {
  const label = radio.closest('label')!;
  label.addEventListener('mouseenter', () => showPreview(radio.value));
  label.addEventListener('mouseleave', () => showPreview(getSelected('theme')?.value));
});

document.addEventListener('change', () => {
  update();
  save();
});

startButton.addEventListener('click', () => {
  save();
  window.location.href = BASE + 'game.html';
});

preload();
restore();
update();
