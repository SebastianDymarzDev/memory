import './styles/settings.scss';
import { saveSettings } from './storage';

const BASE = import.meta.env.BASE_URL;

const previewImages: Record<string, string> = {
  code: 'assets/img/code_vibes/code_example.png',
  games: 'assets/img/games/games_example.png',
  projects: 'assets/img/projects/projects_example.png',
  food: 'assets/img/food/food_example.png',
};

/** Names of the radio groups on the page. */
const settingNames = ['theme', 'player', 'size', 'opponent'] as const;

type SettingName = (typeof settingNames)[number];

const previewImage = document.querySelector<HTMLImageElement>('#preview')!;
const startButton = document.querySelector<HTMLButtonElement>('#start-btn')!;

/** Bar elements that show the current choice, keyed by setting name. */
const stepElements = Object.fromEntries(
  settingNames.map((name) => [name, document.querySelector<HTMLElement>(`[data-step="${name}"]`)!]),
) as Record<SettingName, HTMLElement>;

/** Texts the bar shows while nothing is selected (taken from the HTML). */
const stepPlaceholders = Object.fromEntries(
  settingNames.map((name) => [name, stepElements[name].textContent ?? '']),
) as Record<SettingName, string>;

/** Loads all preview images into the browser cache so hovering does not flicker. */
function preload(): void {
  Object.values(previewImages).forEach((imagePath) => {
    new Image().src = BASE + imagePath;
  });
}

/**
 * Reads the text of an option for the bar.
 * @param radio - The radio button inside its label.
 * @returns The `data-short` text if present, otherwise the label text without line breaks.
 */
function getOptionText(radio: HTMLInputElement): string {
  return radio.dataset.short ?? radio.closest('label')!.textContent!.replace(/\s+/g, ' ').trim();
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

/** Saves the current selection to localStorage. */
function save(): void {
  const selectedSize = getSelected('size');
  saveSettings({
    theme: getSelected('theme')?.value ?? null,
    player: getSelected('player')?.value ?? null,
    size: selectedSize ? Number(selectedSize.value) : null,
    opponent: getSelected('opponent')?.value ?? null,
  });
}

/** Updates preview, bar texts and the start button to match the selection. */
function update(): void {
  showPreview(getSelected('theme')?.value);

  for (const settingName of settingNames) {
    const selected = getSelected(settingName);
    const stepElement = stepElements[settingName];
    stepElement.textContent = selected ? getOptionText(selected) : stepPlaceholders[settingName];
    stepElement.classList.toggle('is-done', selected !== null);
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
update();
