# Pixel Court

**Pixel Court** is a polished 2D browser tennis game for local LAN play, with singles, doubles, and one-player **Vs Computer** mode. One computer runs the Node server, nearby players open the host machine's LAN URL, and everyone joins with a room code.

The visual direction is original fantasy sandbox pixel art: a side-view clay tennis court built from chunky terrain tiles, grass caps, vines, torch flicker, crystal glow, parallax forest layers, animated slimes, fireflies, banners, glowing rackets, tennis-ball trails, and pixel-panel UI. The project does **not** include commercial game assets, sprites, sounds, fonts, or copied tiles.

## What is new in this version

- Renamed the project and visible game title to **Pixel Court**.
- Added an animated loading overlay with bouncing crystals, loading bar, terrain-tile floor, and connection-state text.
- Upgraded the main screen with an animated Canvas title scene, demo rally, bouncing slime spectators, glowing lobby crystals, animated menu cards, and a rune-style loading/status bar.
- Added more environmental animation during gameplay, including court dust, shimmer, torch/ambient motion, and extra lobby polish.
- Updated all GitHub documentation and repository-upload instructions.

## Features

- **Browser-based gameplay**: no client installation; players only need a modern browser.
- **Animated main screen**: animated title plaque, demo ball rally, pixel spectators, crystals, torch ambience, and menu cards.
- **Animated loading screen**: loading overlay while the browser connects to the LAN server.
- **Local LAN multiplayer**: built-in HTTP + WebSocket server, no external matchmaker.
- **Singles mode**: 2 human players.
- **Doubles mode**: 4 human players.
- **Vs Computer mode**: one human player against a CPU opponent.
- **Three AI difficulties**: Easy, Medium, and Hard.
- **Tennis-style scoring**: Love, 15, 30, 40, Deuce, Advantage, Game, and Match.
- **Authoritative server physics**: the server simulates movement, AI input, ball physics, scoring, and match state.
- **Original procedural pixel-art rendering**: all visuals are drawn with Canvas; there are no external image assets.
- **Mobile-friendly touch controls**: on-screen buttons appear on touch devices.
- **GitHub-ready project layout**: source, docs, gitignore, and MIT license included.

## Requirements

- Node.js 18 or newer
- Devices connected to the same LAN or Wi-Fi network for multiplayer
- A firewall rule that allows the chosen port, if your OS asks

## Run locally

Install nothing; this project uses only Node's built-in modules.

```bash
npm start
```

The server prints URLs like this:

```text
Pixel Court v1.2.0
Local:   http://localhost:7777
LAN:     http://192.168.1.24:7777
```

Open the **Local** URL on the host computer. Share the **LAN** URL with nearby players on the same network.

You can change the port:

```bash
node server.js --port=8080
```

or:

```bash
PORT=8080 npm start
```

## Play against the computer

1. Run `npm start`.
2. Open the local URL in a browser.
3. Enter your player name.
4. Choose **AI Easy**, **AI Medium**, or **AI Hard**.
5. Click **Ready**.
6. Click **Start Match**.

The human player takes the Moss side. The CPU takes the Amethyst side.

### AI difficulty basics

| Difficulty | Behavior |
| --- | --- |
| Easy | Slower reactions, bigger positioning errors, less reliable swings. |
| Medium | Better tracking, moderate reaction speed, more consistent returns. |
| Hard | Fast reactions, tighter positioning, more aggressive jumps and swings. |

The AI is intentionally simple and arcade-like. It predicts where the ball is likely to land, moves toward that spot, and decides whether to swing, jump, or slice based on difficulty settings.

## How to play on LAN

1. One player runs `npm start`.
2. That player opens the local URL and creates a Singles or Doubles room.
3. Other players open the LAN URL printed by the server.
4. They enter the room code, or use the copied invite link.
5. Everyone clicks **Ready**.
6. The room host clicks **Start Match**.

Singles requires exactly 2 seated human players. Doubles requires exactly 4 seated human players. Extra players become spectators in the lobby.

## Controls

| Action | Keyboard |
| --- | --- |
| Move | `A` / `D` or left / right arrows |
| Jump | `W` or up arrow |
| Aim low / slice | `S` or down arrow |
| Swing | `K`, `J`, `Space`, or `Enter` |

Touch devices get on-screen controls automatically.

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
├── server.js                    # Static file server + custom WebSocket server + rooms + AI input loop
├── package.json                 # npm scripts, metadata, Node version
├── public/
│   ├── index.html               # Browser UI shell + animated loading overlay
│   ├── styles.css               # Pixel-panel UI styling and animations
│   └── src/
│       ├── client.js            # Lobby, networking, DOM updates, loading state
│       ├── input.js             # Keyboard/touch input
│       ├── renderer.js          # Canvas pixel-art renderer + animated main screen
│       └── shared/
│           ├── ai.js            # Computer opponent input logic
│           ├── constants.js     # Shared game constants, modes, AI difficulties
│           └── physics.js       # Shared authoritative physics and tennis scoring
├── docs/
│   ├── ARCHITECTURE.md
│   ├── GITHUB_UPLOAD.md
│   └── LAN_SETUP.md
├── LICENSE
└── .gitignore
```

## Development checks

```bash
npm run check
```

This runs Node syntax checks over the server and browser modules.

## Create a GitHub repository and upload

The full upload guide is in [`docs/GITHUB_UPLOAD.md`](docs/GITHUB_UPLOAD.md). The fast command-line path is:

```bash
git init
git add .
git commit -m "Initial Pixel Court game"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pixel-court.git
git push -u origin main
```

Create the empty GitHub repository first, then replace `YOUR_USERNAME` with your GitHub username. Do not initialize the GitHub repository with a README, license, or `.gitignore`, because this project already includes those files.

## Notes on the visual style

Pixel Court is an original Canvas-rendered fantasy pixel-art tennis game. It uses chunky blocks, parallax forests, underground crystals, glowing insects, banners, vines, torches, animated slimes, and high-contrast pixel UI to evoke the feeling of classic 2D sandbox adventure games while avoiding copied commercial assets.

## License

MIT. See [LICENSE](LICENSE).
