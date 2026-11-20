# Memory

A browser-based memory card game. Find all matching pairs, play against a friend or against the computer, and pick one of four visual themes.

Built with **Vite**, **TypeScript** and **SCSS**, based on a Figma design.

## Features

- **4 themes:** Code vibes, Gaming, DA Projects and Foods. Each theme has its own colours, cards, fonts and result screens.
- **3 board sizes:** 16 cards (4 x 4), 24 cards (6 x 4) or 36 cards (6 x 6).
- **Two players:** choose blue or orange. The chosen colour starts the game.
- **Opponent:** play against another human or against the computer on three difficulty levels. The computer remembers a revealed card with a certain probability:

  | Difficulty | Memory |
  | ---------- | ------ |
  | Easy       | 30 %   |
  | Medium     | 50 %   |
  | Hard       | 70 %   |

- **Score and turn display** in the header, including a dialog to quit the game. The game is paused while the dialog is open.
- **Result screen** that slides in over the board: winner, game over (computer wins) or draw, designed for every theme.
- **Settings page** with live preview of the chosen theme and a summary bar of your selection.

## Getting started

You need [Node.js](https://nodejs.org/) and npm.

```bash
git clone https://github.com/SebastianDymarzDev/memory.git
cd memory
npm install
npm run dev
```

Then open the address shown in the terminal, usually `http://localhost:5173/memory/`.

## Scripts

| Command           | Description                                                  |
| ----------------- | ------------------------------------------------------------ |
| `npm run dev`     | Starts the development server.                               |
| `npm run build`   | Type-checks the code and creates the production build in `dist`. |
| `npm run preview` | Serves the production build locally (`http://localhost:4173/memory/`). |

## Deployment

The app is configured with the base path `/memory/` (see `vite.config.ts`). After `npm run build`, upload the **contents** of the `dist` folder into a folder called `memory` on your web server, so that the game is available at `https://your-domain/memory/`.

To host it under a different path, change `base` in `vite.config.ts` and build again.

## Project structure

```
memory/
├── index.html          Start page
├── settings.html       Settings page (theme, player, board size, opponent)
├── game.html           Game page, includes the result screen and the card template
├── public/assets/      Images and icons
└── src/
    ├── game.ts         Game logic, computer opponent
    ├── result.ts       Result screen (winner, game over, draw)
    ├── settings.ts     Settings page logic
    ├── storage.ts      Saving and loading the settings (localStorage)
    ├── themes.ts       Card images per theme
    ├── main.ts         Styles of the start page
    └── styles/         SCSS files
```

## Design

The design was created in Figma on a 1440 px wide frame. The confetti on the result screen has a separate version for wider screens.
