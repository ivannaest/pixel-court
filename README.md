# Pixel Court

**Pixel Court** is a 2D browser tennis game for class-friendly local play. It supports LAN **Singles**, LAN **Doubles**, and one-player **Vs Computer** mode with Easy, Medium, and Hard AI.

The visual direction is original fantasy sandbox pixel art: a side-view clay court built from chunky terrain tiles, grass caps, vines, torches, crystal glow, banners, glowing rackets, pixel HUD panels, and a forest-court atmosphere. The project does **not** include commercial game assets, copied tiles, sprites, fonts, or sounds.

## What is new in v1.6.0

This version keeps the v1.5 lag fix, then fixes the blurry graphics caused by overly aggressive downscaling. The goal is **sharp menus and HUD text without bringing lag back**.

- Default graphics mode is now **Sharp Performance**.
- Sharp Performance renders the Canvas at the native 960×540 game resolution instead of the blurry reduced backing resolution.
- Static scenery is still cached, so the forest, terrain, court, banners, and net are not redrawn from scratch every frame.
- The main title, HUD title, pause menu, and match-complete screen now use a blocky Canvas pixel font drawn with rectangles instead of blurry scaled browser text.
- The stage is capped at a clean 960 px width on larger screens to avoid soft fractional stretching.
- Removed the GPU canvas transform that could soften the rendered Canvas in some browsers.
- Low Power mode remains available, but now uses a less blurry 0.8 render scale and 45 FPS gameplay target.
- Gameplay still uses the v1.5 smooth ball movement, net fix, dead-ball fix, and **Esc pause/resume** for Vs Computer matches.

## Features

- Browser-based gameplay with no client install.
- Dependency-free Node.js server using built-in modules only.
- Local LAN multiplayer with room codes and invite links.
- Singles mode for 2 human players.
- Doubles mode for 4 human players.
- Vs Computer mode for solo play.
- Three AI difficulties: Easy, Medium, Hard.
- Tennis-style scoring: Love, 15, 30, 40, Deuce, Advantage, Game, Match.
- First to 3 games, win by 2.
- Server-authoritative physics and scoring.
- Animated loading screen and animated main screen.
- Original procedural Canvas pixel-art rendering.
- Keyboard and touch controls.
- GitHub-ready structure with docs, `.gitignore`, and MIT license.

## Requirements

- Node.js 18 or newer.
- A modern browser such as Chrome, Edge, Firefox, or Safari.
- Same Wi-Fi/LAN for multiplayer.
- Firewall permission for Node.js if your computer asks.

## Run locally

From the project folder:

```bash
npm start
```

The server prints URLs like this:

```text
Pixel Court v1.6.0
Local:   http://localhost:7777
LAN:     http://192.168.1.24:7777
```

Open the **Local** URL on the host computer. Nearby players on the same network open the **LAN** URL.

You can change the port:

```bash
node server.js --port=8080
```

or:

```bash
PORT=8080 npm start
```

## Quick solo test

1. Run `npm start`.
2. Open `http://localhost:7777`.
3. Confirm **Graphics** is set to **Sharp Performance**.
4. Click **AI Easy**.
5. Click **Ready**.
6. Click **Start Match**.
7. Press **Esc** during play to pause/resume.

## How to play on LAN

1. One player runs `npm start`.
2. That player opens the local URL and creates a Singles or Doubles room.
3. Other players open the LAN URL printed by the server.
4. They enter the room code or use the copied invite link.
5. Everyone clicks **Ready**.
6. The room host clicks **Start Match**.

Singles requires exactly 2 seated human players. Doubles requires exactly 4 seated human players. Extra players become spectators in the lobby.

## Controls

| Action | Keyboard |
| --- | --- |
| Move | `A` / `D` or left / right arrows |
| Jump / lob help | `W` or up arrow |
| Aim low / slice | `S` or down arrow |
| Swing | `K`, `J`, or Space |
| Pause AI match | `Esc` |

Touch devices get on-screen controls automatically.

## Graphics and laptop performance

Pixel Court now defaults to **Sharp Performance**. This is the class-safe mode.

| Mode | Best for | What it does |
| --- | --- | --- |
| Sharp Performance | Most classroom laptops | Native 960×540 Canvas, cached world layer, crisp pixel UI text, 60 FPS active gameplay drawing, no live-match CSS animation, tiny particles/trails. |
| Low Power | Older laptops or low battery | 0.8 render scale, 45 FPS gameplay drawing, nearly no decorative live effects. |
| Fancy 60 FPS | Strong computers | Full per-frame scene animation and higher decorative effect counts. |

For class, keep everyone on **Sharp Performance** first. If one laptop still struggles, switch only that laptop to **Low Power**. Graphics mode is saved per browser.

## If the game still looks laggy

First confirm the version printed in the terminal says:

```text
Pixel Court v1.6.0
```

Then confirm the browser menu says **Sharp Performance**. If it still shows **Performance Lock**, **Classroom Smooth**, **Battery Saver**, or an older version, the old files are still running.

## Match rules

This is arcade tennis rather than a strict simulation:

- Points use tennis labels: Love, 15, 30, 40, Deuce, and Advantage.
- A game is won by taking at least 4 points and leading by 2.
- A match is first to 3 games, win by 2 games.
- The serving team keeps serving within a game.
- The serve alternates after each completed game.
- The ball may bounce once on a side.
- A second bounce awards the point to the other team.
- Returning into your own side, clipping the net, or sending the ball out awards the point to the other team.

## Project structure

```text
pixel-court/
├── server.js                    # Static file server + WebSocket rooms + game loop + AI pause
├── package.json                 # npm scripts and metadata
├── package-lock.json            # npm lockfile for reproducible installs
├── public/
│   ├── index.html               # Browser UI shell + loading overlay
│   ├── styles.css               # Pixel-panel UI styling and performance CSS profiles
│   └── src/
│       ├── client.js            # Lobby, networking, graphics selector, AI pause, render scheduler
│       ├── input.js             # Keyboard/touch input with form-field protection
│       ├── renderer.js          # Canvas pixel-art renderer, visual smoothing, optimized profiles
│       └── shared/
│           ├── ai.js            # Computer opponent input logic
│           ├── constants.js     # Shared game constants, modes, AI difficulty, controls
│           └── physics.js       # Authoritative movement, ball physics, net fixes, tennis scoring
├── docs/
│   ├── ARCHITECTURE.md
│   ├── GITHUB_UPLOAD.md
│   ├── LAN_SETUP.md
│   └── PERFORMANCE.md
├── LICENSE
└── .gitignore
```

## Development checks

```bash
npm run check
```

Before class, also run:

```bash
npm start
```

Then open `http://localhost:7777`, start an AI Easy match, confirm **Sharp Performance** is selected, press **Esc** to pause/resume, and make sure the game feels smooth.

## Updating GitHub

The full guide is in [`docs/GITHUB_UPLOAD.md`](docs/GITHUB_UPLOAD.md).

For an existing GitHub repository, copy the new project files into your local repo folder, then run:

```bash
git status
git add .
git commit -m "Sharpen Pixel Court graphics"
git pull --rebase origin main
git push
```

If Git says there are conflicts, resolve them, run `git add .`, then `git rebase --continue`, and finally `git push`.

## License

MIT. See [LICENSE](LICENSE).
